"""
Analyze Book2.xlsx structure using Docling Layer 0
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.docling_service import read_excel_file

print("=" * 80)
print("BOOK2.XLSX ANALYSIS (Using Docling Layer 0)")
print("=" * 80)

# Read Excel using Docling
excel_path = os.path.join(os.path.dirname(__file__), '..', 'Book2.xlsx')
print(f"\n📂 Reading: {excel_path}")
print("🔧 Using Docling service...")

sheets = read_excel_file(excel_path)

if not sheets:
    print("❌ Failed to read Excel with Docling")
    sys.exit(1)

print(f"\n✅ Loaded {len(sheets)} sheet(s) via Docling\n")

# Analyze each sheet
for sheet_name, df in sheets.items():
    print("=" * 80)
    print(f"SHEET: {sheet_name}")
    print("=" * 80)
    
    print(f"\nTotal Rows: {len(df)}")
    print(f"Total Columns: {len(df.columns)}")
    
    print("\n📋 Column Names:")
    print("-" * 80)
    for i, col in enumerate(df.columns):
        print(f"  {i}: {col}")
    
    print("\n🔍 First 5 Rows (Transposed):")
    print("-" * 80)
    print(df.head(5).T.to_string())
    
    print("\n📊 DATA PATTERNS:")
    print("-" * 80)
    
    for col in df.columns:
        try:
            unique_count = df[col].nunique()
        except TypeError:
            # Handle unhashable types like lists
            unique_count = "N/A (contains lists)"
        
        null_count = df[col].isnull().sum()
        print(f"\n{col}:")
        print(f"  - Unique values: {unique_count}")
        print(f"  - Null values: {null_count}")
        
        # Show sample values for columns with few unique values
        if isinstance(unique_count, int) and unique_count < 20 and unique_count > 0:
            try:
                samples = df[col].dropna().unique()[:5].tolist()
                print(f"  - Sample values: {samples}")
            except TypeError:
                # Handle unhashable types
                samples = df[col].dropna().head(3).tolist()
                print(f"  - Sample values (first 3): {samples}")

print("\n" + "=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)

