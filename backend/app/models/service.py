from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base

class Service(Base):
    __tablename__ = "services"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    description = Column(String, nullable=True)
    duration    = Column(Integer, nullable=False)  # minutos
    price       = Column(Float, nullable=False)
    active      = Column(Boolean, default=True)