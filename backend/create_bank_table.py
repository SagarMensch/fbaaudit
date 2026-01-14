import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Password123!',
    database='ledgerone'
)
cursor = conn.cursor()

# Create bank_reconciliations table
cursor.execute("""
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id VARCHAR(36) PRIMARY KEY,
    statement_id VARCHAR(50),
    transaction_date DATE NOT NULL,
    value_date DATE,
    bank_reference VARCHAR(100),
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('CREDIT', 'DEBIT') NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    bank_account VARCHAR(50),
    status ENUM('UNMATCHED', 'MATCHED', 'EXCEPTION', 'IGNORED') DEFAULT 'UNMATCHED',
    matched_batch_id VARCHAR(36),
    matched_invoice_id VARCHAR(50),
    matched_by VARCHAR(100),
    matched_at DATETIME,
    exception_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()
print("bank_reconciliations table created!")

# Verify
cursor.execute("SHOW TABLES LIKE 'bank%'")
print("Tables:", cursor.fetchall())

cursor.close()
conn.close()
