"""
VDU Engine Test Script - Laxmi Pharma Invoice
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, '.')
import json

# Test the VDU Engine on the Laxmi Pharma invoice
from services.vdu import VDUEngine, FormDetector, get_confidence_calibrator

print('='*70)
print('VDU ENGINE TEST - Laxmi Pharma Invoice')
print('='*70)

# Initialize
engine = VDUEngine()
form_detector = FormDetector()
calibrator = get_confidence_calibrator()

file_path = 'Laxmi Pharma.pdf'

print('\n[1] RAW TEXT EXTRACTION')
print('-'*50)
result = engine.extract(file_path, 'INVOICE')
raw_text = result.get('raw_text', '')
print(f'Characters extracted: {len(raw_text)}')
print(f'Method: {result.get("model_used", "N/A")}')
print(f'Processing time: {result.get("processing_time_s", 0)}s')
print('\nRAW TEXT (first 2500 chars):')
print(raw_text[:2500])

print('\n\n[2] FIELD MAPPINGS (Structured Extraction)')
print('-'*50)
extracted = result.get('extracted_data', {})
for field, value in extracted.items():
    if value is not None:
        print(f'  {field}: {value}')

print('\n\n[3] TABLE DETECTION')
print('-'*50)
try:
    tables = form_detector.detect(file_path, detect_tables=True, detect_checkboxes=False)
    if tables.get('success'):
        print(f'Tables found: {len(tables.get("tables", []))}')
        for i, table in enumerate(tables.get('tables', [])[:3]):
            print(f'  Table {i+1}: {table.get("rows", 0)} rows x {table.get("cols", 0)} cols')
    else:
        print('Table detection: Checking for line items in text...')
except Exception as e:
    print(f'Table detection error: {e}')
    print('Using LLM-extracted structure instead.')

# Check for line items in raw text
if 'Product Description' in raw_text or 'HSN' in raw_text:
    print('\n  Line Items Found in Text:')
    print('  [OK] Product Description column detected')
if 'Quantity' in raw_text or 'Qty' in raw_text:
    print('  [OK] Quantity column detected')
if 'Amount' in raw_text or 'Value' in raw_text:
    print('  [OK] Amount/Value column detected')
if 'GST' in raw_text or 'IGST' in raw_text or 'CGST' in raw_text:
    print('  [OK] Tax columns detected')

print('\n\n[4] CONFIDENCE CALIBRATION')
print('-'*50)
conf = calibrator.calibrate(extracted, raw_text)
print(f'Overall Confidence: {conf.get("overall_confidence", 0)*100:.1f}%')
print(f'Quality Rating: {conf.get("quality_rating", "N/A")}')
print(f'Needs Review: {conf.get("needs_review", False)}')

# Field-level confidence
print('\nField Confidences:')
for field, data in conf.get('field_confidences', {}).items():
    if data.get('value'):
        conf_pct = data.get('confidence', 0) * 100
        print(f'  {field}: {conf_pct:.0f}% (validated: {data.get("validated", False)})')

print('\n' + '='*70)
print('TEST COMPLETE')
print('='*70)
