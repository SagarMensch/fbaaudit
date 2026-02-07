"""Invoices Router (Requirement #2)"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from api.database import get_db
from api.models import Invoice, InvoiceStatus, Carrier, BusinessUnit

router = APIRouter()

@router.get("/")
async def get_invoices(
    status: str = None,
    carrier_id: int = None,
    business_unit_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all invoices with optional filters"""
    query = db.query(Invoice)
    
    if status:
        query = query.filter(Invoice.status == status)
    if carrier_id:
        query = query.filter(Invoice.carrier_id == carrier_id)
    if business_unit_id:
        query = query.filter(Invoice.business_unit_id == business_unit_id)
    
    return query.all()

@router.get("/{invoice_id}")
async def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get specific invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/")
async def create_invoice(invoice_data: dict, db: Session = Depends(get_db)):
    """Create new invoice (Manual/API ingestion)"""
    invoice = Invoice(**invoice_data)
    invoice.ingestion_method = "API"
    invoice.created_at = datetime.now()
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.post("/upload")
async def upload_invoice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload invoice document"""
    # TODO: Implement OCR processing
    return {"message": "Invoice uploaded", "filename": file.filename}

@router.post("/edi")
async def ingest_edi(edi_data: dict, db: Session = Depends(get_db)):
    """Ingest EDI 210 invoice"""
    invoice = Invoice(
        invoice_number=edi_data.get("invoice_number"),
        carrier_id=edi_data.get("carrier_id"),
        amount=edi_data.get("amount"),
        ingestion_method="EDI",
        status=InvoiceStatus.PENDING
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.put("/{invoice_id}")
async def update_invoice(invoice_id: int, updates: dict, db: Session = Depends(get_db)):
    """Update invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    for key, value in updates.items():
        setattr(invoice, key, value)
    
    db.commit()
    db.refresh(invoice)
    return invoice
