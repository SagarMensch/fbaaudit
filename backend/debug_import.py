
import os
import sys
import pandas as pd
import logging
from services.postgres_helper import get_postgres_connection

# Configure logging
logging.basicConfig(level=logging.INFO)

def debug_import():
    print("DEBUG: Starting import process...")
    
    # 1. Connect to DB
    print("DEBUG: Connecting to DB...")
    conn = get_postgres_connection()
    if not conn:
        print("DEBUG: Failed to connect.")
        return
    print("DEBUG: Connected to DB.")
    
    # 2. Hardcode path for test
    excel_path = os.path.join(os.path.dirname(__file__), '..', 'Book2.xlsx')
    print(f"DEBUG: Reading Excel: {excel_path}")
    
    # 3. Read specific sheet using pandas directly (bypass Docling for speed check if possible, 
    # but we want to test Docling to be sure)
    # Actually, let's mistakenly bypass Docling to see if that's the issue?
    # No, user wants to use Docling output.
    # But for debugging "IMPORT logic", I can use pandas first?
    # Let's stick to the main script logic: use Docling service.
    
    from services.docling_service import read_excel_file
    sheets = read_excel_file(excel_path)
    
    if not sheets:
        print("DEBUG: Docling returned no sheets.")
        return
        
    print(f"DEBUG: Sheets: {list(sheets.keys())}")
    df = list(sheets.values())[0]
    print(f"DEBUG: Full DF shape: {df.shape}")
    
    # LIMIT TO 5 ROWS
    df = df.head(5)
    print("DEBUG: Sliced DF to top 5 rows.")
    
    cur = conn.cursor()
    
    # Iterate
    for i, row in df.iterrows():
        print(f"DEBUG: Processing Row {i}")
        try:
            contract_num = str(row.get('Contract #', ''))
            print(f"   Contract: {contract_num}")
            
            # Simulate DB op
            cur.execute("SELECT 1")
            print("   DB Check OK")
            
            # Try Mapping
            serv_type = row.get('Serv. Type', 'FTL')
            print(f"   Serv Type: {serv_type}")
            
            # Print Rates
            r20 = row.get('20S')
            r45 = row.get('45S')
            print(f"   Rates: {r20}, {r45}")
            
        except Exception as e:
            print(f"DEBUG: Error on row {i}: {e}")
            import traceback
            traceback.print_exc()
            
    print("DEBUG: Loop finished.")
    conn.close()

if __name__ == '__main__':
    debug_import()
