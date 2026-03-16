from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientOut
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=list[ClientOut])
def get_clients(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Client).all()

@router.post("/", response_model=ClientOut)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.patch("/{id}", response_model=ClientOut)
def update_client(
    id: int,
    data: ClientCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(client, k, v)
    db.commit()
    db.refresh(client)
    return client

@router.delete("/{id}")
def delete_client(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    from app.models.appointment import Appointment, AppointmentStatus
    client = db.query(Client).filter(Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    citas_activas = db.query(Appointment).filter(
        Appointment.client_id == id,
        Appointment.status.in_([AppointmentStatus.confirmed, AppointmentStatus.pending])
    ).count()

    if citas_activas > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar. El cliente tiene {citas_activas} cita(s) activa(s)."
        )

    db.delete(client)
    db.commit()
    return {"message": "Cliente eliminado"}