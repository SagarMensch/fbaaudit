"""Check database schema"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get column names for invoices table
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'invoices'
    ORDER BY ordinal_position
""")

print("INVOICES TABLE COLUMNS:")
print("=" * 50)
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Get sample data
print("\nSAMPLE DATA:")
print("=" * 50)
cur.execute("SELECT id, invoice_number FROM invoices LIMIT 3")
for row in cur.fetchall():
    print(f"  {row}")

conn.close()
