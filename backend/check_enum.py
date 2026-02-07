"""Force invalid enum error to see allowed values"""
import sys
sys.path.insert(0, '.')
from services.postgres_helper import get_postgres_connection

conn = get_postgres_connection()
cur = conn.cursor()

try:
    print("Trying to cast 'INVALID_VALUE' to service_type...")
    cur.execute("SELECT 'INVALID_VALUE'::service_type")
except Exception as e:
    print(f"\nCaught expected error:")
    print(str(e))
    
conn.close()
