
import os

files_to_scan = [
    'atlas_api_routes.py',
    'services/atlas_bulk_service.py',
    'services/advanced_ocr_engine.py'
]

def scan_files():
    for fname in files_to_scan:
        if not os.path.exists(fname):
            continue
            
        print(f"Scanning {fname}...")
        with open(fname, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                if '+' in line:
                    # Ignore safe f-strings or obvious matches
                    if 'def ' in line or 'class ' in line: continue
                    if 'import ' in line: continue
                    print(f"{fname}:{i+1}: {line.strip()}")

if __name__ == "__main__":
    scan_files()
