"""
ColPali Visual Search - Visual Document RAG
============================================
Paper #5: "ColPali: Efficient Document Retrieval with Vision Language Models"

The Paradigm Shift:
- OLD WAY: OCR → Text → Embedding → Search
- COLPALI WAY: Image → Visual Embedding → Search (No OCR needed!)

This module generates visual embeddings for documents using CLIP/SigLIP
and enables semantic search without OCR.

Usage:
    from services.vdu.colpali_indexer import ColPaliIndexer
    
    indexer = ColPaliIndexer()
    
    # Index a document
    indexer.index_document("invoice.pdf", document_id="INV-001")
    
    # Search visually similar documents
    results = indexer.search("invoice from TCI Express", top_k=5)
"""

import os
import json
import time
import base64
import hashlib
import requests
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

# HuggingFace Inference API (Free tier available)
HF_API_KEY = os.getenv("HF_API_KEY") or os.getenv("HUGGINGFACE_API_KEY")
HF_EMBEDDING_MODEL = "openai/clip-vit-base-patch32"  # Fast, good for documents

# Groq for text-to-query enhancement
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# PostgreSQL for vector storage (using pgvector extension)
DATABASE_URL = os.getenv("DATABASE_URL")

# Lazy imports
_fitz = None
_Image = None
_np = None


def get_fitz():
    global _fitz
    if _fitz is None:
        try:
            import fitz
            _fitz = fitz
        except ImportError:
            pass
    return _fitz


def get_pil():
    global _Image
    if _Image is None:
        from PIL import Image
        _Image = Image
    return _Image


def get_numpy():
    global _np
    if _np is None:
        import numpy as np
        _np = np
    return _np


# ============================================================================
# EMBEDDING PROVIDER INTERFACE
# ============================================================================

class EmbeddingProvider:
    """Base class for embedding providers"""
    
    def embed_image(self, image_bytes: bytes) -> List[float]:
        raise NotImplementedError
    
    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError


class HuggingFaceEmbedding(EmbeddingProvider):
    """
    Use HuggingFace Inference API for embeddings
    Free tier: 30,000 requests/month
    """
    
    def __init__(self):
        self.api_key = HF_API_KEY
        self.model = HF_EMBEDDING_MODEL
        self.api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{self.model}"
    
    def embed_image(self, image_bytes: bytes) -> List[float]:
        """Generate embedding for an image"""
        if not self.api_key:
            return self._fallback_embedding(len(image_bytes))
        
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = requests.post(
                self.api_url,
                headers=headers,
                data=image_bytes,
                timeout=30
            )
            
            if response.status_code == 200:
                embedding = response.json()
                # CLIP returns nested arrays, flatten
                if isinstance(embedding, list) and isinstance(embedding[0], list):
                    embedding = embedding[0]
                return embedding
            else:
                print(f"⚠️ HuggingFace API error: {response.status_code}")
                return self._fallback_embedding(len(image_bytes))
                
        except Exception as e:
            print(f"⚠️ Embedding failed: {e}")
            return self._fallback_embedding(len(image_bytes))
    
    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text query"""
        if not self.api_key:
            return self._fallback_embedding(len(text))
        
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = requests.post(
                self.api_url,
                headers=headers,
                json={"inputs": text},
                timeout=30
            )
            
            if response.status_code == 200:
                embedding = response.json()
                if isinstance(embedding, list) and isinstance(embedding[0], list):
                    embedding = embedding[0]
                return embedding
            else:
                return self._fallback_embedding(len(text))
                
        except Exception as e:
            print(f"⚠️ Text embedding failed: {e}")
            return self._fallback_embedding(len(text))
    
    def _fallback_embedding(self, seed: int) -> List[float]:
        """Generate deterministic fallback embedding when API unavailable"""
        np = get_numpy()
        np.random.seed(seed % 10000)
        return list(np.random.randn(512).astype(float))


class LocalCLIPEmbedding(EmbeddingProvider):
    """
    Use local CLIP model (requires transformers + torch)
    Falls back to HuggingFace API if not available
    """
    
    def __init__(self):
        self.model = None
        self.processor = None
        self._initialized = False
    
    def _init(self):
        if self._initialized:
            return
        
        try:
            from transformers import CLIPProcessor, CLIPModel
            import torch
            
            self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            self._initialized = True
            print("✅ Local CLIP model loaded")
            
        except ImportError:
            print("⚠️ Local CLIP not available, using HuggingFace API")
            self._initialized = False
    
    def embed_image(self, image_bytes: bytes) -> List[float]:
        self._init()
        
        if not self._initialized:
            return HuggingFaceEmbedding().embed_image(image_bytes)
        
        try:
            import torch
            from io import BytesIO
            Image = get_pil()
            
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                features = self.model.get_image_features(**inputs)
            
            # Normalize
            features = features / features.norm(dim=-1, keepdim=True)
            return features[0].cpu().numpy().tolist()
            
        except Exception as e:
            print(f"⚠️ Local embedding failed: {e}")
            return HuggingFaceEmbedding().embed_image(image_bytes)
    
    def embed_text(self, text: str) -> List[float]:
        self._init()
        
        if not self._initialized:
            return HuggingFaceEmbedding().embed_text(text)
        
        try:
            import torch
            
            inputs = self.processor(text=[text], return_tensors="pt", padding=True).to(self.device)
            
            with torch.no_grad():
                features = self.model.get_text_features(**inputs)
            
            features = features / features.norm(dim=-1, keepdim=True)
            return features[0].cpu().numpy().tolist()
            
        except Exception as e:
            return HuggingFaceEmbedding().embed_text(text)


# ============================================================================
# VECTOR STORAGE
# ============================================================================

@dataclass
class DocumentIndex:
    """Indexed document record"""
    document_id: str
    file_path: str
    embedding: List[float]
    page: int = 0
    thumbnail_path: Optional[str] = None
    metadata: Dict[str, Any] = None
    indexed_at: str = None
    
    def to_dict(self) -> Dict:
        return {
            "document_id": self.document_id,
            "file_path": self.file_path,
            "page": self.page,
            "thumbnail_path": self.thumbnail_path,
            "metadata": self.metadata,
            "indexed_at": self.indexed_at
        }


class VectorStore:
    """
    Vector storage for document embeddings
    
    Supports:
    1. In-memory storage (for development)
    2. PostgreSQL with pgvector (for production)
    """
    
    def __init__(self, use_postgres: bool = False):
        self.use_postgres = use_postgres and DATABASE_URL
        self._memory_store: Dict[str, DocumentIndex] = {}
        
        if self.use_postgres:
            self._init_postgres()
    
    def _init_postgres(self):
        """Initialize PostgreSQL with pgvector"""
        try:
            import psycopg2
            
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Enable pgvector extension
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            
            # Create embeddings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS document_embeddings (
                    id SERIAL PRIMARY KEY,
                    document_id VARCHAR(100) UNIQUE NOT NULL,
                    file_path TEXT,
                    page INTEGER DEFAULT 0,
                    embedding vector(512),
                    thumbnail_path TEXT,
                    metadata JSONB,
                    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_document_embedding 
                ON document_embeddings USING ivfflat (embedding vector_cosine_ops);
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            print("✅ PostgreSQL vector store initialized")
            
        except Exception as e:
            print(f"⚠️ PostgreSQL init failed: {e}, using in-memory store")
            self.use_postgres = False
    
    def store(self, doc_index: DocumentIndex):
        """Store a document embedding"""
        if self.use_postgres:
            self._store_postgres(doc_index)
        else:
            self._memory_store[doc_index.document_id] = doc_index
    
    def _store_postgres(self, doc_index: DocumentIndex):
        try:
            import psycopg2
            import psycopg2.extras
            
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO document_embeddings 
                (document_id, file_path, page, embedding, thumbnail_path, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    metadata = EXCLUDED.metadata,
                    indexed_at = CURRENT_TIMESTAMP;
            """, (
                doc_index.document_id,
                doc_index.file_path,
                doc_index.page,
                doc_index.embedding,
                doc_index.thumbnail_path,
                json.dumps(doc_index.metadata) if doc_index.metadata else None
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"⚠️ Store failed: {e}")
            self._memory_store[doc_index.document_id] = doc_index
    
    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Tuple[DocumentIndex, float]]:
        """Search for similar documents"""
        if self.use_postgres:
            return self._search_postgres(query_embedding, top_k)
        else:
            return self._search_memory(query_embedding, top_k)
    
    def _search_memory(self, query_embedding: List[float], top_k: int) -> List[Tuple[DocumentIndex, float]]:
        """In-memory cosine similarity search"""
        np = get_numpy()
        query = np.array(query_embedding)
        
        results = []
        for doc_id, doc_index in self._memory_store.items():
            doc_emb = np.array(doc_index.embedding)
            # Cosine similarity
            similarity = np.dot(query, doc_emb) / (np.linalg.norm(query) * np.linalg.norm(doc_emb))
            results.append((doc_index, float(similarity)))
        
        # Sort by similarity (descending)
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    def _search_postgres(self, query_embedding: List[float], top_k: int) -> List[Tuple[DocumentIndex, float]]:
        """PostgreSQL vector search using pgvector"""
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT 
                    document_id,
                    file_path,
                    page,
                    thumbnail_path,
                    metadata,
                    indexed_at,
                    1 - (embedding <=> %s::vector) as similarity
                FROM document_embeddings
                ORDER BY embedding <=> %s::vector
                LIMIT %s;
            """, (query_embedding, query_embedding, top_k))
            
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            
            results = []
            for row in rows:
                doc_index = DocumentIndex(
                    document_id=row['document_id'],
                    file_path=row['file_path'],
                    embedding=[],  # Don't return full embedding
                    page=row['page'],
                    thumbnail_path=row['thumbnail_path'],
                    metadata=row['metadata'],
                    indexed_at=str(row['indexed_at'])
                )
                results.append((doc_index, row['similarity']))
            
            return results
            
        except Exception as e:
            print(f"⚠️ Postgres search failed: {e}")
            return self._search_memory(query_embedding, top_k)


# ============================================================================
# COLPALI INDEXER (Main Class)
# ============================================================================

class ColPaliIndexer:
    """
    ColPali-style Visual Document Indexer
    
    This implements the core concept from ColPali paper:
    - Index documents by their VISUAL appearance, not OCR text
    - Search using natural language queries
    - Find visually similar documents
    
    Perfect for:
    - "Find invoices that look like this one"
    - "Show me all documents from TCI Express" (by logo/letterhead)
    - "Find handwritten LRs" (by visual style)
    """
    
    def __init__(self, use_local_model: bool = False, use_postgres: bool = False):
        """
        Initialize ColPali indexer
        
        Args:
            use_local_model: Use local CLIP instead of HuggingFace API
            use_postgres: Use PostgreSQL for vector storage
        """
        if use_local_model:
            self.embedding_provider = LocalCLIPEmbedding()
        else:
            self.embedding_provider = HuggingFaceEmbedding()
        
        self.vector_store = VectorStore(use_postgres=use_postgres)
        self.groq_api_key = GROQ_API_KEY
        
        print("✅ ColPaliIndexer initialized")
    
    def index_document(
        self,
        file_path: str,
        document_id: str = None,
        metadata: Dict[str, Any] = None,
        pages_to_index: int = 3
    ) -> Dict[str, Any]:
        """
        Index a document for visual search
        
        Args:
            file_path: Path to PDF or image
            document_id: Unique ID (auto-generated if not provided)
            metadata: Additional metadata to store
            pages_to_index: Number of pages to index for PDFs
            
        Returns:
            Dict with indexing results
        """
        start_time = time.time()
        
        if not document_id:
            document_id = hashlib.md5(file_path.encode()).hexdigest()[:16]
        
        # Convert to images
        images = self._get_document_images(file_path, pages_to_index)
        
        indexed_pages = []
        for page_idx, img_bytes in enumerate(images):
            # Generate embedding
            embedding = self.embedding_provider.embed_image(img_bytes)
            
            # Create index entry
            page_id = f"{document_id}_p{page_idx}"
            doc_index = DocumentIndex(
                document_id=page_id,
                file_path=file_path,
                embedding=embedding,
                page=page_idx,
                metadata=metadata,
                indexed_at=datetime.now().isoformat()
            )
            
            # Store
            self.vector_store.store(doc_index)
            indexed_pages.append(page_idx)
        
        return {
            "success": True,
            "document_id": document_id,
            "pages_indexed": indexed_pages,
            "processing_time_s": round(time.time() - start_time, 3)
        }
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        enhance_query: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search for documents using natural language
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            enhance_query: Use Groq to enhance the search query
            
        Returns:
            List of matching documents with similarity scores
        """
        # Optionally enhance query with Groq
        if enhance_query and self.groq_api_key:
            query = self._enhance_query(query)
        
        # Generate query embedding
        query_embedding = self.embedding_provider.embed_text(query)
        
        # Search
        results = self.vector_store.search(query_embedding, top_k)
        
        return [
            {
                "document_id": doc.document_id,
                "file_path": doc.file_path,
                "page": doc.page,
                "similarity": round(score, 4),
                "metadata": doc.metadata
            }
            for doc, score in results
        ]
    
    def search_by_image(
        self,
        image_path: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find documents visually similar to a given image
        
        Args:
            image_path: Path to query image
            top_k: Number of results
            
        Returns:
            List of similar documents
        """
        # Get image bytes
        images = self._get_document_images(image_path, 1)
        if not images:
            return []
        
        # Generate embedding
        query_embedding = self.embedding_provider.embed_image(images[0])
        
        # Search
        results = self.vector_store.search(query_embedding, top_k)
        
        return [
            {
                "document_id": doc.document_id,
                "file_path": doc.file_path,
                "page": doc.page,
                "similarity": round(score, 4),
                "metadata": doc.metadata
            }
            for doc, score in results
        ]
    
    def _get_document_images(self, file_path: str, max_pages: int) -> List[bytes]:
        """Convert document to images"""
        fitz = get_fitz()
        Image = get_pil()
        
        ext = os.path.splitext(file_path)[1].lower()
        images = []
        
        if ext == ".pdf" and fitz:
            try:
                doc = fitz.open(file_path)
                for page_idx in range(min(len(doc), max_pages)):
                    page = doc[page_idx]
                    pix = page.get_pixmap(dpi=150)
                    images.append(pix.tobytes("png"))
                doc.close()
            except Exception as e:
                print(f"⚠️ PDF conversion failed: {e}")
        else:
            try:
                with open(file_path, "rb") as f:
                    images.append(f.read())
            except Exception as e:
                print(f"⚠️ Image read failed: {e}")
        
        return images
    
    def _enhance_query(self, query: str) -> str:
        """Use Groq to enhance search query for better visual matching"""
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You enhance document search queries. Add visual descriptors that would help match document appearance. Keep it short."
                        },
                        {
                            "role": "user",
                            "content": f"Enhance this search query for visual document matching: '{query}'"
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 100
                },
                timeout=10
            )
            
            if response.status_code == 200:
                enhanced = response.json()["choices"][0]["message"]["content"]
                return enhanced.strip().strip('"')
            
        except Exception as e:
            print(f"⚠️ Query enhancement failed: {e}")
        
        return query


# ============================================================================
# SINGLETON & CONVENIENCE
# ============================================================================

_colpali_indexer: Optional[ColPaliIndexer] = None


def get_colpali_indexer() -> ColPaliIndexer:
    global _colpali_indexer
    if _colpali_indexer is None:
        _colpali_indexer = ColPaliIndexer()
    return _colpali_indexer


def index_document(file_path: str, document_id: str = None) -> Dict[str, Any]:
    """Index a document for visual search"""
    return get_colpali_indexer().index_document(file_path, document_id)


def visual_search(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Search documents using natural language"""
    return get_colpali_indexer().search(query, top_k)


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("ColPali Visual Search Test")
    print("=" * 60)
    
    indexer = ColPaliIndexer()
    print(f"✅ Indexer ready")
    print(f"   HuggingFace API: {'✅' if HF_API_KEY else '❌'}")
    print(f"   Groq API: {'✅' if GROQ_API_KEY else '❌'}")
