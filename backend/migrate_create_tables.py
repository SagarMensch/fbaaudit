"""
Database Migration Script - Create All Required Tables
=======================================================
Run this script to create all tables needed to eliminate mock data.
"""

import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

TABLES_SQL = """
-- =====================================================
-- INVOICES TABLE (Main invoice data)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(100) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(50),
    vendor_name VARCHAR(200),
    invoice_date DATE,
    due_date DATE,
    amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'PENDING',
    match_status VARCHAR(50) DEFAULT 'PENDING',
    origin VARCHAR(200),
    destination VARCHAR(200),
    mode VARCHAR(50),
    lr_number VARCHAR(100),
    po_number VARCHAR(100),
    weight_kg DECIMAL(10,2),
    distance_km DECIMAL(10,2),
    gst_amount DECIMAL(15,2),
    base_amount DECIMAL(15,2),
    extraction_confidence INTEGER DEFAULT 0,
    pdf_path VARCHAR(500),
    excel_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PAYMENT BATCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_batches (
    id VARCHAR(100) PRIMARY KEY,
    batch_name VARCHAR(200),
    vendor_id VARCHAR(50),
    vendor_name VARCHAR(200),
    total_amount DECIMAL(15,2),
    invoice_count INTEGER,
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    bank_reference VARCHAR(100),
    scheduled_date DATE,
    processed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RATE CARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_cards (
    id VARCHAR(100) PRIMARY KEY,
    carrier VARCHAR(200),
    contract_ref VARCHAR(100),
    origin VARCHAR(200),
    destination VARCHAR(200),
    container_type VARCHAR(100),
    rate DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'INR',
    unit VARCHAR(50) DEFAULT 'Per KG',
    valid_from DATE,
    valid_to DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VENDORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    vendor_type VARCHAR(50) DEFAULT 'CARRIER',
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    bank_name VARCHAR(200),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(20),
    performance_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ANALYTICS METRICS TABLE (for KPIs)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100),
    metric_value DECIMAL(15,2),
    metric_date DATE,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def run_migration():
    print("=" * 60)
    print("DATABASE MIGRATION - Creating Tables")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Execute the SQL
        cursor.execute(TABLES_SQL)
        conn.commit()
        
        print("✅ All tables created successfully!")
        
        # List tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        print("\n📊 Tables in database:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migration()
