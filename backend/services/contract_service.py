"""
Contracts Service - PostgreSQL Integration (Supabase)
=====================================================
CRUD operations for contracts and freight rates from Supabase.
"""

import psycopg2
from psycopg2 import Error
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional, Any
from datetime import datetime
import json
import os

from db_config import DATABASE_URL

def get_connection():
    """Get PostgreSQL connection"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)

class ContractServiceDB:
    """
    Contract Service with PostgreSQL backend.
    """
    
    def get_all_contracts(self, status: Optional[str] = None, vendor_id: Optional[str] = None) -> List[Dict]:
        """Get all contracts with optional filtering"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT c.*, 
                       (SELECT COUNT(*) FROM freight_rates fr WHERE fr.contract_id = c.id) as rate_count
                FROM contracts c
                WHERE 1=1
            """
            params = []
            
            if status:
                query += " AND c.status = %s"
                params.append(status)
            
            if vendor_id:
                query += " AND c.vendor_id = %s"
                params.append(vendor_id)
            
            query += " ORDER BY c.created_at DESC"
            
            cursor.execute(query, tuple(params))
            contracts = cursor.fetchall()
            
            # Post-process
            for contract in contracts:
                for field in ['valid_from', 'valid_to', 'approved_at', 'created_at', 'updated_at']:
                    if contract.get(field):
                        contract[field] = str(contract[field])
            
            cursor.close()
            conn.close()
            
            return contracts
            
        except Error as e:
            print(f"Error fetching contracts: {e}")
            return []
    
    def get_contract_by_id(self, contract_id: str) -> Optional[Dict]:
        """Get a single contract by ID with all freight rates"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("SELECT * FROM contracts WHERE id = %s", (contract_id,))
            contract = cursor.fetchone()
            
            if not contract:
                cursor.close()
                conn.close()
                return None
            
            # Convert dates
            for field in ['valid_from', 'valid_to', 'approved_at', 'created_at', 'updated_at']:
                if contract.get(field):
                    contract[field] = str(contract[field])
            
            # Get freight rates
            # Postgres booleans are Python booleans, psycopg2 handles it.
            cursor.execute("""
                SELECT * FROM freight_rates 
                WHERE contract_id = %s AND is_active = TRUE
                ORDER BY origin, destination
            """, (contract_id,))
            
            # RealDictCursor returns list of dicts directly
            rates = cursor.fetchall()
            
            contract['freightMatrix'] = rates
            contract['freight_rates'] = rates
            
            cursor.close()
            conn.close()
            
            return contract
            
        except Error as e:
            print(f"Error fetching contract {contract_id}: {e}")
            return None
    
    def get_contract_for_route(self, origin: str, destination: str, vendor_id: Optional[str] = None) -> Optional[Dict]:
        """Find a contract that covers a specific route"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Replaced CURDATE() with CURRENT_DATE for Postgres
            query = """
                SELECT c.*, fr.base_rate, fr.rate_basis, fr.vehicle_type, fr.transit_time_hrs
                FROM contracts c
                INNER JOIN freight_rates fr ON fr.contract_id = c.id
                WHERE c.status = 'ACTIVE'
                  AND LOWER(fr.origin) = LOWER(%s)
                  AND LOWER(fr.destination) = LOWER(%s)
                  AND fr.is_active = TRUE
                  AND c.valid_from <= CURRENT_DATE
                  AND c.valid_to >= CURRENT_DATE
            """
            params = [origin, destination]
            
            if vendor_id:
                query += " AND c.vendor_id = %s"
                params.append(vendor_id)
            
            query += " LIMIT 1"
            
            cursor.execute(query, tuple(params))
            contract = cursor.fetchone()
            
            if not contract:
                cursor.close()
                conn.close()
                return None
            
            for field in ['valid_from', 'valid_to', 'created_at', 'updated_at']:
                if contract.get(field):
                    contract[field] = str(contract[field])
            
            cursor.close()
            conn.close()
            
            return contract
            
        except Error as e:
            print(f"Error finding contract for route: {e}")
            return None
    
    def create_contract(self, contract_data: Dict) -> Optional[str]:
        """Create a new contract"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            contract_id = contract_data.get('id') or f"CNT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            cursor.execute("""
                INSERT INTO contracts (
                    id, vendor_id, vendor_name, service_type, valid_from, valid_to,
                    payment_terms, is_rcm_applicable, status,
                    pvc_base_diesel_price, pvc_mileage_benchmark, pvc_reference_city,
                    sla_otd_target, sla_pod_days, accessorials, gst_rate
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                contract_id,
                contract_data.get('vendor_id'),
                contract_data.get('vendor_name'),
                contract_data.get('service_type', 'FTL'),
                contract_data.get('valid_from'),
                contract_data.get('valid_to'),
                contract_data.get('payment_terms', 'Net 30'),
                contract_data.get('is_rcm_applicable', False),
                contract_data.get('status', 'DRAFT'),
                contract_data.get('pvc_base_diesel_price'),
                contract_data.get('pvc_mileage_benchmark'),
                contract_data.get('pvc_reference_city'),
                contract_data.get('sla_otd_target', 95.0),
                contract_data.get('sla_pod_days', 7),
                json.dumps(contract_data.get('accessorials', {})),
                contract_data.get('gst_rate', 5.0)
            ))
            
            # Insert freight rates if provided
            freight_matrix = contract_data.get('freightMatrix', []) or contract_data.get('freight_rates', [])
            for i, rate in enumerate(freight_matrix):
                rate_id = rate.get('id') or f"{contract_id}-FR-{i+1:03d}"
                cursor.execute("""
                    INSERT INTO freight_rates (
                        id, contract_id, origin, destination, vehicle_type,
                        capacity_ton, rate_basis, base_rate, min_charge, transit_time_hrs
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    rate_id,
                    contract_id,
                    rate.get('origin'),
                    rate.get('destination'),
                    rate.get('vehicle_type') or rate.get('vehicleType'),
                    rate.get('capacity_ton') or rate.get('capacityTon'),
                    rate.get('rate_basis') or rate.get('rateBasis', 'Per Trip'),
                    rate.get('base_rate') or rate.get('baseRate'),
                    rate.get('min_charge') or rate.get('minCharge'),
                    rate.get('transit_time_hrs') or rate.get('transitTimeHrs')
                ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return contract_id
            
        except Error as e:
            print(f"Error creating contract: {e}")
            return None
    
    def update_contract(self, contract_id: str, updates: Dict) -> bool:
        """Update an existing contract"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            fields = []
            values = []
            
            updatable_fields = [
                'vendor_name', 'service_type', 'valid_from', 'valid_to',
                'payment_terms', 'is_rcm_applicable', 'status',
                'pvc_base_diesel_price', 'pvc_mileage_benchmark', 'pvc_reference_city',
                'sla_otd_target', 'sla_pod_days', 'gst_rate'
            ]
            
            for field in updatable_fields:
                if field in updates:
                    fields.append(f"{field} = %s")
                    values.append(updates[field])
            
            if not fields:
                return False
            
            values.append(contract_id)
            query = f"UPDATE contracts SET {', '.join(fields)} WHERE id = %s"
            
            cursor.execute(query, tuple(values))
            conn.commit()
            
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error updating contract: {e}")
            return False
    
    def delete_contract(self, contract_id: str) -> bool:
        """Delete a contract (cascade handled by DB if configured, else manual)"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Assuming CREATE TABLE ... ON DELETE CASCADE
            cursor.execute("DELETE FROM contracts WHERE id = %s", (contract_id,))
            conn.commit()
            
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error deleting contract: {e}")
            return False
    
    def get_rate_for_route(self, origin: str, destination: str, vehicle_type: Optional[str] = None) -> Optional[Dict]:
        """Get the best rate for a route"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Replaced CURDATE()
            query = """
                SELECT fr.*, c.vendor_name, c.id as contract_id, c.status as contract_status
                FROM freight_rates fr
                INNER JOIN contracts c ON c.id = fr.contract_id
                WHERE LOWER(fr.origin) = LOWER(%s)
                  AND LOWER(fr.destination) = LOWER(%s)
                  AND c.status = 'ACTIVE'
                  AND fr.is_active = TRUE
                  AND c.valid_from <= CURRENT_DATE
                  AND c.valid_to >= CURRENT_DATE
            """
            params = [origin, destination]
            
            if vehicle_type:
                query += " AND fr.vehicle_type = %s"
                params.append(vehicle_type)
            
            query += " ORDER BY fr.base_rate ASC LIMIT 1"
            
            cursor.execute(query, tuple(params))
            rate = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return rate
            
        except Error as e:
            print(f"Error fetching rate for route: {e}")
            return None
    
    def get_all_routes(self) -> List[Dict]:
        """Get all unique routes"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT DISTINCT fr.origin, fr.destination, c.vendor_name, fr.base_rate, fr.rate_basis
                FROM freight_rates fr
                INNER JOIN contracts c ON c.id = fr.contract_id
                WHERE c.status = 'ACTIVE' AND fr.is_active = TRUE
                ORDER BY fr.origin, fr.destination
            """)
            
            rows = cursor.fetchall()
            routes = []
            for row in rows:
                routes.append({
                    'origin': row['origin'],
                    'destination': row['destination'],
                    'vendor_name': row['vendor_name'],
                    'base_rate': float(row['base_rate']) if row['base_rate'] else 0,
                    'rate_basis': row['rate_basis']
                })
            
            cursor.close()
            conn.close()
            
            return routes
            
        except Error as e:
            print(f"Error fetching routes: {e}")
            return []
            
    def get_contract_rate_for_validation(self, origin: str, destination: str) -> Optional[Dict]:
        """Get contract rate for Atlas Sentinel validation"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Replaced CURDATE()
            cursor.execute("""
                SELECT 
                    c.id as contract_id,
                    c.vendor_id,
                    c.vendor_name,
                    c.service_type,
                    c.pvc_base_diesel_price,
                    c.pvc_mileage_benchmark,
                    fr.base_rate,
                    fr.rate_basis,
                    fr.vehicle_type,
                    fr.min_charge,
                    fr.transit_time_hrs
                FROM contracts c
                INNER JOIN freight_rates fr ON fr.contract_id = c.id
                WHERE c.status = 'ACTIVE'
                  AND (
                      (LOWER(fr.origin) = LOWER(%s) AND LOWER(fr.destination) = LOWER(%s))
                      OR (LOWER(fr.origin) = LOWER(%s) AND LOWER(fr.destination) = LOWER(%s))
                  )
                  AND fr.is_active = TRUE
                  AND c.valid_from <= CURRENT_DATE
                  AND c.valid_to >= CURRENT_DATE
                ORDER BY fr.base_rate ASC
                LIMIT 1
            """, (origin, destination, destination, origin))
            
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return result
            
        except Error as e:
            print(f"Error fetching contract rate for validation: {e}")
            return None


# Singleton instance
contract_service_db = ContractServiceDB()

# API Endpoints wrappers remain unchanged as they call methods above
def api_get_contracts(status: str = None, vendor_id: str = None) -> Dict:
    contracts = contract_service_db.get_all_contracts(status, vendor_id)
    return {'success': True, 'data': contracts, 'count': len(contracts)}

def api_get_contract(contract_id: str) -> Dict:
    contract = contract_service_db.get_contract_by_id(contract_id)
    if contract: return {'success': True, 'data': contract}
    return {'success': False, 'error': 'Contract not found'}

def api_create_contract(contract_data: Dict) -> Dict:
    contract_id = contract_service_db.create_contract(contract_data)
    if contract_id: return {'success': True, 'id': contract_id, 'message': 'Contract created'}
    return {'success': False, 'error': 'Failed to create contract'}

def api_update_contract(contract_id: str, updates: Dict) -> Dict:
    if contract_service_db.update_contract(contract_id, updates):
        return {'success': True, 'message': 'Contract updated'}
    return {'success': False, 'error': 'Failed to update contract'}

def api_delete_contract(contract_id: str) -> Dict:
    if contract_service_db.delete_contract(contract_id):
        return {'success': True, 'message': 'Contract deleted'}
    return {'success': False, 'error': 'Failed to delete contract'}

def api_get_route_rate(origin: str, destination: str, vehicle_type: str = None) -> Dict:
    rate = contract_service_db.get_rate_for_route(origin, destination, vehicle_type)
    if rate: return {'success': True, 'data': rate}
    return {'success': False, 'error': 'No rate found for this route'}

def api_get_all_routes() -> Dict:
    routes = contract_service_db.get_all_routes()
    return {'success': True, 'data': routes, 'count': len(routes)}
