"""
Contract Master Data Seeder for Supabase PostgreSQL
====================================================
Creates realistic contracts, vendors, and freight rates for Indian logistics.
Run this script to populate the Contract Master with real-looking data.
"""

import psycopg2
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import uuid
import json
import random

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

# Indian Major Suppliers with realistic details
SUPPLIERS = [
    {
        "id": "tci-express",
        "name": "TCI Express Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCT1234B",
        "gstin": "06AABCT1234B1Z5",
        "contact_name": "Rajesh Sharma",
        "contact_email": "rajesh.sharma@tciexpress.in",
        "contact_phone": "+91-9876543210",
        "address": "TCI House, 69 Institutional Area, Sector 32",
        "city": "Gurgaon",
        "state": "Haryana",
        "pincode": "122001",
        "bank_name": "HDFC Bank",
        "bank_account": "50100123456789",
        "ifsc_code": "HDFC0001234",
        "performance_grade": "A",
    },
    {
        "id": "bluedart-dhl",
        "name": "Blue Dart Express Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCB5678D",
        "gstin": "27AABCB5678D1ZP",
        "contact_name": "Priya Menon",
        "contact_email": "priya.menon@bluedart.com",
        "contact_phone": "+91-9988776655",
        "address": "Blue Dart Centre, Sahar Airport Road",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400099",
        "bank_name": "ICICI Bank",
        "bank_account": "012345678901",
        "ifsc_code": "ICIC0001234",
        "performance_grade": "A+",
    },
    {
        "id": "mahindra-logistics",
        "name": "Mahindra Logistics Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCM9012E",
        "gstin": "27AABCM9012E1ZQ",
        "contact_name": "Vikram Singh",
        "contact_email": "vikram.singh@mahindra.com",
        "contact_phone": "+91-9112233445",
        "address": "Mahindra Towers, Worli",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400030",
        "bank_name": "Axis Bank",
        "bank_account": "920020012345678",
        "ifsc_code": "UTIB0001234",
        "performance_grade": "A",
    },
    {
        "id": "vrl-logistics",
        "name": "VRL Logistics Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCV3456F",
        "gstin": "29AABCV3456F1ZR",
        "contact_name": "Suresh Patil",
        "contact_email": "suresh.patil@vrllogistics.com",
        "contact_phone": "+91-9556677889",
        "address": "VRL House, RS No. 387, Varur",
        "city": "Hubli",
        "state": "Karnataka",
        "pincode": "580024",
        "bank_name": "State Bank of India",
        "bank_account": "32012345678",
        "ifsc_code": "SBIN0001234",
        "performance_grade": "B+",
    },
    {
        "id": "gati-logistics",
        "name": "Gati-KWE Pvt. Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCG7890H",
        "gstin": "36AABCG7890H1ZS",
        "contact_name": "Anita Reddy",
        "contact_email": "anita.reddy@gati.com",
        "contact_phone": "+91-9223344556",
        "address": "Gati House, Plot 20, Kondapur",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500084",
        "bank_name": "Kotak Mahindra Bank",
        "bank_account": "4011234567890",
        "ifsc_code": "KKBK0001234",
        "performance_grade": "B",
    },
    {
        "id": "safexpress",
        "name": "Safexpress Pvt. Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCS1122I",
        "gstin": "07AABCS1122I1ZT",
        "contact_name": "Amit Gupta",
        "contact_email": "amit.gupta@safexpress.com",
        "contact_phone": "+91-9334455667",
        "address": "Tower C, Logix Business Park",
        "city": "Noida",
        "state": "Uttar Pradesh",
        "pincode": "201301",
        "bank_name": "Yes Bank",
        "bank_account": "001234567890",
        "ifsc_code": "YESB0001234",
        "performance_grade": "A",
    },
    {
        "id": "delhivery",
        "name": "Delhivery Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCD3344J",
        "gstin": "06AABCD3344J1ZU",
        "contact_name": "Neha Kapoor",
        "contact_email": "neha.kapoor@delhivery.com",
        "contact_phone": "+91-9445566778",
        "address": "Building 5, Tower B, DLF Cyber City",
        "city": "Gurgaon",
        "state": "Haryana",
        "pincode": "122002",
        "bank_name": "HDFC Bank",
        "bank_account": "50100987654321",
        "ifsc_code": "HDFC0005678",
        "performance_grade": "A",
    },
    {
        "id": "allcargo-logistics",
        "name": "Allcargo Logistics Ltd.",
        "type": "TRANSPORTER",
        "pan": "AABCA5566K",
        "gstin": "27AABCA5566K1ZV",
        "contact_name": "Karan Mehta",
        "contact_email": "karan.mehta@allcargologistics.com",
        "contact_phone": "+91-9667788990",
        "address": "Avvashya House, Chakala",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400093",
        "bank_name": "IndusInd Bank",
        "bank_account": "201234567890",
        "ifsc_code": "INDB0001234",
        "performance_grade": "B+",
    },
]

# Common routes in India with realistic rates
ROUTES = [
    {"origin": "Mumbai", "destination": "Delhi", "distance_km": 1400, "base_32ft": 45000, "transit_hrs": 36},
    {"origin": "Mumbai", "destination": "Bangalore", "distance_km": 980, "base_32ft": 32000, "transit_hrs": 24},
    {"origin": "Mumbai", "destination": "Chennai", "distance_km": 1330, "base_32ft": 42000, "transit_hrs": 30},
    {"origin": "Mumbai", "destination": "Kolkata", "distance_km": 1960, "base_32ft": 58000, "transit_hrs": 48},
    {"origin": "Mumbai", "destination": "Ahmedabad", "distance_km": 525, "base_32ft": 18000, "transit_hrs": 12},
    {"origin": "Delhi", "destination": "Mumbai", "distance_km": 1400, "base_32ft": 44000, "transit_hrs": 36},
    {"origin": "Delhi", "destination": "Kolkata", "distance_km": 1530, "base_32ft": 48000, "transit_hrs": 40},
    {"origin": "Delhi", "destination": "Chennai", "distance_km": 2180, "base_32ft": 65000, "transit_hrs": 52},
    {"origin": "Delhi", "destination": "Bangalore", "distance_km": 2150, "base_32ft": 64000, "transit_hrs": 50},
    {"origin": "Delhi", "destination": "Jaipur", "distance_km": 280, "base_32ft": 12000, "transit_hrs": 6},
    {"origin": "Bangalore", "destination": "Chennai", "distance_km": 350, "base_32ft": 14000, "transit_hrs": 8},
    {"origin": "Bangalore", "destination": "Hyderabad", "distance_km": 570, "base_32ft": 22000, "transit_hrs": 12},
    {"origin": "Chennai", "destination": "Hyderabad", "distance_km": 630, "base_32ft": 24000, "transit_hrs": 14},
    {"origin": "Hyderabad", "destination": "Mumbai", "distance_km": 710, "base_32ft": 28000, "transit_hrs": 16},
    {"origin": "Pune", "destination": "Mumbai", "distance_km": 150, "base_32ft": 8000, "transit_hrs": 4},
    {"origin": "Pune", "destination": "Bangalore", "distance_km": 840, "base_32ft": 30000, "transit_hrs": 20},
    {"origin": "Ahmedabad", "destination": "Delhi", "distance_km": 940, "base_32ft": 35000, "transit_hrs": 24},
    {"origin": "Ludhiana", "destination": "Mumbai", "distance_km": 1550, "base_32ft": 52000, "transit_hrs": 42},
    {"origin": "Kolkata", "destination": "Chennai", "distance_km": 1670, "base_32ft": 50000, "transit_hrs": 44},
    {"origin": "Gurgaon", "destination": "Bangalore", "distance_km": 2100, "base_32ft": 62000, "transit_hrs": 48},
]

# Vehicle types with capacity and rate multipliers
VEHICLE_TYPES = [
    {"type": "14ft Container", "capacity_ton": 3.0, "rate_multiplier": 0.45},
    {"type": "17ft Container", "capacity_ton": 5.0, "rate_multiplier": 0.55},
    {"type": "19ft Container", "capacity_ton": 7.0, "rate_multiplier": 0.70},
    {"type": "22ft Container", "capacity_ton": 9.0, "rate_multiplier": 0.85},
    {"type": "32ft SXL", "capacity_ton": 15.0, "rate_multiplier": 1.0},
    {"type": "32ft MXL", "capacity_ton": 18.0, "rate_multiplier": 1.10},
    {"type": "40ft HQ", "capacity_ton": 25.0, "rate_multiplier": 1.35},
    {"type": "Trailer 40ft", "capacity_ton": 28.0, "rate_multiplier": 1.50},
]

# Accessorial charges template
ACCESSORIALS_TEMPLATE = {
    "loading_charges": 500,
    "unloading_charges": 500,
    "detention_per_hour": 250,
    "overnight_halt": 1500,
    "multi_point_delivery": 2000,
    "pod_charges": 100,
    "insurance_percent": 0.1,
    "handling_fragile": 1000,
}


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def clear_existing_data(cur):
    """Clear existing data before seeding"""
    print("🗑️  Clearing existing data...")
    cur.execute("DELETE FROM freight_rates")
    cur.execute("DELETE FROM contracts")
    cur.execute("DELETE FROM vendors")
    print("✅ Cleared existing data")


def seed_vendors(cur):
    """Seed vendors table"""
    print("📦 Seeding vendors...")
    for vendor in SUPPLIERS:
        cur.execute("""
            INSERT INTO vendors (id, name, type, pan, gstin, contact_name, contact_email, 
                contact_phone, address, city, state, pincode, bank_name, bank_account, 
                ifsc_code, is_active, performance_grade, onboarding_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name,
                gstin = EXCLUDED.gstin,
                performance_grade = EXCLUDED.performance_grade
        """, (
            vendor["id"], vendor["name"], vendor["type"], vendor["pan"], vendor["gstin"],
            vendor["contact_name"], vendor["contact_email"], vendor["contact_phone"],
            vendor["address"], vendor["city"], vendor["state"], vendor["pincode"],
            vendor["bank_name"], vendor["bank_account"], vendor["ifsc_code"],
            True, vendor["performance_grade"], "VERIFIED"
        ))
    print(f"✅ Seeded {len(SUPPLIERS)} vendors")


def seed_contracts(cur):
    """Seed contracts for each vendor"""
    print("📄 Seeding contracts...")
    contracts = []
    
    today = datetime.now().date()
    
    for idx, vendor in enumerate(SUPPLIERS):
        # Create 1-2 contracts per vendor with different service types
        num_contracts = random.choice([1, 2])
        service_types = ["FTL", "PTL", "Express", "Dedicated"]
        
        for i in range(num_contracts):
            contract_id = f"CTR-{vendor['id'][:3].upper()}-{2024 + i}-{str(idx + 1).zfill(3)}"
            service_type = random.choice(service_types)
            
            # Random validity period (some active, some expiring soon, some expired)
            days_offset = random.choice([-30, 0, 30, 90, 180, 365])
            valid_from = today - timedelta(days=365 + days_offset)
            valid_to = today + timedelta(days=days_offset + 365)
            
            status = "ACTIVE" if valid_to > today else "EXPIRED"
            if valid_to <= today + timedelta(days=30) and valid_to > today:
                status = "EXPIRING_SOON"
            
            # PVC (Price Variation Clause) details
            pvc_base_diesel = round(random.uniform(85, 105), 2)
            pvc_mileage = round(random.uniform(3.5, 5.5), 2)
            pvc_city = random.choice(["Delhi", "Mumbai", "Chennai", "Bangalore"])
            
            # SLA targets
            sla_otd = round(random.uniform(92, 98), 1)
            sla_pod_days = random.choice([5, 7, 10])
            
            accessorials = ACCESSORIALS_TEMPLATE.copy()
            # Add some variation
            accessorials["detention_per_hour"] = random.choice([200, 250, 300, 350])
            accessorials["overnight_halt"] = random.choice([1200, 1500, 2000])
            
            contract = {
                "id": contract_id,
                "vendor_id": vendor["id"],
                "vendor_name": vendor["name"],
                "service_type": service_type,
                "valid_from": valid_from,
                "valid_to": valid_to,
                "payment_terms": random.choice(["Net 15", "Net 30", "Net 45", "Net 60"]),
                "is_rcm_applicable": random.choice([True, False]),
                "status": status,
                "pvc_base_diesel": pvc_base_diesel,
                "pvc_mileage": pvc_mileage,
                "pvc_city": pvc_city,
                "sla_otd": sla_otd,
                "sla_pod_days": sla_pod_days,
                "accessorials": json.dumps(accessorials),
                "gst_rate": 5.0 if random.random() > 0.3 else 12.0,
            }
            contracts.append(contract)
            
            cur.execute("""
                INSERT INTO contracts (id, vendor_id, vendor_name, service_type, valid_from, valid_to,
                    payment_terms, is_rcm_applicable, status, pvc_base_diesel_price, pvc_mileage_benchmark,
                    pvc_reference_city, sla_otd_target, sla_pod_days, accessorials, gst_rate)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                contract["id"], contract["vendor_id"], contract["vendor_name"],
                contract["service_type"], contract["valid_from"], contract["valid_to"],
                contract["payment_terms"], contract["is_rcm_applicable"], contract["status"],
                contract["pvc_base_diesel"], contract["pvc_mileage"], contract["pvc_city"],
                contract["sla_otd"], contract["sla_pod_days"], contract["accessorials"],
                contract["gst_rate"]
            ))
    
    print(f"✅ Seeded {len(contracts)} contracts")
    return contracts


def seed_freight_rates(cur, contracts):
    """Seed freight rates for each contract"""
    print("🚚 Seeding freight rates...")
    total_rates = 0
    
    for contract in contracts:
        # Each contract gets 5-15 random routes
        selected_routes = random.sample(ROUTES, min(len(ROUTES), random.randint(5, 15)))
        
        for route in selected_routes:
            # Each route gets 2-4 vehicle types
            selected_vehicles = random.sample(VEHICLE_TYPES, random.randint(2, 4))
            
            for vehicle in selected_vehicles:
                rate_id = f"FR-{uuid.uuid4().hex[:8].upper()}"
                
                # Calculate rate based on base rate and vehicle multiplier
                base_rate = round(route["base_32ft"] * vehicle["rate_multiplier"], 0)
                # Add some variation (+/- 10%)
                base_rate = round(base_rate * random.uniform(0.9, 1.1), 0)
                
                min_charge = round(base_rate * 0.7, 0)
                transit_time = round(route["transit_hrs"] * (1 if vehicle["capacity_ton"] <= 15 else 1.2))
                
                cur.execute("""
                    INSERT INTO freight_rates (id, contract_id, origin, destination, vehicle_type,
                        capacity_ton, rate_basis, base_rate, min_charge, transit_time_hrs, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    rate_id, contract["id"], route["origin"], route["destination"],
                    vehicle["type"], vehicle["capacity_ton"], "Per Trip",
                    base_rate, min_charge, transit_time, True
                ))
                total_rates += 1
    
    print(f"✅ Seeded {total_rates} freight rates")


def main():
    print("=" * 60)
    print("🚀 Contract Master Data Seeder")
    print("=" * 60)
    
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # Create tables if not exist (run schema first)
        clear_existing_data(cur)
        seed_vendors(cur)
        contracts = seed_contracts(cur)
        seed_freight_rates(cur, contracts)
        
        conn.commit()
        
        # Summary
        cur.execute("SELECT COUNT(*) FROM vendors")
        vendor_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM contracts")
        contract_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM freight_rates")
        rate_count = cur.fetchone()[0]
        
        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"   Vendors:       {vendor_count}")
        print(f"   Contracts:     {contract_count}")
        print(f"   Freight Rates: {rate_count}")
        print("=" * 60)
        print("✅ Contract Master seeded successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
