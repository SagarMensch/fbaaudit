"""
Location Service - MySQL Integration
=====================================
CRUD operations for locations from MySQL database.
"""

import mysql.connector
from mysql.connector import Error
from typing import List, Dict, Optional
from datetime import datetime

# Import database config
try:
    from db_config import DB_CONFIG, DB_NAME
except ImportError:
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'root',
        'password': 'Password123!',
        'port': 3306
    }
    DB_NAME = 'ledgerone'


def get_connection():
    """Get MySQL connection with database"""
    config = DB_CONFIG.copy()
    config['database'] = DB_NAME
    return mysql.connector.connect(**config)


def dict_from_row(cursor, row) -> Dict:
    """Convert a database row to a dictionary"""
    if row is None:
        return None
    columns = [desc[0] for desc in cursor.description]
    return dict(zip(columns, row))


class LocationServiceDB:
    """
    Location Service with MySQL backend.
    """
    
    def get_all_locations(self, location_type: Optional[str] = None, city: Optional[str] = None) -> List[Dict]:
        """Get all locations with optional filtering"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            query = "SELECT * FROM locations WHERE is_active = TRUE"
            params = []
            
            if location_type:
                query += " AND type = %s"
                params.append(location_type)
            
            if city:
                query += " AND city LIKE %s"
                params.append(f"%{city}%")
            
            query += " ORDER BY city, name ASC"
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            locations = []
            for row in rows:
                location = dict_from_row(cursor, row)
                for field in ['created_at', 'updated_at']:
                    if location.get(field):
                        location[field] = str(location[field])
                locations.append(location)
            
            cursor.close()
            conn.close()
            
            return locations
            
        except Error as e:
            print(f"Error fetching locations: {e}")
            return []
    
    def get_location_by_id(self, location_id: str) -> Optional[Dict]:
        """Get a single location by ID"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM locations WHERE id = %s", (location_id,))
            row = cursor.fetchone()
            
            if not row:
                cursor.close()
                conn.close()
                return None
            
            location = dict_from_row(cursor, row)
            
            cursor.close()
            conn.close()
            
            return location
            
        except Error as e:
            print(f"Error fetching location {location_id}: {e}")
            return None
    
    def create_location(self, location_data: Dict) -> Optional[str]:
        """Create a new location"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            location_id = location_data.get('id') or f"LOC-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            cursor.execute("""
                INSERT INTO locations (
                    id, code, name, type, address, city, state, pincode,
                    country, latitude, longitude, gstin, contact_name, contact_phone,
                    operating_hours, is_active
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                location_id,
                location_data.get('code'),
                location_data.get('name'),
                location_data.get('type', 'WAREHOUSE'),
                location_data.get('address'),
                location_data.get('city'),
                location_data.get('state'),
                location_data.get('pincode'),
                location_data.get('country', 'India'),
                location_data.get('latitude'),
                location_data.get('longitude'),
                location_data.get('gstin'),
                location_data.get('contact_name'),
                location_data.get('contact_phone'),
                location_data.get('operating_hours'),
                location_data.get('is_active', True)
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return location_id
            
        except Error as e:
            print(f"Error creating location: {e}")
            return None
    
    def update_location(self, location_id: str, updates: Dict) -> bool:
        """Update an existing location"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            fields = []
            values = []
            
            updatable_fields = [
                'code', 'name', 'type', 'address', 'city', 'state', 'pincode',
                'country', 'latitude', 'longitude', 'gstin', 'contact_name',
                'contact_phone', 'operating_hours', 'is_active'
            ]
            
            for field in updatable_fields:
                if field in updates:
                    fields.append(f"{field} = %s")
                    values.append(updates[field])
            
            if not fields:
                return False
            
            values.append(location_id)
            query = f"UPDATE locations SET {', '.join(fields)} WHERE id = %s"
            
            cursor.execute(query, values)
            conn.commit()
            
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error updating location: {e}")
            return False
    
    def get_cities(self) -> List[str]:
        """Get all unique cities"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT DISTINCT city FROM locations WHERE is_active = TRUE ORDER BY city")
            cities = [row[0] for row in cursor.fetchall()]
            
            cursor.close()
            conn.close()
            
            return cities
            
        except Error as e:
            print(f"Error fetching cities: {e}")
            return []
    
    def get_location_stats(self) -> Dict:
        """Get location statistics"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            stats = {}
            
            cursor.execute("SELECT COUNT(*) FROM locations WHERE is_active = TRUE")
            stats['total'] = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT type, COUNT(*) as count 
                FROM locations WHERE is_active = TRUE 
                GROUP BY type
            """)
            stats['by_type'] = {row[0]: row[1] for row in cursor.fetchall()}
            
            cursor.execute("""
                SELECT state, COUNT(*) as count 
                FROM locations WHERE is_active = TRUE 
                GROUP BY state ORDER BY count DESC LIMIT 10
            """)
            stats['by_state'] = {row[0]: row[1] for row in cursor.fetchall()}
            
            cursor.close()
            conn.close()
            
            return stats
            
        except Error as e:
            print(f"Error getting location stats: {e}")
            return {}


# Singleton instance
location_service_db = LocationServiceDB()


# ===================================
# API ENDPOINT FUNCTIONS
# ===================================

def api_get_locations(location_type: str = None, city: str = None) -> Dict:
    """API: Get all locations"""
    locations = location_service_db.get_all_locations(location_type, city)
    return {
        'success': True,
        'data': locations,
        'count': len(locations)
    }


def api_get_location(location_id: str) -> Dict:
    """API: Get single location"""
    location = location_service_db.get_location_by_id(location_id)
    if location:
        return {'success': True, 'data': location}
    return {'success': False, 'error': 'Location not found'}


def api_create_location(location_data: Dict) -> Dict:
    """API: Create location"""
    location_id = location_service_db.create_location(location_data)
    if location_id:
        return {'success': True, 'id': location_id, 'message': 'Location created'}
    return {'success': False, 'error': 'Failed to create location'}


def api_update_location(location_id: str, updates: Dict) -> Dict:
    """API: Update location"""
    if location_service_db.update_location(location_id, updates):
        return {'success': True, 'message': 'Location updated'}
    return {'success': False, 'error': 'Failed to update location'}


def api_get_cities() -> Dict:
    """API: Get all cities"""
    cities = location_service_db.get_cities()
    return {'success': True, 'data': cities}


def api_get_location_stats() -> Dict:
    """API: Get location statistics"""
    stats = location_service_db.get_location_stats()
    return {'success': True, 'data': stats}
