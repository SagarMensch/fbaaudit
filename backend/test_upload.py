"""Quick upload test"""
from supabase import create_client
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')

print(f"Connecting to: {url}")
client = create_client(url, key)

# Upload all demo invoices
demo_invoices = [
    ('DEMO_2024_PERFECT', 'invoice_DEMO_2024_PERFECT.pdf'),
    ('GPT_24-25_1145', 'invoice_GPT_24-25_1145.pdf'),
    ('TCI_2024_002', 'invoice_TCI_2024_002.pdf'),
    ('VRL_2024_778', 'invoice_VRL_2024_778.pdf'),
]

for folder, filename in demo_invoices:
    pdf_path = Path(f'demo_invoices/{filename}')
    with open(pdf_path, 'rb') as f:
        data = f.read()
    
    storage_path = f'{folder}/invoice.pdf'
    try:
        res = client.storage.from_('invoices').upload(storage_path, data, {'content-type': 'application/pdf'})
        print(f'OK: {storage_path}')
    except Exception as e:
        err = str(e)
        if 'Duplicate' in err or 'already exists' in err.lower():
            print(f'EXISTS: {storage_path}')
        else:
            print(f'FAIL: {storage_path} - {err[:100]}')

# List files
print("\nListing bucket contents...")
files = client.storage.from_('invoices').list()
print(f'Found {len(files)} items in bucket')
for f in files:
    name = f.get('name') if isinstance(f, dict) else str(f)
    print(f'  - {name}')
