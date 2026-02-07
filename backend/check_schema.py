
from services.postgres_helper import get_postgres_connection

def check_schema():
    conn = get_postgres_connection()
    if not conn:
        print("Failed")
        return
    cur = conn.cursor()
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices'")
    rows = cur.fetchall()
    columns = [r[0] for r in rows]
    print("Columns found:")
    for c in columns:
        print(f" - {c}")
    conn.close()

if __name__ == '__main__':
    check_schema()
