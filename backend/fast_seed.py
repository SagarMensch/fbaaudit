
import os
import random
import uuid
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta

DB_URL = "postgresql://postgres.nwyrcwizbmdvuntgqygd:NeymarRonaldo%402134@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

def fast_seed():
    print("🚀 Starting Fast Seed...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # 1. Vendors (Batch)
    print("Generating Vendors...")
    vendors = []
    vendor_ids = []
    for _ in range(50):
        v_id = f"VEND-{uuid.uuid4().hex[:8].upper()}"
        vendor_ids.append(v_id)
        name = f"Transporter {random.randint(100,999)}"
        vendors.append((v_id, name, 'TRANSPORTER', 'A', 'Mumbai', 'India'))
        
    execute_values(cur, """
        INSERT INTO vendors (id, name, type, performance_grade, city, state)
        VALUES %s ON CONFLICT (id) DO NOTHING
    """, vendors)

    # 2. Invoices (Batch) - Critical for Forecast
    print("Generating Invoices...")
    invoices = []
    start_date = datetime.now() - timedelta(days=730)
    curr_date = start_date
    
    while curr_date < datetime.now():
        daily_vol = random.randint(5, 15)
        # Add Seasonality
        if curr_date.month in [10, 11, 12]: daily_vol += 8
        
        for _ in range(daily_vol):
            inv_id = f"INV-{uuid.uuid4().hex[:8]}"
            vendor_name = f"Transporter {random.randint(100,999)}"
            amount = random.randint(20000, 80000)
            invoices.append((
                inv_id, 
                f"INV-{random.randint(10000,99999)}", 
                curr_date, 
                vendor_name, 
                amount,
                'APPROVED'
            ))
        curr_date += timedelta(days=1)

    execute_values(cur, """
        INSERT INTO invoices (id, invoice_number, invoice_date, vendor_name, total_amount, status)
        VALUES %s ON CONFLICT (id) DO NOTHING
    """, invoices)
    
    conn.commit()
    print(f"✅ Inserted {len(vendors)} vendors and {len(invoices)} invoices instantly.")
    conn.close()

if __name__ == "__main__":
    fast_seed()
