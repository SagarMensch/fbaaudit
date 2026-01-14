-- ============================================================================
-- ATLAS FREIGHT AUDIT PLATFORM - ADVANCED SCHEMA
-- ============================================================================
-- This schema supports:
-- 1. Master Data Management (Rate, Fuel, Carrier, Contract)
-- 2. Bulk Annexure Processing (Parent → Child hierarchy)
-- 3. Advanced Audit Logic (Fuel formula, Detention, Direction rates)
-- 4. AI Fraud Detection (TBML, Price Physics)
-- ============================================================================

USE ledgerone;

-- ============================================================================
-- MASTER DATA TABLES (The "Truth" Tables)
-- ============================================================================

-- Table: Carrier Master
-- All approved transporters/logistics providers
CREATE TABLE IF NOT EXISTS carrier_master (
    id VARCHAR(36) PRIMARY KEY,
    carrier_code VARCHAR(50) UNIQUE NOT NULL,
    carrier_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2, 1), -- 1.0 to 5.0
    blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_carrier_code ON carrier_master(carrier_code);
CREATE INDEX idx_carrier_gstin ON carrier_master(gstin);

-- Table: Route Master
-- All origin-destination pairs with distance and directionality
CREATE TABLE IF NOT EXISTS route_master (
    id VARCHAR(36) PRIMARY KEY,
    route_code VARCHAR(50) UNIQUE NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km INT NOT NULL,
    direction ENUM('HEAD_HAUL', 'BACK_HAUL') DEFAULT 'HEAD_HAUL',
    zone VARCHAR(50), -- NORTH, SOUTH, EAST, WEST, CENTRAL
    estimated_transit_days INT,
    toll_points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_route_origin_dest ON route_master(origin, destination);
CREATE INDEX idx_route_code ON route_master(route_code);

-- Table: Fuel Master
-- Government diesel price history
CREATE TABLE IF NOT EXISTS fuel_master (
    id VARCHAR(36) PRIMARY KEY,
    effective_date DATE NOT NULL,
    diesel_price_per_liter DECIMAL(6, 2) NOT NULL,
    city VARCHAR(100),
    source VARCHAR(50) DEFAULT 'GOVT', -- GOVT, API, MANUAL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fuel_date (effective_date, city)
);

CREATE INDEX idx_fuel_date ON fuel_master(effective_date DESC);

-- Table: Rate Card Master
-- Contract rates per carrier, route, vehicle type
CREATE TABLE IF NOT EXISTS rate_card_master (
    id VARCHAR(36) PRIMARY KEY,
    contract_id VARCHAR(36), -- Links to contract table
    carrier_id VARCHAR(36) NOT NULL,
    route_id VARCHAR(36) NOT NULL,
    vehicle_type ENUM('6W', '10W', '12W', '14W', '16W', '18W', 'TAURUS', 'TRAILER') NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL, -- Base freight per tonnage or per trip
    rate_unit ENUM('PER_TON', 'PER_KG', 'PER_TRIP', 'PER_KM') DEFAULT 'PER_TON',
    min_weight_kg INT,
    max_weight_kg INT,
    fuel_inclusive BOOLEAN DEFAULT FALSE, -- If true, fuel is in base rate
    detention_free_hours INT DEFAULT 24, -- Free waiting time
    detention_per_hour DECIMAL(8, 2) DEFAULT 0,
    handling_inclusive BOOLEAN DEFAULT TRUE, -- Hamali included?
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (carrier_id) REFERENCES carrier_master(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES route_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rate_carrier_route ON rate_card_master(carrier_id, route_id, is_active);
CREATE INDEX idx_rate_validity ON rate_card_master(valid_from, valid_to);

-- Table: Contract Master
-- High-level contracts with carriers
CREATE TABLE IF NOT EXISTS contract_master (
    id VARCHAR(36) PRIMARY KEY,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    carrier_id VARCHAR(36) NOT NULL,
    contract_type ENUM('ANNUAL', 'QUARTERLY', 'SPOT', 'TRANSACTIONAL') DEFAULT 'ANNUAL',
    start_date DATE NOT NULL,
    end_date DATE,
    total_value DECIMAL(15, 2),
    payment_terms VARCHAR(50), -- NET30, NET45, etc.
    auto_renew BOOLEAN DEFAULT FALSE,
    status ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED') DEFAULT 'DRAFT',
    notes TEXT,
    signed_document_path VARCHAR(500),
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (carrier_id) REFERENCES carrier_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_contract_carrier ON contract_master(carrier_id);
CREATE INDEX idx_contract_status ON contract_master(status);

-- ============================================================================
-- INVOICE & LINE ITEMS TABLES (Parent → Child Hierarchy)
-- ============================================================================

-- PARENT: Invoice Header (Already exists, but enhanced)
ALTER TABLE supplier_invoices 
ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
ADD COLUMN IF NOT EXISTS total_taxable_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_consolidated BOOLEAN DEFAULT FALSE, -- Bulk annexure flag
ADD COLUMN IF NOT EXISTS line_item_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS approved_at DATETIME,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS rejected_at DATETIME,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- CHILD: Invoice Line Items (The Annexure)
-- Each row represents one LR/shipment
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL, -- Parent invoice
    line_number INT NOT NULL, -- 1, 2, 3... (from Excel row)
    lr_number VARCHAR(100) NOT NULL, -- CRITICAL: The LR/Docket/CN Number
    lr_date DATE,
    
    -- Route Details
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    route_id VARCHAR(36), -- Matched route from route_master
    
    -- Shipment Details
    vehicle_number VARCHAR(20),
    vehicle_type VARCHAR(20),
    weight_kg DECIMAL(10, 2),
    commodity VARCHAR(255),
    
    -- Cost Breakdown
    base_freight DECIMAL(10, 2) NOT NULL,
    fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
    handling_charges DECIMAL(10, 2) DEFAULT 0,
    detention_charges DECIMAL(10, 2) DEFAULT 0,
    other_charges DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(10, 2) NOT NULL, -- SUM of all above
    
    -- Audit Flags
    is_duplicate BOOLEAN DEFAULT FALSE, -- Duplicate LR check
    duplicate_invoice_id VARCHAR(50), -- If duplicate, which invoice paid it
    is_overcharged BOOLEAN DEFAULT FALSE, -- Rate variance flag
    overcharge_amount DECIMAL(10, 2), -- Expected vs Actual difference
    audit_status ENUM('PENDING', 'PASSED', 'FLAGGED', 'EXCEPTION') DEFAULT 'PENDING',
    audit_notes TEXT,
    
    -- POD Status
    pod_required BOOLEAN DEFAULT TRUE,
    pod_uploaded BOOLEAN DEFAULT FALSE,
    pod_document_id VARCHAR(50), -- Links to invoice_documents
    pod_verified_by VARCHAR(100),
    pod_verified_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES route_master(id) ON DELETE SET NULL,
    UNIQUE KEY unique_lr_per_invoice (invoice_id, lr_number)
);

CREATE INDEX idx_line_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_lr ON invoice_line_items(lr_number);
CREATE INDEX idx_line_audit_status ON invoice_line_items(audit_status);
CREATE INDEX idx_line_duplicate ON invoice_line_items(is_duplicate);

-- ============================================================================
-- AUDIT HISTORY TABLES (For Duplicate Detection & Analytics)
-- ============================================================================

-- Table: LR Payment History
-- Tracks all LRs that have been paid (to prevent re-billing)
CREATE TABLE IF NOT EXISTS lr_payment_history (
    id VARCHAR(36) PRIMARY KEY,
    lr_number VARCHAR(100) NOT NULL,
    invoice_id VARCHAR(50) NOT NULL,
    line_item_id VARCHAR(36) NOT NULL,
    carrier_id VARCHAR(36),
    paid_amount DECIMAL(10, 2) NOT NULL,
    paid_date DATE NOT NULL,
    payment_batch_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (line_item_id) REFERENCES invoice_line_items(id) ON DELETE CASCADE,
    INDEX idx_lr_number (lr_number)
);

-- ============================================================================
-- BULK UPLOAD METADATA (Track Excel file uploads)
-- ============================================================================

CREATE TABLE IF NOT EXISTS annexure_uploads (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    total_rows INT NOT NULL,
    valid_rows INT DEFAULT 0,
    invalid_rows INT DEFAULT 0,
    duplicate_rows INT DEFAULT 0,
    column_mapping JSON, -- Stores the Excel → System column mapping
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(100),
    FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id) ON DELETE CASCADE
);

-- ============================================================================
-- VENDOR MASTER DATA MEMORY (Column Mapping for Excel)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_excel_templates (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255),
    template_name VARCHAR(255), -- "Blue Dart Standard", "VRL Format A"
    column_mapping JSON NOT NULL, -- {"LR Number": "Docket No", "Weight": "Chrg Wt", ...}
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vendor_template (vendor_id, template_name)
);

-- ============================================================================
-- GATE ENTRY/EXIT LOGS (For Detention Calculation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gate_logs (
    id VARCHAR(36) PRIMARY KEY,
    lr_number VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(20),
    gate_type ENUM('ENTRY', 'EXIT') NOT NULL,
    gate_time DATETIME NOT NULL,
    location VARCHAR(255), -- Warehouse/Plant name
    recorded_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gate_lr (lr_number),
    INDEX idx_gate_vehicle (vehicle_number),
    INDEX idx_gate_time (gate_time)
);

-- ============================================================================
-- AI/ML TRAINING DATA TABLES
-- ============================================================================

-- Table: Price Benchmarks (For TBML Detection)
CREATE TABLE IF NOT EXISTS price_benchmarks (
    id VARCHAR(36) PRIMARY KEY,
    commodity VARCHAR(255) NOT NULL,
    median_price_per_kg DECIMAL(10, 2) NOT NULL,
    min_price_per_kg DECIMAL(10, 2),
    max_price_per_kg DECIMAL(10, 2),
    sample_size INT, -- How many data points used
    effective_date DATE NOT NULL,
    source VARCHAR(100) DEFAULT 'HISTORICAL', -- HISTORICAL, GLOBAL_API, MANUAL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_commodity ON price_benchmarks(commodity, effective_date DESC);

-- ============================================================================
-- COMPLETE! INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_invoices_consolidated ON supplier_invoices(is_consolidated);
CREATE INDEX idx_invoices_status ON supplier_invoices(status);
CREATE INDEX idx_invoices_date ON supplier_invoices(invoice_date);
