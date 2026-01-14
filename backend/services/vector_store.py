"""
Vector Store Service - Supabase pgvector Integration
=====================================================
Handles all vector embedding operations using Supabase PostgreSQL with pgvector.
"""

import psycopg2
from psycopg2.extras import RealDictCursor, Json
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import json
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'  # 384 dimensions

class VectorStore:
    """
    Vector Store using Supabase pgvector for semantic search.
    """
    
    def __init__(self):
        print("[VectorStore] Initializing with SentenceTransformers...")
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.dimension = 384
    
    def get_connection(self):
        return psycopg2.connect(DATABASE_URL)
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text using SentenceTransformers"""
        embedding = self.model.encode(text)
        return embedding.tolist()
    
    def store_embedding(
        self, 
        content: str, 
        content_type: str, 
        source_id: str, 
        metadata: Optional[Dict] = None
    ) -> int:
        """Store a document with its embedding in Supabase"""
        embedding = self.generate_embedding(content)
        
        conn = self.get_connection()
        cur = conn.cursor()
        
        # Format embedding as PostgreSQL vector
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        cur.execute("""
            INSERT INTO document_embeddings (content, content_type, source_id, metadata, embedding)
            VALUES (%s, %s, %s, %s, %s::vector)
            RETURNING id
        """, (content, content_type, source_id, Json(metadata or {}), embedding_str))
        
        doc_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return doc_id
    
    def search_similar(self, query: str, top_k: int = 5, content_type: Optional[str] = None) -> List[Dict]:
        """
        Search for similar documents using cosine similarity.
        Returns top_k most similar documents.
        """
        query_embedding = self.generate_embedding(query)
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        conn = self.get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Build query with optional content_type filter
        if content_type:
            cur.execute("""
                SELECT 
                    id,
                    content,
                    content_type,
                    source_id,
                    metadata,
                    1 - (embedding <=> %s::vector) as similarity
                FROM document_embeddings
                WHERE content_type = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (embedding_str, content_type, embedding_str, top_k))
        else:
            cur.execute("""
                SELECT 
                    id,
                    content,
                    content_type,
                    source_id,
                    metadata,
                    1 - (embedding <=> %s::vector) as similarity
                FROM document_embeddings
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (embedding_str, embedding_str, top_k))
        
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        return [dict(r) for r in results]
    
    def delete_by_source(self, source_id: str) -> int:
        """Delete all embeddings for a specific source ID"""
        conn = self.get_connection()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM document_embeddings WHERE source_id = %s", (source_id,))
        deleted = cur.rowcount
        
        conn.commit()
        cur.close()
        conn.close()
        
        return deleted
    
    def clear_all(self):
        """Clear all embeddings (use with caution!)"""
        conn = self.get_connection()
        cur = conn.cursor()
        
        cur.execute("TRUNCATE document_embeddings RESTART IDENTITY")
        
        conn.commit()
        cur.close()
        conn.close()
    
    def get_stats(self) -> Dict:
        """Get statistics about stored embeddings"""
        conn = self.get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                content_type,
                COUNT(*) as count
            FROM document_embeddings
            GROUP BY content_type
        """)
        
        by_type = {r['content_type']: r['count'] for r in cur.fetchall()}
        
        cur.execute("SELECT COUNT(*) as total FROM document_embeddings")
        total = cur.fetchone()['total']
        
        cur.close()
        conn.close()
        
        return {
            'total': total,
            'by_type': by_type
        }


# Singleton instance
vector_store = VectorStore()


# Convenience functions
def store_embedding(content: str, content_type: str, source_id: str, metadata: Dict = None) -> int:
    return vector_store.store_embedding(content, content_type, source_id, metadata)

def search_similar(query: str, top_k: int = 5, content_type: str = None) -> List[Dict]:
    return vector_store.search_similar(query, top_k, content_type)

def get_embedding_stats() -> Dict:
    return vector_store.get_stats()
