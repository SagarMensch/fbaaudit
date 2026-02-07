"""
Import Master Data from Book2.xlsx to PostgreSQL (V7 - Robust)
Hitachi Energy Freight Audit Platform
Uses Docling as Layer 0 for document processing
"""
import os
import sys
import pandas as pd
from dotenv import load_dotenv
from services.postgres_helper import get_postgres_connection
from services.docling_service import read_excel_file
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def import_master_data():
    """Import freight rate data from Book2.xlsx into PostgreSQL using Docling"""
    
    print("=" * 80)
    print("MASTER DATA IMPORT - Hitachi Energy")
    print("=" * 80)
    sys.stdout.flush()
    
    # Read Excel file using Docling Layer 0
    excel_path = os.path.join(os.path.dirname(__file__), '..', 'Book2.xlsx')
    
    # Use Docling service to read Excel
    sheets = read_excel_file(excel_path)
    
    if not sheets:
        print("Failed to read Excel file with Docling")
        return
    
    print(f"Loaded {len(sheets)} sheet(s) from Excel using Docling")
    sys.stdout.flush()
    
    # Get PostgreSQL connection
    conn = get_postgres_connection()
    if not conn:
        print("Failed to connect to PostgreSQL")
        return
    
    cursor = conn.cursor()
    
    try:
        print("\nStarting data import...")
        sys.stdout.flush()
        
        import uuid
        
        # Track counts
        stats = {
            "vendors": 0,
            "locations": 0,
            "contracts": 0,
            "rates": 0
        }
        
        # Cache to avoid repeated DB lookups
        vendor_cache = {}
        location_cache = {} 
        contract_cache = {}
        
        sheet_name = 'Sheet1'
        if sheet_name not in sheets:
            sheet_name = list(sheets.keys())[0]
            
        df = sheets[sheet_name]
        
        # Pre-load existing data
        cursor.execute("SELECT name, id FROM vendors")
        for row in cursor.fetchall():
            vendor_cache[row[0].strip().upper()] = row[1]
            
        cursor.execute("SELECT code, id FROM locations")
        for row in cursor.fetchall():
            location_cache[row[0].strip().upper()] = row[1]
            
        cursor.execute("SELECT contract_number, id FROM contracts")
        for row in cursor.fetchall():
            contract_cache[row[0].strip().upper()] = row[1]
            
        print(f"Pre-loaded cache: {len(vendor_cache)} vendors, {len(location_cache)} locations, {len(contract_cache)} contracts")
        sys.stdout.flush()
        
        for index, row in df.iterrows():
            
            # 1. PROCESS VENDOR
            carrier_name = str(row.get('Carrier', '')).strip()
            if not carrier_name or carrier_name.lower() == 'nan':
                continue
                
            vendor_id = vendor_cache.get(carrier_name.upper())
            
            if not vendor_id:
                try:
                    cursor.execute("SAVEPOINT vendor_insert")
                    vendor_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO vendors (id, name, type, is_active, created_at, updated_at)
                        VALUES (%s, %s, 'TRANSPORTER', TRUE, NOW(), NOW())
                        ON CONFLICT (id) DO NOTHING
                    """, (vendor_id, carrier_name))
                    cursor.execute("RELEASE SAVEPOINT vendor_insert")
                    vendor_cache[carrier_name.upper()] = vendor_id
                    stats["vendors"] += 1
                except Exception as e:
                    cursor.execute("ROLLBACK TO SAVEPOINT vendor_insert")
                    # Try to fetch again if insert failed (maybe constraint violation?)
                    cursor.execute("SELECT id FROM vendors WHERE name = %s", (carrier_name,))
                    res = cursor.fetchone()
                    if res:
                        vendor_id = res[0]
                        vendor_cache[carrier_name.upper()] = vendor_id
                
            # 2. PROCESS ORIGIN
            origin_city = str(row.get('From City', '')).strip()
            origin_code = str(row.get('From City Code', '')).strip()
            
            loc_code = origin_code if origin_code and origin_code.lower() != 'nan' else origin_city
            if not loc_code or loc_code.lower() == 'nan':
                loc_code = f"LOC-{uuid.uuid4().hex[:8]}"
            
            origin_key = loc_code.upper()
            origin_id = location_cache.get(origin_key)
            
            if not origin_id:
                # Need origin info
                origin_state = str(row.get('F ST', '')).strip()
                origin_country = str(row.get('F CNTY', '')).strip()
                try:
                    cursor.execute("SAVEPOINT origin_insert")
                    origin_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO locations (id, code, name, city, state, country, type, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s, 'PORT', TRUE)
                        ON CONFLICT (code) DO NOTHING
                    """, (origin_id, loc_code, origin_city, origin_city, origin_state, origin_country))
                    cursor.execute("RELEASE SAVEPOINT origin_insert")
                    location_cache[origin_key] = origin_id
                    stats["locations"] += 1
                except Exception as e:
                    cursor.execute("ROLLBACK TO SAVEPOINT origin_insert")
                    cursor.execute("SELECT id FROM locations WHERE code = %s", (loc_code,))
                    res = cursor.fetchone()
                    if res:
                        origin_id = res[0]
                        location_cache[origin_key] = origin_id

            # 3. PROCESS DESTINATION
            dest_city = str(row.get('To City', '')).strip()
            dest_state = str(row.get('To ST', '')).strip()
            dest_country = str(row.get('To CNTY', '')).strip()
            
            dest_code = f"{dest_city[:3].upper()}-{dest_country}"
            dest_key = dest_code.upper()
            dest_id = location_cache.get(dest_key)
            
            if not dest_id:
                try:
                    cursor.execute("SAVEPOINT dest_insert")
                    dest_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO locations (id, code, name, city, state, country, type, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s, 'PORT', TRUE)
                        ON CONFLICT (code) DO NOTHING
                    """, (dest_id, dest_code, dest_city, dest_city, dest_state, dest_country))
                    cursor.execute("RELEASE SAVEPOINT dest_insert")
                    location_cache[dest_key] = dest_id
                    stats["locations"] += 1
                except Exception as e:
                    cursor.execute("ROLLBACK TO SAVEPOINT dest_insert")
                    cursor.execute("SELECT id FROM locations WHERE code = %s", (dest_code,))
                    res = cursor.fetchone()
                    if res:
                        dest_id = res[0]
                        location_cache[dest_key] = dest_id

            # 4. PROCESS CONTRACT
            contract_num = str(row.get('Contract #', '')).strip()
            valid_from = row.get('Eff. From Date')
            valid_to = row.get('Eff. To Date')
            
            if pd.isna(valid_from): valid_from = '2024-01-01'
            if pd.isna(valid_to): valid_to = '2025-12-31'
            
            contract_key = contract_num.upper()
            contract_id = contract_cache.get(contract_key)
            
            if not contract_id and contract_num and contract_num.lower() != 'nan':
                try:
                    cursor.execute("SAVEPOINT contract_insert")
                    contract_id = str(uuid.uuid4())
                    
                    # Use actual Service Type from Excel
                    service_type_val = row.get('Serv. Type')
                    if pd.isna(service_type_val):
                        service_type_val = 'FTL'
                    else:
                        service_type_val = str(service_type_val).strip()
                    
                    cursor.execute("""
                        INSERT INTO contracts (id, contract_number, vendor_id, vendor_name, service_type, valid_from, valid_to, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE')
                        ON CONFLICT (id) DO NOTHING
                    """, (contract_id, contract_num, vendor_id, carrier_name, service_type_val, valid_from, valid_to))
                    cursor.execute("RELEASE SAVEPOINT contract_insert")
                    contract_cache[contract_num.upper()] = contract_id
                    stats["contracts"] += 1
                except Exception as e:
                    cursor.execute("ROLLBACK TO SAVEPOINT contract_insert")
                    print(f"Contract insert failed for {contract_num}: {e}")

            # 5. PROCESS RATES
            if contract_id:
                # 20S
                rate_20s = row.get('20S')
                if pd.notna(rate_20s) and str(rate_20s).strip():
                    try:
                        cursor.execute("SAVEPOINT rate_insert")
                        amount = float(str(rate_20s).replace(',', ''))
                        rate_id = str(uuid.uuid4())
                        cursor.execute("""
                            INSERT INTO freight_rates 
                            (id, contract_id, origin, destination, vehicle_type, rate_basis, base_rate, is_active)
                            VALUES (%s, %s, %s, %s, '20FT Container', 'Per Trip', %s, TRUE)
                        """, (rate_id, contract_id, origin_city, dest_city, amount))
                        cursor.execute("RELEASE SAVEPOINT rate_insert")
                        stats["rates"] += 1
                    except Exception:
                        cursor.execute("ROLLBACK TO SAVEPOINT rate_insert")
                
                # 45S
                rate_45s = row.get('45S')
                if pd.notna(rate_45s) and str(rate_45s).strip():
                    try:
                        cursor.execute("SAVEPOINT rate_insert_2")
                        amount = float(str(rate_45s).replace(',', ''))
                        rate_id = str(uuid.uuid4())
                        cursor.execute("""
                            INSERT INTO freight_rates 
                            (id, contract_id, origin, destination, vehicle_type, rate_basis, base_rate, is_active)
                            VALUES (%s, %s, %s, %s, '45FT Container', 'Per Trip', %s, TRUE)
                        """, (rate_id, contract_id, origin_city, dest_city, amount))
                        cursor.execute("RELEASE SAVEPOINT rate_insert_2")
                        stats["rates"] += 1
                    except Exception:
                        cursor.execute("ROLLBACK TO SAVEPOINT rate_insert_2")
            
            # BATCH COMMIT LOGGING
            if index % 10 == 0:
                print(f"Row {index} processed. Stats: C={stats['contracts']}, R={stats['rates']}")
                conn.commit()
                sys.stdout.flush()
                
        conn.commit()
        print("\nMaster data import process completed successfully!")
        print(f"Total Rates: {stats['rates']}")
        sys.stdout.flush()
        
    except Exception as e:
        print(f"\nError importing data: {e}")
        conn.rollback()
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import_master_data()
