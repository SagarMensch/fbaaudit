"""
Data API Router - Database-backed endpoints
============================================
Provides REST endpoints for vendors, rate_cards, payment_batches, and analytics.
All data comes from PostgreSQL - NO MOCK DATA.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Data"])


# =====================================================
# VENDORS ENDPOINTS
# =====================================================

@router.get("/vendors")
async def list_vendors(status: str = None, limit: int = 100):
    """Get all vendors from PostgreSQL database."""
    try:
        from services.db_service import get_db_connection, get_cursor
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = get_cursor(conn)
        
        if status:
            cursor.execute("""
                SELECT id, name, code, vendor_type, gst_number, pan_number, 
                       contact_email, contact_phone, city, state, pincode,
                       bank_name, bank_account, ifsc_code, performance_score, status, created_at
                FROM vendors
                WHERE status = %s
                ORDER BY name
                LIMIT %s
            """, (status.upper(), limit))
        else:
            cursor.execute("""
                SELECT id, name, code, vendor_type, gst_number, pan_number,
                       contact_email, contact_phone, city, state, pincode,
                       bank_name, bank_account, ifsc_code, performance_score, status, created_at
                FROM vendors
                ORDER BY name
                LIMIT %s
            """, (limit,))
        
        vendors = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = []
        for v in vendors:
            result.append({
                "id": v["id"],
                "name": v["name"],
                "code": v["code"],
                "vendorType": v["vendor_type"],
                "gstNumber": v["gst_number"],
                "panNumber": v["pan_number"],
                "email": v["contact_email"],
                "phone": v["contact_phone"],
                "city": v["city"],
                "state": v["state"],
                "pincode": v["pincode"],
                "bankName": v["bank_name"],
                "bankAccount": v["bank_account"],
                "ifscCode": v["ifsc_code"],
                "performanceScore": v["performance_score"],
                "status": v["status"],
            })
        
        logger.info(f"[API] Returning {len(result)} vendors from database")
        return {"success": True, "vendors": result, "count": len(result)}
        
    except Exception as e:
        logger.error(f"[API] Error fetching vendors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: str):
    """Get a single vendor by ID."""
    try:
        from services.db_service import get_db_connection, get_cursor
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = get_cursor(conn)
        cursor.execute("""
            SELECT id, name, code, vendor_type, gst_number, pan_number,
                   contact_email, contact_phone, address, city, state, pincode,
                   bank_name, bank_account, ifsc_code, performance_score, status, created_at
            FROM vendors
            WHERE id = %s
        """, (vendor_id,))
        
        v = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not v:
            raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")
        
        return {
            "success": True,
            "vendor": {
                "id": v["id"],
                "name": v["name"],
                "code": v["code"],
                "vendorType": v["vendor_type"],
                "gstNumber": v["gst_number"],
                "panNumber": v["pan_number"],
                "email": v["contact_email"],
                "phone": v["contact_phone"],
                "address": v["address"],
                "city": v["city"],
                "state": v["state"],
                "pincode": v["pincode"],
                "bankName": v["bank_name"],
                "bankAccount": v["bank_account"],
                "ifscCode": v["ifsc_code"],
                "performanceScore": v["performance_score"],
                "status": v["status"],
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error fetching vendor {vendor_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# RATE CARDS ENDPOINTS
# =====================================================

@router.get("/rate-cards")
async def list_rate_cards(carrier: str = None, status: str = None, limit: int = 100):
    """Get all rate cards from PostgreSQL database."""
    try:
        from services.db_service import get_db_connection, get_cursor
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = get_cursor(conn)
        
        query = """
            SELECT id, carrier, contract_ref, origin, destination, container_type,
                   rate, currency, unit, valid_from, valid_to, status, created_at
            FROM rate_cards
            WHERE 1=1
        """
        params = []
        
        if carrier:
            query += " AND carrier ILIKE %s"
            params.append(f"%{carrier}%")
        if status:
            query += " AND status = %s"
            params.append(status.upper())
        
        query += " ORDER BY carrier, origin LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        rate_cards = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = []
        for rc in rate_cards:
            result.append({
                "id": rc["id"],
                "carrier": rc["carrier"],
                "contractRef": rc["contract_ref"],
                "origin": rc["origin"],
                "destination": rc["destination"],
                "containerType": rc["container_type"],
                "rate": float(rc["rate"]) if rc["rate"] else 0,
                "currency": rc["currency"] or "INR",
                "unit": rc["unit"],
                "validFrom": str(rc["valid_from"]) if rc["valid_from"] else None,
                "validTo": str(rc["valid_to"]) if rc["valid_to"] else None,
                "status": rc["status"],
            })
        
        logger.info(f"[API] Returning {len(result)} rate cards from database")
        return {"success": True, "rateCards": result, "count": len(result)}
        
    except Exception as e:
        logger.error(f"[API] Error fetching rate cards: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# PAYMENT BATCHES ENDPOINTS
# =====================================================

@router.get("/payment-batches")
async def list_payment_batches(status: str = None, limit: int = 100):
    """Get all payment batches from PostgreSQL database."""
    try:
        from services.db_service import get_db_connection, get_cursor
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = get_cursor(conn)
        
        if status:
            cursor.execute("""
                SELECT id, batch_name, vendor_id, vendor_name, total_amount, invoice_count,
                       status, payment_method, bank_reference, scheduled_date, processed_date, created_at
                FROM payment_batches
                WHERE status = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (status.upper(), limit))
        else:
            cursor.execute("""
                SELECT id, batch_name, vendor_id, vendor_name, total_amount, invoice_count,
                       status, payment_method, bank_reference, scheduled_date, processed_date, created_at
                FROM payment_batches
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
        
        batches = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = []
        for b in batches:
            result.append({
                "id": b["id"],
                "batchName": b["batch_name"],
                "vendorId": b["vendor_id"],
                "vendorName": b["vendor_name"],
                "totalAmount": float(b["total_amount"]) if b["total_amount"] else 0,
                "invoiceCount": b["invoice_count"],
                "status": b["status"],
                "paymentMethod": b["payment_method"],
                "bankReference": b["bank_reference"],
                "scheduledDate": str(b["scheduled_date"]) if b["scheduled_date"] else None,
                "processedDate": str(b["processed_date"]) if b["processed_date"] else None,
            })
        
        logger.info(f"[API] Returning {len(result)} payment batches from database")
        return {"success": True, "batches": result, "count": len(result)}
        
    except Exception as e:
        logger.error(f"[API] Error fetching payment batches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ANALYTICS / KPIs ENDPOINTS
# =====================================================

@router.get("/analytics/kpis")
async def get_kpis():
    """
    Calculate real KPIs from database.
    Replaces hardcoded KPIS constant.
    """
    try:
        from services.db_service import get_db_connection, get_cursor
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = get_cursor(conn)
        
        # Total Spend (sum of all approved invoices)
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'APPROVED'")
        total_spend = cursor.fetchone()["total"]
        
        # Pending Amount
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'PENDING'")
        pending_amount = cursor.fetchone()["total"]
        
        # Invoice counts by status
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM invoices 
            GROUP BY status
        """)
        status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}
        
        # Exceptions count
        exception_count = status_counts.get("EXCEPTION", 0)
        
        # Total invoices
        total_invoices = sum(status_counts.values())
        
        # Touchless rate (approved without exception)
        approved_count = status_counts.get("APPROVED", 0)
        touchless_rate = (approved_count / total_invoices * 100) if total_invoices > 0 else 0
        
        cursor.close()
        conn.close()
        
        kpis = [
            {
                "label": "TOTAL SPEND (YTD)",
                "value": f"₹{total_spend:,.0f}",
                "subtext": f"From {approved_count} approved invoices",
                "trend": "neutral",
                "color": "blue"
            },
            {
                "label": "PENDING AMOUNT",
                "value": f"₹{pending_amount:,.0f}",
                "subtext": f"{status_counts.get('PENDING', 0)} invoices awaiting",
                "trend": "neutral",
                "color": "orange"
            },
            {
                "label": "TOUCHLESS RATE",
                "value": f"{touchless_rate:.1f}%",
                "subtext": f"Target: 85%",
                "trend": "up" if touchless_rate > 50 else "down",
                "color": "teal"
            },
            {
                "label": "OPEN EXCEPTIONS",
                "value": str(exception_count),
                "subtext": "Require manual review",
                "trend": "down" if exception_count < 5 else "up",
                "color": "red"
            }
        ]
        
        logger.info(f"[API] Returning calculated KPIs from database")
        return {"success": True, "kpis": kpis}
        
    except Exception as e:
        logger.error(f"[API] Error calculating KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
