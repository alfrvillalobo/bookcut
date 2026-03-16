from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class AppointmentStatus(str, enum.Enum):
    pending   = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"

class Barber(Base):
    __tablename__ = "barbers"

    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String, nullable=False)
    email    = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

class Appointment(Base):
    __tablename__ = "appointments"

    id         = Column(Integer, primary_key=True, index=True)
    client_id  = Column(Integer, ForeignKey("clients.id"), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time   = Column(DateTime, nullable=False, index=True)
    status     = Column(Enum(AppointmentStatus), default=AppointmentStatus.confirmed)
    notes      = Column(String, nullable=True)

    client   = relationship("Client")
    services = relationship("AppointmentService", cascade="all, delete-orphan")