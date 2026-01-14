-- ============================================================================
-- ADVANCED OCR SYSTEM - PostgreSQL Schema
-- ============================================================================
-- Stores OCR extraction results, validation, and template learning
-- ============================================================================

-- Table: OCR Extraction Results
CREATE TABLE IF NOT EXISTS ocr_extraction_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Document Reference
    document_id VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL,  -- INVOICE, LR, POD, WEIGHT_SLIP, etc.
    file_path VARCHAR(500),
    
    -- Extraction Metadata
    extraction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ocr_engine VARCHAR(50),  -- TROCR, TESSERACT, GEMINI, ENSEMBLE
    processing_time_ms INTEGER,
    
    -- Raw OCR Data
    raw_text TEXT,
    raw_tables JSONB,  -- Extracted tables
    
    -- Structured Extraction (Schema-Validated)
    extracted_data JSONB NOT NULL,  -- Conforms to document schema
    
    -- Quality Metrics
    overall_confidence DECIMAL(5,2),  -- 0-100
    field_confidence JSONB,  -- {"invoice_number": 98.5, "amount": 87.2, ...}
    
    -- Template Matching
    vendor_template_id UUID,
    template_match_score DECIMAL(5,2),  -- How well document matched template
    vendor_detected VARCHAR(255),
    
    -- Validation Status
    validation_status VARCHAR(20) DEFAULT 'PENDING',  -- PASSED, FAILED, REVIEW_NEEDED
    validation_errors JSONB,  -- Array of validation errors
    schema_version VARCHAR(10),
    
    -- User Corrections (for learning)
    has_corrections BOOLEAN DEFAULT FALSE,
    corrected_data JSONB,
    corrected_by VARCHAR(100),
    corrected_at TIMESTAMP,
    
    -- Audit Trail
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ocr_document_id ON ocr_extraction_results(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_document_type ON ocr_extraction_results(document_type);
CREATE INDEX IF NOT EXISTS idx_ocr_vendor ON ocr_extraction_results(vendor_detected);
CREATE INDEX IF NOT EXISTS idx_ocr_validation_status ON ocr_extraction_results(validation_status);
CREATE INDEX IF NOT EXISTS idx_ocr_timestamp ON ocr_extraction_results(extraction_timestamp DESC);

-- ============================================================================
-- Table: Document Field Schemas
-- Defines the structure and validation rules for each document type
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_field_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Field Definition
    document_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255),  -- Human-readable label
    field_description TEXT,
    
    -- Data Type & Validation
    field_type VARCHAR(50) NOT NULL,  -- STRING, NUMBER, DATE, BOOLEAN, ENUM, OBJECT, ARRAY
    validation_rules JSONB,  -- JSON schema validation rules
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    
    -- Extraction Hints
    extraction_patterns JSONB,  -- ["pattern1", "pattern2", ...]
    extraction_zones JSONB,  -- Document areas to search (top, bottom, left, right percentages)
    synonyms JSONB,  -- Alternative names for this field
    
    -- Business Logic
    computed_from JSONB,  -- For calculated fields {"formula": "subtotal + tax"}
    cross_field_validation JSONB,  -- Validation against other fields
    
    -- Metadata
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_type, field_name)
);

CREATE INDEX IF NOT EXISTS idx_schema_doc_type ON document_field_schemas(document_type);
CREATE INDEX IF NOT EXISTS idx_schema_required ON document_field_schemas(is_required);

-- ============================================================================
-- Table: Vendor OCR Templates
-- Learns vendor-specific document layouts for better extraction
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_ocr_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vendor Information
    vendor_id VARCHAR(50),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_gstin VARCHAR(15),
    document_type VARCHAR(50) NOT NULL,
    
    -- Template Characteristics
    layout_signature JSONB NOT NULL,  -- Hash of field positions
    field_patterns JSONB,  -- Vendor-specific regex patterns
    field_positions JSONB,  -- Relative positions of key fields
    
    -- Visual Characteristics
    logo_signature VARCHAR(255),  -- Logo hash for visual matching
    font_characteristics JSONB,
    color_palette JSONB,
    
    -- Performance Metrics
    success_rate DECIMAL(5,2) DEFAULT 0,  -- % of successful extractions
    avg_confidence DECIMAL(5,2) DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    successful_extractions INTEGER DEFAULT 0,
    
    -- Learning Data
    sample_documents JSONB,  -- Array of document IDs used for learning
    last_used TIMESTAMP,
    improvement_score DECIMAL(5,2),  -- How much template improves accuracy
    
    -- Status
    is_approved BOOLEAN DEFAULT FALSE,  -- Manual approval for production use
    confidence_threshold DECIMAL(5,2) DEFAULT 85.0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(vendor_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_template_vendor ON vendor_ocr_templates(vendor_id);
CREATE INDEX IF NOT EXISTS idx_template_doc_type ON vendor_ocr_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_template_success ON vendor_ocr_templates(success_rate DESC);

-- ============================================================================
-- Table: OCR Quality Metrics
-- Track overall OCR performance over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS ocr_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time Period
    metric_date DATE NOT NULL,
    document_type VARCHAR(50),
    vendor_name VARCHAR(255),
    
    -- Volume Metrics
    total_documents INTEGER DEFAULT 0,
    successful_extractions INTEGER DEFAULT 0,
    failed_extractions INTEGER DEFAULT 0,
    review_needed INTEGER DEFAULT 0,
    
    -- Quality Metrics
    avg_confidence DECIMAL(5,2),
    avg_processing_time_ms INTEGER,
    template_match_rate DECIMAL(5,2),  -- % matched to template
    
    -- Field Accuracy (from corrections)
    field_accuracy JSONB,  -- Per-field accuracy rates
    common_errors JSONB,  -- Frequently failed fields
    
    -- Performance Trends
    accuracy_trend VARCHAR(20),  -- IMPROVING, DECLINING, STABLE
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(metric_date, document_type, vendor_name)
);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON ocr_quality_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_doc_type ON ocr_quality_metrics(document_type);

-- ============================================================================
-- Table: OCR Correction History
-- Track user corrections to improve extraction models
-- ============================================================================

CREATE TABLE IF NOT EXISTS ocr_correction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    extraction_result_id UUID NOT NULL,
    document_id VARCHAR(100) NOT NULL,
    
    -- Correction Details
    field_name VARCHAR(100) NOT NULL,
    original_value TEXT,
    corrected_value TEXT NOT NULL,
    value_type VARCHAR(50),
    
    -- Confidence Impact
    original_confidence DECIMAL(5,2),
    was_flagged BOOLEAN,  -- Was below confidence threshold
    
    -- Learning Applied
    pattern_learned BOOLEAN DEFAULT FALSE,
    template_updated BOOLEAN DEFAULT FALSE,
    
    -- Audit
    corrected_by VARCHAR(100) NOT NULL,
    correction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    correction_reason TEXT,
    
    FOREIGN KEY (extraction_result_id) REFERENCES ocr_extraction_results(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_correction_extraction ON ocr_correction_history(extraction_result_id);
CREATE INDEX IF NOT EXISTS idx_correction_field ON ocr_correction_history(field_name);
CREATE INDEX IF NOT EXISTS idx_correction_timestamp ON ocr_correction_history(correction_timestamp DESC);

-- ============================================================================
-- PostgreSQL Functions for OCR System
-- ============================================================================

-- Function: Update vendor template metrics
CREATE OR REPLACE FUNCTION update_vendor_template_metrics(
    p_template_id UUID,
    p_success BOOLEAN,
    p_confidence DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE vendor_ocr_templates
    SET 
        total_documents = total_documents + 1,
        successful_extractions = successful_extractions + CASE WHEN p_success THEN 1 ELSE 0 END,
        success_rate = (successful_extractions::DECIMAL / NULLIF(total_documents, 0)) * 100,
        avg_confidence = ((avg_confidence * (total_documents - 1)) + p_confidence) / total_documents,
        last_used = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate field accuracy from corrections
CREATE OR REPLACE FUNCTION calculate_field_accuracy(
    p_document_type VARCHAR,
    p_field_name VARCHAR,
    p_days INTEGER DEFAULT 30
)
RETURNS DECIMAL AS $$
DECLARE
    v_accuracy DECIMAL;
BEGIN
    SELECT 
        (COUNT(*) FILTER (WHERE original_value = corrected_value)::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100
    INTO v_accuracy
    FROM ocr_correction_history ch
    JOIN ocr_extraction_results er ON ch.extraction_result_id = er.id
    WHERE er.document_type = p_document_type
      AND ch.field_name = p_field_name
      AND ch.correction_timestamp > CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
    
    RETURN COALESCE(v_accuracy, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ocr_results_updated_at BEFORE UPDATE ON ocr_extraction_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_schemas_updated_at BEFORE UPDATE ON document_field_schemas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_templates_updated_at BEFORE UPDATE ON vendor_ocr_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
