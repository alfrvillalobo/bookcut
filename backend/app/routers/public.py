from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.schemas.service import ServiceOut

router = APIRouter()

@router.get("/services", response_model=list[ServiceOut])
def get_public_services(db: Session = Depends(get_db)):
    return db.query(Service).filter(Service.active == True).all()

@router.get("/availability")
def get_availability(fecha: str, db: Session = Depends(get_db)):
    try:
        day = date.fromisoformat(fecha)
    except ValueError:
        return {"error": "Fecha inválida. Formato: YYYY-MM-DD"}

    # Horario: 12:00 a 22:00, slots de 1 hora
    slots = []
    current = datetime.combine(day, datetime.min.time()).replace(hour=12, minute=0)
    end_of_day = datetime.combine(day, datetime.min.time()).replace(hour=23, minute=0)

    # Citas existentes ese día
    appointments = db.query(Appointment).filter(
        Appointment.start_time >= datetime.combine(day, datetime.min.time()),
        Appointment.start_time < datetime.combine(day, datetime.min.time()) + timedelta(days=1),
        Appointment.status != AppointmentStatus.cancelled
    ).all()

    while current < end_of_day:
        slot_end = current + timedelta(hours=1)
        is_taken = any(
            a.start_time < slot_end and a.end_time > current
            for a in appointments
        )
        slots.append({
            "time": current.strftime("%H:%M"),
            "available": not is_taken
        })
        current = slot_end

    return {"date": fecha, "slots": slots}
