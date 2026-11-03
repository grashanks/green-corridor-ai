"""
GreenCorridor AI - Module 6: Route Optimization Engine
Integrates with OSRM (Open Source Routing Machine) / OpenStreetMap
Includes simulated road-closure/obstruction re-routing capability
and high-fidelity urban geometric fallback.
"""

import math
import requests
from typing import List, Dict, Any, Tuple

# Predefined coordinates for the simulated city corridor (Central Metro Corridor)
# 4 key connected intersections along the corridor:
INTERSECTIONS = [
    {
        "id": 1,
        "name": "Intersection 1 (West Gate)",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "cross_street": "MG Road & Brigade Rd",
    },
    {
        "id": 2,
        "name": "Intersection 2 (Civic Center)",
        "latitude": 12.9750,
        "longitude": 77.6010,
        "cross_street": "Residency Rd & Richmond Rd",
    },
    {
        "id": 3,
        "name": "Intersection 3 (Central Square)",
        "latitude": 12.9790,
        "longitude": 77.6080,
        "cross_street": "Commercial St & Old Madras Rd",
    },
    {
        "id": 4,
        "name": "Intersection 4 (Hospital Approach)",
        "latitude": 12.9830,
        "longitude": 77.6150,
        "cross_street": "Apollo Hospital Way & 100ft Rd",
    },
]

# Obstruction detour point (used when simulating road closure at Intersection 2)
OBSTRUCTION_POINT = {"latitude": 12.9750, "longitude": 77.6010}

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def generate_interpolated_path(points: List[Tuple[float, float]], step_distance_m: float = 25.0) -> List[List[float]]:
    """Interpolates coordinates between waypoints to create smooth simulated GPS steps."""
    if not points:
        return []
    result = [list(points[0])]
    for i in range(len(points) - 1):
        p1 = points[i]
        p2 = points[i + 1]
        dist = calculate_haversine_distance(p1[0], p1[1], p2[0], p2[1])
        steps = max(1, int(dist / step_distance_m))
        for s in range(1, steps + 1):
            fraction = s / steps
            interp_lat = p1[0] + (p2[0] - p1[0]) * fraction
            interp_lon = p1[1] + (p2[1] - p1[1]) * fraction
            result.append([round(interp_lat, 6), round(interp_lon, 6)])
    return result

class RouteOptimizer:
    def __init__(self, osrm_base_url: str = "https://router.project-osrm.org"):
        self.osrm_base_url = osrm_base_url

    def get_route(
        self,
        src_lat: float,
        src_lon: float,
        dst_lat: float,
        dst_lon: float,
        simulate_obstruction: bool = False,
    ) -> Dict[str, Any]:
        """
        Calculates optimal emergency route. Attempts OSRM driving service first;
        if unreachable or if simulating an active road obstruction, provides deterministic
        safe geometric routing across the controlled corridor network.
        """
        route_coords: List[List[float]] = []
        distance_meters: float = 0.0
        duration_seconds: float = 0.0

        if not simulate_obstruction:
            try:
                # OSRM expects coordinates as {longitude},{latitude}
                url = f"{self.osrm_base_url}/route/v1/driving/{src_lon},{src_lat};{dst_lon},{dst_lat}?overview=full&geometries=geojson"
                resp = requests.get(url, timeout=4.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        best_route = data["routes"][0]
                        # OSRM coordinates are [lon, lat] -> convert to [lat, lon]
                        raw_coords = [[pt[1], pt[0]] for pt in best_route["geometry"]["coordinates"]]
                        distance_meters = float(best_route["distance"])
                        duration_seconds = float(best_route["duration"])
                        route_coords = raw_coords
            except Exception:
                # OSRM unavailable or timed out; seamlessly fall back to local network geometry
                pass

        # Fallback or Obstruction Detour Route Generation
        if not route_coords:
            if simulate_obstruction:
                # Detour around Intersection 2 via Bypass Avenue
                waypoints = [
                    (src_lat, src_lon),
                    (12.9716, 77.5946),  # Int 1
                    (12.9730, 77.6040),  # Bypass East point
                    (12.9770, 77.6065),  # North detour
                    (12.9790, 77.6080),  # Int 3
                    (12.9830, 77.6150),  # Int 4
                    (dst_lat, dst_lon),
                ]
            else:
                # Primary Direct Corridor Route through all 4 intersections
                waypoints = [
                    (src_lat, src_lon),
                    (12.9716, 77.5946),  # Int 1
                    (12.9750, 77.6010),  # Int 2
                    (12.9790, 77.6080),  # Int 3
                    (12.9830, 77.6150),  # Int 4
                    (dst_lat, dst_lon),
                ]

            route_coords = generate_interpolated_path(waypoints, step_distance_m=20.0)
            # Calculate total distance
            distance_meters = 0.0
            for i in range(len(route_coords) - 1):
                p1, p2 = route_coords[i], route_coords[i + 1]
                distance_meters += calculate_haversine_distance(p1[0], p1[1], p2[0], p2[1])

            # Estimated emergency duration at ~50 km/h (13.8 m/s) with green corridor
            duration_seconds = distance_meters / 13.8

        # Associate upcoming intersections along this route
        upcoming_intersections = []
        for inter in INTERSECTIONS:
            # Check if intersection is near the route
            min_dist = min(
                calculate_haversine_distance(inter["latitude"], inter["longitude"], pt[0], pt[1])
                for pt in route_coords
            )
            if min_dist < 80.0:  # within 80m of route
                upcoming_intersections.append({
                    "id": inter["id"],
                    "name": inter["name"],
                    "latitude": inter["latitude"],
                    "longitude": inter["longitude"],
                    "cross_street": inter["cross_street"],
                    "distance_from_start": min_dist,
                })

        return {
            "distance": round(distance_meters, 2),
            "estimated_duration": round(duration_seconds, 1),
            "route_geometry": route_coords,
            "upcoming_intersections": upcoming_intersections,
            "obstruction_bypassed": simulate_obstruction,
        }
