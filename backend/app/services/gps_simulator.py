"""
GreenCorridor AI - Module 4: Simulated GPS Tracking & Corridor Progression Engine
"""

import math
import time
import asyncio
from typing import Dict, List, Optional, Any, Callable
from backend.app.services.route_optimizer import calculate_haversine_distance, INTERSECTIONS

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate compass heading bearing from (lat1, lon1) to (lat2, lon2) in degrees [0, 360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - (math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda))
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0

class VirtualVehicleState:
    def __init__(
        self,
        vehicle_id: str,
        emergency_request_id: int,
        route_geometry: List[List[float]],  # [[lat, lon], ...]
        speed_kmh: float = 55.0,
    ):
        self.vehicle_id = vehicle_id
        self.emergency_request_id = emergency_request_id
        self.route_geometry = route_geometry
        self.current_index = 0
        self.total_waypoints = len(route_geometry)
        self.speed_kmh = speed_kmh
        self.is_active = True
        self.is_completed = False
        self.is_paused = False

        self.start_time = time.time()
        self.elapsed_time_simulated = 0.0

        # Stats tracking
        self.distance_travelled_m = 0.0
        self.intersections_cleared: List[int] = []
        self.prioritized_intersections: List[int] = []
        self.current_priority_intersection_id: Optional[int] = None

        # Current location
        self.latitude = route_geometry[0][0] if route_geometry else 0.0
        self.longitude = route_geometry[0][1] if route_geometry else 0.0
        self.heading = 0.0

    def get_progress_pct(self) -> float:
        if self.total_waypoints <= 1:
            return 100.0
        return round((self.current_index / (self.total_waypoints - 1)) * 100.0, 1)

class GPSSimulator:
    def __init__(self):
        self.vehicles: Dict[str, VirtualVehicleState] = {}
        self.speed_multiplier: float = 1.0
        self.is_running: bool = False
        self.event_callbacks: List[Callable[[str, Dict[str, Any]], Any]] = []

    def register_event_callback(self, cb: Callable[[str, Dict[str, Any]], Any]):
        self.event_callbacks.append(cb)

    async def _emit_event(self, event_type: str, data: Dict[str, Any]):
        for cb in self.event_callbacks:
            try:
                res = cb(event_type, data)
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass

    def start_vehicle(
        self,
        vehicle_id: str,
        emergency_request_id: int,
        route_geometry: List[List[float]],
        speed_kmh: float = 55.0,
    ) -> VirtualVehicleState:
        if not route_geometry:
            raise ValueError("Route geometry cannot be empty")

        state = VirtualVehicleState(
            vehicle_id=vehicle_id,
            emergency_request_id=emergency_request_id,
            route_geometry=route_geometry,
            speed_kmh=speed_kmh,
        )
        self.vehicles[vehicle_id] = state
        self.is_running = True
        return state

    def pause(self):
        for v in self.vehicles.values():
            v.is_paused = True

    def resume(self):
        for v in self.vehicles.values():
            v.is_paused = False

    def stop_vehicle(self, vehicle_id: str):
        if vehicle_id in self.vehicles:
            self.vehicles[vehicle_id].is_active = False
            del self.vehicles[vehicle_id]
        if not self.vehicles:
            self.is_running = False

    def reset_all(self):
        self.vehicles.clear()
        self.is_running = False

    def set_speed_multiplier(self, multiplier: float):
        self.speed_multiplier = max(0.2, min(multiplier, 10.0))

    async def step(self, priority_controller) -> List[Dict[str, Any]]:
        """
        Advances all virtual vehicles by one simulation step.
        Checks proximity to intersections, requests priority ahead, and releases
        signals once passed. Returns updated vehicle telemetry list.
        """
        if not self.is_running:
            return []

        updates = []
        now = time.time()

        for vehicle_id, state in list(self.vehicles.items()):
            if not state.is_active or state.is_completed or state.is_paused:
                continue

            # Advance waypoint index based on speed multiplier
            steps_to_advance = max(1, int(1 * self.speed_multiplier))
            prev_index = state.current_index
            state.current_index = min(state.current_index + steps_to_advance, state.total_waypoints - 1)

            curr_pt = state.route_geometry[state.current_index]
            prev_pt = state.route_geometry[prev_index]

            step_dist = calculate_haversine_distance(prev_pt[0], prev_pt[1], curr_pt[0], curr_pt[1])
            state.distance_travelled_m += step_dist

            state.latitude = curr_pt[0]
            state.longitude = curr_pt[1]
            state.heading = calculate_bearing(prev_pt[0], prev_pt[1], curr_pt[0], curr_pt[1])

            # Remaining distance and ETA calculation
            remaining_dist = 0.0
            for i in range(state.current_index, state.total_waypoints - 1):
                p1 = state.route_geometry[i]
                p2 = state.route_geometry[i + 1]
                remaining_dist += calculate_haversine_distance(p1[0], p1[1], p2[0], p2[1])

            speed_ms = (state.speed_kmh * 1000.0) / 3600.0
            eta_seconds = (remaining_dist / speed_ms) if speed_ms > 0 else 0.0

            # Find nearest upcoming intersection
            next_intersection = None
            min_dist_to_int = float("inf")

            for inter in INTERSECTIONS:
                if inter["id"] in state.intersections_cleared:
                    continue
                dist = calculate_haversine_distance(state.latitude, state.longitude, inter["latitude"], inter["longitude"])
                if dist < min_dist_to_int:
                    min_dist_to_int = dist
                    next_intersection = inter

            # Threshold 1: Approach Priority Trigger (e.g. vehicle within 250m of intersection)
            if next_intersection and min_dist_to_int <= 250.0:
                int_id = next_intersection["id"]
                if int_id not in state.prioritized_intersections:
                    state.prioritized_intersections.append(int_id)
                    state.current_priority_intersection_id = int_id

                    # Determine direction of arrival (approaching west-to-east or south-to-north)
                    # For our central corridor: generally traveling Eastbound
                    approach_dir = "West" if (state.heading > 45 and state.heading < 135) else "South"

                    # Request priority via signal controller
                    if priority_controller:
                        controller = priority_controller.get(int_id)
                        if controller:
                            controller.request_priority(
                                emergency_request_id=state.emergency_request_id,
                                vehicle_id=state.vehicle_id,
                                direction=approach_dir,
                                eta_seconds=min_dist_to_int / speed_ms if speed_ms > 0 else 10.0
                            )

                    await self._emit_event("PRIORITY_REQUESTED", {
                        "intersection_id": int_id,
                        "intersection_name": next_intersection["name"],
                        "vehicle_id": state.vehicle_id,
                        "distance_m": round(min_dist_to_int, 1),
                        "eta_sec": round(min_dist_to_int / speed_ms, 1) if speed_ms > 0 else 10.0,
                    })

            # Threshold 2: Intersection Cleared (vehicle has passed within 25m or is now moving past it)
            if state.current_priority_intersection_id:
                active_int = next((it for it in INTERSECTIONS if it["id"] == state.current_priority_intersection_id), None)
                if active_int:
                    dist_to_active = calculate_haversine_distance(state.latitude, state.longitude, active_int["latitude"], active_int["longitude"])
                    if dist_to_active <= 30.0:
                        int_id = state.current_priority_intersection_id
                        state.intersections_cleared.append(int_id)
                        state.current_priority_intersection_id = None

                        # Release priority back to clearance / normal
                        if priority_controller:
                            controller = priority_controller.get(int_id)
                            if controller:
                                controller.release_priority(reason=f"Vehicle {state.vehicle_id} cleared intersection")

                        await self._emit_event("INTERSECTION_CLEARED", {
                            "intersection_id": int_id,
                            "intersection_name": active_int["name"],
                            "vehicle_id": state.vehicle_id,
                        })

            # Check if vehicle reached final destination
            if state.current_index >= state.total_waypoints - 1:
                state.is_completed = True
                state.is_active = False

                total_time_taken = time.time() - state.start_time
                # Theoretical normal time with traffic congestion and 4 red lights (avg 35s delay per signal = ~140s extra)
                normal_time_taken = total_time_taken + (len(INTERSECTIONS) * 32.5)

                await self._emit_event("TRIP_COMPLETED", {
                    "vehicle_id": state.vehicle_id,
                    "emergency_request_id": state.emergency_request_id,
                    "distance_m": round(state.distance_travelled_m, 1),
                    "priority_time_sec": round(total_time_taken, 1),
                    "normal_time_sec": round(normal_time_taken, 1),
                    "time_saved_sec": round(normal_time_taken - total_time_taken, 1),
                    "saved_percent": round(((normal_time_taken - total_time_taken) / normal_time_taken) * 100.0, 1),
                })

            telemetry = {
                "vehicle_id": state.vehicle_id,
                "emergency_request_id": state.emergency_request_id,
                "latitude": state.latitude,
                "longitude": state.longitude,
                "speed": state.speed_kmh,
                "heading": round(state.heading, 1),
                "progress_pct": state.get_progress_pct(),
                "distance_travelled_m": round(state.distance_travelled_m, 1),
                "remaining_distance_m": round(remaining_dist, 1),
                "eta_seconds": round(eta_seconds, 1),
                "next_intersection": next_intersection["name"] if next_intersection else "Hospital Destination",
                "is_completed": state.is_completed,
            }
            updates.append(telemetry)

        return updates

    def get_vehicle_status(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        state = self.vehicles.get(vehicle_id)
        if not state:
            return None
        return {
            "vehicle_id": state.vehicle_id,
            "emergency_request_id": state.emergency_request_id,
            "latitude": state.latitude,
            "longitude": state.longitude,
            "speed": state.speed_kmh,
            "heading": round(state.heading, 1),
            "progress_pct": state.get_progress_pct(),
            "distance_travelled_m": round(state.distance_travelled_m, 1),
            "is_active": state.is_active,
            "is_completed": state.is_completed,
            "is_paused": state.is_paused,
            "cleared_intersections_count": len(state.intersections_cleared),
        }
