"""
Data Seeder - Populate Database from Mock Data
===============================================
Seeds initial data from mock files into PostgreSQL tables.
"""

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import os
import sys
from datetime import datetime, timedelta
import random

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Sample invoices to seed (based on existing mock data structure)
SAMPLE_INVOICES = [
    {
        "id": "TCI_2024_002",
        "invoice_number": "TCI/2024/002",
        "vendor_id": "TCI001",
        "vendor_name": "TCI Express Limited",
        "invoice_date": "2024-01-15",
        "due_date": "2024-02-15",
        "amount": 16350.00,
        "status": "EXCEPTION",
        "match_status": "Discrepancy",
        "origin": "Delhi",
        "destination": "Bangalore",
        "mode": "Road (FTL)",
        "lr_number": "LR-TCI-2024-002",
        "weight_kg": 1200.0,
        "distance_km": 2150.0,
        "extraction_confidence": 96
    },
    {
        "id": "TCI_2024_003",
        "invoice_number": "TCI/2024/003",
        "vendor_id": "TCI001",
        "vendor_name": "TCI Express Limited",
        "invoice_date": "2024-01-18",
        "due_date": "2024-02-18",
        "amount": 24500.00,
        "status": "PENDING",
        "match_status": "Perfect",
        "origin": "Mumbai",
        "destination": "Chennai",
        "mode": "Road (FTL)",
        "lr_number": "LR-TCI-2024-003",
        "weight_kg": 2500.0,
        "distance_km": 1340.0,
        "extraction_confidence": 98
    },
    {
        "id": "BD_2024_001",
        "invoice_number": "BD/2024/001",
        "vendor_id": "BD001",
        "vendor_name": "Blue Dart Express",
        "invoice_date": "2024-01-20",
        "due_date": "2024-02-20",
        "amount": 8750.00,
        "status": "APPROVED",
        "match_status": "Perfect",
        "origin": "Chennai",
        "destination": "Hyderabad",
        "mode": "Road (Express)",
        "lr_number": "LR-BD-2024-001",
        "weight_kg": 450.0,
        "distance_km": 630.0,
        "extraction_confidence": 99
    },
    {
        "id": "VRL_2024_778",
        "invoice_number": "VRL/2024/778",
        "vendor_id": "VRL001",
        "vendor_name": "VRL Logistics",
        "invoice_date": "2024-01-22",
        "due_date": "2024-02-22",
        "amount": 12800.00,
        "status": "PENDING",
        "match_status": "Pending",
        "origin": "Pune",
        "destination": "Delhi",
        "mode": "Road (LTL)",
        "lr_number": "LR-VRL-2024-778",
        "weight_kg": 890.0,
        "distance_km": 1420.0,
        "extraction_confidence": 94
    },
    {
        "id": "GATI_2024_101",
        "invoice_number": "GATI/2024/101",
        "vendor_id": "GATI001",
        "vendor_name": "Gati Limited",
        "invoice_date": "2024-01-25",
        "due_date": "2024-02-25",
        "amount": 15200.00,
        "status": "APPROVED",
        "match_status": "Perfect",
        "origin": "Ahmedabad",
        "destination": "Mumbai",
        "mode": "Road (FTL)",
        "lr_number": "LR-GATI-2024-101",
        "weight_kg": 1800.0,
        "distance_km": 525.0,
        "extraction_confidence": 97
    },
    {
        "id": "DEL_2024_055",
        "invoice_number": "DEL/2024/055",
        "vendor_id": "DEL001",
        "vendor_name": "Delhivery Logistics",
        "invoice_date": "2024-01-28",
        "due_date": "2024-02-28",
        "amount": 9500.00,
        "status": "PENDING",
        "match_status": "Discrepancy",
        "origin": "Bangalore",
        "destination": "Kolkata",
        "mode": "Road (Express)",
        "lr_number": "LR-DEL-2024-055",
        "weight_kg": 320.0,
        "distance_km": 1880.0,
        "extraction_confidence": 92
    },
    {
        "id": "DEMO_2024_PERFECT",
        "invoice_number": "DEMO/2024/PERFECT",
        "vendor_id": "TCI001",
        "vendor_name": "TCI Express Limited",
        "invoice_date": "2024-01-15",
        "due_date": "2024-02-15",
        "amount": 12500.00,
        "status": "APPROVED",
        "match_status": "Perfect",
        "origin": "Mumbai",
        "destination": "Delhi",
        "mode": "Road (FTL)",
        "lr_number": "LR-DEMO-2024-001",
        "weight_kg": 1500.0,
        "distance_km": 1400.0,
        "extraction_confidence": 100
    },
    {
        "id": "GPT_24-25_1145",
        "invoice_number": "GPT/24-25/1145",
        "vendor_id": "BD001",
        "vendor_name": "Blue Dart Express",
        "invoice_date": "2024-01-20",
        "due_date": "2024-02-20",
        "amount": 8750.00,
        "status": "PENDING",
        "match_status": "Perfect",
        "origin": "Chennai",
        "destination": "Bangalore",
        "mode": "Road (Express)",
        "lr_number": "LR-GPT-1145",
        "weight_kg": 500.0,
        "distance_km": 350.0,
        "extraction_confidence": 96
    }
]

SAMPLE_VENDORS = [
    {"id": "TCI001", "name": "TCI Express Limited", "code": "TCI", "vendor_type": "CARRIER", "gst_number": "27AABCT1234A1ZP", "city": "Mumbai", "state": "Maharashtra", "performance_score": 92},
    {"id": "BD001", "name": "Blue Dart Express", "code": "BLUEDART", "vendor_type": "CARRIER", "gst_number": "27AABCB5678B1ZQ", "city": "Mumbai", "state": "Maharashtra", "performance_score": 96},
    {"id": "VRL001", "name": "VRL Logistics", "code": "VRL", "vendor_type": "CARRIER", "gst_number": "29AABCV9012C1ZR", "city": "Bangalore", "state": "Karnataka", "performance_score": 88},
    {"id": "GATI001", "name": "Gati Limited", "code": "GATI", "vendor_type": "CARRIER", "gst_number": "27AABCG3456D1ZS", "city": "Hyderabad", "state": "Telangana", "performance_score": 90},
    {"id": "DEL001", "name": "Delhivery Logistics", "code": "DELHIVERY", "vendor_type": "CARRIER", "gst_number": "07AABCD7890E1ZT", "city": "Gurgaon", "state": "Haryana", "performance_score": 94},
    {"id": "SAFE001", "name": "SafeExpress Logistics", "code": "SAFE", "vendor_type": "CARRIER", "gst_number": "27AABCS1234F1ZU", "city": "Mumbai", "state": "Maharashtra", "performance_score": 91},
]

SAMPLE_RATE_CARDS = [
    {"id": "RC001", "carrier": "TCI Express Limited", "contract_ref": "TCI-2024-ANNUAL", "origin": "Mumbai", "destination": "Delhi", "container_type": "FTL (32ft)", "rate": 85.00, "unit": "Per KG", "valid_from": "2024-01-01", "valid_to": "2024-12-31", "status": "ACTIVE"},
    {"id": "RC002", "carrier": "Blue Dart Express", "contract_ref": "BD-2024-EXPRESS", "origin": "Pan India", "destination": "Pan India", "container_type": "Express", "rate": 120.00, "unit": "Per KG", "valid_from": "2024-01-01", "valid_to": "2024-12-31", "status": "ACTIVE"},
    {"id": "RC003", "carrier": "VRL Logistics", "contract_ref": "VRL-2024-LTL", "origin": "South India", "destination": "North India", "container_type": "LTL", "rate": 75.00, "unit": "Per KG", "valid_from": "2024-01-01", "valid_to": "2024-12-31", "status": "ACTIVE"},
    {"id": "RC004", "carrier": "Gati Limited", "contract_ref": "GATI-2024-STD", "origin": "West India", "destination": "Pan India", "container_type": "FTL (20ft)", "rate": 78.00, "unit": "Per KG", "valid_from": "2024-01-01", "valid_to": "2024-12-31", "status": "ACTIVE"},
    {"id": "RC005", "carrier": "Delhivery Logistics", "contract_ref": "DEL-2024-ECOM", "origin": "Pan India", "destination": "Pan India", "container_type": "Parcel", "rate": 45.00, "unit": "Per Shipment", "valid_from": "2024-01-01", "valid_to": "2024-12-31", "status": "ACTIVE"},
]

def seed_data():
    print("=" * 60)
    print("DATA SEEDER - Populating Database")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Seed Vendors
        print("\n📦 Seeding vendors...")
        for v in SAMPLE_VENDORS:
            sql = "INSERT INTO vendors (id, name, code, vendor_type, gst_number, city, state, performance_score, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'ACTIVE') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, performance_score = EXCLUDED.performance_score"
            cursor.execute(sql, (v["id"], v["name"], v["code"], v["vendor_type"], v["gst_number"], v["city"], v["state"], v["performance_score"]))
        print(f"   ✅ {len(SAMPLE_VENDORS)} vendors seeded")
        
        # Seed Invoices
        print("\n📄 Seeding invoices...")
        for inv in SAMPLE_INVOICES:
            sql = "INSERT INTO invoices (id, invoice_number, vendor_id, vendor_name, invoice_date, due_date, amount, status, match_status, origin, destination, mode, lr_number, weight_kg, distance_km, extraction_confidence) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, match_status = EXCLUDED.match_status"
            cursor.execute(sql, (inv["id"], inv["invoice_number"], inv["vendor_id"], inv["vendor_name"],
                  inv["invoice_date"], inv["due_date"], inv["amount"], inv["status"],
                  inv["match_status"], inv["origin"], inv["destination"], inv["mode"],
                  inv["lr_number"], inv["weight_kg"], inv["distance_km"], inv["extraction_confidence"]))
        print(f"   ✅ {len(SAMPLE_INVOICES)} invoices seeded")
        
        # Seed Rate Cards
        print("\n💰 Seeding rate cards...")
        for rc in SAMPLE_RATE_CARDS:
            cursor.execute("""
                INSERT INTO rate_cards (id, carrier, contract_ref, origin, destination, container_type, 
                    rate, unit, valid_from, valid_to, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET 
                    rate = EXCLUDED.rate,
                    status = EXCLUDED.status
            """, (rc["id"], rc["carrier"], rc["contract_ref"], rc["origin"], rc["destination"],
                  rc["container_type"], rc["rate"], rc["unit"], rc["valid_from"], rc["valid_to"], rc["status"]))
        print(f"   ✅ {len(SAMPLE_RATE_CARDS)} rate cards seeded")
        
        conn.commit()
        
        # Verify counts
        cursor.execute("SELECT COUNT(*) FROM invoices")
        inv_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM vendors")
        vendor_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM rate_cards")
        rc_count = cursor.fetchone()[0]
        
        print("\n" + "=" * 60)
        print("SEEDING COMPLETE")
        print("=" * 60)
        print(f"   Invoices: {inv_count}")
        print(f"   Vendors: {vendor_count}")
        print(f"   Rate Cards: {rc_count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed_data()
