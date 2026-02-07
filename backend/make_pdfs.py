# Generate PDFs for invoices - V2
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path
from fpdf import FPDF

load_dotenv()

UPLOAD_DIR = Path(__file__).parent / "uploads" / "invoices"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    exit(1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get all columns first
cur.execute("SELECT * FROM invoices LIMIT 1")
cols = [d[0] for d in cur.description]
print("Columns:", cols)

# Build dynamic query - use id and invoice_number which we know exist
cur.execute("SELECT id, invoice_number FROM invoices LIMIT 30")
invoices = cur.fetchall()
print("Found", len(invoices), "invoices")

for inv_id, inv_num in invoices:
    folder = UPLOAD_DIR / inv_id.replace("/", "_")
    folder.mkdir(parents=True, exist_ok=True)
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "TAX INVOICE", 0, 1, "C")
    pdf.ln(10)
    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 10, "Invoice: " + str(inv_num), 0, 1)
    pdf.cell(0, 10, "ID: " + str(inv_id), 0, 1)
    pdf.output(str(folder / "invoice.pdf"))
    
    rel = inv_id + "/invoice.pdf"
    cur.execute("UPDATE invoices SET pdf_path = %s WHERE id = %s", (rel, inv_id))
    print("OK:", inv_num)

conn.commit()
conn.close()
print("Done!")
