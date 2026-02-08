"""
Unified 6-Layer Document Processing Pipeline
=============================================
Orchestrates all layers for comprehensive document intelligence:

Layer 0: UniversalIngestor (Docling) - Document parsing
Layer 1: LayoutEngine (Mistral) - Section classification
Layer 2: LotusEngine - Semantic DataFrame queries
Layer 3: ReActAgent - Reasoning & Acting loop
Layer 4: DittoMatcher - Entity matching
Layer 5: SimSearch - Vector similarity

Usage:
    pipeline = DocumentPipeline()
    result = await pipeline.process(file_path, vendor_id)
"""

import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Layer imports with graceful fallback
try:
    from modules.ingestion.universal_ingestor import UniversalIngestor
    LAYER_0_AVAILABLE = True
except ImportError:
    LAYER_0_AVAILABLE = False
    logger.warning("[Pipeline] Layer 0 (UniversalIngestor) not available")

try:
    from modules.ingestion.layout_engine import LayoutEngine
    LAYER_1_AVAILABLE = True
except ImportError:
    LAYER_1_AVAILABLE = False
    logger.warning("[Pipeline] Layer 1 (LayoutEngine) not available")

try:
    from modules.ingestion.lotus_engine import LotusEngine
    LAYER_2_AVAILABLE = True
except ImportError:
    LAYER_2_AVAILABLE = False
    logger.warning("[Pipeline] Layer 2 (LotusEngine) not available")

try:
    from modules.ingestion.react_agent import ReActAgent
    LAYER_3_AVAILABLE = True
except ImportError:
    LAYER_3_AVAILABLE = False
    logger.warning("[Pipeline] Layer 3 (ReActAgent) not available")

try:
    from modules.ingestion.ditto_matcher import DittoMatcher
    LAYER_4_AVAILABLE = True
except ImportError:
    LAYER_4_AVAILABLE = False
    logger.warning("[Pipeline] Layer 4 (DittoMatcher) not available")

try:
    from modules.ingestion.sim_search import SimSearch
    LAYER_5_AVAILABLE = True
except ImportError:
    LAYER_5_AVAILABLE = False
    logger.warning("[Pipeline] Layer 5 (SimSearch) not available")


class DocumentPipeline:
    """
    Unified 6-Layer Document Processing Pipeline
    
    Processes documents through all available layers:
    Docling → Mistral → LOTUS → ReAct → Ditto → SimSearch
    """
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client
        self.layers_used = []
        
        # Initialize available layers
        self.ingestor = UniversalIngestor() if LAYER_0_AVAILABLE else None
        self.layout_engine = LayoutEngine(llm_client) if LAYER_1_AVAILABLE else None
        self.sim_search = SimSearch() if LAYER_5_AVAILABLE else None
        self.lotus_engine = LotusEngine(llm_client) if LAYER_2_AVAILABLE else None
        self.ditto_matcher = DittoMatcher(self.sim_search, llm_client) if LAYER_4_AVAILABLE and self.sim_search else None
        self.react_agent = ReActAgent(self.lotus_engine, self.layout_engine, llm_client) if LAYER_3_AVAILABLE else None
        
        logger.info(f"[Pipeline] Initialized with layers: L0={LAYER_0_AVAILABLE}, L1={LAYER_1_AVAILABLE}, "
                   f"L2={LAYER_2_AVAILABLE}, L3={LAYER_3_AVAILABLE}, L4={LAYER_4_AVAILABLE}, L5={LAYER_5_AVAILABLE}")
    
    def process(self, file_path: str, vendor_id: str = None) -> Dict[str, Any]:
        """
        Process document through all 6 layers.
        
        Returns:
            Dict with extracted_data, confidence, layers_used, etc.
        """
        result = {
            "success": False,
            "file_path": file_path,
            "vendor_id": vendor_id,
            "extracted_data": {},
            "layers_used": [],
            "confidence": 0,
            "errors": []
        }
        
        if not os.path.exists(file_path):
            result["errors"].append(f"File not found: {file_path}")
            return result
        
        try:
            # ============ LAYER 0: UNIVERSAL INGESTION (DOCLING) ============
            if self.ingestor:
                logger.info("[Layer 0] Starting Docling ingestion...")
                ingest_result = self.ingestor.ingest(file_path)
                
                if ingest_result.get("status") == "success":
                    result["content_markdown"] = ingest_result.get("content_markdown", "")
                    result["tables"] = ingest_result.get("tables", [])
                    result["document_type"] = ingest_result.get("type", "unknown")
                    result["layers_used"].append("L0:Docling")
                    logger.info(f"[Layer 0] Parsed {len(result['content_markdown'])} chars, {len(result.get('tables', []))} tables")
                else:
                    result["errors"].append(f"Layer 0 failed: {ingest_result.get('error', 'Unknown')}")
            
            # ============ LAYER 1: LAYOUT ENGINE (MISTRAL) ============
            if self.layout_engine and result.get("content_markdown"):
                logger.info("[Layer 1] Starting Mistral layout analysis...")
                layout_result = self.layout_engine.analyze_layout({
                    "content_markdown": result["content_markdown"]
                })
                
                if layout_result.get("layout_analysis"):
                    result["layout"] = layout_result["layout_analysis"]
                    result["layers_used"].append("L1:Mistral-Layout")
                
                if layout_result.get("extracted_data"):
                    result["extracted_data"].update(layout_result["extracted_data"])
                    result["layers_used"].append("L1:Mistral-Fields")
                    logger.info(f"[Layer 1] Extracted {len(result['extracted_data'])} fields")
            
            # ============ LAYER 2: LOTUS SEMANTIC QUERIES ============
            if self.lotus_engine and result.get("tables"):
                logger.info("[Layer 2] Starting LOTUS semantic processing...")
                import pandas as pd
                
                for i, table in enumerate(result.get("tables", [])):
                    if table.get("data"):
                        df = pd.DataFrame(table["data"])
                        
                        # Semantic filter for freight-related rows
                        filtered_df = self.lotus_engine.sem_filter(df, "Keep rows related to freight, charges, or amounts")
                        
                        # Semantic map for extracting city from address
                        if "address" in df.columns.str.lower().tolist():
                            mapped_df = self.lotus_engine.sem_map(df, "city", "Extract city name from address")
                
                result["layers_used"].append("L2:LOTUS")
                logger.info("[Layer 2] Semantic processing complete")
            
            # ============ LAYER 4: DITTO ENTITY MATCHING ============
            if self.ditto_matcher and vendor_id:
                logger.info("[Layer 4] Starting Ditto entity matching...")
                
                # Try to match vendor from extracted data
                vendor_name = result["extracted_data"].get("vendor", {}).get("name") or \
                             result["extracted_data"].get("vendor_name")
                
                if vendor_name:
                    matched_vendor = self.ditto_matcher.match_entity(vendor_name, "vendors")
                    if matched_vendor:
                        result["extracted_data"]["matched_vendor_id"] = matched_vendor
                        result["layers_used"].append("L4:Ditto")
                        logger.info(f"[Layer 4] Matched vendor: {vendor_name} → {matched_vendor}")
            
            # ============ LAYER 3: REACT REASONING ============
            if self.react_agent and result.get("extracted_data"):
                logger.info("[Layer 3] Starting ReAct reasoning...")
                
                # Define validation task
                task = "Verify that the extracted invoice total matches the sum of line items. Check for discrepancies."
                
                reasoning_result = self.react_agent.solve(task, {
                    "extracted_data": result["extracted_data"],
                    "tables": result.get("tables", [])
                })
                
                result["reasoning"] = reasoning_result
                result["layers_used"].append("L3:ReAct")
                logger.info(f"[Layer 3] Reasoning complete: {reasoning_result[:100]}...")
            
            # ============ CALCULATE CONFIDENCE ============
            layers_count = len(result["layers_used"])
            base_confidence = 40 + (layers_count * 10)  # 40 base + 10 per layer
            
            # Boost confidence if we have critical fields
            if result["extracted_data"].get("grand_total") or result["extracted_data"].get("total_amount"):
                base_confidence += 15
            if result["extracted_data"].get("invoice_number"):
                base_confidence += 10
            if result["extracted_data"].get("invoice_date"):
                base_confidence += 5
            
            result["confidence"] = min(base_confidence, 98)  # Cap at 98%
            result["success"] = len(result["layers_used"]) > 0
            
            logger.info(f"[Pipeline] Complete: {len(result['layers_used'])} layers, {result['confidence']}% confidence")
            
        except Exception as e:
            logger.error(f"[Pipeline] Error: {e}")
            import traceback
            traceback.print_exc()
            result["errors"].append(str(e))
        
        return result
    
    def get_pipeline_status(self) -> Dict[str, bool]:
        """Return availability status of each layer."""
        return {
            "layer_0_docling": LAYER_0_AVAILABLE,
            "layer_1_mistral": LAYER_1_AVAILABLE,
            "layer_2_lotus": LAYER_2_AVAILABLE,
            "layer_3_react": LAYER_3_AVAILABLE,
            "layer_4_ditto": LAYER_4_AVAILABLE,
            "layer_5_simsearch": LAYER_5_AVAILABLE
        }


# Singleton instance
_pipeline: Optional[DocumentPipeline] = None

def get_document_pipeline(llm_client=None) -> DocumentPipeline:
    """Get or create singleton pipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = DocumentPipeline(llm_client)
    return _pipeline
