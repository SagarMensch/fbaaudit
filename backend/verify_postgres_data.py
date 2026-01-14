
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

def verify():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        tables = ['vendors', 'contracts', 'freight_rates', 'users', 'fuel_prices']
        print("🔍 POSTGRESQL VERIFICATION REPORT")
        print("=================================")
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"✅ {table}: {count} rows")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify()
