from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import Intersection, TrafficSignal, SignalEvent
from backend.app.schemas.schemas import SignalPriorityRequest, SignalRestoreRequest
from backend.app.algorithms.signal_priority import IntersectionController
from backend.app.services.route_optimizer import INTERSECTIONS

router = APIRouter(prefix="/api/signals", tags=["Traffic Signals"])

# In-memory shared state controllers for deterministic real-time signal control
CONTROLLERS: Dict[int, IntersectionController] = {}

def get_intersection_controllers() -> Dict[int, IntersectionController]:
    global CONTROLLERS
    if not CONTROLLERS:
        for item in INTERSECTIONS:
            c = IntersectionController(
                intersection_id=item["id"],
                name=item["name"],
                lat=item["latitude"],
                lon=item["longitude"],
                min_green=4.0,
                yellow_duration=3.0,
                all_red_duration=2.0,
            )
            CONTROLLERS[item["id"]] = c
    return CONTROLLERS

@router.get("")
def list_signals():
    controllers = get_intersection_controllers()
    # Tick controllers to update time-dependent transitions
    for c in controllers.values():
        c.tick()
    return [c.get_status() for c in controllers.values()]

@router.get("/{intersection_id}")
def get_signal(intersection_id: int):
    controllers = get_intersection_controllers()
    c = controllers.get(intersection_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intersection not found")
    c.tick()
    return c.get_status()

@router.post("/{intersection_id}/priority")
def request_priority(
    intersection_id: int,
    req: SignalPriorityRequest,
    db: Session = Depends(get_db)
):
    controllers = get_intersection_controllers()
    c = controllers.get(intersection_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intersection not found")

    prev_state = c.phase_state.value
    success, msg = c.request_priority(
        emergency_request_id=req.emergency_request_id or 1,
        vehicle_id=req.vehicle_id or "AMB-001",
        direction=req.approaching_direction,
        eta_seconds=req.estimated_arrival_sec or 15.0
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)

    # Log signal event to database
    event = SignalEvent(
        intersection_id=intersection_id,
        emergency_request_id=req.emergency_request_id,
        previous_state=prev_state,
        new_state=c.phase_state.value
    )
    db.add(event)
    db.commit()

    return {"success": True, "message": msg, "intersection": c.get_status()}

@router.post("/{intersection_id}/restore")
def restore_signal(
    intersection_id: int,
    req: SignalRestoreRequest,
    db: Session = Depends(get_db)
):
    controllers = get_intersection_controllers()
    c = controllers.get(intersection_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intersection not found")

    prev_state = c.phase_state.value
    c.restore_normal_cycle(reason=req.reason or "Manual restore")

    event = SignalEvent(
        intersection_id=intersection_id,
        emergency_request_id=None,
        previous_state=prev_state,
        new_state=c.phase_state.value
    )
    db.add(event)
    db.commit()

    return {"success": True, "message": f"Normal cycle restored for intersection {intersection_id}", "intersection": c.get_status()}
