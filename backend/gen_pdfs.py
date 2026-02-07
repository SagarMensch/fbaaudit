"""Generate PDFs for invoices - Minimal Version"""
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

UPLOAD_DIR = Path(__file__).parent / "uploads" / "invoices"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get invoices - minimal columns
cur.execute("SELECT id, invoice_number, amount FROM invoices LIMIT 30")
invoices = cur.fetchall()

print(f"Processing {len(invoices)} invoices...")

for inv_id, inv_num, amount in invoices:
    # Create folder
    folder = UPLOAD_DIR / inv_id.replace('/', '_')
    folder.mkdir(parents=True, exist_ok=True)
    
    # Create simple PDF
    pdf_content = f"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 200>>stream
BT /F1 16 Tf 200 700 Td (TAX INVOICE) Tj
/F1 12 Tf 0 -40 Td (Invoice: {inv_num}) Tj
0 -25 Td (Amount: Rs {amount or 0}) Tj
ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref 0 6
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000105 00000 n 
0000000250 00000 n 
0000000500 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref 580
%%EOF"""
    
    pdf_path = folder / "invoice.pdf"
    with open(pdf_path, 'w') as f:
        f.write(pdf_content)
    
    # Update database
    rel_path = f"{inv_id}/invoice.pdf"
    cur.execute("UPDATE invoices SET pdf_path = %s WHERE id = %s", (rel_path, inv_id))
    print(f"  OK: {inv_num}")

conn.commit()
conn.close()
print("Done!")
