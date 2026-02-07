import psycopg2
import os
from dotenv import load_dotenv

# Load args from .env
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
SCHEMA_FILE = 'schema_postgres.sql'

def migrate_database():
    if not DATABASE_URL or 'YOUR_PROJECT' in DATABASE_URL:
        print("❌ Error: DATABASE_URL is not set correctly in .env")
        print("👉 Please update backend/.env with your Supabase Connection URI.")
        return

    print(f"🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print(f"📖 Reading schema file: {SCHEMA_FILE}...")
        with open(SCHEMA_FILE, 'r') as f:
            schema_sql = f.read()
            
        print(f"🚀 Executing schema migration...")
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ Migration successful! All tables created.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == '__main__':
    migrate_database()
