"""
Benford's Law Fraud Detection Service
Detects statistically anomalous invoice amounts that may indicate fraud.

The Pain Point: Colluding vendors create fake invoices just under approval limits (e.g., ₹49,000 to avoid ₹50,000 limit).
The Solution: Benford's Law - natural financial data follows a predictable first-digit distribution.

In natural data:
- Digit '1' appears as first digit ~30.1% of time
- Digit '9' appears as first digit ~4.6% of time

When someone fabricates numbers, they often:
- Avoid round numbers (use 47,999 instead of 48,000)
- Cluster around approval limits
- Use digits 4,5,6,7 more than expected

"""

import math
from typing import List, Dict, Tuple, Optional
from collections import Counter
from datetime import datetime
from scipy import stats  # For Chi-Square test


# Benford's Law Expected Distribution (first digit)
BENFORD_EXPECTED = {
    1: 0.301,  # ~30.1%
    2: 0.176,  # ~17.6%
    3: 0.125,  # ~12.5%
    4: 0.097,  # ~9.7%
    5: 0.079,  # ~7.9%
    6: 0.067,  # ~6.7%
    7: 0.058,  # ~5.8%
    8: 0.051,  # ~5.1%
    9: 0.046   # ~4.6%
}


def get_first_digit(number: float) -> Optional[int]:
    """
    Extract the first significant digit from a number.
    
    Args:
        number: The number to analyze
    
    Returns:
        First digit (1-9), or None if invalid
    """
    if number <= 0:
        return None
    
    # Get absolute value and convert to string
    str_num = str(abs(number))
    
    # Remove leading zeros and decimal points
    for char in str_num:
        if char.isdigit() and char != '0':
            return int(char)
    
    return None


def calculate_benford_distribution(amounts: List[float]) -> Dict[int, float]:
    """
    Calculate the actual first digit distribution from a list of amounts.
    
    Args:
        amounts: List of invoice amounts
    
    Returns:
        Dictionary mapping digit (1-9) to observed frequency
    """
    first_digits = []
    
    for amount in amounts:
        digit = get_first_digit(amount)
        if digit is not None:
            first_digits.append(digit)
    
    if not first_digits:
        return {d: 0.0 for d in range(1, 10)}
    
    # Count occurrences
    counter = Counter(first_digits)
    total = len(first_digits)
    
    # Calculate frequencies
    distribution = {}
    for digit in range(1, 10):
        distribution[digit] = counter.get(digit, 0) / total
    
    return distribution


def chi_square_test(observed: Dict[int, float], expected: Dict[int, float], sample_size: int) -> Tuple[float, float]:
    """
    Perform Chi-Square test to compare observed vs expected distributions.
    
    Args:
        observed: Observed distribution
        expected: Expected (Benford) distribution
        sample_size: Number of samples
    
    Returns:
        (chi_square_statistic, p_value)
    """
    if sample_size < 10:
        return (0.0, 1.0)  # Not enough data
    
    chi_square = 0.0
    
    for digit in range(1, 10):
        obs_freq = observed.get(digit, 0) * sample_size
        exp_freq = expected.get(digit, 0) * sample_size
        
        if exp_freq > 0:
            chi_square += ((obs_freq - exp_freq) ** 2) / exp_freq
    
    # Degrees of freedom = 8 (9 digits - 1)
    # Calculate p-value using scipy
    try:
        p_value = 1 - stats.chi2.cdf(chi_square, df=8)
    except:
        p_value = 0.5  # Fallback
    
    return (round(chi_square, 4), round(p_value, 6))


def analyze_vendor_benford(vendor_id: str, amounts: List[float], vendor_name: str = None) -> Dict:
    """
    Analyze a vendor's invoices for Benford's Law compliance.
    
    Args:
        vendor_id: Unique vendor identifier
        amounts: List of invoice amounts from this vendor
        vendor_name: Optional vendor name
    
    Returns:
        Analysis result with fraud risk assessment
    """
    if len(amounts) < 10:
        return {
            'vendor_id': vendor_id,
            'vendor_name': vendor_name or vendor_id,
            'sample_size': len(amounts),
            'status': 'INSUFFICIENT_DATA',
            'message': 'Need at least 10 invoices for reliable Benford analysis',
            'risk_level': 'UNKNOWN',
            'confidence': 0
        }
    
    # Calculate observed distribution
    observed = calculate_benford_distribution(amounts)
    
    # Perform Chi-Square test
    chi_square, p_value = chi_square_test(observed, BENFORD_EXPECTED, len(amounts))
    
    # Calculate deviation for each digit
    digit_deviations = {}
    max_deviation_digit = 1
    max_deviation = 0
    
    for digit in range(1, 10):
        expected = BENFORD_EXPECTED[digit] * 100
        actual = observed[digit] * 100
        deviation = actual - expected
        digit_deviations[digit] = {
            'expected': round(expected, 2),
            'actual': round(actual, 2),
            'deviation': round(deviation, 2)
        }
        if abs(deviation) > abs(max_deviation):
            max_deviation = deviation
            max_deviation_digit = digit
    
    # Determine risk level based on p-value
    if p_value < 0.01:
        risk_level = 'HIGH'
        recommendation = 'AUDIT_REQUIRED'
        message = f'Significant deviation from Benford\'s Law (p={p_value:.4f}). Digit "{max_deviation_digit}" is over-represented by {max_deviation:+.1f}%. Potential invoice fabrication.'
    elif p_value < 0.05:
        risk_level = 'MEDIUM'
        recommendation = 'REVIEW'
        message = f'Moderate deviation from Benford\'s Law (p={p_value:.4f}). Digit "{max_deviation_digit}" shows {max_deviation:+.1f}% deviation.'
    else:
        risk_level = 'LOW'
        recommendation = 'PASS'
        message = f'Invoice amounts follow expected distribution (p={p_value:.4f}). No statistical anomaly detected.'
    
    # Check for approval limit clustering (₹49,000-₹50,000 range)
    approval_limit_cluster = sum(1 for a in amounts if 47000 <= a <= 50000)
    approval_limit_pct = (approval_limit_cluster / len(amounts)) * 100
    
    approval_limit_flag = False
    if approval_limit_pct > 15:  # More than 15% in this range is suspicious
        approval_limit_flag = True
        risk_level = 'HIGH' if risk_level != 'HIGH' else risk_level
        message += f' ALERT: {approval_limit_pct:.1f}% of invoices cluster around ₹50,000 approval limit.'
    
    return {
        'vendor_id': vendor_id,
        'vendor_name': vendor_name or vendor_id,
        'sample_size': len(amounts),
        'analysis_timestamp': datetime.now().isoformat(),
        'chi_square_statistic': chi_square,
        'p_value': p_value,
        'risk_level': risk_level,
        'recommendation': recommendation,
        'message': message,
        'digit_distribution': digit_deviations,
        'max_deviation_digit': max_deviation_digit,
        'max_deviation_pct': round(max_deviation, 2),
        'approval_limit_cluster': approval_limit_cluster,
        'approval_limit_pct': round(approval_limit_pct, 2),
        'approval_limit_flag': approval_limit_flag,
        'confidence': round((1 - p_value) * 100, 1) if p_value < 0.5 else round(p_value * 100, 1)
    }


# Demo Data: Simulated vendor invoice amounts
DEMO_VENDORS = {
    'tci-express': {
        'name': 'TCI Express Limited',
        'contact': 'Rajesh Sharma',
        # Natural distribution - follows Benford's Law
        'amounts': [
            12500, 18700, 15200, 11000, 23400, 31200, 14500, 19800,
            25600, 13400, 16700, 22100, 17800, 14200, 28900, 11500,
            32400, 15600, 13800, 21000, 16200, 24500, 11800, 19200,
            27300, 14900, 18100, 12700, 23800, 15400, 29100, 16500
        ]
    },
    'blue-dart': {
        'name': 'Blue Dart Express',
        'contact': 'Amit Patel',
        # Natural distribution
        'amounts': [
            11200, 24600, 15800, 31400, 12900, 18700, 22300, 14100,
            27800, 16400, 13500, 19200, 25100, 11700, 28900, 14800,
            17600, 23400, 12300, 21500, 15100, 26700, 13900, 18400
        ]
    },
    'suspicious-logistics': {
        'name': 'Quick Haul Logistics',
        'contact': 'Unknown',
        # SUSPICIOUS: Fabricated amounts clustered around ₹49,000 (approval limit avoidance)
        'amounts': [
            49000, 48500, 49200, 47800, 49100, 48700, 49400, 48200,
            49300, 47900, 48600, 49500, 48900, 47500, 49600, 48300,
            47700, 49800, 48100, 49700, 45000, 46000, 44000, 43000,
            49900, 48400, 47600, 49250, 48750, 49450
        ]
    },
    'abc-freight': {
        'name': 'ABC Freight Services',
        'contact': 'Suresh Kumar',
        # MODERATELY SUSPICIOUS: Over-representation of digit 5
        'amounts': [
            55000, 52000, 58000, 51000, 54000, 56000, 53000, 57000,
            59000, 55500, 52500, 58500, 51500, 54500, 56500, 53500,
            12000, 23000, 34000, 15000, 26000, 17000, 28000, 19000
        ]
    }
}


def get_all_vendors_benford_analysis() -> List[Dict]:
    """
    Analyze all demo vendors for Benford's Law compliance.
    
    Returns:
        List of analysis results for each vendor
    """
    results = []
    
    for vendor_id, vendor_data in DEMO_VENDORS.items():
        analysis = analyze_vendor_benford(
            vendor_id=vendor_id,
            amounts=vendor_data['amounts'],
            vendor_name=vendor_data['name']
        )
        analysis['contact'] = vendor_data['contact']
        results.append(analysis)
    
    # Sort by risk level (HIGH first)
    risk_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2, 'UNKNOWN': 3}
    results.sort(key=lambda x: risk_order.get(x['risk_level'], 4))
    
    return results


def get_benford_summary() -> Dict:
    """
    Get summary statistics for Benford's Law analysis across all vendors.
    """
    analyses = get_all_vendors_benford_analysis()
    
    high_risk = sum(1 for a in analyses if a['risk_level'] == 'HIGH')
    medium_risk = sum(1 for a in analyses if a['risk_level'] == 'MEDIUM')
    low_risk = sum(1 for a in analyses if a['risk_level'] == 'LOW')
    
    # Calculate total amount at risk
    amount_at_risk = 0
    for analysis in analyses:
        if analysis['risk_level'] in ['HIGH', 'MEDIUM']:
            vendor_id = analysis['vendor_id']
            if vendor_id in DEMO_VENDORS:
                amount_at_risk += sum(DEMO_VENDORS[vendor_id]['amounts'])
    
    return {
        'total_vendors_analyzed': len(analyses),
        'high_risk_count': high_risk,
        'medium_risk_count': medium_risk,
        'low_risk_count': low_risk,
        'amount_at_risk': round(amount_at_risk, 2),
        'analysis_timestamp': datetime.now().isoformat(),
        'vendors': analyses
    }


# Test functions
def test_benford():
    """Test Benford's Law analysis."""
    print("=" * 60)
    print("BENFORD'S LAW FRAUD DETECTION - DEMO")
    print("=" * 60)
    
    for vendor_id, vendor_data in DEMO_VENDORS.items():
        print(f"\n--- {vendor_data['name']} ({vendor_id}) ---")
        analysis = analyze_vendor_benford(
            vendor_id=vendor_id,
            amounts=vendor_data['amounts'],
            vendor_name=vendor_data['name']
        )
        
        print(f"Sample Size: {analysis['sample_size']}")
        print(f"Chi-Square: {analysis['chi_square_statistic']}")
        print(f"P-Value: {analysis['p_value']}")
        print(f"Risk Level: {analysis['risk_level']}")
        print(f"Message: {analysis['message']}")
        
        print("\nFirst Digit Distribution:")
        print("Digit | Expected | Actual   | Deviation")
        print("-" * 45)
        for digit in range(1, 10):
            dist = analysis['digit_distribution'][digit]
            print(f"  {digit}   | {dist['expected']:6.2f}%  | {dist['actual']:6.2f}%  | {dist['deviation']:+6.2f}%")


if __name__ == "__main__":
    test_benford()
