"""
Complete PostgreSQL Migration Script
====================================
Migrates the entire LedgerOne schema to PostgreSQL/Supabase.
Replaces all previous MySQL migration logic.
"""

import psycopg2
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
# Fallback if env not set (for testing)
if not DATABASE_URL:
    print("⚠️  DATABASE_URL not found in .env, checking local default...")
    # DATABASE_URL = 'postgresql://user:pass@localhost:5432/ledgerone' 

def run_migration():
    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL is not set.")
        return False

    print("\n" + "="*60)
    print("🚀 LEDGERONE POSTGRESQL MIGRATION ")
    print("="*60)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # 1. READ SCHEMA
        schema_path = os.path.join(os.path.dirname(__file__), 'schema_complete_postgres.sql')
        print(f"\n📂 Reading schema from {os.path.basename(schema_path)}...")
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        # 2. EXECUTE SCHEMA
        print("\n⚙️  Applying schema updates...")
        cursor.execute(sql_script)
        conn.commit()
        print("✅ Schema applied successfully.")

        # 3. SEED DATA (Vendors, Contracts, etc.)
        seed_data(cursor)
        conn.commit()

        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print("🎉 MIGRATION & SEEDING COMPLETE!")
        print("="*60)
        return True

    except Exception as e:
        print(f"\n❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def seed_data(cursor):
    print("\n🌱 Seeding Initial Data...")

    # --- VENDORS ---
    vendors = [
        ('TCI001', 'TCI Express Limited', 'TRANSPORTER', '06AAACT1234M1Z2', 'logistics@tciexpress.in', 'A'),
        ('BD001', 'Blue Dart Express Limited', 'COURIER', '27AABCB1234F1Z5', 'corporate@bluedart.com', 'A'),
        ('DEL001', 'Delhivery Limited', 'TRANSPORTER', '06AABCD1234M1Z2', 'business@delhivery.com', 'A'),
        ('VRL001', 'VRL Logistics Limited', 'TRANSPORTER', '29AABCV1234F1Z5', 'logistics@vrlgroup.in', 'B'),
        ('GATI001', 'Gati Limited', 'TRANSPORTER', '36AABCG1234M1Z2', 'sales@gati.com', 'B'),
    ]
    
    print(f"   • Seeding {len(vendors)} vendors...")
    for v in vendors:
        cursor.execute("""
            INSERT INTO vendors (id, name, type, gstin, contact_email, performance_grade)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name,
                contact_email = EXCLUDED.contact_email;
        """, v)

    # --- USERS ---
    users = [
        ('USR-ADMIN-001', 'admin@ledgerone.com', 'admin123', 'System Admin', 'ADMIN', None),
        ('USR-FIN-001', 'finance@ledgerone.com', 'finance123', 'Finance Team', 'FINANCE', None),
        ('USR-SUP-001', 'john@tciexpress.in', '12345678', 'John Smith', 'SUPPLIER', 'TCI001'),
    ]
    
    print(f"   • Seeding {len(users)} users...")
    for u in users:
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, name, role, vendor_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET 
                email = EXCLUDED.email,
                name = EXCLUDED.name;
        """, u)

    # --- CONTRACTS ---
    print(f"   • Seeding contracts & rates...")
    
    # Contract 1: TCI Express
    cursor.execute("""
        INSERT INTO contracts (
            id, vendor_id, vendor_name, service_type, valid_from, valid_to, 
            payment_terms, status, pvc_base_diesel_price, pvc_mileage_benchmark, pvc_reference_city
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING;
    """, ('CNT-2024-001', 'TCI001', 'TCI Express Limited', 'Express', '2024-01-01', '2025-12-31', 
          'Net 45', 'ACTIVE', 94.50, 4.0, 'Delhi'))

    # Rates for TCI
    rates = [
        ('FR-001', 'CNT-2024-001', 'Delhi', 'Mumbai', '32ft MXL', 15, 'Per Kg', 12.50),
        ('FR-002', 'CNT-2024-001', 'Mumbai', 'Bangalore', '32ft MXL', 15, 'Per Kg', 14.00),
    ]
    for r in rates:
        cursor.execute("""
            INSERT INTO freight_rates (id, contract_id, origin, destination, vehicle_type, capacity_ton, rate_basis, base_rate, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
            ON CONFLICT (id) DO NOTHING;
        """, r)

    # Contract 2: Blue Dart
    cursor.execute("""
        INSERT INTO contracts (
            id, vendor_id, vendor_name, service_type, valid_from, valid_to, 
            payment_terms, status, pvc_base_diesel_price, pvc_mileage_benchmark, pvc_reference_city
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING;
    """, ('CNT-2024-002', 'BD001', 'Blue Dart Express', 'Air', '2024-01-01', '2025-06-30', 
          'Net 30', 'ACTIVE', 102.80, 5.0, 'Mumbai'))

    # Rates for Blue Dart
    rates_bd = [
        ('FR-005', 'CNT-2024-002', 'Mumbai', 'Delhi', 'Air', 2, 'Per Kg', 18.00),
    ]
    for r in rates_bd:
        cursor.execute("""
            INSERT INTO freight_rates (id, contract_id, origin, destination, vehicle_type, capacity_ton, rate_basis, base_rate, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
            ON CONFLICT (id) DO NOTHING;
        """, r)
        
    # --- FUEL PRICES ---
    fuel = [
        ('FUEL-DEL-001', 'Delhi', 'Delhi', 94.50, '2024-01-01'),
        ('FUEL-MUM-001', 'Mumbai', 'Maharashtra', 102.80, '2024-01-01'),
    ]
    print(f"   • Seeding {len(fuel)} fuel prices...")
    for f in fuel:
        cursor.execute("""
            INSERT INTO fuel_prices (id, city, state, price, effective_date)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;
        """, f)

    print("✅ Data seeding complete.")

if __name__ == "__main__":
    run_migration()
