
import sys
import os
import json
sys.path.insert(0, '.')
from services.docling_service import read_excel_file

sheets = read_excel_file(os.path.join('..', 'Book2.xlsx'))
if not sheets:
    print("No sheets found")
    sys.exit(1)

df = sheets['Sheet1']
cols = list(df.columns)
sample = df.iloc[0:2].to_dict(orient='records')

output = {
    'columns': cols,
    'sample': sample,
    'row_count': len(df)
}

with open('cols.json', 'w') as f:
    json.dump(output, f, indent=2, default=str)

print("Done")
