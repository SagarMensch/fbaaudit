import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Count total invoices
cur.execute('SELECT COUNT(*) FROM invoices')
print(f"Total invoices in database: {cur.fetchone()[0]}")

# Sample invoices
cur.execute("SELECT id, invoice_number, amount, status FROM invoices LIMIT 5")
print("\nSample invoices:")
for row in cur.fetchall():
    print(f"  {row[1]}: ₹{row[2]} - {row[3]}")

# Check for DEMO invoice
cur.execute("SELECT id, invoice_number, amount, pdf_path FROM invoices WHERE invoice_number LIKE '%DEMO%' LIMIT 3")
demo_rows = cur.fetchall()
print(f"\nDEMO invoices: {len(demo_rows)}")
for row in demo_rows:
    print(f"  {row}")

conn.close()
