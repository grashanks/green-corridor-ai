# 🚑 GreenCorridor AI
### AI-Powered Emergency Vehicle Priority and Traffic Coordination System

**Helping emergency vehicles reach their destinations faster through intelligent route planning, AI-based vehicle detection, and dynamic traffic signal coordination.**

GreenCorridor AI is a software-based traffic management platform designed to reduce delays faced by emergency vehicles such as ambulances, fire engines, and disaster response units.

The system creates a virtual green corridor by coordinating traffic signals along an emergency vehicle's route. It uses simulated GPS tracking, real-road routing, computer vision, and a safety-focused signal control mechanism to give emergency vehicles priority at upcoming intersections.

The project combines AI, real-time communication, route optimization, and traffic simulation into a single platform that demonstrates how smarter traffic coordination can improve emergency response times.

---

## 📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Traffic Signal Safety](#-traffic-signal-safety)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Running the Application](#-running-the-application)
- [Demo Scenario](#-demo-scenario)
- [Testing](#-testing)
- [Expected Outcomes](#-expected-outcomes)
- [Future Improvements](#-future-improvements)

---

## 🚨 Problem Statement

Every second matters during an emergency. However, ambulances and other emergency response vehicles often lose valuable time because of:

- Heavy traffic congestion on urban roads.
- Traffic signals operating with fixed timings.
- Lack of coordination between emergency vehicles and traffic control systems.
- Unexpected roadblocks and route obstructions.
- Limited real-time visibility for traffic management authorities.

These challenges can delay emergency response and create additional risks for both emergency vehicles and other road users.

There is a need for an intelligent traffic coordination system that can dynamically manage traffic signals and help emergency vehicles move through congested roads more efficiently.

## 💡 Our Solution

GreenCorridor AI addresses this problem by creating a **virtual green corridor** for emergency vehicles.

When an emergency vehicle is dispatched, the system calculates its route and tracks its simulated movement. As it approaches an intersection, the traffic controller prepares the signal sequence to provide a safe priority passage.

The system also supports AI-based vehicle detection, allowing operators to upload traffic images or videos, identify potential emergency vehicles, and confirm detections before initiating priority actions.

Instead of relying on fixed signal timings, GreenCorridor AI demonstrates a more responsive approach to emergency traffic management.

## ✨ Key Features

### 1. User Authentication and Role Management
- Secure login and authentication.
- Separate access for Traffic Administrators and Emergency Vehicle Operators.
- JWT-based authentication.
- Password hashing using PBKDF2-HMAC-SHA256.

### 2. Traffic Management Dashboard
- Overview of registered emergency vehicles.
- Active emergency requests and corridor status.
- Live traffic and signal information.
- Emergency alerts and operational statistics.
- Delay reduction analytics.

### 3. Emergency Vehicle Management
- Register and manage emergency vehicles.
- Validate duplicate vehicle IDs and license numbers.
- Assign priority levels to vehicles.
- Dispatch emergency vehicles directly from the dashboard.

### 4. GPS Tracking and Vehicle Simulation
- Simulate vehicle movement using real road coordinates.
- Track vehicle location, speed, and heading.
- Calculate distance to the destination.
- Estimate arrival time dynamically.
- Display vehicle movement on an interactive map.

### 5. AI-Based Vehicle Detection
- Upload traffic images and videos.
- Detect vehicles using YOLOv8.
- Identify vehicle categories such as cars, buses, and motorcycles.
- Display detected objects with bounding boxes.
- Allow operators to review and confirm emergency vehicle candidates.

### 6. Intelligent Route Optimization
- Calculate routes using OSRM.
- Display real road networks using OpenStreetMap.
- Identify upcoming intersections along the route.
- Simulate road closures and obstructions.
- Recalculate routes when an obstruction is detected.

### 7. Smart Traffic Signal Control
- Automatically prepare upcoming intersections for emergency vehicle passage.
- Use yellow and all-red clearance phases.
- Prevent conflicting traffic movements.
- Grant priority green only after the required safety checks.
- Restore normal signal timings after the emergency vehicle passes.

### 8. Traffic Simulation
- Simulate traffic flow across four connected intersections.
- Support Eclipse SUMO through TraCI.
- Include a Python-based microscopic traffic simulation engine.
- Analyse traffic queues and their dissipation.
- Compare normal traffic conditions with emergency priority scenarios.

### 9. Green Corridor Management
- Display all intersections along the emergency route.
- Show the status of each intersection.
- Track the distance between the emergency vehicle and upcoming stop lines.
- Visualize the sequence of traffic signal changes.
- Monitor active signal overrides.

### 10. Real-Time Notifications
- WebSocket-based live GPS updates.
- Real-time emergency alerts.
- Live signal status changes.
- Automatic updates to the operations dashboard.

---

## 🔄 How It Works

The complete workflow is designed to demonstrate how an emergency vehicle can travel through multiple intersections with coordinated traffic signal priority.

```text
       START EMERGENCY DISPATCH
                  |
                  v
       Select Emergency Vehicle
                  |
                  v
         Calculate Best Route
              (OSRM)
                  |
                  v
       Start Simulated GPS Tracking
                  |
                  v
        Monitor Vehicle Movement
                  |
                  v
       Detect Upcoming Intersection
                  |
                  v
        Initiate Yellow Clearance
                (3 sec)
                  |
                  v
          All-Red Clearance
                (2 sec)
                  |
                  v
         Grant Priority Green
                  |
                  v
       Emergency Vehicle Passes
                  |
                  v
        Restore Normal Signals
                  |
                  v
       Repeat at Next Intersection
                  |
                  v
          Reach Destination
                  |
                  v
         Calculate Time Saved
```

The process continues until the emergency vehicle reaches its destination.

---

## 🛠️ Technology Stack

The project uses a combination of modern frontend, backend, AI, mapping, and simulation technologies.

| Category | Technologies |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Maps | Leaflet.js, React Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| API Communication | Axios |
| Backend | Python, FastAPI |
| Validation | Pydantic v2 |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | JWT, PBKDF2-HMAC-SHA256 |
| Real-Time Communication | WebSockets |
| AI Model | YOLOv8 |
| Computer Vision | OpenCV |
| Mapping Data | OpenStreetMap |
| Route Optimization | OSRM |
| Traffic Simulation | Eclipse SUMO, TraCI |
| Testing | Pytest |

---

## 🏗️ System Architecture

GreenCorridor AI follows a modular architecture where the frontend, backend, AI detection module, routing services, and traffic simulation engine work together.

```text
                FRONTEND
             React + Vite
                   |
                   v
              FastAPI
               BACKEND
                   |
       +-----------+-----------+
       |           |           |
       v           v           v
  Authentication  Vehicle    Emergency
                   Management  Dispatch
       |           |           |
       +-----------+-----------+
                   |
       +-----------+-----------+
       |           |           |
       v           v           v
  GPS Tracking   Route       Signal
                 Optimizer   Controller
       |           |           |
       v           v           v
   WebSockets    OSRM       Safety State
                            Machine
       |           |           |
       +-----------+-----------+
                   |
          +--------+--------+
          |                 |
          v                 v
      AI Detection     Traffic Simulation
      YOLOv8/OpenCV    SUMO/Python
          |                 |
          +--------+--------+
                   |
                   v
             SQLite Database
```

## 🚦 Traffic Signal Safety

Safety is one of the most important parts of GreenCorridor AI.

The system uses a deterministic state machine to control traffic signal transitions. An emergency request does not immediately turn a conflicting signal green.

Instead, the following sequence is followed:

| Phase | Duration | Description |
|---|---:|---|
| Normal | Dynamic | Regular traffic signal operation |
| Yellow Clearance | 3 seconds | Warn vehicles in the current movement |
| All-Red Clearance | 2 seconds | Ensure conflicting traffic movements are stopped |
| Priority Green | Until passage | Allow the emergency vehicle's approved movement |
| Restoration | Dynamic | Return the intersection to normal operation |

The controller also validates conflicting movements before granting priority.

**Note:** These timings are simulation parameters for the prototype. A real-world deployment would require validation against applicable traffic regulations, pedestrian crossing requirements, intersection geometry, and certified safety controls.

---

## 📂 Project Structure

```text
GreenCorridor-AI/
│
├── backend/
│   └── app/
│       ├── algorithms/       # Traffic signal state machine
│       ├── database/         # Database configuration
│       ├── models/           # SQLAlchemy models
│       ├── routers/          # API endpoints
│       ├── schemas/          # Pydantic schemas
│       ├── services/         # GPS and routing services
│       ├── simulation/       # Traffic simulation engine
│       ├── utils/            # Authentication and security
│       └── main.py           # FastAPI application
│
├── frontend/
│   ├── src/
│   │   ├── context/          # Authentication context
│   │   ├── layouts/          # Dashboard layout
│   │   ├── pages/            # Application pages
│   │   ├── services/         # API integration
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── simulation/
│   ├── networks/             # SUMO road network
│   ├── routes/               # Traffic route files
│   ├── configurations/       # SUMO configuration
│   ├── signal_controller.py  # TraCI signal controller
│   └── generate_network.py   # Network generation
│
├── ai/
│   ├── detection.py          # YOLOv8 vehicle detection
│   ├── video_processor.py    # Video processing
│   └── model_config.py       # Detection configuration
│
├── scripts/
│   ├── initialize_db.py      # Database initialization
│   ├── seed_data.py          # Sample data generation
│   └── start_demo.py         # Demo launcher
│
├── tests/
│   └── test_backend.py       # Backend test suite
│
├── docs/
│   ├── architecture.md
│   ├── api_documentation.md
│   └── setup_guide.md
│
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run GreenCorridor AI locally.

### Prerequisites

Make sure you have the following installed:

- Python 3.10 or later
- Node.js 18 or later
- npm
- Git

**Optional:** Eclipse SUMO and TraCI are required when running the SUMO-based simulation instead of the Python-native simulation engine.

### 1. Clone the Repository

```bash
git clone https://github.com/grashanks/green-corridor-ai.git
cd green-corridor-ai
```

### 2. Set Up the Backend

Create a virtual environment:

```bash
python -m venv venv
```

Activate it:

**Windows:**
```cmd
venv\Scripts\activate
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

### 3. Initialize the Database

Run the database setup scripts:

```bash
python scripts/initialize_db.py
python scripts/seed_data.py
```

This creates the required database tables and inserts sample data for demonstration.

### 4. Start the Backend Server

```bash
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

- API: http://localhost:8000
- Swagger API Documentation: http://localhost:8000/docs

### 5. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

**http://localhost:5173**

---

## 🎬 Demo Scenario

GreenCorridor AI includes a ready-to-run demonstration of an emergency ambulance journey.

The demo can be initiated using the **Start Emergency AMB-001** button.

### Example Demonstration

1. An ambulance is selected from the registered emergency fleet.
2. The system calculates a route to Apollo Hospital using OSRM.
3. Simulated GPS tracking begins.
4. The ambulance approaches the first intersection, West Gate.
5. The traffic controller initiates yellow clearance.
6. The all-red safety phase is activated.
7. Priority green is granted for the approved movement.
8. The ambulance crosses the intersection.
9. The traffic signal returns to normal operation.
10. The same process repeats at Civic Center, Central Square, and Hospital Approach.
11. The ambulance reaches its destination.

### Sample Simulation Results

| Metric | Demonstration Value |
|---|---:|
| Estimated Time Saved | 96.5 seconds |
| Delay Reduction | 43% |
| Intersections Covered | 4 |
| Emergency Vehicle | AMB-001 |
| Destination | Apollo Hospital |

*These are sample results from the configured demonstration scenario, not verified real-world performance measurements.*

---

## 🧪 Testing

The backend includes an automated test suite covering authentication, vehicle management, routing, signal safety, AI detection, and analytics.

Run the tests using:

```bash
python -m pytest tests/test_backend.py -v
```

### Test Cases

| Test | Description |
|---|---|
| `test_auth_login_success` | Validates successful login |
| `test_auth_login_invalid` | Checks invalid login credentials |
| `test_get_vehicles` | Retrieves registered vehicles |
| `test_duplicate_vehicle_prevention` | Prevents duplicate vehicle registration |
| `test_register_new_vehicle` | Tests vehicle registration |
| `test_route_calculation_and_intersections` | Validates route and intersection detection |
| `test_route_obstruction_detour` | Checks alternative route calculation |
| `test_signal_priority_state_machine_safety` | Validates signal transition safety |
| `test_signal_conflict_prevention` | Prevents conflicting signal movements |
| `test_hackathon_demo_start_and_reset` | Tests demo execution and reset |
| `test_analytics_performance` | Checks analytics functionality |
| `test_ai_detection_endpoint` | Tests the AI detection API |

**Reported test status:** All 12 listed test cases passed in the documented test run.

---

## 🎯 Expected Outcomes

GreenCorridor AI aims to demonstrate how software-driven traffic coordination can improve emergency vehicle movement.

The expected outcomes include:

- Reduced waiting time at traffic intersections.
- Better coordination between emergency vehicles and traffic signals.
- More efficient emergency route planning.
- Improved visibility of emergency fleet movement.
- Faster identification of potential emergency vehicles through computer vision.
- Safer and more controlled traffic signal transitions.
- Better understanding of traffic congestion through simulation and analytics.

## 🔮 Future Improvements

There is plenty of scope to extend GreenCorridor AI beyond the current prototype.

Some planned improvements include:

- Integration with live GPS devices installed in emergency vehicles.
- Connection to real traffic signal controllers through authorized interfaces.
- Integration with municipal traffic management systems.
- Improved AI models for emergency vehicle classification.
- Live traffic density estimation using CCTV feeds.
- Machine learning-based traffic congestion prediction.
- Multi-ambulance coordination and priority scheduling.
- Support for additional intersections and larger road networks.
- Mobile application for emergency vehicle operators.
- Advanced analytics for evaluating emergency response performance.

---

## 🌍 Vision

Our goal with GreenCorridor AI is to explore how artificial intelligence, real-time data, and intelligent traffic coordination can contribute to faster and safer emergency response systems.

A few seconds can make a difference during an emergency. By helping emergency vehicles navigate traffic more efficiently, we hope to contribute towards smarter and more responsive cities.

**Every Second Matters. Every Life Counts.**

---

## 👨‍💻 Developed With

Built as a software-driven emergency traffic management prototype using AI, computer vision, real-time communication, route optimization, and traffic simulation.

**Project:** GreenCorridor AI  
**Category:** Artificial Intelligence | Smart City | Intelligent Transportation System  
**Focus:** Emergency Vehicle Priority and Traffic Management

---

⭐ If you find this project interesting, consider giving the repository a star!