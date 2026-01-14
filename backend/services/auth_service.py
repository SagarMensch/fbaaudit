"""
Auth Service - PostgreSQL Integration (Supabase)
=================================================
User authentication and session management.
"""

import psycopg2
from psycopg2 import Error
from psycopg2.extras import RealDictCursor
from typing import Dict, Optional
from datetime import datetime
import hashlib
import secrets
import os

from db_config import DATABASE_URL

def get_connection():
    """Get PostgreSQL connection"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return password == hashed or hash_password(password) == hashed

class AuthServiceDB:
    """
    Authentication Service with PostgreSQL backend.
    """
    
    def login(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate user and return user data"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT u.*, v.name as vendor_name 
                FROM users u
                LEFT JOIN vendors v ON v.id = u.vendor_id
                WHERE u.email = %s AND u.is_active = TRUE
            """, (email,))
            
            user = cursor.fetchone()
            
            if not user:
                cursor.close()
                conn.close()
                return None
            
            # Verify password
            if not verify_password(password, user.get('password_hash', '')):
                # Increment login attempts
                try:
                    conn_update = get_connection()
                    cur_update = conn_update.cursor()
                    cur_update.execute("""
                        UPDATE users SET login_attempts = login_attempts + 1 WHERE email = %s
                    """, (email,))
                    conn_update.commit()
                    cur_update.close()
                    conn_update.close()
                except:
                    pass # Ignore update error if any
                    
                cursor.close()
                conn.close()
                return None
            
            # Update last login
            try:
                conn_login = get_connection()
                cur_login = conn_login.cursor()
                cur_login.execute("""
                    UPDATE users SET last_login = NOW(), login_attempts = 0 WHERE id = %s
                """, (user['id'],))
                conn_login.commit()
                cur_login.close()
                conn_login.close()
            except:
                pass

            # Remove password from response
            if 'password_hash' in user:
                del user['password_hash']
            
            # Generate session token
            user['token'] = secrets.token_hex(32)
            
            # Convert dates
            for field in ['last_login', 'created_at']:
                if user.get(field):
                    user[field] = str(user[field])
            
            cursor.close()
            conn.close()
            
            return user
            
        except Error as e:
            print(f"Login error: {e}")
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT u.id, u.email, u.name, u.role, u.vendor_id, u.department,
                       u.phone, u.is_active, u.last_login, v.name as vendor_name
                FROM users u
                LEFT JOIN vendors v ON v.id = u.vendor_id
                WHERE u.id = %s
            """, (user_id,))
            
            user = cursor.fetchone()
            
            if not user:
                cursor.close()
                conn.close()
                return None
            
            if user.get('last_login'):
                user['last_login'] = str(user['last_login'])
            
            cursor.close()
            conn.close()
            
            return user
            
        except Error as e:
            print(f"Error fetching user: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT u.id, u.email, u.name, u.role, u.vendor_id, u.department,
                       u.phone, u.is_active, u.last_login, v.name as vendor_name
                FROM users u
                LEFT JOIN vendors v ON v.id = u.vendor_id
                WHERE u.email = %s
            """, (email,))
            
            user = cursor.fetchone()
            
            if not user:
                cursor.close()
                conn.close()
                return None
            
            if user.get('last_login'):
                user['last_login'] = str(user['last_login'])
                
            cursor.close()
            conn.close()
            
            return user
            
        except Error as e:
            print(f"Error fetching user by email: {e}")
            return None
    
    def create_user(self, user_data: Dict) -> Optional[str]:
        """Create a new user"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            user_id = user_data.get('id') or f"USR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            password_hash = hash_password(user_data.get('password', 'defaultpass'))
            
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, name, role, vendor_id, department, phone, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
            """, (
                user_id,
                user_data.get('email'),
                password_hash,
                user_data.get('name'),
                user_data.get('role', 'SUPPLIER'),
                user_data.get('vendor_id'),
                user_data.get('department'),
                user_data.get('phone')
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return user_id
            
        except Error as e:
            print(f"Error creating user: {e}")
            return None
    
    def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user password"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            password_hash = hash_password(new_password)
            
            cursor.execute("""
                UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s
            """, (password_hash, user_id))
            
            conn.commit()
            affected = cursor.rowcount
            cursor.close()
            conn.close()
            
            return affected > 0
            
        except Error as e:
            print(f"Error updating password: {e}")
            return False
    
    def get_all_users(self, role: str = None) -> list:
        """Get all users with optional role filter"""
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT u.id, u.email, u.name, u.role, u.vendor_id, u.department,
                       u.phone, u.is_active, u.last_login, v.name as vendor_name
                FROM users u
                LEFT JOIN vendors v ON v.id = u.vendor_id
                WHERE 1=1
            """
            params = []
            
            if role:
                query += " AND u.role = %s"
                params.append(role)
            
            query += " ORDER BY u.name"
            
            cursor.execute(query, tuple(params))
            
            users = cursor.fetchall()
            for user in users:
                if user.get('last_login'):
                    user['last_login'] = str(user['last_login'])
            
            cursor.close()
            conn.close()
            
            return users
            
        except Error as e:
            print(f"Error fetching users: {e}")
            return []


# Singleton instance
auth_service_db = AuthServiceDB()

# API Wrappers
def api_login(email: str, password: str) -> Dict:
    user = auth_service_db.login(email, password)
    if user: return {'success': True, 'user': user, 'message': 'Login successful'}
    return {'success': False, 'error': 'Invalid email or password'}

def api_get_current_user(user_id: str) -> Dict:
    user = auth_service_db.get_user_by_id(user_id)
    if user: return {'success': True, 'data': user}
    return {'success': False, 'error': 'User not found'}

def api_create_user(user_data: Dict) -> Dict:
    user_id = auth_service_db.create_user(user_data)
    if user_id: return {'success': True, 'id': user_id, 'message': 'User created'}
    return {'success': False, 'error': 'Failed to create user'}

def api_get_users(role: str = None) -> Dict:
    users = auth_service_db.get_all_users(role)
    return {'success': True, 'data': users, 'count': len(users)}

def api_update_password(user_id: str, new_password: str) -> Dict:
    if auth_service_db.update_password(user_id, new_password): return {'success': True, 'message': 'Password updated'}
    return {'success': False, 'error': 'Failed to update password'}
