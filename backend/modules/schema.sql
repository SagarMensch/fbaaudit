-- ============================================================================
-- CANONICAL DATA MODELS (SAP-STYLE)
-- Module: Core Architecture
-- ============================================================================

-- 1. SHIPMENT (Ingestion / Logistics)
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(50) PRIMARY KEY,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    contract_id VARCHAR(50),
    carrier_id VARCHAR(50),
    origin VARCHAR(100),
    destination VARCHAR(100),
    incoterm VARCHAR(20),
    shipment_date DATE,
    status ENUM('BOOKED', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION') DEFAULT 'BOOKED',
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (carrier_id) REFERENCES vendors(id)
);

-- 2. INVOICE (Audit / Finance)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    shipment_id VARCHAR(50),
    vendor_id VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    billed_amount DECIMAL(15,2) NOT NULL,
    audit_status ENUM('PENDING_MATCH', 'MATCH_FAILED', 'RATED', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_MATCH',
    variance_pct DECIMAL(5,2),
    audit_log_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- 3. CONTRACT (Contracts)
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL,
    rate_type ENUM('FTL_TRIP', 'LTL_KG', 'PTL_SLAB') NOT NULL,
    fuel_clause_id VARCHAR(50),
    tolerance_pct DECIMAL(5,2) DEFAULT 2.00,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    status ENUM('DRAFT', 'ACTIVE', 'EXPIRED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- 4. AUDIT LOG (Platform)
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('SHIPMENT', 'INVOICE', 'CONTRACT') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_value JSON,
    new_value JSON,
    user_id VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. DISPUTES (Disputes)
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    reason_code ENUM('RATE_MISMATCH', 'WEIGHT_DISCREPANCY', 'DUPLICATE') NOT NULL,
    status ENUM('OPEN', 'VENDOR_REPLIED', 'RESOLVED') DEFAULT 'OPEN',
    resolution_action ENUM('CREDIT_NOTE', 'DEBIT_NOTE', 'FORCE_APPROVE'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
