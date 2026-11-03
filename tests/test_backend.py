import os
os.environ["DISABLE_SQLALCHEMY_C_EXTENSIONS"] = "1"
os.environ["DATABASE_URL"] = "sqlite:///./test_greencorridor.db"

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, seed_database
from backend.app.database.database import engine, Base, SessionLocal
from backend.app.models.models import EmergencyVehicle, EmergencyRequest
from backend.app.algorithms.signal_priority import IntersectionController, SignalState, PhaseState
from backend.app.services.route_optimizer import RouteOptimizer
from backend.app.services.gps_simulator import GPSSimulator

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Cleanup test db
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_greencorridor.db"):
        try:
            os.remove("./test_greencorridor.db")
        except Exception:
            pass

def test_auth_login_success():
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Traffic Administrator"

def test_auth_login_invalid():
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert resp.status_code == 401

def test_get_vehicles():
    resp = client.get("/api/vehicles")
    assert resp.status_code == 200
    vehicles = resp.json()
    assert len(vehicles) >= 1
    assert any(v["vehicle_id"] == "AMB-001" for v in vehicles)

def test_duplicate_vehicle_prevention():
    resp = client.post("/api/vehicles", json={
        "vehicle_id": "AMB-001",
        "vehicle_type": "Ambulance",
        "registration_number": "KA-01-EQ-9901",
        "operator_name": "Duplicate Tester"
    })
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]

def test_register_new_vehicle():
    resp = client.post("/api/vehicles", json={
        "vehicle_id": "AMB-TEST-99",
        "vehicle_type": "Ambulance",
        "registration_number": "KA-01-TEST-99",
        "operator_name": "Test Driver",
        "status": "Available"
    })
    assert resp.status_code == 201
    assert resp.json()["vehicle_id"] == "AMB-TEST-99"

def test_route_calculation_and_intersections():
    optimizer = RouteOptimizer()
    route = optimizer.get_route(
        src_lat=12.9700,
        src_lon=77.5900,
        dst_lat=12.9840,
        dst_lon=77.6180,
        simulate_obstruction=False
    )
    assert route["distance"] > 1000
    assert len(route["route_geometry"]) > 10
    assert len(route["upcoming_intersections"]) == 4

def test_route_obstruction_detour():
    optimizer = RouteOptimizer()
    normal_route = optimizer.get_route(12.9700, 77.5900, 12.9840, 77.6180, simulate_obstruction=False)
    detour_route = optimizer.get_route(12.9700, 77.5900, 12.9840, 77.6180, simulate_obstruction=True)
    assert detour_route["obstruction_bypassed"] is True
    # Detour path geometry should differ from direct route
    assert detour_route["route_geometry"] != normal_route["route_geometry"]

def test_signal_priority_state_machine_safety():
    """Validates deterministic safety state transitions: min green, yellow, all-red, priority hold."""
    controller = IntersectionController(
        intersection_id=1,
        name="Test Int",
        lat=12.97,
        lon=77.59,
        min_green=2.0,
        yellow_duration=1.0,
        all_red_duration=1.0
    )
    # When requesting priority for Westbound approach while EW is red
    success, msg = controller.request_priority(
        emergency_request_id=10,
        vehicle_id="AMB-001",
        direction="West"
    )
    assert success is True
    assert controller.phase_state == PhaseState.YELLOW_CLEARANCE

    # Tick past yellow duration -> should transition to ALL_RED_CLEARANCE
    import time
    future_time = time.time() + 1.2
    controller.tick(current_time=future_time)
    assert controller.phase_state == PhaseState.ALL_RED_CLEARANCE

    # Tick past all-red duration -> should safely transition to PRIORITY_HOLD with GREEN
    future_time += 1.2
    controller.tick(current_time=future_time)
    assert controller.phase_state == PhaseState.PRIORITY_HOLD
    assert controller.signals["West"] == SignalState.PRIORITY_ACTIVE

    # Release priority -> should go to POST_PRIORITY_CLEARANCE
    rel_ok, rel_msg = controller.release_priority()
    assert rel_ok is True
    assert controller.phase_state == PhaseState.POST_PRIORITY_CLEARANCE

def test_signal_conflict_prevention():
    """Ensure two different emergency vehicles cannot obtain conflicting priorities simultaneously."""
    controller = IntersectionController(1, "Test Int", 12.97, 77.59)
    controller.request_priority(emergency_request_id=1, vehicle_id="AMB-001", direction="West")

    # Second vehicle requests conflicting priority
    success, msg = controller.request_priority(emergency_request_id=2, vehicle_id="AMB-002", direction="North")
    assert success is False
    assert "Conflict detected" in msg

def test_hackathon_demo_start_and_reset():
    # Trigger Demo Start
    resp = client.post("/api/simulation/demo/start")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["vehicle_id"] == "AMB-001"
    assert "route" in data

    # Verify simulation status
    stat_resp = client.get("/api/simulation/status")
    assert stat_resp.status_code == 200
    assert stat_resp.json()["simulator_running"] is True

    # Trigger Demo Reset
    reset_resp = client.post("/api/simulation/demo/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["success"] is True

def test_analytics_performance():
    resp = client.get("/api/analytics/performance")
    assert resp.status_code == 200
    data = resp.json()
    assert "normal_scenario" in data
    assert "priority_scenario" in data
    assert data["time_saved_sec"] > 0
    assert data["percentage_reduction"] > 0

def test_ai_detection_endpoint():
    resp = client.post("/api/ai/detect")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_detected"] >= 1
    assert data["emergency_detected"] is True
    assert "annotated_frame_base64" in data
