from pydantic import BaseModel, field_validator
from datetime import datetime
from app.models.appointment import AppointmentStatus
from app.schemas.client import ClientOut
from app.schemas.service import ServiceOut

class AppointmentCreate(BaseModel):
    client_id:   int
    service_ids: list[int]
    start_time:  datetime
    notes:       str | None = None

    @field_validator("service_ids")
    @classmethod
    def validate_services(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Selecciona al menos un servicio")
        return v

    @field_validator("client_id")
    @classmethod
    def validate_client(cls, v):
        if not v or v == 0:
            raise ValueError("Selecciona un cliente")
        return v

class AppointmentUpdate(BaseModel):
    status:     AppointmentStatus | None = None
    notes:      str | None = None
    start_time: datetime | None = None

class AppointmentServiceOut(BaseModel):
    service: ServiceOut
    class Config:
        from_attributes = True

class AppointmentOut(BaseModel):
    id:         int
    start_time: datetime
    end_time:   datetime
    status:     AppointmentStatus
    notes:      str | None
    client:     ClientOut
    services:   list[AppointmentServiceOut]
    total:      float = 0

    class Config:
        from_attributes = True