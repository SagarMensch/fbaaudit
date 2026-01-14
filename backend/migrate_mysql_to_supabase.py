"""
Complete MySQL to Supabase PostgreSQL Data Migration
=====================================================
This script:
1. Reads the MySQL schema for ALL tables
2. Creates equivalent PostgreSQL tables in Supabase
3. Migrates all data row by row
"""

import mysql.connector
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os
import json
from datetime import datetime, date
from decimal import Decimal

load_dotenv()

# MySQL Configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Password123!',
    'database': 'ledgerone'
}

# PostgreSQL (Supabase) Configuration
POSTGRES_URL = os.getenv('DATABASE_URL')

# MySQL to PostgreSQL type mapping
TYPE_MAPPING = {
    'int': 'INTEGER',
    'bigint': 'BIGINT',
    'smallint': 'SMALLINT',
    'tinyint': 'SMALLINT',
    'float': 'REAL',
    'double': 'DOUBLE PRECISION',
    'decimal': 'DECIMAL',
    'varchar': 'VARCHAR',
    'char': 'CHAR',
    'text': 'TEXT',
    'longtext': 'TEXT',
    'mediumtext': 'TEXT',
    'tinytext': 'TEXT',
    'blob': 'BYTEA',
    'longblob': 'BYTEA',
    'mediumblob': 'BYTEA',
    'tinyblob': 'BYTEA',
    'datetime': 'TIMESTAMP',
    'timestamp': 'TIMESTAMP',
    'date': 'DATE',
    'time': 'TIME',
    'year': 'INTEGER',
    'boolean': 'BOOLEAN',
    'bool': 'BOOLEAN',
    'json': 'JSONB',
    'enum': 'VARCHAR(100)',
}

def get_mysql_connection():
    return mysql.connector.connect(**MYSQL_CONFIG)

def get_postgres_connection():
    return psycopg2.connect(POSTGRES_URL)

def mysql_type_to_postgres(mysql_type):
    """Convert MySQL column type to PostgreSQL equivalent"""
    mysql_type_lower = mysql_type.lower()
    
    # Handle types with size specification like varchar(255)
    for mysql_t, pg_t in TYPE_MAPPING.items():
        if mysql_type_lower.startswith(mysql_t):
            if mysql_t in ['varchar', 'char', 'decimal']:
                # Keep the size specification
                return mysql_type_lower.replace(mysql_t, pg_t.lower())
            return pg_t
    
    # Default to TEXT if unknown
    return 'TEXT'

def get_mysql_table_schema(cursor, table_name):
    """Get the schema of a MySQL table"""
    cursor.execute(f"DESCRIBE {table_name}")
    columns = []
    for row in cursor.fetchall():
        col_name = row[0]
        col_type = row[1]
        is_nullable = row[2] == 'YES'
        key = row[3]  # PRI, UNI, MUL
        default = row[4]
        
        columns.append({
            'name': col_name,
            'type': col_type,
            'nullable': is_nullable,
            'key': key,
            'default': default
        })
    return columns

def create_postgres_table(pg_conn, table_name, columns):
    """Create a PostgreSQL table based on MySQL schema"""
    pg_cur = pg_conn.cursor()
    
    col_defs = []
    for col in columns:
        pg_type = mysql_type_to_postgres(col['type'])
        nullable = '' if col['nullable'] else ' NOT NULL'
        primary = ' PRIMARY KEY' if col['key'] == 'PRI' else ''
        
        # Special handling for auto_increment (usually 'id')
        if 'auto_increment' in col.get('type', '').lower() or (col['name'] == 'id' and col['key'] == 'PRI'):
            col_def = f'"{col["name"]}" VARCHAR(100) PRIMARY KEY'
        else:
            col_def = f'"{col["name"]}" {pg_type}{nullable}{primary}'
        
        col_defs.append(col_def)
    
    create_sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n  ' + ',\n  '.join(col_defs) + '\n)'
    
    try:
        pg_cur.execute(create_sql)
        pg_conn.commit()
        print(f"   ✅ Created table: {table_name}")
    except Exception as e:
        print(f"   ⚠️ Table creation error: {e}")
        pg_conn.rollback()
    
    pg_cur.close()

def convert_value(val):
    """Convert MySQL values to PostgreSQL compatible format"""
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, bytes):
        try:
            return val.decode('utf-8')
        except:
            return None
    if isinstance(val, dict):
        return json.dumps(val)
    return val

def migrate_table_data(mysql_cur, pg_conn, table_name):
    """Migrate all data from a MySQL table to PostgreSQL"""
    print(f"\n📦 Migrating: {table_name}")
    
    # Get data from MySQL
    try:
        mysql_cur.execute(f"SELECT * FROM {table_name}")
        rows = mysql_cur.fetchall()
        columns = [desc[0] for desc in mysql_cur.description]
    except Exception as e:
        print(f"   ❌ MySQL read error: {e}")
        return 0
    
    if not rows:
        print(f"   ⚪ Empty table")
        return 0
    
    print(f"   📊 {len(rows)} rows to migrate")
    
    pg_cur = pg_conn.cursor()
    inserted = 0
    
    for row in rows:
        try:
            values = [convert_value(v) for v in row]
            cols_str = ', '.join([f'"{c}"' for c in columns])
            placeholders = ', '.join(['%s'] * len(values))
            
            query = f'INSERT INTO "{table_name}" ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
            pg_cur.execute(query, values)
            inserted += 1
        except Exception as e:
            # Skip errors silently to continue migration
            pass
    
    pg_conn.commit()
    pg_cur.close()
    
    print(f"   ✅ Inserted {inserted}/{len(rows)} rows")
    return inserted

def migrate_all():
    """Main migration function"""
    print("=" * 60)
    print("🚀 COMPLETE MySQL → Supabase PostgreSQL Migration")
    print("=" * 60)
    
    # Connect to MySQL
    print("\n🔌 Connecting to MySQL...")
    mysql_conn = get_mysql_connection()
    mysql_cur = mysql_conn.cursor()
    
    # Connect to PostgreSQL
    print("🔌 Connecting to Supabase PostgreSQL...")
    pg_conn = get_postgres_connection()
    
    # Get all MySQL tables
    mysql_cur.execute("SHOW TABLES")
    tables = [t[0] for t in mysql_cur.fetchall()]
    print(f"\n📋 Found {len(tables)} tables in MySQL")
    
    total_migrated = 0
    
    for table in tables:
        try:
            # Step 1: Get MySQL schema
            columns = get_mysql_table_schema(mysql_cur, table)
            
            # Step 2: Create PostgreSQL table
            create_postgres_table(pg_conn, table, columns)
            
            # Step 3: Migrate data
            count = migrate_table_data(mysql_cur, pg_conn, table)
            total_migrated += count
            
        except Exception as e:
            print(f"   ❌ Error with {table}: {e}")
    
    # Cleanup
    mysql_cur.close()
    mysql_conn.close()
    pg_conn.close()
    
    print("\n" + "=" * 60)
    print(f"✅ MIGRATION COMPLETE!")
    print(f"   Tables processed: {len(tables)}")
    print(f"   Total rows migrated: {total_migrated}")
    print("=" * 60)

if __name__ == '__main__':
    migrate_all()
