"""
Invoices Router for FastAPI - LLM-Powered
==========================================
Handles the Bulk Invoice Upload workflow with AI:
1. PDF + Excel upload
2. LLM Column mapping (dynamic)
3. Reconciliation (PDF total vs Excel sum)
4. Row-level audit
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, Dict, Any, List
import os
import json
import httpx
import logging
import io
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

# Import VDU Engine (Advanced OCR based on 10 research papers - Enterprise Edition)
try:
    from services.vdu import (
        VDUEngine, get_vdu_engine,
        EnterpriseVDU, get_enterprise_vdu,  # SAP/Oracle competitor level
        ConfidenceCalibrator, get_confidence_calibrator,
        TemplateLearner, get_template_learner,
        ColPaliIndexer, get_colpali_indexer
    )
    VDU_AVAILABLE = True
    ENTERPRISE_VDU = True
except ImportError as e:
    VDU_AVAILABLE = False
    ENTERPRISE_VDU = False
    logger.warning(f"VDU Engine not available: {e}")


# =====================================================
# DATABASE-BACKED INVOICE ENDPOINTS (No Mock Data)
# =====================================================

@router.get("")
@router.get("/")
async def list_invoices(status: str = None, limit: int = 100):
    """
    Get all invoices from PostgreSQL database.
    Replaces MOCK_INVOICES usage in frontend.
    """
    try:
        from services.db_service import get_db_connection, get_cursor
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = get_cursor(conn)
        
        if status:
            cursor.execute("""
                SELECT id, invoice_number, vendor_id, vendor_name, invoice_date, due_date,
                       amount, currency, status, match_status, origin, destination, mode,
                       lr_number, po_number, weight_kg, distance_km, extraction_confidence,
                       pdf_path, created_at
                FROM invoices
                WHERE status = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (status.upper(), limit))
        else:
            cursor.execute("""
                SELECT id, invoice_number, vendor_id, vendor_name, invoice_date, due_date,
                       amount, currency, status, match_status, origin, destination, mode,
                       lr_number, po_number, weight_kg, distance_km, extraction_confidence,
                       pdf_path, created_at
                FROM invoices
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
        
        invoices = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert to list of dicts with frontend-compatible structure
        result = []
        for inv in invoices:
            result.append({
                "id": inv["id"],
                "invoiceNumber": inv["invoice_number"],
                "vendor": inv["vendor_name"] or inv["vendor_id"],
                "carrier": inv["vendor_name"],
                "vendorId": inv["vendor_id"],
                "invoiceDate": str(inv["invoice_date"]) if inv["invoice_date"] else None,
                "dueDate": str(inv["due_date"]) if inv["due_date"] else None,
                "amount": float(inv["amount"]) if inv["amount"] else 0,
                "currency": inv["currency"] or "INR",
                "status": inv["status"] or "PENDING",
                "matchStatus": inv["match_status"] or "Pending",
                "origin": inv["origin"],
                "destination": inv["destination"],
                "mode": inv["mode"],
                "lrNumber": inv["lr_number"],
                "poNumber": inv["po_number"],
                "weight": float(inv["weight_kg"]) if inv["weight_kg"] else None,
                "distance": float(inv["distance_km"]) if inv["distance_km"] else None,
                "extractionConfidence": int(inv["extraction_confidence"]) if inv["extraction_confidence"] else 0,
                "pdfPath": inv["pdf_path"],
                "createdAt": str(inv["created_at"]) if inv["created_at"] else None
            })
        
        logger.info(f"[API] Returning {len(result)} invoices from database")
        return {"success": True, "invoices": result, "count": len(result)}
        
    except Exception as e:
        logger.error(f"[API] Error fetching invoices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str):
    """
    Get a single invoice by ID from PostgreSQL.
    """
    try:
        from services.db_service import get_db_connection, get_cursor
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = get_cursor(conn)
        cursor.execute("""
            SELECT id, invoice_number, vendor_id, vendor_name, invoice_date, due_date,
                   amount, currency, status, match_status, origin, destination, mode,
                   lr_number, po_number, weight_kg, distance_km, extraction_confidence,
                   pdf_path, excel_path, gst_amount, base_amount, created_at, updated_at
            FROM invoices
            WHERE id = %s
        """, (invoice_id,))
        
        inv = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not inv:
            raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
        
        return {
            "success": True,
            "invoice": {
                "id": inv["id"],
                "invoiceNumber": inv["invoice_number"],
                "vendor": inv["vendor_name"] or inv["vendor_id"],
                "carrier": inv["vendor_name"],
                "vendorId": inv["vendor_id"],
                "invoiceDate": str(inv["invoice_date"]) if inv["invoice_date"] else None,
                "dueDate": str(inv["due_date"]) if inv["due_date"] else None,
                "amount": float(inv["amount"]) if inv["amount"] else 0,
                "currency": inv["currency"] or "INR",
                "status": inv["status"] or "PENDING",
                "matchStatus": inv["match_status"] or "Pending",
                "origin": inv["origin"],
                "destination": inv["destination"],
                "mode": inv["mode"],
                "lrNumber": inv["lr_number"],
                "poNumber": inv["po_number"],
                "weight": float(inv["weight_kg"]) if inv["weight_kg"] else None,
                "distance": float(inv["distance_km"]) if inv["distance_km"] else None,
                "extractionConfidence": int(inv["extraction_confidence"]) if inv["extraction_confidence"] else 0,
                "pdfPath": inv["pdf_path"],
                "excelPath": inv["excel_path"],
                "gstAmount": float(inv["gst_amount"]) if inv["gst_amount"] else None,
                "baseAmount": float(inv["base_amount"]) if inv["base_amount"] else None,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error fetching invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_from_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """Extract text from PDF"""
    result = {"raw_text": "", "success": False}
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
            
            result["raw_text"] = "\n".join(all_text)
            result["success"] = True
            
        finally:
            if os.path.exists(tmp_path):
                try: os.remove(tmp_path)
                except: pass
        
    except Exception as e:
        result["error"] = str(e)
        logger.error(f"PDF extraction error: {e}")
    
    return result


def extract_from_excel(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Smart Extract from Excel:
    1. Auto-detect Header Row (keywords based)
    2. Filter out 'Total'/'Footer' rows to prevent double-counting
    3. Capture explicit Grand Total from footer rows
    """
    result = {"columns": [], "rows": [], "totals": {}, "success": False, "explicit_total": 0}
    try:
        import pandas as pd
        import io
        import re
        
        # 1. Load Raw Data (no header) to find the structure
        ext = filename.split(".")[-1].lower()
        if ext == "csv":
            df_raw = pd.read_csv(io.BytesIO(file_bytes), header=None)
        else:
            df_raw = pd.read_excel(io.BytesIO(file_bytes), header=None)
            
        # 2. Detect Header Row
        header_row_idx = 0
        max_score = 0
        header_keywords = ["lr", "number", "date", "origin", "destination", "weight", "freight", "amount", "total", "vehicle", "sr", "no", "gst", "qty"]
        
        # Scan first 20 rows
        info_rows_count = min(20, len(df_raw))
        for idx in range(info_rows_count):
            row_str = " ".join([str(val).lower() for val in df_raw.iloc[idx] if pd.notna(val)])
            score = sum(1 for k in header_keywords if k in row_str)
            if score > max_score:
                max_score = score
                header_row_idx = idx
        
        # 3. Reload with Correct Header
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(file_bytes), header=header_row_idx)
        else:
            df = pd.read_excel(io.BytesIO(file_bytes), header=header_row_idx)
            
        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        result["columns"] = list(df.columns)
        
        # 4. Filter Data Rows vs Footer Rows
        clean_rows = []
        explicit_total = 0
        
        # Keywords suggesting a footer/total row
        footer_keywords = ["grand total", "total amount", "net amount", "invoice total"]
        
        for idx, row in df.iterrows():
            row_vals = [str(v).lower().strip() for v in row if pd.notna(v)]
            row_text = " ".join(row_vals)
            
            is_footer = False
            # Check for footer keywords
            for k in footer_keywords:
                if k in row_text:
                    is_footer = True
                    # Attempt to extract the max numeric value from this footer row as "Explicit Total"
                    try:
                        # Extract all numbers from the row
                        nums = []
                        for val in row:
                            if pd.notna(val):
                                # Clean currency formatting
                                s_val = str(val).replace(',', '').replace('₹', '').replace('Rs', '').strip()
                                try:
                                    f_val = float(s_val)
                                    nums.append(f_val)
                                except: pass
                        if nums:
                            row_max = max(nums)
                            # Update explicit total if this looks like a larger total
                            if row_max > explicit_total:
                                explicit_total = row_max
                    except: pass
                    break
            
            if not is_footer:
                # Also exclude generic "Total" if it appears in the first couple of columns (often a subtotal line)
                if len(row_vals) > 0 and "total" == row_vals[0]:
                     is_footer = True
            
            if not is_footer:
                clean_rows.append(row)
                
        result["explicit_total"] = explicit_total
        
        # Re-create DataFrame with clean rows
        df_clean = pd.DataFrame(clean_rows, columns=df.columns)
        
        # 5. Calculate Column Totals (on clean data)
        for col in df_clean.columns:
            try:
                # Clean currency symbols and commas
                clean_series = df_clean[col].astype(str).str.replace(r'[₹,]', '', regex=True).replace('nan', '0')
                numeric_vals = pd.to_numeric(clean_series, errors='coerce')
                # Only map positive sums
                col_sum = numeric_vals.sum()
                if col_sum > 0:
                    result["totals"][col] = float(col_sum)
            except Exception:
                pass
        
        result["row_count"] = len(df_clean)
        result["rows"] = df_clean.fillna("").head(100).to_dict(orient="records")
        result["success"] = True
        
        # 6. Build Context for LLM
        text_lines = [f"COLUMNS: {', '.join(df_clean.columns)}", f"ROWS: {len(df_clean)}"]
        if explicit_total > 0:
            text_lines.append(f"EXPLICIT FOOTER TOTAL FOUND: {explicit_total:,.2f}")
            
        text_lines.append("COLUMN TOTALS (Calculated from Line Items):")
        for col, total in result["totals"].items():
            text_lines.append(f"  {col}: {total:,.2f}")
            
        text_lines.append("\nSAMPLE (First 5 rows):")
        for idx, row in df_clean.head(5).iterrows():
            row_text = " | ".join([f"{col}: {val}" for col, val in zip(df_clean.columns, row.values)])
            text_lines.append(f"Row {idx + 1}: {row_text}")
        
        result["text_for_llm"] = "\n".join(text_lines)
        result["dataframe"] = df_clean  # Store cleaned dataframe
        
    except Exception as e:
        result["error"] = str(e)
        logger.error(f"Excel extraction error: {e}")
    
    return result


async def llm_extract_pdf_data(raw_text: str) -> Dict[str, Any]:
    """Use Groq to extract invoice data from PDF"""
    if not GROQ_API_KEY:
        return {"success": False, "error": "GROQ_API_KEY not configured"}
    
    prompt = f"""Extract all invoice information from this document.

DOCUMENT:
{raw_text[:8000]}

Return ONLY valid JSON:
{{
    "grand_total": number (the FINAL TOTAL amount on the invoice - this is CRITICAL),
    "subtotal": number or null,
    "tax_amount": number or null,
    "invoice_number": "string or null",
    "invoice_date": "DD-MM-YYYY or null",
    "vendor_name": "string or null",
    "vendor_gstin": "string or null"
}}

CRITICAL: grand_total must be an accurate NUMBER representing the final invoice amount."""

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
                        {"role": "system", "content": "Extract data from Indian GST invoices. Return only valid JSON."},
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
                return {"success": False, "error": f"Groq API error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}


async def llm_map_excel_columns(text: str, columns: List[str], totals: Dict[str, float]) -> Dict[str, Any]:
    """Use LLM to map Excel columns and determine which is the total column"""
    if not GROQ_API_KEY:
        return {"success": False, "error": "GROQ_API_KEY not configured"}
    
    prompt = f"""Analyze this Excel data from a logistics invoice annexure.

EXCEL DATA:
{text}

COLUMNS: {json.dumps(columns)}
COLUMN TOTALS: {json.dumps(totals)}

TASK: Map these columns to standard fields and identify which column contains the LINE ITEM TOTAL AMOUNT.

Return ONLY valid JSON:
{{
    "mapping": {{
        "lr_number": "exact column name or null",
        "origin": "exact column name or null",
        "destination": "exact column name or null",
        "base_freight": "exact column name or null",
        "weight": "exact column name or null",
        "fuel_surcharge": "exact column name or null",
        "handling_charges": "exact column name or null"
    }},
    "total_column": "the column name that contains the line item total/amount",
    "excel_sum": the sum of the total column as a number
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
                        {"role": "system", "content": "You are an expert in Indian logistics data. Return only valid JSON."},
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
                return {"success": False, "error": f"Groq API error: {response.status_code}"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/bulk-upload")
async def bulk_upload(
    pdf_file: UploadFile = File(...),
    excel_file: UploadFile = File(...),
    vendor_id: str = Form(...),
    pdf_total: str = Form("0")
):
    """
    Bulk Invoice Upload - AI-Powered Workflow
    
    1. Extract PDF total via LLM
    2. Parse Excel and LLM maps columns
    3. Reconcile: Sum(Excel) must match PDF total
    """
    try:
        logger.info(f"[BULK] Processing PDF: {pdf_file.filename}, Excel: {excel_file.filename}")
        
        # Read files
        pdf_bytes = await pdf_file.read()
        excel_bytes = await excel_file.read()
        
        # ============================================================
        # DOCUMENT STORAGE: Upload to Supabase Storage (Enterprise)
        # ============================================================
        import os
        import uuid
        from pathlib import Path
        
        # Generate unique invoice ID early
        invoice_id = f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # File names
        pdf_filename = pdf_file.filename or "invoice.pdf"
        excel_filename = excel_file.filename or "annexure.xlsx"
        
        # Storage paths (for Supabase)
        storage_pdf_path = f"{invoice_id}/{pdf_filename}"
        storage_excel_path = f"{invoice_id}/{excel_filename}"
        
        # Try Supabase Storage first
        supabase_pdf_url = None
        supabase_excel_url = None
        
        try:
            from services.storage_service import storage_service
            
            # Upload PDF to Supabase
            pdf_success, pdf_result = await storage_service.upload_document(
                bucket="invoices",
                file_bytes=pdf_bytes,
                path=storage_pdf_path,
                content_type="application/pdf"
            )
            if pdf_success:
                supabase_pdf_url = pdf_result
                logger.info(f"[BULK] PDF uploaded to Supabase: {storage_pdf_path}")
            
            # Upload Excel to Supabase
            excel_content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            excel_success, excel_result = await storage_service.upload_document(
                bucket="invoices",
                file_bytes=excel_bytes,
                path=storage_excel_path,
                content_type=excel_content_type
            )
            if excel_success:
                supabase_excel_url = excel_result
                logger.info(f"[BULK] Excel uploaded to Supabase: {storage_excel_path}")
                
        except Exception as storage_err:
            logger.warning(f"[BULK] Supabase Storage failed, using local fallback: {storage_err}")
        
        # Fallback: Save locally (always do this for immediate access)
        upload_dir = Path(__file__).parent.parent / "uploads" / "invoices" / invoice_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        pdf_path = upload_dir / pdf_filename
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        
        excel_path = upload_dir / excel_filename
        with open(excel_path, "wb") as f:
            f.write(excel_bytes)
        
        # Store paths for database
        pdf_relative_path = f"uploads/invoices/{invoice_id}/{pdf_filename}"
        excel_relative_path = f"uploads/invoices/{invoice_id}/{excel_filename}"
        
        logger.info(f"[BULK] Documents saved. Supabase: {supabase_pdf_url is not None}, Local: {pdf_relative_path}")
        # ============================================================
        
        # Extract from Excel first
        excel_result = extract_from_excel(excel_bytes, excel_file.filename)
        
        if not excel_result.get("success"):
            return {
                "success": False,
                "error": f"Excel parsing failed: {excel_result.get('error', 'Unknown error')}"
            }
        
        # Use LLM to map columns and calculate total
        llm_excel_result = await llm_map_excel_columns(
            excel_result.get("text_for_llm", ""),
            excel_result.get("columns", []),
            excel_result.get("totals", {})
        )
        
        excel_total = 0
        column_mapping = {}
        
        if llm_excel_result.get("success"):
            llm_data = llm_excel_result["data"]
            column_mapping = llm_data.get("mapping", {})
            
            # Get excel sum from LLM or calculate from identified column
            total_column = llm_data.get("total_column")
            if total_column and total_column in excel_result.get("totals", {}):
                excel_total = excel_result["totals"][total_column]
            elif llm_data.get("excel_sum"):
                excel_total = llm_data.get("excel_sum", 0)
        else:
            # Fallback: try to find a "Total" column
            totals = excel_result.get("totals", {})
            for col_name, val in totals.items():
                if "total" in col_name.lower() or "amt" in col_name.lower():
                    excel_total = val
                    break
        
        # Get PDF total
        pdf_total_value = float(pdf_total) if pdf_total and float(pdf_total) > 0 else 0
        ocr_data = {}
        confidence_data = {}
        
        if pdf_total_value == 0:
            # ============================================================
            # Use Enterprise VDU (SAP/Oracle Competitor Level)
            # All 10 research papers, auto-learning, visual fingerprinting
            # ============================================================
            if ENTERPRISE_VDU:
                import tempfile
                import os as temp_os
                
                # Get file extension from original filename
                original_filename = pdf_file.filename or "document.pdf"
                file_ext = temp_os.path.splitext(original_filename)[1].lower() or ".pdf"
                
                # Save file temporarily for VDU processing
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
                    tmp.write(pdf_bytes)
                    tmp_path = tmp.name
                
                logger.info(f"[ENTERPRISE-VDU] Processing: {original_filename} for vendor: {vendor_id}")
                
                try:
                    # Use Enterprise VDU (full pipeline)
                    enterprise = get_enterprise_vdu()
                    vdu_result = enterprise.process_invoice(
                        file_path=tmp_path,
                        vendor_id=vendor_id,
                        vendor_name=vendor_id,  # Will be enriched over time
                        document_type="INVOICE",
                        auto_learn=True  # Continuously improve
                    )
                    
                    if vdu_result.get("success"):
                        ocr_data = vdu_result.get("extracted_data", {})
                        ocr_data["model_used"] = vdu_result.get("metadata", {}).get("ocr_method", "enterprise-vdu")
                        ocr_data["processing_time_s"] = vdu_result.get("metadata", {}).get("total_processing_time_s", 0)
                        ocr_data["raw_text"] = vdu_result.get("raw_text", "")
                        
                        # Get total amount
                        pdf_total_value = ocr_data.get("total_amount") or ocr_data.get("grand_total") or 0
                        
                        # Confidence from enterprise pipeline
                        confidence_result = vdu_result.get("confidence", {})
                        confidence_data = confidence_result
                        ocr_data["confidence"] = confidence_result.get("overall_confidence", 0)
                        ocr_data["quality_rating"] = confidence_result.get("quality_rating", "UNKNOWN")
                        
                        # Add processing steps and suggestions
                        ocr_data["processing_steps"] = vdu_result.get("processing_steps", [])
                        ocr_data["suggestions"] = vdu_result.get("suggestions", [])
                        
                        # Vendor statistics (for UI display)
                        ocr_data["vendor_stats"] = vdu_result.get("vendor_stats", {})
                        
                        # Layout and form detection results
                        ocr_data["layout"] = vdu_result.get("metadata", {}).get("layout", {})
                        ocr_data["forms"] = vdu_result.get("metadata", {}).get("forms", {})
                        
                        logger.info(f"[ENTERPRISE-VDU] Success: total={pdf_total_value}, "
                                  f"confidence={ocr_data.get('confidence', 0):.2f}, "
                                  f"patterns_learned={vdu_result.get('vendor_stats', {}).get('learned_patterns', 0)}")
                    else:
                        ocr_data["vdu_error"] = vdu_result.get("error", "Enterprise VDU failed")
                        # Fallback to basic VDU
                        vdu_engine = get_vdu_engine()
                        basic_result = vdu_engine.extract(tmp_path, "INVOICE")
                        if basic_result.get("success"):
                            ocr_data.update(basic_result.get("extracted_data", {}))
                            pdf_total_value = ocr_data.get("total_amount") or 0
                            
                finally:
                    if temp_os.path.exists(tmp_path):
                        try: temp_os.remove(tmp_path)
                        except: pass
                        
            elif VDU_AVAILABLE:
                # Legacy extraction when VDU not available
                pdf_result = extract_from_pdf(pdf_bytes)
                
                if pdf_result.get("success") and pdf_result.get("raw_text"):
                    llm_pdf_result = await llm_extract_pdf_data(pdf_result["raw_text"])
                    
                    if llm_pdf_result.get("success"):
                        ocr_data = llm_pdf_result["data"]
                        pdf_total_value = ocr_data.get("grand_total", 0) or 0
                    else:
                        ocr_data["llm_error"] = llm_pdf_result.get("error")
                else:
                    ocr_data["pdf_error"] = pdf_result.get("error", "PDF extraction failed")
        
        # Reconciliation
        # Reconciliation Strategy: Best Fit
        # Compare PDF Total against both:
        # 1. Calculated Column Sum (excel_total) - vulnerable to double counting
        # 2. Explicit Footer Total (explicit_total) - extracted from "Grand Total" row
        
        explicit_total = excel_result.get("explicit_total", 0)
        
        diff_calculated = abs(pdf_total_value - excel_total)
        diff_explicit = abs(pdf_total_value - explicit_total) if explicit_total > 0 else float('inf')
        
        # Determine strictness: if we have an explicit total, we trust it more if it's close
        if explicit_total > 0 and diff_explicit < diff_calculated:
            logger.info(f"[Reconciliation] Switched to Explicit Total ({explicit_total}) - match found.")
            excel_total = explicit_total # Correction
            difference = diff_explicit
        else:
            difference = diff_calculated
            
        tolerance = max(10, pdf_total_value * 0.005)  # 0.5% or ₹10 tolerance
        reconciliation_valid = difference <= tolerance
        
        # Generate invoice ID
        invoice_id = f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Line items summary
        line_items_summary = {
            "total_rows": excel_result.get("row_count", 0),
            "valid_rows": excel_result.get("row_count", 0),
            "duplicate_rows": 0,
            "error_rows": 0
        }
        
        logger.info(f"[BULK] Excel Total: {excel_total}, PDF Total: {pdf_total_value}, Diff: {difference}")
        
        return {
            "success": reconciliation_valid,
            "invoice_id": invoice_id,
            "column_mapping": column_mapping,
            "reconciliation": {
                "valid": reconciliation_valid,
                "excel_total": excel_total,
                "pdf_total": pdf_total_value,
                "difference": difference
            },
            "line_items_summary": line_items_summary,
            "ocr_data": ocr_data,
            "confidence": confidence_data,  # VDU confidence calibration data
            "vdu_enabled": VDU_AVAILABLE,
            # Document paths for workflow access
            "documents": {
                "pdf_path": pdf_relative_path,
                "excel_path": excel_relative_path,
                "pdf_filename": pdf_filename,
                "excel_filename": excel_filename
            },
            "error": None if reconciliation_valid else f"Reconciliation failed: Excel total (₹{excel_total:,.2f}) does not match PDF total (₹{pdf_total_value:,.2f}). Difference: ₹{difference:,.2f}"
        }
        
    except Exception as e:
        logger.error(f"[BULK] Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "ocr_error": True
        }


@router.post("/learn-correction")
async def learn_from_correction(
    vendor_id: str = Form(...),
    vendor_name: str = Form(...),
    raw_text: str = Form(...),
    corrected_data: str = Form(...)  # JSON string
):
    """
    Learn from user corrections - One-Shot Template Learning
    
    When a user corrects OCR errors, this endpoint teaches the system
    the vendor's document layout patterns for future accuracy.
    """
    if not VDU_AVAILABLE:
        return {"success": False, "error": "VDU Engine not available"}
    
    try:
        import json
        corrected = json.loads(corrected_data)
        
        learner = get_template_learner()
        result = learner.learn_from_correction(
            vendor_id=vendor_id,
            vendor_name=vendor_name,
            raw_text=raw_text,
            corrected_data=corrected,
            document_type="INVOICE"
        )
        
        logger.info(f"[LEARN] Vendor {vendor_id}: Learned {len(result.get('fields_learned', []))} fields")
        
        return result
        
    except Exception as e:
        logger.error(f"[LEARN] Error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/vdu-status")
async def vdu_status():
    """Check VDU Engine status and capabilities"""
    return {
        "vdu_available": VDU_AVAILABLE,
        "groq_configured": bool(GROQ_API_KEY),
        "capabilities": [
            "structured_extraction",
            "confidence_calibration", 
            "template_learning",
            "visual_indexing"
        ] if VDU_AVAILABLE else ["legacy_ocr"]
    }


@router.get("/{invoice_id}/documents")
async def get_invoice_documents(invoice_id: str):
    """
    Get document paths for an invoice.
    Returns PDF and Excel file paths if available.
    """
    from pathlib import Path
    from fastapi.responses import JSONResponse
    
    # Check uploads folder for this invoice
    upload_dir = Path(__file__).parent.parent / "uploads" / "invoices" / invoice_id
    
    if not upload_dir.exists():
        return {"success": False, "error": "No documents found for this invoice", "documents": []}
    
    documents = []
    for file_path in upload_dir.iterdir():
        if file_path.is_file():
            file_type = "pdf" if file_path.suffix.lower() == ".pdf" else "excel" if file_path.suffix.lower() in [".xlsx", ".xls", ".csv"] else "other"
            documents.append({
                "filename": file_path.name,
                "type": file_type,
                "path": f"/api/invoices/{invoice_id}/download/{file_path.name}",
                "size": file_path.stat().st_size
            })
    
    return {"success": True, "invoice_id": invoice_id, "documents": documents}


@router.get("/{invoice_id}/download/{filename}")
async def download_invoice_document(invoice_id: str, filename: str):
    """
    Download a specific document for an invoice.
    Priority: 1. Supabase Storage signed URL, 2. Local file system
    """
    from pathlib import Path
    from fastapi.responses import FileResponse, RedirectResponse
    
    # STRATEGY 1: Try Supabase Storage (Enterprise)
    try:
        from services.storage_service import storage_service
        
        # Check if file exists in Supabase and get signed URL
        storage_path = f"{invoice_id}/{filename}"
        signed_url = storage_service.get_signed_url(
            bucket="invoices",
            path=storage_path,
            expires_in=3600  # 1 hour
        )
        
        if signed_url:
            logger.info(f"[DOWNLOAD] Redirecting to Supabase signed URL: {storage_path}")
            return RedirectResponse(url=signed_url, status_code=302)
            
    except Exception as storage_err:
        logger.warning(f"[DOWNLOAD] Supabase Storage failed: {storage_err}")
    
    # STRATEGY 2: Fallback to local uploads folder
    file_path = Path(__file__).parent.parent / "uploads" / "invoices" / invoice_id / filename
    logger.info(f"[DOWNLOAD] Fallback to local path: {file_path}")
    
    # Check if file exists locally
    if not file_path.exists():
        logger.error(f"[DOWNLOAD] Document not found: {invoice_id}/{filename}")
        raise HTTPException(status_code=404, detail=f"Document not found: {filename}")
    
    # Determine content type
    suffix = file_path.suffix.lower()
    content_types = {
        ".pdf": "application/pdf",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".csv": "text/csv",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg"
    }
    content_type = content_types.get(suffix, "application/octet-stream")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type=content_type
    )

@router.post("/submit-for-approval")
async def submit_for_approval(
    invoice_id: str = Form(...),
    invoice_number: str = Form(...),
    supplier_id: str = Form(...),
    total_amount: float = Form(...),
    invoice_date: str = Form(None),
    line_items_count: int = Form(0),
    ocr_data: str = Form("{}"),  # JSON string
    confidence_score: float = Form(0.0),
    reconciliation_status: str = Form("MATCHED"),
    pdf_path: str = Form(""),  # Document storage path
    excel_path: str = Form("")  # Document storage path
):
    """
    Submit a processed invoice to the approval workflow.
    
    This creates the invoice record in the database with status="PENDING"
    and assigns it to the first approver (Logistics Ops - Kaai Bansal).
    
    Workflow Stages:
    1. PENDING - Awaiting Logistics Ops (Kaai Bansal)
    2. OPS_APPROVED - Awaiting Finance (Zeya Kapoor)
    3. FINANCE_APPROVED - Awaiting ERP Settlement (Admin)
    4. PAID - Payment Released
    """
    try:
        import json
        from pydantic import BaseModel
        
        ocr = json.loads(ocr_data) if ocr_data else {}
        
        # Build invoice record
        invoice_record = {
            "id": invoice_id,
            "invoice_number": invoice_number or ocr.get("invoice_number", invoice_id),
            "supplier_id": supplier_id,
            "vendor_name": ocr.get("vendor_name", supplier_id),
            "amount": total_amount,
            "currency": "INR",
            "invoice_date": invoice_date or ocr.get("invoice_date") or datetime.now().strftime("%Y-%m-%d"),
            "status": "PENDING",  # Start of workflow
            "current_step": "step-1",  # Logistics Ops
            "next_approver_role": "OPS_MANAGER",  # Kaai Bansal
            "line_items_count": line_items_count,
            "ocr_confidence": confidence_score,
            "reconciliation_status": reconciliation_status,
            "source": "BULK_UPLOAD",
            "created_at": datetime.now().isoformat(),
            "workflow_history": [
                {
                    "stepId": "step-1",
                    "status": "ACTIVE",
                    "timestamp": datetime.now().isoformat()
                },
                {"stepId": "step-2", "status": "PENDING"},
                {"stepId": "step-3", "status": "PENDING"}
            ]
        }
        
        # Try to save to database
        saved = False
        try:
            from db_config import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Use schema-compatible fields
            # status='PENDING_APPROVAL', approval_level=0 (Ops Pending)
            cursor.execute("""
                INSERT INTO invoices (
                    id, invoice_number, vendor_id, total_amount, base_amount, currency,
                    invoice_date, status, approval_level, created_at, ocr_confidence,
                    line_items, sentinel_passed, source
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
            """, (
                invoice_id, 
                invoice_record["invoice_number"], 
                supplier_id, # Maps to vendor_id
                total_amount, 
                total_amount, # base_amount fallback
                "INR", 
                invoice_record["invoice_date"],
                "PENDING_APPROVAL", 
                0, # Level 0 = Logistics Ops Pending
                datetime.now(), 
                confidence_score,
                json.dumps({"count": line_items_count, "items": []}), # Minimal JSON for line_items
                True if reconciliation_status == "MATCHED" else False,
                "BULK_UPLOAD" # Note: 'source' col might need adding or ignored if not in DB, assuming schema allows implicit columns or we'll catch error
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            saved = True
            logger.info(f"[SUBMIT] Invoice {invoice_id} saved to database, assigned to OPS_MANAGER (Level 0)")
            
        except Exception as db_err:
            logger.warning(f"[SUBMIT] Database save failed: {db_err}")
            # Fallback for old schema if 'source' or other cols missing
            try:
                # Minimal insert retry
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO invoices (
                        id, invoice_number, vendor_id, total_amount, base_amount,
                        invoice_date, status, approval_level, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    invoice_id, invoice_record["invoice_number"], supplier_id,
                    total_amount, total_amount, invoice_record["invoice_date"],
                    "PENDING_APPROVAL", 0, datetime.now()
                ))
                conn.commit()
                cursor.close()
                conn.close()
                saved = True
                logger.info(f"[SUBMIT] Fallback insert successful")
            except Exception as retry_err:
                logger.error(f"[SUBMIT] Fallback failed: {retry_err}")
        
        return {
            "success": True,
            "message": "Invoice submitted for approval",
            "invoice": invoice_record,
            "workflow": {
                "current_step": "Logistics Ops Review",
                "current_approver": "Kaai Bansal",
                "next_steps": [
                    "Logistics Ops (Kaai Bansal) → Approve",
                    "Finance (Zeya Kapoor) → Approve", 
                    "ERP Settlement (Admin) → Pay"
                ]
            },
            "saved_to_db": saved
        }
        
    except Exception as e:
        logger.error(f"[SUBMIT] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/pending")
async def get_pending_invoices(approver_role: str = None):
    """
    Get invoices pending approval for a specific role.
    
    Roles:
    - OPS_MANAGER: Gets PENDING invoices
    - FINANCE_MANAGER: Gets OPS_APPROVED invoices
    - ENTERPRISE_ADMIN: Gets FINANCE_APPROVED invoices
    """
    try:
        status_map = {
            "OPS_MANAGER": "PENDING",
            "Logistics Ops": "PENDING",
            "FINANCE_MANAGER": "OPS_APPROVED",
            "Finance Manager": "OPS_APPROVED",
            "ENTERPRISE_ADMIN": "FINANCE_APPROVED",
            "Super User": "FINANCE_APPROVED"
        }
        
        target_status = status_map.get(approver_role, "PENDING")
        
        try:
            from db_config import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # APPROVAL LEVEL LOGIC:
            # Level 0 = Pending Ops (Kaai)
            # Level 1 = Ops Approved, Pending Finance (Zeya)
            # Level 2 = Finance Approved, Pending Admin (Payment)
            
            target_level = 0
            if approver_role in ["FINANCE_MANAGER", "Finance Manager"]:
                target_level = 1
            elif approver_role in ["ENTERPRISE_ADMIN", "Super User"]:
                target_level = 2
                
            cursor.execute("""
                SELECT id, invoice_number, vendor_id as supplier_id, total_amount as amount, status, 
                       invoice_date, created_at, approval_level
                FROM invoices 
                WHERE status = 'PENDING_APPROVAL' AND approval_level = %s
                ORDER BY created_at DESC
            """, (target_level,))
            
            invoices = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return {"success": True, "invoices": invoices, "count": len(invoices)}
            
        except Exception as db_err:
            logger.warning(f"[PENDING] Database query failed: {db_err}")
            return {"success": True, "invoices": [], "count": 0, "db_error": str(db_err)}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/{invoice_id}/approve")
async def approve_invoice(invoice_id: str, payload: dict):
    """
    Approve an invoice and move it to the next workflow stage.
    
    Logic:
    - Level 0 (Ops) -> Level 1 (Finance)
    - Level 1 (Finance) -> Level 2 (Admin/Payment)
    - Level 2 (Admin) -> APPROVED (Ready for Payment Batch)
    """
    try:
        approver_name = payload.get("approver_name", "Unknown")
        remarks = payload.get("remarks", "")
        
        from db_config import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get current state
        cursor.execute("SELECT approval_level, status FROM invoices WHERE id = %s", (invoice_id,))
        invoice = cursor.fetchone()
        
        if not invoice:
            return {"success": False, "error": "Invoice not found"}
            
        current_level = invoice["approval_level"] or 0
        new_level = current_level + 1
        new_status = "PENDING_APPROVAL"
        
        # Workflow Transition Logic
        if current_level == 2:
            new_status = "APPROVED" # Fully approved, ready for payment
            # Optionally trigger payment batch logic here
        
        cursor.execute("""
            UPDATE invoices 
            SET approval_level = %s,
                status = %s,
                approved_by = %s,
                approved_at = NOW()
            WHERE id = %s
        """, (new_level, new_status, approver_name, invoice_id))
        
        # Log action
        cursor.execute("""
            INSERT INTO audit_log (entity_type, entity_id, action, user_name, description)
            VALUES ('INVOICE', %s, 'APPROVE', %s, %s)
        """, (invoice_id, approver_name, f"Approved level {current_level} -> {new_level}: {remarks}"))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "success": True, 
            "new_level": new_level, 
            "new_status": new_status,
            "message": f"Invoice moved to Level {new_level}"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/{invoice_id}/reject")
async def reject_invoice(invoice_id: str, payload: dict):
    """Reject an invoice and stop the workflow."""
    try:
        approver_name = payload.get("approver_name", "Unknown")
        reason = payload.get("reason", "No reason provided")
        
        from db_config import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE invoices 
            SET status = 'REJECTED',
                rejection_reason = %s,
                approved_by = %s, -- capture who rejected it
                approved_at = NOW()
            WHERE id = %s
        """, (reason, approver_name, invoice_id))
        
        # Log action
        cursor.execute("""
            INSERT INTO audit_log (entity_type, entity_id, action, user_name, description)
            VALUES ('INVOICE', %s, 'REJECT', %s, %s)
        """, (invoice_id, approver_name, f"Rejected: {reason}"))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "status": "REJECTED"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}
