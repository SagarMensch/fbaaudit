"""
Fuzzy Duplicate Hunter Service
Detects duplicate invoices using Levenshtein Distance and Jaccard Similarity.

Based on "Shipment DNA" matching:
- Vendor ID
- Amount (within tolerance)
- Date (within tolerance)
- Vehicle Number

Logic: If Similarity > 0.95 AND Invoice_ID is different -> FLAG as Potential Duplicate
"""

from services.db_service import get_db_connection
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import json


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Calculate the Levenshtein (edit) distance between two strings.
    Returns the minimum number of single-character edits needed to transform s1 into s2.
    """
    if not s1:
        return len(s2) if s2 else 0
    if not s2:
        return len(s1)
    
    # Normalize strings
    s1 = str(s1).upper().strip()
    s2 = str(s2).upper().strip()
    
    # Create distance matrix
    rows = len(s1) + 1
    cols = len(s2) + 1
    
    # Initialize matrix
    dist = [[0 for _ in range(cols)] for _ in range(rows)]
    
    for i in range(rows):
        dist[i][0] = i
    for j in range(cols):
        dist[0][j] = j
    
    # Fill matrix
    for i in range(1, rows):
        for j in range(1, cols):
            if s1[i-1] == s2[j-1]:
                cost = 0
            else:
                cost = 1
            
            dist[i][j] = min(
                dist[i-1][j] + 1,      # Deletion
                dist[i][j-1] + 1,      # Insertion
                dist[i-1][j-1] + cost  # Substitution
            )
    
    return dist[rows-1][cols-1]


def levenshtein_similarity(s1: str, s2: str) -> float:
    """
    Calculate similarity score (0 to 1) based on Levenshtein distance.
    1.0 = identical, 0.0 = completely different
    """
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    
    max_len = max(len(str(s1)), len(str(s2)))
    if max_len == 0:
        return 1.0
    
    distance = levenshtein_distance(s1, s2)
    return 1.0 - (distance / max_len)


def jaccard_similarity(set1: set, set2: set) -> float:
    """
    Calculate Jaccard similarity coefficient between two sets.
    J(A, B) = |A intersection B| / |A union B|
    Returns value between 0 and 1.
    """
    if not set1 and not set2:
        return 1.0
    if not set1 or not set2:
        return 0.0
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    if union == 0:
        return 0.0
    
    return intersection / union


def tokenize(text: str) -> set:
    """Convert text to set of tokens for Jaccard comparison."""
    if not text:
        return set()
    return set(str(text).upper().strip().split())


def amount_similarity(amount1: float, amount2: float, tolerance_percent: float = 2.0) -> float:
    """
    Calculate amount similarity with tolerance.
    Returns 1.0 if amounts are within tolerance, scales down otherwise.
    """
    if amount1 == 0 and amount2 == 0:
        return 1.0
    if amount1 == 0 or amount2 == 0:
        return 0.0
    
    diff = abs(amount1 - amount2)
    avg = (amount1 + amount2) / 2
    percent_diff = (diff / avg) * 100
    
    if percent_diff <= tolerance_percent:
        return 1.0
    elif percent_diff <= tolerance_percent * 2:
        return 0.8
    elif percent_diff <= tolerance_percent * 5:
        return 0.5
    else:
        return 0.0


def date_similarity(date1: str, date2: str, tolerance_days: int = 3) -> float:
    """
    Calculate date similarity with tolerance in days.
    Returns 1.0 if dates are within tolerance, scales down otherwise.
    """
    try:
        # Handle various date formats
        for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d']:
            try:
                d1 = datetime.strptime(str(date1), fmt)
                break
            except:
                continue
        else:
            return 0.5  # Cannot parse, neutral score
        
        for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d']:
            try:
                d2 = datetime.strptime(str(date2), fmt)
                break
            except:
                continue
        else:
            return 0.5
        
        diff_days = abs((d1 - d2).days)
        
        if diff_days <= tolerance_days:
            return 1.0
        elif diff_days <= tolerance_days * 2:
            return 0.8
        elif diff_days <= tolerance_days * 5:
            return 0.5
        else:
            return 0.2
    except:
        return 0.5


def calculate_shipment_dna_similarity(invoice1: Dict, invoice2: Dict) -> Dict:
    """
    Calculate overall "Shipment DNA" similarity between two invoices.
    
    Components weighted:
    - Invoice Number: 15% (Levenshtein)
    - Vendor ID: 20% (Exact match)
    - Amount: 30% (Tolerance-based)
    - Date: 20% (Tolerance-based)
    - Vehicle Number: 15% (Levenshtein)
    
    Returns dict with overall score and component breakdown.
    """
    # Weights for each component
    weights = {
        'invoice_number': 0.15,
        'vendor_id': 0.20,
        'amount': 0.30,
        'date': 0.20,
        'vehicle_number': 0.15
    }
    
    # Calculate individual similarities
    scores = {}
    
    # Invoice Number - Levenshtein
    scores['invoice_number'] = levenshtein_similarity(
        invoice1.get('invoice_number', ''),
        invoice2.get('invoice_number', '')
    )
    
    # Vendor ID - Exact match
    v1 = str(invoice1.get('vendor_id', '') or invoice1.get('supplier_id', '')).upper()
    v2 = str(invoice2.get('vendor_id', '') or invoice2.get('supplier_id', '')).upper()
    scores['vendor_id'] = 1.0 if v1 == v2 else 0.0
    
    # Amount - Tolerance based
    scores['amount'] = amount_similarity(
        float(invoice1.get('amount', 0) or 0),
        float(invoice2.get('amount', 0) or 0)
    )
    
    # Date - Tolerance based
    scores['date'] = date_similarity(
        invoice1.get('invoice_date', '') or invoice1.get('date', ''),
        invoice2.get('invoice_date', '') or invoice2.get('date', '')
    )
    
    # Vehicle Number - Levenshtein
    scores['vehicle_number'] = levenshtein_similarity(
        invoice1.get('vehicle_number', '') or '',
        invoice2.get('vehicle_number', '') or ''
    )
    
    # Calculate weighted overall score
    overall_score = sum(scores[k] * weights[k] for k in weights)
    
    return {
        'overall_similarity': round(overall_score, 4),
        'component_scores': {k: round(v, 4) for k, v in scores.items()},
        'weights': weights,
        'is_potential_duplicate': overall_score >= 0.85,
        'is_likely_duplicate': overall_score >= 0.95
    }


def get_invoices_for_vendor(vendor_id: str, days: int = 90) -> List[Dict]:
    """
    Fetch invoices for a specific vendor from the last N days.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        query = """
            SELECT 
                id,
                invoice_number,
                supplier_id as vendor_id,
                amount,
                status,
                po_number,
                invoice_date,
                due_date,
                items,
                created_at
            FROM supplier_invoices 
            WHERE supplier_id = %s 
            AND created_at >= %s
            ORDER BY created_at DESC
        """
        
        cursor.execute(query, (vendor_id, cutoff_date))
        invoices = cursor.fetchall()
        
        # Convert decimal and datetime to serializable formats
        for inv in invoices:
            if inv.get('amount'):
                inv['amount'] = float(inv['amount'])
            if inv.get('created_at'):
                inv['created_at'] = inv['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if inv.get('invoice_date'):
                inv['invoice_date'] = str(inv['invoice_date'])
            if inv.get('due_date'):
                inv['due_date'] = str(inv['due_date'])
        
        return invoices
    except Exception as e:
        print(f"Error fetching invoices: {e}")
        return []
    finally:
        cursor.close()
        conn.close()


def get_all_recent_invoices(days: int = 90) -> List[Dict]:
    """
    Fetch all invoices from the last N days.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        query = """
            SELECT 
                id,
                invoice_number,
                supplier_id as vendor_id,
                amount,
                status,
                po_number,
                invoice_date,
                due_date,
                items,
                created_at
            FROM supplier_invoices 
            WHERE created_at >= %s
            ORDER BY supplier_id, created_at DESC
        """
        
        cursor.execute(query, (cutoff_date,))
        invoices = cursor.fetchall()
        
        # Convert decimal and datetime to serializable formats
        for inv in invoices:
            if inv.get('amount'):
                inv['amount'] = float(inv['amount'])
            if inv.get('created_at'):
                inv['created_at'] = inv['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if inv.get('invoice_date'):
                inv['invoice_date'] = str(inv['invoice_date'])
            if inv.get('due_date'):
                inv['due_date'] = str(inv['due_date'])
        
        return invoices
    except Exception as e:
        print(f"Error fetching invoices: {e}")
        return []
    finally:
        cursor.close()
        conn.close()


def detect_duplicates(
    target_invoice: Dict,
    comparison_invoices: List[Dict] = None,
    threshold: float = 0.85,
    days: int = 90
) -> List[Dict]:
    """
    Detect potential duplicate invoices for a given target invoice.
    
    Args:
        target_invoice: The invoice to check for duplicates
        comparison_invoices: Optional list to compare against. If None, fetches from DB.
        threshold: Minimum similarity score to flag as duplicate (default 0.85)
        days: Number of days of history to check (default 90)
    
    Returns:
        List of potential duplicates with similarity scores
    """
    # Get comparison invoices if not provided
    if comparison_invoices is None:
        vendor_id = target_invoice.get('vendor_id') or target_invoice.get('supplier_id')
        if vendor_id:
            comparison_invoices = get_invoices_for_vendor(vendor_id, days)
        else:
            comparison_invoices = get_all_recent_invoices(days)
    
    duplicates = []
    target_id = target_invoice.get('id', '')
    
    for comp_invoice in comparison_invoices:
        # Skip comparing with itself
        if comp_invoice.get('id') == target_id:
            continue
        
        # Calculate similarity
        similarity = calculate_shipment_dna_similarity(target_invoice, comp_invoice)
        
        if similarity['overall_similarity'] >= threshold:
            duplicates.append({
                'original_invoice': {
                    'id': target_invoice.get('id'),
                    'invoice_number': target_invoice.get('invoice_number'),
                    'amount': target_invoice.get('amount'),
                    'date': target_invoice.get('invoice_date') or target_invoice.get('date')
                },
                'potential_duplicate': {
                    'id': comp_invoice.get('id'),
                    'invoice_number': comp_invoice.get('invoice_number'),
                    'amount': comp_invoice.get('amount'),
                    'date': comp_invoice.get('invoice_date') or comp_invoice.get('date'),
                    'status': comp_invoice.get('status')
                },
                'similarity_analysis': similarity,
                'risk_level': 'HIGH' if similarity['is_likely_duplicate'] else 'MEDIUM',
                'recommendation': 'BLOCK' if similarity['is_likely_duplicate'] else 'REVIEW'
            })
    
    # Sort by similarity score descending
    duplicates.sort(key=lambda x: x['similarity_analysis']['overall_similarity'], reverse=True)
    
    return duplicates


def scan_all_duplicates(days: int = 90, threshold: float = 0.85) -> Dict:
    """
    Scan all invoices in the system for potential duplicates.
    Returns summary statistics and list of all detected duplicates.
    """
    invoices = get_all_recent_invoices(days)
    
    all_duplicates = []
    checked_pairs = set()  # To avoid checking A-B and B-A
    
    for i, invoice1 in enumerate(invoices):
        for invoice2 in invoices[i+1:]:
            # Skip if different vendors (usually not duplicates)
            v1 = invoice1.get('vendor_id', '')
            v2 = invoice2.get('vendor_id', '')
            if v1 != v2:
                continue
            
            # Create unique pair ID to avoid rechecking
            pair_id = tuple(sorted([invoice1.get('id', ''), invoice2.get('id', '')]))
            if pair_id in checked_pairs:
                continue
            checked_pairs.add(pair_id)
            
            # Calculate similarity
            similarity = calculate_shipment_dna_similarity(invoice1, invoice2)
            
            if similarity['overall_similarity'] >= threshold:
                all_duplicates.append({
                    'invoice_1': {
                        'id': invoice1.get('id'),
                        'invoice_number': invoice1.get('invoice_number'),
                        'amount': invoice1.get('amount'),
                        'date': invoice1.get('invoice_date')
                    },
                    'invoice_2': {
                        'id': invoice2.get('id'),
                        'invoice_number': invoice2.get('invoice_number'),
                        'amount': invoice2.get('amount'),
                        'date': invoice2.get('invoice_date')
                    },
                    'vendor_id': v1,
                    'similarity_analysis': similarity
                })
    
    # Calculate statistics
    high_risk = len([d for d in all_duplicates if d['similarity_analysis']['is_likely_duplicate']])
    medium_risk = len(all_duplicates) - high_risk
    
    total_at_risk = sum(
        d['invoice_2']['amount'] for d in all_duplicates 
        if d['similarity_analysis']['is_likely_duplicate'] and d['invoice_2']['amount']
    )
    
    return {
        'summary': {
            'total_invoices_scanned': len(invoices),
            'pairs_analyzed': len(checked_pairs),
            'duplicates_detected': len(all_duplicates),
            'high_risk_count': high_risk,
            'medium_risk_count': medium_risk,
            'total_amount_at_risk': round(total_at_risk, 2),
            'scan_period_days': days,
            'threshold_used': threshold
        },
        'duplicates': all_duplicates,
        'scan_timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }


# Test functions
def test_levenshtein():
    """Test Levenshtein distance calculation."""
    test_cases = [
        ("INV-101", "INV-101/A", "Should be similar"),
        ("INV-101", "INV-101-R", "Should be similar"),
        ("INV-101", "INV-102", "Should be slightly different"),
        ("INV-101", "XINV-999", "Should be very different"),
    ]
    
    print("Levenshtein Distance Tests:")
    print("-" * 50)
    for s1, s2, desc in test_cases:
        dist = levenshtein_distance(s1, s2)
        sim = levenshtein_similarity(s1, s2)
        print(f"{s1} vs {s2}")
        print(f"  Distance: {dist}, Similarity: {sim:.4f}")
        print(f"  {desc}")
        print()


def test_duplicate_detection():
    """Test full duplicate detection flow."""
    # Sample invoices
    invoice1 = {
        'id': 'INV-001',
        'invoice_number': 'TCI-2024-0501',
        'vendor_id': 'VENDOR-TCI',
        'amount': 45000.00,
        'invoice_date': '2024-12-15',
        'vehicle_number': 'MH12AB1234'
    }
    
    invoice2 = {
        'id': 'INV-002',
        'invoice_number': 'TCI-2024-0501/A',  # Resubmitted with /A
        'vendor_id': 'VENDOR-TCI',
        'amount': 45000.00,  # Same amount
        'invoice_date': '2024-12-16',  # Next day
        'vehicle_number': 'MH12AB1234'  # Same vehicle
    }
    
    invoice3 = {
        'id': 'INV-003',
        'invoice_number': 'TCI-2024-0600',
        'vendor_id': 'VENDOR-TCI',
        'amount': 72000.00,  # Different amount
        'invoice_date': '2024-12-20',
        'vehicle_number': 'MH14CD5678'  # Different vehicle
    }
    
    print("Duplicate Detection Tests:")
    print("-" * 50)
    
    # Test 1: Resubmitted invoice
    result1 = calculate_shipment_dna_similarity(invoice1, invoice2)
    print("Test 1: Original vs Resubmitted (should be HIGH similarity)")
    print(f"  Overall Similarity: {result1['overall_similarity']}")
    print(f"  Component Scores: {result1['component_scores']}")
    print(f"  Is Potential Duplicate: {result1['is_potential_duplicate']}")
    print(f"  Is Likely Duplicate: {result1['is_likely_duplicate']}")
    print()
    
    # Test 2: Completely different invoice
    result2 = calculate_shipment_dna_similarity(invoice1, invoice3)
    print("Test 2: Original vs Different Invoice (should be LOW similarity)")
    print(f"  Overall Similarity: {result2['overall_similarity']}")
    print(f"  Component Scores: {result2['component_scores']}")
    print(f"  Is Potential Duplicate: {result2['is_potential_duplicate']}")
    print()


if __name__ == "__main__":
    test_levenshtein()
    print("\n" + "=" * 50 + "\n")
    test_duplicate_detection()
