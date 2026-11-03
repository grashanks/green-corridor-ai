# GreenCorridor AI - Local Setup & Execution Guide

This guide provides step-by-step instructions for running GreenCorridor AI locally on Windows and Linux/macOS.

---

## Prerequisites

- **Python 3.10+** (Tested on Python 3.10, 3.11, 3.12, 3.14)
- **Node.js 18+ & npm** (Tested on Node.js v20.18 LTS)
- *(Optional)* Eclipse SUMO (Simulation of Urban Mobility)

> **Note on Zero Hardware Requirements**:
> This platform runs 100% in software simulation. No ESP32, Arduino, CCTV hardware, or physical GPS devices are required.

---

## 1. Quick Start (Windows)

### Step 1: Clone or Navigate to Project
```cmd
cd "c:\Users\Win\Downloads\traffic management"
```

### Step 2: Initialize Database and Demo Data
```cmd
python scripts/initialize_db.py
python scripts/seed_data.py
```

### Step 3: Run Backend Server
```cmd
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend will be live at `http://127.0.0.1:8000`. Swagger API docs: `http://127.0.0.1:8000/docs`.

### Step 4: Run Frontend Development Server
In a separate terminal:
```cmd
cd frontend
npm run dev
```
Open your browser to: **`http://localhost:5173`**.

---

## 2. Quick Start (Linux / macOS)

```bash
# 1. Setup virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Initialize database
python3 scripts/initialize_db.py
python3 scripts/seed_data.py

# 3. Start Backend
uvicorn backend.app.main:app --reload --port 8000 &

# 4. Start Frontend
cd frontend
npm install
npm run dev
```

---

## 3. Demo Credentials

| Role | Username | Password |
|---|---|---|
| **Traffic Administrator** | `admin` | `admin123` |
| **Emergency Vehicle Operator** | `operator` | `operator123` |

*(The login page also provides 1-click credential autofill buttons for judges.)*

---

## 4. Running the Master Hackathon Demo

1. Open `http://localhost:5173` and log in.
2. Click the prominent green **"START HACKATHON DEMO"** button in the top navigation bar.
3. The system will:
   - Dispatch `AMB-001` from West Gate.
   - Calculate the 4-intersection arterial corridor to Apollo Hospital.
   - Animate the simulated GPS ambulance on the interactive Leaflet map.
   - Detect upcoming intersections and safely transition signals to Green Corridor priority.
   - Safely clear conflicting traffic with yellow and all-red intervals.
   - Restore normal traffic cycles once the ambulance clears each intersection.
   - Record the completed trip with empirical time savings and percentage delay reductions.
4. Click **"Reset Demo"** at any time to return the corridor to standby.

---

## 5. Running Automated Backend Tests

```cmd
python -m pytest tests/test_backend.py -v
```
Verifies all 12 test suites: authentication, vehicle registration, duplicate prevention, routing, signal state machine safety, conflict prevention, simulation control, demo lifecycle, and AI detection.
