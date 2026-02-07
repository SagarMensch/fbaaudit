# Database Schema - Freight Audit & Settlement Platform

**Version 3.0** | Data Model Documentation

---

## Overview

The platform uses a relational database model optimized for freight invoice processing, audit trails, and financial settlement. This document outlines the core tables, relationships, and indexes.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  Vendors    │──────<│   Invoices   │>──────│  Line Items │
└─────────────┘       └──────────────┘       └─────────────┘
                             │
                             │
                      ┌──────┴──────┐
                      │             │
              ┌───────▼──────┐  ┌──▼──────────┐
              │  Contracts   │  │  Workflow   │
              │  (Rates)     │  │  History    │
              └──────────────┘  └─────────────┘
```

---

## Core Tables

### 1. Invoices

Primary table for freight invoices.

```sql
CREATE TABLE invoices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invoice Identification
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  
  -- Vendor Information
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  carrier VARCHAR(100) NOT NULL,
  
  -- Financial Data
  base_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0,
  
  -- Logistics Details
  origin VARCHAR(100),
  destination VARCHAR(100),
  shipment_mode VARCHAR(20), -- OCEAN, AIR, ROAD, RAIL
  
  -- Audit Information
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  audit_amount DECIMAL(12,2),
  variance DECIMAL(12,2) DEFAULT 0,
  extraction_confidence INTEGER,
  
  -- Workflow
  current_step_id UUID REFERENCES workflow_steps(id),
  assigned_to UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT chk_status CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'EXCEPTION')),
  CONSTRAINT chk_confidence CHECK (extraction_confidence BETWEEN 0 AND 100)
);

-- Indexes
CREATE INDEX idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
```

### 2. Line Items

Individual charges within an invoice.

```sql
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Line Item Details
  line_number INTEGER NOT NULL,
  description VARCHAR(255) NOT NULL,
  charge_type VARCHAR(50), -- BASE_FREIGHT, FUEL_SURCHARGE, ACCESSORIAL, TAX
  
  -- Amounts
  quantity DECIMAL(10,2),
  unit_price DECIMAL(12,2),
  amount DECIMAL(12,2) NOT NULL,
  expected_amount DECIMAL(12,2),
  
  -- GL Coding
  gl_account VARCHAR(20),
  cost_center VARCHAR(20),
  business_unit VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uq_invoice_line UNIQUE(invoice_id, line_number)
);

CREATE INDEX idx_line_items_invoice ON line_items(invoice_id);
CREATE INDEX idx_line_items_gl ON line_items(gl_account);
```

### 3. Vendors

Carrier and supplier master data.

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vendor Identification
  vendor_code VARCHAR(20) UNIQUE NOT NULL,
  vendor_name VARCHAR(200) NOT NULL,
  
  -- Tax Information
  gstin VARCHAR(15), -- India GST Number
  pan VARCHAR(10),   -- India PAN
  tax_category VARCHAR(20), -- RCM, FCM
  
  -- Contact Information
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(3) DEFAULT 'IND',
  postal_code VARCHAR(10),
  
  -- Business Details
  vendor_type VARCHAR(20), -- CARRIER, 3PL, FREIGHT_FORWARDER
  payment_terms INTEGER DEFAULT 45, -- Net days
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_active ON vendors(is_active);
```

### 4. Contracts (Rate Cards)

Negotiated rates and agreements.

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contract Identification
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Contract Details
  contract_type VARCHAR(20), -- SPOT, ANNUAL, MULTI_YEAR
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_contract_dates CHECK (valid_to > valid_from)
);

CREATE INDEX idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX idx_contracts_validity ON contracts(valid_from, valid_to);
```

### 5. Contract Rates

Specific rates within contracts.

```sql
CREATE TABLE contract_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Route Information
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  shipment_mode VARCHAR(20) NOT NULL,
  
  -- Rate Details
  base_rate DECIMAL(12,2) NOT NULL,
  fuel_surcharge_pct DECIMAL(5,2) DEFAULT 0,
  minimum_charge DECIMAL(12,2),
  
  -- Equipment/Service
  equipment_type VARCHAR(50), -- 20GP, 40HC, LCL
  service_level VARCHAR(20),  -- STANDARD, EXPRESS
  
  -- Validity
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rates_contract ON contract_rates(contract_id);
CREATE INDEX idx_rates_route ON contract_rates(origin, destination);
```

### 6. Workflow History

Audit trail of approval workflow.

```sql
CREATE TABLE workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Step Information
  step_id UUID NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  
  -- Approver
  approver_id UUID REFERENCES users(id),
  approver_role VARCHAR(50),
  
  -- Decision
  status VARCHAR(20) NOT NULL, -- ACTIVE, APPROVED, REJECTED, SKIPPED
  comment TEXT,
  
  -- Timing
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INTEGER,
  
  CONSTRAINT chk_wf_status CHECK (status IN ('ACTIVE', 'APPROVED', 'REJECTED', 'SKIPPED'))
);

CREATE INDEX idx_workflow_invoice ON workflow_history(invoice_id);
CREATE INDEX idx_workflow_timestamp ON workflow_history(timestamp);
```

### 7. Users

System users and authentication.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Identification
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  
  -- Authentication
  password_hash VARCHAR(255), -- For local auth
  sso_id VARCHAR(100),         -- For SSO
  
  -- Profile
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role_id UUID REFERENCES roles(id),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
```

### 8. Roles

RBAC role definitions.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Role Details
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Permissions (JSON)
  permissions JSONB NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example permissions JSON:
-- {
--   "canViewInvoices": true,
--   "canApproveInvoices": true,
--   "canEditContracts": false,
--   "canGenerateReports": true
-- }
```

### 9. Audit Logs

Immutable audit trail.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Information
  entity_type VARCHAR(50) NOT NULL, -- INVOICE, CONTRACT, USER
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,      -- CREATE, UPDATE, DELETE, APPROVE
  
  -- User Context
  user_id UUID REFERENCES users(id),
  user_ip VARCHAR(45),
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Metadata
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Immutable: No updates or deletes allowed
  CONSTRAINT no_update CHECK (false)
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

---

## Relationships

### One-to-Many
- **Vendors** → **Invoices**: One vendor has many invoices
- **Invoices** → **Line Items**: One invoice has many line items
- **Invoices** → **Workflow History**: One invoice has many workflow steps
- **Contracts** → **Contract Rates**: One contract has many rates

### Many-to-One
- **Invoices** → **Vendors**: Many invoices belong to one vendor
- **Users** → **Roles**: Many users have one role

---

## Data Types

| Type | Usage | Example |
|------|-------|---------|
| `UUID` | Primary keys, foreign keys | `550e8400-e29b-41d4-a716-446655440000` |
| `VARCHAR(n)` | Text with max length | `INV-2024-001` |
| `TEXT` | Unlimited text | Comments, descriptions |
| `DECIMAL(12,2)` | Currency amounts | `12345.67` |
| `DATE` | Dates only | `2024-12-25` |
| `TIMESTAMP` | Date and time | `2024-12-25 10:30:00` |
| `BOOLEAN` | True/false flags | `true`, `false` |
| `JSONB` | Structured data | `{"key": "value"}` |

---

## Indexes Strategy

### Performance Indexes
- **Foreign Keys**: All foreign keys are indexed
- **Status Fields**: Frequently filtered fields (status, is_active)
- **Date Ranges**: Created_at, invoice_date for reporting
- **Lookup Fields**: Invoice numbers, vendor codes

### Composite Indexes
```sql
-- For date range queries
CREATE INDEX idx_invoices_date_status ON invoices(invoice_date, status);

-- For vendor reports
CREATE INDEX idx_invoices_vendor_date ON invoices(vendor_id, invoice_date);
```

---

## Data Integrity

### Constraints

1. **Primary Keys**: All tables have UUID primary keys
2. **Foreign Keys**: Enforce referential integrity
3. **Check Constraints**: Validate enum values and ranges
4. **Unique Constraints**: Prevent duplicates (invoice numbers, vendor codes)
5. **Not Null**: Critical fields cannot be null

### Triggers

```sql
-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoices_updated
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

---

## Sample Queries

### Get Invoice with Line Items
```sql
SELECT 
  i.*,
  json_agg(li.*) AS line_items
FROM invoices i
LEFT JOIN line_items li ON i.id = li.invoice_id
WHERE i.invoice_number = 'INV-2024-001'
GROUP BY i.id;
```

### Vendor Spend Report
```sql
SELECT 
  v.vendor_name,
  COUNT(i.id) AS invoice_count,
  SUM(i.total_amount) AS total_spend,
  AVG(i.total_amount) AS avg_invoice_amount
FROM vendors v
JOIN invoices i ON v.id = i.vendor_id
WHERE i.invoice_date >= '2024-01-01'
GROUP BY v.id, v.vendor_name
ORDER BY total_spend DESC;
```

### Workflow Performance
```sql
SELECT 
  step_name,
  COUNT(*) AS total_approvals,
  AVG(duration_minutes) AS avg_duration,
  MAX(duration_minutes) AS max_duration
FROM workflow_history
WHERE status = 'APPROVED'
  AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY step_name;
```

---

## Backup & Maintenance

### Daily Backup
```bash
pg_dump freight_audit > backup_$(date +%Y%m%d).sql
```

### Vacuum & Analyze
```sql
-- Reclaim space and update statistics
VACUUM ANALYZE invoices;
VACUUM ANALYZE line_items;
```

### Archive Old Data
```sql
-- Move paid invoices older than 2 years to archive
INSERT INTO invoices_archive
SELECT * FROM invoices
WHERE status = 'PAID'
  AND invoice_date < CURRENT_DATE - INTERVAL '2 years';

DELETE FROM invoices
WHERE status = 'PAID'
  AND invoice_date < CURRENT_DATE - INTERVAL '2 years';
```

---

## Migration Scripts

See `migrations/` directory for version-controlled schema changes.

Example migration:
```sql
-- V1.0.0__initial_schema.sql
-- V1.1.0__add_parcel_audit.sql
-- V1.2.0__add_tax_fields.sql
```

---

**Schema Version**: 3.0.0  
**Last Updated**: December 2024
