import sys
import os
import psycopg2
from services.postgres_helper import get_postgres_connection

def add_enum_values():
    conn = get_postgres_connection()
    if not conn:
        print("Failed to connect to DB")
        return

    # Autocommit is required for ALTER TYPE
    conn.set_session(autocommit=True)
    cur = conn.cursor()

    # 1. Identify the enum type name for 'FCL' (known existing value)
    print("Identifying ENUM type name...")
    cur.execute("""
        SELECT t.typname 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE e.enumlabel = 'FCL'
    """)
    res = cur.fetchone()
    if not res:
        print("❌ Could not find ENUM type containing 'FCL'. Please check if FCL exists.")
        # Fallback: check if 'FTL' exists
        cur.execute("""
            SELECT t.typname 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE e.enumlabel = 'FTL'
        """)
        res = cur.fetchone()
    
    if not res:
        print("❌ Could not find ENUM type containing 'FCL' or 'FTL'. Aborting.")
        return

    enum_name = res[0]
    print(f"✅ Found ENUM type name: {enum_name}")

    # 2. List current values
    cur.execute(f"SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '{enum_name}')")
    current_values = [r[0] for r in cur.fetchall()]
    print(f"Current values: {current_values}")

    # 3. Add new values
    new_values = ['DP', 'DD', 'PP', 'PD', 'RP', 'RD', 'PR', 'DR']
    
    for val in new_values:
        if val in current_values:
            print(f"Skipping {val} (already exists)")
        else:
            print(f"Adding value: {val}")
            try:
                # IMPORTANT: ALTER TYPE cannot run in a transaction block usually, requires autocommit (set above)
                cur.execute(f"ALTER TYPE {enum_name} ADD VALUE '{val}'")
                print(f"✅ Added {val}")
            except psycopg2.errors.DuplicateObject:
                print(f"⚠️ {val} already exists (caught error)")
            except Exception as e:
                print(f"❌ Failed to add {val}: {e}")

    conn.close()
    print("Done.")

if __name__ == "__main__":
    add_enum_values()
