import asyncio
import json
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import GPSLocation, EmergencyVehicle
from backend.app.schemas.schemas import GPSLocationCreate, GPSLocationOut
from backend.app.services.gps_simulator import GPSSimulator
from backend.app.routers.signals import get_intersection_controllers

router = APIRouter(prefix="/api/tracking", tags=["GPS Tracking"])

# Shared Simulator Instance
SIMULATOR = GPSSimulator()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Background task to advance simulator and broadcast GPS updates
async def simulation_tick_loop():
    while True:
        try:
            controllers = get_intersection_controllers()
            # Tick signal safety state machines
            for c in controllers.values():
                c.tick()

            # Advance virtual GPS positions
            if SIMULATOR.is_running:
                updates = await SIMULATOR.step(controllers)
                if updates:
                    await manager.broadcast_json({
                        "type": "GPS_TELEMETRY",
                        "data": updates
                    })
        except Exception as e:
            pass
        await asyncio.sleep(0.5)

@router.get("/{vehicle_id}")
def get_vehicle_tracking(vehicle_id: str):
    status_data = SIMULATOR.get_vehicle_status(vehicle_id)
    if not status_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not currently in simulation")
    return status_data

@router.post("/update", response_model=GPSLocationOut)
def record_gps_update(loc_in: GPSLocationCreate, db: Session = Depends(get_db)):
    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == loc_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    gps_entry = GPSLocation(
        vehicle_id=loc_in.vehicle_id,
        latitude=loc_in.latitude,
        longitude=loc_in.longitude,
        speed=loc_in.speed or 0.0,
        heading=loc_in.heading or 0.0,
    )
    db.add(gps_entry)
    db.commit()
    db.refresh(gps_entry)
    return gps_entry

@router.websocket("/ws")
async def websocket_tracking_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep alive and receive any client-side commands
            data = await websocket.receive_text()
            try:
                cmd = json.loads(data)
                if cmd.get("action") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
