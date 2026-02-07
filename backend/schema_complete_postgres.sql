-- ============================================================================
-- LEDGERONE TOTAL POSTGRESQL MIGRATION SCHEMA
-- ============================================================================
-- Combines all modular schemas into a single source of truth for Supabase/Postgres
-- Replaces all MySQL structures with Postgres-native types (UUID, JSONB, etc.)
-- ============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. UTILITY FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. VENDORS & USERS (Core Identity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(50) PRIMARY KEY, -- Keeping VARCHAR ID for compatibility with existing data seeding
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'TRANSPORTER', -- ENUM handled as VARCHAR in flexible schema
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
    onboarding_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_vendors_timestamp BEFORE UPDATE ON vendors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- ADMIN, FINANCE, OPERATIONS, AUDIT, SUPPLIER
    vendor_id VARCHAR(50),
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. LOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- PLANT, WAREHOUSE, DEPOT, PORT, CUSTOMER, HUB
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_locations_timestamp BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CONTRACTS (The Core Request)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY,
    contract_number VARCHAR(50),
    vendor_id VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- FTL, LTL, Express, Air, Multimodal
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    is_rcm_applicable BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, ACTIVE, EXPIRED, TERMINATED
    pvc_base_diesel_price DECIMAL(10,2),
    pvc_mileage_benchmark DECIMAL(5,2),
    pvc_reference_city VARCHAR(50),
    accessorials JSONB, -- Postgres JSONB for querying
    shipper_name VARCHAR(255),
    shipper_gstin VARCHAR(20),
    shipper_address TEXT,
    carrier_legal_name VARCHAR(255),
    carrier_gstin VARCHAR(20),
    carrier_address TEXT,
    sla_otd_target DECIMAL(5,2) DEFAULT 95.00,
    sla_pod_days INTEGER DEFAULT 7,
    sla_damage_limit DECIMAL(5,2) DEFAULT 0.50,
    sla_penalties JSONB,
    sla_incentives JSONB,
    insurance_coverage DECIMAL(15,2),
    insurance_liability_limit DECIMAL(15,2),
    insurance_claims_process TEXT,
    governing_law TEXT,
    termination_notice_days INTEGER DEFAULT 90,
    dispute_resolution TEXT,
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    gst_rcm_split VARCHAR(50),
    created_by VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TRIGGER update_contracts_timestamp BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. FREIGHT RATES (Linked to Contracts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS freight_rates (
    id VARCHAR(50) PRIMARY KEY,
    contract_id VARCHAR(50) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    capacity_ton DECIMAL(10,2),
    rate_basis VARCHAR(20) NOT NULL, -- Per Trip, Per Kg, Per Ton, Per Km
    base_rate DECIMAL(15,2) NOT NULL,
    min_charge DECIMAL(15,2),
    max_charge DECIMAL(15,2),
    transit_time_hrs INTEGER,
    transit_time_days INTEGER,
    distance_km INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

CREATE TRIGGER update_freight_rates_timestamp BEFORE UPDATE ON freight_rates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. VEHICLES & ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vendor_id VARCHAR(50),
    vehicle_type VARCHAR(50) NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year_of_manufacture INTEGER,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

CREATE TRIGGER update_vehicles_timestamp BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. SHIPMENTS 
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
    origin VARCHAR(100) NOT NULL,
    origin_location_id VARCHAR(50),
    destination VARCHAR(100) NOT NULL,
    destination_location_id VARCHAR(50),
    distance_km INTEGER,
    cargo_description TEXT,
    weight_kg DECIMAL(10,2),
    volume_cft DECIMAL(10,2),
    packages INTEGER,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pickup_scheduled TIMESTAMP,
    pickup_actual TIMESTAMP,
    delivery_scheduled TIMESTAMP,
    delivery_actual TIMESTAMP,
    status VARCHAR(20) DEFAULT 'BOOKED',
    delay_reason TEXT,
    lr_number VARCHAR(50),
    lr_date DATE,
    lr_path VARCHAR(500),
    pod_submitted BOOLEAN DEFAULT FALSE,
    pod_date DATE,
    pod_path VARCHAR(500),
    pod_remarks TEXT,
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    invoice_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TRIGGER update_shipments_timestamp BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. INVOICES (Central Audit Entity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    vendor_id VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255),
    vendor_gstin VARCHAR(20),
    contract_id VARCHAR(50),
    shipment_id VARCHAR(50),
    po_number VARCHAR(50),
    origin VARCHAR(100),
    destination VARCHAR(100),
    vehicle_number VARCHAR(20),
    vehicle_type VARCHAR(50),
    lr_number VARCHAR(50),
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
    status VARCHAR(20) DEFAULT 'PENDING_OCR',
    approval_level INTEGER DEFAULT 0,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    ocr_confidence DECIMAL(5,2),
    ocr_raw_text TEXT,
    ocr_processed_at TIMESTAMP,
    sentinel_passed BOOLEAN,
    sentinel_results JSONB,
    sentinel_validated_at TIMESTAMP,
    contract_matched BOOLEAN,
    contract_rate DECIMAL(15,2),
    rate_variance DECIMAL(15,2),
    rate_variance_percent DECIMAL(5,2),
    line_items JSONB,
    invoice_path VARCHAR(500),
    lr_path VARCHAR(500),
    pod_path VARCHAR(500),
    supporting_docs JSONB,
    payment_batch_id VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

CREATE TRIGGER update_invoices_timestamp BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. NOTIFICATIONS & AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    recipient_id VARCHAR(50) NOT NULL,
    recipient_role VARCHAR(50),
    type VARCHAR(50) DEFAULT 'INFO',
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    user_role VARCHAR(50),
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. RATE CARDS (Spot/Non-Contract) & FUEL PRICES
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
    rate_basis VARCHAR(20) DEFAULT 'Per Trip', 
    currency VARCHAR(3) DEFAULT 'INR',
    transit_days INTEGER,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    source VARCHAR(20) DEFAULT 'MANUAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrier_id) REFERENCES vendors(id)
);

CREATE TRIGGER update_rate_cards_timestamp BEFORE UPDATE ON rate_cards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS fuel_prices (
    id VARCHAR(50) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    fuel_type VARCHAR(20) DEFAULT 'DIESEL',
    price DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'IOCL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

