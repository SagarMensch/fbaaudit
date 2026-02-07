import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv('DATABASE_URL')

conn = psycopg2.connect(url)
cur = conn.cursor()

# List all tables and counts
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
""")
tables = [t[0] for t in cur.fetchall()]

print("=" * 50)
print("📊 SUPABASE DATABASE SUMMARY")
print("=" * 50)
print(f"Total tables: {len(tables)}")
print("-" * 50)
print(f"{'Table Name':<30} | {'Rows':>10}")
print("-" * 50)

total_rows = 0
for t in tables:
    try:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        count = cur.fetchone()[0]
        print(f"{t:<30} | {count:>10}")
        total_rows += count
    except Exception as e:
        print(f"{t:<30} | {'ERROR':>10}")

print("-" * 50)
print(f"{'TOTAL':<30} | {total_rows:>10}")
print("=" * 50)

cur.close()
conn.close()
