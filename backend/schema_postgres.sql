-- ============================================================================
-- FBAAUDIT COMPLETE DATABASE SCHEMA - PostgreSQL/Supabase
-- Version: 3.0 - Full PostgreSQL (Supabase)
-- Created: 2026-02-07
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. VENDORS/CARRIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('VND-' || uuid_generate_v4()::text),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'TRANSPORTER' CHECK (type IN ('TRANSPORTER', 'COURIER', 'FREIGHT_FORWARDER', '3PL')),
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
    onboarding_status VARCHAR(20) DEFAULT 'PENDING' CHECK (onboarding_status IN ('PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(is_active);

-- ============================================================================
-- 2. USERS TABLE (Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('USR-' || uuid_generate_v4()::text),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'FINANCE', 'OPERATIONS', 'AUDIT', 'SUPPLIER')),
    vendor_id VARCHAR(50) REFERENCES vendors(id) ON DELETE SET NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 3. LOCATIONS TABLE (Master Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('LOC-' || uuid_generate_v4()::text),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PLANT', 'WAREHOUSE', 'DEPOT', 'PORT', 'CUSTOMER', 'HUB')),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);

-- ============================================================================
-- 4. CONTRACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('CON-' || uuid_generate_v4()::text),
    contract_number VARCHAR(50) UNIQUE,
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(id),
    vendor_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('FTL', 'LTL', 'Express', 'Air', 'Multimodal')),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    is_rcm_applicable BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'TERMINATED')),
    tolerance_pct DECIMAL(5,2) DEFAULT 2.00,
    
    -- PVC Configuration (Price Variance Clause)
    pvc_base_diesel_price DECIMAL(10,2),
    pvc_mileage_benchmark DECIMAL(5,2),
    pvc_reference_city VARCHAR(50),
    
    -- Accessorials JSON
    accessorials JSONB,
    
    -- Parties
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
    sla_penalties JSONB,
    sla_incentives JSONB,
    
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
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_valid ON contracts(valid_from, valid_to);

-- ============================================================================
-- 5. FREIGHT RATES TABLE (Contract Rate Matrix)
-- ============================================================================
CREATE TABLE IF NOT EXISTS freight_rates (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('FRT-' || uuid_generate_v4()::text),
    contract_id VARCHAR(50) NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    capacity_ton DECIMAL(10,2),
    rate_basis VARCHAR(20) NOT NULL CHECK (rate_basis IN ('Per Trip', 'Per Kg', 'Per Ton', 'Per Km')),
    base_rate DECIMAL(15,2) NOT NULL,
    min_charge DECIMAL(15,2),
    max_charge DECIMAL(15,2),
    transit_time_hrs INT,
    transit_time_days INT,
    distance_km INT,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(contract_id, origin, destination, vehicle_type)
);

CREATE INDEX IF NOT EXISTS idx_freight_rates_route ON freight_rates(origin, destination);
CREATE INDEX IF NOT EXISTS idx_freight_rates_contract ON freight_rates(contract_id);
CREATE INDEX IF NOT EXISTS idx_freight_rates_vehicle ON freight_rates(vehicle_type);

-- ============================================================================
-- 6. VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('VEH-' || uuid_generate_v4()::text),
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vendor_id VARCHAR(50) REFERENCES vendors(id) ON DELETE SET NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_vendor ON vehicles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);

-- ============================================================================
-- 7. SHIPMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('SHP-' || uuid_generate_v4()::text),
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    contract_id VARCHAR(50) REFERENCES contracts(id),
    vendor_id VARCHAR(50) REFERENCES vendors(id),
    vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    
    -- Route Info
    origin VARCHAR(100) NOT NULL,
    origin_location_id VARCHAR(50),
    destination VARCHAR(100) NOT NULL,
    destination_location_id VARCHAR(50),
    distance_km INT,
    incoterm VARCHAR(20),
    
    -- Cargo Details
    cargo_description TEXT,
    weight_kg DECIMAL(10,2),
    volume_cft DECIMAL(10,2),
    packages INT,
    
    -- Timing
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pickup_scheduled TIMESTAMP WITH TIME ZONE,
    pickup_actual TIMESTAMP WITH TIME ZONE,
    delivery_scheduled TIMESTAMP WITH TIME ZONE,
    delivery_actual TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXCEPTION')),
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_vendor ON shipments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_shipments_dates ON shipments(pickup_scheduled, delivery_scheduled);

-- ============================================================================
-- 8. INVOICES TABLE (Enhanced)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('INV-' || uuid_generate_v4()::text),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Vendor Info
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(id),
    vendor_name VARCHAR(255),
    vendor_gstin VARCHAR(20),
    
    -- Linking
    contract_id VARCHAR(50) REFERENCES contracts(id),
    shipment_id VARCHAR(50) REFERENCES shipments(id),
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
    status VARCHAR(30) DEFAULT 'PENDING_OCR' CHECK (status IN ('DRAFT', 'PENDING_OCR', 'PENDING_VALIDATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')),
    approval_level INT DEFAULT 0,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- OCR Data
    ocr_confidence DECIMAL(5,2),
    ocr_raw_text TEXT,
    ocr_processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Atlas Sentinel Validation
    sentinel_passed BOOLEAN,
    sentinel_results JSONB,
    sentinel_validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Contract Matching
    contract_matched BOOLEAN,
    contract_rate DECIMAL(15,2),
    rate_variance DECIMAL(15,2),
    rate_variance_percent DECIMAL(5,2),
    
    -- Line Items (JSON array)
    line_items JSONB,
    
    -- Attachments
    invoice_path VARCHAR(500),
    lr_path VARCHAR(500),
    pod_path VARCHAR(500),
    supporting_docs JSONB,
    
    -- Payment Info
    payment_batch_id VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- ============================================================================
-- 9. RATE CARDS TABLE (Spot/Market Rates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_cards (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('RC-' || uuid_generate_v4()::text),
    carrier_id VARCHAR(50) REFERENCES vendors(id),
    carrier_name VARCHAR(255) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    container_type VARCHAR(50),
    rate DECIMAL(15,2) NOT NULL,
    rate_basis VARCHAR(20) DEFAULT 'Per Trip' CHECK (rate_basis IN ('Per Trip', 'Per Kg', 'Per Ton', 'Per Km')),
    currency VARCHAR(3) DEFAULT 'INR',
    transit_days INT,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'PENDING')),
    source VARCHAR(20) DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'AUCTION', 'SPOT_QUOTE', 'API')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_cards_route ON rate_cards(origin, destination);
CREATE INDEX IF NOT EXISTS idx_rate_cards_status ON rate_cards(status);
CREATE INDEX IF NOT EXISTS idx_rate_cards_valid ON rate_cards(valid_from, valid_to);

-- ============================================================================
-- 10. AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT')),
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    user_role VARCHAR(50),
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at);

-- ============================================================================
-- 11. FUEL PRICES TABLE (For PVC Calculations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fuel_prices (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('FUEL-' || uuid_generate_v4()::text),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    fuel_type VARCHAR(10) DEFAULT 'DIESEL' CHECK (fuel_type IN ('DIESEL', 'PETROL', 'CNG')),
    price DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'IOCL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(city, fuel_type, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_fuel_prices_city ON fuel_prices(city);
CREATE INDEX IF NOT EXISTS idx_fuel_prices_date ON fuel_prices(effective_date);

-- ============================================================================
-- 12. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('NOT-' || uuid_generate_v4()::text),
    recipient_id VARCHAR(50) NOT NULL,
    recipient_role VARCHAR(50),
    type VARCHAR(30) DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'APPROVAL_REQUIRED', 'PAYMENT_READY', 'INVOICE_RECEIVED', 'CONTRACT_EXPIRING')),
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);

-- ============================================================================
-- 13. ROUTE HISTORY TABLE (For Z-Score calculations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS route_history (
    id BIGSERIAL PRIMARY KEY,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    vehicle_type VARCHAR(50),
    vendor_id VARCHAR(50),
    invoice_id VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_history_route ON route_history(origin, destination);
CREATE INDEX IF NOT EXISTS idx_route_history_date ON route_history(recorded_at);

-- ============================================================================
-- 14. GEOFENCES TABLE (For Detention Validation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS geofences (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('GEO-' || uuid_generate_v4()::text),
    name VARCHAR(255) NOT NULL,
    location_id VARCHAR(50) REFERENCES locations(id),
    vertices JSONB NOT NULL,  -- Array of {lat, lng} points
    allowed_dwell_minutes INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 15. PAYMENT BATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_batches (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('PB-' || uuid_generate_v4()::text),
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    payment_method VARCHAR(20) DEFAULT 'NEFT',
    total_amount DECIMAL(15,2) NOT NULL,
    invoice_count INT NOT NULL,
    scheduled_date DATE,
    processed_date TIMESTAMP WITH TIME ZONE,
    bank_reference VARCHAR(100),
    created_by VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_batches_status ON payment_batches(status);

-- ============================================================================
-- 16. PAYMENT TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('PT-' || uuid_generate_v4()::text),
    batch_id VARCHAR(50) NOT NULL REFERENCES payment_batches(id),
    invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(id),
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(id),
    amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    bank_reference VARCHAR(100),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_batch ON payment_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_vendor ON payment_transactions(vendor_id);

-- ============================================================================
-- 17. BANK RECONCILIATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bank_reconciliation (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('REC-' || uuid_generate_v4()::text),
    statement_id VARCHAR(50),
    transaction_date DATE NOT NULL,
    reference VARCHAR(100),
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('CREDIT', 'DEBIT')),
    matched_batch_id VARCHAR(50) REFERENCES payment_batches(id),
    status VARCHAR(20) DEFAULT 'UNMATCHED' CHECK (status IN ('UNMATCHED', 'MATCHED', 'MANUAL')),
    matched_by VARCHAR(50),
    matched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_status ON bank_reconciliation(status);

-- ============================================================================
-- 18. TICKETS/DISPUTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('TKT-' || uuid_generate_v4()::text),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('RATE_DISPUTE', 'DELAY_PENALTY', 'TAX_DISPUTE', 'GL_DISPUTE', 'DOCUMENT_ISSUE', 'OTHER')),
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'PENDING_VENDOR', 'PENDING_FINANCE', 'RESOLVED', 'CLOSED')),
    
    -- Related entities
    invoice_id VARCHAR(50) REFERENCES invoices(id),
    vendor_id VARCHAR(50) REFERENCES vendors(id),
    contract_id VARCHAR(50) REFERENCES contracts(id),
    
    -- Details
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    resolution TEXT,
    
    -- Assignment
    assigned_to VARCHAR(50),
    assigned_role VARCHAR(50),
    
    -- SLA
    sla_due_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_invoice ON tickets(invoice_id);
CREATE INDEX IF NOT EXISTS idx_tickets_vendor ON tickets(vendor_id);

-- ============================================================================
-- 19. TICKET COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    comment TEXT NOT NULL,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- ============================================================================
-- DONE: PostgreSQL Schema Ready
-- ============================================================================
