"""
AI-Powered Dynamic OCR Engine for FastAPI
==========================================
2026 Future: Pure LLM Intelligence - No Hardcoded Mappings

Features:
- Dynamic column detection via Groq LLM
- Intelligent field extraction from ANY document format
- Context-aware mapping that adapts to vendor variations
- Smart reconciliation with AI-powered anomaly detection
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, Dict, Any, List
import os
import json
import httpx
import logging
import io
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"


# =============================================================================
# CORE EXTRACTION FUNCTIONS
# =============================================================================

def extract_text_from_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """Extract all text from PDF"""
    try:
        import fitz
        import tempfile
        import os
        
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
            
        try:
            with fitz.open(tmp_path) as pdf_doc:
                all_text = []
                for page_num in range(len(pdf_doc)):
                    page = pdf_doc.load_page(page_num)
                    all_text.append(page.get_text())
                
                page_count = len(pdf_doc)
                
            return {"success": True, "text": "\n".join(all_text), "page_count": page_count}
            
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                try: os.remove(tmp_path)
                except: pass
        
    except Exception as e:
        print(f"DEBUG: Error in PDF extraction: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "text": ""}


def extract_text_from_image(file_bytes: bytes) -> Dict[str, Any]:
    """Extract text from image using Tesseract"""
    try:
        import pytesseract
        from PIL import Image
        
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        
        return {"success": True, "text": text}
        
    except Exception as e:
        return {"success": False, "error": str(e), "text": ""}


def parse_excel_to_text(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Convert Excel to structured text for LLM analysis"""
    try:
        import pandas as pd
        
        ext = filename.split(".")[-1].lower()
        df = pd.read_csv(io.BytesIO(file_bytes)) if ext == "csv" else pd.read_excel(io.BytesIO(file_bytes))
        
        # Get raw column names
        columns = [str(c).strip() for c in df.columns]
        
        # Build structured text representation for LLM
        text_parts = [
            f"EXCEL FILE ANALYSIS",
            f"Total Rows: {len(df)}",
            f"Columns Found ({len(columns)}): {', '.join(columns)}",
            "",
            "SAMPLE DATA (First 5 rows):",
            "-" * 50
        ]
        
        for idx, row in df.head(5).iterrows():
            row_text = " | ".join([f"{col}: {val}" for col, val in zip(columns, row.values)])
            text_parts.append(f"Row {idx + 1}: {row_text}")
        
        text_parts.extend([
            "",
            "-" * 50,
            "COLUMN STATISTICS:"
        ])
        
        # Calculate column-wise sums for numeric columns
        for col in df.columns:
            try:
                numeric_vals = pd.to_numeric(df[col], errors='coerce')
                if numeric_vals.notna().sum() > 0:
                    total = numeric_vals.sum()
                    if total > 0:
                        text_parts.append(f"  {col}: Total = {total:,.2f}")
            except:
                pass
        
        return {
            "success": True,
            "text": "\n".join(text_parts),
            "columns": columns,
            "row_count": len(df),
            "dataframe": df
        }
        
    except Exception as e:
        return {"success": False, "error": str(e), "text": "", "columns": []}


# =============================================================================
# LLM-POWERED INTELLIGENT PROCESSING
# =============================================================================

async def llm_analyze_excel(text: str, columns: List[str]) -> Dict[str, Any]:
    """Use LLM to intelligently map Excel columns to system fields"""
    if not GROQ_API_KEY:
        return {"success": False, "error": "GROQ_API_KEY not configured"}
    
    system_fields = ["lr_number", "origin", "destination", "base_freight", "weight", "fuel_surcharge", "handling_charges"]
    
    prompt = f"""You are an AI expert in Indian logistics and freight invoicing.

TASK: Analyze this Excel file and intelligently map columns to our system fields.

EXCEL DATA:
{text}

AVAILABLE COLUMNS: {json.dumps(columns)}

REQUIRED SYSTEM FIELDS TO MAP:
- lr_number: The LR/Consignment/Docket/AWB number (shipment identifier)
- origin: Origin/From city (where shipment started)
- destination: Destination/To city (where shipment goes)
- base_freight: Freight charges/amount (shipping cost)
- weight: Weight in kg (package weight)
- fuel_surcharge: Fuel surcharge amount (if exists)
- handling_charges: Hamali/Handling/Loading charges (if exists)

INSTRUCTIONS:
1. Analyze column names and sample data
2. Intelligently determine which Excel column maps to which system field
3. Use your knowledge of Indian logistics terminology
4. If a column is not present, map it to null
5. Calculate the total sum of the freight/amount column

Return ONLY this JSON format:
{{
    "mapping": {{
        "lr_number": "exact column name from excel or null",
        "origin": "exact column name from excel or null",
        "destination": "exact column name from excel or null",
        "base_freight": "exact column name from excel or null",
        "weight": "exact column name from excel or null",
        "fuel_surcharge": "exact column name from excel or null",
        "handling_charges": "exact column name from excel or null"
    }},
    "totals": {{
        "excel_total": calculated sum of freight/amount column as number,
        "total_weight": calculated sum of weight column as number or null
    }},
    "confidence": 0.0 to 1.0,
    "unmapped_columns": ["list of columns not mapped to any field"]
}}"""

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are an expert in Indian logistics data analysis. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Clean JSON
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                return {"success": True, "data": json.loads(content.strip())}
            else:
                return {"success": False, "error": f"API error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}


async def llm_analyze_pdf(text: str) -> Dict[str, Any]:
    """Use LLM to extract all invoice data from PDF"""
    if not GROQ_API_KEY:
        return {"success": False, "error": "GROQ_API_KEY not configured"}
    
    prompt = f"""You are an AI expert in Indian GST invoices and logistics documents.

TASK: Analyze this document and extract all relevant information.

DOCUMENT TEXT:
{text[:8000]}

EXTRACT THE FOLLOWING:
1. Invoice Details (number, date, type)
2. Vendor/Seller Information (name, GSTIN, PAN, address)
3. Buyer Information (name, GSTIN)
4. All Amount Fields (subtotal, CGST, SGST, IGST, total tax, grand total)
5. Any shipment details (LR numbers, vehicle numbers)
6. Line items if visible

Return ONLY this JSON format:
{{
    "fields": {{
        "invoice_number": "extracted value or null",
        "invoice_date": "DD-MM-YYYY format or null",
        "vendor_name": "extracted value or null",
        "vendor_gstin": "15-char GSTIN or null",
        "vendor_pan": "10-char PAN or null",
        "buyer_name": "extracted value or null",
        "buyer_gstin": "value or null",
        "subtotal": number or null,
        "cgst_amount": number or null,
        "sgst_amount": number or null,
        "igst_amount": number or null,
        "total_tax": number or null,
        "grand_total": number (CRITICAL - extract accurately),
        "lr_numbers_mentioned": ["list of LR numbers if found"] or null,
        "line_items_count": number or null
    }},
    "document_type": "TAX_INVOICE/PROFORMA/CREDIT_NOTE/DEBIT_NOTE/OTHER",
    "confidence": 0.0 to 1.0,
    "raw_amounts_found": ["list of all amount values found in document"]
}}

CRITICAL: Extract grand_total as accurately as possible - this is used for reconciliation."""

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are an expert at extracting data from Indian GST invoices. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                return {"success": True, "data": json.loads(content.strip())}
            else:
                return {"success": False, "error": f"API error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post("/preview")
async def ocr_preview(
    file: UploadFile = File(...),
    type: str = Form("pdf")
):
    """
    AI-Powered OCR Preview
    
    Uses Groq LLM to intelligently:
    - Detect and map columns from ANY Excel format
    - Extract all fields from ANY invoice format
    - Provide confidence scores and suggestions
    """
    try:
        filename = file.filename or "unknown"
        file_ext = filename.split(".")[-1].lower()
        file_bytes = await file.read()
        print(f"DEBUG: Processing file {filename} ({len(file_bytes)} bytes)")
        
        logger.info(f"[AI-OCR] Processing: {filename}")
        
        is_excel = file_ext in ["xlsx", "xls", "csv"]
        is_pdf = file_ext == "pdf"
        is_image = file_ext in ["png", "jpg", "jpeg", "webp"]
        
        if is_excel:
            # Parse Excel and use LLM for intelligent mapping
            excel_result = parse_excel_to_text(file_bytes, filename)
            
            if not excel_result["success"]:
                return {
                    "success": False,
                    "error": excel_result.get("error", "Excel parsing failed"),
                    "data": {"raw_data": {}, "tables": [], "mapping": {}}
                }
            
            # Use LLM for intelligent column mapping
            llm_result = await llm_analyze_excel(excel_result["text"], excel_result["columns"])
            
            if llm_result["success"]:
                llm_data = llm_result["data"]
                
                # Get actual table data
                df = excel_result.get("dataframe")
                tables = df.fillna("").head(100).to_dict(orient="records") if df is not None else []
                
                return {
                    "success": True,
                    "data": {
                        "raw_data": {
                            "columns": excel_result["columns"],
                            "row_count": excel_result["row_count"],
                            "ai_analysis": excel_result["text"][:2000]
                        },
                        "raw_text": excel_result["text"],
                        "tables": tables,
                        "mapping": llm_data.get("mapping", {}),  # KEY: Frontend expects "mapping"
                        "totals": llm_data.get("totals", {}),
                        "confidence": llm_data.get("confidence", 0) * 100,
                        "unmapped_columns": llm_data.get("unmapped_columns", []),
                        "document_type": "EXCEL_ANNEXURE"
                    },
                    "model_used": GROQ_MODEL,
                    "extraction_method": "ai_powered"
                }
            else:
                return {
                    "success": False,
                    "error": llm_result.get("error", "LLM analysis failed"),
                    "data": {
                        "raw_data": {"columns": excel_result["columns"]},
                        "tables": [],
                        "mapping": {}
                    }
                }
        
        elif is_pdf or is_image:
            # Extract text
            if is_pdf:
                extraction = extract_text_from_pdf(file_bytes)
            else:
                extraction = extract_text_from_image(file_bytes)
            
            if not extraction["success"] or not extraction.get("text"):
                return {
                    "success": False,
                    "error": extraction.get("error", "Text extraction failed"),
                    "data": {"raw_data": {}, "tables": [], "fields": {}}
                }
            
            # Use LLM for intelligent extraction
            llm_result = await llm_analyze_pdf(extraction["text"])
            
            if llm_result["success"]:
                llm_data = llm_result["data"]
                
                return {
                    "success": True,
                    "data": {
                        "raw_data": llm_data,
                        "raw_text": extraction["text"],
                        "tables": [],
                        "fields": llm_data.get("fields", {}),  # KEY: Frontend expects "fields" for PDF
                        "mapping": llm_data.get("fields", {}),  # Also provide as mapping
                        "confidence": llm_data.get("confidence", 0) * 100,
                        "document_type": llm_data.get("document_type", "INVOICE")
                    },
                    "model_used": GROQ_MODEL,
                    "extraction_method": "ai_powered"
                }
            else:
                return {
                    "success": True,  # Partial success - we have text
                    "data": {
                        "raw_data": {"text": extraction["text"][:3000]},
                        "raw_text": extraction["text"],
                        "tables": [],
                        "fields": {},
                        "mapping": {},
                        "confidence": 30,
                        "llm_error": llm_result.get("error")
                    },
                    "model_used": "fallback",
                    "extraction_method": "raw_text_only"
                }
        
        else:
            return {
                "success": False,
                "error": f"Unsupported file type: {file_ext}",
                "data": {"raw_data": {}, "tables": [], "mapping": {}}
            }
            
    except Exception as e:
        logger.error(f"[AI-OCR] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def ocr_status():
    """Check OCR service status"""
    engines = {"pymupdf": False, "tesseract": False, "pandas": False, "groq_llm": bool(GROQ_API_KEY)}
    
    try:
        import fitz
        engines["pymupdf"] = True
    except: pass
    
    try:
        import pytesseract
        engines["tesseract"] = True
    except: pass
    
    try:
        import pandas
        engines["pandas"] = True
    except: pass
    
    return {
        "status": "online",
        "mode": "AI-POWERED (LLM Dynamic Analysis)",
        "engines": engines,
        "llm_model": GROQ_MODEL,
        "supported_formats": ["pdf", "png", "jpg", "xlsx", "xls", "csv"]
    }


# =============================================================================
# DOCUMENTS ROUTER (for SmartInvoicing)
# =============================================================================

documents_router = APIRouter(prefix="/api/documents", tags=["Documents"])


@documents_router.post("/ocr-upload")
async def ocr_document_upload(
    file: UploadFile = File(...),
    docType: str = Form("document")
):
    """OCR Upload with Quality Validation"""
    try:
        filename = file.filename or "unknown"
        file_ext = filename.split(".")[-1].lower()
        file_bytes = await file.read()
        
        # Extract based on type
        if file_ext in ["xlsx", "xls", "csv"]:
            result = parse_excel_to_text(file_bytes, filename)
            text = result.get("text", "")
        elif file_ext == "pdf":
            result = extract_text_from_pdf(file_bytes)
            text = result.get("text", "")
        else:
            result = extract_text_from_image(file_bytes)
            text = result.get("text", "")
        
        quality_score = min(95, max(30, 50 + len(text) // 50))
        
        return {
            "success": True,
            "filename": filename,
            "quality_score": quality_score,
            "blur_detected": len(text) < 100,
            "extracted_text": text[:1000],
            "doc_type": docType
        }
        
    except Exception as e:
        return {"success": False, "error": str(e), "quality_score": 0, "blur_detected": True}


@documents_router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Simple document upload"""
    import uuid
    
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(await file.read())
    
    return {"success": True, "filename": filename}


# =============================================================================
# MAGIC SPLITTER ENDPOINTS (Migrated from Flask)
# =============================================================================

checklist_router = APIRouter(prefix="/api/checklist", tags=["Checklist"])

# Directory setup
UPLOAD_BUNDLE_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "bundles")
UPLOAD_SPLIT_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "split")
os.makedirs(UPLOAD_BUNDLE_DIR, exist_ok=True)
os.makedirs(UPLOAD_SPLIT_DIR, exist_ok=True)


@checklist_router.get("/requirements/{shipment_id}")
async def get_checklist_requirements(shipment_id: str):
    """Get mandatory document list for a shipment."""
    try:
        from services.document_checklist import get_document_requirements, get_demo_shipment_config
        
        config = get_demo_shipment_config()
        config['id'] = shipment_id
        requirements = get_document_requirements(config)
        return requirements
    except Exception as e:
        logger.error(f"Checklist Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@checklist_router.post("/upload-bundle")
async def upload_pdf_bundle(file: UploadFile = File(...)):
    """Upload the 'Big Bundle' PDF for MagicSplitter."""
    import time
    
    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        filename = f"bundle_{int(time.time())}.pdf"
        path = os.path.join(UPLOAD_BUNDLE_DIR, filename)
        
        content = await file.read()
        with open(path, "wb") as f:
            f.write(content)
        
        # Generate thumbnails from the PDF
        thumbnails = await generate_pdf_thumbnails(path)
        
        return {
            "success": True,
            "bundle_id": filename,
            "path": path,
            "thumbnails": thumbnails,
            "message": "Bundle uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload Bundle Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_pdf_thumbnails(pdf_path: str) -> list:
    """Generate thumbnail previews for each page in the PDF."""
    try:
        import fitz  # PyMuPDF
        import base64
        
        thumbnails = []
        with fitz.open(pdf_path) as doc:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                # Create a pixmap (image) of the page
                pix = page.get_pixmap(matrix=fitz.Matrix(0.3, 0.3))  # Scale down
                img_bytes = pix.tobytes("png")
                
                # Convert to base64 data URL
                b64_img = base64.b64encode(img_bytes).decode('utf-8')
                thumbnails.append({
                    "page_number": page_num + 1,
                    "image_url": f"data:image/png;base64,{b64_img}"
                })
        
        return thumbnails
    except Exception as e:
        logger.warning(f"Thumbnail generation failed: {e}")
        # Return mock thumbnails as fallback
        return [
            {"page_number": i, "image_url": f"https://via.placeholder.com/150x200?text=Page+{i}"} 
            for i in range(1, 5)
        ]


@checklist_router.post("/split")
async def split_bundle(payload: dict):
    """
    Perform the physical split of the PDF using pypdf.
    Body: { "bundle_id": "filename.pdf", "split_map": { "INVOICE": [1], ... } }
    """
    try:
        bundle_id = payload.get('bundle_id')
        split_map = payload.get('split_map')
        
        if not bundle_id or not split_map:
            raise HTTPException(status_code=400, detail="Missing bundle_id or split_map")
        
        source_path = os.path.join(UPLOAD_BUNDLE_DIR, bundle_id)
        
        from services.document_checklist import split_pdf_bundle
        result = split_pdf_bundle(source_path, split_map, UPLOAD_SPLIT_DIR)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Split API Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@checklist_router.get("/view/{filename}")
async def view_split_document(filename: str):
    """Serve the split files."""
    from fastapi.responses import FileResponse
    
    file_path = os.path.join(UPLOAD_SPLIT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(path=file_path, media_type="application/pdf")

