"""Rate Files Router (Requirement #1)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from api.database import get_db
from api.models import RateFile, Carrier, BIDType

router = APIRouter()

@router.get("/")
async def get_rate_files(db: Session = Depends(get_db)):
    """Get all rate files"""
    return db.query(RateFile).filter(RateFile.is_active == True).all()

@router.get("/{rate_id}")
async def get_rate_file(rate_id: int, db: Session = Depends(get_db)):
    """Get specific rate file"""
    rate = db.query(RateFile).filter(RateFile.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate file not found")
    return rate

@router.get("/search")
async def search_rates(
    origin: str = None,
    destination: str = None,
    carrier_id: int = None,
    db: Session = Depends(get_db)
):
    """Search rates by origin/destination/carrier"""
    query = db.query(RateFile).filter(RateFile.is_active == True)
    
    if origin:
        query = query.filter(RateFile.origin_code == origin)
    if destination:
        query = query.filter(RateFile.destination_code == destination)
    if carrier_id:
        query = query.filter(RateFile.carrier_id == carrier_id)
    
    return query.all()

@router.post("/")
async def create_rate_file(rate_data: dict, db: Session = Depends(get_db)):
    """Create new rate file"""
    rate = RateFile(**rate_data)
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate
