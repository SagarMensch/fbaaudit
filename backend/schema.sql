-- Create Database (Run this if you haven't already)
CREATE DATABASE IF NOT EXISTS ledgerone;
USE ledgerone;

-- Table: Supplier Documents
-- Stores metadata and paths for files uploaded by suppliers
CREATE TABLE IF NOT EXISTS supplier_documents (
    id VARCHAR(50) PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- COMPLIANCE, FINANCIAL, VEHICLE, etc.
    status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, ACTIVE, REJECTED
    upload_date DATE NOT NULL,
    verified_date DATE,
    expiry_date DATE,
    file_path VARCHAR(500), -- Path to file on disk (backend/uploads/...)
    file_size VARCHAR(50),
    description TEXT,
    metadata JSON, -- Flexible field for extra data (GSTIN, Vehicle No, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Invoices (Optional, effectively managing Invoice Data)
CREATE TABLE IF NOT EXISTS supplier_invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    po_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    items JSON, -- JSON array of line items
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Invoice Documents
-- Links uploaded documents (LR, POD, etc.) to specific invoices
CREATE TABLE IF NOT EXISTS invoice_documents (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    doc_type VARCHAR(50) NOT NULL, -- INVOICE, LR, POD, CONTRACT, SUPPORTING
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoice_docs ON invoice_documents(invoice_id);

-- ============================================================================
-- PAYMENT SYSTEM TABLES (Phase 1: Full Integration)
-- ============================================================================

-- Table: Payment Batches
-- Groups multiple invoices into a single payment run
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

-- Table: Payment Transactions
-- Links invoices to payment batches with discount tracking
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
    base_currency_amount DECIMAL(15, 2), -- Amount in base currency (INR)
    status ENUM('PENDING', 'INCLUDED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    payment_reference VARCHAR(100),
    paid_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES payment_batches(id) ON DELETE SET NULL
);

-- Table: Bank Reconciliations
-- Imported bank statements for matching with payments
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id VARCHAR(36) PRIMARY KEY,
    statement_id VARCHAR(50), -- Reference to statement import batch
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matched_batch_id) REFERENCES payment_batches(id) ON DELETE SET NULL
);

-- Table: Early Payment Terms
-- Vendor-specific discount terms for early payment
CREATE TABLE IF NOT EXISTS early_payment_terms (
    id VARCHAR(36) PRIMARY KEY,
    vendor_id VARCHAR(100) NOT NULL,
    vendor_name VARCHAR(255),
    discount_percent DECIMAL(5, 2) NOT NULL, -- e.g., 2.00 for 2%
    days_early INT NOT NULL, -- Pay within X days for discount
    standard_payment_days INT DEFAULT 30, -- Normal payment terms
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Notifications (Enhanced for Payment System)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(100) NOT NULL, -- User/Persona ID
    type ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'APPROVAL_REQUIRED', 'PAYMENT_READY', 'PAYMENT_COMPLETED') DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50), -- 'invoice', 'batch', 'reconciliation'
    related_entity_id VARCHAR(50),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Payment Method Settings (Bank Accounts)
CREATE TABLE IF NOT EXISTS payment_accounts (
    id VARCHAR(36) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    swift_code VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'INR',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Currency Exchange Rates (for multi-currency)
CREATE TABLE IF NOT EXISTS currency_rates (
    id VARCHAR(36) PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'MANUAL', -- 'API', 'MANUAL', 'RBI'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_rate (from_currency, to_currency, effective_date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_batches_status ON payment_batches(status);
CREATE INDEX idx_batches_scheduled ON payment_batches(scheduled_date);
CREATE INDEX idx_transactions_batch ON payment_transactions(batch_id);
CREATE INDEX idx_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_transactions_vendor ON payment_transactions(vendor_id);
CREATE INDEX idx_recon_status ON bank_reconciliations(status);
CREATE INDEX idx_recon_date ON bank_reconciliations(transaction_date);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
