"""Simple seeder - step by step"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Check vendors columns
print("Checking vendors table columns...")
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vendors' ORDER BY ordinal_position")
cols = cur.fetchall()
for c in cols:
    print(f"  {c[0]}: {c[1]}")

print("\nInserting a test vendor...")
try:
    cur.execute("""
        INSERT INTO vendors (id, name, code, vendor_type, gst_number, city, state, performance_score, status)
        VALUES ('TEST001', 'Test Vendor', 'TEST', 'CARRIER', 'GST123', 'Mumbai', 'Maharashtra', 90, 'ACTIVE')
        ON CONFLICT (id) DO NOTHING
    """)
    conn.commit()
    print("✅ Vendor inserted successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()

print("\nCounting records...")
cur.execute("SELECT COUNT(*) FROM vendors")
print(f"Vendors: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM invoices")
print(f"Invoices: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM rate_cards")
print(f"Rate Cards: {cur.fetchone()[0]}")

cur.close()
conn.close()
