"""
PostgreSQL Database Connection Helper for Atlas Services
=========================================================
Uses Supabase PostgreSQL connection from DATABASE_URL
"""

import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")


def get_postgres_connection():
    """
    Get PostgreSQL connection to Supabase
    
    Returns:
        psycopg2 connection object
    """
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"[Postgres] Connection error: {e}")
        raise


def get_dict_cursor(conn):
    """
    Get a dictionary cursor for the connection
    
    Args:
        conn: psycopg2 connection
    
    Returns:
        cursor with RealDictCursor factory
    """
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
