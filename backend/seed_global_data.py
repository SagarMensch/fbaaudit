"""
Global Data Seeder for FBA Audit
Seeds the database with global logistics carriers, contracts, and rates (USD)
SAP-style: Database = Source of Truth
"""

import os
import sys
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, date
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def get_connection():
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL)


def seed_system_config(cursor):
    """Seed system configuration table for config-over-code"""
    print("[CONFIG] Creating system_config table...")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_config (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT,
            category VARCHAR(50) DEFAULT 'general',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_by VARCHAR(100)
        )
    """)
    
    configs = [
        ('default_currency', 'USD', 'System default currency symbol', 'finance'),
        ('currency_code', 'USD', 'ISO currency code', 'finance'),
        ('variance_tolerance_pct', '3.0', 'Auto-approve rate variance threshold', 'audit'),
        ('high_value_threshold', '10000', 'Amount requiring manual review (in currency)', 'audit'),
        ('sla_dispute_hours', '48', 'SLA for dispute resolution in hours', 'sla'),
        ('sla_pod_days', '7', 'Days to submit POD after delivery', 'sla'),
        ('auto_approve_enabled', 'true', 'Enable automatic approval for low-risk invoices', 'workflow'),
        ('ai_approval_enabled', 'true', 'Enable AI-assisted approval decisions', 'workflow'),
        ('fuel_surcharge_base', '3.50', 'Base diesel price for fuel surcharge calculation', 'rates'),
        ('tax_default_rate', '0', 'Default tax rate percentage (0 for tax-exempt)', 'finance'),
    ]
    
    for key, value, description, category in configs:
        cursor.execute("""
            INSERT INTO system_config (key, value, description, category)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (key) DO UPDATE SET 
                value = EXCLUDED.value,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                updated_at = NOW()
        """, (key, value, description, category))
    
    print(f"  [OK] Seeded {len(configs)} config entries")


def seed_global_vendors(cursor):
    """Seed global logistics carriers"""
    print("[VENDORS] Seeding global vendors/carriers...")
    
    vendors = [
        {
            'id': 'VND-DHL',
            'name': 'DHL Express',
            'type': 'FREIGHT_FORWARDER',
            'contact_name': 'Global Enterprise Team',
            'contact_email': 'enterprise@dhl.com',
            'contact_phone': '+1-800-225-5345',
            'address': '1210 South Pine Island Road',
            'city': 'Plantation',
            'state': 'Florida',
            'pincode': '33324',
            'is_active': True,
            'performance_grade': 'A',
            'onboarding_status': 'ACTIVE'
        },
        {
            'id': 'VND-FEDEX',
            'name': 'FedEx Corporation',
            'type': 'COURIER',
            'contact_name': 'Corporate Logistics',
            'contact_email': 'corporate@fedex.com',
            'contact_phone': '+1-800-463-3339',
            'address': '942 South Shady Grove Road',
            'city': 'Memphis',
            'state': 'Tennessee',
            'pincode': '38120',
            'is_active': True,
            'performance_grade': 'A',
            'onboarding_status': 'ACTIVE'
        },
        {
            'id': 'VND-MAERSK',
            'name': 'Maersk Line',
            'type': 'FREIGHT_FORWARDER',
            'contact_name': 'Ocean Freight Division',
            'contact_email': 'sales@maersk.com',
            'contact_phone': '+45-33-63-33-63',
            'address': 'Esplanaden 50',
            'city': 'Copenhagen',
            'state': 'Capital Region',
            'pincode': '1098',
            'is_active': True,
            'performance_grade': 'A',
            'onboarding_status': 'ACTIVE'
        },
        {
            'id': 'VND-KUEHNE',
            'name': 'Kuehne+Nagel',
            'type': '3PL',
            'contact_name': 'Supply Chain Solutions',
            'contact_email': 'info@kuehne-nagel.com',
            'contact_phone': '+41-44-786-95-11',
            'address': 'Kuehne+Nagel Management AG',
            'city': 'Schindellegi',
            'state': 'Schwyz',
            'pincode': '8834',
            'is_active': True,
            'performance_grade': 'A',
            'onboarding_status': 'ACTIVE'
        },
        {
            'id': 'VND-UPS',
            'name': 'UPS Freight',
            'type': 'TRANSPORTER',
            'contact_name': 'Enterprise Solutions',
            'contact_email': 'enterprise@ups.com',
            'contact_phone': '+1-800-742-5877',
            'address': '55 Glenlake Parkway NE',
            'city': 'Atlanta',
            'state': 'Georgia',
            'pincode': '30328',
            'is_active': True,
            'performance_grade': 'A',
            'onboarding_status': 'ACTIVE'
        },
        {
            'id': 'VND-XPO',
            'name': 'XPO Logistics',
            'type': '3PL',
            'contact_name': 'Contract Logistics',
            'contact_email': 'sales@xpo.com',
            'contact_phone': '+1-855-976-6951',
            'address': '5 American Lane',
            'city': 'Greenwich',
            'state': 'Connecticut',
            'pincode': '06831',
            'is_active': True,
            'performance_grade': 'B',
            'onboarding_status': 'ACTIVE'
        },
        {
            'id': 'VND-CEVA',
            'name': 'CEVA Logistics',
            'type': '3PL',
            'contact_name': 'Global Operations',
            'contact_email': 'info@cevalogistics.com',
            'contact_phone': '+31-20-655-2700',
            'address': 'Flughafenstrasse 3',
            'city': 'Baar',
            'state': 'Zug',
            'pincode': '6332',
            'is_active': True,
            'performance_grade': 'B',
            'onboarding_status': 'ACTIVE'
        },
    ]
    
    for vendor in vendors:
        cursor.execute("""
            INSERT INTO vendors (id, name, type, contact_name, contact_email, contact_phone, 
                                address, city, state, pincode, is_active, performance_grade, onboarding_status)
            VALUES (%(id)s, %(name)s, %(type)s, %(contact_name)s, %(contact_email)s, %(contact_phone)s,
                    %(address)s, %(city)s, %(state)s, %(pincode)s, %(is_active)s, %(performance_grade)s, %(onboarding_status)s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                contact_name = EXCLUDED.contact_name,
                contact_email = EXCLUDED.contact_email,
                contact_phone = EXCLUDED.contact_phone,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                performance_grade = EXCLUDED.performance_grade,
                onboarding_status = EXCLUDED.onboarding_status,
                updated_at = NOW()
        """, vendor)
    
    print(f"  [OK] Seeded {len(vendors)} global vendors")


def seed_contracts(cursor):
    """Seed contracts with global rates (USD)"""
    print("[CONTRACTS] Seeding contracts...")
    
    contracts = [
        {
            'id': 'CON-DHL-2026',
            'contract_number': 'DHL-GLOBAL-2026',
            'vendor_id': 'VND-DHL',
            'vendor_name': 'DHL Express',
            'service_type': 'Express',
            'valid_from': date(2026, 1, 1),
            'valid_to': date(2026, 12, 31),
            'payment_terms': 'Net 30',
            'status': 'ACTIVE',
            'sla_otd_target': 98.00,
            'sla_pod_days': 5,
        },
        {
            'id': 'CON-FEDEX-2026',
            'contract_number': 'FEDEX-ENTERPRISE-2026',
            'vendor_id': 'VND-FEDEX',
            'vendor_name': 'FedEx Corporation',
            'service_type': 'Express',
            'valid_from': date(2026, 1, 1),
            'valid_to': date(2026, 12, 31),
            'payment_terms': 'Net 30',
            'status': 'ACTIVE',
            'sla_otd_target': 97.00,
            'sla_pod_days': 7,
        },
        {
            'id': 'CON-MAERSK-2026',
            'contract_number': 'MAERSK-OCEAN-2026',
            'vendor_id': 'VND-MAERSK',
            'vendor_name': 'Maersk Line',
            'service_type': 'Multimodal',
            'valid_from': date(2026, 1, 1),
            'valid_to': date(2026, 12, 31),
            'payment_terms': 'Net 45',
            'status': 'ACTIVE',
            'sla_otd_target': 92.00,
            'sla_pod_days': 14,
        },
        {
            'id': 'CON-KUEHNE-2026',
            'contract_number': 'KUEHNE-3PL-2026',
            'vendor_id': 'VND-KUEHNE',
            'vendor_name': 'Kuehne+Nagel',
            'service_type': 'FTL',
            'valid_from': date(2026, 1, 1),
            'valid_to': date(2026, 12, 31),
            'payment_terms': 'Net 30',
            'status': 'ACTIVE',
            'sla_otd_target': 95.00,
            'sla_pod_days': 7,
        },
        {
            'id': 'CON-UPS-2026',
            'contract_number': 'UPS-FREIGHT-2026',
            'vendor_id': 'VND-UPS',
            'vendor_name': 'UPS Freight',
            'service_type': 'LTL',
            'valid_from': date(2026, 1, 1),
            'valid_to': date(2026, 12, 31),
            'payment_terms': 'Net 30',
            'status': 'ACTIVE',
            'sla_otd_target': 96.00,
            'sla_pod_days': 5,
        },
    ]
    
    for contract in contracts:
        cursor.execute("""
            INSERT INTO contracts (id, contract_number, vendor_id, vendor_name, service_type,
                                   valid_from, valid_to, payment_terms, status,
                                   sla_otd_target, sla_pod_days)
            VALUES (%(id)s, %(contract_number)s, %(vendor_id)s, %(vendor_name)s, %(service_type)s,
                    %(valid_from)s, %(valid_to)s, %(payment_terms)s, %(status)s,
                    %(sla_otd_target)s, %(sla_pod_days)s)
            ON CONFLICT (id) DO UPDATE SET
                contract_number = EXCLUDED.contract_number,
                vendor_name = EXCLUDED.vendor_name,
                service_type = EXCLUDED.service_type,
                valid_from = EXCLUDED.valid_from,
                valid_to = EXCLUDED.valid_to,
                payment_terms = EXCLUDED.payment_terms,
                status = EXCLUDED.status,
                updated_at = NOW()
        """, contract)
    
    print(f"  [OK] Seeded {len(contracts)} contracts")


def seed_freight_rates(cursor):
    """Seed freight rates (USD) for key lanes"""
    print("[RATES] Seeding freight rates (USD)...")
    
    import uuid
    
    rates = [
        # DHL Express rates (id, contract_id, origin, destination, vehicle_type, rate_basis, base_rate, transit_time_days)
        ('FRT-DHL-001', 'CON-DHL-2026', 'Los Angeles', 'New York', 'Air Express', 'Per Kg', 12.50, 2),
        ('FRT-DHL-002', 'CON-DHL-2026', 'Chicago', 'Miami', 'Ground Express', 'Per Kg', 8.75, 3),
        ('FRT-DHL-003', 'CON-DHL-2026', 'Seattle', 'Boston', 'Air Express', 'Per Kg', 14.25, 2),
        ('FRT-DHL-004', 'CON-DHL-2026', 'Dallas', 'Phoenix', 'Ground Express', 'Per Kg', 6.50, 2),
        ('FRT-DHL-005', 'CON-DHL-2026', 'Atlanta', 'Denver', 'Ground Express', 'Per Kg', 7.80, 3),
        
        # FedEx rates
        ('FRT-FEDEX-001', 'CON-FEDEX-2026', 'New York', 'Los Angeles', 'Air Priority', 'Per Kg', 15.00, 2),
        ('FRT-FEDEX-002', 'CON-FEDEX-2026', 'Chicago', 'Houston', 'Ground', 'Per Kg', 5.25, 3),
        ('FRT-FEDEX-003', 'CON-FEDEX-2026', 'Miami', 'Seattle', 'Air Priority', 'Per Kg', 18.50, 2),
        ('FRT-FEDEX-004', 'CON-FEDEX-2026', 'Boston', 'San Francisco', 'Air Economy', 'Per Kg', 11.00, 3),
        
        # Maersk ocean rates
        ('FRT-MAERSK-001', 'CON-MAERSK-2026', 'Shanghai', 'Rotterdam', '40ft Container', 'Per Trip', 3200.00, 35),
        ('FRT-MAERSK-002', 'CON-MAERSK-2026', 'Shanghai', 'Los Angeles', '40ft Container', 'Per Trip', 2800.00, 18),
        ('FRT-MAERSK-003', 'CON-MAERSK-2026', 'Singapore', 'New York', '40ft Container', 'Per Trip', 4500.00, 28),
        ('FRT-MAERSK-004', 'CON-MAERSK-2026', 'Rotterdam', 'Mumbai', '20ft Container', 'Per Trip', 1850.00, 21),
        ('FRT-MAERSK-005', 'CON-MAERSK-2026', 'Busan', 'Hamburg', '40ft Container', 'Per Trip', 3800.00, 32),
        
        # Kuehne+Nagel FTL rates
        ('FRT-KUEHNE-001', 'CON-KUEHNE-2026', 'Chicago', 'Detroit', '53ft Trailer', 'Per Trip', 1200.00, 1),
        ('FRT-KUEHNE-002', 'CON-KUEHNE-2026', 'Dallas', 'Memphis', '53ft Trailer', 'Per Trip', 950.00, 1),
        ('FRT-KUEHNE-003', 'CON-KUEHNE-2026', 'Atlanta', 'Nashville', '53ft Trailer', 'Per Trip', 780.00, 1),
        ('FRT-KUEHNE-004', 'CON-KUEHNE-2026', 'Los Angeles', 'Phoenix', '53ft Trailer', 'Per Trip', 1100.00, 1),
        
        # UPS LTL rates
        ('FRT-UPS-001', 'CON-UPS-2026', 'New York', 'Philadelphia', 'LTL Standard', 'Per Kg', 2.85, 1),
        ('FRT-UPS-002', 'CON-UPS-2026', 'Chicago', 'Indianapolis', 'LTL Standard', 'Per Kg', 2.40, 1),
        ('FRT-UPS-003', 'CON-UPS-2026', 'Los Angeles', 'San Diego', 'LTL Standard', 'Per Kg', 1.95, 1),
        ('FRT-UPS-004', 'CON-UPS-2026', 'Houston', 'Austin', 'LTL Standard', 'Per Kg', 2.15, 1),
    ]
    
    for rate in rates:
        cursor.execute("""
            INSERT INTO freight_rates (id, contract_id, origin, destination, vehicle_type, rate_basis, base_rate, transit_time_days)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                rate_basis = EXCLUDED.rate_basis,
                base_rate = EXCLUDED.base_rate,
                transit_time_days = EXCLUDED.transit_time_days,
                updated_at = NOW()
        """, rate)
    
    print(f"  [OK] Seeded {len(rates)} freight rates")


def seed_locations(cursor):
    """Seed key global locations"""
    print("[LOCATIONS] Seeding locations...")
    
    locations = [
        ('LOC-LAX', 'LAX-WH', 'Los Angeles Warehouse', 'WAREHOUSE', 'Los Angeles', 'California', 'USA'),
        ('LOC-NYC', 'NYC-DC', 'New York Distribution Center', 'WAREHOUSE', 'New York', 'New York', 'USA'),
        ('LOC-CHI', 'CHI-HUB', 'Chicago Hub', 'HUB', 'Chicago', 'Illinois', 'USA'),
        ('LOC-MIA', 'MIA-PORT', 'Miami Port Terminal', 'PORT', 'Miami', 'Florida', 'USA'),
        ('LOC-SEA', 'SEA-WH', 'Seattle Warehouse', 'WAREHOUSE', 'Seattle', 'Washington', 'USA'),
        ('LOC-RTD', 'RTD-PORT', 'Rotterdam Port', 'PORT', 'Rotterdam', 'South Holland', 'Netherlands'),
        ('LOC-SHA', 'SHA-PORT', 'Shanghai Port', 'PORT', 'Shanghai', 'Shanghai', 'China'),
        ('LOC-SIN', 'SIN-HUB', 'Singapore Hub', 'HUB', 'Singapore', 'Singapore', 'Singapore'),
    ]
    
    for loc in locations:
        cursor.execute("""
            INSERT INTO locations (id, code, name, type, city, state, country)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                country = EXCLUDED.country,
                updated_at = NOW()
        """, loc)
    
    print(f"  [OK] Seeded {len(locations)} locations")


def seed_sample_invoices(cursor):
    """Seed sample invoices for testing the workflow"""
    print("[INVOICES] Seeding sample invoices...")
    
    invoices = [
        {
            'id': 'INV-SAMPLE-001',
            'invoice_number': 'DHL-2026-00001',
            'invoice_date': date(2026, 2, 1),
            'due_date': date(2026, 3, 3),
            'vendor_id': 'VND-DHL',
            'vendor_name': 'DHL Express',
            'contract_id': 'CON-DHL-2026',
            'origin': 'Los Angeles',
            'destination': 'New York',
            'vehicle_type': 'Air Express',
            'base_amount': 1250.00,
            'fuel_surcharge': 125.00,
            'total_amount': 1375.00,
            'currency': 'USD',
            'status': 'PENDING_VALIDATION',
        },
        {
            'id': 'INV-SAMPLE-002',
            'invoice_number': 'MAERSK-2026-00042',
            'invoice_date': date(2026, 2, 5),
            'due_date': date(2026, 3, 22),
            'vendor_id': 'VND-MAERSK',
            'vendor_name': 'Maersk Line',
            'contract_id': 'CON-MAERSK-2026',
            'origin': 'Shanghai',
            'destination': 'Rotterdam',
            'vehicle_type': '40ft Container',
            'base_amount': 3200.00,
            'fuel_surcharge': 480.00,
            'total_amount': 3680.00,
            'currency': 'USD',
            'status': 'PENDING_APPROVAL',
        },
        {
            'id': 'INV-SAMPLE-003',
            'invoice_number': 'UPS-2026-00118',
            'invoice_date': date(2026, 2, 7),
            'due_date': date(2026, 3, 9),
            'vendor_id': 'VND-UPS',
            'vendor_name': 'UPS Freight',
            'contract_id': 'CON-UPS-2026',
            'origin': 'Chicago',
            'destination': 'Indianapolis',
            'vehicle_type': 'LTL Standard',
            'base_amount': 2400.00,
            'fuel_surcharge': 192.00,
            'total_amount': 2592.00,
            'currency': 'USD',
            'status': 'APPROVED',
        },
    ]
    
    for inv in invoices:
        cursor.execute("""
            INSERT INTO invoices (id, invoice_number, invoice_date, due_date, vendor_id, vendor_name,
                                 contract_id, origin, destination, vehicle_type, base_amount,
                                 fuel_surcharge, total_amount, currency, status)
            VALUES (%(id)s, %(invoice_number)s, %(invoice_date)s, %(due_date)s, %(vendor_id)s, %(vendor_name)s,
                    %(contract_id)s, %(origin)s, %(destination)s, %(vehicle_type)s, %(base_amount)s,
                    %(fuel_surcharge)s, %(total_amount)s, %(currency)s, %(status)s)
            ON CONFLICT (id) DO UPDATE SET
                invoice_number = EXCLUDED.invoice_number,
                vendor_name = EXCLUDED.vendor_name,
                total_amount = EXCLUDED.total_amount,
                status = EXCLUDED.status,
                updated_at = NOW()
        """, inv)
    
    print(f"  [OK] Seeded {len(invoices)} sample invoices")


def seed_all():
    """Execute all seeding operations"""
    print("\n" + "="*60)
    print("FBA AUDIT - GLOBAL DATA SEEDER")
    print("="*60 + "\n")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        seed_system_config(cursor)
        seed_global_vendors(cursor)
        seed_contracts(cursor)
        seed_freight_rates(cursor)
        seed_locations(cursor)
        seed_sample_invoices(cursor)
        
        conn.commit()
        
        print("\n" + "="*60)
        print("[SUCCESS] ALL GLOBAL DATA SEEDED SUCCESSFULLY!")
        print("="*60 + "\n")
        
        # Print summary
        cursor.execute("SELECT COUNT(*) FROM vendors")
        print(f"  Total Vendors: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM contracts")
        print(f"  Total Contracts: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM freight_rates")
        print(f"  Total Freight Rates: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM invoices")
        print(f"  Total Invoices: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM system_config")
        print(f"  System Configs: {cursor.fetchone()[0]}")
        print()
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n[ERROR]: {str(e)}")
        raise


if __name__ == "__main__":
    seed_all()
