import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration (Supabase / PostgreSQL)
# Uses DATABASE_URL from .env if available
DATABASE_URL = os.getenv('DATABASE_URL')
# Fallback for local dev if needed (Optional)
# DATABASE_URL = 'postgresql://user:pass@localhost:5432/ledgerone'

# Upload Directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
DB_NAME = 'ledgerone'  # Postgres usually connects to DB directly via URL


# Backward compatibility for non-migrated services
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'ledgerone'
}
DB_NAME = 'ledgerone'
