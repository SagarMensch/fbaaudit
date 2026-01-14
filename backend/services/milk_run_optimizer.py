"""
Milk Run Optimizer - K-Means Clustering
Clusters nearby delivery points to suggest consolidating multiple LTL shipments
into single full truckloads for cost savings.

The Pain Point: Booking 3 separate small trucks for 3 nearby cities costs a fortune.
The Solution: "Combine these 3 loads into one 32ft Truck. Save ₹18,500."

Algorithm:
1. Collect all pending orders for the day with lat/long coordinates
2. Apply K-Means clustering based on geographic proximity
3. For each cluster, check if Total Weight < Truck Capacity
4. Calculate cost savings from consolidation
5. Suggest optimal "Milk Run" routes
"""

import math
from datetime import datetime, date
from typing import Dict, List, Optional, Tuple
import random

# =============================================================================
# GEOGRAPHIC DATA - INDIAN CITIES WITH COORDINATES
# =============================================================================

CITY_COORDINATES = {
    # Maharashtra
    "Mumbai": (19.0760, 72.8777),
    "Pune": (18.5204, 73.8567),
    "Nagpur": (21.1458, 79.0882),
    "Nashik": (19.9975, 73.7898),
    "Aurangabad": (19.8762, 75.3433),
    "Kolhapur": (16.7050, 74.2433),
    "Thane": (19.2183, 72.9781),
    "Navi Mumbai": (19.0330, 73.0297),
    
    # Gujarat
    "Ahmedabad": (23.0225, 72.5714),
    "Surat": (21.1702, 72.8311),
    "Vadodara": (22.3072, 73.1812),
    "Rajkot": (22.3039, 70.8022),
    
    # Delhi NCR
    "Delhi": (28.7041, 77.1025),
    "Gurgaon": (28.4595, 77.0266),
    "Noida": (28.5355, 77.3910),
    "Faridabad": (28.4089, 77.3178),
    "Ghaziabad": (28.6692, 77.4538),
    
    # Karnataka
    "Bangalore": (12.9716, 77.5946),
    "Mysore": (12.2958, 76.6394),
    "Hubli": (15.3647, 75.1240),
    "Mangalore": (12.9141, 74.8560),
    
    # Tamil Nadu
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Salem": (11.6643, 78.1460),
    
    # Others
    "Hyderabad": (17.3850, 78.4867),
    "Kolkata": (22.5726, 88.3639),
    "Jaipur": (26.9124, 75.7873),
    "Lucknow": (26.8467, 80.9462),
    "Chandigarh": (30.7333, 76.7794),
    "Indore": (22.7196, 75.8577),
}

# =============================================================================
# TRUCK CONFIGURATIONS
# =============================================================================

TRUCK_TYPES = {
    "TATA_ACE": {
        "name": "Tata Ace",
        "capacity_kg": 750,
        "cost_per_km": 8,
        "fixed_cost": 500,
        "icon": "mini"
    },
    "EICHER_14FT": {
        "name": "Eicher 14ft",
        "capacity_kg": 4000,
        "cost_per_km": 18,
        "fixed_cost": 1500,
        "icon": "medium"
    },
    "TATA_22FT": {
        "name": "Tata 22ft",
        "capacity_kg": 7000,
        "cost_per_km": 25,
        "fixed_cost": 2500,
        "icon": "large"
    },
    "32FT_MXL": {
        "name": "32ft MXL Container",
        "capacity_kg": 15000,
        "cost_per_km": 32,
        "fixed_cost": 4000,
        "icon": "xlarge"
    },
    "40FT_TRAILER": {
        "name": "40ft Trailer",
        "capacity_kg": 25000,
        "cost_per_km": 45,
        "fixed_cost": 6000,
        "icon": "trailer"
    }
}

# =============================================================================
# SAMPLE PENDING ORDERS
# =============================================================================

def get_sample_pending_orders() -> List[Dict]:
    """Generate sample pending orders for demonstration."""
    return [
        # Cluster 1: Mumbai region
        {
            "order_id": "ORD-2024-001",
            "origin": "Mumbai",
            "destination": "Pune",
            "weight_kg": 800,
            "value_inr": 45000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        {
            "order_id": "ORD-2024-002",
            "origin": "Mumbai",
            "destination": "Nashik",
            "weight_kg": 1200,
            "value_inr": 65000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        {
            "order_id": "ORD-2024-003",
            "origin": "Mumbai",
            "destination": "Thane",
            "weight_kg": 500,
            "value_inr": 28000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        
        # Cluster 2: Delhi NCR
        {
            "order_id": "ORD-2024-004",
            "origin": "Delhi",
            "destination": "Gurgaon",
            "weight_kg": 2000,
            "value_inr": 95000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        {
            "order_id": "ORD-2024-005",
            "origin": "Delhi",
            "destination": "Noida",
            "weight_kg": 1500,
            "value_inr": 72000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        {
            "order_id": "ORD-2024-006",
            "origin": "Delhi",
            "destination": "Faridabad",
            "weight_kg": 900,
            "value_inr": 42000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        
        # Cluster 3: South India
        {
            "order_id": "ORD-2024-007",
            "origin": "Bangalore",
            "destination": "Mysore",
            "weight_kg": 3000,
            "value_inr": 125000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        {
            "order_id": "ORD-2024-008",
            "origin": "Bangalore",
            "destination": "Chennai",
            "weight_kg": 2500,
            "value_inr": 110000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        
        # Standalone orders
        {
            "order_id": "ORD-2024-009",
            "origin": "Ahmedabad",
            "destination": "Surat",
            "weight_kg": 4500,
            "value_inr": 180000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
        {
            "order_id": "ORD-2024-010",
            "origin": "Hyderabad",
            "destination": "Bangalore",
            "weight_kg": 6000,
            "value_inr": 250000,
            "pickup_date": "2024-12-30",
            "status": "PENDING"
        },
    ]


# =============================================================================
# HAVERSINE DISTANCE CALCULATION
# =============================================================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points in kilometers.
    Using the Haversine formula.
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def get_city_distance(city1: str, city2: str) -> float:
    """Get distance between two cities in km."""
    coords1 = CITY_COORDINATES.get(city1)
    coords2 = CITY_COORDINATES.get(city2)
    
    if not coords1 or not coords2:
        return 500  # Default for unknown cities
    
    return haversine_distance(coords1[0], coords1[1], coords2[0], coords2[1])


# =============================================================================
# K-MEANS CLUSTERING (SIMPLIFIED)
# =============================================================================

def calculate_cluster_centroid(orders: List[Dict]) -> Tuple[float, float]:
    """Calculate the geographic centroid of a cluster of orders."""
    if not orders:
        return (0, 0)
    
    total_lat = 0
    total_lon = 0
    count = 0
    
    for order in orders:
        # Use destination coordinates
        dest = order.get("destination")
        coords = CITY_COORDINATES.get(dest)
        if coords:
            total_lat += coords[0]
            total_lon += coords[1]
            count += 1
    
    if count == 0:
        return (0, 0)
    
    return (total_lat / count, total_lon / count)


def assign_order_to_cluster(order: Dict, centroids: List[Tuple[float, float]]) -> int:
    """Assign an order to the nearest cluster based on destination."""
    dest = order.get("destination")
    dest_coords = CITY_COORDINATES.get(dest, (0, 0))
    
    min_dist = float('inf')
    best_cluster = 0
    
    for i, centroid in enumerate(centroids):
        dist = haversine_distance(dest_coords[0], dest_coords[1], centroid[0], centroid[1])
        if dist < min_dist:
            min_dist = dist
            best_cluster = i
    
    return best_cluster


def kmeans_cluster_orders(
    orders: List[Dict],
    n_clusters: int = 3,
    max_iterations: int = 10
) -> List[List[Dict]]:
    """
    Apply K-Means clustering to group orders by geographic proximity.
    
    Args:
        orders: List of pending orders
        n_clusters: Number of clusters (default: 3)
        max_iterations: Maximum iterations for convergence
    
    Returns:
        List of clusters, where each cluster is a list of orders
    """
    if len(orders) <= n_clusters:
        # Each order is its own cluster if few orders
        return [[order] for order in orders]
    
    # Initialize centroids using first n_clusters orders
    centroids = []
    for i in range(min(n_clusters, len(orders))):
        dest = orders[i].get("destination")
        coords = CITY_COORDINATES.get(dest, (19.0, 73.0))
        centroids.append(coords)
    
    # K-Means iterations
    for _ in range(max_iterations):
        # Assign orders to clusters
        clusters = [[] for _ in range(n_clusters)]
        
        for order in orders:
            cluster_idx = assign_order_to_cluster(order, centroids)
            clusters[cluster_idx].append(order)
        
        # Update centroids
        new_centroids = []
        for cluster in clusters:
            if cluster:
                new_centroids.append(calculate_cluster_centroid(cluster))
            else:
                # Keep old centroid if cluster is empty
                new_centroids.append(centroids[len(new_centroids)] if len(new_centroids) < len(centroids) else (19.0, 73.0))
        
        # Check convergence
        if new_centroids == centroids:
            break
        
        centroids = new_centroids
    
    # Remove empty clusters
    return [c for c in clusters if c]


# =============================================================================
# MILK RUN OPTIMIZATION
# =============================================================================

def select_optimal_truck(total_weight_kg: float) -> Dict:
    """Select the smallest truck that can handle the load."""
    for truck_id, truck in sorted(TRUCK_TYPES.items(), key=lambda x: x[1]["capacity_kg"]):
        if truck["capacity_kg"] >= total_weight_kg:
            return {"id": truck_id, **truck}
    
    # If no single truck fits, return largest
    return {"id": "40FT_TRAILER", **TRUCK_TYPES["40FT_TRAILER"]}


def calculate_individual_costs(orders: List[Dict]) -> float:
    """Calculate total cost if each order is shipped individually."""
    total_cost = 0
    
    for order in orders:
        weight = order.get("weight_kg", 1000)
        origin = order.get("origin")
        dest = order.get("destination")
        distance = get_city_distance(origin, dest)
        
        # Select smallest truck for individual order
        truck = select_optimal_truck(weight)
        cost = truck["fixed_cost"] + (distance * truck["cost_per_km"])
        total_cost += cost
    
    return total_cost


def calculate_milkrun_cost(orders: List[Dict]) -> Tuple[float, Dict]:
    """Calculate cost for a consolidated milk run."""
    if not orders:
        return 0, {}
    
    total_weight = sum(o.get("weight_kg", 0) for o in orders)
    truck = select_optimal_truck(total_weight)
    
    # Calculate total route distance
    # Simple: sum of distances from origin to each destination
    origin = orders[0].get("origin")
    destinations = [o.get("destination") for o in orders]
    
    total_distance = 0
    current_location = origin
    
    for dest in destinations:
        total_distance += get_city_distance(current_location, dest)
        current_location = dest
    
    # Add return distance
    total_distance += get_city_distance(current_location, origin)
    
    cost = truck["fixed_cost"] + (total_distance * truck["cost_per_km"])
    
    return cost, {
        "truck": truck,
        "total_distance_km": round(total_distance, 1),
        "total_weight_kg": total_weight,
        "capacity_utilization": round((total_weight / truck["capacity_kg"]) * 100, 1)
    }


def optimize_milk_runs(
    orders: Optional[List[Dict]] = None,
    max_clusters: int = 5
) -> Dict:
    """
    Optimize pending orders into milk run clusters.
    
    Args:
        orders: List of pending orders (uses sample data if None)
        max_clusters: Maximum number of clusters
    
    Returns:
        Optimization result with suggested milk runs and savings
    """
    if orders is None:
        orders = get_sample_pending_orders()
    
    if not orders:
        return {
            "success": False,
            "error": "No pending orders to optimize",
            "milk_runs": [],
            "total_savings": 0
        }
    
    # Determine optimal number of clusters
    n_clusters = min(max_clusters, max(1, len(orders) // 2))
    
    # Apply K-Means clustering
    clusters = kmeans_cluster_orders(orders, n_clusters)
    
    # Analyze each cluster
    milk_runs = []
    total_individual_cost = 0
    total_milkrun_cost = 0
    
    for i, cluster in enumerate(clusters):
        if not cluster:
            continue
        
        # Calculate costs
        individual_cost = calculate_individual_costs(cluster)
        milkrun_cost, milkrun_details = calculate_milkrun_cost(cluster)
        savings = individual_cost - milkrun_cost
        savings_percent = (savings / individual_cost * 100) if individual_cost > 0 else 0
        
        total_individual_cost += individual_cost
        total_milkrun_cost += milkrun_cost
        
        # Get cluster cities
        destinations = list(set(o.get("destination") for o in cluster))
        origin = cluster[0].get("origin")
        
        milk_run = {
            "cluster_id": i + 1,
            "cluster_name": f"Milk Run {i + 1}: {origin} Hub",
            "origin": origin,
            "destinations": destinations,
            "orders": [
                {
                    "order_id": o.get("order_id"),
                    "destination": o.get("destination"),
                    "weight_kg": o.get("weight_kg"),
                    "value_inr": o.get("value_inr")
                }
                for o in cluster
            ],
            "total_orders": len(cluster),
            "total_weight_kg": sum(o.get("weight_kg", 0) for o in cluster),
            "total_value_inr": sum(o.get("value_inr", 0) for o in cluster),
            
            # Costs
            "individual_shipping_cost": round(individual_cost),
            "consolidated_cost": round(milkrun_cost),
            "savings_inr": round(savings),
            "savings_percent": round(savings_percent, 1),
            
            # Truck details
            "recommended_truck": milkrun_details.get("truck", {}).get("name"),
            "truck_capacity_kg": milkrun_details.get("truck", {}).get("capacity_kg"),
            "capacity_utilization": milkrun_details.get("capacity_utilization"),
            "total_distance_km": milkrun_details.get("total_distance_km"),
            
            # Route
            "route": [origin] + destinations,
            
            # Recommendation
            "is_recommended": savings_percent >= 15 and len(cluster) >= 2
        }
        
        milk_runs.append(milk_run)
    
    # Calculate total savings
    total_savings = total_individual_cost - total_milkrun_cost
    total_savings_percent = (total_savings / total_individual_cost * 100) if total_individual_cost > 0 else 0
    
    return {
        "success": True,
        "optimization_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "algorithm": "K-Means Clustering",
        
        "summary": {
            "total_orders": len(orders),
            "milk_runs_created": len(milk_runs),
            "total_individual_cost": round(total_individual_cost),
            "total_consolidated_cost": round(total_milkrun_cost),
            "total_savings_inr": round(total_savings),
            "total_savings_percent": round(total_savings_percent, 1)
        },
        
        "milk_runs": sorted(milk_runs, key=lambda x: x["savings_inr"], reverse=True),
        
        "recommendation": f"Consolidating {len(orders)} orders into {len(milk_runs)} milk runs saves ₹{round(total_savings):,} ({round(total_savings_percent, 1)}%)"
    }


def get_demo_optimization() -> Dict:
    """Get demo milk run optimization for UI display."""
    return optimize_milk_runs()


# =============================================================================
# TEST
# =============================================================================

def test_optimizer():
    """Test the milk run optimizer."""
    print("\n" + "="*70)
    print("MILK RUN OPTIMIZER - K-MEANS CLUSTERING TEST")
    print("="*70)
    
    result = optimize_milk_runs()
    
    print(f"\nOptimization Date: {result['optimization_date']}")
    print(f"Algorithm: {result['algorithm']}")
    
    summary = result["summary"]
    print(f"\nSummary:")
    print(f"  Total Orders: {summary['total_orders']}")
    print(f"  Milk Runs Created: {summary['milk_runs_created']}")
    print(f"  Individual Cost: ₹{summary['total_individual_cost']:,}")
    print(f"  Consolidated Cost: ₹{summary['total_consolidated_cost']:,}")
    print(f"  TOTAL SAVINGS: ₹{summary['total_savings_inr']:,} ({summary['total_savings_percent']}%)")
    
    print(f"\nRecommendation: {result['recommendation']}")
    
    print("\n" + "-"*70)
    print("MILK RUNS:")
    
    for mr in result["milk_runs"]:
        print(f"\n{mr['cluster_name']}")
        print(f"  Route: {' → '.join(mr['route'])}")
        print(f"  Orders: {mr['total_orders']}, Weight: {mr['total_weight_kg']} kg")
        print(f"  Truck: {mr['recommended_truck']} ({mr['capacity_utilization']}% utilized)")
        print(f"  Savings: ₹{mr['savings_inr']:,} ({mr['savings_percent']}%)")
        print(f"  Recommended: {'✓ YES' if mr['is_recommended'] else '✗ NO'}")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    test_optimizer()
