"""
Database Verification Script
Check PostgreSQL connection and existing tables/data
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def check_database():
    """Verify database connection and structure"""
    
    print("=" * 80)
    print("DATABASE VERIFICATION REPORT")
    print("=" * 80)
    
    # 1. Check environment variables
    print("\n1. ENVIRONMENT CONFIGURATION:")
    print("-" * 80)
    db_url = os.getenv('DATABASE_URL')
    supabase_url = os.getenv('SUPABASE_URL')
    
    if db_url:
        # Hide password for security
        safe_url = db_url.split('@')[1] if '@' in db_url else db_url
        print(f"   DATABASE_URL: ...@{safe_url}")
    else:
        print("   DATABASE_URL: NOT SET")
    
    if supabase_url:
        print(f"   SUPABASE_URL: {supabase_url}")
    else:
        print("   SUPABASE_URL: NOT SET")
    
    # 2. Try to connect
    print("\n2. DATABASE CONNECTION TEST:")
    print("-" * 80)
    
    try:
        from services.postgres_helper import get_postgres_connection
        import psycopg2.extras
        
        conn = get_postgres_connection()
        if not conn:
            print("   ❌ CONNECTION FAILED: get_postgres_connection() returned None")
            return
        
        print("   ✅ CONNECTION SUCCESSFUL")
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 3. List all tables
        print("\n3. EXISTING TABLES:")
        print("-" * 80)
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        if tables:
            for table in tables:
                print(f"   ✓ {table['table_name']}")
        else:
            print("   ⚠️  NO TABLES FOUND")
        
        # 4. Check key tables and row counts
        print("\n4. TABLE ROW COUNTS:")
        print("-" * 80)
        
        key_tables = ['vendors', 'locations', 'contracts', 'freight_rates', 'invoices', 
                      'shipments', 'users', 'rate_cards', 'payment_batches']
        
        for table in key_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                result = cursor.fetchone()
                count = result['count'] if result else 0
                status = "✅" if count > 0 else "⚠️ "
                print(f"   {status} {table}: {count} rows")
            except Exception as e:
                print(f"   ❌ {table}: Table not found or error - {str(e)[:50]}")
        
        # 5. Sample data from vendors
        print("\n5. SAMPLE DATA - VENDORS:")
        print("-" * 80)
        try:
            cursor.execute("SELECT id, name, type, is_active FROM vendors LIMIT 5")
            vendors = cursor.fetchall()
            if vendors:
                for v in vendors:
                    print(f"   {v['id']}: {v['name']} ({v['type']}) - Active: {v['is_active']}")
            else:
                print("   ⚠️  No vendor data found")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # 6. Sample data from invoices
        print("\n6. SAMPLE DATA - INVOICES:")
        print("-" * 80)
        try:
            cursor.execute("""
                SELECT id, invoice_number, vendor_name, total_amount, status 
                FROM invoices 
                ORDER BY created_at DESC 
                LIMIT 5
            """)
            invoices = cursor.fetchall()
            if invoices:
                for inv in invoices:
                    print(f"   {inv['invoice_number']}: {inv['vendor_name']} - ₹{inv['total_amount']} ({inv['status']})")
            else:
                print("   ⚠️  No invoice data found")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # 7. Check schema for invoices table
        print("\n7. INVOICES TABLE SCHEMA:")
        print("-" * 80)
        try:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'invoices'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            if columns:
                for col in columns[:15]:  # Show first 15 columns
                    nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                    print(f"   {col['column_name']:<25} {col['data_type']:<20} {nullable}")
                if len(columns) > 15:
                    print(f"   ... and {len(columns) - 15} more columns")
            else:
                print("   ⚠️  No schema found")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 80)
        print("DATABASE VERIFICATION COMPLETE")
        print("=" * 80)
        
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database()
