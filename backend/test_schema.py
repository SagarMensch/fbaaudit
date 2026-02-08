"""Check what columns exist in contracts table"""
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    ORDER BY ordinal_position
""")
print("Contracts table columns:")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]} (null: {row[2]})")

cur.close()
conn.close()
