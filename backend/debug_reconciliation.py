
import fitz
import pandas as pd
import re
import os

pd.set_option('display.max_columns', None)

def parse_currency(text):
    if not text: return 0.0
    # Clean standard currency chars. Be careful with dates or IDs.
    cleaned = str(text).replace(',', '').replace('₹', '').replace('Rs.', '').replace('INR', '').strip()
    try:
        return float(cleaned)
    except:
        return 0.0

print(f"Analyzing files in {os.getcwd()}")

# --- EXCEL ANALYSIS ---
excel_path = "Atlas_Sample_Annexure.xlsx"
target_excel_sum = 587102.38
pdf_claimed_total = 198857.26

print(f"\n[EXCEL] Reading {excel_path}...")
try:
    df = pd.read_excel(excel_path)
    print(f"Initial Shape: {df.shape}")
    print("Columns:", df.columns.tolist())
    
    # Check first few rows
    print("\n--- First 3 Rows ---")
    print(df.head(3))
    print("--------------------\n")

    # Check for Total Row
    # Often the last row is a total.
    print("--- Last 3 Rows ---")
    print(df.tail(3))
    print("-------------------\n")

    print("[EXCEL] Calculating Column Sums to find", target_excel_sum)
    found_source = False
    
    for col in df.columns:
        # Try converting to numeric
        try:
            numeric_series = df[col].apply(parse_currency)
            col_sum = numeric_series.sum()
            
            # Check for match (tolerance 1.0)
            if abs(col_sum - target_excel_sum) < 1.0:
                print(f"✅ MATCH FOUND! Column '{col}' sums to {col_sum:,.2f} (Matches Error Value)")
                found_source = True
            elif abs(col_sum - pdf_claimed_total) < 1.0:
                print(f"⚠️ Column '{col}' sums to {pdf_claimed_total:,.2f} (Matches PDF Value)")
            elif col_sum > 0:
                print(f"   Column '{col}' sums to {col_sum:,.2f}")
                
        except Exception:
            pass
            
    if not found_source:
        print("❌ Could not find any column that sums to", target_excel_sum)
        print("This suggests the error value might come from double-counting (Rows + Total Row) or complex logic.")
        
        # Try removing last row and summing
        try:
            df_no_last = df.iloc[:-1]
            for col in df.columns:
                n_s = df_no_last[col].apply(parse_currency)
                c_s = n_s.sum()
                if abs(c_s - target_excel_sum) < 1.0:
                    print(f"✅ MATCH (excluding last row)! Column '{col}' sums to {c_s:,.2f}")
        except: pass

except Exception as e:
    print(f"Excel Error: {e}")


# --- PDF ANALYSIS ---
pdf_path = "Atlas_Sample_Invoice.pdf"
print(f"\n[PDF] Reading {pdf_path}...")
try:
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    
    print(f"PDF extracted {len(full_text)} characters.")
    
    # Check for the values
    print("\n--- Searching for Key Values in text ---")
    
    vals_to_find = [
        ("198,857", "App PDF Total"), 
        ("587,102", "Error Excel Value"),
        ("Total", "Keyword"),
        ("Amount", "Keyword")
    ]
    
    lines = full_text.split('\n')
    
    for val, label in vals_to_find:
        print(f"\nSearching for '{val}' ({label}):")
        found = False
        val_clean = val.replace(',', '').replace('₹', '')
        
        for i, line in enumerate(lines):
            line_clean = line.replace(',', '').replace('₹', '')
            if val_clean in line_clean:
                print(f"  ✅ FOUND at Line {i}: {line.strip()}")
                found = True
                # Print context
                if label != "Keyword": # Only for numbers
                    print(f"     Context: {lines[max(0, i-1)].strip()} | {lines[min(len(lines)-1, i+1)].strip()}")
        
        if not found:
            print(f"  ❌ NOT FOUND")

except Exception as e:
    print(f"PDF Error: {e}")
