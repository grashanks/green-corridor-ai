from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import EmergencyRequest, EmergencyVehicle, EmergencyAlert
from backend.app.schemas.schemas import (
    EmergencyRequestCreate,
    EmergencyRequestStatusUpdate,
    EmergencyRequestOut,
)

router = APIRouter(prefix="/api/emergencies", tags=["Emergency Requests"])

@router.get("", response_model=List[EmergencyRequestOut])
def get_all_emergencies(db: Session = Depends(get_db)):
    return db.query(EmergencyRequest).order_by(EmergencyRequest.created_at.desc()).all()

@router.post("", response_model=EmergencyRequestOut, status_code=status.HTTP_201_CREATED)
def create_emergency(req_in: EmergencyRequestCreate, db: Session = Depends(get_db)):
    # Verify vehicle exists
    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == req_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{req_in.vehicle_id}' is not registered."
        )

    # Prevent duplicate active emergency request for same vehicle
    active_req = db.query(EmergencyRequest).filter(
        EmergencyRequest.vehicle_id == req_in.vehicle_id,
        EmergencyRequest.request_status.in_(["Pending", "Approved", "In Transit"])
    ).first()
    if active_req:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle '{req_in.vehicle_id}' already has an active emergency request (ID: {active_req.id})."
        )

    emergency = EmergencyRequest(
        vehicle_id=req_in.vehicle_id,
        source_latitude=req_in.source_latitude,
        source_longitude=req_in.source_longitude,
        destination_latitude=req_in.destination_latitude,
        destination_longitude=req_in.destination_longitude,
        priority=req_in.priority,
        request_status="Approved",  # Auto-approved for fast dispatch
    )
    vehicle.status = "Active"
    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    # Add alert notification
    alert = EmergencyAlert(
        emergency_request_id=emergency.id,
        alert_type="NEW_EMERGENCY",
        message=f"Critical Emergency Request created for {vehicle.vehicle_id} ({vehicle.vehicle_type}). Green corridor ready."
    )
    db.add(alert)
    db.commit()

    return emergency

@router.get("/{emergency_id}", response_model=EmergencyRequestOut)
def get_emergency(emergency_id: int, db: Session = Depends(get_db)):
    em = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency_id).first()
    if not em:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency request not found")
    return em

@router.put("/{emergency_id}/status", response_model=EmergencyRequestOut)
def update_emergency_status(emergency_id: int, status_update: EmergencyRequestStatusUpdate, db: Session = Depends(get_db)):
    em = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency_id).first()
    if not em:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency request not found")

    new_st = status_update.request_status
    em.request_status = new_st
    if new_st in ["Completed", "Cancelled"]:
        em.completed_at = datetime.utcnow()
        if em.vehicle:
            em.vehicle.status = "Available"

    db.commit()
    db.refresh(em)
    return em

@router.post("/{emergency_id}/cancel", response_model=EmergencyRequestOut)
def cancel_emergency(emergency_id: int, db: Session = Depends(get_db)):
    em = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency_id).first()
    if not em:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency request not found")

    em.request_status = "Cancelled"
    em.completed_at = datetime.utcnow()
    if em.vehicle:
        em.vehicle.status = "Available"

    alert = EmergencyAlert(
        emergency_request_id=em.id,
        alert_type="EMERGENCY_CANCELLED",
        message=f"Emergency request #{em.id} for vehicle {em.vehicle_id} was cancelled by operator."
    )
    db.add(alert)
    db.commit()
    db.refresh(em)
    return em
