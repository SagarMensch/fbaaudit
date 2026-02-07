"""
Initialize Payment System Database Tables
Run this script to create all required tables for the payment system.
"""

import mysql.connector
import os

# Database connection - using same config as db_config.py
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Password123!',
    'database': 'ledgerone'
}

# SQL statements to create tables
CREATE_TABLES = """
-- Payment Batches
CREATE TABLE IF NOT EXISTS payment_batches (
    id VARCHAR(36) PRIMARY KEY,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    invoice_count INT DEFAULT 0,
    status ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED') DEFAULT 'DRAFT',
    payment_method ENUM('ACH', 'WIRE', 'CHECK', 'NEFT', 'RTGS', 'UPI', 'IMPS') DEFAULT 'NEFT',
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at DATETIME,
    bank_reference VARCHAR(100),
    bank_account VARCHAR(50),
    scheduled_date DATE,
    paid_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(36) PRIMARY KEY,
    batch_id VARCHAR(36),
    invoice_id VARCHAR(50) NOT NULL,
    vendor_id VARCHAR(50),
    vendor_name VARCHAR(255),
    original_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    final_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(10, 6) DEFAULT 1.000000,
    base_currency_amount DECIMAL(15, 2),
    status ENUM('PENDING', 'INCLUDED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    payment_reference VARCHAR(100),
    paid_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Reconciliations
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id VARCHAR(36) PRIMARY KEY,
    statement_id VARCHAR(50),
    transaction_date DATE NOT NULL,
    value_date DATE,
    bank_reference VARCHAR(100),
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('CREDIT', 'DEBIT') NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    bank_account VARCHAR(50),
    status ENUM('UNMATCHED', 'MATCHED', 'EXCEPTION', 'IGNORED') DEFAULT 'UNMATCHED',
    matched_batch_id VARCHAR(36),
    matched_invoice_id VARCHAR(50),
    matched_by VARCHAR(100),
    matched_at DATETIME,
    exception_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Early Payment Terms
CREATE TABLE IF NOT EXISTS early_payment_terms (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(100) NOT NULL,
    vendor_name VARCHAR(255),
    discount_percent DECIMAL(5, 2) NOT NULL,
    days_early INT NOT NULL,
    standard_payment_days INT DEFAULT 30,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(100) NOT NULL,
    type ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'APPROVAL_REQUIRED', 'PAYMENT_READY', 'PAYMENT_COMPLETED') DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Currency Rates
CREATE TABLE IF NOT EXISTS currency_rates (
    id VARCHAR(36) PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'MANUAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_database():
    print("=" * 60)
    print("PAYMENT SYSTEM DATABASE INITIALIZATION")
    print("=" * 60)
    
    try:
        # Connect to database
        print(f"\n[1] Connecting to MySQL database '{DB_CONFIG['database']}'...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("    ✅ Connected successfully!")
        
        # Execute each CREATE TABLE statement
        print("\n[2] Creating payment tables...")
        statements = CREATE_TABLES.strip().split(';')
        
        for stmt in statements:
            stmt = stmt.strip()
            if stmt and not stmt.startswith('--'):
                try:
                    cursor.execute(stmt)
                    # Extract table name
                    if 'CREATE TABLE' in stmt:
                        table_name = stmt.split('CREATE TABLE IF NOT EXISTS ')[1].split('(')[0].strip()
                        print(f"    ✅ Created table: {table_name}")
                except mysql.connector.Error as e:
                    if 'already exists' not in str(e):
                        print(f"    ⚠️ Warning: {e}")
        
        conn.commit()
        
        # Verify tables
        print("\n[3] Verifying tables...")
        cursor.execute("SHOW TABLES LIKE 'payment%'")
        payment_tables = cursor.fetchall()
        cursor.execute("SHOW TABLES LIKE 'bank%'")
        bank_tables = cursor.fetchall()
        cursor.execute("SHOW TABLES LIKE 'early%'")
        early_tables = cursor.fetchall()
        cursor.execute("SHOW TABLES LIKE 'currency%'")
        currency_tables = cursor.fetchall()
        
        all_tables = payment_tables + bank_tables + early_tables + currency_tables
        print(f"    Found {len(all_tables)} payment-related tables:")
        for t in all_tables:
            print(f"      - {t[0]}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("✅ DATABASE INITIALIZATION COMPLETE!")
        print("=" * 60)
        print("\nNow restart the backend: python app.py")
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database Error: {e}")
        print("\nMake sure:")
        print("  1. MySQL is running")
        print("  2. Database 'ledgerone' exists")
        print("  3. Update DB_CONFIG password if needed")


if __name__ == '__main__':
    init_database()
