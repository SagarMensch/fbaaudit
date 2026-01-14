"""
Atlas Master Data Router for FastAPI
=====================================
Carrier, Route, and Vendor Master Data Management
Connected to PostgreSQL (Supabase)
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import psycopg2
import psycopg2.extras
from datetime import datetime
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/master", tags=["Master Data"])

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    """Get PostgreSQL connection"""
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        logger.error(f"[DB] Connection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {e}")


def get_dict_cursor(conn):
    """Get dictionary cursor"""
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CarrierCreate(BaseModel):
    carrier_code: str = Field(..., min_length=2, max_length=20)
    carrier_name: str = Field(..., min_length=2, max_length=100)
    carrier_type: str = Field(default="TRANSPORTER")
    gstin: Optional[str] = None
    pan: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True


class CarrierResponse(BaseModel):
    id: str
    carrier_code: str
    carrier_name: str
    carrier_type: Optional[str]
    gstin: Optional[str]
    is_active: bool


class RouteCreate(BaseModel):
    origin_city: str
    destination_city: str
    distance_km: float
    transit_days: int = 1
    route_type: str = "ROAD"


class VendorCreate(BaseModel):
    vendor_code: str
    vendor_name: str
    vendor_type: str = "SUPPLIER"
    gstin: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: bool = True


# ============================================================================
# CARRIER ENDPOINTS
# ============================================================================

@router.get("/carriers")
async def get_carriers(active_only: bool = Query(True)):
    """Get all carriers"""
    try:
        conn = get_db_connection()
        cursor = get_dict_cursor(conn)
        
        if active_only:
            cursor.execute("SELECT * FROM carriers WHERE is_active = true ORDER BY carrier_name")
        else:
            cursor.execute("SELECT * FROM carriers ORDER BY carrier_name")
        
        carriers = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "carriers": [dict(c) for c in carriers],
            "count": len(carriers)
        }
    except Exception as e:
        logger.error(f"[API] Error fetching carriers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/carriers")
async def create_carrier(carrier: CarrierCreate):
    """Create or update a carrier"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        import uuid
        carrier_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO carriers (id, carrier_code, carrier_name, carrier_type, gstin, pan, 
                                  contact_email, contact_phone, address, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (carrier_code) DO UPDATE SET
                carrier_name = EXCLUDED.carrier_name,
                carrier_type = EXCLUDED.carrier_type,
                gstin = EXCLUDED.gstin,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING id
        """, (
            carrier_id, carrier.carrier_code, carrier.carrier_name, carrier.carrier_type,
            carrier.gstin, carrier.pan, carrier.contact_email, carrier.contact_phone,
            carrier.address, carrier.is_active
        ))
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "carrier_id": result[0] if result else carrier_id,
            "message": "Carrier created/updated successfully"
        }
    except Exception as e:
        logger.error(f"[API] Error creating carrier: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/carriers/{carrier_code}")
async def get_carrier(carrier_code: str):
    """Get carrier by code"""
    try:
        conn = get_db_connection()
        cursor = get_dict_cursor(conn)
        
        cursor.execute("SELECT * FROM carriers WHERE carrier_code = %s", (carrier_code,))
        carrier = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if carrier:
            return {"success": True, "carrier": dict(carrier)}
        else:
            raise HTTPException(status_code=404, detail="Carrier not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error fetching carrier: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ROUTE ENDPOINTS
# ============================================================================

@router.get("/routes")
async def get_routes():
    """Get all routes"""
    try:
        conn = get_db_connection()
        cursor = get_dict_cursor(conn)
        
        cursor.execute("SELECT * FROM routes ORDER BY origin_city, destination_city")
        routes = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "routes": [dict(r) for r in routes],
            "count": len(routes)
        }
    except Exception as e:
        logger.error(f"[API] Error fetching routes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/routes")
async def create_route(route: RouteCreate):
    """Create a new route"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        import uuid
        route_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO routes (id, origin_city, destination_city, distance_km, transit_days, route_type, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (route_id, route.origin_city, route.destination_city, route.distance_km, 
              route.transit_days, route.route_type))
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "route_id": result[0] if result else route_id,
            "message": "Route created successfully"
        }
    except Exception as e:
        logger.error(f"[API] Error creating route: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# VENDOR ENDPOINTS
# ============================================================================

@router.get("/vendors")
async def get_vendors(active_only: bool = Query(True)):
    """Get all vendors"""
    try:
        conn = get_db_connection()
        cursor = get_dict_cursor(conn)
        
        if active_only:
            cursor.execute("SELECT * FROM vendors WHERE is_active = true ORDER BY vendor_name")
        else:
            cursor.execute("SELECT * FROM vendors ORDER BY vendor_name")
        
        vendors = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "vendors": [dict(v) for v in vendors],
            "count": len(vendors)
        }
    except Exception as e:
        logger.error(f"[API] Error fetching vendors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vendors")
async def create_vendor(vendor: VendorCreate):
    """Create or update a vendor"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        import uuid
        vendor_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO vendors (id, vendor_code, vendor_name, vendor_type, gstin, contact_email, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (vendor_code) DO UPDATE SET
                vendor_name = EXCLUDED.vendor_name,
                vendor_type = EXCLUDED.vendor_type,
                gstin = EXCLUDED.gstin,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING id
        """, (vendor_id, vendor.vendor_code, vendor.vendor_name, vendor.vendor_type,
              vendor.gstin, vendor.contact_email, vendor.is_active))
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "vendor_id": result[0] if result else vendor_id,
            "message": "Vendor created/updated successfully"
        }
    except Exception as e:
        logger.error(f"[API] Error creating vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DATABASE STATUS
# ============================================================================

@router.get("/db-status")
async def db_status():
    """Check database connection status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return {
            "status": "connected",
            "database": "PostgreSQL (Supabase)",
            "version": version
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e)
        }
