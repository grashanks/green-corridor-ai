# GreenCorridor AI - REST & WebSocket API Documentation

FastAPI provides interactive Swagger documentation automatically at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@greencorridor.ai",
      "role": "Traffic Administrator"
    }
  }
  ```

### `POST /api/auth/register`
- Registers a new operator or administrator account with hashed password.

### `GET /api/auth/me`
- Returns profile of current authenticated user.

---

## 2. Emergency Vehicles (`/api/vehicles`)

### `GET /api/vehicles`
- Returns all registered emergency response units.

### `POST /api/vehicles`
- Registers new vehicle with duplicate vehicle ID and license plate prevention.
  ```json
  {
    "vehicle_id": "AMB-004",
    "vehicle_type": "Ambulance",
    "registration_number": "KA-01-EQ-1004",
    "operator_name": "Officer Priya Nair",
    "status": "Available"
  }
  ```

---

## 3. Emergency Requests (`/api/emergencies`)

### `POST /api/emergencies`
- Creates an active emergency request and dispatches a green corridor.
  ```json
  {
    "vehicle_id": "AMB-001",
    "source_latitude": 12.9700,
    "source_longitude": 77.5900,
    "destination_latitude": 12.9840,
    "destination_longitude": 77.6180,
    "priority": "Critical"
  }
  ```

---

## 4. Routing (`/api/routes`)

### `POST /api/routes/calculate`
- Calculates optimal emergency route via OSRM with simulated road-closure/detour option:
  ```json
  {
    "source_latitude": 12.9700,
    "source_longitude": 77.5900,
    "destination_latitude": 12.9840,
    "destination_longitude": 77.6180,
    "simulate_obstruction": false
  }
  ```

---

## 5. Traffic Signals (`/api/signals`)

### `GET /api/signals`
- Returns status of all 4 corridor intersections and signal states for all 4 approaches (North, South, East, West).

### `POST /api/signals/{id}/priority`
- Enforces safe state machine priority transition:
  ```json
  {
    "approaching_direction": "West",
    "vehicle_id": "AMB-001",
    "estimated_arrival_sec": 14.5
  }
  ```

---

## 6. Simulation & Demo (`/api/simulation`)

### `POST /api/simulation/demo/start`
- **1-Click Master Hackathon Demo Endpoint**: Initializes AMB-001, calculates route, begins GPS simulation, arms priority controllers, and starts the full live green corridor progression.

### `POST /api/simulation/demo/reset`
- Cleans and resets simulation, vehicle status, and signal cycles.

### `POST /api/simulation/benchmark`
- Runs empirical comparison between Normal and Priority scenarios.

---

## 7. WebSockets

- `ws://localhost:8000/api/tracking/ws`: Live GPS telemetry updates (`latitude`, `longitude`, `speed`, `heading`, `eta_seconds`, `next_intersection`, `progress_pct`).
- `ws://localhost:8000/api/alerts/ws`: Real-time emergency events, priority activations, and completed trip notifications.
