
import os
import random
import uuid
import json
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import execute_values
import numpy as np

# Database connection details
DB_URL = "postgresql://postgres.nwyrcwizbmdvuntgqygd:NeymarRonaldo%402134@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

def get_db_connection():
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"Connection failed: {e}")
        return None

# ==============================================================================
# REALISTIC DATA GENERATORS
# ==============================================================================

VENDORS = [
    {"name": "TCI Express", "type": "TRANSPORTER", "grade": "A"},
    {"name": "Blue Dart Express", "type": "TRANSPORTER", "grade": "A+"},
    {"name": "VRL Logistics", "type": "TRANSPORTER", "grade": "B"},
    {"name": "Gati KWE", "type": "TRANSPORTER", "grade": "B+"},
    {"name": "SafeExpress", "type": "TRANSPORTER", "grade": "A"},
    {"name": "Spoton Logistics", "type": "TRANSPORTER", "grade": "B"},
    {"name": "Rivigo", "type": "TRANSPORTER", "grade": "A"},
    {"name": "Delhivery", "type": "TRANSPORTER", "grade": "A+"},
    {"name": "Mahindra Logistics", "type": "3PL", "grade": "A"},
    {"name": "TVS Supply Chain", "type": "3PL", "grade": "A"}
]

LANES = [
    ("Mumbai", "Delhi"), ("Delhi", "Bangalore"), ("Chennai", "Mumbai"),
    ("Kolkata", "Delhi"), ("Bangalore", "Hyderabad"), ("Pune", "Chennai"),
    ("Ahmedabad", "Mumbai"), ("Jaipur", "Delhi"), ("Surat", "Bangalore")
]

VEHICLES = ["32ft MXL", "20ft Container", "TATA 407", "Canter"]

def generate_full_history():
    print("🌱 Starting Seed Process...")
    conn = get_db_connection()
    if not conn:
        print("❌ Could not connect to DB")
        return

    cur = conn.cursor()

    # 1. APPLY SCHEMA UPDATES
    print("🛠️  Applying Schema Updates...")
    try:
        with open('backend/schema_postgres.sql', 'r') as f:
            schema_sql = f.read()
            # Split by command to avoid issues
            commands = schema_sql.split(';')
            for cmd in commands:
                if cmd.strip():
                    cur.execute(cmd)
        conn.commit()
    except Exception as e:
        print(f"⚠️ Schema update error (might already exist): {e}")
        conn.rollback()

    # 2. SEED VENDORS
    print("🚚 Seeding Vendors...")
    vendor_ids = []
    for v_data in VENDORS:
        v_id = f"VEND-{uuid.uuid4().hex[:8].upper()}"
        vendor_ids.append(v_id)
        
        cur.execute("""
            INSERT INTO vendors (id, name, type, performance_grade, city, state)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (v_id, v_data['name'], v_data['type'], v_data['grade'], 
              random.choice(['Mumbai', 'Delhi', 'Bangalore']), 'India'))
    
    # 3. SEED CONTRACTS & RATE HISTORY (24 MONTHS)
    print("📜 Seeding Contracts & Rate History...")
    contract_ids = []
    
    start_date = datetime.now() - timedelta(days=730)  # 2 years ago
    
    for v_id in vendor_ids:
        # Create 2-3 contracts per vendor
        for _ in range(random.randint(2, 3)):
            c_id = f"CON-{uuid.uuid4().hex[:8].upper()}"
            contract_ids.append(c_id)
            
            # Base contract
            cur.execute("""
                INSERT INTO contracts (
                    id, vendor_id, service_type, valid_from, valid_to, status, 
                    pvc_base_diesel_price, approved_at
                ) VALUES (%s, %s, 'FTL', %s, %s, 'ACTIVE', 95.00, %s)
            """, (c_id, v_id, start_date, datetime.now() + timedelta(days=365), datetime.now()))
            
            # Create Rates & History for this contract
            for lane in random.sample(LANES, 3):
                rate_id = f"RT-{uuid.uuid4().hex[:8].upper()}"
                base_price = random.randint(15000, 45000)
                
                # Insert current rate
                cur.execute("""
                    INSERT INTO freight_rates (
                        id, contract_id, origin, destination, vehicle_type, 
                        base_rate, capacity_ton
                    ) VALUES (%s, %s, %s, %s, %s, %s, 9.0)
                """, (rate_id, c_id, lane[0], lane[1], random.choice(VEHICLES), base_price))
                
                # Generate 24 months of history
                # Simulate price increasing with diesel/inflation
                hist_price = base_price * 0.8  # Start 20% lower
                curr_date = start_date
                
                while curr_date < datetime.now():
                    h_id = f"RH-{uuid.uuid4().hex[:8]}"
                    valid_to = curr_date + timedelta(days=90)
                    
                    # Add volatility/seasonality
                    # Winter/Festive spike
                    month = curr_date.month
                    season_factor = 1.1 if month in [10, 11, 12] else 1.0
                    
                    # Trend increase
                    hist_price *= 1.01 
                    
                    final_rate = hist_price * season_factor
                    
                    market_rate = final_rate * random.uniform(0.95, 1.05)
                    
                    cur.execute("""
                        INSERT INTO rate_history (
                            id, contract_id, rate, valid_from, valid_to, market_rate_at_time
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                    """, (h_id, c_id, final_rate, curr_date, valid_to, market_rate))
                    
                    curr_date = valid_to
    
    # 4. SEED MARKET INDICES
    print("📊 Seeding Market Indices...")
    curr_date = start_date
    while curr_date < datetime.now():
        for lane in LANES:
            idx_id = f"MI-{uuid.uuid4().hex[:8]}"
            base = 3000 if lane[0] == 'Mumbai' else 2500
            
            # Simulated market movement (Random Walk + Trend)
            market_val = base + (curr_date.timestamp() % 1000) + random.randint(-200, 200)
            
            cur.execute("""
                INSERT INTO market_indices (
                    id, origin_region, dest_region, date, avg_market_rate, volatility_index
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (idx_id, lane[0], lane[1], curr_date, market_val, random.uniform(10, 25)))
            
        curr_date += timedelta(days=30)  # Monthly indices
        
    # 5. SEED INVOICES (For Capacity & Anomaly)
    print("💰 Seeding Invoices...")
    curr_date = start_date
    invoice_count = 0
    
    while curr_date < datetime.now():
        # Daily volume varies by seasonality
        month = curr_date.month
        daily_vol = random.randint(5, 15)
        if month in [10, 11, 12]: daily_vol += 5
        
        for _ in range(daily_vol):
            inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
            vendor = VENDORS[random.randint(0, len(VENDORS)-1)]
            amount = random.randint(20000, 80000)
            
            # Inject Anomalies (5% chance)
            is_anomaly = random.random() < 0.05
            if is_anomaly:
                amount *= random.choice([2.5, 0.1])  # Way too high or low
            
            cur.execute("""
                INSERT INTO invoices (
                    id, invoice_number, invoice_date, vendor_name, 
                    total_amount, status, ocr_confidence, contract_matched
                ) VALUES (%s, %s, %s, %s, %s, 'APPROVED', 98.5, TRUE)
            """, (inv_id, f"INV-{random.randint(1000,9999)}", curr_date, vendor['name'], amount))
            
            invoice_count += 1
            
        curr_date += timedelta(days=1)
        
    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✅ Seed Complete!")
    print(f"   - Vendors: {len(VENDORS)}")
    print(f"   - Contracts: {len(contract_ids)}")
    print(f"   - Invoices: {invoice_count}")
    print("   - Rate History & Market Indices populated.")

if __name__ == "__main__":
    generate_full_history()
