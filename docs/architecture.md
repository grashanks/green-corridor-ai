# GreenCorridor AI - System Architecture

## 1. High-Level System Overview

GreenCorridor AI is an end-to-end autonomous emergency vehicle traffic coordination system designed to eliminate red light delays and intersection congestion for emergency responders (ambulances, fire engines, rescue units).

```
                      +-----------------------------+
                      |   CCTV / Video Feeds (AI)   |
                      |  Ultralytics YOLO + OpenCV  |
                      +--------------+--------------+
                                     |
                                     v
+-----------------------+     +---------------+     +-----------------------+
|  Emergency Operator   | --> | FastAPI Core  | <-- |   OSRM / OpenStreet   |
|  & Traffic Admin UI   |     |    Backend    |     |   Routing Optimizer   |
+-----------------------+     +-------+-------+     +-----------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+----------------------------------+     +----------------------------------+
| Deterministic Traffic Signal     |     | Microscopic Traffic Simulation   |
| Priority Engine (State Machine)  |     | SUMO (TraCI) / Python Micro-Sim  |
| - Safety Clearance & All-Red     |     | - Arterial vs Cross Street Queues|
| - Conflict Movement Validation   |     | - Queue Dissipation Dynamics     |
+----------------------------------+     +----------------------------------+
         |                                                         |
         +----------------------------+----------------------------+
                                      |
                                      v
                      +-----------------------------+
                      |  Real-Time WebSocket Sync   |
                      |    Leaflet Map + Dashboards |
                      +-----------------------------+
```

---

## 2. Core Architectural Pillars

### A. Routing & Geocoding Engine (`backend/app/services/route_optimizer.py`)
- Interfaces with OpenStreetMap via OSRM (Open Source Routing Machine) driving API.
- Implements real-time road closure simulation and detour recalculation (simulating roadblocks along Central Metro Corridor).
- Provides an urban geometric fallback if external OSRM services are offline or rate-limited.

### B. GPS Simulator & Preemption Triggers (`backend/app/services/gps_simulator.py`)
- Emits real-time geographic coordinates, speed, heading, distance travelled, and arrival time along the route geometry.
- Approaching Priority Threshold (250m / 15s): Preempts upcoming intersection signal lights to green before arrival.
- Cleared Intersection Threshold (30m): Automatically releases priority and returns the signal to safe clearance and normal cycle.

### C. Deterministic Signal State Machine (`backend/app/algorithms/signal_priority.py`)
Safety is the foremost priority. Signals transition strictly through standardized intervals:
1. `NORMAL_CYCLE`: Standard fixed-time oscillation between arterial and cross-traffic.
2. `YELLOW_CLEARANCE`: 3.0s warning for conflicting green lanes.
3. `ALL_RED_CLEARANCE`: 2.0s all-stop safety interval before emergency direction receives green.
4. `PRIORITY_ACTIVE`: Arterial green held open for the approaching emergency vehicle.
5. `POST_PRIORITY_CLEARANCE`: Yellow clearance after vehicle has cleared.
6. `RESTORING`: Safe return to standard signal timing cycle.
- **Conflict Movement Validation**: Prevents two perpendicular emergency vehicles from obtaining green simultaneously.
- **Fail-Safe Timeout**: 60.0s maximum priority hold failsafe.

### D. Traffic Simulation Engine (`backend/app/simulation/engine.py`)
- Supports Eclipse SUMO via TraCI (`city.net.xml`, `city.rou.xml`, `city.sumocfg`).
- Seamless Python-native fallback microscopic queue simulation with identical data contracts for zero-setup execution.
- Measures empirical waiting times, queue delays, stops, and average speed for both Normal and Priority scenarios.

### E. AI Vision Detection (`ai/detection.py`, `ai/video_processor.py`)
- Object detection for cars, buses, motorcycles, trucks, and ambulances using Ultralytics YOLOv8 and OpenCV.
- Human-in-the-Loop policy: AI detection is advisory and requires authorized operator verification before preempting signals.
