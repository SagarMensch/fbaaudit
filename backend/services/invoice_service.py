"""
Invoice Service - PostgreSQL Integration (Supabase)
===================================================
CRUD operations for invoices from Supabase/PostgreSQL database.
Handles invoice lifecycle from OCR to payment.
"""

import psycopg2
from psycopg2 import Error
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
from datetime import datetime
import json
import os

# Import database config
from db_config import DATABASE_URL

def get_connection():
    """Get PostgreSQL connection with database"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set in environment or db_config.py")
    return psycopg2.connect(DATABASE_URL)

class InvoiceServiceDB:
    """
    Invoice Service with PostgreSQL backend.
    """
    
    def get_all_invoices(self, 
                         status: Optional[str] = None, 
                         vendor_id: Optional[str] = None,
                         limit: int = 100,
                         offset: int = 0) -> List[Dict]:
        """Get all invoices with optional filtering"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = "SELECT * FROM invoices WHERE 1=1"
            params = []
            
            if status:
                query += " AND status = %s"
                params.append(status)
            
            if vendor_id:
                query += " AND vendor_id = %s"
                params.append(vendor_id)
            
            query += " ORDER BY invoice_date DESC, created_at DESC"
            query += " LIMIT %s OFFSET %s"
            params.append(limit)
            params.append(offset)
            
            cursor.execute(query, tuple(params))
            invoices = cursor.fetchall()
            
            # Post-process JSON fields if they are returned as strings (psycopg2 usually handles jsonb automatically)
            # But just in case, we check types
            processed_invoices = []
            for invoice in invoices:
                # Convert datetime types for JSON serialization compatibility
                for key, val in invoice.items():
                    if isinstance(val, datetime):
                        invoice[key] = val.isoformat()
                
                # Psycopg2 with JSONB automatically returns dicts, no need to json.loads unless it's text
                processed_invoices.append(invoice)
            
            cursor.close()
            conn.close()
            
            return processed_invoices
            
        except Error as e:
            print(f"Error fetching invoices: {e}")
            return []
    
    def get_invoice_by_id(self, invoice_id: str) -> Optional[Dict]:
        """Get a single invoice by ID"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
            invoice = cursor.fetchone()
            
            if not invoice:
                cursor.close()
                conn.close()
                return None
            
            # Serialize datetimes
            for key, val in invoice.items():
                if isinstance(val, datetime):
                    invoice[key] = val.isoformat()
            
            cursor.close()
            conn.close()
            
            return invoice
            
        except Error as e:
            print(f"Error fetching invoice {invoice_id}: {e}")
            return None
    
    def create_invoice(self, invoice_data: Dict) -> Optional[str]:
        """Create a new invoice"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            invoice_id = invoice_data.get('id') or f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Calculate amounts
            base_amount = float(invoice_data.get('base_amount', 0) or invoice_data.get('amount', 0))
            tax_amount = float(invoice_data.get('tax_amount', 0))
            total_amount = float(invoice_data.get('total_amount', base_amount + tax_amount))
            
            cursor.execute("""
                INSERT INTO invoices (
                    id, invoice_number, invoice_date, due_date,
                    vendor_id, vendor_name, vendor_gstin,
                    contract_id, shipment_id, po_number,
                    origin, destination, vehicle_number, vehicle_type, lr_number,
                    base_amount, fuel_surcharge, accessorial_charges, other_charges,
                    subtotal, cgst_amount, sgst_amount, igst_amount, tds_amount,
                    total_amount, currency, status,
                    ocr_confidence, ocr_raw_text, ocr_processed_at,
                    invoice_path, lr_path, pod_path, supporting_docs, line_items
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
            """, (
                invoice_id,
                invoice_data.get('invoice_number'),
                invoice_data.get('invoice_date'),
                invoice_data.get('due_date'),
                invoice_data.get('vendor_id'),
                invoice_data.get('vendor_name'),
                invoice_data.get('vendor_gstin'),
                invoice_data.get('contract_id'),
                invoice_data.get('shipment_id'),
                invoice_data.get('po_number'),
                invoice_data.get('origin'),
                invoice_data.get('destination'),
                invoice_data.get('vehicle_number'),
                invoice_data.get('vehicle_type'),
                invoice_data.get('lr_number'),
                base_amount,
                invoice_data.get('fuel_surcharge', 0),
                invoice_data.get('accessorial_charges', 0),
                invoice_data.get('other_charges', 0),
                invoice_data.get('subtotal', base_amount),
                invoice_data.get('cgst_amount', 0),
                invoice_data.get('sgst_amount', 0),
                invoice_data.get('igst_amount', 0),
                invoice_data.get('tds_amount', 0),
                total_amount,
                invoice_data.get('currency', 'INR'),
                invoice_data.get('status', 'PENDING_OCR'),
                invoice_data.get('ocr_confidence'),
                invoice_data.get('ocr_raw_text'),
                datetime.now() if invoice_data.get('ocr_raw_text') else None,
                invoice_data.get('invoice_path'),
                invoice_data.get('lr_path'),
                invoice_data.get('pod_path'),
                json.dumps(invoice_data.get('supporting_docs', {})), # JSONB accepts json string
                json.dumps(invoice_data.get('line_items', []))       # JSONB accepts json string
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return invoice_id
            
        except Error as e:
            print(f"Error creating invoice: {e}")
            return None
    
    def update_invoice(self, invoice_id: str, updates: Dict) -> bool:
        """Update an existing invoice"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            fields = []
            values = []
            
            updatable_fields = [
                'invoice_number', 'invoice_date', 'due_date', 'vendor_id', 'vendor_name',
                'contract_id', 'origin', 'destination', 'vehicle_number', 'lr_number',
                'base_amount', 'total_amount', 'status', 'ocr_confidence', 'ocr_raw_text',
                'sentinel_passed', 'contract_matched', 'contract_rate', 'rate_variance',
                'approved_by', 'rejection_reason', 'invoice_path', 'lr_path', 'pod_path'
            ]
            
            for field in updatable_fields:
                if field in updates:
                    fields.append(f"{field} = %s")
                    values.append(updates[field])
            
            # Handle JSON fields specially
            if 'sentinel_results' in updates:
                fields.append("sentinel_results = %s")
                values.append(json.dumps(updates['sentinel_results']))
            
            if 'line_items' in updates:
                fields.append("line_items = %s")
                values.append(json.dumps(updates['line_items']))
            
            if not fields:
                return False
            
            values.append(invoice_id)
            query = f"UPDATE invoices SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s"
            
            cursor.execute(query, tuple(values))
            conn.commit()
            
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error updating invoice: {e}")
            return False
    
    def update_invoice_status(self, invoice_id: str, status: str, 
                               approved_by: str = None, 
                               rejection_reason: str = None) -> bool:
        """Update invoice status (approve/reject workflow)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            if status == 'APPROVED':
                cursor.execute("""
                    UPDATE invoices 
                    SET status = %s, approved_by = %s, approved_at = NOW(), updated_at = NOW()
                    WHERE id = %s
                """, (status, approved_by, invoice_id))
            elif status == 'REJECTED':
                cursor.execute("""
                    UPDATE invoices 
                    SET status = %s, rejection_reason = %s, updated_at = NOW()
                    WHERE id = %s
                """, (status, rejection_reason, invoice_id))
            else:
                cursor.execute("""
                    UPDATE invoices SET status = %s, updated_at = NOW() WHERE id = %s
                """, (status, invoice_id))
            
            conn.commit()
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error updating invoice status: {e}")
            return False
    
    def save_sentinel_results(self, invoice_id: str, results: Dict, passed: bool) -> bool:
        """Save Atlas Sentinel validation results"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE invoices 
                SET sentinel_results = %s, sentinel_passed = %s, sentinel_validated_at = NOW(),
                    status = CASE WHEN %s THEN 'PENDING_APPROVAL' ELSE 'PENDING_VALIDATION' END,
                    updated_at = NOW()
                WHERE id = %s
            """, (json.dumps(results), passed, passed, invoice_id))
            
            conn.commit()
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error saving sentinel results: {e}")
            return False
    
    def get_invoice_stats(self, vendor_id: str = None) -> Dict:
        """Get invoice statistics"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            stats = {}
            where_clause = ""
            params = []
            
            if vendor_id:
                where_clause = "WHERE vendor_id = %s"
                params = [vendor_id]
            
            # Count by status
            cursor.execute(f"""
                SELECT status, COUNT(*) as count, SUM(total_amount) as total
                FROM invoices {where_clause}
                GROUP BY status
            """, tuple(params))
            
            stats['by_status'] = {}
            for row in cursor.fetchall():
                # row is tuple because we used standard cursor here
                status_key = row[0] if row[0] else 'UNKNOWN'
                stats['by_status'][status_key] = {
                    'count': row[1],
                    'total': float(row[2]) if row[2] else 0
                }
            
            # Total counts
            cursor.execute(f"SELECT COUNT(*), SUM(total_amount) FROM invoices {where_clause}", tuple(params))
            row = cursor.fetchone()
            stats['total_count'] = row[0]
            stats['total_amount'] = float(row[1]) if row[1] else 0
            
            # Pending amount
            cursor.execute(f"""
                SELECT COUNT(*), SUM(total_amount) 
                FROM invoices 
                {where_clause + ' AND' if where_clause else 'WHERE'} 
                status IN ('PENDING_OCR', 'PENDING_VALIDATION', 'PENDING_APPROVAL')
            """, tuple(params))
            row = cursor.fetchone()
            stats['pending_count'] = row[0]
            stats['pending_amount'] = float(row[1]) if row[1] else 0
            
            cursor.close()
            conn.close()
            
            return stats
            
        except Error as e:
            print(f"Error getting invoice stats: {e}")
            return {}


# Singleton instance
invoice_service_db = InvoiceServiceDB()


# ===================================
# API ENDPOINT FUNCTIONS
# ===================================

def api_get_invoices(status: str = None, vendor_id: str = None, limit: int = 100, offset: int = 0) -> Dict:
    """API: Get all invoices"""
    invoices = invoice_service_db.get_all_invoices(status, vendor_id, limit, offset)
    return {
        'success': True,
        'data': invoices,
        'count': len(invoices)
    }


def api_get_invoice(invoice_id: str) -> Dict:
    """API: Get single invoice"""
    invoice = invoice_service_db.get_invoice_by_id(invoice_id)
    if invoice:
        return {'success': True, 'data': invoice}
    return {'success': False, 'error': 'Invoice not found'}


def api_create_invoice(invoice_data: Dict) -> Dict:
    """API: Create invoice"""
    invoice_id = invoice_service_db.create_invoice(invoice_data)
    if invoice_id:
        return {'success': True, 'id': invoice_id, 'message': 'Invoice created'}
    return {'success': False, 'error': 'Failed to create invoice'}


def api_update_invoice(invoice_id: str, updates: Dict) -> Dict:
    """API: Update invoice"""
    if invoice_service_db.update_invoice(invoice_id, updates):
        return {'success': True, 'message': 'Invoice updated'}
    return {'success': False, 'error': 'Failed to update invoice'}


def api_approve_invoice(invoice_id: str, approved_by: str) -> Dict:
    """API: Approve invoice"""
    if invoice_service_db.update_invoice_status(invoice_id, 'APPROVED', approved_by=approved_by):
        return {'success': True, 'message': 'Invoice approved'}
    return {'success': False, 'error': 'Failed to approve invoice'}


def api_reject_invoice(invoice_id: str, reason: str) -> Dict:
    """API: Reject invoice"""
    if invoice_service_db.update_invoice_status(invoice_id, 'REJECTED', rejection_reason=reason):
        return {'success': True, 'message': 'Invoice rejected'}
    return {'success': False, 'error': 'Failed to reject invoice'}


def api_get_invoice_stats(vendor_id: str = None) -> Dict:
    """API: Get invoice statistics"""
    stats = invoice_service_db.get_invoice_stats(vendor_id)
    return {'success': True, 'data': stats}
