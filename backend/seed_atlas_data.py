"""
Atlas Master Data Seeder
=========================
Populates master tables with sample data for testing.

Run this after executing schema_atlas_advanced.sql
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.atlas_master_service import get_master_service
from datetime import date, timedelta

def seed_carriers():
    """Seed sample carriers"""
    master = get_master_service()
    
    carriers = [
        {
            'carrier_code': 'TCI001',
            'carrier_name': 'TCI Express',
            'gstin': '27AAACT2727Q1ZV',
            'pan': 'AAACT2727Q',
            'contact_person': 'Rajesh Kumar',
            'contact_phone': '+91-22-1234-5678',
            'contact_email': 'ops@tciexpress.in',
            'rating': 4.5,
            'is_active': True
        },
        {
            'carrier_code': 'VRL001',
            'carrier_name': 'VRL Logistics',
            'gstin': '29AABCV5738L1Z4',
            'pan': 'AABCV5738L',
            'contact_person': 'Vijay Sankeshwar',
            'contact_phone': '+91-80-9876-5432',
            'contact_email': 'contact@vrllogistics.com',
            'rating': 4.7,
            'is_active': True
        },
        {
            'carrier_code': 'BDART001',
            'carrier_name': 'Blue Dart',
            'gstin': '27AABCB4640A1Z9',
            'pan': 'AABCB4640A',
            'contact_person': 'Anil Sharma',
            'contact_phone': '+91-22-4567-8901',
            'contact_email': 'bluedart@example.com',
            'rating': 4.8,
            'is_active': True
        },
        {
            'carrier_code': 'GATI001',
            'carrier_name': 'Gati Limited',
            'gstin': '36AABCG7654M1ZE',
            'pan': 'AABCG7654M',
            'contact_person': 'Mahendra Agarwal',
            'contact_phone': '+91-40-6543-2109',
            'contact_email': 'gati@example.com',
            'rating': 4.2,
            'is_active': True
        },
        {
            'carrier_code': 'ABC001',
            'carrier_name': 'ABC Transport Solutions',
            'gstin': '19AABCA1234B1Z0',
            'pan': 'AABCA1234B',
            'contact_person': 'Suresh Patil',
            'contact_phone': '+91-20-3456-7890',
            'contact_email': 'abc@example.com',
            'rating': 3.9,
            'is_active': True
        }
    ]
    
    print("[Seeder] Adding carriers...")
    for carrier in carriers:
        master.add_carrier(carrier)
    print(f"[Seeder] ✅ Added {len(carriers)} carriers")


def seed_routes():
    """Seed sample routes"""
    master = get_master_service()
    
    routes = [
        {'route_code': 'PUNE-DELHI', 'origin': 'Pune', 'destination': 'Delhi', 
         'distance_km': 1420, 'direction': 'HEAD_HAUL', 'zone': 'NORTH', 'estimated_transit_days': 4},
        
        {'route_code': 'DELHI-PUNE', 'origin': 'Delhi', 'destination': 'Pune', 
         'distance_km': 1420, 'direction': 'BACK_HAUL', 'zone': 'NORTH', 'estimated_transit_days': 4},
        
        {'route_code': 'MUMBAI-BANGALORE', 'origin': 'Mumbai', 'destination': 'Bangalore', 
         'distance_km': 980, 'direction': 'HEAD_HAUL', 'zone': 'SOUTH', 'estimated_transit_days': 3},
        
        {'route_code': 'BANGALORE-MUMBAI', 'origin': 'Bangalore', 'destination': 'Mumbai', 
         'distance_km': 980, 'direction': 'BACK_HAUL', 'zone': 'SOUTH', 'estimated_transit_days': 3},
        
        {'route_code': 'CHENNAI-KOLKATA', 'origin': 'Chennai', 'destination': 'Kolkata', 
         'distance_km': 1660, 'direction': 'HEAD_HAUL', 'zone': 'EAST', 'estimated_transit_days': 5},
        
        {'route_code': 'PUNE-MUMBAI', 'origin': 'Pune', 'destination': 'Mumbai', 
         'distance_km': 150, 'direction': 'HEAD_HAUL', 'zone': 'WEST', 'estimated_transit_days': 1},
        
        {'route_code': 'MUMBAI-PUNE', 'origin': 'Mumbai', 'destination': 'Pune', 
         'distance_km': 150, 'direction': 'BACK_HAUL', 'zone': 'WEST', 'estimated_transit_days': 1},
        
        {'route_code': 'DELHI-MUMBAI', 'origin': 'Delhi', 'destination': 'Mumbai', 
         'distance_km': 1400, 'direction': 'HEAD_HAUL', 'zone': 'WEST', 'estimated_transit_days': 4},
        
        {'route_code': 'HYDERABAD-PUNE', 'origin': 'Hyderabad', 'destination': 'Pune', 
         'distance_km': 565, 'direction': 'HEAD_HAUL', 'zone': 'CENTRAL', 'estimated_transit_days': 2},
        
        {'route_code': 'PUNE-HYDERABAD', 'origin': 'Pune', 'destination': 'Hyderabad', 
         'distance_km': 565, 'direction': 'BACK_HAUL', 'zone': 'CENTRAL', 'estimated_transit_days': 2}
    ]
    
    print("[Seeder] Adding routes...")
    for route in routes:
        route['is_active'] = True
        master.add_route(route)
    print(f"[Seeder] ✅ Added {len(routes)} routes")


def seed_fuel_prices():
    """Seed 90 days of fuel prices"""
    master = get_master_service()
    
    print("[Seeder] Adding fuel prices (90 days)...")
    
    # Start from 90 days ago
    start_date = date.today() - timedelta(days=90)
    base_price = 95.50  # Starting diesel price
    
    for day in range(91):
        current_date = start_date + timedelta(days=day)
        
        # Simulate price fluctuation (±2 rupees)
        import random
        price_variation = random.uniform(-2.0, 2.0)
        diesel_price = round(base_price + price_variation, 2)
        
        master.add_fuel_price({
            'effective_date': current_date,
            'diesel_price_per_liter': diesel_price,
            'city': 'NATIONAL',
            'source': 'MANUAL'
        })
    
    print(f"[Seeder] ✅ Added 91 fuel price entries")


def seed_rate_cards():
    """Seed sample rate cards"""
    master = get_master_service()
    
    # First, fetch carriers and routes to get IDs
    carriers = master.get_all_carriers()
    
    print("[Seeder] Adding rate cards...")
    rate_count = 0
    
    # Get routes
    from services.postgres_helper import get_postgres_connection, get_dict_cursor
    conn = get_postgres_connection()
    cursor = get_dict_cursor(conn)
    cursor.execute("SELECT * FROM route_master WHERE is_active = TRUE")
    routes = [dict(row) for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    
    # Create some rate cards
    # TCI Express - Pune to Delhi (12W truck)
    if carriers and routes:
        for route in routes[:5]:  # First 5 routes
            for carrier in carriers[:3]:  # First 3 carriers
                rate_card = {
                    'carrier_id': carrier['id'],
                    'route_id': route['id'],
                    'vehicle_type': '12W',
                    'base_rate': 25000.00,  # Base rate for the route
                    'rate_unit': 'PER_TRIP',
                    'fuel_inclusive': False,
                    'detention_free_hours': 24,
                    'detention_per_hour': 500.00,
                    'handling_inclusive': True,
                    'valid_from': date(2024, 1, 1),
                    'valid_to': date(2024, 12, 31),
                    'is_active': True
                }
                master.add_rate_card(rate_card)
                rate_count += 1
    
    print(f"[Seeder] ✅ Added {rate_count} rate cards")


def run_seeder():
    """Run all seeders"""
    print("=" * 60)
    print("Atlas Master Data Seeder")
    print("=" * 60)
    
    try:
        seed_carriers()
        seed_routes()
        seed_fuel_prices()
        seed_rate_cards()
        
        print("\n" + "=" * 60)
        print("✅ Seeding Complete!")
        print("=" * 60)
        print("\nYou can now:")
        print("1. Test master data APIs:")
        print("   GET http://localhost:5000/api/master/carriers")
        print("   GET http://localhost:5000/api/master/routes/lookup?origin=Pune&destination=Delhi")
        print("   GET http://localhost:5000/api/master/fuel-prices?date=2024-12-01")
        print("\n2. Try bulk invoice upload:")
        print("   POST http://localhost:5000/api/invoices/bulk-upload")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_seeder()
