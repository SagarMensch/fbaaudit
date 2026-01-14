
import sqlite3
import uuid
import datetime

# Using SQLite for local mock or psycopg2 if strictly postgres
# Since environment details are limited, I'll generate the SQL insert statements 
# that the user can run, or try to run against a local SQLite file 'ledgerone.db' if it exists,
# effectively simulating the "Postgres" integration for the local prototype.

def generate_sql_seed():
    contract_id = str(uuid.uuid4())
    rate_id = str(uuid.uuid4())
    vendor_id = "TCI-EXPRESS-001" # Fixed ID for consistency
    
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    print("-- EXECUTE THESE COMMANDS TO SEED POSTGRES --")
    
    # 1. Insert Vendor
    print(f"""
    INSERT INTO vendors (id, name, type, gstin, performance_grade, is_active)
    VALUES ('{vendor_id}', 'TCI Express Limited', 'TRANSPORTER', '06AAACT6246H1Z8', 'A', TRUE)
    ON CONFLICT (id) DO NOTHING;
    """)

    # 2. Insert Contract
    print(f"""
    INSERT INTO contracts (id, vendor_id, vendor_name, service_type, valid_from, valid_to, status, approved_at)
    VALUES ('{contract_id}', '{vendor_id}', 'TCI Express Limited', 'SURFACE_LTL', '2024-01-01', '2025-12-31', 'ACTIVE', '{timestamp}');
    """)

    # 3. Insert Freight Rate (Mumbai -> Delhi)
    # Matches the PDF: Base Rate 21/kg, Min Charge 1500
    print(f"""
    INSERT INTO freight_rates (id, contract_id, origin, destination, vehicle_type, capacity_ton, rate_basis, base_rate, min_charge, transit_time_hrs)
    VALUES ('{rate_id}', '{contract_id}', 'Mumbai', 'Delhi', 'LTL', 0, 'Per Kg', 21.00, 1500.00, 72);
    """)
    
    print("-- END SEED DATA --")

if __name__ == "__main__":
    generate_sql_seed()
