"""Check tables and seed data"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Check tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
tables = cur.fetchall()
print("Tables in database:")
for t in tables:
    print(f"  - {t[0]}")

# Check columns in vendors
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendors' ORDER BY ordinal_position")
cols = cur.fetchall()
print("\nVendors table columns:")
for c in cols:
    print(f"  - {c[0]}")

cur.close()
conn.close()
