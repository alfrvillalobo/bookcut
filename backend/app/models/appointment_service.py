from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AppointmentService(Base):
    __tablename__ = "appointment_services"

    id             = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    service_id     = Column(Integer, ForeignKey("services.id"), nullable=False)

    service = relationship("Service")