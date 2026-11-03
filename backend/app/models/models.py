from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # 'Traffic Administrator' or 'Emergency Vehicle Operator'
    created_at = Column(DateTime, default=datetime.utcnow)

class EmergencyVehicle(Base):
    __tablename__ = "emergency_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g. 'AMB-001'
    vehicle_type = Column(String(50), nullable=False)  # 'Ambulance', 'Fire engine', 'Rescue vehicle'
    registration_number = Column(String(50), unique=True, nullable=False)
    operator_name = Column(String(100), nullable=False)
    status = Column(String(50), default="Available")  # 'Available', 'Active', 'Maintenance'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    emergency_requests = relationship("EmergencyRequest", back_populates="vehicle")
    gps_locations = relationship("GPSLocation", back_populates="vehicle")

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(50), ForeignKey("emergency_vehicles.vehicle_id"), nullable=False)
    source_latitude = Column(Float, nullable=False)
    source_longitude = Column(Float, nullable=False)
    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)
    priority = Column(String(20), default="Critical")  # 'Critical', 'High', 'Medium'
    request_status = Column(String(50), default="Pending")  # 'Pending', 'Approved', 'In Transit', 'Completed', 'Cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    vehicle = relationship("EmergencyVehicle", back_populates="emergency_requests")
    route = relationship("Route", back_populates="emergency_request", uselist=False)
    alerts = relationship("EmergencyAlert", back_populates="emergency_request")
    trip_analytic = relationship("TripAnalytics", back_populates="emergency_request", uselist=False)
    signal_events = relationship("SignalEvent", back_populates="emergency_request")

class GPSLocation(Base):
    __tablename__ = "gps_locations"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(50), ForeignKey("emergency_vehicles.vehicle_id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)  # km/h
    heading = Column(Float, default=0.0)  # degrees
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)

    vehicle = relationship("EmergencyVehicle", back_populates="gps_locations")

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    emergency_request_id = Column(Integer, ForeignKey("emergency_requests.id"), nullable=False, unique=True)
    distance = Column(Float, nullable=False)  # in meters
    estimated_duration = Column(Float, nullable=False)  # in seconds
    route_geometry = Column(Text, nullable=False)  # JSON string of coordinates [[lat, lon], ...]
    created_at = Column(DateTime, default=datetime.utcnow)

    emergency_request = relationship("EmergencyRequest", back_populates="route")

class Intersection(Base):
    __tablename__ = "intersections"

    id = Column(Integer, primary_key=True, index=True)
    intersection_name = Column(String(100), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    signal_status = Column(String(50), default="Normal")  # 'Normal', 'Priority Active', 'Clearance'
    current_phase = Column(String(50), default="North-South Green")

    signals = relationship("TrafficSignal", back_populates="intersection", cascade="all, delete-orphan")
    events = relationship("SignalEvent", back_populates="intersection")

class TrafficSignal(Base):
    __tablename__ = "traffic_signals"

    id = Column(Integer, primary_key=True, index=True)
    intersection_id = Column(Integer, ForeignKey("intersections.id"), nullable=False)
    direction = Column(String(20), nullable=False)  # 'North', 'South', 'East', 'West'
    current_state = Column(String(30), default="RED")  # RED, YELLOW, GREEN, PRIORITY_REQUESTED, PRIORITY_ACTIVE, CLEARANCE
    normal_green_duration = Column(Integer, default=30)  # seconds
    priority_enabled = Column(Boolean, default=True)

    intersection = relationship("Intersection", back_populates="signals")

class SignalEvent(Base):
    __tablename__ = "signal_events"

    id = Column(Integer, primary_key=True, index=True)
    intersection_id = Column(Integer, ForeignKey("intersections.id"), nullable=False)
    emergency_request_id = Column(Integer, ForeignKey("emergency_requests.id"), nullable=True)
    previous_state = Column(String(50), nullable=False)
    new_state = Column(String(50), nullable=False)
    event_time = Column(DateTime, default=datetime.utcnow, index=True)

    intersection = relationship("Intersection", back_populates="events")
    emergency_request = relationship("EmergencyRequest", back_populates="signal_events")

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)
    emergency_request_id = Column(Integer, ForeignKey("emergency_requests.id"), nullable=True)
    alert_type = Column(String(50), nullable=False)  # 'PRIORITY_REQUEST', 'SIGNAL_CLEARED', 'TRIP_COMPLETE', 'WARNING'
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_status = Column(Boolean, default=False)

    emergency_request = relationship("EmergencyRequest", back_populates="alerts")

class TripAnalytics(Base):
    __tablename__ = "trip_analytics"

    id = Column(Integer, primary_key=True, index=True)
    emergency_request_id = Column(Integer, ForeignKey("emergency_requests.id"), nullable=False, unique=True)
    normal_travel_time = Column(Float, nullable=False)  # simulated seconds without priority
    priority_travel_time = Column(Float, nullable=False)  # simulated seconds with priority
    distance = Column(Float, nullable=False)  # in meters
    saved_time = Column(Float, nullable=False)  # normal - priority
    created_at = Column(DateTime, default=datetime.utcnow)

    emergency_request = relationship("EmergencyRequest", back_populates="trip_analytic")
