import mysql.connector
from mysql.connector import errorcode
import sys
from db_config import DB_CONFIG, DB_NAME

# Define Tables
TABLES = {}
TABLES['supplier_documents'] = (
    "CREATE TABLE `supplier_documents` ("
    "  `id` varchar(50) NOT NULL,"
    "  `supplier_id` varchar(50) NOT NULL,"
    "  `name` varchar(255) NOT NULL,"
    "  `category` varchar(50) NOT NULL,"
    "  `status` varchar(50) DEFAULT 'PENDING_VERIFICATION',"
    "  `upload_date` date NOT NULL,"
    "  `verified_date` date DEFAULT NULL,"
    "  `expiry_date` date DEFAULT NULL,"
    "  `file_path` varchar(500) DEFAULT NULL,"
    "  `file_size` varchar(50) DEFAULT NULL,"
    "  `description` text,"
    "  `metadata` json DEFAULT NULL,"
    "  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`id`)"
    ") ENGINE=InnoDB")

TABLES['supplier_invoices'] = (
    "CREATE TABLE `supplier_invoices` ("
    "  `id` varchar(50) NOT NULL,"
    "  `invoice_number` varchar(100) NOT NULL,"
    "  `supplier_id` varchar(50) NOT NULL,"
    "  `amount` decimal(15,2) NOT NULL,"
    "  `status` varchar(50) DEFAULT 'DRAFT',"
    "  `po_number` varchar(100) DEFAULT NULL,"
    "  `invoice_date` date DEFAULT NULL,"
    "  `due_date` date DEFAULT NULL,"
    "  `items` json DEFAULT NULL,"
    "  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`id`)"
    ") ENGINE=InnoDB")

TABLES['shipments'] = (
    "CREATE TABLE `shipments` ("
    "  `id` varchar(50) NOT NULL,"
    "  `customer` varchar(100) NOT NULL,"
    "  `sku` varchar(100) NOT NULL,"
    "  `lane` varchar(100) NOT NULL,"
    "  `transport_cost` decimal(15,2) DEFAULT 0.00,"
    "  `accessorial_cost` decimal(15,2) DEFAULT 0.00,"
    "  `handling_cost` decimal(15,2) DEFAULT 0.00,"
    "  `overhead_cost` decimal(15,2) DEFAULT 0.00,"
    "  `revenue` decimal(15,2) DEFAULT 0.00,"
    "  `units` int DEFAULT 0,"
    "  `shipment_date` date DEFAULT NULL,"
    "  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`id`)"
    ") ENGINE=InnoDB")

def create_database(cursor):
    try:
        cursor.execute(f"CREATE DATABASE {DB_NAME} DEFAULT CHARACTER SET 'utf8'")
    except mysql.connector.Error as err:
        print(f"Failed creating database: {err}")
        exit(1)

def setup():
    print("Attempting to connect to MySQL...")
    try:
        # Connect to server only (remove database from config)
        config_no_db = DB_CONFIG.copy()
        if 'database' in config_no_db:
            del config_no_db['database']
            
        cnx = mysql.connector.connect(**config_no_db)
        cursor = cnx.cursor()
        print("Connected to MySQL Server.")
    except mysql.connector.Error as err:
        if err.errno == errorcode.ACCESS_DENIED_ERROR:
            print("ERROR: Access Denied. Your password in 'backend/db_config.py' is incorrect.")
        else:
            print(f"Error: {err}")
        return

    # Create/Select DB
    try:
        cursor.execute(f"USE {DB_NAME}")
        print(f"Using database '{DB_NAME}'.")
    except mysql.connector.Error as err:
        print(f"Database {DB_NAME} does not exist. Creating...")
        if err.errno == errorcode.ER_BAD_DB_ERROR:
            create_database(cursor)
            print("Database created.")
            cnx.database = DB_NAME
        else:
            print(err)
            exit(1)

    # Create Tables
    for table_name in TABLES:
        table_description = TABLES[table_name]
        try:
            print(f"Ensuring table {table_name}... ", end='')
            cursor.execute(table_description)
            print("OK")
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                print("exists.")
            else:
                print(err.msg)

    cursor.close()
    cnx.close()
    print("\nSUCCESS: MySQL Database setup complete.")

if __name__ == "__main__":
    setup()
