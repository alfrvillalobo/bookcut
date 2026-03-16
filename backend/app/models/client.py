from sqlalchemy import Column, Integer, String
from app.database import Base

class Client(Base):
    __tablename__ = "clients"

    id    = Column(Integer, primary_key=True, index=True)
    name  = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)