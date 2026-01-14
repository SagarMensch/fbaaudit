"""
Generate Test Excel File for Bulk Upload Testing
Creates a realistic, messy Excel file with LR line items
"""

import pandas as pd
import random
from datetime import datetime, timedelta

# Create complex Excel with realistic data challenges
data = {
    # Inconsistent column naming (with extra spaces, different cases)
    'Docket No ': [],  # Extra space at end
    'LR Date': [],
    '  Origin  ': [],  # Spaces on both sides
    'destination': [],  # Lowercase
    'Vehicle No.': [],
    'Weight (Kg)': [],
    'Freight Charges': [],  # Different from expected 'Base Freight'
    'Fuel Surcharge ': [],
    'Hamali ': [],  # Regional name for handling
    'Total Amt': []
}

# Sample data
origins = ['Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad']
destinations = ['Pune', 'Mumbai', 'Bangalore', 'Delhi', 'Kolkata', 'Chennai']
carriers = ['MH12AB1234', 'KA05CD5678', 'DL8EF9012', 'TN09GH3456']

# Generate 55 LR entries with various edge cases
for i in range(1, 56):
    lr_num = f"LR{random.randint(100000, 999999)}"
    
    # Add some duplicate LRs (to test duplicate detection)
    if i in [15, 30, 45]:
        lr_num = "LR123456"  # Intentional duplicate
    
    # Generate date
    lr_date = (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%d-%m-%Y')
    
    # Some entries with extra spaces
    origin = random.choice(origins)
    dest = random.choice(destinations)
    if i % 7 == 0:
        origin = f"  {origin} "  # Extra spaces
        dest = f" {dest}  "
    
    vehicle = random.choice(carriers)
    weight = random.randint(500, 5000)
    
    # Base freight calculation (with variations)
    distance = 500 + random.randint(-200, 800)
    base_freight = (distance * 15) + (weight * 0.5)
    
    # Some cells with comma formatting
    if i % 5 == 0:
        base_freight_str = f"₹ {base_freight:,.2f}"  # Indian rupee symbol
    elif i % 3 == 0:
        base_freight_str = f"{base_freight:,.2f}"  # Comma thousands separator
    else:
        base_freight_str = str(round(base_freight, 2))
    
    fuel = base_freight * 0.05  # 5% fuel surcharge
    handling = 250 if weight > 1000 else 150
    total = base_freight + fuel + handling
    
    data['Docket No '].append(lr_num)
    data['LR Date'].append(lr_date)
    data['  Origin  '].append(origin)
    data['destination'].append(dest)
    data['Vehicle No.'].append(vehicle)
    data['Weight (Kg)'].append(weight)
    data['Freight Charges'].append(base_freight_str)
    data['Fuel Surcharge '].append(round(fuel, 2))
    data['Hamali '].append(handling)
    data['Total Amt'].append(round(total, 2))

# Create DataFrame
df = pd.DataFrame(data)

# Add some empty rows (common in real Excel files)
empty_row = pd.DataFrame([['' for _ in range(len(df.columns))]], columns=df.columns)
df = pd.concat([df.iloc[:20], empty_row, df.iloc[20:40], empty_row, df.iloc[40:]], ignore_index=True)

# Calculate grand total
grand_total = df['Total Amt'].replace('', 0).astype(float).sum()

# Add summary row at bottom
summary_row = pd.DataFrame({
    'Docket No ': ['TOTAL'],
    'LR Date': [''],
    '  Origin  ': [''],
    'destination': [''],
    'Vehicle No.': [''],
    'Weight (Kg)': [df['Weight (Kg)'].replace('', 0).astype(float).sum()],
    'Freight Charges': [''],
    'Fuel Surcharge ': [''],
    'Hamali ': [''],
    'Total Amt': [grand_total]
})

df = pd.concat([df, summary_row], ignore_index=True)

# Save to Excel
output_path = 'test_annexure_complex.xlsx'
df.to_excel(output_path, index=False, sheet_name='LR Details')

print(f"✅ Created complex Excel file: {output_path}")
print(f"   - {len(df)-3} LR entries (including duplicates)")
print(f"   - Grand Total: ₹{grand_total:,.2f}")
print(f"   - Challenges included:")
print(f"     • Inconsistent column names")
print(f"     • Extra spaces in data")
print(f"     • Duplicate LRs")
print(f"     • Varied number formats")
print(f"     • Empty rows")
print(f"     • Regional terminology (Hamali)")
