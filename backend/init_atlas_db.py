"""
Initialize Atlas Database Tables
================================
Reads and executes schema_atlas_advanced.sql
"""

import mysql.connector
import os

def run_schema():
    """Execute the Atlas schema SQL file"""
    
    # Read schema file
    schema_path = os.path.join(os.path.dirname(__file__), 'schema_atlas_advanced.sql')
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Split by semicolons to get individual statements
    statements = [s.strip() for s in sql_script.split(';') if s.strip()]
    
    # Connect to MySQL
    print("[Init] Connecting to MySQL...")
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',  # Empty password from db_config.py
        database='ledgerone'
    )
    
    cursor = conn.cursor()
    
    print(f"[Init] Executing {len(statements)} SQL statements...")
    
    success_count = 0
    error_count = 0
    
    for i, statement in enumerate(statements, 1):
        try:
            # Skip comments and empty lines
            if statement.startswith('--') or statement.startswith('/*') or not statement:
                continue
            
            cursor.execute(statement)
            conn.commit()
            success_count += 1
            
            # Print progress every 10 statements
            if i % 10 == 0:
                print(f"[Init] Progress: {i}/{len(statements)} statements executed")
                
        except mysql.connector.Error as err:
            # Ignore "table already exists" errors
            if 'already exists' in str(err).lower():
                print(f"[Init] Table already exists (skipping): {err}")
            else:
                print(f"[Init] Error in statement {i}: {err}")
                error_count += 1
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"[Init] ✅ Schema execution complete!")
    print(f"[Init] Total statements: {len(statements)}")
    print(f"[Init] Successful: {success_count}")
    print(f"[Init] Errors: {error_count}")
    print("=" * 60)
    
    return success_count > 0


if __name__ == "__main__":
    try:
        success = run_schema()
        if success:
            print("\n✅ Database initialized! Now run: python seed_atlas_data.py")
        else:
            print("\n❌ Schema execution failed!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
