import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database.database import engine, Base
from backend.app.models.models import (
    User, EmergencyVehicle, EmergencyRequest, GPSLocation,
    Route, Intersection, TrafficSignal, SignalEvent, EmergencyAlert, TripAnalytics
)

def init_db():
    print("Initializing SQLite database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
