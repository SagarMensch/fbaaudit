-- Extend supplier_invoices table for Fuzzy Duplicate Detection
-- Run this to add duplicate detection support

USE ledgerone;

-- Add vehicle_number and lr_number columns for Shipment DNA matching
ALTER TABLE supplier_invoices 
ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS lr_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS carrier VARCHAR(255),
ADD COLUMN IF NOT EXISTS origin VARCHAR(100),
ADD COLUMN IF NOT EXISTS destination VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS duplicate_of VARCHAR(50),
ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(5,4);

-- Table: Duplicate Scan Results
-- Stores results of fuzzy duplicate scans
CREATE TABLE IF NOT EXISTS duplicate_scan_results (
    id VARCHAR(50) PRIMARY KEY,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_scanned INT,
    duplicates_found INT,
    high_risk_count INT,
    medium_risk_count INT,
    amount_at_risk DECIMAL(15, 2),
    threshold_used DECIMAL(5,4),
    status VARCHAR(50) DEFAULT 'COMPLETED'
);

-- Table: Detected Duplicates  
-- Stores individual duplicate pairs
CREATE TABLE IF NOT EXISTS detected_duplicates (
    id VARCHAR(50) PRIMARY KEY,
    scan_id VARCHAR(50),
    original_invoice_id VARCHAR(50),
    original_invoice_number VARCHAR(100),
    duplicate_invoice_id VARCHAR(50),
    duplicate_invoice_number VARCHAR(100),
    vendor_id VARCHAR(50),
    similarity_score DECIMAL(5,4),
    score_invoice_number DECIMAL(5,4),
    score_amount DECIMAL(5,4),
    score_date DECIMAL(5,4), 
    score_vehicle DECIMAL(5,4),
    risk_level VARCHAR(20),
    recommendation VARCHAR(20),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scan_id) REFERENCES duplicate_scan_results(id)
);

-- Insert TCI Demo Data for duplicate detection
INSERT INTO supplier_invoices (id, invoice_number, supplier_id, amount, status, vehicle_number, lr_number, carrier, origin, destination, invoice_date, created_at)
VALUES 
    ('TCI-DEMO-001', 'TCI-2024-0501', 'tci-express', 45000.00, 'PAID', 'MH02AB1234', 'LR-TCI-99201', 'TCI Express', 'Delhi', 'Bangalore', '2024-12-10', NOW()),
    ('TCI-DEMO-002', 'TCI-2024-0502', 'tci-express', 72000.00, 'APPROVED', 'MH02CD5678', 'LR-TCI-99202', 'TCI Express', 'Mumbai', 'Chennai', '2024-12-12', NOW()),
    ('TCI-DEMO-003', 'TCI-2024-0501/A', 'tci-express', 45000.00, 'PENDING', 'MH02AB1234', 'LR-TCI-99201-A', 'TCI Express', 'Delhi', 'Bangalore', '2024-12-11', NOW()),
    ('TCI-DEMO-004', 'TCI-2024-0501-R', 'tci-express', 45200.00, 'PENDING', 'MH02AB1234', 'LR-TCI-99201R', 'TCI Express', 'Delhi', 'Bangalore', '2024-12-12', NOW()),
    ('BD-DEMO-001', 'BDE-INV-1001', 'blue-dart', 28500.00, 'PAID', 'DL01AB7890', 'BD-AWB-500123', 'Blue Dart', 'Mumbai', 'Pune', '2024-12-08', NOW()),
    ('BD-DEMO-002', 'BDE/INV/1001', 'blue-dart', 28500.00, 'PENDING', 'DL01AB7890', 'BD-AWB-500123', 'Blue Dart', 'Mumbai', 'Pune', '2024-12-09', NOW())
ON DUPLICATE KEY UPDATE invoice_number = VALUES(invoice_number);

-- Mark duplicates
UPDATE supplier_invoices SET is_duplicate = TRUE, duplicate_of = 'TCI-DEMO-001', similarity_score = 0.95 WHERE id = 'TCI-DEMO-003';
UPDATE supplier_invoices SET is_duplicate = TRUE, duplicate_of = 'TCI-DEMO-001', similarity_score = 0.92 WHERE id = 'TCI-DEMO-004';
UPDATE supplier_invoices SET is_duplicate = TRUE, duplicate_of = 'BD-DEMO-001', similarity_score = 0.88 WHERE id = 'BD-DEMO-002';
