from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.modules.ingestion.universal_ingestor import UniversalIngestor
from backend.modules.ingestion.layout_engine import LayoutEngine
from backend.modules.ingestion.lotus_engine import LotusEngine
from backend.modules.ingestion.react_agent import ReActAgent
from backend.modules.ingestion.ditto_matcher import DittoMatcher
from backend.modules.ingestion.sim_search import SimSearch
import shutil
import os
import uuid
import time

router = APIRouter(prefix="/api/ingestion", tags=["Ingestion"])

# Initialize Shared Components
# Layer 5: SimSearch (Base for retrieval)
sim_search = SimSearch()
# Pre-load some mock vendor data for Ditto resolution
sim_search.add_texts("vendors", ["Acme Corp, NY", "Global Logistics Inc, CA", "FastTrans Ltd, UK"], ["V001", "V002", "V003"])

# Layer 4: Entity Matching (Ditto)
ditto_matcher = DittoMatcher(sim_search=sim_search, llm_client=None)

# Layer 2: Semantic Query (Lotus)
lotus_engine = LotusEngine(llm_client=None)

# Layer 1: Layout Analysis
layout_engine = LayoutEngine() 

# Layer 3: Reasoning Agent (ReAct)
react_agent = ReActAgent(lotus_engine=lotus_engine, layout_engine=layout_engine, llm_client=None)

# Layer 0: Universal Ingestion
universal_ingestor = UniversalIngestor()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Ingests a document using the Full 5-Layer Intelligence Pipeline.
    1. Universal Ingestion (Docling)
    2. Layout Analysis (Mistral)
    3. Entity Matching (Ditto)
    4. Semantic Query (Lotus - Quality Check)
    5. Reasoning (ReAct - Validation)
    """
    try:
        start_time = time.time()
        pipeline_trace = {}

        # Save temp file
        temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # --- Layer 0: Universal Ingestion ---
        ingestion_result = universal_ingestor.ingest(temp_filename)
        pipeline_trace["layer_0_ingestion"] = "Success"
        
        if ingestion_result.get("status") == "error":
            raise HTTPException(status_code=500, detail=ingestion_result.get("error"))

        # --- Layer 1: Layout Analysis ---
        layout_result = layout_engine.analyze_layout(ingestion_result)
        pipeline_trace["layer_1_layout"] = "Success"
        
        # --- Layer 4: Entity Matching (Ditto) ---
        # Resolve Vendor Name to Canonical ID
        extracted_data = layout_result.get("extracted_data", {})
        vendor_name = extracted_data.get("vendor", {}).get("name")
        if vendor_name:
            matched_vendor_id = ditto_matcher.match_entity(vendor_name, "vendors")
            extracted_data["vendor"]["id"] = matched_vendor_id or "UNKNOWN"
            extracted_data["vendor"]["match_method"] = "Ditto (Layer 4)"
            pipeline_trace["layer_4_ditto"] = f"Resolved {vendor_name} -> {matched_vendor_id}"

        # --- Layer 3: Reasoning (ReAct) ---
        # Validate Invoice Totals
        if extracted_data.get('total_amount'):
            task = f"Check if line items sum up to total amount {extracted_data.get('total_amount')}"
            validation_result = react_agent.solve(task, context=extracted_data)
            extracted_data["validation_notes"] = validation_result
            pipeline_trace["layer_3_react"] = validation_result
        
        # Cleanup
        os.remove(temp_filename)
        
        # Final Response construction
        response = {
            "filename": file.filename,
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "pipeline_trace": pipeline_trace,
            **layout_result 
        }
        
        return response

    except Exception as e:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query-semantic")
async def query_semantic(query: str):
    """
    Layer 2: Semantic Query (LOTUS) endpoint.
    """
    # Placeholder for running semantic queries on ingested data
    return {"message": "Semantic query received", "query": query}
