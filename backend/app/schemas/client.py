from pydantic import BaseModel

class ClientCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None

class ClientOut(BaseModel):
    id: int
    name: str
    email: str | None
    phone: str | None

    class Config:
        from_attributes = True