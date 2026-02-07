from typing import List, Dict, Any, Tuple
import numpy as np

class SimSearch:
    """
    Layer 5: Similarity Search
    Provides fast vector retrieval for Entity Matching and Semantic Join.
    """

    def __init__(self, embedding_model=None):
        self.encoder = embedding_model # Inject SentenceTransformer or similar
        self.index = {} # Simple in-memory index for MVP: { "collection_name": {"vectors": np.array, "ids": []} }

    def add_texts(self, collection: str, texts: List[str], ids: List[str]):
        """
        Embeds and indexes texts.
        """
        if not self.encoder:
            print("Warning: No encoder provided for SimSearch. Using mock embeddings.")
            embeddings = np.random.rand(len(texts), 384) # Mock
        else:
            embeddings = self.encoder.encode(texts)
            
        if collection not in self.index:
            self.index[collection] = {"vectors": None, "ids": []}
            
        current = self.index[collection]
        if current["vectors"] is None:
            current["vectors"] = embeddings
        else:
            current["vectors"] = np.vstack([current["vectors"], embeddings])
            
        current["ids"].extend(ids)

    def search(self, collection: str, query: str, top_k: int = 1) -> List[Tuple[str, float]]:
        """
        Retrieves top_k similar items.
        """
        if collection not in self.index or self.index[collection]["vectors"] is None:
            return []

        if not self.encoder:
            query_vec = np.random.rand(1, 384)
        else:
            query_vec = self.encoder.encode([query])

        vectors = self.index[collection]["vectors"]
        
        # Cosine similarity
        scores = np.dot(vectors, query_vec.T).flatten()
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        ids = self.index[collection]["ids"]
        for idx in top_indices:
            results.append((ids[idx], float(scores[idx])))
            
        return results
