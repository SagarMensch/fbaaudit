"""
Supabase pgvector Setup Script
==============================
Enables the pgvector extension and creates the embeddings table.
"""

import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def setup_pgvector():
    print("=" * 60)
    print("🔧 Setting up pgvector in Supabase")
    print("=" * 60)
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Step 1: Enable pgvector extension
    print("\n1️⃣ Enabling pgvector extension...")
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        conn.commit()
        print("   ✅ pgvector extension enabled!")
    except Exception as e:
        print(f"   ⚠️ Extension error (may already exist): {e}")
        conn.rollback()
    
    # Step 2: Create document_embeddings table
    print("\n2️⃣ Creating document_embeddings table...")
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS document_embeddings (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                content_type VARCHAR(50),
                source_id VARCHAR(100),
                metadata JSONB,
                embedding vector(384),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        print("   ✅ document_embeddings table created!")
    except Exception as e:
        print(f"   ❌ Table creation error: {e}")
        conn.rollback()
    
    # Step 3: Create index for similarity search
    print("\n3️⃣ Creating vector similarity index...")
    try:
        cur.execute("""
            CREATE INDEX IF NOT EXISTS embedding_cosine_idx 
            ON document_embeddings 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)
        conn.commit()
        print("   ✅ Similarity index created!")
    except Exception as e:
        print(f"   ⚠️ Index error (may need more data first): {e}")
        conn.rollback()
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ pgvector setup complete!")
    print("=" * 60)

if __name__ == '__main__':
    setup_pgvector()
