"""
Atlas Master Data Service - PostgreSQL Version
=========================
Manages all master data tables using Supabase PostgreSQL

Author: Atlas Sentinel Team
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from postgres_helper import get_postgres_connection, get_dict_cursor
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import uuid


class AtlasMasterDataService:
    """Service for managing all master data tables"""
    
    def __init__(self):
        """Initialize service"""
        print("[Atlas Master] Service initialized for PostgreSQL/Supabase")
    
    # ========================================================================
    # CARRIER MASTER
    # ========================================================================
    
    def add_carrier(self, carrier_data: Dict[str, Any]) -> str:
        """Add or update carrier in master"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            carrier_id = carrier_data.get('id') or str(uuid.uuid4())
            
            query = """
                INSERT INTO carrier_master 
                (id, carrier_code, carrier_name, gstin, pan, 
                 contact_person, contact_phone, contact_email, 
                 address, is_active, rating)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (carrier_code) DO UPDATE SET
                    carrier_name = EXCLUDED.carrier_name,
                    gstin = EXCLUDED.gstin,
                    pan = EXCLUDED.pan,
                    contact_person = EXCLUDED.contact_person,
                    contact_phone = EXCLUDED.contact_phone,
                    contact_email = EXCLUDED.contact_email,
                    address = EXCLUDED.address,
                    is_active = EXCLUDED.is_active,
                    rating = EXCLUDED.rating
            """
            
            cursor.execute(query, (
                carrier_id,
                carrier_data['carrier_code'],
                carrier_data['carrier_name'],
                carrier_data.get('gstin'),
                carrier_data.get('pan'),
                carrier_data.get('contact_person'),
                carrier_data.get('contact_phone'),
                carrier_data.get('contact_email'),
                carrier_data.get('address'),
                carrier_data.get('is_active', True),
                carrier_data.get('rating')
            ))
            
            conn.commit()
            print(f"[Atlas Master] Carrier added: {carrier_data['carrier_code']}")
            return carrier_id
            
        except Exception as err:
            print(f"[Atlas Master] Error adding carrier: {err}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()
    
    def get_all_carriers(self, active_only=True) -> List[Dict]:
        """Get all carriers from master"""
        conn = get_postgres_connection()
        cursor = get_dict_cursor(conn)
        
        try:
            query = "SELECT * FROM carrier_master"
            if active_only:
                query += " WHERE is_active = TRUE"
            query += " ORDER BY carrier_name"
            
            cursor.execute(query)
            carriers = cursor.fetchall()
            
            # Convert to list of dicts
            return [dict(row) for row in carriers]
            
        except Exception as err:
            print(f"[Atlas Master] Error fetching carriers: {err}")
            return []
        finally:
            cursor.close()
            conn.close()
    
    def get_carrier_by_code(self, carrier_code: str) -> Optional[Dict]:
        """Get carrier by code"""
        conn = get_postgres_connection()
        cursor = get_dict_cursor(conn)
        
        try:
            query = "SELECT * FROM carrier_master WHERE carrier_code = %s"
            cursor.execute(query, (carrier_code,))
            carrier = cursor.fetchone()
            return dict(carrier) if carrier else None
            
        except Exception as err:
            print(f"[Atlas Master] Error fetching carrier: {err}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    # ========================================================================
    # ROUTE MASTER
    # ========================================================================
    
    def add_route(self, route_data: Dict[str, Any]) -> str:
        """Add route to master"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            route_id = route_data.get('id') or str(uuid.uuid4())
            
            query = """
                INSERT INTO route_master 
                (id, route_code, origin, destination, distance_km, 
                 direction, zone, estimated_transit_days, toll_points, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (route_code) DO UPDATE SET
                    origin = EXCLUDED.origin,
                    destination = EXCLUDED.destination,
                    distance_km = EXCLUDED.distance_km,
                    direction = EXCLUDED.direction,
                    zone = EXCLUDED.zone,
                    estimated_transit_days = EXCLUDED.estimated_transit_days,
                    toll_points = EXCLUDED.toll_points,
                    is_active = EXCLUDED.is_active
            """
            
            cursor.execute(query, (
                route_id,
                route_data['route_code'],
                route_data['origin'],
                route_data['destination'],
                route_data['distance_km'],
                route_data.get('direction', 'HEAD_HAUL'),
                route_data.get('zone'),
                route_data.get('estimated_transit_days'),
                route_data.get('toll_points', 0),
                route_data.get('is_active', True)
            ))
            
            conn.commit()
            print(f"[Atlas Master] Route added: {route_data['route_code']}")
            return route_id
            
        except Exception as err:
            print(f"[Atlas Master] Error adding route: {err}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()
    
    def get_route_by_origin_dest(self, origin: str, destination: str) -> Optional[Dict]:
        """Find route by origin and destination"""
        conn = get_postgres_connection()
        cursor = get_dict_cursor(conn)
        
        try:
            query = """
                SELECT * FROM route_master 
                WHERE origin = %s AND destination = %s AND is_active = TRUE
                LIMIT 1
            """
            cursor.execute(query, (origin, destination))
            route = cursor.fetchone()
            return dict(route) if route else None
            
        except Exception as err:
            print(f"[Atlas Master] Error fetching route: {err}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    # ========================================================================
    # FUEL MASTER
    # ========================================================================
    
    def add_fuel_price(self, fuel_data: Dict[str, Any]) -> str:
        """Add diesel price entry"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            fuel_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO fuel_master 
                (id, effective_date, diesel_price_per_liter, city, source)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (effective_date, city) DO UPDATE SET
                    diesel_price_per_liter = EXCLUDED.diesel_price_per_liter,
                    source = EXCLUDED.source
            """
            
            cursor.execute(query, (
                fuel_id,
                fuel_data['effective_date'],
                fuel_data['diesel_price_per_liter'],
                fuel_data.get('city', 'NATIONAL'),
                fuel_data.get('source', 'MANUAL')
            ))
            
            conn.commit()
            print(f"[Atlas Master] Fuel price added for {fuel_data['effective_date']}")
            return fuel_id
            
        except Exception as err:
            print(f"[Atlas Master] Error adding fuel price: {err}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()
    
    def get_fuel_price_on_date(self, target_date: date, city: str = 'NATIONAL') -> Optional[float]:
        """Get diesel price for a specific date (finds nearest past date)"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT diesel_price_per_liter 
                FROM fuel_master 
                WHERE effective_date <= %s 
                AND (city = %s OR city = 'NATIONAL')
                ORDER BY effective_date DESC 
                LIMIT 1
            """
            cursor.execute(query, (target_date, city))
            result = cursor.fetchone()
            
            return float(result[0]) if result else None
            
        except Exception as err:
            print(f"[Atlas Master] Error fetching fuel price: {err}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    # ========================================================================
    # RATE CARD MASTER
    # ========================================================================
    
    def add_rate_card(self, rate_data: Dict[str, Any]) -> str:
        """Add contract rate for carrier + route + vehicle type"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            rate_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO rate_card_master 
                (id, contract_id, carrier_id, route_id, vehicle_type,
                 base_rate, rate_unit, min_weight_kg, max_weight_kg,
                 fuel_inclusive, detention_free_hours, detention_per_hour,
                 handling_inclusive, valid_from, valid_to, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(query, (
                rate_id,
                rate_data.get('contract_id'),
                rate_data['carrier_id'],
                rate_data['route_id'],
                rate_data['vehicle_type'],
                rate_data['base_rate'],
                rate_data.get('rate_unit', 'PER_TON'),
                rate_data.get('min_weight_kg'),
                rate_data.get('max_weight_kg'),
                rate_data.get('fuel_inclusive', False),
                rate_data.get('detention_free_hours', 24),
                rate_data.get('detention_per_hour', 0),
                rate_data.get('handling_inclusive', True),
                rate_data['valid_from'],
                rate_data.get('valid_to'),
                rate_data.get('is_active', True)
            ))
            
            conn.commit()
            print(f"[Atlas Master] Rate card added: {rate_id}")
            return rate_id
            
        except Exception as err:
            print(f"[Atlas Master] Error adding rate card: {err}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()
    
    def get_rate_card(self, carrier_id: str, route_id: str, 
                      vehicle_type: str, invoice_date: date) -> Optional[Dict]:
        """Find applicable rate card"""
        conn = get_postgres_connection()
        cursor = get_dict_cursor(conn)
        
        try:
            query = """
                SELECT * FROM rate_card_master 
                WHERE carrier_id = %s::uuid
                AND route_id = %s::uuid
                AND vehicle_type = %s
                AND valid_from <= %s
                AND (valid_to IS NULL OR valid_to >= %s)
                AND is_active = TRUE
                ORDER BY valid_from DESC
                LIMIT 1
            """
            cursor.execute(query, (carrier_id, route_id, vehicle_type, invoice_date, invoice_date))
            rate_card = cursor.fetchone()
            return dict(rate_card) if rate_card else None
            
        except Exception as err:
            print(f"[Atlas Master] Error fetching rate card: {err}")
            return None
        finally:
            cursor.close()
            conn.close()


# Global singleton instance
_master_service: Optional[AtlasMasterDataService] = None

def get_master_service() -> AtlasMasterDataService:
    """Get or create master data service singleton"""
    global _master_service
    if _master_service is None:
        _master_service = AtlasMasterDataService()
    return _master_service
