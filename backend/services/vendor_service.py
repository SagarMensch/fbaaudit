"""
Vendor/Supplier Service - PostgreSQL Integration (Supabase)
===========================================================
CRUD operations for vendors/suppliers from Supabase.
"""

import psycopg2
from psycopg2 import Error
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
from datetime import datetime
import json
import os

from db_config import DATABASE_URL

def get_connection():
    """Get PostgreSQL connection"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)

class VendorServiceDB:
    """
    Vendor Service with PostgreSQL backend.
    """
    
    def get_all_vendors(self, vendor_type: Optional[str] = None, is_active: Optional[bool] = None) -> List[Dict]:
        """Get all vendors with optional filtering"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = "SELECT * FROM vendors WHERE 1=1"
            params = []
            
            if vendor_type:
                query += " AND type = %s"
                params.append(vendor_type)
            
            if is_active is not None:
                query += " AND is_active = %s"
                params.append(is_active)
            
            query += " ORDER BY name ASC"
            
            cursor.execute(query, tuple(params))
            vendors = cursor.fetchall()
            
            for vendor in vendors:
                for field in ['created_at', 'updated_at']:
                    if vendor.get(field):
                        vendor[field] = str(vendor[field])
            
            cursor.close()
            conn.close()
            
            return vendors
            
        except Error as e:
            print(f"Error fetching vendors: {e}")
            return []
    
    def get_vendor_by_id(self, vendor_id: str) -> Optional[Dict]:
        """Get a single vendor by ID"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("SELECT * FROM vendors WHERE id = %s", (vendor_id,))
            vendor = cursor.fetchone()
            
            if not vendor:
                cursor.close()
                conn.close()
                return None
            
            # Get associated contracts
            cursor.execute("""
                SELECT id, vendor_name, service_type, status, valid_from, valid_to
                FROM contracts WHERE vendor_id = %s
            """, (vendor_id,))
            
            contracts = cursor.fetchall()
            
            # Convert contract dates
            for contract in contracts:
                for field in ['valid_from', 'valid_to']:
                    if contract.get(field):
                        contract[field] = str(contract[field])

            vendor['contracts'] = contracts
            
            cursor.close()
            conn.close()
            
            return vendor
            
        except Error as e:
            print(f"Error fetching vendor {vendor_id}: {e}")
            return None
    
    def create_vendor(self, vendor_data: Dict) -> Optional[str]:
        """Create a new vendor"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            vendor_id = vendor_data.get('id') or f"VND-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            cursor.execute("""
                INSERT INTO vendors (
                    id, name, type, pan, gstin, contact_name, contact_email, contact_phone,
                    address, city, state, pincode, bank_name, bank_account, ifsc_code,
                    is_active, performance_grade, onboarding_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                vendor_id,
                vendor_data.get('name'),
                vendor_data.get('type', 'TRANSPORTER'),
                vendor_data.get('pan'),
                vendor_data.get('gstin'),
                vendor_data.get('contact_name'),
                vendor_data.get('contact_email'),
                vendor_data.get('contact_phone'),
                vendor_data.get('address'),
                vendor_data.get('city'),
                vendor_data.get('state'),
                vendor_data.get('pincode'),
                vendor_data.get('bank_name'),
                vendor_data.get('bank_account'),
                vendor_data.get('ifsc_code'),
                vendor_data.get('is_active', True),
                vendor_data.get('performance_grade', 'B'),
                vendor_data.get('onboarding_status', 'PENDING')
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return vendor_id
            
        except Error as e:
            print(f"Error creating vendor: {e}")
            return None
    
    def update_vendor(self, vendor_id: str, updates: Dict) -> bool:
        """Update an existing vendor"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            fields = []
            values = []
            
            updatable_fields = [
                'name', 'type', 'pan', 'gstin', 'contact_name', 'contact_email',
                'contact_phone', 'address', 'city', 'state', 'pincode',
                'bank_name', 'bank_account', 'ifsc_code', 'is_active',
                'performance_grade', 'onboarding_status'
            ]
            
            for field in updatable_fields:
                if field in updates:
                    fields.append(f"{field} = %s")
                    values.append(updates[field])
            
            if not fields:
                return False
            
            values.append(vendor_id)
            query = f"UPDATE vendors SET {', '.join(fields)} WHERE id = %s"
            
            cursor.execute(query, tuple(values))
            conn.commit()
            
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error updating vendor: {e}")
            return False
    
    def delete_vendor(self, vendor_id: str) -> bool:
        """Delete a vendor (soft delete)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Soft delete - just mark as inactive
            cursor.execute("UPDATE vendors SET is_active = FALSE WHERE id = %s", (vendor_id,))
            conn.commit()
            
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error deleting vendor: {e}")
            return False
    
    def get_vendor_stats(self) -> Dict:
        """Get vendor statistics"""
        try:
            conn = get_connection()
            cursor = conn.cursor() # Tuple cursor for aggregations is fine
            
            stats = {}
            
            # Total count
            cursor.execute("SELECT COUNT(*) FROM vendors WHERE is_active = TRUE")
            row = cursor.fetchone()
            stats['total_active'] = row[0] if row else 0
            
            # By type
            cursor.execute("""
                SELECT type, COUNT(*) as count 
                FROM vendors WHERE is_active = TRUE 
                GROUP BY type
            """)
            stats['by_type'] = {row[0]: row[1] for row in cursor.fetchall()}
            
            # By performance grade
            cursor.execute("""
                SELECT performance_grade, COUNT(*) as count 
                FROM vendors WHERE is_active = TRUE 
                GROUP BY performance_grade
            """)
            stats['by_grade'] = {row[0]: row[1] for row in cursor.fetchall()}
            
            cursor.close()
            conn.close()
            
            return stats
            
        except Error as e:
            print(f"Error getting vendor stats: {e}")
            return {}


# Singleton instance
vendor_service_db = VendorServiceDB()

# API Wrappers
def api_get_vendors(vendor_type: str = None, is_active: bool = None) -> Dict:
    vendors = vendor_service_db.get_all_vendors(vendor_type, is_active)
    return {'success': True, 'data': vendors, 'count': len(vendors)}

def api_get_vendor(vendor_id: str) -> Dict:
    vendor = vendor_service_db.get_vendor_by_id(vendor_id)
    if vendor: return {'success': True, 'data': vendor}
    return {'success': False, 'error': 'Vendor not found'}

def api_create_vendor(vendor_data: Dict) -> Dict:
    vendor_id = vendor_service_db.create_vendor(vendor_data)
    if vendor_id: return {'success': True, 'id': vendor_id, 'message': 'Vendor created'}
    return {'success': False, 'error': 'Failed to create vendor'}

def api_update_vendor(vendor_id: str, updates: Dict) -> Dict:
    if vendor_service_db.update_vendor(vendor_id, updates): return {'success': True, 'message': 'Vendor updated'}
    return {'success': False, 'error': 'Failed to update vendor'}

def api_delete_vendor(vendor_id: str) -> Dict:
    if vendor_service_db.delete_vendor(vendor_id): return {'success': True, 'message': 'Vendor deactivated'}
    return {'success': False, 'error': 'Failed to delete vendor'}

def api_get_vendor_stats() -> Dict:
    stats = vendor_service_db.get_vendor_stats()
    return {'success': True, 'data': stats}
