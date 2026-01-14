-- ============================================================================
-- LEDGERONE COMPLETE DATABASE SCHEMA
-- Version: 2.0 - Full MySQL Integration
-- Created: 2026-01-01
-- ============================================================================

CREATE DATABASE IF NOT EXISTS ledgerone;
USE ledgerone;

-- ============================================================================
-- 1. VENDORS/CARRIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('TRANSPORTER', 'COURIER', 'FREIGHT_FORWARDER', '3PL') NOT NULL DEFAULT 'TRANSPORTER',
    pan VARCHAR(20),
    gstin VARCHAR(20),
    contact_name VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    performance_grade VARCHAR(5) DEFAULT 'B',
    onboarding_status ENUM('PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (is_active)
);

-- ============================================================================
-- 2. USERS TABLE (Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'FINANCE', 'OPERATIONS', 'AUDIT', 'SUPPLIER') NOT NULL,
    vendor_id VARCHAR(50), -- Links supplier users to vendor
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    login_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- ============================================================================
-- 3. LOCATIONS TABLE (Master Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('PLANT', 'WAREHOUSE', 'DEPOT', 'PORT', 'CUSTOMER', 'HUB') NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    gstin VARCHAR(20),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    operating_hours VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_type (type),
    INDEX idx_code (code)
);

-- ============================================================================
-- 4. CONTRACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY,
    contract_number VARCHAR(50) UNIQUE,
    vendor_id VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    service_type ENUM('FTL', 'LTL', 'Express', 'Air', 'Multimodal') NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    is_rcm_applicable BOOLEAN DEFAULT FALSE,
    status ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'TERMINATED') DEFAULT 'DRAFT',
    
    -- PVC Configuration (Price Variance Clause)
    pvc_base_diesel_price DECIMAL(10,2),
    pvc_mileage_benchmark DECIMAL(5,2),
    pvc_reference_city VARCHAR(50),
    
    -- Accessorials JSON (complex nested config)
    accessorials JSON,
    
    -- Parties (Shipper/Carrier details)
    shipper_name VARCHAR(255),
    shipper_gstin VARCHAR(20),
    shipper_address TEXT,
    carrier_legal_name VARCHAR(255),
    carrier_gstin VARCHAR(20),
    carrier_address TEXT,
    
    -- SLA Configuration
    sla_otd_target DECIMAL(5,2) DEFAULT 95.00,
    sla_pod_days INT DEFAULT 7,
    sla_damage_limit DECIMAL(5,2) DEFAULT 0.50,
    sla_penalties JSON,
    sla_incentives JSON,
    
    -- Insurance
    insurance_coverage DECIMAL(15,2),
    insurance_liability_limit DECIMAL(15,2),
    insurance_claims_process TEXT,
    
    -- Terms
    governing_law TEXT,
    termination_notice_days INT DEFAULT 90,
    dispute_resolution TEXT,
    
    -- GST Details
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    gst_rcm_split VARCHAR(50),
    
    -- Metadata
    created_by VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_status (status),
    INDEX idx_valid (valid_from, valid_to)
);

-- ============================================================================
-- 5. FREIGHT RATES TABLE (Contract Rate Matrix)
-- ============================================================================
CREATE TABLE IF NOT EXISTS freight_rates (
    id VARCHAR(50) PRIMARY KEY,
    contract_id VARCHAR(50) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    capacity_ton DECIMAL(10,2),
    rate_basis ENUM('Per Trip', 'Per Kg', 'Per Ton', 'Per Km') NOT NULL,
    base_rate DECIMAL(15,2) NOT NULL,
    min_charge DECIMAL(15,2),
    max_charge DECIMAL(15,2),
    transit_time_hrs INT,
    transit_time_days INT,
    distance_km INT,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    INDEX idx_route (origin, destination),
    INDEX idx_contract (contract_id),
    INDEX idx_vehicle (vehicle_type),
    UNIQUE KEY unique_rate (contract_id, origin, destination, vehicle_type)
);

-- ============================================================================
-- 6. VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vendor_id VARCHAR(50),
    vehicle_type VARCHAR(50) NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year_of_manufacture INT,
    capacity_ton DECIMAL(10,2),
    capacity_volume_cft DECIMAL(10,2),
    registration_date DATE,
    registration_expiry DATE,
    insurance_expiry DATE,
    fitness_expiry DATE,
    permit_type VARCHAR(50),
    permit_expiry DATE,
    puc_expiry DATE,
    gps_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    current_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
    INDEX idx_vendor (vendor_id),
    INDEX idx_type (vehicle_type),
    INDEX idx_number (vehicle_number)
);

-- ============================================================================
-- 7. SHIPMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(50) PRIMARY KEY,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    contract_id VARCHAR(50),
    vendor_id VARCHAR(50),
    vehicle_id VARCHAR(50),
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    
    -- Route Info
    origin VARCHAR(100) NOT NULL,
    origin_location_id VARCHAR(50),
    destination VARCHAR(100) NOT NULL,
    destination_location_id VARCHAR(50),
    distance_km INT,
    
    -- Cargo Details
    cargo_description TEXT,
    weight_kg DECIMAL(10,2),
    volume_cft DECIMAL(10,2),
    packages INT,
    
    -- Timing
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    pickup_scheduled DATETIME,
    pickup_actual DATETIME,
    delivery_scheduled DATETIME,
    delivery_actual DATETIME,
    
    -- Status
    status ENUM('BOOKED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXCEPTION') DEFAULT 'BOOKED',
    delay_reason TEXT,
    
    -- Documents
    lr_number VARCHAR(50),
    lr_date DATE,
    lr_path VARCHAR(500),
    pod_submitted BOOLEAN DEFAULT FALSE,
    pod_date DATE,
    pod_path VARCHAR(500),
    pod_remarks TEXT,
    
    -- Financials
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    invoice_id VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    INDEX idx_status (status),
    INDEX idx_vendor (vendor_id),
    INDEX idx_dates (pickup_scheduled, delivery_scheduled)
);

-- ============================================================================
-- 8. INVOICES TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Vendor Info
    vendor_id VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255),
    vendor_gstin VARCHAR(20),
    
    -- Linking
    contract_id VARCHAR(50),
    shipment_id VARCHAR(50),
    po_number VARCHAR(50),
    
    -- Route Info
    origin VARCHAR(100),
    destination VARCHAR(100),
    vehicle_number VARCHAR(20),
    vehicle_type VARCHAR(50),
    lr_number VARCHAR(50),
    
    -- Amounts
    base_amount DECIMAL(15,2) NOT NULL,
    fuel_surcharge DECIMAL(15,2) DEFAULT 0,
    accessorial_charges DECIMAL(15,2) DEFAULT 0,
    other_charges DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2),
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    tds_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Status & Workflow
    status ENUM('DRAFT', 'PENDING_OCR', 'PENDING_VALIDATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED') DEFAULT 'PENDING_OCR',
    approval_level INT DEFAULT 0,
    approved_by VARCHAR(50),
    approved_at DATETIME,
    rejection_reason TEXT,
    
    -- OCR Data
    ocr_confidence DECIMAL(5,2),
    ocr_raw_text TEXT,
    ocr_processed_at DATETIME,
    
    -- Atlas Sentinel Validation
    sentinel_passed BOOLEAN,
    sentinel_results JSON,  -- All 4 rings results
    sentinel_validated_at DATETIME,
    
    -- Contract Matching
    contract_matched BOOLEAN,
    contract_rate DECIMAL(15,2),
    rate_variance DECIMAL(15,2),
    rate_variance_percent DECIMAL(5,2),
    
    -- Line Items (JSON array)
    line_items JSON,
    
    -- Attachments
    invoice_path VARCHAR(500),
    lr_path VARCHAR(500),
    pod_path VARCHAR(500),
    supporting_docs JSON,
    
    -- Payment Info
    payment_batch_id VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    INDEX idx_status (status),
    INDEX idx_vendor (vendor_id),
    INDEX idx_date (invoice_date),
    INDEX idx_number (invoice_number)
);

-- ============================================================================
-- 9. RATE CARDS TABLE (Spot/Market Rates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_cards (
    id VARCHAR(50) PRIMARY KEY,
    carrier_id VARCHAR(50),
    carrier_name VARCHAR(255) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    container_type VARCHAR(50),
    rate DECIMAL(15,2) NOT NULL,
    rate_basis ENUM('Per Trip', 'Per Kg', 'Per Ton', 'Per Km') DEFAULT 'Per Trip',
    currency VARCHAR(3) DEFAULT 'INR',
    transit_days INT,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'PENDING') DEFAULT 'ACTIVE',
    source ENUM('MANUAL', 'AUCTION', 'SPOT_QUOTE', 'API') DEFAULT 'MANUAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (carrier_id) REFERENCES vendors(id),
    INDEX idx_route (origin, destination),
    INDEX idx_status (status),
    INDEX idx_valid (valid_from, valid_to)
);

-- ============================================================================
-- 10. AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT') NOT NULL,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    user_role VARCHAR(50),
    description TEXT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_date (created_at)
);

-- ============================================================================
-- 11. FUEL PRICES TABLE (For PVC Calculations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fuel_prices (
    id VARCHAR(50) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    fuel_type ENUM('DIESEL', 'PETROL', 'CNG') DEFAULT 'DIESEL',
    price DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'IOCL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_fuel (city, fuel_type, effective_date),
    INDEX idx_city (city),
    INDEX idx_date (effective_date)
);

-- ============================================================================
-- 12. NOTIFICATIONS TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    recipient_id VARCHAR(50) NOT NULL,
    recipient_role VARCHAR(50),
    type ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'APPROVAL_REQUIRED', 'PAYMENT_READY', 'INVOICE_RECEIVED', 'CONTRACT_EXPIRING') DEFAULT 'INFO',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recipient (recipient_id, is_read),
    INDEX idx_type (type),
    INDEX idx_date (created_at)
);

-- ============================================================================
-- SEED DATA: Default Admin User
-- ============================================================================
INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES
('USR-ADMIN-001', 'admin@ledgerone.com', '$2b$12$defaulthash', 'System Admin', 'ADMIN', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================================
-- SEED DATA: Sample Vendors (From existing contractService)
-- ============================================================================
INSERT INTO vendors (id, name, type, gstin, contact_email, is_active, performance_grade) VALUES
('TCI001', 'TCI Express Limited', 'TRANSPORTER', '06AAACT1234M1Z2', 'logistics@tciexpress.in', TRUE, 'A'),
('BD001', 'Blue Dart Express Limited', 'COURIER', '27AABCB1234F1Z5', 'corporate@bluedart.com', TRUE, 'A'),
('DEL001', 'Delhivery Limited', 'TRANSPORTER', '06AABCD1234M1Z2', 'business@delhivery.com', TRUE, 'A'),
('VRL001', 'VRL Logistics Limited', 'TRANSPORTER', '29AABCV1234F1Z5', 'logistics@vrlgroup.in', TRUE, 'B'),
('GATI001', 'Gati Limited', 'TRANSPORTER', '36AABCG1234M1Z2', 'sales@gati.com', TRUE, 'B'),
('SFEX001', 'Safexpress Private Limited', 'TRANSPORTER', '07AABCS1234F1Z5', 'business@safexpress.com', TRUE, 'A'),
('RVGO001', 'Rivigo Services Private Limited', 'TRANSPORTER', '06AABCR1234M1Z2', 'enterprise@rivigo.com', TRUE, 'A'),
('DTDC001', 'DTDC Express Limited', 'COURIER', '29AABCD1234F1Z5', 'corporate@dtdc.com', TRUE, 'B'),
('MLOG001', 'Mahindra Logistics Limited', '3PL', '27AABCM1234F1Z5', 'logistics@mahindra.com', TRUE, 'A'),
('ALCG001', 'Allcargo Logistics Limited', 'FREIGHT_FORWARDER', '27AABCA1234F1Z5', 'domestic@allcargo.com', TRUE, 'A')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================================
-- SEED DATA: Sample Locations
-- ============================================================================
INSERT INTO locations (id, code, name, type, city, state, pincode, is_active) VALUES
('LOC-MUM-001', 'MUM-WH-01', 'Mumbai Central Warehouse', 'WAREHOUSE', 'Mumbai', 'Maharashtra', '400001', TRUE),
('LOC-DEL-001', 'DEL-HUB-01', 'Delhi Distribution Hub', 'HUB', 'Delhi', 'Delhi', '110001', TRUE),
('LOC-BLR-001', 'BLR-WH-01', 'Bangalore Logistics Park', 'WAREHOUSE', 'Bangalore', 'Karnataka', '560001', TRUE),
('LOC-CHE-001', 'CHE-PORT-01', 'Chennai Port Facility', 'PORT', 'Chennai', 'Tamil Nadu', '600001', TRUE),
('LOC-PUN-001', 'PUN-PLT-01', 'Pune Manufacturing Plant', 'PLANT', 'Pune', 'Maharashtra', '411001', TRUE),
('LOC-HYD-001', 'HYD-WH-01', 'Hyderabad Warehouse', 'WAREHOUSE', 'Hyderabad', 'Telangana', '500001', TRUE),
('LOC-KOL-001', 'KOL-DEP-01', 'Kolkata Depot', 'DEPOT', 'Kolkata', 'West Bengal', '700001', TRUE),
('LOC-AMD-001', 'AMD-WH-01', 'Ahmedabad Warehouse', 'WAREHOUSE', 'Ahmedabad', 'Gujarat', '380001', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================================
-- SEED DATA: Fuel Prices (Major Cities)
-- ============================================================================
INSERT INTO fuel_prices (id, city, state, fuel_type, price, effective_date, source) VALUES
('FUEL-DEL-001', 'Delhi', 'Delhi', 'DIESEL', 94.50, '2024-01-01', 'IOCL'),
('FUEL-MUM-001', 'Mumbai', 'Maharashtra', 'DIESEL', 102.80, '2024-01-01', 'IOCL'),
('FUEL-BLR-001', 'Bangalore', 'Karnataka', 'DIESEL', 98.20, '2024-01-01', 'IOCL'),
('FUEL-CHE-001', 'Chennai', 'Tamil Nadu', 'DIESEL', 96.50, '2024-01-01', 'IOCL'),
('FUEL-HYD-001', 'Hyderabad', 'Telangana', 'DIESEL', 97.30, '2024-01-01', 'IOCL'),
('FUEL-KOL-001', 'Kolkata', 'West Bengal', 'DIESEL', 95.80, '2024-01-01', 'IOCL'),
('FUEL-PUN-001', 'Pune', 'Maharashtra', 'DIESEL', 99.50, '2024-01-01', 'IOCL'),
('FUEL-AMD-001', 'Ahmedabad', 'Gujarat', 'DIESEL', 94.00, '2024-01-01', 'IOCL')
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_status ON invoices(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_date_status ON invoices(invoice_date, status);
CREATE INDEX IF NOT EXISTS idx_shipments_vendor_status ON shipments(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_status ON contracts(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_freight_routes ON freight_rates(origin, destination, vehicle_type);

-- ============================================================================
-- DONE: Schema ready for use
-- ============================================================================
SELECT 'LedgerOne Database Schema v2.0 Created Successfully!' AS status;
