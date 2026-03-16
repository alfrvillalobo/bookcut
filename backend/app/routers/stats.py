from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.appointment_service import AppointmentService
from app.core.dependencies import get_current_user

router = APIRouter()
TZ = ZoneInfo("America/Santiago")

def today_chile() -> date:
    return datetime.now(TZ).date()

def load_completed(db: Session, start: datetime, end: datetime):
    return db.query(Appointment).filter(
        Appointment.start_time >= start,
        Appointment.start_time < end,
        Appointment.status == AppointmentStatus.completed
    ).options(
        joinedload(Appointment.services).joinedload(AppointmentService.service)
    ).all()

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today = today_chile()
    start = datetime.combine(today, datetime.min.time())
    end   = start + timedelta(days=1)

    citas_hoy = db.query(Appointment).filter(
        Appointment.start_time >= start,
        Appointment.start_time < end,
        Appointment.status != AppointmentStatus.cancelled
    ).count()

    citas_mes = db.query(Appointment).filter(
        Appointment.start_time >= datetime(today.year, today.month, 1),
        Appointment.status != AppointmentStatus.cancelled
    ).count()

    citas_semana = []
    for i in range(6, -1, -1):
        dia = today - timedelta(days=i)
        count = db.query(Appointment).filter(
            Appointment.start_time >= datetime.combine(dia, datetime.min.time()),
            Appointment.start_time < datetime.combine(dia, datetime.min.time()) + timedelta(days=1),
            Appointment.status != AppointmentStatus.cancelled
        ).count()
        citas_semana.append({"date": dia.isoformat(), "citas": count})

    return {
        "citas_hoy": citas_hoy,
        "citas_mes": citas_mes,
        "semana":    citas_semana,
    }

@router.get("/ingresos")
def get_ingresos(db: Session = Depends(get_db), _=Depends(get_current_user)):
    today = today_chile()

    # Semana: lunes a domingo
    dias_desde_lunes = today.weekday()  # 0=lun, 6=dom
    inicio_semana = today - timedelta(days=dias_desde_lunes)
    fin_semana    = inicio_semana + timedelta(days=7)

    citas_semana    = load_completed(db,
        datetime.combine(inicio_semana, datetime.min.time()),
        datetime.combine(fin_semana,    datetime.min.time()),
    )
    ingresos_semana = sum(aps.service.price for a in citas_semana for aps in a.services)

    # Mes: día 1 al último día del mes
    inicio_mes = datetime(today.year, today.month, 1)
    if today.month == 12:
        fin_mes = datetime(today.year + 1, 1, 1)
    else:
        fin_mes = datetime(today.year, today.month + 1, 1)

    citas_mes    = load_completed(db, inicio_mes, fin_mes)
    ingresos_mes = sum(aps.service.price for a in citas_mes for aps in a.services)

    # Gráfico: ingresos por día esta semana (lun a hoy)
    ingresos_por_dia = []
    for i in range(dias_desde_lunes + 1):
        dia      = inicio_semana + timedelta(days=i)
        citas_dia = load_completed(db,
            datetime.combine(dia, datetime.min.time()),
            datetime.combine(dia, datetime.min.time()) + timedelta(days=1),
        )
        ingresos_por_dia.append({
            "date":     dia.isoformat(),
            "ingresos": sum(aps.service.price for a in citas_dia for aps in a.services),
        })

    return {
        "ingresos_semana": ingresos_semana,
        "ingresos_mes":    ingresos_mes,
        "por_dia":         ingresos_por_dia,
    }