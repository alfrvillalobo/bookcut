from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import Base, engine

from app.models.appointment import Barber, Appointment
from app.models.appointment_service import AppointmentService
from app.models.service import Service
from app.models.client import Client

from app.routers import auth, appointments, services, clients, public, stats

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(public.router,       prefix="/public",       tags=["Público"])
app.include_router(appointments.router, prefix="/appointments", tags=["Citas"])
app.include_router(services.router,     prefix="/services",     tags=["Servicios"])
app.include_router(clients.router,      prefix="/clients",      tags=["Clientes"])
app.include_router(stats.router,        prefix="/stats",        tags=["Stats"])

@app.get("/")
def root():
    return {"app": settings.APP_NAME, "status": "ok"}