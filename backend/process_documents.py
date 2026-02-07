"""
Process Master Data and Invoices with Docling
Convert Book2.xlsx and 5 invoice PDFs to structured data for Supabase
"""
import os
import sys
import json
from pathlib import Path

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent.parent
MASTER_DATA_FILE = BASE_DIR / "Book2.xlsx"
INVOICE_DIR = BASE_DIR / "RE_ GSA Rates - Ocean Freight"
OUTPUT_DIR = Path(__file__).parent / "extracted_data"

def ensure_output_dir():
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"📁 Output directory: {OUTPUT_DIR}")

def process_master_data_with_docling():
    """Process Book2.xlsx with Docling"""
    print("\n" + "=" * 60)
    print("📊 Processing Master Data: Book2.xlsx")
    print("=" * 60)
    
    try:
        from services.docling_service import get_docling_service
        docling = get_docling_service()
        
        result = docling.process_excel(str(MASTER_DATA_FILE))
        
        if result.get('success'):
            # Save extracted data
            output_file = OUTPUT_DIR / "master_data.json"
            
            # Convert dataframes to serializable format
            serializable_result = {
                'file': str(MASTER_DATA_FILE),
                'sheets': {}
            }
            
            for sheet_name, df in result.get('sheets', {}).items():
                serializable_result['sheets'][sheet_name] = df.to_dict('records')
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(serializable_result, f, indent=2, default=str)
            
            print(f"✅ Extracted master data saved to: {output_file}")
            
            # Also save as markdown
            md_file = OUTPUT_DIR / "master_data.md"
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write("# Master Data - Book2.xlsx\n\n")
                for sheet_name, df in result.get('sheets', {}).items():
                    f.write(f"## Sheet: {sheet_name}\n\n")
                    f.write(df.to_markdown(index=False))
                    f.write("\n\n")
            
            print(f"✅ Markdown saved to: {md_file}")
            return serializable_result
        else:
            print(f"❌ Docling processing failed: {result.get('error')}")
            return None
            
    except ImportError as e:
        print(f"⚠️ Docling not available, using pandas fallback: {e}")
        return process_master_data_pandas()

def process_master_data_pandas():
    """Fallback: Process Book2.xlsx with pandas directly"""
    import pandas as pd
    
    print("📊 Using pandas to read Excel...")
    
    try:
        xl = pd.ExcelFile(str(MASTER_DATA_FILE))
        sheets = {}
        
        for sheet_name in xl.sheet_names:
            df = pd.read_excel(xl, sheet_name=sheet_name)
            sheets[sheet_name] = df
            print(f"   • Sheet '{sheet_name}': {len(df)} rows, {len(df.columns)} columns")
        
        # Save extracted data
        output_file = OUTPUT_DIR / "master_data.json"
        serializable_result = {
            'file': str(MASTER_DATA_FILE),
            'sheets': {}
        }
        
        for sheet_name, df in sheets.items():
            serializable_result['sheets'][sheet_name] = df.to_dict('records')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(serializable_result, f, indent=2, default=str)
        
        print(f"✅ Extracted master data saved to: {output_file}")
        
        # Also save as markdown
        md_file = OUTPUT_DIR / "master_data.md"
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write("# Master Data - Book2.xlsx\n\n")
            for sheet_name, df in sheets.items():
                f.write(f"## Sheet: {sheet_name}\n\n")
                f.write(df.to_markdown(index=False))
                f.write("\n\n")
        
        print(f"✅ Markdown saved to: {md_file}")
        return serializable_result
        
    except Exception as e:
        print(f"❌ Error reading Excel: {e}")
        return None

def process_invoices_with_docling():
    """Process all invoice PDFs with Docling"""
    print("\n" + "=" * 60)
    print("📄 Processing Invoices from: RE_ GSA Rates - Ocean Freight")
    print("=" * 60)
    
    invoice_files = list(INVOICE_DIR.glob("*.pdf"))
    print(f"Found {len(invoice_files)} invoice PDFs")
    
    results = []
    
    try:
        from services.docling_service import get_docling_service
        docling = get_docling_service()
        
        for pdf_file in invoice_files:
            print(f"\n📄 Processing: {pdf_file.name}")
            
            result = docling.process_pdf(str(pdf_file))
            
            if result.get('success'):
                invoice_data = {
                    'filename': pdf_file.name,
                    'text': result.get('text', ''),
                    'tables': result.get('tables', []),
                    'metadata': result.get('metadata', {})
                }
                
                # Save individual invoice
                output_file = OUTPUT_DIR / f"{pdf_file.stem}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(invoice_data, f, indent=2, default=str)
                
                # Save as markdown
                md_file = OUTPUT_DIR / f"{pdf_file.stem}.md"
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(f"# {pdf_file.name}\n\n")
                    f.write("## Extracted Text\n\n")
                    f.write(result.get('text', 'No text extracted'))
                    f.write("\n\n## Tables\n\n")
                    for i, table in enumerate(result.get('tables', [])):
                        f.write(f"### Table {i+1}\n\n")
                        f.write(str(table))
                        f.write("\n\n")
                
                print(f"   ✅ Saved: {output_file.name}")
                results.append(invoice_data)
            else:
                print(f"   ❌ Failed: {result.get('error')}")
                
    except ImportError as e:
        print(f"⚠️ Docling not available: {e}")
        print("   Using PyPDF2 fallback...")
        results = process_invoices_pypdf()
    
    # Save combined results
    combined_file = OUTPUT_DIR / "all_invoices.json"
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n✅ All invoices saved to: {combined_file}")
    return results

def process_invoices_pypdf():
    """Fallback: Process invoices with PyPDF2"""
    try:
        import PyPDF2
    except ImportError:
        print("   PyPDF2 not available, trying pdfplumber...")
        return process_invoices_pdfplumber()
    
    invoice_files = list(INVOICE_DIR.glob("*.pdf"))
    results = []
    
    for pdf_file in invoice_files:
        print(f"\n📄 Processing: {pdf_file.name}")
        try:
            with open(pdf_file, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() or ""
            
            invoice_data = {
                'filename': pdf_file.name,
                'text': text,
                'tables': [],
                'metadata': {'pages': len(reader.pages)}
            }
            
            # Save individual invoice
            output_file = OUTPUT_DIR / f"{pdf_file.stem}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(invoice_data, f, indent=2, default=str)
            
            # Save as markdown
            md_file = OUTPUT_DIR / f"{pdf_file.stem}.md"
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(f"# {pdf_file.name}\n\n")
                f.write("## Extracted Text\n\n")
                f.write(text or 'No text extracted')
            
            print(f"   ✅ Saved: {output_file.name}")
            results.append(invoice_data)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    return results

def process_invoices_pdfplumber():
    """Fallback: Process invoices with pdfplumber"""
    try:
        import pdfplumber
    except ImportError:
        print("   pdfplumber not available either")
        return []
    
    invoice_files = list(INVOICE_DIR.glob("*.pdf"))
    results = []
    
    for pdf_file in invoice_files:
        print(f"\n📄 Processing: {pdf_file.name}")
        try:
            with pdfplumber.open(pdf_file) as pdf:
                text = ""
                tables = []
                for page in pdf.pages:
                    text += page.extract_text() or ""
                    page_tables = page.extract_tables()
                    if page_tables:
                        tables.extend(page_tables)
            
            invoice_data = {
                'filename': pdf_file.name,
                'text': text,
                'tables': tables,
                'metadata': {'pages': len(pdf.pages)}
            }
            
            # Save individual invoice
            output_file = OUTPUT_DIR / f"{pdf_file.stem}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(invoice_data, f, indent=2, default=str)
            
            # Save as markdown
            md_file = OUTPUT_DIR / f"{pdf_file.stem}.md"
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(f"# {pdf_file.name}\n\n")
                f.write("## Extracted Text\n\n")
                f.write(text or 'No text extracted')
                f.write("\n\n## Tables\n\n")
                for i, table in enumerate(tables):
                    f.write(f"### Table {i+1}\n\n")
                    f.write(str(table))
                    f.write("\n\n")
            
            print(f"   ✅ Saved: {output_file.name}")
            results.append(invoice_data)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    return results

def main():
    print("=" * 60)
    print("FBAAUDIT - Document Processing Pipeline")
    print("=" * 60)
    
    ensure_output_dir()
    
    # Step 1: Process Master Data
    master_data = process_master_data_with_docling()
    
    # Step 2: Process Invoices
    invoices = process_invoices_with_docling()
    
    print("\n" + "=" * 60)
    print("📊 PROCESSING SUMMARY")
    print("=" * 60)
    print(f"Master Data: {'✅ Success' if master_data else '❌ Failed'}")
    print(f"Invoices Processed: {len(invoices)}")
    print(f"Output Directory: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
