"""Test single contract insert to debug"""
import sys
import uuid
sys.path.insert(0, '.')
from services.postgres_helper import get_postgres_connection

conn = get_postgres_connection()
cur = conn.cursor()

# First, get an existing vendor
cur.execute("SELECT id, name FROM vendors LIMIT 1")
vendor = cur.fetchone()
print(f"Using vendor: {vendor}")

if vendor:
    vendor_id = vendor[0]
    vendor_name = vendor[1]
    
    # Try to insert a contract
    contract_id = str(uuid.uuid4())
    try:
        cur.execute("""
            INSERT INTO contracts (id, contract_number, vendor_id, vendor_name, service_type, valid_from, valid_to, status)
            VALUES (%s, %s, %s, %s, 'FCL', '2025-01-01', '2026-01-31', 'ACTIVE')
        """, (contract_id, 'TEST-001', vendor_id, vendor_name))
        conn.commit()
        print(f"SUCCESS: Contract inserted with id {contract_id}")
        
        # Now try to insert a rate
        rate_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO freight_rates (id, contract_id, origin, destination, vehicle_type, rate_basis, base_rate, is_active)
            VALUES (%s, %s, %s, %s, '20FT Container', 'Per Trip', 2000.00, TRUE)
        """, (rate_id, contract_id, 'Chicago', 'LA'))
        conn.commit()
        print(f"SUCCESS: Rate inserted with id {rate_id}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        conn.rollback()
        
        # Check what columns are required
        cur.execute("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'contracts' AND is_nullable = 'NO'
        """)
        print("\nREQUIRED columns in contracts:")
        for r in cur.fetchall():
            print(f"  - {r[0]}")

conn.close()
