from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta
from zoneinfo import ZoneInfo
from datetime import datetime
from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.appointment_service import AppointmentService
from app.models.service import Service
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.core.dependencies import get_current_user

router = APIRouter()
TZ = ZoneInfo("America/Santiago")

def now_chile() -> datetime:
    return datetime.now(TZ).replace(tzinfo=None)

def today_chile():
    return now_chile().date()

def load_appointments(db: Session):
    return db.query(Appointment).options(
        joinedload(Appointment.client),
        joinedload(Appointment.services).joinedload(AppointmentService.service)
    )

def enrich(a: Appointment) -> dict:
    total = sum(aps.service.price for aps in a.services)
    return {
        "id":         a.id,
        "start_time": a.start_time,
        "end_time":   a.end_time,
        "status":     a.status,
        "notes":      a.notes,
        "client":     a.client,
        "services":   a.services,
        "total":      total,
    }

@router.get("/", response_model=list[AppointmentOut])
def get_appointments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    appts = load_appointments(db).order_by(Appointment.start_time).all()
    return [enrich(a) for a in appts]

@router.get("/today", response_model=list[AppointmentOut])
def get_today(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today = today_chile()
    start = datetime.combine(today, datetime.min.time())
    end   = start + timedelta(days=1)
    appts = load_appointments(db).filter(
        Appointment.start_time >= start,
        Appointment.start_time < end,
        Appointment.status != AppointmentStatus.cancelled
    ).order_by(Appointment.start_time).all()
    return [enrich(a) for a in appts]

@router.post("/", response_model=AppointmentOut)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    if not data.service_ids:
        raise HTTPException(status_code=400, detail="Selecciona al menos un servicio")
    if len(data.service_ids) > 10:
        raise HTTPException(status_code=400, detail="Máximo 10 servicios por cita")

    # Verificar que todos los servicios existen y están activos
    for sid in data.service_ids:
        svc = db.query(Service).filter(Service.id == sid, Service.active == True).first()
        if not svc:
            raise HTTPException(status_code=404, detail=f"Servicio {sid} no encontrado o inactivo")

    end_time = data.start_time + timedelta(hours=1)

    # Verificar conflicto de horario
    conflict = db.query(Appointment).filter(
        Appointment.start_time < end_time,
        Appointment.end_time > data.start_time,
        Appointment.status != AppointmentStatus.cancelled
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe una cita en ese horario")

    appointment = Appointment(
        client_id  = data.client_id,
        start_time = data.start_time,
        end_time   = end_time,
        notes      = data.notes,
    )
    db.add(appointment)
    db.flush()

    for sid in data.service_ids:
        db.add(AppointmentService(appointment_id=appointment.id, service_id=sid))

    db.commit()

    appt = load_appointments(db).filter(Appointment.id == appointment.id).first()
    return enrich(appt)

@router.patch("/{id}", response_model=AppointmentOut)
def update_appointment(
    id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(appointment, k, v)
    db.commit()

    appt = load_appointments(db).filter(Appointment.id == id).first()
    return enrich(appt)

@router.delete("/{id}")
def delete_appointment(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    appointment.status = AppointmentStatus.cancelled
    db.commit()
    return {"message": "Cita cancelada"}