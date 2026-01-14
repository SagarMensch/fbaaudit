"""
Initialize Atlas PostgreSQL/Supabase Schema
=====================================
Executes the PostgreSQL schema for Atlas tables
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def run_schema():
    """Execute the Atlas PostgreSQL schema"""
    
    # Read schema file
    schema_path = os.path.join(os.path.dirname(__file__), 'schema_atlas_postgres.sql')
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Connect to Supabase
    print("[Init] Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        print("[Init] Executing Atlas schema...")
        cursor.execute(sql_script)
        conn.commit()
        print("[Init] ✅ Schema executed successfully!")
        
    except Exception as e:
        print(f"[Init] ❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    try:
        run_schema()
        print("\n✅ Atlas database initialized on Supabase!")
        print("Next: Run `python seed_atlas_data.py` to populate master data")
    except Exception as e:
        print(f"\n❌ Initialization failed: {e}")
        import traceback
        traceback.print_exc()
