"""
DEMO: Fuzzy Duplicate Hunter
Run this script to demonstrate the duplicate detection algorithm to customers.

Usage:
    python demo_duplicate_hunter.py

This will:
1. Insert sample invoices (including intentional duplicates)
2. Run the detection algorithm
3. Print results showing how it catches resubmitted invoices
"""

from services.db_service import get_db_connection
from services.fuzzy_duplicate_service import (
    scan_all_duplicates,
    detect_duplicates,
    calculate_shipment_dna_similarity,
    levenshtein_similarity
)
import uuid
from datetime import datetime, timedelta


def insert_demo_invoices():
    """Insert sample invoices for demo, including duplicates."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear previous demo data
    cursor.execute("DELETE FROM supplier_invoices WHERE supplier_id LIKE 'DEMO-%'")
    
    demo_invoices = [
        # LEGITIMATE INVOICES
        {
            'id': f'DEMO-{uuid.uuid4().hex[:8]}',
            'invoice_number': 'TCI-2024-0501',
            'supplier_id': 'DEMO-TCI',
            'amount': 45000.00,
            'status': 'PAID',
            'po_number': 'PO-2024-001',
            'invoice_date': '2024-12-10',
            'due_date': '2024-12-25'
        },
        {
            'id': f'DEMO-{uuid.uuid4().hex[:8]}',
            'invoice_number': 'TCI-2024-0502',
            'supplier_id': 'DEMO-TCI',
            'amount': 72000.00,
            'status': 'APPROVED',
            'po_number': 'PO-2024-002',
            'invoice_date': '2024-12-12',
            'due_date': '2024-12-27'
        },
        
        # DUPLICATE ATTEMPT 1: Slight invoice number change
        {
            'id': f'DEMO-{uuid.uuid4().hex[:8]}',
            'invoice_number': 'TCI-2024-0501/A',  # Added /A
            'supplier_id': 'DEMO-TCI',
            'amount': 45000.00,  # Same amount
            'status': 'PENDING',
            'po_number': 'PO-2024-001',
            'invoice_date': '2024-12-11',  # Next day
            'due_date': '2024-12-26'
        },
        
        # DUPLICATE ATTEMPT 2: Revised invoice
        {
            'id': f'DEMO-{uuid.uuid4().hex[:8]}',
            'invoice_number': 'TCI-2024-0501-R',  # Added -R (Revised)
            'supplier_id': 'DEMO-TCI',
            'amount': 45200.00,  # Slightly different (within 2%)
            'status': 'PENDING',
            'po_number': 'PO-2024-001',
            'invoice_date': '2024-12-12',
            'due_date': '2024-12-27'
        },
        
        # DUPLICATE ATTEMPT 3: Another vendor trying similar trick
        {
            'id': f'DEMO-{uuid.uuid4().hex[:8]}',
            'invoice_number': 'BDE-INV-1001',
            'supplier_id': 'DEMO-BLUEDART',
            'amount': 28500.00,
            'status': 'PAID',
            'po_number': 'PO-2024-010',
            'invoice_date': '2024-12-08',
            'due_date': '2024-12-23'
        },
        {
            'id': f'DEMO-{uuid.uuid4().hex[:8]}',
            'invoice_number': 'BDE/INV/1001',  # Changed format
            'supplier_id': 'DEMO-BLUEDART',
            'amount': 28500.00,
            'status': 'PENDING',
            'po_number': 'PO-2024-010',
            'invoice_date': '2024-12-09',
            'due_date': '2024-12-24'
        },
        
        # LEGITIMATE DIFFERENT INVOICE
        {
            'id': f'DEMO-{uuid.uuid4().hex[:8]}',
            'invoice_number': 'BDE-INV-2050',
            'supplier_id': 'DEMO-BLUEDART',
            'amount': 95000.00,
            'status': 'PENDING',
            'po_number': 'PO-2024-050',
            'invoice_date': '2024-12-15',
            'due_date': '2024-12-30'
        },
    ]
    
    for inv in demo_invoices:
        cursor.execute("""
            INSERT INTO supplier_invoices 
            (id, invoice_number, supplier_id, amount, status, po_number, invoice_date, due_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            inv['id'], inv['invoice_number'], inv['supplier_id'],
            inv['amount'], inv['status'], inv['po_number'],
            inv['invoice_date'], inv['due_date']
        ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Inserted {len(demo_invoices)} demo invoices")
    return demo_invoices


def run_demo():
    """Run the full demo showing duplicate detection."""
    
    print("=" * 70)
    print("  FUZZY DUPLICATE HUNTER - CUSTOMER DEMO")
    print("  Detecting Resubmitted Invoices with Shipment DNA Matching")
    print("=" * 70)
    print()
    
    # Step 1: Insert Demo Data
    print("STEP 1: Inserting Demo Invoices")
    print("-" * 50)
    demo_invoices = insert_demo_invoices()
    print()
    
    # Step 2: Show the problem
    print("STEP 2: The Problem - Why Simple Matching Fails")
    print("-" * 50)
    print("Traditional SQL query: SELECT * WHERE invoice_number = 'TCI-2024-0501'")
    print("Result: Finds only exact matches")
    print()
    print("But vendors often resubmit with slight changes:")
    print("  - 'TCI-2024-0501'   -> Original (PAID)")
    print("  - 'TCI-2024-0501/A' -> Resubmitted with /A")
    print("  - 'TCI-2024-0501-R' -> Resubmitted as 'Revised'")
    print()
    
    # Step 3: Show Levenshtein in action
    print("STEP 3: Levenshtein Distance Algorithm")
    print("-" * 50)
    test_pairs = [
        ("TCI-2024-0501", "TCI-2024-0501/A"),
        ("TCI-2024-0501", "TCI-2024-0501-R"),
        ("BDE-INV-1001", "BDE/INV/1001"),
        ("TCI-2024-0501", "TCI-2024-0999"),
    ]
    
    for s1, s2 in test_pairs:
        similarity = levenshtein_similarity(s1, s2)
        match = "POTENTIAL DUPLICATE" if similarity >= 0.80 else "Different Invoice"
        print(f"  '{s1}' vs '{s2}'")
        print(f"      Similarity: {similarity:.2%} -> {match}")
        print()
    
    # Step 4: Full Shipment DNA Analysis
    print("STEP 4: Shipment DNA Matching (Multi-Factor)")
    print("-" * 50)
    print("We analyze 5 factors with weighted scoring:")
    print("  - Invoice Number (15%): Levenshtein similarity")
    print("  - Vendor ID (20%): Exact match required")
    print("  - Amount (30%): Within 2% tolerance")
    print("  - Date (20%): Within 3 days tolerance")
    print("  - Vehicle Number (15%): Levenshtein similarity")
    print()
    
    # Step 5: Run the scan
    print("STEP 5: Scanning All Invoices for Duplicates")
    print("-" * 50)
    results = scan_all_duplicates(days=90, threshold=0.85)
    
    print(f"  Total Invoices Scanned: {results['summary']['total_invoices_scanned']}")
    print(f"  Pairs Analyzed: {results['summary']['pairs_analyzed']}")
    print(f"  Duplicates Detected: {results['summary']['duplicates_detected']}")
    print(f"  High Risk: {results['summary']['high_risk_count']}")
    print(f"  Medium Risk: {results['summary']['medium_risk_count']}")
    print(f"  Amount at Risk: Rs. {results['summary']['total_amount_at_risk']:,.2f}")
    print()
    
    # Step 6: Show detected duplicates
    if results['duplicates']:
        print("STEP 6: Detected Duplicate Pairs")
        print("-" * 50)
        for i, dup in enumerate(results['duplicates'], 1):
            print(f"\n  PAIR {i}:")
            print(f"    Invoice 1: {dup['invoice_1']['invoice_number']} (Rs. {dup['invoice_1']['amount']:,.2f})")
            print(f"    Invoice 2: {dup['invoice_2']['invoice_number']} (Rs. {dup['invoice_2']['amount']:,.2f})")
            print(f"    Similarity: {dup['similarity_analysis']['overall_similarity']:.2%}")
            print(f"    Risk Level: {'HIGH - BLOCK' if dup['similarity_analysis']['is_likely_duplicate'] else 'MEDIUM - REVIEW'}")
            
            scores = dup['similarity_analysis']['component_scores']
            print(f"    Breakdown:")
            print(f"      Invoice Number: {scores['invoice_number']:.2%}")
            print(f"      Vendor Match:   {scores['vendor_id']:.2%}")
            print(f"      Amount Match:   {scores['amount']:.2%}")
            print(f"      Date Match:     {scores['date']:.2%}")
    
    print()
    print("=" * 70)
    print("  DEMO COMPLETE")
    print("  The system caught invoice resubmission attempts that")
    print("  traditional exact-match queries would have missed.")
    print("=" * 70)
    
    return results


if __name__ == "__main__":
    run_demo()
