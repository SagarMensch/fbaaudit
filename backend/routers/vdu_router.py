"""
VDU API Router - Visual Document Understanding Endpoints
========================================================
Exposes the complete VDU system via FastAPI endpoints.

Endpoints:
- POST /api/vdu/extract - Extract structured data from document
- POST /api/vdu/index - Index document for visual search
- POST /api/vdu/search - Visual document search
- POST /api/vdu/learn - Learn from user correction
- GET /api/vdu/templates - List learned templates
- POST /api/vdu/detect-forms - Detect form elements
- POST /api/vdu/generate-test - Generate test documents
"""

import os
import json
import tempfile
import shutil
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Import VDU components
from services.vdu import (
    VDUEngine, get_vdu_engine, vdu_extract,
    ColPaliIndexer, get_colpali_indexer,
    FormDetector, get_form_detector,
    TemplateLearner, get_template_learner,
    SyntheticGenerator, get_synthetic_generator,
    ConfidenceCalibrator, get_confidence_calibrator
)

router = APIRouter(prefix="/api/vdu", tags=["VDU - Visual Document Understanding"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ExtractionRequest(BaseModel):
    document_type: str = "INVOICE"
    use_vision: bool = False
    calibrate_confidence: bool = True


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    enhance_query: bool = True


class LearnRequest(BaseModel):
    vendor_id: str
    vendor_name: str
    raw_text: str
    corrected_data: Dict[str, Any]
    document_type: str = "INVOICE"


class GenerateRequest(BaseModel):
    document_type: str = "INVOICE"
    count: int = 1
    difficulty: str = "normal"
    use_groq: bool = False


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    document_type: str = Form("INVOICE"),
    use_vision: bool = Form(False),
    calibrate_confidence: bool = Form(True)
):
    """
    Extract structured data from a document
    
    - **file**: PDF or image file
    - **document_type**: INVOICE, LR, POD, PO
    - **use_vision**: Use vision model for better accuracy (slower)
    - **calibrate_confidence**: Apply confidence calibration
    
    Returns extracted fields with confidence scores.
    """
    # Save uploaded file temporarily
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Get VDU engine
        engine = get_vdu_engine()
        
        # Extract
        if use_vision:
            result = engine.extract_with_vision(temp_path, document_type)
        else:
            result = engine.extract(temp_path, document_type)
        
        # Calibrate confidence if requested
        if calibrate_confidence and result.get("success"):
            calibrator = get_confidence_calibrator()
            confidence_result = calibrator.calibrate(
                extracted_data=result.get("extracted_data", {}),
                raw_text=result.get("raw_text", "")
            )
            result["confidence"] = confidence_result
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/index")
async def index_document_endpoint(
    file: UploadFile = File(...),
    document_id: str = Form(None),
    metadata: str = Form(None)  # JSON string
):
    """
    Index a document for visual search (ColPali)
    
    - **file**: PDF or image file
    - **document_id**: Optional unique ID
    - **metadata**: Optional JSON metadata
    
    After indexing, the document can be found via visual search.
    """
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        indexer = get_colpali_indexer()
        
        meta = json.loads(metadata) if metadata else None
        
        result = indexer.index_document(
            file_path=temp_path,
            document_id=document_id,
            metadata=meta
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/search")
async def visual_search_endpoint(request: SearchRequest):
    """
    Search documents using natural language (ColPali)
    
    - **query**: Natural language search query
    - **top_k**: Number of results to return
    - **enhance_query**: Use LLM to improve query
    
    Returns visually similar documents ranked by relevance.
    """
    try:
        indexer = get_colpali_indexer()
        results = indexer.search(
            query=request.query,
            top_k=request.top_k,
            enhance_query=request.enhance_query
        )
        
        return {
            "success": True,
            "query": request.query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search-by-image")
async def search_by_image_endpoint(
    file: UploadFile = File(...),
    top_k: int = Form(5)
):
    """
    Find documents visually similar to an uploaded image
    """
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        indexer = get_colpali_indexer()
        results = indexer.search_by_image(temp_path, top_k)
        
        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/learn")
async def learn_from_correction(request: LearnRequest):
    """
    Learn extraction patterns from user corrections (One-Shot Learning)
    
    When a user corrects extracted data, call this endpoint to teach
    the system the vendor's document layout.
    """
    try:
        learner = get_template_learner()
        
        result = learner.learn_from_correction(
            vendor_id=request.vendor_id,
            vendor_name=request.vendor_name,
            raw_text=request.raw_text,
            corrected_data=request.corrected_data,
            document_type=request.document_type
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def list_templates():
    """
    List all learned vendor templates
    """
    try:
        learner = get_template_learner()
        templates = learner.list_templates()
        
        return {
            "success": True,
            "templates": templates,
            "count": len(templates)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{vendor_id}")
async def get_template(vendor_id: str, document_type: str = "INVOICE"):
    """
    Get template for a specific vendor
    """
    try:
        learner = get_template_learner()
        template = learner.get_template(vendor_id, document_type)
        
        if template:
            return {"success": True, "template": template}
        else:
            raise HTTPException(status_code=404, detail="Template not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-forms")
async def detect_form_elements_endpoint(
    file: UploadFile = File(...),
    detect_checkboxes: bool = Form(True),
    detect_tables: bool = Form(True),
    detect_fields: bool = Form(True),
    detect_barcodes: bool = Form(True)
):
    """
    Detect form elements in a document (OmniParser)
    
    Detects:
    - Checkboxes (with checked/unchecked status)
    - Tables
    - Text input fields
    - Barcodes and QR codes
    """
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        detector = get_form_detector()
        
        result = detector.detect(
            file_path=temp_path,
            detect_checkboxes=detect_checkboxes,
            detect_tables=detect_tables,
            detect_fields=detect_fields,
            detect_barcodes=detect_barcodes
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/generate-test")
async def generate_test_documents(request: GenerateRequest):
    """
    Generate synthetic test documents
    
    Useful for:
    - Testing OCR accuracy
    - Training template learning
    - Creating demo data
    """
    try:
        generator = get_synthetic_generator()
        
        if request.count == 1:
            if request.use_groq:
                result = generator.generate_with_groq(request.document_type)
            elif request.document_type == "LR":
                result = generator.generate_lr()
            else:
                result = generator.generate_invoice(difficulty=request.difficulty)
            
            return {"success": True, "documents": [result]}
        else:
            documents = generator.generate_batch(
                count=request.count,
                document_type=request.document_type
            )
            
            return {"success": True, "documents": documents}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def vdu_status():
    """
    Get VDU system status and capabilities
    """
    groq_api = bool(os.getenv("GROQ_API_KEY"))
    gemini_api = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    hf_api = bool(os.getenv("HF_API_KEY") or os.getenv("HUGGINGFACE_API_KEY"))
    
    return {
        "status": "operational",
        "version": "1.0.0",
        "papers_implemented": [
            "GOT-OCR 2.0", "Florence-2", "ColPali", "OmniParser",
            "StrucTexT v3", "TrOCR", "InternVL 2.0"
        ],
        "capabilities": {
            "text_extraction": True,
            "visual_search": True,
            "form_detection": True,
            "template_learning": True,
            "synthetic_data": True,
            "confidence_calibration": True
        },
        "api_status": {
            "groq": "available" if groq_api else "not_configured",
            "gemini": "available" if gemini_api else "not_configured",
            "huggingface": "available" if hf_api else "not_configured"
        }
    }
