
import mysql.connector
from mysql.connector import errorcode
import random
from datetime import datetime, timedelta
import uuid

class AnalyticsService:
    def __init__(self, db_config):
        self.db_config = db_config

    def get_db_connection(self):
        try:
            return mysql.connector.connect(**self.db_config)
        except mysql.connector.Error as err:
            print(f"Error connecting to database: {err}")
            return None

    def get_cost_to_serve_data(self):
        conn = self.get_db_connection()
        if not conn:
            return {'error': 'Database connection failed'}

        cursor = conn.cursor(dictionary=True)
        try:
            # Check if data exists, if not seed it
            cursor.execute("SELECT COUNT(*) as count FROM shipments")
            result = cursor.fetchone()
            if result['count'] < 100:
                self.seed_shipment_data(cursor)
                conn.commit()

            # Analyze Data for Cost to Serve
            cursor.execute("""
                SELECT 
                    id, customer, sku, lane, 
                    transport_cost, accessorial_cost, handling_cost, 
                    overhead_cost, revenue, units
                FROM shipments 
                LIMIT 50
            """)
            raw_shipments = cursor.fetchall()
            
            # Formatted response similar to frontend expectation
            cts_data = []
            for s in raw_shipments:
                total_cost = float(s['transport_cost'] + s['accessorial_cost'] + s['handling_cost'] + s['overhead_cost'])
                margin = ((float(s['revenue']) - total_cost) / float(s['revenue'])) * 100 if s['revenue'] else 0
                
                cts_data.append({
                    'id': s['id'],
                    'customer': s['customer'],
                    'sku': s['sku'],
                    'lane': s['lane'],
                    'totalCost': total_cost,
                    'breakdown': {
                        'transport': float(s['transport_cost']),
                        'accessorial': float(s['accessorial_cost']),
                        'handling': float(s['handling_cost']),
                        'overhead': float(s['overhead_cost'])
                    },
                    'margin': margin,
                    'units': s['units']
                })

            return {'shipments': cts_data}

        except mysql.connector.Error as err:
            print(f"Error querying data: {err}")
            return {'error': str(err)}
        finally:
            cursor.close()
            conn.close()

    def seed_shipment_data(self, cursor):
        print("Seeding shipment data...")
        customers = ['GridCorp', 'PowerGen', 'CityElectric', 'MetroTransit', 'IndusTower', 'SolarMax', 'HydroFlow', 'WindTech']
        skus = ['Transformer-X1', 'Switchgear-A2', 'Cable-HV', 'SolarPanel-M4', 'TurbineBlade-Z', 'Inverter-Pro', 'Battery-LFP']
        lanes = ['MUM-DEL', 'CN-US', 'DE-US', 'MX-US', 'BLR-CHE', 'VNS-KOL', 'JAI-MUM', 'HYD-VTZ']

        # Clear existing to ensure clean slate for demo
        cursor.execute("DELETE FROM shipments")

        for _ in range(200):
            shipment_id = str(uuid.uuid4())
            customer = random.choice(customers)
            sku = random.choice(skus)
            lane = random.choice(lanes)
            
            transport = random.uniform(500, 2500)
            accessorial = random.uniform(50, 300)
            handling = random.uniform(50, 400)
            overhead = random.uniform(50, 200)
            
            # Introduce some variance for 'bad' margins
            if random.random() > 0.8:
                 # High cost, low revenue scenario
                 transport *= 1.5
                 revenue = (transport + accessorial + handling + overhead) * 0.95
            else:
                 # Healthy margin
                 total_cost = transport + accessorial + handling + overhead
                 revenue = total_cost * random.uniform(1.15, 1.45)

            query = """
                INSERT INTO shipments 
                (id, customer, sku, lane, transport_cost, accessorial_cost, handling_cost, overhead_cost, revenue, units, shipment_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                shipment_id, customer, sku, lane, 
                transport, accessorial, handling, overhead, revenue, 
                random.randint(10, 500), datetime.now().strftime('%Y-%m-%d')
            ))
        print("Seeding complete.")
