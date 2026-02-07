"""Get inserted contract service_type"""
import sys
sys.path.insert(0, '.')
from services.postgres_helper import get_postgres_connection

conn = get_postgres_connection()
cur = conn.cursor()

cur.execute("SELECT service_type FROM contracts WHERE contract_number='GB01/0010'")
row = cur.fetchone()
if row:
    print(f"INSERTED_VALUE: {row[0]}")
else:
    print("No contract found")
    
conn.close()
