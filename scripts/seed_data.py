import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import seed_database
from backend.app.database.database import SessionLocal
from backend.app.models.models import User, EmergencyVehicle, Intersection

def run_seed():
    print("Running database seeder...")
    seed_database()
    db = SessionLocal()
    try:
        users = db.query(User).all()
        vehicles = db.query(EmergencyVehicle).all()
        intersections = db.query(Intersection).all()
        print(f"Seeding verified:")
        print(f" - Users ({len(users)}): {[u.username for u in users]}")
        print(f" - Vehicles ({len(vehicles)}): {[v.vehicle_id for v in vehicles]}")
        print(f" - Intersections ({len(intersections)}): {[i.intersection_name for i in intersections]}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
