import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import Route, EmergencyRequest
from backend.app.schemas.schemas import RouteCalculateRequest, RouteOut
from backend.app.services.route_optimizer import RouteOptimizer

router = APIRouter(prefix="/api/routes", tags=["Routing"])
optimizer = RouteOptimizer()

@router.post("/calculate", response_model=RouteOut)
def calculate_route(req: RouteCalculateRequest, db: Session = Depends(get_db)):
    result = optimizer.get_route(
        src_lat=req.source_latitude,
        src_lon=req.source_longitude,
        dst_lat=req.destination_latitude,
        dst_lon=req.destination_longitude,
        simulate_obstruction=req.simulate_obstruction or False,
    )

    route_db_id = None
    if req.emergency_request_id:
        em = db.query(EmergencyRequest).filter(EmergencyRequest.id == req.emergency_request_id).first()
        if em:
            # Check if route already exists for this emergency request
            existing_route = db.query(Route).filter(Route.emergency_request_id == em.id).first()
            geom_str = json.dumps(result["route_geometry"])
            if existing_route:
                existing_route.distance = result["distance"]
                existing_route.estimated_duration = result["estimated_duration"]
                existing_route.route_geometry = geom_str
                db.commit()
                db.refresh(existing_route)
                route_db_id = existing_route.id
            else:
                new_route = Route(
                    emergency_request_id=em.id,
                    distance=result["distance"],
                    estimated_duration=result["estimated_duration"],
                    route_geometry=geom_str,
                )
                db.add(new_route)
                db.commit()
                db.refresh(new_route)
                route_db_id = new_route.id

    return {
        "id": route_db_id,
        "emergency_request_id": req.emergency_request_id,
        "distance": result["distance"],
        "estimated_duration": result["estimated_duration"],
        "route_geometry": result["route_geometry"],
        "upcoming_intersections": result["upcoming_intersections"],
    }

@router.get("/{request_id}", response_model=RouteOut)
def get_route_by_emergency_id(request_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.emergency_request_id == request_id).first()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found for this emergency")

    geom = json.loads(route.route_geometry)
    return {
        "id": route.id,
        "emergency_request_id": route.emergency_request_id,
        "distance": route.distance,
        "estimated_duration": route.estimated_duration,
        "route_geometry": geom,
        "upcoming_intersections": [],
        "created_at": route.created_at,
    }
