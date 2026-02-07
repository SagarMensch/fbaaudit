"""
Advanced RAG Engine - Groq (Llama 3.3 70B) + Supabase pgvector
===============================================================
Production-grade RAG chatbot using:
- Groq LPU for LIGHTNING FAST inference (Llama 3.3 70B)
- Supabase pgvector for vector similarity search
- SentenceTransformers for embeddings

Groq is the FASTEST LLM provider - responses in milliseconds!
"""

from groq import Groq
from sentence_transformers import SentenceTransformer
import json
import os
import hashlib
from functools import lru_cache
from dotenv import load_dotenv

# Database imports
from services.db_service import get_db_connection
from services.vector_store import search_similar, get_embedding_stats

load_dotenv()

# Configuration
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'
GROQ_MODEL = 'llama-3.3-70b-versatile'  # Best for RAG - fast and accurate
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("✅ Groq (Llama 3.3 70B) connected!")
else:
    print("⚠️ GROQ_API_KEY not set. Get free key from https://console.groq.com")


class RAGController:
    """
    Advanced RAG Controller using Groq LPU + Supabase pgvector.
    Groq provides the FASTEST inference - responses in milliseconds!
    """
    
    def __init__(self):
        print("🚀 Initializing Advanced RAG Engine (Groq LPU + pgvector)...")
        
        try:
            # Initialize embedding model for queries
            self.embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            
            if groq_client:
                print("✅ RAG Engine Online (Groq Llama 3.3 70B + Supabase pgvector)")
            else:
                print("⚠️ Groq not configured - set GROQ_API_KEY in .env")
            
        except Exception as e:
            print(f"❌ RAG Engine Init Error: {e}")
    
    def classify_intent(self, query: str) -> tuple:
        """Fast intent classification for query routing."""
        query_lower = query.lower().strip()
        
        # GREETING PATTERNS
        greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 
                     'thanks', 'thank you', 'bye', 'goodbye', 'how are you']
        if any(greet in query_lower for greet in greetings):
            return 'greeting', 1.0
        
        # DATA QUERIES (invoices, contracts, vendors)
        data_keywords = ['invoice', 'contract', 'vendor', 'supplier', 'rate', 
                        'shipment', 'freight', 'payment', 'amount', 'status']
        if any(kw in query_lower for kw in data_keywords):
            return 'data_query', 0.9
        
        # SIMPLE QUERIES
        simple_keywords = ['count', 'how many', 'total', 'list', 'show me', 'what is']
        if any(kw in query_lower for kw in simple_keywords):
            return 'simple', 0.8
        
        # COMPLEX QUERIES
        complex_keywords = ['analyze', 'compare', 'trend', 'forecast', 'why', 'explain', 
                           'optimize', 'recommend', 'best', 'worst']
        if any(kw in query_lower for kw in complex_keywords):
            return 'complex', 0.9
        
        return 'simple', 0.6
    
    def get_vector_context(self, query: str, intent: str) -> str:
        """Get relevant context from Supabase pgvector using semantic search."""
        if intent == 'greeting':
            return ""
        
        try:
            # Search for similar documents in pgvector
            results = search_similar(query, top_k=5)
            
            if not results:
                return self.get_sql_context(query)
            
            # Format context from vector search results
            context_parts = []
            for r in results:
                similarity = r.get('similarity', 0)
                content = r.get('content', '')
                content_type = r.get('content_type', 'unknown')
                
                if similarity > 0.3:
                    context_parts.append(f"[{content_type.upper()}] {content}")
            
            if context_parts:
                return "\n".join(context_parts)
            else:
                return self.get_sql_context(query)
                
        except Exception as e:
            print(f"Vector search error: {e}")
            return self.get_sql_context(query)
    
    def get_sql_context(self, query: str) -> str:
        """
        Get comprehensive context using advanced SQL queries.
        Leverages PostgreSQL's full power for ANY question.
        """
        try:
            from advanced_sql_context import AdvancedSQLContext
            return AdvancedSQLContext.get_comprehensive_context(query)
        except Exception as e:
            print(f"❌ Advanced SQL context error: {e}")
            import traceback
            traceback.print_exc()
            return "Database context unavailable."
    
    def query_groq(self, messages: list) -> str:
        """Query Groq's Llama 3.3 70B - LIGHTNING FAST!"""
        if not groq_client:
            return "Groq API not configured. Please set GROQ_API_KEY in .env (Get free key: https://console.groq.com)"
        
        try:
            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq error: {e}")
            return f"Error: {str(e)}"
    
    @lru_cache(maxsize=100)
    def get_cached_response(self, query_hash: str):
        return None
    
    def process_query(self, query: str) -> dict:
        """Main entry point for processing user queries."""
        print(f"\n🔍 Query: {query}")
        
        # 1. CLASSIFY INTENT
        intent, confidence = self.classify_intent(query)
        print(f"📊 Intent: {intent} (confidence: {confidence:.2f})")
        
        # 2. CHECK CACHE
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()
        cached = self.get_cached_response(query_hash)
        if cached:
            print("⚡ Cache hit!")
            return cached
        
        # 3. GET CONTEXT
        context = self.get_vector_context(query, intent)
        
        # 4. BUILD MESSAGES
        if intent == 'greeting':
            messages = [
                {"role": "system", "content": """You are Vector, a friendly AI assistant for LedgerOne - a logistics and freight audit platform.
Keep responses brief and warm. You help users track invoices, contracts, and vendor information."""},
                {"role": "user", "content": query}
            ]
        else:
            messages = [
                {"role": "system", "content": f"""You are Vector, an AI Logistics Assistant for LedgerOne.
You have access to real-time data from the company's database.

YOUR DATA ACCESS:
{context}

INSTRUCTIONS:
1. Answer questions based on the data provided above
2. Be specific - include invoice numbers, amounts, vendor names
3. For tracking: show status, origin/destination, amounts
4. For contracts: show vendor, terms, validity
5. If data is missing, say so clearly
6. Keep responses concise but complete"""},
                {"role": "user", "content": query}
            ]
        
        # 5. QUERY GROQ (LIGHTNING FAST!)
        print(f"⚡ Querying Groq (Llama 3.3 70B)...")
        response = self.query_groq(messages)
        
        # 6. FORMAT RESPONSE
        result = {
            "message": response,
            "intent": intent,
            "model_used": GROQ_MODEL,
            "confidence": confidence
        }
        
        return result
    
    def ingest_data(self, invoices=None, rates=None):
        """Legacy method - use scripts/index_database.py instead"""
        print("ℹ️ Use scripts/index_database.py for data ingestion")
        return
    
    def search(self, query: str, n_results: int = 3) -> list:
        """Search using pgvector"""
        results = search_similar(query, top_k=n_results)
        return [r.get('content', '') for r in results]


# Singleton instance
rag_controller = RAGController()
