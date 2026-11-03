import json
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import EmergencyAlert
from backend.app.schemas.schemas import EmergencyAlertOut

router = APIRouter(prefix="/api/alerts", tags=["Emergency Alerts & Notifications"])

class NotificationManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, alert_dict: Dict[str, Any]):
        msg_str = json.dumps(alert_dict)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(msg_str)
            except Exception:
                self.disconnect(connection)

notify_manager = NotificationManager()

@router.get("", response_model=List[EmergencyAlertOut])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(EmergencyAlert).order_by(EmergencyAlert.created_at.desc()).limit(50).all()

@router.put("/{alert_id}/read", response_model=EmergencyAlertOut)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.read_status = True
    db.commit()
    db.refresh(alert)
    return alert

@router.websocket("/ws")
async def websocket_notifications(websocket: WebSocket):
    await notify_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notify_manager.disconnect(websocket)
