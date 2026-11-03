from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import EmergencyVehicle
from backend.app.schemas.schemas import (
    EmergencyVehicleCreate,
    EmergencyVehicleUpdate,
    EmergencyVehicleOut,
)

router = APIRouter(prefix="/api/vehicles", tags=["Emergency Vehicles"])

@router.get("", response_model=List[EmergencyVehicleOut])
def get_all_vehicles(db: Session = Depends(get_db)):
    return db.query(EmergencyVehicle).all()

@router.post("", response_model=EmergencyVehicleOut, status_code=status.HTTP_201_CREATED)
def register_vehicle(v_in: EmergencyVehicleCreate, db: Session = Depends(get_db)):
    # Validate duplicate vehicle ID
    existing_id = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == v_in.vehicle_id).first()
    if existing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with ID '{v_in.vehicle_id}' already exists."
        )

    # Validate duplicate registration number
    existing_reg = db.query(EmergencyVehicle).filter(EmergencyVehicle.registration_number == v_in.registration_number).first()
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration number '{v_in.registration_number}' is already registered."
        )

    vehicle = EmergencyVehicle(
        vehicle_id=v_in.vehicle_id.strip().upper(),
        vehicle_type=v_in.vehicle_type,
        registration_number=v_in.registration_number.strip().upper(),
        operator_name=v_in.operator_name,
        status=v_in.status or "Available",
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/{vehicle_id}", response_model=EmergencyVehicleOut)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle

@router.put("/{vehicle_id}", response_model=EmergencyVehicleOut)
def update_vehicle(vehicle_id: str, v_update: EmergencyVehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if v_update.vehicle_type is not None:
        vehicle.vehicle_type = v_update.vehicle_type
    if v_update.operator_name is not None:
        vehicle.operator_name = v_update.operator_name
    if v_update.status is not None:
        vehicle.status = v_update.status
    if v_update.registration_number is not None:
        vehicle.registration_number = v_update.registration_number

    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return None
