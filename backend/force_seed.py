
import mysql.connector
from services.analytics_service import AnalyticsService
from db_config import DB_CONFIG

def force_seed():
    service = AnalyticsService(DB_CONFIG)
    conn = service.get_db_connection()
    if conn:
        cursor = conn.cursor()
        print("Forcing data seed...")
        try:
            service.seed_shipment_data(cursor)
            conn.commit()
            print("Seed successful.")
        except Exception as e:
            print(f"Seed failed: {e}")
        finally:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    force_seed()
