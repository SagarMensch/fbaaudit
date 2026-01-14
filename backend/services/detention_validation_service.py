"""
GPS-Based Detention Validation Service
Validates driver detention claims using Point-in-Polygon and Haversine Distance algorithms.

Features:
- Point-in-Polygon: Check if GPS point is inside factory geofence
- Haversine Distance: Calculate distance between two GPS coordinates
- Detention Hours: Calculate actual hours truck was inside geofence
- Auto-Reject: If GPS_Hours < Invoice_Detention_Hours

"""

import math
from typing import List, Tuple, Dict, Optional
from datetime import datetime, timedelta
from services.db_service import get_db_connection


# Earth's radius in kilometers
EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two GPS coordinates using Haversine formula.
    
    Args:
        lat1, lon1: First point (latitude, longitude in degrees)
        lat2, lon2: Second point (latitude, longitude in degrees)
    
    Returns:
        Distance in kilometers
    """
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = EARTH_RADIUS_KM * c
    return round(distance, 4)


def point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
    """
    Check if a GPS point is inside a polygon (geofence) using Ray Casting algorithm.
    
    Args:
        point: (latitude, longitude) of the point to check
        polygon: List of (latitude, longitude) vertices defining the polygon
    
    Returns:
        True if point is inside polygon, False otherwise
    """
    lat, lon = point
    n = len(polygon)
    inside = False
    
    p1_lat, p1_lon = polygon[0]
    for i in range(1, n + 1):
        p2_lat, p2_lon = polygon[i % n]
        
        if lon > min(p1_lon, p2_lon):
            if lon <= max(p1_lon, p2_lon):
                if lat <= max(p1_lat, p2_lat):
                    if p1_lon != p2_lon:
                        lat_intersect = (lon - p1_lon) * (p2_lat - p1_lat) / (p2_lon - p1_lon) + p1_lat
                    if p1_lat == p2_lat or lat <= lat_intersect:
                        inside = not inside
        
        p1_lat, p1_lon = p2_lat, p2_lon
    
    return inside


def point_in_circle(point: Tuple[float, float], center: Tuple[float, float], radius_km: float) -> bool:
    """
    Check if a GPS point is within a circular radius of a center point.
    
    Args:
        point: (latitude, longitude) of the point to check
        center: (latitude, longitude) of the circle center
        radius_km: Radius in kilometers
    
    Returns:
        True if point is within radius, False otherwise
    """
    distance = haversine_distance(point[0], point[1], center[0], center[1])
    return distance <= radius_km


def calculate_detention_hours(
    gps_pings: List[Dict],
    geofence: Dict,
    arrival_time: datetime = None,
    departure_time: datetime = None
) -> Dict:
    """
    Calculate actual detention hours based on GPS pings inside geofence.
    
    Args:
        gps_pings: List of GPS pings with 'lat', 'lon', 'timestamp'
        geofence: Either polygon {'type': 'polygon', 'vertices': [(lat, lon), ...]}
                  or circle {'type': 'circle', 'center': (lat, lon), 'radius_km': float}
        arrival_time: Expected arrival time (optional)
        departure_time: Expected departure time (optional)
    
    Returns:
        Dict with detention analysis results
    """
    inside_pings = []
    outside_pings = []
    
    for ping in gps_pings:
        point = (ping['lat'], ping['lon'])
        timestamp = ping.get('timestamp')
        
        if geofence['type'] == 'polygon':
            is_inside = point_in_polygon(point, geofence['vertices'])
        elif geofence['type'] == 'circle':
            is_inside = point_in_circle(point, geofence['center'], geofence['radius_km'])
        else:
            is_inside = False
        
        if is_inside:
            inside_pings.append(ping)
        else:
            outside_pings.append(ping)
    
    # Calculate time inside geofence
    if len(inside_pings) >= 2:
        # Sort by timestamp
        inside_pings_sorted = sorted(inside_pings, key=lambda x: x.get('timestamp', ''))
        
        first_inside = inside_pings_sorted[0].get('timestamp')
        last_inside = inside_pings_sorted[-1].get('timestamp')
        
        if first_inside and last_inside:
            try:
                first_time = datetime.fromisoformat(first_inside.replace('Z', '+00:00'))
                last_time = datetime.fromisoformat(last_inside.replace('Z', '+00:00'))
                total_hours = (last_time - first_time).total_seconds() / 3600
            except:
                total_hours = len(inside_pings) * 0.5  # Assume 30 min between pings
        else:
            total_hours = len(inside_pings) * 0.5
    else:
        total_hours = 0
    
    return {
        'total_pings': len(gps_pings),
        'inside_geofence_count': len(inside_pings),
        'outside_geofence_count': len(outside_pings),
        'inside_percentage': round((len(inside_pings) / max(len(gps_pings), 1)) * 100, 2),
        'calculated_detention_hours': round(total_hours, 2),
        'first_inside_timestamp': inside_pings[0].get('timestamp') if inside_pings else None,
        'last_inside_timestamp': inside_pings[-1].get('timestamp') if inside_pings else None
    }


def validate_detention_claim(
    invoice_detention_hours: float,
    gps_pings: List[Dict],
    geofence: Dict,
    tolerance_hours: float = 0.5
) -> Dict:
    """
    Validate a detention claim against GPS data.
    
    Args:
        invoice_detention_hours: Hours claimed on invoice
        gps_pings: GPS ping data
        geofence: Factory geofence definition
        tolerance_hours: Acceptable difference (default 30 mins)
    
    Returns:
        Validation result with recommendation
    """
    detention_analysis = calculate_detention_hours(gps_pings, geofence)
    gps_hours = detention_analysis['calculated_detention_hours']
    
    difference = invoice_detention_hours - gps_hours
    
    if difference <= tolerance_hours:
        recommendation = 'APPROVE'
        risk_level = 'LOW'
        message = f"Detention claim validated. GPS shows {gps_hours:.1f} hours, claim is {invoice_detention_hours:.1f} hours."
    elif difference <= tolerance_hours * 2:
        recommendation = 'REVIEW'
        risk_level = 'MEDIUM'
        message = f"Minor discrepancy. GPS shows {gps_hours:.1f} hours, claim is {invoice_detention_hours:.1f} hours ({difference:.1f}h difference)."
    else:
        recommendation = 'REJECT'
        risk_level = 'HIGH'
        message = f"Detention over-claimed. GPS shows only {gps_hours:.1f} hours, but claim is {invoice_detention_hours:.1f} hours ({difference:.1f}h excess)."
    
    return {
        'invoice_detention_hours': invoice_detention_hours,
        'gps_detention_hours': gps_hours,
        'difference_hours': round(difference, 2),
        'recommendation': recommendation,
        'risk_level': risk_level,
        'message': message,
        'analysis': detention_analysis,
        'validation_timestamp': datetime.now().isoformat()
    }


# Demo Data: Factory Geofences
DEMO_GEOFENCES = {
    'hitachi_pune': {
        'name': 'Hitachi Pune Factory',
        'type': 'polygon',
        'vertices': [
            (18.5204, 73.8567),  # NW corner
            (18.5204, 73.8617),  # NE corner
            (18.5154, 73.8617),  # SE corner
            (18.5154, 73.8567),  # SW corner
        ],
        'address': 'Hinjewadi Phase 2, Pune, Maharashtra'
    },
    'hitachi_bangalore': {
        'name': 'Hitachi Bangalore Warehouse',
        'type': 'circle',
        'center': (12.9716, 77.5946),
        'radius_km': 0.5,
        'address': 'Electronic City, Bangalore, Karnataka'
    },
    'hitachi_chennai': {
        'name': 'Hitachi Chennai Hub',
        'type': 'circle',
        'center': (13.0827, 80.2707),
        'radius_km': 0.4,
        'address': 'Ambattur Industrial Estate, Chennai, Tamil Nadu'
    }
}


def generate_demo_gps_pings(
    geofence_id: str,
    start_time: datetime,
    detention_hours: float,
    inside_ratio: float = 0.9
) -> List[Dict]:
    """
    Generate demo GPS pings for a truck at a factory.
    
    Args:
        geofence_id: ID of the geofence
        start_time: When truck arrived
        detention_hours: How many hours truck was there
        inside_ratio: What percentage of pings should be inside geofence
    """
    if geofence_id not in DEMO_GEOFENCES:
        return []
    
    geofence = DEMO_GEOFENCES[geofence_id]
    pings = []
    
    # Generate one ping every 30 minutes
    ping_count = int(detention_hours * 2) + 1
    
    for i in range(ping_count):
        timestamp = start_time + timedelta(minutes=i * 30)
        
        if geofence['type'] == 'circle':
            center_lat, center_lon = geofence['center']
            
            if i / ping_count < inside_ratio:
                # Inside: small random offset
                lat = center_lat + (i % 3 - 1) * 0.001
                lon = center_lon + (i % 2 - 0.5) * 0.001
            else:
                # Outside: larger offset
                lat = center_lat + 0.01
                lon = center_lon + 0.01
        else:
            # Polygon - use center point
            vertices = geofence['vertices']
            center_lat = sum(v[0] for v in vertices) / len(vertices)
            center_lon = sum(v[1] for v in vertices) / len(vertices)
            
            if i / ping_count < inside_ratio:
                lat = center_lat + (i % 3 - 1) * 0.0005
                lon = center_lon + (i % 2 - 0.5) * 0.0005
            else:
                lat = center_lat + 0.05
                lon = center_lon + 0.05
        
        pings.append({
            'lat': round(lat, 6),
            'lon': round(lon, 6),
            'timestamp': timestamp.isoformat(),
            'vehicle_number': 'MH02AB1234',
            'speed_kmh': 0 if i / ping_count < inside_ratio else 45
        })
    
    return pings


# Demo Cases for UI
def get_demo_detention_cases() -> List[Dict]:
    """
    Get demo detention validation cases for Freight Audit tab.
    """
    base_time = datetime.now() - timedelta(days=3)
    
    cases = [
        # Case 1: Valid detention claim (should APPROVE)
        {
            'invoice_number': 'TCI/2024/DET-001',
            'carrier': 'TCI Express Limited',
            'vehicle_number': 'MH02AB1234',
            'factory': 'hitachi_pune',
            'claimed_detention_hours': 6.0,
            'gps_pings': generate_demo_gps_pings('hitachi_pune', base_time, 6.5, 0.95),
            'expected_result': 'APPROVE'
        },
        # Case 2: Over-claimed detention (should REJECT)
        {
            'invoice_number': 'TCI/2024/DET-002',
            'carrier': 'TCI Express Limited',
            'vehicle_number': 'MH02CD5678',
            'factory': 'hitachi_bangalore',
            'claimed_detention_hours': 48.0,  # Claims 2 days
            'gps_pings': generate_demo_gps_pings('hitachi_bangalore', base_time, 8.0, 0.8),  # Only 8 hours
            'expected_result': 'REJECT'
        },
        # Case 3: Minor discrepancy (should REVIEW)
        {
            'invoice_number': 'BD/2024/DET-001',
            'carrier': 'Blue Dart Express Limited',
            'vehicle_number': 'DL01XY9999',
            'factory': 'hitachi_chennai',
            'claimed_detention_hours': 4.0,
            'gps_pings': generate_demo_gps_pings('hitachi_chennai', base_time, 3.0, 0.85),
            'expected_result': 'REVIEW'
        }
    ]
    
    # Add validation results
    for case in cases:
        geofence = DEMO_GEOFENCES[case['factory']]
        result = validate_detention_claim(
            case['claimed_detention_hours'],
            case['gps_pings'],
            geofence
        )
        case['validation_result'] = result
    
    return cases


# Test functions
def test_haversine():
    """Test Haversine distance calculation."""
    # Delhi to Mumbai (approx 1400 km)
    delhi = (28.6139, 77.2090)
    mumbai = (19.0760, 72.8777)
    distance = haversine_distance(delhi[0], delhi[1], mumbai[0], mumbai[1])
    print(f"Delhi to Mumbai: {distance:.2f} km (expected ~1150 km)")
    
    # Pune to Bangalore (approx 840 km)
    pune = (18.5204, 73.8567)
    bangalore = (12.9716, 77.5946)
    distance = haversine_distance(pune[0], pune[1], bangalore[0], bangalore[1])
    print(f"Pune to Bangalore: {distance:.2f} km (expected ~840 km)")


def test_point_in_polygon():
    """Test Point-in-Polygon algorithm."""
    # Hitachi Pune factory geofence
    factory_geofence = DEMO_GEOFENCES['hitachi_pune']['vertices']
    
    # Point inside
    inside_point = (18.5179, 73.8592)
    result = point_in_polygon(inside_point, factory_geofence)
    print(f"Point inside factory: {result} (expected True)")
    
    # Point outside
    outside_point = (18.5300, 73.8700)
    result = point_in_polygon(outside_point, factory_geofence)
    print(f"Point outside factory: {result} (expected False)")


def test_detention_validation():
    """Test detention validation with demo data."""
    print("\n=== DETENTION VALIDATION DEMO ===\n")
    
    cases = get_demo_detention_cases()
    
    for case in cases:
        print(f"Invoice: {case['invoice_number']}")
        print(f"  Carrier: {case['carrier']}")
        print(f"  Vehicle: {case['vehicle_number']}")
        print(f"  Factory: {DEMO_GEOFENCES[case['factory']]['name']}")
        print(f"  Claimed Hours: {case['claimed_detention_hours']}")
        
        result = case['validation_result']
        print(f"  GPS Hours: {result['gps_detention_hours']}")
        print(f"  Difference: {result['difference_hours']}h")
        print(f"  Recommendation: {result['recommendation']}")
        print(f"  Message: {result['message']}")
        print()


if __name__ == "__main__":
    test_haversine()
    print()
    test_point_in_polygon()
    test_detention_validation()
