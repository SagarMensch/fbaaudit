"""
LedgerOne Database Migration Script - Fixed Version
====================================================
Creates all tables using proper MySQL execution.
"""

import mysql.connector
from mysql.connector import Error
import os

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Password123!',
    'port': 3306
}

DB_NAME = 'ledgerone'


def run_migration():
    """Execute all CREATE TABLE statements"""
    print("\n" + "="*60)
    print("LEDGERONE DATABASE MIGRATION - FIXED")
    print("="*60)
    
    try:
        # Connect without database first
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create database
        print("\n📦 Creating database...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        cursor.execute(f"USE {DB_NAME}")
        print("✅ Database 'ledgerone' ready")
        
        # ============================================
        # TABLE 1: VENDORS
        # ============================================
        print("\n📋 Creating tables...")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendors (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('TRANSPORTER', 'COURIER', 'FREIGHT_FORWARDER', '3PL') NOT NULL DEFAULT 'TRANSPORTER',
                pan VARCHAR(20),
                gstin VARCHAR(20),
                contact_name VARCHAR(100),
                contact_email VARCHAR(100),
                contact_phone VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                bank_name VARCHAR(100),
                bank_account VARCHAR(50),
                ifsc_code VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                performance_grade VARCHAR(5) DEFAULT 'B',
                onboarding_status ENUM('PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name),
                INDEX idx_status (is_active)
            )
        """)
        print("  ✅ vendors")
        
        # ============================================
        # TABLE 2: USERS
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role ENUM('ADMIN', 'FINANCE', 'OPERATIONS', 'AUDIT', 'SUPPLIER') NOT NULL,
                vendor_id VARCHAR(50),
                department VARCHAR(100),
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                last_login DATETIME,
                login_attempts INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        """)
        print("  ✅ users")
        
        # ============================================
        # TABLE 3: LOCATIONS
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS locations (
                id VARCHAR(50) PRIMARY KEY,
                code VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                type ENUM('PLANT', 'WAREHOUSE', 'DEPOT', 'PORT', 'CUSTOMER', 'HUB') NOT NULL,
                address TEXT,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                pincode VARCHAR(10),
                country VARCHAR(50) DEFAULT 'India',
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                gstin VARCHAR(20),
                contact_name VARCHAR(100),
                contact_phone VARCHAR(20),
                operating_hours VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_city (city),
                INDEX idx_type (type),
                INDEX idx_code (code)
            )
        """)
        print("  ✅ locations")
        
        # ============================================
        # TABLE 4: CONTRACTS
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contracts (
                id VARCHAR(50) PRIMARY KEY,
                contract_number VARCHAR(50),
                vendor_id VARCHAR(50) NOT NULL,
                vendor_name VARCHAR(255) NOT NULL,
                service_type ENUM('FTL', 'LTL', 'Express', 'Air', 'Multimodal') NOT NULL,
                valid_from DATE NOT NULL,
                valid_to DATE NOT NULL,
                payment_terms VARCHAR(50) DEFAULT 'Net 30',
                is_rcm_applicable BOOLEAN DEFAULT FALSE,
                status ENUM('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'TERMINATED') DEFAULT 'DRAFT',
                pvc_base_diesel_price DECIMAL(10,2),
                pvc_mileage_benchmark DECIMAL(5,2),
                pvc_reference_city VARCHAR(50),
                accessorials JSON,
                shipper_name VARCHAR(255),
                shipper_gstin VARCHAR(20),
                shipper_address TEXT,
                carrier_legal_name VARCHAR(255),
                carrier_gstin VARCHAR(20),
                carrier_address TEXT,
                sla_otd_target DECIMAL(5,2) DEFAULT 95.00,
                sla_pod_days INT DEFAULT 7,
                sla_damage_limit DECIMAL(5,2) DEFAULT 0.50,
                sla_penalties JSON,
                sla_incentives JSON,
                insurance_coverage DECIMAL(15,2),
                insurance_liability_limit DECIMAL(15,2),
                insurance_claims_process TEXT,
                governing_law TEXT,
                termination_notice_days INT DEFAULT 90,
                dispute_resolution TEXT,
                gst_rate DECIMAL(5,2) DEFAULT 5.00,
                gst_rcm_split VARCHAR(50),
                created_by VARCHAR(50),
                approved_by VARCHAR(50),
                approved_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id),
                INDEX idx_vendor (vendor_id),
                INDEX idx_status (status),
                INDEX idx_valid (valid_from, valid_to)
            )
        """)
        print("  ✅ contracts")
        
        # ============================================
        # TABLE 5: FREIGHT_RATES
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS freight_rates (
                id VARCHAR(50) PRIMARY KEY,
                contract_id VARCHAR(50) NOT NULL,
                origin VARCHAR(100) NOT NULL,
                destination VARCHAR(100) NOT NULL,
                vehicle_type VARCHAR(50) NOT NULL,
                capacity_ton DECIMAL(10,2),
                rate_basis ENUM('Per Trip', 'Per Kg', 'Per Ton', 'Per Km') NOT NULL,
                base_rate DECIMAL(15,2) NOT NULL,
                min_charge DECIMAL(15,2),
                max_charge DECIMAL(15,2),
                transit_time_hrs INT,
                transit_time_days INT,
                distance_km INT,
                is_active BOOLEAN DEFAULT TRUE,
                effective_from DATE,
                effective_to DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
                INDEX idx_route (origin, destination),
                INDEX idx_contract (contract_id),
                INDEX idx_vehicle (vehicle_type)
            )
        """)
        print("  ✅ freight_rates")
        
        # ============================================
        # TABLE 6: VEHICLES
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id VARCHAR(50) PRIMARY KEY,
                vehicle_number VARCHAR(20) UNIQUE NOT NULL,
                vendor_id VARCHAR(50),
                vehicle_type VARCHAR(50) NOT NULL,
                make VARCHAR(50),
                model VARCHAR(50),
                year_of_manufacture INT,
                capacity_ton DECIMAL(10,2),
                capacity_volume_cft DECIMAL(10,2),
                registration_date DATE,
                registration_expiry DATE,
                insurance_expiry DATE,
                fitness_expiry DATE,
                permit_type VARCHAR(50),
                permit_expiry DATE,
                puc_expiry DATE,
                gps_enabled BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                current_location VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
                INDEX idx_vendor (vendor_id),
                INDEX idx_type (vehicle_type),
                INDEX idx_number (vehicle_number)
            )
        """)
        print("  ✅ vehicles")
        
        # ============================================
        # TABLE 7: SHIPMENTS
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shipments (
                id VARCHAR(50) PRIMARY KEY,
                shipment_number VARCHAR(50) UNIQUE NOT NULL,
                contract_id VARCHAR(50),
                vendor_id VARCHAR(50),
                vehicle_id VARCHAR(50),
                vehicle_number VARCHAR(20),
                driver_name VARCHAR(100),
                driver_phone VARCHAR(20),
                origin VARCHAR(100) NOT NULL,
                origin_location_id VARCHAR(50),
                destination VARCHAR(100) NOT NULL,
                destination_location_id VARCHAR(50),
                distance_km INT,
                cargo_description TEXT,
                weight_kg DECIMAL(10,2),
                volume_cft DECIMAL(10,2),
                packages INT,
                booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                pickup_scheduled DATETIME,
                pickup_actual DATETIME,
                delivery_scheduled DATETIME,
                delivery_actual DATETIME,
                status ENUM('BOOKED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXCEPTION') DEFAULT 'BOOKED',
                delay_reason TEXT,
                lr_number VARCHAR(50),
                lr_date DATE,
                lr_path VARCHAR(500),
                pod_submitted BOOLEAN DEFAULT FALSE,
                pod_date DATE,
                pod_path VARCHAR(500),
                pod_remarks TEXT,
                estimated_cost DECIMAL(15,2),
                actual_cost DECIMAL(15,2),
                invoice_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (contract_id) REFERENCES contracts(id),
                FOREIGN KEY (vendor_id) REFERENCES vendors(id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
                INDEX idx_status (status),
                INDEX idx_vendor (vendor_id),
                INDEX idx_dates (pickup_scheduled, delivery_scheduled)
            )
        """)
        print("  ✅ shipments")
        
        # ============================================
        # TABLE 8: INVOICES
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id VARCHAR(50) PRIMARY KEY,
                invoice_number VARCHAR(100) NOT NULL,
                invoice_date DATE NOT NULL,
                due_date DATE,
                vendor_id VARCHAR(50) NOT NULL,
                vendor_name VARCHAR(255),
                vendor_gstin VARCHAR(20),
                contract_id VARCHAR(50),
                shipment_id VARCHAR(50),
                po_number VARCHAR(50),
                origin VARCHAR(100),
                destination VARCHAR(100),
                vehicle_number VARCHAR(20),
                vehicle_type VARCHAR(50),
                lr_number VARCHAR(50),
                base_amount DECIMAL(15,2) NOT NULL,
                fuel_surcharge DECIMAL(15,2) DEFAULT 0,
                accessorial_charges DECIMAL(15,2) DEFAULT 0,
                other_charges DECIMAL(15,2) DEFAULT 0,
                subtotal DECIMAL(15,2),
                cgst_amount DECIMAL(15,2) DEFAULT 0,
                sgst_amount DECIMAL(15,2) DEFAULT 0,
                igst_amount DECIMAL(15,2) DEFAULT 0,
                tds_amount DECIMAL(15,2) DEFAULT 0,
                total_amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'INR',
                status ENUM('DRAFT', 'PENDING_OCR', 'PENDING_VALIDATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED') DEFAULT 'PENDING_OCR',
                approval_level INT DEFAULT 0,
                approved_by VARCHAR(50),
                approved_at DATETIME,
                rejection_reason TEXT,
                ocr_confidence DECIMAL(5,2),
                ocr_raw_text TEXT,
                ocr_processed_at DATETIME,
                sentinel_passed BOOLEAN,
                sentinel_results JSON,
                sentinel_validated_at DATETIME,
                contract_matched BOOLEAN,
                contract_rate DECIMAL(15,2),
                rate_variance DECIMAL(15,2),
                rate_variance_percent DECIMAL(5,2),
                line_items JSON,
                invoice_path VARCHAR(500),
                lr_path VARCHAR(500),
                pod_path VARCHAR(500),
                supporting_docs JSON,
                payment_batch_id VARCHAR(50),
                payment_date DATE,
                payment_reference VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id),
                FOREIGN KEY (contract_id) REFERENCES contracts(id),
                FOREIGN KEY (shipment_id) REFERENCES shipments(id),
                INDEX idx_status (status),
                INDEX idx_vendor (vendor_id),
                INDEX idx_date (invoice_date),
                INDEX idx_number (invoice_number)
            )
        """)
        print("  ✅ invoices")
        
        # ============================================
        # TABLE 9: RATE_CARDS
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_cards (
                id VARCHAR(50) PRIMARY KEY,
                carrier_id VARCHAR(50),
                carrier_name VARCHAR(255) NOT NULL,
                origin VARCHAR(100) NOT NULL,
                destination VARCHAR(100) NOT NULL,
                vehicle_type VARCHAR(50),
                container_type VARCHAR(50),
                rate DECIMAL(15,2) NOT NULL,
                rate_basis ENUM('Per Trip', 'Per Kg', 'Per Ton', 'Per Km') DEFAULT 'Per Trip',
                currency VARCHAR(3) DEFAULT 'INR',
                transit_days INT,
                valid_from DATE NOT NULL,
                valid_to DATE NOT NULL,
                status ENUM('ACTIVE', 'EXPIRED', 'PENDING') DEFAULT 'ACTIVE',
                source ENUM('MANUAL', 'AUCTION', 'SPOT_QUOTE', 'API') DEFAULT 'MANUAL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (carrier_id) REFERENCES vendors(id),
                INDEX idx_route (origin, destination),
                INDEX idx_status (status),
                INDEX idx_valid (valid_from, valid_to)
            )
        """)
        print("  ✅ rate_cards")
        
        # ============================================
        # TABLE 10: AUDIT_LOG
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(50) NOT NULL,
                action ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT') NOT NULL,
                user_id VARCHAR(50),
                user_name VARCHAR(100),
                user_role VARCHAR(50),
                description TEXT,
                old_value JSON,
                new_value JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_entity (entity_type, entity_id),
                INDEX idx_user (user_id),
                INDEX idx_action (action),
                INDEX idx_date (created_at)
            )
        """)
        print("  ✅ audit_log")
        
        # ============================================
        # TABLE 11: FUEL_PRICES
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fuel_prices (
                id VARCHAR(50) PRIMARY KEY,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100),
                fuel_type ENUM('DIESEL', 'PETROL', 'CNG') DEFAULT 'DIESEL',
                price DECIMAL(10,2) NOT NULL,
                effective_date DATE NOT NULL,
                source VARCHAR(50) DEFAULT 'IOCL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_city (city),
                INDEX idx_date (effective_date)
            )
        """)
        print("  ✅ fuel_prices")
        
        # ============================================
        # TABLE 12: NOTIFICATIONS
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(50) PRIMARY KEY,
                recipient_id VARCHAR(50) NOT NULL,
                recipient_role VARCHAR(50),
                type ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'APPROVAL_REQUIRED', 'PAYMENT_READY', 'INVOICE_RECEIVED', 'CONTRACT_EXPIRING') DEFAULT 'INFO',
                priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
                title VARCHAR(255) NOT NULL,
                message TEXT,
                related_entity_type VARCHAR(50),
                related_entity_id VARCHAR(50),
                action_url VARCHAR(500),
                is_read BOOLEAN DEFAULT FALSE,
                read_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_recipient (recipient_id, is_read),
                INDEX idx_type (type),
                INDEX idx_date (created_at)
            )
        """)
        print("  ✅ notifications")
        
        conn.commit()
        print("\n✅ All 12 tables created successfully!")
        
        # ============================================
        # SEED VENDORS
        # ============================================
        print("\n📋 Seeding vendors...")
        vendors = [
            ('TCI001', 'TCI Express Limited', 'TRANSPORTER', '06AAACT1234M1Z2', 'logistics@tciexpress.in', 'A'),
            ('BD001', 'Blue Dart Express Limited', 'COURIER', '27AABCB1234F1Z5', 'corporate@bluedart.com', 'A'),
            ('DEL001', 'Delhivery Limited', 'TRANSPORTER', '06AABCD1234M1Z2', 'business@delhivery.com', 'A'),
            ('VRL001', 'VRL Logistics Limited', 'TRANSPORTER', '29AABCV1234F1Z5', 'logistics@vrlgroup.in', 'B'),
            ('GATI001', 'Gati Limited', 'TRANSPORTER', '36AABCG1234M1Z2', 'sales@gati.com', 'B'),
            ('SFEX001', 'Safexpress Private Limited', 'TRANSPORTER', '07AABCS1234F1Z5', 'business@safexpress.com', 'A'),
            ('RVGO001', 'Rivigo Services Private Limited', 'TRANSPORTER', '06AABCR1234M1Z2', 'enterprise@rivigo.com', 'A'),
            ('DTDC001', 'DTDC Express Limited', 'COURIER', '29AABCD1234F1Z5', 'corporate@dtdc.com', 'B'),
            ('MLOG001', 'Mahindra Logistics Limited', '3PL', '27AABCM1234F1Z5', 'logistics@mahindra.com', 'A'),
            ('ALCG001', 'Allcargo Logistics Limited', 'FREIGHT_FORWARDER', '27AABCA1234F1Z5', 'domestic@allcargo.com', 'A'),
        ]
        for v in vendors:
            cursor.execute("""
                INSERT INTO vendors (id, name, type, gstin, contact_email, performance_grade, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """, v)
        conn.commit()
        print(f"  ✅ {len(vendors)} vendors seeded")
        
        # ============================================
        # SEED LOCATIONS
        # ============================================
        print("\n📋 Seeding locations...")
        locations = [
            ('LOC-MUM-001', 'MUM-WH-01', 'Mumbai Central Warehouse', 'WAREHOUSE', 'Mumbai', 'Maharashtra', '400001'),
            ('LOC-DEL-001', 'DEL-HUB-01', 'Delhi Distribution Hub', 'HUB', 'Delhi', 'Delhi', '110001'),
            ('LOC-BLR-001', 'BLR-WH-01', 'Bangalore Logistics Park', 'WAREHOUSE', 'Bangalore', 'Karnataka', '560001'),
            ('LOC-CHE-001', 'CHE-PORT-01', 'Chennai Port Facility', 'PORT', 'Chennai', 'Tamil Nadu', '600001'),
            ('LOC-PUN-001', 'PUN-PLT-01', 'Pune Manufacturing Plant', 'PLANT', 'Pune', 'Maharashtra', '411001'),
            ('LOC-HYD-001', 'HYD-WH-01', 'Hyderabad Warehouse', 'WAREHOUSE', 'Hyderabad', 'Telangana', '500001'),
            ('LOC-KOL-001', 'KOL-DEP-01', 'Kolkata Depot', 'DEPOT', 'Kolkata', 'West Bengal', '700001'),
            ('LOC-AMD-001', 'AMD-WH-01', 'Ahmedabad Warehouse', 'WAREHOUSE', 'Ahmedabad', 'Gujarat', '380001'),
        ]
        for loc in locations:
            cursor.execute("""
                INSERT INTO locations (id, code, name, type, city, state, pincode, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """, loc)
        conn.commit()
        print(f"  ✅ {len(locations)} locations seeded")
        
        # ============================================
        # SEED CONTRACTS
        # ============================================
        print("\n📋 Seeding contracts...")
        contracts = [
            ('CNT-2024-001', 'TCI001', 'TCI Express Limited', 'Express', '2024-01-01', '2025-12-31', 'Net 45', True, 'ACTIVE', 94.50, 4.0, 'Delhi'),
            ('CNT-2024-002', 'BD001', 'Blue Dart Express Limited', 'Express', '2024-01-01', '2025-06-30', 'Net 30', True, 'ACTIVE', 102.80, 5.0, 'Mumbai'),
            ('CNT-2024-003', 'DEL001', 'Delhivery Limited', 'LTL', '2024-01-01', '2026-12-31', 'Net 45', True, 'ACTIVE', 94.50, 6.5, 'Gurugram'),
            ('CNT-2024-004', 'VRL001', 'VRL Logistics Limited', 'LTL', '2024-01-01', '2025-12-31', 'Net 30', False, 'ACTIVE', 98.20, 6.0, 'Bangalore'),
            ('CNT-2024-005', 'GATI001', 'Gati Limited', 'LTL', '2024-01-01', '2025-12-31', 'Net 45', True, 'ACTIVE', 97.30, 6.0, 'Hyderabad'),
            ('CNT-2024-006', 'SFEX001', 'Safexpress Private Limited', 'Express', '2024-01-01', '2025-12-31', 'Net 45', True, 'ACTIVE', 94.50, 5.5, 'Delhi'),
            ('CNT-2024-007', 'RVGO001', 'Rivigo Services Private Limited', 'FTL', '2024-01-01', '2026-12-31', 'Net 60', True, 'ACTIVE', 94.50, 4.0, 'Gurugram'),
            ('CNT-2024-008', 'MLOG001', 'Mahindra Logistics Limited', 'FTL', '2024-01-01', '2025-12-31', 'Net 60', True, 'ACTIVE', 102.80, 3.5, 'Mumbai'),
            ('CNT-2024-009', 'ALCG001', 'Allcargo Logistics Limited', 'FTL', '2024-01-01', '2025-12-31', 'Net 45', True, 'ACTIVE', 96.50, 4.0, 'Chennai'),
            ('CNT-2024-010', 'DTDC001', 'DTDC Express Limited', 'Express', '2024-06-01', '2025-05-31', 'Net 30', True, 'ACTIVE', 98.20, 5.0, 'Bangalore'),
        ]
        for c in contracts:
            cursor.execute("""
                INSERT INTO contracts (id, vendor_id, vendor_name, service_type, valid_from, valid_to,
                    payment_terms, is_rcm_applicable, status, pvc_base_diesel_price, pvc_mileage_benchmark, pvc_reference_city)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE vendor_name = VALUES(vendor_name)
            """, c)
        conn.commit()
        print(f"  ✅ {len(contracts)} contracts seeded")
        
        # ============================================
        # SEED FREIGHT RATES
        # ============================================
        print("\n📋 Seeding freight rates...")
        rates = [
            # TCI Express
            ('FR-001', 'CNT-2024-001', 'Delhi', 'Mumbai', '32ft MXL', 15, 'Per Kg', 12.50, 36),
            ('FR-002', 'CNT-2024-001', 'Mumbai', 'Bangalore', '32ft MXL', 15, 'Per Kg', 14.00, 24),
            ('FR-003', 'CNT-2024-001', 'Delhi', 'Bangalore', '32ft MXL', 15, 'Per Kg', 13.50, 36),
            ('FR-004', 'CNT-2024-001', 'Delhi', 'Kolkata', '32ft MXL', 15, 'Per Kg', 14.50, 48),
            # Blue Dart
            ('FR-005', 'CNT-2024-002', 'Mumbai', 'Delhi', 'Air', 2, 'Per Kg', 18.00, 12),
            ('FR-006', 'CNT-2024-002', 'Bangalore', 'Chennai', 'Air', 2, 'Per Kg', 15.00, 8),
            ('FR-007', 'CNT-2024-002', 'Delhi', 'Bangalore', 'Air', 2, 'Per Kg', 19.00, 10),
            # Delhivery
            ('FR-008', 'CNT-2024-003', 'Delhi', 'Mumbai', '19ft', 7, 'Per Kg', 8.50, 72),
            ('FR-009', 'CNT-2024-003', 'Mumbai', 'Bangalore', '19ft', 7, 'Per Kg', 9.00, 48),
            ('FR-010', 'CNT-2024-003', 'Delhi', 'Bangalore', '19ft', 7, 'Per Kg', 8.50, 84),
            # VRL
            ('FR-011', 'CNT-2024-004', 'Chennai', 'Kolkata', '19ft', 7, 'Per Kg', 10.00, 96),
            ('FR-012', 'CNT-2024-004', 'Pune', 'Ahmedabad', '19ft', 7, 'Per Kg', 7.50, 48),
            # Gati
            ('FR-013', 'CNT-2024-005', 'Mumbai', 'Chennai', '19ft', 7, 'Per Kg', 8.00, 60),
            ('FR-014', 'CNT-2024-005', 'Hyderabad', 'Mumbai', '19ft', 7, 'Per Kg', 12.00, 48),
            # Rivigo FTL
            ('FR-015', 'CNT-2024-007', 'Delhi', 'Mumbai', '32ft MXL', 15, 'Per Trip', 45000, 48),
            ('FR-016', 'CNT-2024-007', 'Mumbai', 'Bangalore', '32ft MXL', 15, 'Per Trip', 38000, 36),
            # Mahindra FTL
            ('FR-017', 'CNT-2024-008', 'Mumbai', 'Delhi', '32ft SXL', 20, 'Per Trip', 48000, 48),
            ('FR-018', 'CNT-2024-008', 'Pune', 'Mumbai', '32ft SXL', 20, 'Per Trip', 15000, 6),
            # Allcargo FTL
            ('FR-019', 'CNT-2024-009', 'Chennai', 'Mumbai', '32ft MXL', 15, 'Per Trip', 42000, 60),
            ('FR-020', 'CNT-2024-009', 'Chennai', 'Delhi', '32ft MXL', 15, 'Per Trip', 55000, 72),
        ]
        for r in rates:
            cursor.execute("""
                INSERT INTO freight_rates (id, contract_id, origin, destination, vehicle_type, capacity_ton, rate_basis, base_rate, transit_time_hrs, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                ON DUPLICATE KEY UPDATE base_rate = VALUES(base_rate)
            """, r)
        conn.commit()
        print(f"  ✅ {len(rates)} freight rates seeded")
        
        # ============================================
        # SEED FUEL PRICES
        # ============================================
        print("\n📋 Seeding fuel prices...")
        fuel = [
            ('FUEL-DEL-001', 'Delhi', 'Delhi', 'DIESEL', 94.50, '2024-01-01'),
            ('FUEL-MUM-001', 'Mumbai', 'Maharashtra', 'DIESEL', 102.80, '2024-01-01'),
            ('FUEL-BLR-001', 'Bangalore', 'Karnataka', 'DIESEL', 98.20, '2024-01-01'),
            ('FUEL-CHE-001', 'Chennai', 'Tamil Nadu', 'DIESEL', 96.50, '2024-01-01'),
            ('FUEL-HYD-001', 'Hyderabad', 'Telangana', 'DIESEL', 97.30, '2024-01-01'),
            ('FUEL-KOL-001', 'Kolkata', 'West Bengal', 'DIESEL', 95.80, '2024-01-01'),
            ('FUEL-PUN-001', 'Pune', 'Maharashtra', 'DIESEL', 99.50, '2024-01-01'),
            ('FUEL-AMD-001', 'Ahmedabad', 'Gujarat', 'DIESEL', 94.00, '2024-01-01'),
        ]
        for f in fuel:
            cursor.execute("""
                INSERT INTO fuel_prices (id, city, state, fuel_type, price, effective_date)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE price = VALUES(price)
            """, f)
        conn.commit()
        print(f"  ✅ {len(fuel)} fuel prices seeded")
        
        # ============================================
        # SEED USERS
        # ============================================
        print("\n📋 Seeding users...")
        users = [
            ('USR-ADMIN-001', 'admin@ledgerone.com', 'admin123', 'System Admin', 'ADMIN', None),
            ('USR-FIN-001', 'finance@ledgerone.com', 'finance123', 'Finance Team', 'FINANCE', None),
            ('USR-OPS-001', 'operations@ledgerone.com', 'ops123', 'Operations Team', 'OPERATIONS', None),
            ('USR-SUP-001', 'john@tciexpress.in', '12345678', 'John Smith', 'SUPPLIER', 'TCI001'),
            ('USR-SUP-002', 'logistics@bluedart.com', '12345678', 'Blue Dart Ops', 'SUPPLIER', 'BD001'),
        ]
        for u in users:
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, name, role, vendor_id, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """, u)
        conn.commit()
        print(f"  ✅ {len(users)} users seeded")
        
        # ============================================
        # VERIFY
        # ============================================
        print("\n🔍 Verifying migration...")
        tables = ['vendors', 'users', 'locations', 'contracts', 'freight_rates', 'vehicles', 
                  'shipments', 'invoices', 'rate_cards', 'audit_log', 'fuel_prices', 'notifications']
        
        print("\n  Table Row Counts:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"    {table}: {count} rows")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print("🎉 MIGRATION COMPLETE!")
        print("="*60)
        print("\nDatabase 'ledgerone' is ready with:")
        print("  • 12 tables created")
        print("  • 10 vendors seeded")
        print("  • 10 contracts seeded")
        print("  • 20 freight rates seeded")
        print("  • 8 locations seeded")
        print("  • 8 fuel prices seeded")
        print("  • 5 users seeded")
        
        return True
        
    except Error as e:
        print(f"\n❌ Database error: {e}")
        return False


if __name__ == "__main__":
    run_migration()
