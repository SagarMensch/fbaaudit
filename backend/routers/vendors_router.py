"""
Vendors Router - SAP-style API for vendor/carrier management
Database = Source of Truth. Frontend only renders backend state.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import os
import asyncpg
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


# Pydantic Models
class VendorResponse(BaseModel):
    id: str
    name: str
    type: str
    contact_name: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    is_active: bool
    performance_grade: Optional[str]
    onboarding_status: Optional[str]
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class VendorListResponse(BaseModel):
    data: List[VendorResponse]
    meta: dict


class VendorDetailResponse(BaseModel):
    data: VendorResponse
    meta: dict
    contracts: Optional[List[dict]] = []


# Database connection
async def get_db():
    """Get database connection pool"""
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database not configured")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()


@router.get("", response_model=VendorListResponse)
async def get_all_vendors(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    type: Optional[str] = Query(None, description="Filter by vendor type"),
    search: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db = Depends(get_db)
):
    """
    Get all vendors from database
    
    SAP-style: Returns data + meta with allowed actions
    """
    query = "SELECT * FROM vendors WHERE 1=1"
    params = []
    param_count = 0
    
    if is_active is not None:
        param_count += 1
        query += f" AND is_active = ${param_count}"
        params.append(is_active)
    
    if type:
        param_count += 1
        query += f" AND type = ${param_count}"
        params.append(type)
    
    if search:
        param_count += 1
        query += f" AND LOWER(name) LIKE ${param_count}"
        params.append(f"%{search.lower()}%")
    
    query += f" ORDER BY name LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
    params.extend([limit, offset])
    
    rows = await db.fetch(query, *params)
    
    # Get total count
    count_query = "SELECT COUNT(*) FROM vendors WHERE is_active = true"
    total = await db.fetchval(count_query)
    
    vendors = [dict(row) for row in rows]
    
    return {
        "data": vendors,
        "meta": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "allowed_actions": ["CREATE", "EXPORT"]
        }
    }


@router.get("/{vendor_id}", response_model=VendorDetailResponse)
async def get_vendor_by_id(vendor_id: str, db = Depends(get_db)):
    """
    Get single vendor with contracts
    
    SAP-style: Returns entity + allowed actions based on status
    """
    # Get vendor
    row = await db.fetchrow("SELECT * FROM vendors WHERE id = $1", vendor_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")
    
    vendor = dict(row)
    
    # Get associated contracts
    contracts = await db.fetch(
        "SELECT id, contract_number, service_type, valid_from, valid_to, status, tolerance_pct "
        "FROM contracts WHERE vendor_id = $1 ORDER BY valid_to DESC",
        vendor_id
    )
    
    # Determine allowed actions based on status
    status = vendor.get('onboarding_status', 'PENDING')
    allowed_actions = []
    
    if status == 'ACTIVE':
        allowed_actions = ["EDIT", "VIEW_CONTRACTS", "VIEW_INVOICES", "SUSPEND"]
    elif status == 'PENDING':
        allowed_actions = ["VERIFY", "REJECT"]
    elif status == 'VERIFIED':
        allowed_actions = ["ACTIVATE", "EDIT"]
    elif status == 'SUSPENDED':
        allowed_actions = ["REACTIVATE", "TERMINATE"]
    
    return {
        "data": vendor,
        "meta": {
            "entity_id": vendor_id,
            "current_status": status,
            "allowed_actions": allowed_actions
        },
        "contracts": [dict(c) for c in contracts]
    }


@router.get("/{vendor_id}/contracts")
async def get_vendor_contracts(vendor_id: str, db = Depends(get_db)):
    """Get all contracts for a vendor with rates"""
    
    contracts = await db.fetch(
        """
        SELECT c.*, 
               (SELECT COUNT(*) FROM freight_rates fr WHERE fr.contract_id = c.id) as rate_count
        FROM contracts c 
        WHERE c.vendor_id = $1 
        ORDER BY c.valid_to DESC
        """,
        vendor_id
    )
    
    return {
        "data": [dict(c) for c in contracts],
        "meta": {
            "vendor_id": vendor_id,
            "total": len(contracts)
        }
    }


@router.get("/{vendor_id}/rates")
async def get_vendor_rates(vendor_id: str, db = Depends(get_db)):
    """Get all freight rates for a vendor's active contracts"""
    
    rates = await db.fetch(
        """
        SELECT fr.*, c.contract_number, c.vendor_name
        FROM freight_rates fr
        JOIN contracts c ON fr.contract_id = c.id
        WHERE c.vendor_id = $1 AND c.status = 'ACTIVE'
        ORDER BY fr.origin, fr.destination
        """,
        vendor_id
    )
    
    return {
        "data": [dict(r) for r in rates],
        "meta": {
            "vendor_id": vendor_id,
            "total": len(rates),
            "currency": "USD"
        }
    }


@router.get("/{vendor_id}/invoices")
async def get_vendor_invoices(
    vendor_id: str,
    status: Optional[str] = None,
    limit: int = 50,
    db = Depends(get_db)
):
    """Get invoices for a vendor"""
    
    query = """
        SELECT id, invoice_number, invoice_date, origin, destination, 
               total_amount, currency, status
        FROM invoices 
        WHERE vendor_id = $1
    """
    params = [vendor_id]
    
    if status:
        query += " AND status = $2"
        params.append(status)
    
    query += f" ORDER BY invoice_date DESC LIMIT {limit}"
    
    invoices = await db.fetch(query, *params)
    
    return {
        "data": [dict(i) for i in invoices],
        "meta": {
            "vendor_id": vendor_id,
            "total": len(invoices)
        }
    }
