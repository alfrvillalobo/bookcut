from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=list[ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return db.query(Service).filter(Service.active == True).all()

@router.post("/", response_model=ServiceOut)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    if len(data.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nombre debe tener al menos 2 caracteres")
    if data.price <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")
    service = Service(name=data.name, description=data.description, price=data.price, duration=60)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.patch("/{id}", response_model=ServiceOut)
def update_service(
    id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if data.name and len(data.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nombre debe tener al menos 2 caracteres")
    if data.price and data.price <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor a 0")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(service, k, v)
    db.commit()
    db.refresh(service)
    return service

@router.delete("/{id}")
def delete_service(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    service.active = False
    db.commit()
    return {"message": "Servicio eliminado"}