from pydantic import BaseModel

class ServiceCreate(BaseModel):
    name: str
    description: str | None = None
    price: float

class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    active: bool | None = None

class ServiceOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    active: bool

    class Config:
        from_attributes = True