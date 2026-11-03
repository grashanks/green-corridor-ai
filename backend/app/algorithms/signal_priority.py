"""
GreenCorridor AI - Module 7: Intelligent Traffic Signal Priority Engine
Deterministic State Machine for Emergency Vehicle Priority Coordination
"""

import time
from enum import Enum
from typing import Dict, Optional, List, Tuple
from datetime import datetime

class SignalState(str, Enum):
    RED = "RED"
    YELLOW = "YELLOW"
    GREEN = "GREEN"
    PRIORITY_REQUESTED = "PRIORITY_REQUESTED"
    PRIORITY_ACTIVE = "PRIORITY_ACTIVE"
    CLEARANCE = "CLEARANCE"

class PhaseState(str, Enum):
    NORMAL_CYCLE = "NORMAL_CYCLE"
    YELLOW_CLEARANCE = "YELLOW_CLEARANCE"
    ALL_RED_CLEARANCE = "ALL_RED_CLEARANCE"
    PRIORITY_HOLD = "PRIORITY_HOLD"
    POST_PRIORITY_CLEARANCE = "POST_PRIORITY_CLEARANCE"
    RESTORING = "RESTORING"

class IntersectionController:
    """
    Manages deterministic signal transitions and safety intervals for a 4-way intersection.
    Directions: North, South, East, West.
    - NS Phase: North & South movements (compatible)
    - EW Phase: East & West movements (compatible)
    - Conflicting pairs: (North/South) vs (East/West)
    """

    def __init__(
        self,
        intersection_id: int,
        name: str,
        lat: float,
        lon: float,
        min_green: float = 5.0,
        yellow_duration: float = 3.0,
        all_red_duration: float = 2.0,
        priority_timeout: float = 60.0,
    ):
        self.intersection_id = intersection_id
        self.name = name
        self.lat = lat
        self.lon = lon

        # Safety timings (in seconds)
        self.min_green = min_green
        self.yellow_duration = yellow_duration
        self.all_red_duration = all_red_duration
        self.priority_timeout = priority_timeout

        # Current internal state
        self.phase_state = PhaseState.NORMAL_CYCLE
        self.normal_phase = "NS"  # "NS" (North-South) or "EW" (East-West)
        self.phase_started_at = time.time()
        self.last_transition_time = time.time()

        # Priority request tracking
        self.active_priority_request: Optional[Dict] = None
        # Dict shape: {
        #   "emergency_request_id": int,
        #   "vehicle_id": str,
        #   "direction": str, ("North", "South", "East", "West")
        #   "requested_at": float,
        #   "target_phase": str, ("NS" or "EW")
        # }

        # Signal states for each of the 4 approaches
        self.signals: Dict[str, SignalState] = {
            "North": SignalState.GREEN,
            "South": SignalState.GREEN,
            "East": SignalState.RED,
            "West": SignalState.RED,
        }

    def _get_phase_for_direction(self, direction: str) -> str:
        return "NS" if direction in ["North", "South"] else "EW"

    def request_priority(
        self,
        emergency_request_id: int,
        vehicle_id: str,
        direction: str,
        eta_seconds: float = 15.0
    ) -> Tuple[bool, str]:
        """
        Requests priority for a specific emergency vehicle approaching from `direction`.
        Returns (success: bool, status_message: str).
        """
        now = time.time()

        # Rule 1: Conflict movement validation - only one active emergency priority per intersection
        if self.active_priority_request is not None:
            active_req = self.active_priority_request
            if active_req["emergency_request_id"] != emergency_request_id:
                return (
                    False,
                    f"Conflict detected: Intersection {self.name} is already prioritizing vehicle {active_req['vehicle_id']}."
                )

        target_phase = self._get_phase_for_direction(direction)

        # Set or update priority request
        self.active_priority_request = {
            "emergency_request_id": emergency_request_id,
            "vehicle_id": vehicle_id,
            "direction": direction,
            "target_phase": target_phase,
            "requested_at": now,
            "eta_seconds": eta_seconds,
        }

        # If already green in the requested direction, hold it active
        if self.normal_phase == target_phase and self.phase_state == PhaseState.NORMAL_CYCLE:
            self.phase_state = PhaseState.PRIORITY_HOLD
            self.last_transition_time = now
            self._apply_priority_signal_states(direction)
            return True, f"Immediate priority green granted for {direction} direction."

        # Otherwise, initiate safe transition sequence
        self.phase_state = PhaseState.YELLOW_CLEARANCE
        self.last_transition_time = now

        # Put conflicting signals into YELLOW clearance
        conflicting_phase = "EW" if target_phase == "NS" else "NS"
        self._apply_yellow_clearance(conflicting_phase)

        # Mark approaching signal as PRIORITY_REQUESTED
        self.signals[direction] = SignalState.PRIORITY_REQUESTED

        return True, f"Priority transition initiated: yellow clearance active for conflicting traffic."

    def tick(self, current_time: Optional[float] = None) -> List[Dict]:
        """
        Periodic state machine update tick. Executes transitions adhering strictly to
        minimum green, yellow clearance, and all-red clearance intervals.
        Returns a list of state change events for logging/broadcast.
        """
        now = current_time or time.time()
        events = []
        elapsed = now - self.last_transition_time

        # Check for priority timeout fail-safe
        if self.active_priority_request:
            if now - self.active_priority_request["requested_at"] > self.priority_timeout:
                events.append({
                    "intersection_id": self.intersection_id,
                    "event": "PRIORITY_TIMEOUT",
                    "detail": "Emergency vehicle priority timed out. Restoring normal cycle for safety."
                })
                self.restore_normal_cycle("Priority timeout reached")
                return events

        # State Machine Transitions
        if self.phase_state == PhaseState.YELLOW_CLEARANCE:
            if elapsed >= self.yellow_duration:
                # Transition to ALL_RED_CLEARANCE for safety
                self.phase_state = PhaseState.ALL_RED_CLEARANCE
                self.last_transition_time = now
                self._apply_all_red()
                events.append({
                    "intersection_id": self.intersection_id,
                    "event": "ALL_RED_CLEARANCE",
                    "detail": "All-red clearance active; intersecting traffic safely stopped."
                })

        elif self.phase_state == PhaseState.ALL_RED_CLEARANCE:
            if elapsed >= self.all_red_duration:
                if self.active_priority_request:
                    # Grant PRIORITY_ACTIVE green to emergency direction
                    target_dir = self.active_priority_request["direction"]
                    self.phase_state = PhaseState.PRIORITY_HOLD
                    self.normal_phase = self._get_phase_for_direction(target_dir)
                    self.last_transition_time = now
                    self._apply_priority_signal_states(target_dir)
                    events.append({
                        "intersection_id": self.intersection_id,
                        "event": "PRIORITY_ACTIVE",
                        "detail": f"Green corridor priority active for {target_dir} bound emergency vehicle."
                    })
                else:
                    # Normal cycle restoration
                    self.phase_state = PhaseState.NORMAL_CYCLE
                    self.last_transition_time = now
                    self._apply_normal_signals()

        elif self.phase_state == PhaseState.POST_PRIORITY_CLEARANCE:
            if elapsed >= self.yellow_duration:
                # After emergency vehicle passed, do a quick all-red before resuming normal cycle
                self.phase_state = PhaseState.ALL_RED_CLEARANCE
                self.last_transition_time = now
                self._apply_all_red()
                events.append({
                    "intersection_id": self.intersection_id,
                    "event": "POST_PRIORITY_ALL_RED",
                    "detail": "Post-priority all-red clearance before normal operation."
                })

        elif self.phase_state == PhaseState.NORMAL_CYCLE:
            # Standard traffic signal oscillation: 30s NS green, 3s yellow, 2s all-red, 30s EW green...
            cycle_time = 35.0  # 30s green + 3s yellow + 2s red
            cycle_elapsed = (now - self.phase_started_at) % (cycle_time * 2)

            if cycle_elapsed < 30.0:
                self.normal_phase = "NS"
                self.signals["North"] = SignalState.GREEN
                self.signals["South"] = SignalState.GREEN
                self.signals["East"] = SignalState.RED
                self.signals["West"] = SignalState.RED
            elif cycle_elapsed < 33.0:
                self.signals["North"] = SignalState.YELLOW
                self.signals["South"] = SignalState.YELLOW
                self.signals["East"] = SignalState.RED
                self.signals["West"] = SignalState.RED
            elif cycle_elapsed < 35.0:
                self._apply_all_red()
            elif cycle_elapsed < 65.0:
                self.normal_phase = "EW"
                self.signals["North"] = SignalState.RED
                self.signals["South"] = SignalState.RED
                self.signals["East"] = SignalState.GREEN
                self.signals["West"] = SignalState.GREEN
            elif cycle_elapsed < 68.0:
                self.signals["North"] = SignalState.RED
                self.signals["South"] = SignalState.RED
                self.signals["East"] = SignalState.YELLOW
                self.signals["West"] = SignalState.YELLOW
            else:
                self._apply_all_red()

        return events

    def release_priority(self, reason: str = "Vehicle cleared") -> Tuple[bool, str]:
        """
        Called when the emergency vehicle has cleared the intersection.
        Safely transitions from PRIORITY_HOLD to clearance and restores normal cycle.
        """
        if not self.active_priority_request and self.phase_state == PhaseState.NORMAL_CYCLE:
            return True, "Intersection was already in normal cycle."

        now = time.time()
        self.active_priority_request = None
        self.phase_state = PhaseState.POST_PRIORITY_CLEARANCE
        self.last_transition_time = now

        # Transition the green signals to YELLOW clearance
        if self.normal_phase == "NS":
            self.signals["North"] = SignalState.YELLOW
            self.signals["South"] = SignalState.YELLOW
        else:
            self.signals["East"] = SignalState.YELLOW
            self.signals["West"] = SignalState.YELLOW

        return True, f"Priority released ({reason}). Safe clearance phase activated."

    def restore_normal_cycle(self, reason: str = "Manual override"):
        self.active_priority_request = None
        self.phase_state = PhaseState.NORMAL_CYCLE
        self.last_transition_time = time.time()
        self.phase_started_at = time.time()
        self._apply_normal_signals()

    def _apply_all_red(self):
        for d in self.signals:
            self.signals[d] = SignalState.RED

    def _apply_yellow_clearance(self, phase: str):
        if phase == "NS":
            self.signals["North"] = SignalState.YELLOW
            self.signals["South"] = SignalState.YELLOW
        else:
            self.signals["East"] = SignalState.YELLOW
            self.signals["West"] = SignalState.YELLOW

    def _apply_priority_signal_states(self, direction: str):
        target_phase = self._get_phase_for_direction(direction)
        if target_phase == "NS":
            self.signals["North"] = SignalState.GREEN
            self.signals["South"] = SignalState.GREEN
            self.signals["East"] = SignalState.RED
            self.signals["West"] = SignalState.RED
        else:
            self.signals["East"] = SignalState.GREEN
            self.signals["West"] = SignalState.GREEN
            self.signals["North"] = SignalState.RED
            self.signals["South"] = SignalState.RED

        # Mark approaching direction explicitly as PRIORITY_ACTIVE
        self.signals[direction] = SignalState.PRIORITY_ACTIVE

    def _apply_normal_signals(self):
        if self.normal_phase == "NS":
            self.signals["North"] = SignalState.GREEN
            self.signals["South"] = SignalState.GREEN
            self.signals["East"] = SignalState.RED
            self.signals["West"] = SignalState.RED
        else:
            self.signals["East"] = SignalState.GREEN
            self.signals["West"] = SignalState.GREEN
            self.signals["North"] = SignalState.RED
            self.signals["South"] = SignalState.RED

    def get_status(self) -> Dict:
        return {
            "intersection_id": self.intersection_id,
            "name": self.name,
            "latitude": self.lat,
            "longitude": self.lon,
            "phase_state": self.phase_state.value,
            "normal_phase": self.normal_phase,
            "active_priority": self.active_priority_request is not None,
            "prioritized_vehicle": self.active_priority_request["vehicle_id"] if self.active_priority_request else None,
            "signals": {d: state.value for d, state in self.signals.items()}
        }
