"""
Simple PDF Generator - Generate Invoice PDFs and Update Database
"""

import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Create uploads directory
UPLOAD_DIR = Path(__file__).parent / "uploads" / "invoices"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def create_simple_pdf(inv_id, inv_number, vendor, amount, origin, dest, output_path):
    """Create a minimal PDF using raw PDF format"""
    content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj
<< /Length 400 >>
stream
BT
/F1 18 Tf
250 750 Td
(TAX INVOICE) Tj
/F1 12 Tf
-200 -50 Td
(Invoice #: {inv_number}) Tj
0 -25 Td
(Vendor: {vendor or 'Unknown'}) Tj
0 -25 Td
(Route: {origin or 'N/A'} to {dest or 'N/A'}) Tj
0 -40 Td
/F1 14 Tf
(Amount: Rs. {amount or 0:,.2f}) Tj
0 -50 Td
/F1 10 Tf
(Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000720 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
795
%%EOF"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)


def main():
    print("=" * 60)
    print("GENERATING INVOICE PDFs")
    print("=" * 60)
    
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found")
        return
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Simple query - just get key fields
    cursor.execute("SELECT id, invoice_number, vendor_name, amount, origin, destination FROM invoices LIMIT 30")
    invoices = cursor.fetchall()
    
    print(f"Found {len(invoices)} invoices")
    
    count = 0
    for row in invoices:
        inv_id, inv_number, vendor, amount, origin, dest = row
        
        # Create folder
        folder_name = inv_id.replace('/', '_').replace('\\', '_')
        folder = UPLOAD_DIR / folder_name
        folder.mkdir(parents=True, exist_ok=True)
        
        pdf_path = folder / "invoice.pdf"
        
        try:
            create_simple_pdf(inv_id, inv_number, vendor, amount or 0, origin, dest, str(pdf_path))
            
            # Update database
            relative_path = f"{inv_id}/invoice.pdf"
            cursor.execute("UPDATE invoices SET pdf_path = %s WHERE id = %s", (relative_path, inv_id))
            
            count += 1
            print(f"  OK: {inv_number}")
        except Exception as e:
            print(f"  FAIL: {inv_number} - {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"\nGenerated {count} PDFs in {UPLOAD_DIR}")


if __name__ == "__main__":
    main()
