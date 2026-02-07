from flask import jsonify, request
import os
import datetime
from werkzeug.utils import secure_filename
UPLOAD_FOLDER = "/tmp"

def ocr_extract_invoice():
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded", "success": False}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Empty filename", "success": False}), 400
        
        # Check file extension
        allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({
                "error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}",
                "success": False
            }), 400
        
        # Read file bytes and Save to Disk
        file_bytes = file.read()
        print(f"[OCR] Processing file: {file.filename}, size: {len(file_bytes)} bytes")

        secure_name = secure_filename(file.filename)
        save_path = os.path.join(UPLOAD_FOLDER, secure_name)
        file.seek(0)
        file.save(save_path)
        print(f"[OCR] Saved file to: {save_path}")

        # Lazy import OCR engine (heavy dependency)
        try:
            from services.invoice_ocr_engine import extract_invoice_from_bytes
        except ImportError as e:
            print(f"[OCR] Import Error: {e}")
            return jsonify({
                "error": f"OCR engine not available: {e}. Install: pip install paddleocr paddlepaddle pdf2image Pillow",
                "success": False
            }), 500
        
        # Extract invoice
        print("[OCR] Starting extraction...")
        result = extract_invoice_from_bytes(file_bytes, file.filename)
        print(f"[OCR] Extraction complete. Success: {result.success}, Confidence: {result.confidence}")
        
        # Build response
        response = {
            "success": result.success,
            "confidence": result.confidence,
            "processing_time_ms": result.processing_time_ms,
            "errors": result.errors,
            "warnings": result.warnings,
            "raw_text": result.raw_text[:2000] if result.raw_text else None,
            "filename": secure_name 
        }
        
        # Check if we have valid invoice data
        if result.success and result.invoice:
            response["invoice"] = result.invoice.model_dump()
            print(f"[OCR] Invoice extracted: {result.invoice.invoice_number}")
        elif result.success and not result.invoice:
            # Extraction succeeded but no invoice found - this is still useful
            response["success"] = True
            response["invoice"] = {
                "invoice_number": "UNKNOWN",
                "invoice_date": datetime.datetime.now().strftime('%Y-%m-%d'),
                "vendor": {"name": "Unknown Vendor"},
                "subtotal": 0,
                "total_amount": 0,
                "confidence_score": result.confidence,
                "line_items": [],
                "tax_details": {}
            }
            response["warnings"] = response.get("warnings", []) + ["Invoice fields not detected. Please upload a clearer document."]
            print("[OCR] No invoice structure detected, returning default")
        else:
            print(f"[OCR] Extraction failed: {result.errors}")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"OCR Extraction Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500
