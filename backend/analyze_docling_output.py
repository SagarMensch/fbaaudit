"""Analyze Docling output for user demonstration"""
import sys
import json
import os
sys.path.insert(0, '.')
from docling.document_converter import DocumentConverter

def analyze_output():
    file_path = os.path.join('..', 'Book2.xlsx')
    print(f"Processing {file_path} with Docling...")
    
    converter = DocumentConverter()
    result = converter.convert(file_path)
    doc = result.document
    
    # 1. Export to Markdown
    md_output = doc.export_to_markdown()
    with open('docling_output.md', 'w', encoding='utf-8') as f:
        f.write(md_output)
    print("✅ Exported to Markdown (docling_output.md)")
    
    # 2. Export to JSON (Lossless)
    # We need to serialize the document object. Docling objects often have a .dict() or similar.
    # checking doc attributes
    json_output = {}
    try:
        # Check if export_to_dict exists or similar
        if hasattr(doc, 'export_to_dict'):
            json_output = doc.export_to_dict()
        elif hasattr(doc, 'to_dict'):
            json_output = doc.to_dict()
        else:
            # Manually construct some info if pure serialization fails
            json_output = {
                "tables": [
                    {
                        "data": t.export_to_dataframe().to_dict(orient='records'),
                        "row_count": len(t.export_to_dataframe())
                    } for t in doc.tables
                ],
                "texts": [t.text for t in doc.texts] if hasattr(doc, 'texts') else []
            }
            
        with open('docling_output.json', 'w', encoding='utf-8') as f:
            json.dump(json_output, f, indent=2, default=str)
        print("✅ Exported to JSON (docling_output.json)")
        
    except Exception as e:
        print(f"❌ JSON Export failed: {e}")
        
    print("\n--- MARKDOWN OUTPUT SAMPLE (First 500 chars) ---")
    print(md_output[:500])
    
    print("\n--- JSON STRUCTURE KEYS ---")
    if isinstance(json_output, dict):
        print(list(json_output.keys()))

if __name__ == "__main__":
    analyze_output()
