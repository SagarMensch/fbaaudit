import psycopg2
from psycopg2.extras import RealDictCursor
from db_config import DATABASE_URL

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except psycopg2.Error as err:
        print(f"Error connecting to PostgreSQL: {err}")
        return None  # Return None instead of raising immediately to allow graceful degradation checks

def get_cursor(conn):
    """Factory to get real dict cursor (compatible with previous dictionary=True behavior)"""
    return conn.cursor(cursor_factory=RealDictCursor)

