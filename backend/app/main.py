import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.database.database import engine, Base, SessionLocal
from backend.app.models.models import User, EmergencyVehicle, Intersection, TrafficSignal
from backend.app.utils.security import get_password_hash
from backend.app.services.route_optimizer import INTERSECTIONS
from backend.app.routers.tracking import simulation_tick_loop
from backend.app.routers import (
    auth_router,
    vehicles_router,
    emergencies_router,
    routes_router,
    signals_router,
    tracking_router,
    alerts_router,
    simulation_router,
    analytics_router,
    ai_router,
)

def seed_database():
    """Seeds initial demo users, vehicles, and 4 corridor intersections if not present."""
    db = SessionLocal()
    try:
        # 1. Demo Users
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin = User(
                username="admin",
                email="admin@greencorridor.ai",
                password_hash=get_password_hash("admin123"),
                role="Traffic Administrator"
            )
            operator = User(
                username="operator",
                email="operator@greencorridor.ai",
                password_hash=get_password_hash("operator123"),
                role="Emergency Vehicle Operator"
            )
            db.add_all([admin, operator])
            db.commit()

        # 2. Demo Vehicles
        v1 = db.query(EmergencyVehicle).filter(EmergencyVehicle.vehicle_id == "AMB-001").first()
        if not v1:
            vehicles = [
                EmergencyVehicle(
                    vehicle_id="AMB-001",
                    vehicle_type="Ambulance",
                    registration_number="KA-01-EQ-9901",
                    operator_name="Officer Rajesh Kumar",
                    status="Available"
                ),
                EmergencyVehicle(
                    vehicle_id="FIRE-102",
                    vehicle_type="Fire engine",
                    registration_number="KA-04-FE-1020",
                    operator_name="Commander Suresh Rao",
                    status="Available"
                ),
                EmergencyVehicle(
                    vehicle_id="RESCUE-05",
                    vehicle_type="Rescue vehicle",
                    registration_number="KA-05-RV-5521",
                    operator_name="Capt. Ananya Sen",
                    status="Available"
                ),
            ]
            db.add_all(vehicles)
            db.commit()

        # 3. Intersections & Signals
        for item in INTERSECTIONS:
            existing_int = db.query(Intersection).filter(Intersection.id == item["id"]).first()
            if not existing_int:
                new_int = Intersection(
                    id=item["id"],
                    intersection_name=item["name"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    signal_status="Normal",
                    current_phase="North-South Green"
                )
                db.add(new_int)
                db.commit()

                # Add 4 signals for each intersection (North, South, East, West)
                directions = ["North", "South", "East", "West"]
                for d in directions:
                    sig = TrafficSignal(
                        intersection_id=item["id"],
                        direction=d,
                        current_state="GREEN" if d in ["North", "South"] else "RED",
                        normal_green_duration=30,
                        priority_enabled=True
                    )
                    db.add(sig)
                db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    Base.metadata.create_all(bind=engine)
    seed_database()

    # Launch background simulation progression loop
    loop_task = asyncio.create_task(simulation_tick_loop())
    yield
    # Shutdown
    loop_task.cancel()

app = FastAPI(
    title="GreenCorridor AI - API",
    description="AI-Powered Emergency Vehicle Priority & Green Corridor System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST Routers
app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(emergencies_router)
app.include_router(routes_router)
app.include_router(signals_router)
app.include_router(tracking_router)
app.include_router(alerts_router)
app.include_router(simulation_router)
app.include_router(analytics_router)
app.include_router(ai_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "GreenCorridor AI Emergency Priority Platform",
        "version": "1.0.0",
        "docs_url": "/docs",
    }
