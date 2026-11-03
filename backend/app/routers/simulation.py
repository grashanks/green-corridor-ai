import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import EmergencyVehicle, EmergencyRequest, Route, EmergencyAlert, TripAnalytics
from backend.app.schemas.schemas import SimulationControl, SimulationStatus
from backend.app.simulation.engine import TrafficSimulationEngine
from backend.app.routers.tracking import SIMULATOR, manager as tracking_ws_manager
from backend.app.routers.signals import get_intersection_controllers
from backend.app.services.route_optimizer import RouteOptimizer, INTERSECTIONS
from backend.app.routers.alerts import notify_manager

router = APIRouter(prefix="/api/simulation", tags=["Simulation Control"])
SIM_ENGINE = TrafficSimulationEngine()
optimizer = RouteOptimizer()

# Wire GPSSimulator event callbacks to persist alerts and broadcast via WebSockets
async def on_simulator_event(event_type: str, data: dict):
    if event_type == "PRIORITY_REQUESTED":
        await notify_manager.broadcast({
            "type": "ALERT",
            "alert_type": "PRIORITY_REQUEST",
            "message": f"PRIORITY REQUESTED: Vehicle {data['vehicle_id']} approaching {data['intersection_name']} (ETA: {data['eta_sec']}s). Clearance sequence activated.",
        })
    elif event_type == "INTERSECTION_CLEARED":
        await notify_manager.broadcast({
            "type": "ALERT",
            "alert_type": "SIGNAL_CLEARED",
            "message": f"INTERSECTION CLEARED: {data['vehicle_id']} passed {data['intersection_name']}. Normal traffic signal timing safely restoring.",
        })
    elif event_type == "TRIP_COMPLETED":
        await notify_manager.broadcast({
            "type": "ALERT",
            "alert_type": "TRIP_COMPLETE",
            "message": f"GOAL REACHED! Vehicle {data['vehicle_id']} arrived at Apollo Hospital! Saved {data['time_saved_sec']}s ({data['saved_percent']}% reduction) via GreenCorridor AI.",
            "data": data,
        })

SIMULATOR.register_event_callback(on_simulator_event)

@router.get("/status")
def get_simulation_status():
    status_data = SIM_ENGINE.get_status()
    status_data["simulator_running"] = SIMULATOR.is_running
    status_data["active_vehicles_count"] = len(SIMULATOR.vehicles)
    return status_data

@router.post("/start")
def start_simulation(control: SimulationControl):
    SIM_ENGINE.start(priority_enabled=control.priority_enabled if control.priority_enabled is not None else True)
    if control.speed_multiplier:
        SIMULATOR.set_speed_multiplier(control.speed_multiplier)
    return {"message": "Simulation started", "status": SIM_ENGINE.get_status()}

@router.post("/pause")
def pause_simulation():
    SIM_ENGINE.pause()
    SIMULATOR.pause()
    return {"message": "Simulation paused"}

@router.post("/resume")
def resume_simulation():
    SIM_ENGINE.resume()
    SIMULATOR.resume()
    return {"message": "Simulation resumed"}

@router.post("/stop")
def stop_simulation():
    SIM_ENGINE.stop()
    SIMULATOR.reset_all()
    # Restore all intersection signals to normal
    controllers = get_intersection_controllers()
    for c in controllers.values():
        c.restore_normal_cycle()
    return {"message": "Simulation stopped"}

@router.post("/benchmark")
def run_benchmark():
    results = SIM_ENGINE.run_comparative_benchmark()
    return results

@router.post("/demo/start")
async def start_hackathon_demo(db: Session = Depends(get_db)):
    """
    1-Click Master Hackathon Demo:
    Initializes AMB-001, calculates 4-intersection corridor route, starts GPS movement,
    arms safety signal controllers, and begins the live priority demonstration.
    """
    # 1. Ensure AMB-001 exists
    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == "AMB-001").first()
    if not vehicle:
        vehicle = EmergencyVehicle(
            vehicle_id="AMB-001",
            vehicle_type="Ambulance",
            registration_number="KA-01-EQ-9901",
            operator_name="Officer Rajesh Kumar",
            status="Active"
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
    else:
        vehicle.status = "Active"
        db.commit()

    # 2. Source (West Gate) & Destination (Apollo Hospital)
    src_lat, src_lon = 12.9700, 77.5900
    dst_lat, dst_lon = 12.9840, 77.6180

    # 3. Create or reuse active emergency request
    emergency = db.query(EmergencyRequest).filter(
        EmergencyRequest.vehicle_id == "AMB-001",
        EmergencyRequest.request_status.in_(["Pending", "Approved", "In Transit"])
    ).first()

    if not emergency:
        emergency = EmergencyRequest(
            vehicle_id="AMB-001",
            source_latitude=src_lat,
            source_longitude=src_lon,
            destination_latitude=dst_lat,
            destination_longitude=dst_lon,
            priority="Critical",
            request_status="In Transit"
        )
        db.add(emergency)
        db.commit()
        db.refresh(emergency)
    else:
        emergency.request_status = "In Transit"
        db.commit()

    # 4. Calculate route through all 4 intersections
    route_calc = optimizer.get_route(src_lat, src_lon, dst_lat, dst_lon)
    geom_str = json.dumps(route_calc["route_geometry"])

    route_db = db.query(Route).filter(Route.emergency_request_id == emergency.id).first()
    if not route_db:
        route_db = Route(
            emergency_request_id=emergency.id,
            distance=route_calc["distance"],
            estimated_duration=route_calc["estimated_duration"],
            route_geometry=geom_str
        )
        db.add(route_db)
    else:
        route_db.route_geometry = geom_str
        route_db.distance = route_calc["distance"]
        route_db.estimated_duration = route_calc["estimated_duration"]
    db.commit()

    # 5. Reset and arm controllers
    controllers = get_intersection_controllers()
    for c in controllers.values():
        c.restore_normal_cycle()

    # 6. Start GPS virtual vehicle simulation
    SIM_ENGINE.start(priority_enabled=True)
    SIMULATOR.reset_all()
    SIMULATOR.set_speed_multiplier(2.0)  # fast-paced smooth demo speed
    SIMULATOR.start_vehicle(
        vehicle_id="AMB-001",
        emergency_request_id=emergency.id,
        route_geometry=route_calc["route_geometry"],
        speed_kmh=60.0
    )

    # 7. Broadcast DEMO_STARTED alert
    alert = EmergencyAlert(
        emergency_request_id=emergency.id,
        alert_type="DEMO_STARTED",
        message="HACKATHON DEMO STARTED: AMB-001 dispatched on Central Metro Corridor to Apollo Hospital."
    )
    db.add(alert)
    db.commit()

    await notify_manager.broadcast({
        "type": "ALERT",
        "alert_type": "DEMO_STARTED",
        "message": "HACKATHON DEMO ACTIVE: Virtual ambulance dispatched along the 4-intersection green corridor.",
        "emergency_id": emergency.id,
        "vehicle_id": "AMB-001",
    })

    return {
        "success": True,
        "message": "Hackathon demo started successfully",
        "emergency_id": emergency.id,
        "vehicle_id": "AMB-001",
        "route": route_calc,
        "intersections": [c.get_status() for c in controllers.values()]
    }

@router.post("/demo/reset")
def reset_hackathon_demo(db: Session = Depends(get_db)):
    """Resets demo back to initial clean state."""
    SIM_ENGINE.stop()
    SIMULATOR.reset_all()

    controllers = get_intersection_controllers()
    for c in controllers.values():
        c.restore_normal_cycle("Demo Reset")

    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == "AMB-001").first()
    if vehicle:
        vehicle.status = "Available"

    # Mark active emergencies as Completed or Cancelled
    active_rems = db.query(EmergencyRequest).filter(
        EmergencyRequest.vehicle_id == "AMB-001",
        EmergencyRequest.request_status.in_(["Pending", "Approved", "In Transit"])
    ).all()
    for r in active_rems:
        r.request_status = "Cancelled"

    db.commit()
    return {"success": True, "message": "Demo state has been completely reset."}
