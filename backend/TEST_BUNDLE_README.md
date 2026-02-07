# Bulk Upload Test Bundle - Instructions

## 📦 Test Files Included

### 1. `test_invoice_consolidated.pdf`
**Consolidated Freight Invoice**
- **Vendor**: VRL Logistics Limited
- **Invoice Number**: VRL/CONS/2026/01/1847
- **Invoice Date**: January 4, 2026
- **Subtotal**: ₹1,518,843.16
- **Tax (CGST 9% + SGST 9%)**: ₹273,631.77
- **Grand Total**: ₹1,792,474.93
- **LR Count**: 55 consignments

### 2. `test_annexure_complex.xlsx`
**LR-Level Annexure (55 entries with test edge cases)**

**Features/Challenges**:
- ✓ Inconsistent column naming ("Docket No ", "  Origin  ", "destination")
- ✓ Extra spaces in data values
- ✓ **3 Duplicate LRs** (LR123456 appears 3 times - rows 15, 30, 45)
- ✓ Mixed number formats (₹ symbol, commas, plain numbers)
- ✓ Empty rows between sections
- ✓ Regional terminology ("Hamali" instead of "Handling Charges")
- ✓ Varied date formats

## 🧪 Testing Workflow

### Step 1: Navigate to Bulk Upload
1. Login as supplier
2. Click **"Bulk Invoice Upload"** in sidebar
3. Verify wizard loads with 3 steps

### Step 2: Upload Files
1. Upload `test_invoice_consolidated.pdf` as PDF
2. Upload `test_annexure_complex.xlsx` as Excel
3. Click **"Upload & Process"**

### Step 3: Verify Column Auto-Detection
**Expected Mapping**:
- "Docket No " → `lr_number`
- "  Origin  " → `origin`
- "destination" → `destination`
- "Freight Charges" → `base_freight`
- "Fuel Surcharge " → `fuel_surcharge`
- "Hamali " → `handling_charges`

### Step 4: Check Reconciliation
**Expected Results**:
- Excel Total: ₹1,518,843.16 (from SUM of Total Amt column)
- PDF Total: ₹1,518,843.16 (from invoice subtotal)
- **Should PASS** (difference < ₹10)

### Step 5: Review Results
**Expected Summary**:
- Total Rows: 55
- Valid Rows: 52
- **Duplicate Rows: 3** (LR123456 flagged 3 times)
- Error Rows: 0

### Step 6: Verify Database Storage
Check Supabase tables:
- `supplier_invoices` - New invoice added
- `invoice_line_items` - 55 LR entries inserted
- `annexure_uploads` - Excel metadata recorded

### Step 7: Check Freight Audit
1. Navigate to Freight Audit workbench
2. Search for invoice "VRL/CONS/2026/01/1847"
3. Verify displays with 55 line items
4. Click three-dot menu → View Details
5. Check flagged duplicates visible

## 🎯 What This Tests

### ✅ Column Mapping Intelligence
- Handles extra spaces
- Case-insensitive matching  
- Maps regional terms (Hamali → handling_charges)
- Fuzzy matching on column names

### ✅ Data Cleaning
- Strips extra spaces from values
- Parses various number formats (₹, commas)
- Handles empty rows gracefully
- Ignores summary rows

### ✅ Duplicate Detection
- Identifies repeat LR numbers across rows
- Flags for audit review
- Links to previous payment (if exists)

### ✅ Reconciliation Logic
- Calculates Excel grand total accurately
- Compares with PDF total
- Provides clear pass/fail with difference amount

### ✅ Database Integration
- Bulk inserts 55 line items efficiently
- Stores column mapping for vendor
- Tracks annexure upload metadata
- Makes data available in Freight Audit

## 🔍 Expected Issues (By Design)

1. **Duplicate LRs**: 3 flagged (LR123456)
2. **Column name variations**: Successfully mapped despite inconsistencies
3. **Data format variations**: Cleaned and normalized
4. **Empty rows**: Ignored without errors

## 📊 Success Criteria

- [ ] All files upload successfully
- [ ] Column mapping auto-detects correctly
- [ ] Reconciliation passes (matched totals)
- [ ] 3 duplicates flagged
- [ ] 55 line items inserted into PostgreSQL
- [ ] Invoice appears in Freight Audit
- [ ] View Details shows all LRs
- [ ] Duplicate flag visible in audit view

---

**Note**: These test files contain intentional edge cases to validate the robustness of the bulk upload system. Real-world vendor data often has similar formatting inconsistencies.

**Location**: `c:\Users\sagar\Downloads\newown - Copy\backend\`
- `test_invoice_consolidated.pdf`
- `test_annexure_complex.xlsx`
- `TEST_BUNDLE_README.md` (this file)
