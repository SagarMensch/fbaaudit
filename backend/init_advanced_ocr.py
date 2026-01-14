"""
Initialize Advanced OCR System Database Schema
Run this to create all required PostgreSQL tables
"""

from services.postgres_helper import get_postgres_connection
import os

def init_advanced_ocr_schema():
    """Execute the advanced OCR schema SQL file"""
    try:
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'schema_ocr_advanced.sql')
        
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        
        # Execute on PostgreSQL
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        print("[AdvancedOCR] Executing schema creation...")
        cursor.execute(schema_sql)
        conn.commit()
        
        print("[AdvancedOCR] ✅ Schema created successfully!")
        print("[AdvancedOCR] Created tables:")
        print("  - ocr_extraction_results")
        print("  - document_field_schemas")
        print("  - vendor_ocr_templates")
        print("  - ocr_quality_metrics")
        print("  - ocr_correction_history")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"[AdvancedOCR] ❌ Error creating schema: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    print("="*60)
    print("ADVANCED OCR SYSTEM - Database Initialization")
    print("="*60)
    
    success = init_advanced_ocr_schema()
    
    if success:
        print("\n✅ Advanced OCR schema initialized successfully!")
        print("You can now use the Advanced OCR Engine.")
    else:
        print("\n❌ Schema initialization failed. Check errors above.")
