"""
Database Configuration - PostgreSQL/Supabase Only
All MySQL dependencies have been removed.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration (Supabase / PostgreSQL)
# Uses DATABASE_URL from .env
DATABASE_URL = os.getenv('DATABASE_URL')

# Validate connection string
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Please configure your .env file.")

# Upload Directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Database name (extracted from URL for compatibility)
DB_NAME = 'postgres'
