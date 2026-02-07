"""
Placement Failure Probability Predictor - Logistic Regression
Predicts the probability that a vendor will fail to fulfill a placement.

The Pain Point: You assign a load to "Sharma Transport". Will they actually send 
the truck, or cancel at the last minute?

The Solution: "Risk Alert: 80% chance Sharma will fail on this route."

Features:
- Vendor ID and historical performance metrics
- Route difficulty score (distance, terrain, weather patterns)
- Day of week (Sundays and festival days have high failure rates)
- Historical failure rate for this vendor
- Time of year (monsoon = high failure, winter = low failure)
- Load value (higher value loads see fewer failures)

Output: Probability Score (0.0 to 1.0)
Action: If Risk > 0.7, suggest: "Book a backup vehicle now."

For enterprise deployment: Replace sample data with MySQL queries.
"""

import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import random

# =============================================================================
# SAMPLE TRAINING DATA - VENDOR PERFORMANCE HISTORY
# In production, this would come from MySQL: vendor_placements table
# =============================================================================

# Vendor profiles with historical performance metrics
VENDOR_PROFILES = {
    "V-SPOT-001": {
        "name": "Sharma Transporters",
        "total_placements": 847,
        "successful_placements": 693,
        "failures": 154,
        "failure_rate": 0.182,  # 18.2% failure rate - unreliable
        "avg_response_time_hrs": 4.5,
        "fleet_size": 12,
        "years_in_business": 8,
        "primary_routes": ["Mumbai-Delhi", "Pune-Bangalore"],
        "weak_routes": ["Delhi-Chennai", "Kolkata-Mumbai"],  # High failure on these
        "sunday_failure_rate": 0.35,  # Much higher on Sundays
        "monsoon_failure_rate": 0.28,
        "risk_tier": "HIGH"
    },
    "V-SPOT-002": {
        "name": "VRL Logistics",
        "total_placements": 3245,
        "successful_placements": 3115,
        "failures": 130,
        "failure_rate": 0.040,  # 4% - very reliable
        "avg_response_time_hrs": 1.2,
        "fleet_size": 850,
        "years_in_business": 45,
        "primary_routes": ["Mumbai-Delhi", "Bangalore-Chennai", "Pune-Hyderabad"],
        "weak_routes": [],
        "sunday_failure_rate": 0.06,
        "monsoon_failure_rate": 0.08,
        "risk_tier": "LOW"
    },
    "V-SPOT-003": {
        "name": "Ghatge Patil",
        "total_placements": 1567,
        "successful_placements": 1380,
        "failures": 187,
        "failure_rate": 0.119,  # 12% - moderate
        "avg_response_time_hrs": 2.8,
        "fleet_size": 180,
        "years_in_business": 22,
        "primary_routes": ["Pune-Mumbai", "Pune-Bangalore", "Mumbai-Goa"],
        "weak_routes": ["Delhi-Chennai"],
        "sunday_failure_rate": 0.22,
        "monsoon_failure_rate": 0.18,
        "risk_tier": "MEDIUM"
    },
    "V-SPOT-004": {
        "name": "Blue Dart",
        "total_placements": 12890,
        "successful_placements": 12632,
        "failures": 258,
        "failure_rate": 0.020,  # 2% - excellent
        "avg_response_time_hrs": 0.5,
        "fleet_size": 5000,
        "years_in_business": 40,
        "primary_routes": ["All India"],
        "weak_routes": [],
        "sunday_failure_rate": 0.03,
        "monsoon_failure_rate": 0.04,
        "risk_tier": "VERY_LOW"
    },
    "V-SPOT-005": {
        "name": "TCI Express",
        "total_placements": 4521,
        "successful_placements": 4294,
        "failures": 227,
        "failure_rate": 0.050,  # 5% - reliable
        "avg_response_time_hrs": 1.5,
        "fleet_size": 2500,
        "years_in_business": 35,
        "primary_routes": ["Pan-India"],
        "weak_routes": ["Remote NE Routes"],
        "sunday_failure_rate": 0.08,
        "monsoon_failure_rate": 0.10,
        "risk_tier": "LOW"
    }
}

# Route difficulty scores (0-1, where 1 is most difficult)
ROUTE_DIFFICULTY = {
    ("Mumbai", "Delhi"): 0.3,  # Well-established highway
    ("Delhi", "Mumbai"): 0.3,
    ("Mumbai", "Bangalore"): 0.4,
    ("Bangalore", "Mumbai"): 0.4,
    ("Delhi", "Chennai"): 0.6,  # Long distance, multiple states
    ("Chennai", "Delhi"): 0.6,
    ("Pune", "Mumbai"): 0.2,  # Short, easy
    ("Mumbai", "Pune"): 0.2,
    ("Kolkata", "Mumbai"): 0.7,  # Very long, road conditions vary
    ("Mumbai", "Kolkata"): 0.7,
    ("Delhi", "Kolkata"): 0.5,
    ("Kolkata", "Delhi"): 0.5,
    ("Bangalore", "Chennai"): 0.3,
    ("Chennai", "Bangalore"): 0.3,
    ("Ahmedabad", "Mumbai"): 0.25,
    ("Mumbai", "Ahmedabad"): 0.25,
    ("Jaipur", "Delhi"): 0.2,
    ("Delhi", "Jaipur"): 0.2,
    ("Pune", "Hyderabad"): 0.4,
    ("Hyderabad", "Pune"): 0.4,
    ("Guwahati", "Kolkata"): 0.8,  # Difficult terrain
    ("Kolkata", "Guwahati"): 0.8,
    ("Srinagar", "Delhi"): 0.9,  # High altitude, weather issues
    ("Delhi", "Srinagar"): 0.9,
}

# Day of week risk multipliers
DAY_RISK_MULTIPLIERS = {
    0: 1.0,   # Monday - normal
    1: 0.95,  # Tuesday - slightly better
    2: 0.95,  # Wednesday - slightly better
    3: 1.0,   # Thursday - normal
    4: 1.1,   # Friday - slight increase (weekend approaching)
    5: 1.25,  # Saturday - higher risk
    6: 1.45,  # Sunday - highest risk (driver unavailability)
}

# Monthly seasonality factors
MONTHLY_RISK = {
    1: 0.95,   # January - post-winter, stable
    2: 0.90,   # February - good conditions
    3: 1.05,   # March - financial year end rush
    4: 1.00,   # April - normal
    5: 1.10,   # May - heat issues
    6: 1.25,   # June - monsoon starts
    7: 1.40,   # July - peak monsoon, highest risk
    8: 1.30,   # August - monsoon continues
    9: 1.15,   # September - monsoon receding
    10: 0.95,  # October - good weather, Diwali
    11: 0.90,  # November - best month
    12: 0.95,  # December - winter, some fog
}

# =============================================================================
# LOGISTIC REGRESSION MODEL (SIMULATED)
# In production, train on actual placement data from MySQL
# =============================================================================

def sigmoid(x: float) -> float:
    """Logistic function to convert log-odds to probability."""
    return 1 / (1 + math.exp(-x))


def get_route_difficulty(origin: str, destination: str) -> float:
    """Get route difficulty score. Returns 0.5 for unknown routes."""
    key = (origin.strip().title(), destination.strip().title())
    if key in ROUTE_DIFFICULTY:
        return ROUTE_DIFFICULTY[key]
    # For unknown routes, estimate based on string heuristics
    return 0.5


def predict_placement_failure(
    vendor_id: str,
    origin: str,
    destination: str,
    placement_date: Optional[datetime] = None,
    load_value: Optional[float] = None
) -> Dict:
    """
    Predict the probability that a vendor will fail to fulfill a placement.
    
    Uses Logistic Regression with the following features:
    - Vendor historical failure rate
    - Route difficulty
    - Day of week
    - Month/seasonality
    - Load value (optional)
    
    Args:
        vendor_id: Unique vendor identifier
        origin: Origin city
        destination: Destination city
        placement_date: Date of placement (default: today)
        load_value: Value of the load in INR (optional)
    
    Returns:
        Dictionary with failure probability and risk assessment
    """
    if placement_date is None:
        placement_date = datetime.now()
    
    # Get vendor profile
    vendor = VENDOR_PROFILES.get(vendor_id)
    if not vendor:
        return {
            "success": False,
            "error": f"Unknown vendor: {vendor_id}",
            "failure_probability": 0.5,
            "risk_level": "UNKNOWN"
        }
    
    # Feature 1: Base failure rate (coefficent: 2.5)
    base_failure = vendor["failure_rate"]
    
    # Feature 2: Route difficulty (coefficient: 1.8)
    route_difficulty = get_route_difficulty(origin, destination)
    
    # Check if this is a weak route for the vendor
    route_str = f"{origin}-{destination}"
    is_weak_route = any(weak in route_str for weak in vendor.get("weak_routes", []))
    if is_weak_route:
        route_difficulty = min(1.0, route_difficulty + 0.25)
    
    # Feature 3: Day of week risk (coefficient: 1.2)
    day_of_week = placement_date.weekday()
    day_risk = DAY_RISK_MULTIPLIERS.get(day_of_week, 1.0)
    
    # Feature 4: Monthly seasonality (coefficient: 1.5)
    month = placement_date.month
    month_risk = MONTHLY_RISK.get(month, 1.0)
    
    # Feature 5: Load value (coefficient: -0.3 - higher value = lower risk)
    value_factor = 1.0
    if load_value:
        if load_value > 500000:  # High value loads
            value_factor = 0.85
        elif load_value > 200000:
            value_factor = 0.92
        elif load_value < 50000:  # Low value loads see more failures
            value_factor = 1.15
    
    # Feature 6: Fleet size (coefficient: -0.2 - larger fleet = more reliable)
    fleet_factor = 1.0
    fleet_size = vendor.get("fleet_size", 10)
    if fleet_size >= 1000:
        fleet_factor = 0.8
    elif fleet_size >= 100:
        fleet_factor = 0.9
    elif fleet_size < 20:
        fleet_factor = 1.2
    
    # Logistic Regression: Compute log-odds
    # log(p / (1-p)) = β0 + β1*x1 + β2*x2 + ...
    # Using calibrated coefficients
    log_odds = (
        -2.5  # Intercept (baseline low probability)
        + 2.5 * base_failure          # Vendor historical failure rate
        + 1.8 * route_difficulty      # Route difficulty
        + 1.2 * (day_risk - 1.0)      # Day of week effect
        + 1.5 * (month_risk - 1.0)    # Seasonality effect
        + 0.8 * (value_factor - 1.0)  # Load value effect
        + 0.6 * (fleet_factor - 1.0)  # Fleet size effect
    )
    
    # Convert to probability
    failure_probability = sigmoid(log_odds)
    
    # Determine risk level and recommendations
    if failure_probability >= 0.7:
        risk_level = "CRITICAL"
        risk_color = "#000000"  # Black
        recommendation = "STRONGLY RECOMMEND: Book a backup vehicle immediately."
        action = "BOOK_BACKUP"
    elif failure_probability >= 0.5:
        risk_level = "HIGH"
        risk_color = "#FF6B00"  # Orange
        recommendation = "CAUTION: Consider having a standby vehicle on call."
        action = "STANDBY_ALERT"
    elif failure_probability >= 0.3:
        risk_level = "MEDIUM"
        risk_color = "#0066FF"  # Blue
        recommendation = "Monitor placement closely. Set reminder for confirmation."
        action = "MONITOR"
    else:
        risk_level = "LOW"
        risk_color = "#00C805"  # Green
        recommendation = "Vendor is reliable for this route. Proceed with confidence."
        action = "PROCEED"
    
    # Build detailed response
    return {
        "success": True,
        "failure_probability": round(failure_probability, 3),
        "failure_percentage": round(failure_probability * 100, 1),
        "risk_level": risk_level,
        "risk_color": risk_color,
        "recommendation": recommendation,
        "suggested_action": action,
        
        # Feature breakdown for transparency
        "factors": {
            "vendor_historical_rate": {
                "value": round(base_failure * 100, 1),
                "label": f"{round(base_failure * 100, 1)}% historical failures",
                "impact": "HIGH" if base_failure > 0.15 else "MEDIUM" if base_failure > 0.08 else "LOW"
            },
            "route_difficulty": {
                "value": round(route_difficulty * 100),
                "label": f"{round(route_difficulty * 100)}% difficulty score",
                "is_weak_route": is_weak_route,
                "impact": "HIGH" if route_difficulty > 0.6 else "MEDIUM" if route_difficulty > 0.4 else "LOW"
            },
            "day_of_week": {
                "value": day_of_week,
                "day_name": placement_date.strftime("%A"),
                "risk_multiplier": day_risk,
                "impact": "HIGH" if day_risk > 1.2 else "MEDIUM" if day_risk > 1.0 else "LOW"
            },
            "seasonality": {
                "month": month,
                "month_name": placement_date.strftime("%B"),
                "risk_multiplier": month_risk,
                "is_monsoon": month in [6, 7, 8],
                "impact": "HIGH" if month_risk > 1.2 else "MEDIUM" if month_risk > 1.0 else "LOW"
            },
            "fleet_reliability": {
                "fleet_size": fleet_size,
                "factor": fleet_factor,
                "impact": "HIGH" if fleet_factor > 1.1 else "MEDIUM" if fleet_factor > 0.95 else "LOW"
            }
        },
        
        # Vendor info
        "vendor": {
            "id": vendor_id,
            "name": vendor["name"],
            "total_placements": vendor["total_placements"],
            "failure_rate": vendor["failure_rate"],
            "risk_tier": vendor["risk_tier"]
        },
        
        # Route info
        "route": {
            "origin": origin,
            "destination": destination,
            "difficulty_score": route_difficulty,
            "is_weak_route": is_weak_route
        }
    }


def get_vendor_comparison(
    origin: str,
    destination: str,
    placement_date: Optional[datetime] = None
) -> Dict:
    """
    Compare all vendors for a given route and date.
    Returns vendors ranked by reliability (lowest failure probability first).
    """
    comparisons = []
    
    for vendor_id, vendor in VENDOR_PROFILES.items():
        result = predict_placement_failure(
            vendor_id=vendor_id,
            origin=origin,
            destination=destination,
            placement_date=placement_date
        )
        
        comparisons.append({
            "vendor_id": vendor_id,
            "vendor_name": vendor["name"],
            "failure_probability": result["failure_probability"],
            "risk_level": result["risk_level"],
            "risk_color": result["risk_color"],
            "recommendation": result["recommendation"],
            "historical_failure_rate": vendor["failure_rate"],
            "fleet_size": vendor["fleet_size"]
        })
    
    # Sort by failure probability (lowest first = most reliable)
    comparisons.sort(key=lambda x: x["failure_probability"])
    
    return {
        "success": True,
        "route": f"{origin} → {destination}",
        "placement_date": (placement_date or datetime.now()).strftime("%Y-%m-%d"),
        "vendors": comparisons,
        "recommended_vendor": comparisons[0] if comparisons else None,
        "avoid_vendor": comparisons[-1] if len(comparisons) > 1 else None
    }


def get_demo_risks() -> List[Dict]:
    """Get demo risk predictions for UI display."""
    scenarios = [
        {
            "vendor_id": "V-SPOT-001",
            "origin": "Delhi",
            "destination": "Chennai",
            "date": datetime(2024, 7, 14)  # Sunday in July (monsoon)
        },
        {
            "vendor_id": "V-SPOT-002",
            "origin": "Mumbai",
            "destination": "Delhi",
            "date": datetime(2024, 11, 15)  # Friday in November
        },
        {
            "vendor_id": "V-SPOT-003",
            "origin": "Kolkata",
            "destination": "Mumbai",
            "date": datetime(2024, 8, 4)  # Sunday in August
        },
        {
            "vendor_id": "V-SPOT-004",
            "origin": "Bangalore",
            "destination": "Chennai",
            "date": datetime(2024, 2, 20)  # Tuesday in February
        },
    ]
    
    results = []
    for scenario in scenarios:
        result = predict_placement_failure(
            vendor_id=scenario["vendor_id"],
            origin=scenario["origin"],
            destination=scenario["destination"],
            placement_date=scenario["date"]
        )
        result["scenario"] = scenario
        results.append(result)
    
    return results


# =============================================================================
# TEST
# =============================================================================

def test_predictor():
    """Test the placement failure predictor."""
    print("\n" + "="*70)
    print("PLACEMENT FAILURE PROBABILITY PREDICTOR - TEST RESULTS")
    print("="*70)
    
    # Test 1: High risk scenario
    print("\n--- Test 1: Sharma Transporters on Delhi-Chennai (Sunday, July) ---")
    result = predict_placement_failure(
        vendor_id="V-SPOT-001",
        origin="Delhi",
        destination="Chennai",
        placement_date=datetime(2024, 7, 14)  # Sunday in monsoon
    )
    print(f"Vendor: {result['vendor']['name']}")
    print(f"Failure Probability: {result['failure_percentage']}%")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommendation: {result['recommendation']}")
    
    # Test 2: Low risk scenario
    print("\n--- Test 2: Blue Dart on Mumbai-Delhi (Tuesday, November) ---")
    result = predict_placement_failure(
        vendor_id="V-SPOT-004",
        origin="Mumbai",
        destination="Delhi",
        placement_date=datetime(2024, 11, 12)  # Tuesday in November
    )
    print(f"Vendor: {result['vendor']['name']}")
    print(f"Failure Probability: {result['failure_percentage']}%")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommendation: {result['recommendation']}")
    
    # Test 3: Vendor comparison
    print("\n--- Test 3: Vendor Comparison for Mumbai-Delhi ---")
    comparison = get_vendor_comparison("Mumbai", "Delhi")
    print(f"Route: {comparison['route']}")
    print("\nVendors (ranked by reliability):")
    for v in comparison["vendors"]:
        print(f"  {v['vendor_name']}: {round(v['failure_probability']*100, 1)}% failure risk ({v['risk_level']})")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    test_predictor()
