-- Postgres Schema for LedgerOne (Supabase)
-- Converted from schema.sql and services code

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'TRANSPORTER', -- TRANSPORTER, FUEL, MAINTENANCE, ETC.
    pan VARCHAR(20),
    gstin VARCHAR(20),
    contact_name VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    performance_grade VARCHAR(5) DEFAULT 'B',
    onboarding_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) REFERENCES vendors(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255),
    service_type VARCHAR(50) DEFAULT 'FTL',
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    is_rcm_applicable BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, ACTIVE, EXPIRED, TERMINATED
    
    pvc_base_diesel_price DECIMAL(10, 2),
    pvc_mileage_benchmark DECIMAL(10, 2),
    pvc_reference_city VARCHAR(100),
    
    sla_otd_target DECIMAL(5, 2) DEFAULT 95.0,
    sla_pod_days INT DEFAULT 7,
    
    accessorials JSONB,
    gst_rate DECIMAL(5, 2) DEFAULT 5.0,
    
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Freight Rates
CREATE TABLE IF NOT EXISTS freight_rates (
    id VARCHAR(50) PRIMARY KEY,
    contract_id VARCHAR(50) REFERENCES contracts(id) ON DELETE CASCADE,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    capacity_ton DECIMAL(10, 2),
    rate_basis VARCHAR(50) DEFAULT 'Per Trip', -- Per Trip, Per Kg, Per Ton
    base_rate DECIMAL(15, 2) NOT NULL,
    min_charge DECIMAL(15, 2),
    transit_time_hrs INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Rate History (For BSTS/GARCH Analysis)
CREATE TABLE IF NOT EXISTS rate_history (
    id VARCHAR(50) PRIMARY KEY,
    contract_id VARCHAR(50) REFERENCES contracts(id) ON DELETE CASCADE,
    rate DECIMAL(15, 2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    market_rate_at_time DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Market Indices (For Benchmarking)
CREATE TABLE IF NOT EXISTS market_indices (
    id VARCHAR(50) PRIMARY KEY,
    origin_region VARCHAR(100),
    dest_region VARCHAR(100),
    date DATE NOT NULL,
    avg_market_rate DECIMAL(15, 2),
    volatility_index DECIMAL(10, 2),
    source VARCHAR(50) DEFAULT 'MARKET_SURVEY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'SUPPLIER', -- SUPPLIER, ADMIN, LOGISTICS, FINANCE
    vendor_id VARCHAR(50) REFERENCES vendors(id) ON DELETE SET NULL,
    department VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    login_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Supplier Documents
CREATE TABLE IF NOT EXISTS supplier_documents (
    id VARCHAR(50) PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
    upload_date DATE NOT NULL,
    verified_date DATE,
    expiry_date DATE,
    file_path VARCHAR(500),
    file_size VARCHAR(50),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE,
    due_date DATE,
    
    vendor_id VARCHAR(50),
    vendor_name VARCHAR(255),
    vendor_gstin VARCHAR(50),
    
    contract_id VARCHAR(50),
    shipment_id VARCHAR(50),
    po_number VARCHAR(100),
    
    origin VARCHAR(100),
    destination VARCHAR(100),
    vehicle_number VARCHAR(50),
    vehicle_type VARCHAR(50),
    lr_number VARCHAR(50),
    
    base_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    fuel_surcharge DECIMAL(15, 2) DEFAULT 0,
    accessorial_charges DECIMAL(15, 2) DEFAULT 0,
    other_charges DECIMAL(15, 2) DEFAULT 0,
    
    subtotal DECIMAL(15, 2) DEFAULT 0,
    cgst_amount DECIMAL(15, 2) DEFAULT 0,
    sgst_amount DECIMAL(15, 2) DEFAULT 0,
    igst_amount DECIMAL(15, 2) DEFAULT 0,
    tds_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    status VARCHAR(50) DEFAULT 'PENDING_OCR',
    
    ocr_confidence DECIMAL(5, 2),
    ocr_raw_text TEXT,
    ocr_processed_at TIMESTAMP,
    
    sentinel_results JSONB,
    sentinel_passed BOOLEAN DEFAULT FALSE,
    sentinel_validated_at TIMESTAMP,
    
    contract_matched BOOLEAN,
    contract_rate DECIMAL(15, 2),
    rate_variance DECIMAL(15, 2),
    
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    
    rejection_reason TEXT,
    
    invoice_path VARCHAR(500),
    lr_path VARCHAR(500),
    pod_path VARCHAR(500),
    supporting_docs JSONB,
    
    line_items JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
