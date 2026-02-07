"""
Advanced OCR Engine with Schema Validation and PostgreSQL Integration
Supports multi-model extraction, confidence scoring, and template learning
"""

import re
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from services.postgres_helper import get_postgres_connection, get_dict_cursor
from services.trocr_engine import get_trocr_engine, trocr_extract
from services.invoice_ocr_engine import InvoiceOCREngine
import psycopg2.extras
import statistics
import requests
import base64
import time
import os

# Debug Logging to file
OCR_LOG = os.path.join(os.path.dirname(__file__), '..', 'ocr_debug.log')
def log_ocr(msg):
    with open(OCR_LOG, 'a', encoding='utf-8') as f:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        f.write(f"[{timestamp}] {msg}\n")
    print(msg)

class AdvancedOCREngine:
    """
    Enterprise-grade OCR extraction with:
    - Schema-driven validation
    - Multi-model ensemble (TrOCR + Tesseract/Paddle)
    - Confidence scoring
    - Template matching
    - PostgreSQL persistence
    """
    
    def __init__(self):
        self.schemas = self._load_schemas()
        self.invoice_engine = InvoiceOCREngine()  # PaddleOCR/Tesseract
        self._configure_openrouter()

    def _configure_openrouter(self):
        """Configure OpenRouter for Vision OCR"""
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        self.openrouter_model = os.getenv('OPENROUTER_MODEL', "qwen/qwen-2.5-vl-7b-instruct:free")
        if self.openrouter_api_key:
            print(f"[AdvancedOCR] OpenRouter Configured: {self.openrouter_model}")
        else:
            print("[AdvancedOCR] WARNING: OPENROUTER_API_KEY not found.")


    def _configure_genai(self):
        """Configure Google Generative AI with API Key"""
        api_key = os.getenv('API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            print("[AdvancedOCR] Gemini AI Configured successfully")
        else:
            print("[AdvancedOCR] WARNING: API_KEY not found. Gemini OCR will fail.")
        
    def _load_schemas(self) -> Dict[str, Any]:
        """Load all JSON schemas from ocr_schemas directory"""
        import os
        schemas = {}
        schema_dir = os.path.join(os.path.dirname(__file__), '..', 'ocr_schemas')
        
        if os.path.exists(schema_dir):
            for filename in os.listdir(schema_dir):
                if filename.endswith('_schema.json'):
                    doc_type = filename.replace('_schema.json', '').upper()
                    with open(os.path.join(schema_dir, filename), 'r') as f:
                        schemas[doc_type] = json.load(f)
        
        return schemas
    
    
    def extract_with_schema(
        self, 
        raw_text: str = None,
        file_path: str = None,
        document_type: str = "INVOICE",
        document_id: str = None,
        ocr_engine: str = "ENSEMBLE"
    ) -> Dict[str, Any]:
        """
        Extract structured data using schema validation and optional multi-model ensemble
        
        Args:
            raw_text: Optional pre-extracted text
            file_path: Path to document file (required for ensemble)
            document_type: Type of document (INVOICE, LR, etc.)
        document_id: Optional document identifier
        ocr_engine: str = "ENSEMBLE"
    ) -> Dict[str, Any]:
            
        Returns:
            dict with extracted_data, confidence scores, validation results
        """
        if document_type not in self.schemas:
            raise ValueError(f"No schema found for document type: {document_type}")
        
        schema = self.schemas[document_type]
        
        # If ensemble or specific engine requested, and file path provided, extract text first
        if file_path and (ocr_engine == "ENSEMBLE" or not raw_text):
            if ocr_engine == "ENSEMBLE":
                raw_text, extracted_data, field_confidences = self._extract_with_ensemble(file_path, schema)
            elif ocr_engine == "TROCR":
                raw_text = self._extract_with_trocr(file_path)
                extracted_data = {} # WIll be extracted from raw_text
                field_confidences = {}
            elif ocr_engine == "TESSERACT" or ocr_engine == "PADDLE":
                raw_text = self._extract_with_paddle_tesseract(file_path)
                extracted_data = {}
                raw_text = self._extract_with_paddle_tesseract(file_path)
                extracted_data = {}
                field_confidences = {}
            elif ocr_engine == "GEMINI":
                 # Use OpenRouter for reliable extraction
                 raw_text, extracted_data, field_confidences = self._extract_with_openrouter(file_path, schema)
        else:
            # Fallback to existing text-only extraction
            extracted_data = {}
            field_confidences = {}
            
        # --- TEMPLATE CHECK ---
        # Try to identify vendor associated with text and load template
        template_id = None
        template_match_score = 0.0
        vendor_detected = None
        
        # Simple heuristic to find vendor (can be improved with logo detection)
        # Note: 'extracted_data' might already cache some fields from ensemble
        vendor_info = extracted_data.get('vendor', {})
        if isinstance(vendor_info, dict):
            vendor_name = vendor_info.get('name')
        else:
            # Try to regex it quickly just for ID
            vendor_name = None
            
        if not vendor_name:
            # Try basic regex from schema to find vendor name early
            vendor_field = self._extract_field(raw_text or "", "vendor", schema['fields'].get('vendor', {}))
            if vendor_field['value'] and isinstance(vendor_field['value'], dict):
                vendor_name = vendor_field['value'].get('name')
        
        if vendor_name:
            vendor_detected = vendor_name
            template = self._find_matching_template(vendor_name, document_type)
            
            if template:
                print(f"[AdvancedOCR] Found template for vendor: {vendor_name}")
                template_id = template['id']
                # Override extraction with template-specific patterns
                template_data, template_conf = self._extract_with_template(
                    raw_text, 
                    template['field_patterns'],
                    schema
                )
                
                # Merge template data (higher priority)
                extracted_data.update(template_data)
                field_confidences.update(template_conf)
                template_match_score = 0.95  # Placeholder

        extraction_result = {
            'document_id': document_id or str(uuid.uuid4()),
            'document_type': document_type,
            'ocr_engine': ocr_engine,
            'extraction_timestamp': datetime.now().isoformat(),
            'raw_text': raw_text or "",
            'extracted_data': extracted_data,
            'field_confidence': field_confidences,
            'overall_confidence': 0.0,
            'validation_status': 'PENDING',
            'validation_errors': [],
            'vendor_template_id': template_id,
            'template_match_score': template_match_score,
            'vendor_detected': vendor_detected
        }
        
        # If we didn't get extracted data from ensemble (i.e. we just got raw text or using single engine),
        # extract fields from raw text now
        # Also fill in any missing fields that template/ensemble missed
        for field_name, field_def in schema['fields'].items():
            if field_name not in extraction_result['extracted_data']:
                field_result = self._extract_field(
                    raw_text or "", 
                    field_name, 
                    field_def
                )
                
                if field_result['value'] is not None:
                    extraction_result['extracted_data'][field_name] = field_result['value']
                    extraction_result['field_confidence'][field_name] = field_result['confidence']
        
        # Calculate overall confidence
        if extraction_result['field_confidence']:
            extraction_result['overall_confidence'] = sum(
                extraction_result['field_confidence'].values()
            ) / len(extraction_result['field_confidence'])
        
        # Validate against schema
        validation = self.validate_against_schema(
            extraction_result['extracted_data'],
            schema
        )
        
        extraction_result['validation_status'] = validation['status']
        extraction_result['validation_errors'] = validation['errors']
        
        # Save to PostgreSQL
        self.save_extraction_result(extraction_result)
        
        return extraction_result

    def _find_matching_template(self, vendor_name: str, document_type: str) -> Optional[Dict]:
        """Look up template by vendor name"""
        try:
            conn = get_postgres_connection()
            cursor = get_dict_cursor(conn)
            
            # Fuzzy match or robust normalization needed, simple ILIKE for now
            cursor.execute("""
                SELECT * FROM vendor_ocr_templates
                WHERE vendor_name ILIKE %s AND document_type = %s
                LIMIT 1
            """, (f"%{vendor_name}%", document_type))
            
            template = cursor.fetchone()
            cursor.close()
            conn.close()
            return dict(template) if template else None
        except Exception as e:
            print(f"[AdvancedOCR] Template lookup failed: {e}")
            return None

    def _extract_with_template(self, text: str, patterns: Dict, schema: Dict) -> Tuple[Dict, Dict]:
        """Apply template-specific regex patterns"""
        data = {}
        conf = {}
        
        if not patterns:
            return data, conf
            
        for field, pattern in patterns.items():
            if not pattern: continue
            
            try:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    # Assume pattern has one capturing group for the value
                    val = match.group(1) if match.groups() else match.group(0)
                    
                    # Convert type
                    field_def = schema['fields'].get(field, {})
                    clean_val = self._clean_and_convert(val, field_def.get('type', 'string'))
                    
                    if clean_val:
                        data[field] = clean_val
                        conf[field] = 99.0  # High confidence for template match
            except Exception as e:
                print(f"[AdvancedOCR] Template extraction error on {field}: {e}")
                
        return data, conf
        
    def save_vendor_template(self, vendor_id: str, vendor_name: str, document_type: str, field_patterns: Dict) -> bool:
        """
        Save learned patterns as a template
        """
        try:
            conn = get_postgres_connection()
            cursor = conn.cursor()
            
            # Upsert template
            query = """
                INSERT INTO vendor_ocr_templates (
                    id, vendor_id, vendor_name, document_type,
                    field_patterns, layout_signature,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
                ON CONFLICT (vendor_id, document_type) 
                DO UPDATE SET
                    field_patterns = EXCLUDED.field_patterns,
                    updated_at = NOW()
            """
            
            cursor.execute(query, (
                str(uuid.uuid4()),
                vendor_id,
                vendor_name,
                document_type,
                psycopg2.extras.Json(field_patterns),
                psycopg2.extras.Json({}) # Layout signature future use
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            print(f"[AdvancedOCR] Template saved for {vendor_name}")
            return True
        except Exception as e:
            print(f"[AdvancedOCR] Failed to save template: {e}")
            if conn: conn.rollback()
            return False

    
    def learn_from_validated_data(
        self,
        document_type: str,
        vendor_id: str,
        vendor_name: str,
        raw_text: str,
        validated_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        One-Shot Learning: Generate regex patterns from validated data
        
        Args:
            document_type: Document type (INVOICE, LR)
            vendor_id: Unique vendor identifier to save template for
            vendor_name: Human readable vendor name
            raw_text: The full OCR text of the document
            validated_data: Key-value pairs of correct data (e.g. {'invoice_number': 'INV-001'})
            
        Returns:
            Dict of generated patterns
        """
        print(f"[AdvancedOCR] Learning patterns for vendor: {vendor_name}")
        learned_patterns = {}
        
        for field, value in validated_data.items():
            if not value: continue
            
            # Skip complex objects for now, handle primitives
            if isinstance(value, (dict, list)):
                continue
                
            value_str = str(value).strip()
            if not value_str: continue
            
            # Generate a specific pattern for this field
            pattern = self._generate_pattern_for_field(raw_text, value_str)
            if pattern:
                learned_patterns[field] = pattern
                
        if learned_patterns:
            self.save_vendor_template(vendor_id, vendor_name, document_type, learned_patterns)
            
        return learned_patterns

    def _generate_pattern_for_field(self, text: str, value: str) -> Optional[str]:
        """
        Reverse-engineer a regex pattern for a value in text
        Strategy: Find value, look at context before it, create anchored regex
        """
        try:
            # Escape value for regex search
            val_regex = re.escape(value)
            
            # Find all occurrences of value in text
            matches = list(re.finditer(val_regex, text))
            
            if not matches:
                # Value might be formatted differently (e.g. 1,000 vs 1000)
                # Try simple normalization (remove commas)
                if ',' in value:
                    simple_val = value.replace(',', '')
                    val_regex = re.escape(simple_val)
                    matches = list(re.finditer(val_regex, text))
            
            if not matches:
                return None
                
            # Use the first match for context (simplified)
            # Ideally we'd look for the "best" match (most unique context)
            match = matches[0]
            start, end = match.span()
            
            # Look at 20 chars before
            context_start = max(0, start - 20)
            prefix = text[context_start:start]
            
            # Clean prefix: take last few words
            # e.g. "Invoice No : " -> "Invoice No : "
            # e.g. "x7s8d Invoice No: " -> "Invoice No: "
            
            # Split by whitespace and take last 3 tokens if possible
            tokens = prefix.split()
            if not tokens:
                return None # No context, unsafe to learn
                
            anchor_tokens = tokens[-3:] if len(tokens) >= 3 else tokens
            anchor = "\\s*".join([re.escape(t) for t in anchor_tokens])
            
            # Construct pattern: Anchor + flexible separator + Capture Group
            # e.g. "Invoice\s*No\s*[:\s]*([A-Z0-9\-]+)"
            
            # Refine anchor: allow flexible whitespace/punctuation between tokens
            anchor_pattern = ""
            for token in anchor_tokens:
                # Escape the token characters
                esc_token = re.escape(token)
                # Allow whitespace after
                anchor_pattern += esc_token + r"\s*"
                
            # Allow for colons or dashes at the end of anchor
            anchor_pattern += r"[:\-\.]?\s*"
            
            # Create capture group based on value type
            # If value is digits: (\d+)
            # If value is alphanumeric: ([A-Z0-9]+)
            # If value allows spaces: (.*?) but lazy
            
            if value.replace(',', '').replace('.', '').isdigit():
                capture_group = r"([\d,\.]+)"
            elif value.isalnum():
                capture_group = r"([A-Za-z0-9]+)"
            else:
                # More generic but safe-ish
                capture_group = r"([^\n]+)"
                
            full_pattern = anchor_pattern + capture_group
            
            print(f"[AdvancedOCR] Generated pattern for '{value}': {full_pattern}")
            return full_pattern
            
        except Exception as e:
            print(f"[AdvancedOCR] Pattern generation failed: {e}")
            return None

    def _extract_with_trocr(self, file_path: str) -> str:
        """Extract text using TrOCR"""
        try:
            result = trocr_extract(file_path)
            return result.get('text', '')
        except Exception as e:
            print(f"[AdvancedOCR] TrOCR failed: {e}")
            return ""

    def _extract_with_paddle_tesseract(self, file_path: str) -> str:
        """Extract text using PaddleOCR/Tesseract"""
        try:
            # InvoiceOCREngine mainly designed for full processing, but we can reuse its init logic
            # For simplest text extraction, we might need to expose a method or just use the initialized ocr
            # Here we assume we can just use the extracting logic if available, or just instantiate basic check
            # Since InvoiceOCREngine is complex, let's just use it to get text if possible
            # Or use Pdf2Image + Pytesseract directly if needed.
            # But wait, InvoiceOCREngine has `extract_invoice_data` which returns structured data
            # Let's try to use it for text first
            
            # Simplified: Use `ocr_document` from its internal logic if exposed, 
            # Or we can just use `extract_invoice_data` and reconstruct text or get text from result
            
            # Let's create a temporary method to just get text using the engine we instantiated
            # We can inspect `invoice_ocr_engine.py` again - it doesn't seem to have a simple `get_text`
            # So let's implement a simple wrapper here using the same libraries if needed, 
            # OR better, let's TRUST the ensemble to process fields directly
            
            # For now, let's assume we want TEXT for regex extraction
            # We will use the `invoice_engine` we created in __init__
            # Use a helper if available, else simple pytesseract fallback
            import pytesseract
            from services.invoice_ocr_engine import get_pdf2image, get_pil
            
            # Try to use the engine's capability if possible, else simple fallback
            # Since we can't easily access the internal methods, let's do a direct extraction here
            # using the tools available in that module
            
            # Actually, let's rely on InvoiceOCREngine being primarily for STRUCTURE
            # and TrOCR for Raw Text.
            # For this method, let's just return what `extract_invoice_data` might give if it gave text
            # But it returns models.
            
            # Let's implement a quick extraction here
            if file_path.lower().endswith('.pdf'):
                images = get_pdf2image()['convert_from_path'](file_path)
                full_text = []
                for img in images:
                    full_text.append(pytesseract.image_to_string(img))
                return "\n".join(full_text)
            else:
                img = get_pil().open(file_path)
                return pytesseract.image_to_string(img)

        except Exception as e:
            print(f"[AdvancedOCR] Paddle/Tesseract failed: {e}")
            return ""

    def _extract_with_ensemble(self, file_path: str, schema: Dict) -> Tuple[str, Dict, Dict]:
        """
        Run multiple models and vote on best results
        Returns: (raw_text_combined, extracted_data, field_confidences)
        """
        print(f"[AdvancedOCR] Starting Ensemble Extraction for {file_path}...")
        
        # 1. TrOCR Extraction (Best for Handwriting/Messy text)
        trocr_text = self._extract_with_trocr(file_path)
        
        # 2. Classic OCR (Best for Printed Tables)
        # We use our simpler wrapper here for raw text
        classic_text = self._extract_with_paddle_tesseract(file_path)
        
        # 3. Extract fields from BOTH text sources using regex
        trocr_fields = {}
        classic_fields = {}
        
        for field_name, field_def in schema['fields'].items():
            trocr_res = self._extract_field(trocr_text, field_name, field_def)
            if trocr_res['value']:
                trocr_fields[field_name] = trocr_res
                
            classic_res = self._extract_field(classic_text, field_name, field_def)
            if classic_res['value']:
                classic_fields[field_name] = classic_res
                
        # 4. Vote/Merge Results
        final_data = {}
        final_conf = {}
        
        all_fields = set(trocr_fields.keys()) | set(classic_fields.keys())
        
        for field in all_fields:
            t_val = trocr_fields.get(field, {'value': None, 'confidence': 0})
            c_val = classic_fields.get(field, {'value': None, 'confidence': 0})
            
            # Voting Logic:
            # - If both agree, high confidence
            # - If one is much higher confidence, take it
            # - If TrOCR is usually better for X, take it (can be schema defined)
            
            best_val = None
            best_conf = 0.0
            
            if t_val['value'] == c_val['value'] and t_val['value'] is not None:
                # Agreement! Boost confidence
                best_val = t_val['value']
                best_conf = min(99.0, max(t_val['confidence'], c_val['confidence']) + 10)
            elif t_val['confidence'] > c_val['confidence']:
                best_val = t_val['value']
                best_conf = t_val['confidence']
            else:
                best_val = c_val['value']
                best_conf = c_val['confidence']
            
            if best_val is not None:
                final_data[field] = best_val
                final_conf[field] = best_conf
        
        # Combined text for reference
        combined_text = f"--- TROCR ---\n{trocr_text}\n\n--- CLASSIC ---\n{classic_text}"
        
        return combined_text, final_data, final_conf

    
    def _extract_field(
        self, 
        text: str, 
        field_name: str, 
        field_def: Dict
    ) -> Dict[str, Any]:
        """
        Extract a single field from text using patterns from schema
        
        Returns:
            dict with 'value' and 'confidence'
        """
        result = {'value': None, 'confidence': 0.0}
        
        patterns = field_def.get('extraction_patterns', [])
        matches = []
        
        for pattern in patterns:
            try:
                regex_matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
                if regex_matches:
                    matches.extend(regex_matches)
            except re.error as e:
                print(f"[OCR] Invalid regex pattern for {field_name}: {e}")
                continue
        
        if not matches:
            return result
        
        # Take the first match (TODO: implement voting for multiple matches)
        raw_value = matches[0] if isinstance(matches[0], str) else matches[0][0] if isinstance(matches[0], tuple) else str(matches[0])
        
        # Clean and convert value based on field type
        cleaned_value = self._clean_and_convert(raw_value, field_def.get('type', 'string'))
        
        if cleaned_value is not None:
            result['value'] = cleaned_value
            
            # Calculate confidence based on:
            # 1. Number of patterns that matched
            # 2. Value passes validation
            # 3. Value is not empty/zero
            confidence = min(100.0, (len(matches) / len(patterns)) * 100)
            
            # Boost confidence if value passes validation
            if self._validate_value(cleaned_value, field_def):
                confidence = min(100.0, confidence + 20)
            
            result['confidence'] = round(confidence, 2)
        
        return result
    
    def _clean_and_convert(self, raw_value: str, field_type: str) -> Any:
        """Clean and convert extracted value to proper type"""
        if not raw_value or raw_value.strip() == '':
            return None
            
        raw_value = raw_value.strip()
        
        try:
            if field_type == 'number':
                # Remove currency symbols and commas
                clean = re.sub(r'[₹$,\s]', '', raw_value)
                return float(clean)
            
            elif field_type == 'date':
                # Parse date formats (simplified - can use dateutil.parser for robustness)
                from datetime import datetime as dt
                for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%d-%b-%Y']:
                    try:
                        return dt.strptime(raw_value, fmt).date().isoformat()
                    except ValueError:
                        continue
                return raw_value  # Return as-is if parsing fails
            
            elif field_type == 'string':
                return raw_value
            
            elif field_type == 'object':
                # For nested objects, return as dict (TODO: implement recursive extraction)
                return {'raw': raw_value}
            
            else:
                return raw_value
                
        except Exception as e:
            print(f"[OCR] Conversion error for type {field_type}: {e}")
            return raw_value
    
    def _validate_value(self, value: Any, field_def: Dict) -> bool:
        """Validate value against field definition rules"""
        if value is None:
            return not field_def.get('required', False)
        
        validation_rules = field_def.get('validation', {})
        
        try:
            # Check min/max for numbers
            if isinstance(value, (int, float)):
                if 'min' in validation_rules and value < validation_rules['min']:
                    return False
                if 'max' in validation_rules and value > validation_rules['max']:
                    return False
            
            # Check length for strings
            if isinstance(value, str):
                if 'min_length' in validation_rules and len(value) < validation_rules['min_length']:
                    return False
                if 'max_length' in validation_rules and len(value) > validation_rules['max_length']:
                    return False
                
                # Check pattern
                if 'pattern' in validation_rules:
                    if not re.match(validation_rules['pattern'], value):
                        return False
            
            return True
            
        except Exception:
            return False
    
    def validate_against_schema(
        self, 
        extracted_data: Dict[str, Any], 
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate extracted data against schema rules and business logic
        
        Returns:
            dict with 'status' and 'errors'
        """
        validation_result = {
            'status': 'PASSED',
            'errors': []
        }
        
        # Check required fields
        for field_name, field_def in schema['fields'].items():
            if field_def.get('required', False):
                if field_name not in extracted_data or extracted_data[field_name] is None:
                    validation_result['errors'].append({
                        'field': field_name,
                        'error': 'REQUIRED_FIELD_MISSING',
                        'message': f"Required field '{field_name}' is missing"
                    })
        
        # Check business rules
        business_rules = schema.get('business_rules', [])
        for rule in business_rules:
            # TODO: Implement business rule evaluation
            # For now, skip complex rule validation
            pass
        
        # Set status based on errors
        if validation_result['errors']:
            validation_result['status'] = 'FAILED' if len(validation_result['errors']) > 2 else 'REVIEW_NEEDED'
        
        return validation_result
    
    def save_extraction_result(self, result: Dict[str, Any]) -> str:
        """Save extraction result to PostgreSQL"""
        try:
            conn = get_postgres_connection()
            cursor = conn.cursor()
            
            result_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO ocr_extraction_results (
                    id, document_id, document_type, extraction_timestamp,
                    raw_text, ocr_engine, extracted_data,
                    overall_confidence, field_confidence,
                    validation_status, validation_errors,
                    schema_version
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(query, (
                result_id,
                result.get('document_id'),
                result.get('document_type'),
                datetime.now(),
                result.get('raw_text'),
                result.get('ocr_engine'),
                psycopg2.extras.Json(result.get('extracted_data', {})),
                result.get('overall_confidence'),
                psycopg2.extras.Json(result.get('field_confidence', {})),
                result.get('validation_status'),
                psycopg2.extras.Json(result.get('validation_errors', [])),
                '1.0'
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"[AdvancedOCR] Saved extraction result: {result_id}")
            return result_id
            
        except Exception as e:
            print(f"[AdvancedOCR] Error saving extraction result: {e}")
            if conn:
                conn.rollback()
                conn.close()
            return None
    
    def get_extraction_result(self, document_id: str) -> Optional[Dict]:
        """Retrieve extraction result from database"""
        try:
            conn = get_postgres_connection()
            cursor = get_dict_cursor(conn)
            
            cursor.execute("""
                SELECT * FROM ocr_extraction_results 
                WHERE document_id = %s 
                ORDER BY extraction_timestamp DESC 
                LIMIT 1
            """, (document_id,))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return dict(result) if result else None
            
        except Exception as e:
            print(f"[AdvancedOCR] Error retrieving result: {e}")
            return None
    
    def learn_from_correction(
        self, 
        extraction_result_id: str,
        field_name: str,
        original_value: Any,
        corrected_value: Any,
        corrected_by: str
    ) -> bool:
        """
        Learn from user correction to improve future extractions
        
        This will:
        1. Store the correction in history
        2. Update vendor template if pattern detected
        3. Adjust confidence thresholds
        """
        try:
            conn = get_postgres_connection()
            cursor = conn.cursor()
            
            # Save correction history
            cursor.execute("""
                INSERT INTO ocr_correction_history (
                    id, extraction_result_id, document_id, field_name,
                    original_value, corrected_value, corrected_by
                )
                SELECT %s, %s, document_id, %s, %s, %s, %s
                FROM ocr_extraction_results
                WHERE id = %s
            """, (
                str(uuid.uuid4()),
                extraction_result_id,
                field_name,
                str(original_value),
                str(corrected_value),
                corrected_by,
                extraction_result_id
            ))
            
            # Update extraction result
            cursor.execute("""
                UPDATE ocr_extraction_results
                SET has_corrections = TRUE,
                    corrected_by = %s,
                    corrected_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (corrected_by, extraction_result_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"[AdvancedOCR] Correction saved for field: {field_name}")
            
            # TODO: Implement template learning logic
            # - Analyze pattern in corrected value
            # - Update vendor template patterns
            # - Adjust confidence thresholds
            
            return True
            
        except Exception as e:
            print(f"[AdvancedOCR] Error saving correction: {e}")
            if conn:
                conn.rollback()
                conn.close()
            return False

    def _extract_with_openrouter(self, file_path: str, schema: Dict[str, Any]) -> Tuple[str, Dict[str, Any], Dict[str, float]]:
        """
        Extract data using OpenRouter with Auto-Retry and Fallback
        """
        log_ocr(f"Starting OpenRouter extraction for: {file_path}")
        primary_model = self.openrouter_model
        fallback_model = "google/gemini-2.0-flash-exp:free"
        
        models_to_try = [primary_model, fallback_model]
        
        if not self.openrouter_api_key:
            log_ocr("ERROR: OPENROUTER_API_KEY missing")
            raise ValueError("OPENROUTER_API_KEY missing in .env")

        last_error = "Unknown Error"
        
        for model_id in models_to_try:
            log_ocr(f"Attempting OpenRouter with model: {model_id}")
            
            max_retries = 3
            retry_delay = 2 # seconds
            
            for attempt in range(max_retries):
                try:
                    log_ocr(f"Attempt {attempt+1}/{max_retries} for {model_id}")
                    # Encode image
                    with open(file_path, "rb") as f:
                        b64_img = base64.b64encode(f.read()).decode('utf-8')
                    
                    # Identify file type
                    mime_type = "image/jpeg"
                    if file_path.lower().endswith(".png"): mime_type = "image/png"
                    elif file_path.lower().endswith(".webp"): mime_type = "image/webp"

                    schema_keys = list(schema.get('fields', {}).keys())
                    prompt = f"Extract these fields from the document into valid JSON: {', '.join(schema_keys)}. Format: {{\"field\": \"value\"}}"

                    headers = {
                        "Authorization": f"Bearer {self.openrouter_api_key}",
                        "HTTP-Referer": "http://localhost:5000",
                        "X-Title": "Atlas OCR",
                        "Content-Type": "application/json"
                    }

                    payload = {
                        "model": model_id,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": f"data:{mime_type};base64,{b64_img}"}
                                    }
                                ]
                            }
                        ],
                        "response_format": {"type": "json_object"}
                    }

                    log_ocr(f"Sending request to OpenRouter for {model_id}...")
                    resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=40)
                    
                    if resp.status_code == 200:
                        log_ocr(f"Success with {model_id}!")
                        result = resp.json()
                        response_text = result['choices'][0]['message']['content']
                        extracted_data = json.loads(response_text)
                        confidences = {k: 0.98 for k in extracted_data.keys()}
                        return response_text, extracted_data, confidences
                    
                    elif resp.status_code == 429:
                        log_ocr(f"429 Rate Limit on {model_id}. Waiting {retry_delay}s...")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        last_error = f"429 Rate Limit: {resp.text}"
                    else:
                        log_ocr(f"API Error {resp.status_code}: {resp.text}")
                        last_error = f"API Error {resp.status_code}"
                        break # Try next model or fail attempt
                        
                except Exception as e:
                    log_ocr(f"Exception during OpenRouter {model_id}: {e}")
                    last_error = str(e)
                    time.sleep(1)

        log_ocr(f"CRITICAL: All OpenRouter models/retries failed. Last error: {last_error}")
        raise Exception(f"OpenRouter failed. Last error: {last_error}")

    def _extract_with_gemini(self, file_path: str, schema: Dict[str, Any]) -> Tuple[str, Dict[str, Any], Dict[str, float]]:
        # Keeping as legacy fallback if needed
        pass
