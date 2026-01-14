-- ============================================================================
-- ATLAS FREIGHT AUDIT PLATFORM - PostgreSQL Schema (Supabase)
-- ============================================================================
-- Converted from MySQL to PostgreSQL for Supabase compatibility
-- ============================================================================

-- ============================================================================
-- MASTER DATA TABLES
-- ============================================================================

-- Table: Carrier Master
CREATE TABLE IF NOT EXISTS carrier_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_code VARCHAR(50) UNIQUE NOT NULL,
    carrier_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2, 1),
    blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carrier_code ON carrier_master(carrier_code);
CREATE INDEX IF NOT EXISTS idx_carrier_gstin ON carrier_master(gstin);

-- Table: Route Master
CREATE TABLE IF NOT EXISTS route_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_code VARCHAR(50) UNIQUE NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km INTEGER NOT NULL,
    direction VARCHAR(20) DEFAULT 'HEAD_HAUL', -- HEAD_HAUL, BACK_HAUL
    zone VARCHAR(50),
    estimated_transit_days INTEGER,
    toll_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_route_origin_dest ON route_master(origin, destination);
CREATE INDEX IF NOT EXISTS idx_route_code ON route_master(route_code);

-- Table: Fuel Master
CREATE TABLE IF NOT EXISTS fuel_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_date DATE NOT NULL,
    diesel_price_per_liter DECIMAL(6, 2) NOT NULL,
    city VARCHAR(100),
    source VARCHAR(50) DEFAULT 'GOVT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (effective_date, city)
);

CREATE INDEX IF NOT EXISTS idx_fuel_date ON fuel_master(effective_date DESC);

-- Table: Rate Card Master
CREATE TABLE IF NOT EXISTS rate_card_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID,
    carrier_id UUID NOT NULL,
    route_id UUID NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL, -- 6W, 10W, 12W, etc.
    base_rate DECIMAL(10, 2) NOT NULL,
    rate_unit VARCHAR(20) DEFAULT 'PER_TON', -- PER_TON, PER_KG, PER_TRIP, PER_KM
    min_weight_kg INTEGER,
    max_weight_kg INTEGER,
    fuel_inclusive BOOLEAN DEFAULT FALSE,
    detention_free_hours INTEGER DEFAULT 24,
    detention_per_hour DECIMAL(8, 2) DEFAULT 0,
    handling_inclusive BOOLEAN DEFAULT TRUE,
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrier_id) REFERENCES carrier_master(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES route_master(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rate_carrier_route ON rate_card_master(carrier_id, route_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rate_validity ON rate_card_master(valid_from, valid_to);

-- Table: Contract Master
CREATE TABLE IF NOT EXISTS contract_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    carrier_id UUID NOT NULL,
    contract_type VARCHAR(20) DEFAULT 'ANNUAL', -- ANNUAL, QUARTERLY, SPOT
    start_date DATE NOT NULL,
    end_date DATE,
    total_value DECIMAL(15, 2),
    payment_terms VARCHAR(50),
    auto_renew BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, ACTIVE, EXPIRED, TERMINATED
    notes TEXT,
    signed_document_path VARCHAR(500),
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrier_id) REFERENCES carrier_master(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contract_carrier ON contract_master(carrier_id);
CREATE INDEX IF NOT EXISTS idx_contract_status ON contract_master(status);

-- ============================================================================
-- INVOICE & LINE ITEMS TABLES
-- ============================================================================

-- Enhance existing supplier_invoices table (if exists)
-- Add these columns if they don't exist
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS gstin VARCHAR(15);
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS total_taxable_amount DECIMAL(15, 2);
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS total_tax_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS is_consolidated BOOLEAN DEFAULT FALSE;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS line_item_count INTEGER DEFAULT 0;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100);
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Table: Invoice Line Items (THE KEY TABLE)
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id VARCHAR(50) NOT NULL,
    line_number INTEGER NOT NULL,
    lr_number VARCHAR(100) NOT NULL,
    lr_date DATE,
    
    -- Route Details
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    route_id UUID,
    
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
    line_total DECIMAL(10, 2) NOT NULL,
    
    -- Audit Flags
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_invoice_id VARCHAR(50),
    is_overcharged BOOLEAN DEFAULT FALSE,
    overcharge_amount DECIMAL(10, 2),
    audit_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PASSED, FLAGGED, EXCEPTION
    audit_notes TEXT,
    
    -- POD Status
    pod_required BOOLEAN DEFAULT TRUE,
    pod_uploaded BOOLEAN DEFAULT FALSE,
    pod_document_id VARCHAR(50),
    pod_verified_by VARCHAR(100),
    pod_verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES route_master(id) ON DELETE SET NULL,
    UNIQUE (invoice_id, lr_number)
);

CREATE INDEX IF NOT EXISTS idx_line_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_line_lr ON invoice_line_items(lr_number);
CREATE INDEX IF NOT EXISTS idx_line_audit_status ON invoice_line_items(audit_status);
CREATE INDEX IF NOT EXISTS idx_line_duplicate ON invoice_line_items(is_duplicate);

-- ============================================================================
-- AUDIT HISTORY TABLES
-- ============================================================================

-- Table: LR Payment History
CREATE TABLE IF NOT EXISTS lr_payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lr_number VARCHAR(100) NOT NULL,
    invoice_id VARCHAR(50) NOT NULL,
    line_item_id UUID NOT NULL,
    carrier_id UUID,
    paid_amount DECIMAL(10, 2) NOT NULL,
    paid_date DATE NOT NULL,
    payment_batch_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (line_item_id) REFERENCES invoice_line_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lr_payment_number ON lr_payment_history(lr_number);

-- ============================================================================
-- BULK UPLOAD METADATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS annexure_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id VARCHAR(50) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    total_rows INTEGER NOT NULL,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    column_mapping JSONB,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(100),
    FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id) ON DELETE CASCADE
);

-- Table: Vendor Excel Templates (Column Mapping Memory)
CREATE TABLE IF NOT EXISTS vendor_excel_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255),
    template_name VARCHAR(255),
    column_mapping JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (vendor_id, template_name)
);

-- ============================================================================
-- GATE LOGS (For Detention Calculation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gate_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lr_number VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(20),
    gate_type VARCHAR(10) NOT NULL, -- ENTRY, EXIT
    gate_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    recorded_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gate_lr ON gate_logs(lr_number);
CREATE INDEX IF NOT EXISTS idx_gate_vehicle ON gate_logs(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_gate_time ON gate_logs(gate_time);

-- ============================================================================
-- AI/ML TABLES
-- ============================================================================

-- Table: Price Benchmarks (For TBML Detection)
CREATE TABLE IF NOT EXISTS price_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity VARCHAR(255) NOT NULL,
    median_price_per_kg DECIMAL(10, 2) NOT NULL,
    min_price_per_kg DECIMAL(10, 2),
    max_price_per_kg DECIMAL(10, 2),
    sample_size INTEGER,
    effective_date DATE NOT NULL,
    source VARCHAR(100) DEFAULT 'HISTORICAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_commodity ON price_benchmarks(commodity, effective_date DESC);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_consolidated ON supplier_invoices(is_consolidated);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON supplier_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON supplier_invoices(invoice_date);

-- ============================================================================
-- PostgreSQL-specific: Update trigger for updated_at columns
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_carrier_master_updated_at BEFORE UPDATE ON carrier_master
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_master_updated_at BEFORE UPDATE ON route_master
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_card_updated_at BEFORE UPDATE ON rate_card_master
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_master_updated_at BEFORE UPDATE ON contract_master
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
