import os
import shutil
from tempfile import NamedTemporaryFile
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import EmergencyVehicle, EmergencyRequest, EmergencyAlert
from ai.video_processor import VideoProcessor
from ai.model_config import REQUIRE_OPERATOR_CONFIRMATION, SAFETY_NOTICE

router = APIRouter(prefix="/api/ai", tags=["AI Vehicle Detection"])
processor = VideoProcessor()

@router.post("/detect")
async def detect_vehicles(
    file: UploadFile = File(None)
):
    """
    Accepts uploaded video/image file or runs demo detection on synthetic roadway frame.
    Returns vehicle counts, bounding boxes, emergency detection status, and annotated image preview.
    """
    temp_path = None
    try:
        if file and file.filename:
            suffix = os.path.splitext(file.filename)[1] or ".jpg"
            with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                temp_path = tmp.name
        else:
            # Generate a temporary synthetic test frame
            temp_path = "demo_traffic_frame.jpg"

        result = processor.process_image_or_frame(temp_path)
        result["safety_notice"] = SAFETY_NOTICE
        return result
    finally:
        if temp_path and os.path.exists(temp_path) and temp_path != "demo_traffic_frame.jpg":
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.post("/confirm-emergency")
def confirm_emergency_vehicle(
    vehicle_id: str = Form(...),
    vehicle_type: str = Form("Ambulance"),
    operator_name: str = Form("AI Vision Dispatch"),
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop operator confirmation:
    Converts an AI detection candidate into a confirmed active emergency vehicle.
    """
    vehicle = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        vehicle = EmergencyVehicle(
            vehicle_id=vehicle_id.strip().upper(),
            vehicle_type=vehicle_type,
            registration_number=f"KA-01-AI-{vehicle_id[-3:]}",
            operator_name=operator_name,
            status="Active"
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
    else:
        vehicle.status = "Active"
        db.commit()

    alert = EmergencyAlert(
        alert_type="AI_EMERGENCY_CONFIRMED",
        message=f"Operator confirmed AI vision detection of {vehicle.vehicle_id} ({vehicle.vehicle_type}). Ready for priority corridor dispatch."
    )
    db.add(alert)
    db.commit()

    return {
        "success": True,
        "message": f"Emergency vehicle {vehicle.vehicle_id} confirmed and registered by operator.",
        "vehicle": {
            "vehicle_id": vehicle.vehicle_id,
            "vehicle_type": vehicle.vehicle_type,
            "status": vehicle.status
        }
    }
