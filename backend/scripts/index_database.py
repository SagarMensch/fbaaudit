"""
Database Indexing Script for RAG
================================
Creates embeddings for all data in Supabase and stores them in pgvector.
"""

import psycopg2
from psycopg2.extras import RealDictCursor, Json
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import os
import json

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'

# Initialize embedding model
print("📦 Loading embedding model...")
model = SentenceTransformer(EMBEDDING_MODEL)
print("✅ Model loaded!")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def generate_embedding(text: str):
    """Generate embedding vector for text"""
    embedding = model.encode(text)
    return '[' + ','.join(map(str, embedding.tolist())) + ']'


def clear_embeddings():
    """Clear all existing embeddings"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM document_embeddings")
    conn.commit()
    cur.close()
    conn.close()
    print("🗑️ Cleared existing embeddings")


def index_invoices():
    """Index all invoices"""
    print("\n📄 Indexing invoices...")
    
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id, invoice_number, vendor_name, origin, destination, 
               total_amount, status, vehicle_number
        FROM invoices
    """)
    
    invoices = cur.fetchall()
    count = 0
    
    for inv in invoices:
        # Create descriptive text for the invoice
        text = f"""Invoice {inv['invoice_number'] or 'N/A'}: 
        Vendor: {inv['vendor_name'] or 'Unknown'}
        Route: {inv['origin'] or 'N/A'} to {inv['destination'] or 'N/A'}
        Amount: ₹{inv['total_amount'] or 0}
        Status: {inv['status'] or 'Unknown'}
        Vehicle: {inv['vehicle_number'] or 'N/A'}"""
        
        embedding = generate_embedding(text)
        
        try:
            cur.execute("""
                INSERT INTO document_embeddings (content, content_type, source_id, metadata, embedding)
                VALUES (%s, 'invoice', %s, %s, %s::vector)
            """, (text, inv['id'], Json(dict(inv)), embedding))
            count += 1
        except Exception as e:
            print(f"   Error indexing invoice {inv['id']}: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"   ✅ Indexed {count} invoices")
    return count


def index_vendors():
    """Index all vendors"""
    print("\n🏢 Indexing vendors...")
    
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id, name, type, gstin, contact_name, city, state, 
               performance_grade, is_active
        FROM vendors
    """)
    
    vendors = cur.fetchall()
    count = 0
    
    for v in vendors:
        text = f"""Vendor {v['name'] or 'Unknown'}:
        Type: {v['type'] or 'N/A'}
        GSTIN: {v['gstin'] or 'N/A'}
        Contact: {v['contact_name'] or 'N/A'}
        Location: {v['city'] or 'N/A'}, {v['state'] or 'N/A'}
        Performance Grade: {v['performance_grade'] or 'N/A'}
        Active: {'Yes' if v['is_active'] else 'No'}"""
        
        embedding = generate_embedding(text)
        
        try:
            cur.execute("""
                INSERT INTO document_embeddings (content, content_type, source_id, metadata, embedding)
                VALUES (%s, 'vendor', %s, %s, %s::vector)
            """, (text, v['id'], Json(dict(v)), embedding))
            count += 1
        except Exception as e:
            print(f"   Error indexing vendor {v['id']}: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"   ✅ Indexed {count} vendors")
    return count


def index_contracts():
    """Index all contracts"""
    print("\n📋 Indexing contracts...")
    
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT id, vendor_id, vendor_name, service_type, status, 
               payment_terms, valid_from, valid_to
        FROM contracts
    """)
    
    contracts = cur.fetchall()
    count = 0
    
    for c in contracts:
        text = f"""Contract {c['id']}:
        Vendor: {c['vendor_name'] or 'Unknown'}
        Service Type: {c['service_type'] or 'N/A'}
        Status: {c['status'] or 'N/A'}
        Payment Terms: {c['payment_terms'] or 'N/A'}
        Valid From: {c['valid_from']}
        Valid To: {c['valid_to']}"""
        
        embedding = generate_embedding(text)
        
        try:
            cur.execute("""
                INSERT INTO document_embeddings (content, content_type, source_id, metadata, embedding)
                VALUES (%s, 'contract', %s, %s, %s::vector)
            """, (text, c['id'], Json({k: str(v) for k, v in dict(c).items()}), embedding))
            count += 1
        except Exception as e:
            print(f"   Error indexing contract {c['id']}: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"   ✅ Indexed {count} contracts")
    return count


def index_freight_rates():
    """Index all freight rates"""
    print("\n🚛 Indexing freight rates...")
    
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT fr.id, fr.origin, fr.destination, fr.vehicle_type, 
               fr.base_rate, fr.rate_basis, c.vendor_name
        FROM freight_rates fr
        LEFT JOIN contracts c ON c.id = fr.contract_id
        WHERE fr.is_active = TRUE
    """)
    
    rates = cur.fetchall()
    count = 0
    
    for r in rates:
        text = f"""Freight Rate from {r['origin'] or 'N/A'} to {r['destination'] or 'N/A'}:
        Vendor: {r['vendor_name'] or 'Unknown'}
        Vehicle Type: {r['vehicle_type'] or 'N/A'}
        Base Rate: ₹{r['base_rate'] or 0}
        Rate Basis: {r['rate_basis'] or 'Per Trip'}"""
        
        embedding = generate_embedding(text)
        
        try:
            cur.execute("""
                INSERT INTO document_embeddings (content, content_type, source_id, metadata, embedding)
                VALUES (%s, 'freight_rate', %s, %s, %s::vector)
            """, (text, r['id'], Json({k: str(v) for k, v in dict(r).items()}), embedding))
            count += 1
        except Exception as e:
            print(f"   Error indexing rate {r['id']}: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"   ✅ Indexed {count} freight rates")
    return count


def index_all():
    """Main indexing function"""
    print("=" * 60)
    print("🚀 RAG Database Indexing - Creating Embeddings")
    print("=" * 60)
    
    # Clear existing embeddings
    clear_embeddings()
    
    # Index all data types
    total = 0
    total += index_invoices()
    total += index_vendors()
    total += index_contracts()
    total += index_freight_rates()
    
    print("\n" + "=" * 60)
    print(f"✅ INDEXING COMPLETE! Total documents: {total}")
    print("=" * 60)
    
    # Show stats
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT content_type, COUNT(*) as count 
        FROM document_embeddings 
        GROUP BY content_type
    """)
    stats = cur.fetchall()
    
    print("\n📊 Embedding Statistics:")
    for content_type, count in stats:
        print(f"   {content_type}: {count} documents")
    
    cur.close()
    conn.close()


if __name__ == '__main__':
    index_all()
