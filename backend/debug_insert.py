"""Debug contract and rate insertion"""
import sys
import uuid
sys.path.insert(0, '.')
from services.postgres_helper import get_postgres_connection

conn = get_postgres_connection()
cur = conn.cursor()

print("=== DEBUGGING CONTRACT/RATE INSERT ===\n")

# Get a vendor ID
cur.execute("SELECT id, name FROM vendors LIMIT 1")
vendor = cur.fetchone()
if not vendor:
    print("ERROR: No vendors in database!")
    sys.exit(1)
    
vid, vname = vendor
print(f"Using vendor: id={vid}, name={vname}")

# Test contract insert
cid = str(uuid.uuid4())
print(f"\nTrying to insert contract: id={cid[:8]}...")

try:
    candidate_types = [
        'FCL', 'fcl', 'Fcl', 
        'LCL', 'lcl',
        'FTL', 'ftl',
        'OCEAN', 'ocean',
        'SEA', 'sea',
        'Full Container Load',
        'Ocean Freight'
    ]
    
    success = False
    for s_type in candidate_types:
        try:
            print(f"Trying service_type='{s_type}'...")
            cur.execute("""
                INSERT INTO contracts 
                (id, contract_number, vendor_id, vendor_name, service_type, valid_from, valid_to, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE')
            """, (cid, 'GB01/0010', vid, vname, s_type, '2025-01-01', '2026-01-31'))
            conn.commit()
            print(f"✅ SUCCESS! Valid service_type is: '{s_type}'")
            success = True
            break
        except Exception as e:
            conn.rollback()
            # print(f"  Failed: {e}")
            pass
            
    if not success:
        print("❌ All candidate types failed!")
        
    if success:
        # Now test rate
        rid = str(uuid.uuid4())
    print(f"\nTrying to insert rate: id={rid[:8]}...")
    
    cur.execute("""
        INSERT INTO freight_rates 
        (id, contract_id, origin, destination, vehicle_type, rate_basis, base_rate, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (rid, cid, 'Fairburn', 'Colon Free Zone', '20FT', 'Per Trip', 2120.00, True))
    conn.commit()
    print("SUCCESS: Rate inserted!")
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM contracts")
    print(f"\nContracts count: {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(*) FROM freight_rates")
    print(f"Rates count: {cur.fetchone()[0]}")
    
except Exception as e:
    print(f"\n❌ INSERT FAILED!")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    if hasattr(e, 'pgcode'):
        print(f"Postgres Code: {e.pgcode}")
    if hasattr(e, 'pgerror'):
        print(f"Postgres Error: {e.pgerror}")
        
    conn.rollback()

conn.close()
