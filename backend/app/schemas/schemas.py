from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "Traffic Administrator"

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Emergency Vehicle schemas
class EmergencyVehicleCreate(BaseModel):
    vehicle_id: str
    vehicle_type: str
    registration_number: str
    operator_name: str
    status: Optional[str] = "Available"

class EmergencyVehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    registration_number: Optional[str] = None
    operator_name: Optional[str] = None
    status: Optional[str] = None

class EmergencyVehicleOut(BaseModel):
    id: int
    vehicle_id: str
    vehicle_type: str
    registration_number: str
    operator_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Emergency Request schemas
class EmergencyRequestCreate(BaseModel):
    vehicle_id: str
    source_latitude: float
    source_longitude: float
    destination_latitude: float
    destination_longitude: float
    priority: str = "Critical"

class EmergencyRequestStatusUpdate(BaseModel):
    request_status: str

class EmergencyRequestOut(BaseModel):
    id: int
    vehicle_id: str
    source_latitude: float
    source_longitude: float
    destination_latitude: float
    destination_longitude: float
    priority: str
    request_status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# GPS and Tracking schemas
class GPSLocationCreate(BaseModel):
    vehicle_id: str
    latitude: float
    longitude: float
    speed: Optional[float] = 0.0
    heading: Optional[float] = 0.0

class GPSLocationOut(BaseModel):
    id: int
    vehicle_id: str
    latitude: float
    longitude: float
    speed: float
    heading: float
    recorded_at: datetime

    class Config:
        from_attributes = True

# Route schemas
class RouteCalculateRequest(BaseModel):
    source_latitude: float
    source_longitude: float
    destination_latitude: float
    destination_longitude: float
    emergency_request_id: Optional[int] = None
    simulate_obstruction: Optional[bool] = False

class RouteOut(BaseModel):
    id: Optional[int] = None
    emergency_request_id: Optional[int] = None
    distance: float  # meters
    estimated_duration: float  # seconds
    route_geometry: List[List[float]]  # list of [lat, lon]
    upcoming_intersections: Optional[List[Dict[str, Any]]] = []
    created_at: Optional[datetime] = None

# Signal schemas
class TrafficSignalOut(BaseModel):
    id: int
    intersection_id: int
    direction: str
    current_state: str
    normal_green_duration: int
    priority_enabled: bool

    class Config:
        from_attributes = True

class IntersectionOut(BaseModel):
    id: int
    intersection_name: str
    latitude: float
    longitude: float
    signal_status: str
    current_phase: str
    signals: List[TrafficSignalOut] = []

    class Config:
        from_attributes = True

class SignalPriorityRequest(BaseModel):
    emergency_request_id: Optional[int] = None
    approaching_direction: str  # 'North', 'South', 'East', 'West'
    vehicle_id: Optional[str] = None
    distance_to_stopline: Optional[float] = None
    estimated_arrival_sec: Optional[float] = None

class SignalRestoreRequest(BaseModel):
    intersection_id: int
    reason: Optional[str] = "Emergency vehicle cleared"

# Alerts
class EmergencyAlertOut(BaseModel):
    id: int
    emergency_request_id: Optional[int]
    alert_type: str
    message: str
    created_at: datetime
    read_status: bool

    class Config:
        from_attributes = True

# Simulation
class SimulationControl(BaseModel):
    action: str  # 'start', 'pause', 'resume', 'stop', 'reset'
    emergency_request_id: Optional[int] = None
    speed_multiplier: Optional[float] = 1.0
    priority_enabled: Optional[bool] = True

class SimulationStatus(BaseModel):
    is_running: bool
    is_paused: bool
    step: int
    speed_multiplier: float
    priority_enabled: bool
    active_vehicles: List[Dict[str, Any]] = []
    intersections: List[Dict[str, Any]] = []
    mode: str  # 'SUMO' or 'Python-Native Fallback'

# Analytics
class TripAnalyticsOut(BaseModel):
    id: int
    emergency_request_id: int
    normal_travel_time: float
    priority_travel_time: float
    distance: float
    saved_time: float
    created_at: datetime

    class Config:
        from_attributes = True

class AnalyticsOverview(BaseModel):
    total_vehicles: int
    active_emergencies: int
    completed_trips: int
    active_corridors: int
    avg_response_time_seconds: float
    avg_time_saved_seconds: float
    avg_time_saved_percent: float
    controlled_intersections: int
    recent_alerts_count: int

# AI Detection schemas
class AIDetectionResult(BaseModel):
    vehicle_type: str
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]
    is_emergency: bool

class VideoDetectionSummary(BaseModel):
    total_frames: int
    processed_frames: int
    counts: Dict[str, int]
    emergency_vehicles_detected: List[AIDetectionResult]
    model_name: str
    requires_operator_confirmation: bool
