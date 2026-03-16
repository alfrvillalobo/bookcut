import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.appointment import Barber
from app.models.service import Service
from app.models.client import Client
from app.models.appointment_service import AppointmentService
from app.core.security import hash_password

def seed():
    db = SessionLocal()
    try:
        # Crear barbero si no existe
        existing = db.query(Barber).filter(Barber.email == "admin@bookcut.com").first()
        if not existing:
            barber = Barber(
                name     = "Alfredo Villalobos",
                email    = "admin@bookcut.com",
                password = hash_password("bookcut2026"),
            )
            db.add(barber)
            db.commit()
            print("✅ Barbero creado: admin@bookcut.com")
        else:
            print("ℹ️  Barbero ya existe, omitiendo.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()