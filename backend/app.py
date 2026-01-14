from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
import time
import werkzeug
from werkzeug.utils import secure_filename
import uuid
import datetime
from services.db_service import get_db_connection
from services.pdf_service import PDFGenerator
from services.analytics_service import AnalyticsService
from services.fuzzy_duplicate_service import (
    detect_duplicates, 
    scan_all_duplicates, 
    calculate_shipment_dna_similarity,
    levenshtein_similarity
)
from services.detention_validation_service import (
    validate_detention_claim,
    calculate_detention_hours,
    haversine_distance,
    point_in_polygon,
    get_demo_detention_cases,
    DEMO_GEOFENCES
)
from services.benford_fraud_service import (
    analyze_vendor_benford,
    get_all_vendors_benford_analysis,
    get_benford_summary,
    DEMO_VENDORS
)
from services.spot_rate_predictor import (
    predict_spot_rate,
    get_rate_comparison,
    get_demo_predictions,
    CURRENT_DIESEL_PRICE
)
from services.placement_failure_predictor import (
    predict_placement_failure,
    get_vendor_comparison,
    get_demo_risks,
    VENDOR_PROFILES
)
from services.milk_run_optimizer import (
    optimize_milk_runs,
    get_demo_optimization,
    get_sample_pending_orders,
    TRUCK_TYPES
)
from services.remark_sentiment_classifier import classify_remark_naive_bayes

# Import Advanced Atlas Routes moved to after app init
from services.document_checklist import (
    get_document_requirements,
    split_pdf_bundle,
    get_demo_shipment_config,
    get_mock_pdf_thumbnails
)
from services.atlas_sentinel import (
    validate_all_rings,
    validate_ring1_contract,
    validate_ring2_zscore,
    validate_ring3_image_quality,
    validate_ring4_duplicate
)
from services.cashflow_forecaster import (
    forecast_for_date,
    forecast_weekly,
    forecast_vendors,
    get_next_friday_forecast
)
from rag_engine import RAGController
from db_config import DB_CONFIG
from services.invoice_db_service import invoice_db_service
from services.payment_service import payment_service
from services.atlas_master_service import get_master_service
from services.atlas_bulk_service import get_bulk_service

# New Enterprise Services
from services.erp_integration_service import (
    get_erp_status,
    add_erp_connector,
    connect_erp,
    post_to_erp,
    get_master_data
)
from services.tax_compliance_engine import (
    calculate_tax,
    validate_gstin,
    generate_einvoice,
    get_hsn_codes,
    calculate_gst,
    calculate_tds
)
from services.emissions_calculator import (
    calculate_emissions,
    calculate_route,
    compare_transport_modes,
    get_carrier_emissions_score,
    generate_esg_report,
    get_emission_factors
)
from services.carrier_compliance_service import (
    get_carrier_compliance,
    get_all_carriers_compliance,
    get_compliance_summary,
    get_expiring_documents,
    verify_carrier_document,
    update_carrier_safety_rating,
    get_document_types
)
from services.supply_chain_finance import (
    calculate_discount,
    get_factoring_quote,
    optimize_payment_schedule,
    get_scf_program_summary,
    enroll_carrier_scf,
    request_early_payment,
    get_enrolled_carriers,
    get_pending_payment_requests
)

# MySQL Contract Service
from services.contract_service import (
    contract_service_db,
    api_get_contracts,
    api_get_contract,
    api_create_contract,
    api_update_contract,
    api_delete_contract,
    api_get_route_rate,
    api_get_all_routes
)

# MySQL Vendor Service
from services.vendor_service import (
    vendor_service_db,
    api_get_vendors,
    api_get_vendor,
    api_create_vendor,
    api_update_vendor,
    api_delete_vendor,
    api_get_vendor_stats
)

# MySQL Location Service
from services.location_service import (
    location_service_db,
    api_get_locations,
    api_get_location,
    api_create_location,
    api_update_location,
    api_get_cities,
    api_get_location_stats
)

# MySQL Invoice Service
from services.invoice_service import (
    invoice_service_db,
    api_get_invoices,
    api_get_invoice,
    api_create_invoice,
    api_update_invoice,
    api_approve_invoice,
    api_reject_invoice,
    api_get_invoice_stats
)

# MySQL Auth Service
from services.auth_service import (
    auth_service_db,
    api_login,
    api_get_current_user,
    api_create_user,
    api_get_users,
    api_update_password
)

app = Flask(__name__)
# Allow CORS for frontend
CORS(app)

# Register ticket routes blueprint
from ticket_routes_flask import ticket_bp
app.register_blueprint(ticket_bp)

# Register Advanced Atlas Routes
from atlas_api_routes import atlas_bp
app.register_blueprint(atlas_bp)

# Register R analytics routes blueprint
try:
    from r_analytics_routes import r_analytics_bp
    app.register_blueprint(r_analytics_bp)
    print("✅ R Analytics routes registered")
except ImportError as e:
    print(f"⚠️  R Analytics routes not available: {e}")

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Services
print("Initializing Services...")
rag_engine = RAGController()
analytics_service = AnalyticsService(DB_CONFIG)
pdf_generator = PDFGenerator()

# Initialize Atlas Services
print("[Atlas] Initializing Atlas Master Data & Bulk Services...")
atlas_master = get_master_service()
atlas_bulk = get_bulk_service()
print("[Atlas] Services initialized successfully")

# --- ROUTES ---

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "backend": "Python/Flask", "database": "MySQL"}), 200

@app.route('/api/analytics/cost-to-serve', methods=['GET'])
def get_cost_to_serve():
    try:
        data = analytics_service.get_cost_to_serve_data()
        return jsonify(data)
    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    data = request.form
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # 1. Save File to Disk
    # Use secure filename or uuid to prevent overwrites in prod, but for demo user wants to see "their" file name
    # We will prepend a UUID to ensure uniqueness but keep original name suffix
    import werkzeug
    filename = werkzeug.utils.secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Generate URL (for frontend)
    file_url = f"http://localhost:5000/api/documents/{filename}"
    
    # 2. Save Metadata to MySQL (Optional/Demo)
    try:
        # Simplified: We just return the URL and let the frontend attach it to the invoice object
        pass
    except Exception as e:
        print(f"DB Error: {e}")
        
    return jsonify({
        "message": "File uploaded successfully",
        "filename": filename,
        "url": file_url
    }), 200

@app.route('/api/documents/ocr-upload', methods=['POST'])
def ocr_upload_document():
    """
    Upload document and perform OCR extraction.
    Returns quality score, blur detection, and extracted text.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    doc_type = request.form.get('docType', 'document')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    import werkzeug
    filename = werkzeug.utils.secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Default response
    quality_score = 75
    blur_detected = False
    extracted_text = ""
    
    try:
        # Try to perform OCR and quality analysis
        import cv2
        import numpy as np
        
        # Read image for quality analysis
        if filepath.lower().endswith(('.png', '.jpg', '.jpeg')):
            img = cv2.imread(filepath)
            if img is not None:
                # Calculate blur using Laplacian variance
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                # Score based on blur
                if laplacian_var < 100:
                    quality_score = max(30, int(laplacian_var * 0.5))
                    blur_detected = True
                else:
                    quality_score = min(95, int(50 + laplacian_var * 0.03))
                    blur_detected = False
        # Try OCR extraction using OpenRouter (Reliable Vision)
        try:
            import requests
            import base64
            
            # Configure OpenRouter
            api_key = os.getenv("OPENROUTER_API_KEY")
            model_id = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-vl-7b-instruct:free")
            
            if not api_key:
                 raise ValueError("OPENROUTER_API_KEY not set")
            
            # Encode image to base64
            image_data_b64 = None
            mime_type = "image/jpeg"
            
            if filepath.lower().endswith('.pdf'):
                # Convert PDF to Image
                from pdf2image import convert_from_path
                import io
                pages = convert_from_path(filepath, first_page=1, last_page=1)
                if pages:
                    img_byte_arr = io.BytesIO()
                    pages[0].save(img_byte_arr, format='JPEG')
                    image_data_b64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
            else:
                # Direct Image
                if filepath.lower().endswith(".png"): mime_type = "image/png"
                elif filepath.lower().endswith(".webp"): mime_type = "image/webp"
                
                with open(filepath, "rb") as image_file:
                    image_data_b64 = base64.b64encode(image_file.read()).decode('utf-8')
            
            if image_data_b64:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "http://localhost:5000",
                    "X-Title": "Atlas App",
                    "Content-Type": "application/json"
                }

                payload = {
                    "model": model_id,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all text and data from this document as JSON: {vendor, invoice_no, date, amount, line_items}"},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:{mime_type};base64,{image_data_b64}"}
                                }
                            ]
                        }
                    ],
                    "response_format": {"type": "json_object"}
                }

                resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                
                if resp.status_code == 200:
                    extracted_text = resp.json()['choices'][0]['message']['content']
                    quality_score = 98
                else:
                    print(f"OpenRouter App Error: {resp.status_code} - {resp.text}")
                    extracted_text = f"Error: OpenRouter returned {resp.status_code}"
            else:
                extracted_text = "Could not process file for OpenRouter extraction."

        except Exception as ocr_err:
            print(f"OpenRouter OCR Error: {ocr_err}")
            # Fallback to Tesseract if Gemini fails (or just error out)
            try:
                import pytesseract
                if filepath.lower().endswith('.pdf'):
                     from pdf2image import convert_from_path
                     pages = convert_from_path(filepath, first_page=1, last_page=1)
                     extracted_text = pytesseract.image_to_string(pages[0]) if pages else ""
                else:
                    img = Image.open(filepath)
                    extracted_text = pytesseract.image_to_string(img)
            except:
                extracted_text = f"Document: {filename}\nOllama/Gemini Error: {ocr_err}\nCould not perform local OCR."
            
    except Exception as e:
        print(f"Document processing error: {e}")
        # Still return success but with default values
        extracted_text = f"Document: {filename}\nUploaded successfully."
    
    # Ensure we always return some text
    if not extracted_text or extracted_text.strip() == "":
        extracted_text = f"Document: {filename}\nType: {doc_type}\nFile uploaded successfully for processing."
    
    return jsonify({
        "success": True,
        "filename": filename,
        "doc_type": doc_type,
        "quality_score": quality_score,
        "blur_detected": blur_detected,
        "extracted_text": extracted_text,
        "raw_text": extracted_text,  # Alias for compatibility
        "url": f"http://localhost:5000/api/documents/{filename}"
    }), 200

@app.route('/api/documents/<path:filename>', methods=['GET'])
def get_document(filename):
    """
    Serve uploaded documents (PDFs/Images).
    """
    return send_from_directory(UPLOAD_FOLDER, filename) 

# =============================================================================
# CONTRACTS API (MySQL)
# =============================================================================

@app.route('/api/contracts', methods=['GET'])
def get_contracts():
    """Get all contracts from MySQL"""
    status = request.args.get('status')
    vendor_id = request.args.get('vendor_id')
    result = api_get_contracts(status, vendor_id)
    return jsonify(result)

@app.route('/api/contracts/<contract_id>', methods=['GET'])
def get_contract_by_id(contract_id):
    """Get single contract by ID"""
    result = api_get_contract(contract_id)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 404

@app.route('/api/contracts', methods=['POST'])
def create_contract():
    """Create new contract"""
    data = request.get_json()
    result = api_create_contract(data)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400

@app.route('/api/contracts/<contract_id>', methods=['PUT'])
def update_contract(contract_id):
    """Update existing contract"""
    data = request.get_json()
    result = api_update_contract(contract_id, data)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/contracts/<contract_id>', methods=['DELETE'])
def delete_contract(contract_id):
    """Delete contract"""
    result = api_delete_contract(contract_id)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/contracts/route/<origin>/<destination>', methods=['GET'])
def get_contract_for_route(origin, destination):
    """Get contract rate for a specific route"""
    vehicle_type = request.args.get('vehicle_type')
    result = api_get_route_rate(origin, destination, vehicle_type)
    return jsonify(result)

@app.route('/api/contracts/routes', methods=['GET'])
def get_all_contract_routes():
    """Get all available routes from contracts"""
    result = api_get_all_routes()
    return jsonify(result)

# =============================================================================
# VENDORS API (MySQL)
# =============================================================================

@app.route('/api/vendors', methods=['GET'])
def get_vendors():
    """Get all vendors from MySQL"""
    vendor_type = request.args.get('type')
    is_active = request.args.get('is_active')
    if is_active is not None:
        is_active = is_active.lower() == 'true'
    result = api_get_vendors(vendor_type, is_active)
    return jsonify(result)

@app.route('/api/vendors/<vendor_id>', methods=['GET'])
def get_vendor_by_id(vendor_id):
    """Get single vendor by ID"""
    result = api_get_vendor(vendor_id)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 404

@app.route('/api/vendors', methods=['POST'])
def create_vendor():
    """Create new vendor"""
    data = request.get_json()
    result = api_create_vendor(data)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400

@app.route('/api/vendors/<vendor_id>', methods=['PUT'])
def update_vendor(vendor_id):
    """Update existing vendor"""
    data = request.get_json()
    result = api_update_vendor(vendor_id, data)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/vendors/<vendor_id>', methods=['DELETE'])
def delete_vendor(vendor_id):
    """Delete vendor (soft delete)"""
    result = api_delete_vendor(vendor_id)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/vendors/stats', methods=['GET'])
def get_vendors_stats():
    """Get vendor statistics"""
    result = api_get_vendor_stats()
    return jsonify(result)

# =============================================================================
# LOCATIONS API (MySQL)
# =============================================================================

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all locations from MySQL"""
    location_type = request.args.get('type')
    city = request.args.get('city')
    result = api_get_locations(location_type, city)
    return jsonify(result)

@app.route('/api/locations/<location_id>', methods=['GET'])
def get_location_by_id(location_id):
    """Get single location by ID"""
    result = api_get_location(location_id)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 404

@app.route('/api/locations', methods=['POST'])
def create_location():
    """Create new location"""
    data = request.get_json()
    result = api_create_location(data)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400

@app.route('/api/locations/<location_id>', methods=['PUT'])
def update_location(location_id):
    """Update existing location"""
    data = request.get_json()
    result = api_update_location(location_id, data)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/locations/cities', methods=['GET'])
def get_cities():
    """Get all unique cities"""
    result = api_get_cities()
    return jsonify(result)

@app.route('/api/locations/stats', methods=['GET'])
def get_locations_stats():
    """Get location statistics"""
    result = api_get_location_stats()
    return jsonify(result)

# =============================================================================
# INVOICES API (MySQL)
# =============================================================================

@app.route('/api/invoices', methods=['GET'])
def get_invoices_list():
    """Get all invoices from MySQL"""
    status = request.args.get('status')
    vendor_id = request.args.get('vendor_id')
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    result = api_get_invoices(status, vendor_id, limit, offset)
    return jsonify(result)

@app.route('/api/invoices/<invoice_id>', methods=['GET'])
def get_invoice_by_id_api(invoice_id):
    """Get single invoice by ID"""
    result = api_get_invoice(invoice_id)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 404

@app.route('/api/invoices', methods=['POST'])
def create_invoice_api():
    """Create new invoice"""
    data = request.get_json()
    result = api_create_invoice(data)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400

@app.route('/api/invoices/<invoice_id>', methods=['PUT'])
def update_invoice_api(invoice_id):
    """Update existing invoice"""
    data = request.get_json()
    result = api_update_invoice(invoice_id, data)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/invoices/<invoice_id>/approve', methods=['POST'])
def approve_invoice_api(invoice_id):
    """Approve invoice"""
    data = request.get_json() or {}
    approved_by = data.get('approved_by', 'System')
    result = api_approve_invoice(invoice_id, approved_by)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/invoices/<invoice_id>/reject', methods=['POST'])
def reject_invoice_api(invoice_id):
    """Reject invoice"""
    data = request.get_json() or {}
    reason = data.get('reason', 'No reason provided')
    result = api_reject_invoice(invoice_id, reason)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/invoices/stats', methods=['GET'])
def get_invoices_stats():
    """Get invoice statistics"""
    vendor_id = request.args.get('vendor_id')
    result = api_get_invoice_stats(vendor_id)
    return jsonify(result)

# =============================================================================
# AUTH API (MySQL)
# =============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    """User login"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password required'}), 400
    
    result = api_login(email, password)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 401

@app.route('/api/auth/me', methods=['GET'])
def get_current_user_api():
    """Get current user (from header)"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    result = api_get_current_user(user_id)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 404

@app.route('/api/auth/users', methods=['GET'])
def get_users_list():
    """Get all users"""
    role = request.args.get('role')
    result = api_get_users(role)
    return jsonify(result)

@app.route('/api/auth/users', methods=['POST'])
def create_user_api():
    """Create new user"""
    data = request.get_json()
    result = api_create_user(data)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400

@app.route('/api/auth/password', methods=['PUT'])
def update_password_api():
    """Update user password"""
    data = request.get_json()
    user_id = data.get('user_id')
    new_password = data.get('password')
    
    if not user_id or not new_password:
        return jsonify({'success': False, 'error': 'User ID and password required'}), 400
    
    result = api_update_password(user_id, new_password)
    if result.get('success'):
        return jsonify(result)
    return jsonify(result), 400

@app.route('/api/documents/<doc_id>/view', methods=['GET'])
def view_document(doc_id):
    try:
        conn = get_db_connection()
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM supplier_documents WHERE id = %s", (doc_id,))
        doc = cursor.fetchone()
        cursor.close()
        conn.close()

        if not doc:
            return jsonify({"error": "Document not found"}), 404

        # Serve File with explicit MIME type
        file_path = os.path.join(UPLOAD_FOLDER, doc['file_path'])
        return send_file(file_path, mimetype='application/pdf')

    except Exception as e:
        print(f"View Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/invoices/<path:invoice_id>/view', methods=['GET'])
def view_invoice(invoice_id):
    """
    Serves the generated Invoice PDF. 
    Converts invoice ID format (e.g., TCI/2024/002) to filename (TCI_2024_002.pdf).
    """
    try:
        # Convert slashes to underscores for filename
        safe_id = invoice_id.replace('/', '_')
        filename = f"{safe_id}.pdf"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        print(f"[Invoice View] Looking for: {file_path}")
        
        if os.path.exists(file_path):
             return send_file(file_path, mimetype='application/pdf')
        else:
             # Return placeholder message as PDF-like response
             return jsonify({"error": f"Invoice PDF not found: {filename}", "path": file_path}), 404

    except Exception as e:
        print(f"Invoice View Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files/view', methods=['GET'])
def view_file_by_name():
    """
    Generic endpoint to serve any file from uploads by filename.
    Used for serving document bundles (LR, POD, Contract, etc.).
    """
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "Filename required"}), 400
    
    # Simple security check
    if '..' in filename or '/' in filename or '\\' in filename:
         return jsonify({"error": "Invalid filename location"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
         return send_file(file_path, mimetype='application/pdf' if filename.lower().endswith('.pdf') else None)
    else:
         return jsonify({"error": "File not found"}), 404

@app.route('/api/generate/pdf', methods=['POST'])
def generate_pdf():
    """Generates a PDF on the fly using ReportLab based on data provided"""
    data = request.json
    doc_type = data.get('type')
    
    generator = PDFGenerator()
    
    if doc_type == 'GST':
        pdf_path = generator.generate_gst_certificate(data)
        return send_file(pdf_path, as_attachment=False, mimetype='application/pdf')
    
    elif doc_type == 'INVOICE':
        pdf_path = generator.generate_invoice(data)
        return send_file(pdf_path, as_attachment=False, mimetype='application/pdf')

    elif doc_type == 'CARRIER_PROFILE':
        pdf_path = generator.generate_carrier_profile(data)
        return send_file(pdf_path, as_attachment=False, mimetype='application/pdf')

    return jsonify({"error": "Unknown document type"}), 400

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """
    Advanced RAG Chatbot Endpoint.
    Connects Frontend -> Flask -> RAGController -> Ollama
    """
    try:
        data = request.json
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
            
        # Process via RAG Engine
        response = rag_engine.process_query(message)
        return jsonify(response)
        
    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({"message": "I encountered an internal system error.", "error": str(e)}), 500

# --- FUZZY DUPLICATE DETECTION API ---

@app.route('/api/duplicates/scan', methods=['GET'])
def scan_duplicates():
    """
    Scan all invoices for potential duplicates.
    Query params:
    - days: Number of days to look back (default 90)
    - threshold: Similarity threshold (default 0.85)
    """
    try:
        days = request.args.get('days', 90, type=int)
        threshold = request.args.get('threshold', 0.85, type=float)
        
        result = scan_all_duplicates(days=days, threshold=threshold)
        return jsonify(result)
    except Exception as e:
        print(f"Duplicate Scan Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/duplicates/check', methods=['POST'])
def check_duplicate():
    """
    Check a single invoice for potential duplicates.
    Body: Invoice object with invoice_number, vendor_id, amount, date, vehicle_number
    """
    try:
        invoice = request.json
        if not invoice:
            return jsonify({"error": "Invoice data required"}), 400
        
        days = request.args.get('days', 90, type=int)
        threshold = request.args.get('threshold', 0.85, type=float)
        
        duplicates = detect_duplicates(
            target_invoice=invoice,
            threshold=threshold,
            days=days
        )
        
        return jsonify({
            "invoice_checked": invoice.get('invoice_number'),
            "duplicates_found": len(duplicates),
            "duplicates": duplicates
        })
    except Exception as e:
        print(f"Duplicate Check Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/duplicates/compare', methods=['POST'])
def compare_invoices():
    """
    Compare two invoices and return similarity analysis.
    Body: { "invoice1": {...}, "invoice2": {...} }
    """
    try:
        data = request.json
        invoice1 = data.get('invoice1')
        invoice2 = data.get('invoice2')
        
        if not invoice1 or not invoice2:
            return jsonify({"error": "Both invoice1 and invoice2 required"}), 400
        
        similarity = calculate_shipment_dna_similarity(invoice1, invoice2)
        
        return jsonify({
            "invoice1": invoice1.get('invoice_number'),
            "invoice2": invoice2.get('invoice_number'),
            "similarity_analysis": similarity
        })
    except Exception as e:
        print(f"Invoice Compare Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/duplicates/similarity', methods=['GET'])
def get_string_similarity():
    """
    Calculate Levenshtein similarity between two strings.
    Query params: s1, s2
    """
    try:
        s1 = request.args.get('s1', '')
        s2 = request.args.get('s2', '')
        
        similarity = levenshtein_similarity(s1, s2)
        
        return jsonify({
            "string1": s1,
            "string2": s2,
            "similarity": round(similarity, 4),
            "is_similar": similarity >= 0.85
        })
    except Exception as e:
        print(f"Similarity Error: {e}")
        return jsonify({"error": str(e)}), 500


# --- GPS DETENTION VALIDATION API ---

@app.route('/api/detention/validate', methods=['POST'])
def validate_detention():
    """
    Validate a detention claim against GPS data.
    Body: { 
        "invoice_detention_hours": float,
        "gps_pings": [{"lat": float, "lon": float, "timestamp": string}, ...],
        "geofence": { "type": "circle", "center": [lat, lon], "radius_km": float } 
                  OR { "type": "polygon", "vertices": [[lat, lon], ...] }
    }
    """
    try:
        data = request.json
        invoice_hours = data.get('invoice_detention_hours', 0)
        gps_pings = data.get('gps_pings', [])
        geofence = data.get('geofence', {})
        
        if not gps_pings:
            return jsonify({"error": "GPS pings required"}), 400
        if not geofence:
            return jsonify({"error": "Geofence definition required"}), 400
        
        result = validate_detention_claim(invoice_hours, gps_pings, geofence)
        return jsonify(result)
    except Exception as e:
        print(f"Detention Validation Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/detention/demo-cases', methods=['GET'])
def get_detention_demo_cases():
    """
    Get demo detention validation cases for testing.
    """
    try:
        cases = get_demo_detention_cases()
        return jsonify({
            "cases_count": len(cases),
            "cases": cases
        })
    except Exception as e:
        print(f"Demo Cases Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/detention/geofences', methods=['GET'])
def get_geofences():
    """
    Get available factory geofences.
    """
    try:
        return jsonify(DEMO_GEOFENCES)
    except Exception as e:
        print(f"Geofences Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/detention/distance', methods=['GET'])
def get_haversine_distance():
    """
    Calculate distance between two GPS coordinates.
    Query params: lat1, lon1, lat2, lon2
    """
    try:
        lat1 = float(request.args.get('lat1', 0))
        lon1 = float(request.args.get('lon1', 0))
        lat2 = float(request.args.get('lat2', 0))
        lon2 = float(request.args.get('lon2', 0))
        
        distance = haversine_distance(lat1, lon1, lat2, lon2)
        
        return jsonify({
            "from": {"lat": lat1, "lon": lon1},
            "to": {"lat": lat2, "lon": lon2},
            "distance_km": distance
        })
    except Exception as e:
        print(f"Distance Calculation Error: {e}")
        return jsonify({"error": str(e)}), 500


# --- BENFORD'S LAW FRAUD DETECTION API ---

@app.route('/api/benford/analyze/<vendor_id>', methods=['GET'])
def analyze_single_vendor(vendor_id):
    """
    Analyze a specific vendor for Benford's Law compliance.
    """
    try:
        if vendor_id not in DEMO_VENDORS:
            return jsonify({"error": f"Vendor {vendor_id} not found"}), 404
        
        vendor_data = DEMO_VENDORS[vendor_id]
        result = analyze_vendor_benford(
            vendor_id=vendor_id,
            amounts=vendor_data['amounts'],
            vendor_name=vendor_data['name']
        )
        result['contact'] = vendor_data['contact']
        
        return jsonify(result)
    except Exception as e:
        print(f"Benford Analysis Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/benford/all-vendors', methods=['GET'])
def analyze_all_vendors():
    """
    Analyze all vendors for Benford's Law compliance.
    """
    try:
        results = get_all_vendors_benford_analysis()
        return jsonify({
            "count": len(results),
            "vendors": results
        })
    except Exception as e:
        print(f"Benford All Vendors Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/benford/summary', methods=['GET'])
def get_benford_fraud_summary():
    """
    Get summary of Benford's Law fraud detection across all vendors.
    """
    try:
        summary = get_benford_summary()
        return jsonify(summary)
    except Exception as e:
        print(f"Benford Summary Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/benford/analyze-custom', methods=['POST'])
def analyze_custom_amounts():
    """
    Analyze custom list of amounts for Benford's Law compliance.
    Body: { "vendor_id": string, "vendor_name": string, "amounts": [float] }
    """
    try:
        data = request.json
        vendor_id = data.get('vendor_id', 'custom')
        vendor_name = data.get('vendor_name', 'Custom Analysis')
        amounts = data.get('amounts', [])
        
        if not amounts:
            return jsonify({"error": "Amounts list required"}), 400
        
        result = analyze_vendor_benford(vendor_id, amounts, vendor_name)
        return jsonify(result)
    except Exception as e:
        print(f"Custom Benford Analysis Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- SPOT RATE PREDICTOR API (XGBoost Regression) ---

@app.route('/api/spot-rate/predict', methods=['POST'])
def predict_spot_rate_api():
    """
    Predict fair spot rate for a given route and vehicle.
    Body: { "origin": str, "destination": str, "vehicle_type": str, "diesel_price": float?, "month": int? }
    """
    try:
        data = request.json
        origin = data.get('origin', 'Mumbai')
        destination = data.get('destination', 'Delhi')
        vehicle_type = data.get('vehicle_type', '32FT MXL')
        diesel_price = data.get('diesel_price')  # Optional
        month = data.get('month')  # Optional
        
        result = predict_spot_rate(origin, destination, vehicle_type, diesel_price, month)
        return jsonify(result)
    except Exception as e:
        print(f"Spot Rate Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/spot-rate/compare', methods=['POST'])
def compare_spot_rate():
    """
    Compare vendor's quoted price with predicted fair rate.
    Body: { "origin": str, "destination": str, "vehicle_type": str, "vendor_quoted_price": float }
    """
    try:
        data = request.json
        origin = data.get('origin')
        destination = data.get('destination')
        vehicle_type = data.get('vehicle_type', '32FT MXL')
        vendor_quote = data.get('vendor_quoted_price', 0)
        
        if not origin or not destination or not vendor_quote:
            return jsonify({"error": "origin, destination, and vendor_quoted_price are required"}), 400
        
        result = get_rate_comparison(origin, destination, vehicle_type, vendor_quote)
        return jsonify(result)
    except Exception as e:
        print(f"Spot Rate Comparison Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/spot-rate/demo', methods=['GET'])
def get_spot_rate_demo():
    """
    Get demo prediction scenarios for UI display.
    """
    try:
        demos = get_demo_predictions()
        return jsonify({
            "demos": demos,
            "current_diesel_price": CURRENT_DIESEL_PRICE,
            "model": "XGBoost Regression (Simulated)"
        })
    except Exception as e:
        print(f"Spot Rate Demo Error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# PLACEMENT FAILURE PROBABILITY ENDPOINTS
# ============================================================================

@app.route('/api/placement/risk', methods=['POST'])
def predict_placement_risk():
    """
    Predict probability that a vendor will fail to fulfill a placement.
    
    Body: { 
        "vendor_id": str,
        "origin": str, 
        "destination": str,
        "placement_date": str? (YYYY-MM-DD),
        "load_value": float?
    }
    """
    try:
        data = request.json
        vendor_id = data.get('vendor_id')
        origin = data.get('origin', 'Mumbai')
        destination = data.get('destination', 'Delhi')
        placement_date = None
        load_value = data.get('load_value')
        
        if data.get('placement_date'):
            placement_date = datetime.datetime.strptime(data['placement_date'], '%Y-%m-%d')
        
        if not vendor_id:
            return jsonify({"error": "vendor_id is required"}), 400
        
        result = predict_placement_failure(
            vendor_id=vendor_id,
            origin=origin,
            destination=destination,
            placement_date=placement_date,
            load_value=load_value
        )
        return jsonify(result)
    except Exception as e:
        print(f"Placement Risk Prediction Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/placement/compare', methods=['POST'])
def compare_placement_vendors():
    """
    Compare all vendors for a given route and get reliability ranking.
    
    Body: { 
        "origin": str, 
        "destination": str,
        "placement_date": str? (YYYY-MM-DD)
    }
    """
    try:
        data = request.json
        origin = data.get('origin', 'Mumbai')
        destination = data.get('destination', 'Delhi')
        placement_date = None
        
        if data.get('placement_date'):
            placement_date = datetime.datetime.strptime(data['placement_date'], '%Y-%m-%d')
        
        result = get_vendor_comparison(origin, destination, placement_date)
        return jsonify(result)
    except Exception as e:
        print(f"Placement Comparison Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/placement/demo', methods=['GET'])
def get_placement_demo():
    """
    Get demo risk predictions for UI display.
    """
    try:
        demos = get_demo_risks()
        return jsonify({
            "demos": demos,
            "vendors": list(VENDOR_PROFILES.keys()),
            "model": "Logistic Regression (Risk Classification)"
        })
    except Exception as e:
        print(f"Placement Demo Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/placement/vendors', methods=['GET'])
def get_placement_vendors():
    """
    Get all vendor profiles with risk tiers.
    """
    try:
        vendors = []
        for vendor_id, profile in VENDOR_PROFILES.items():
            vendors.append({
                "id": vendor_id,
                "name": profile["name"],
                "failure_rate": profile["failure_rate"],
                "risk_tier": profile["risk_tier"],
                "fleet_size": profile["fleet_size"],
                "total_placements": profile["total_placements"]
            })
        return jsonify({"vendors": vendors})
    except Exception as e:
        print(f"Placement Vendors Error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# MILK RUN OPTIMIZER ENDPOINTS (K-MEANS CLUSTERING)
# ============================================================================

@app.route('/api/milkrun/optimize', methods=['POST'])
def optimize_milk_run():
    """
    Optimize pending orders into milk runs using K-Means clustering.
    
    Body (optional): { 
        "orders": [...],  // List of orders (uses sample data if not provided)
        "max_clusters": int  // Maximum clusters (default: 5)
    }
    """
    try:
        data = request.json or {}
        orders = data.get('orders')  # None = use sample data
        max_clusters = data.get('max_clusters', 5)
        
        result = optimize_milk_runs(orders=orders, max_clusters=max_clusters)
        return jsonify(result)
    except Exception as e:
        print(f"Milk Run Optimization Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500


@app.route('/api/milkrun/demo', methods=['GET'])
def get_milkrun_demo():
    """
    Get demo milk run optimization for UI display.
    """
    try:
        result = get_demo_optimization()
        return jsonify(result)
    except Exception as e:
        print(f"Milk Run Demo Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/milkrun/pending-orders', methods=['GET'])
def get_pending_orders():
    """
    Get sample pending orders for demonstration.
    """
    try:
        orders = get_sample_pending_orders()
        return jsonify({
            "orders": orders,
            "total_orders": len(orders),
            "total_weight_kg": sum(o.get("weight_kg", 0) for o in orders)
        })
    except Exception as e:
        print(f"Pending Orders Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/milkrun/trucks', methods=['GET'])
def get_milkrun_trucks():
    """
    Get available truck configurations.
    """
    try:
        trucks = []
        for truck_id, config in TRUCK_TYPES.items():
            trucks.append({
                "id": truck_id,
                "name": config["name"],
                "capacity_kg": config["capacity_kg"],
                "cost_per_km": config["cost_per_km"],
                "fixed_cost": config["fixed_cost"]
            })
        return jsonify({"trucks": sorted(trucks, key=lambda x: x["capacity_kg"])})
    except Exception as e:
        print(f"Trucks Error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# DOCUMENT CHECKLIST & MAGIC SPLITTER ENDPOINTS
# ============================================================================

UPLOAD_BUNDLE_DIR = os.path.join(os.getcwd(), 'uploads', 'bundles')
UPLOAD_SPLIT_DIR = os.path.join(os.getcwd(), 'uploads', 'split')

# Ensure directories exist
os.makedirs(UPLOAD_BUNDLE_DIR, exist_ok=True)
os.makedirs(UPLOAD_SPLIT_DIR, exist_ok=True)

@app.route('/api/checklist/requirements/<shipment_id>', methods=['GET'])
def get_checklist_requirements(shipment_id):
    """Get mandatory document list for a shipment."""
    try:
        # In real app, fetch shipment data from DB
        # For demo, use mock config
        config = get_demo_shipment_config()
        config['id'] = shipment_id
        requirements = get_document_requirements(config)
        return jsonify(requirements)
    except Exception as e:
        print(f"Checklist Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/checklist/upload-bundle', methods=['POST'])
def upload_pdf_bundle():
    """Upload the 'Big Bundle' PDF."""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if file:
            filename = f"bundle_{int(time.time())}.pdf"
            path = os.path.join(UPLOAD_BUNDLE_DIR, filename)
            file.save(path)
            
            # Generate mock thumbnails for UI
            # In real app, use pdf2image here
            thumbnails = get_mock_pdf_thumbnails()
            
            return jsonify({
                "success": True,
                "bundle_id": filename,
                "path": path,
                "thumbnails": thumbnails,
                "message": "Bundle uploaded successfully"
            })
    except Exception as e:
        print(f"Upload Bundle Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/checklist/split', methods=['POST'])
def split_bundle():
    """
    Perform the physical split of the PDF using pypdf.
    Body: { "bundle_id": "filename.pdf", "split_map": { "INVOICE": [1], ... } }
    """
    try:
        data = request.json
        bundle_id = data.get('bundle_id')
        split_map = data.get('split_map')
        
        if not bundle_id or not split_map:
            return jsonify({"error": "Missing bundle_id or split_map"}), 400
            
        source_path = os.path.join(UPLOAD_BUNDLE_DIR, bundle_id)
        
        result = split_pdf_bundle(source_path, split_map, UPLOAD_SPLIT_DIR)
        return jsonify(result)
        
    except Exception as e:
        print(f"Split API Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents/view/<filename>', methods=['GET'])
def view_split_document(filename):
    """Serve the split files."""
    try:
        return send_file(os.path.join(UPLOAD_SPLIT_DIR, filename))
    except Exception as e:
        return jsonify({"error": "File not found"}), 404


# ============================================================================
# ATLAS SENTINEL LAYER (PRE-AUDIT FIREWALL)
# ============================================================================

@app.route('/api/sentinel/validate-all', methods=['POST'])
def sentinel_validate_all():
    """
    Run all 4 Defense Rings for Pre-Audit validation.
    
    Body: {
        origin: str,
        destination: str,
        vendor_amount: float,
        vendor_id: str,
        vehicle_no: str,
        invoice_date: str,
        document_path?: str,
        invoice_no?: str
    }
    """
    try:
        data = request.json
        result = validate_all_rings(
            origin=data.get('origin', ''),
            destination=data.get('destination', ''),
            vendor_amount=float(data.get('vendor_amount', 0)),
            vendor_id=data.get('vendor_id', ''),
            vehicle_no=data.get('vehicle_no', ''),
            invoice_date=data.get('invoice_date', ''),
            document_path=data.get('document_path'),
            invoice_no=data.get('invoice_no')
        )
        return jsonify(result)
    except Exception as e:
        print(f"Sentinel Validation Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentinel/ring1', methods=['POST'])
def sentinel_ring1():
    """Ring 1: Contract Matcher"""
    try:
        data = request.json
        result = validate_ring1_contract(
            origin=data.get('origin', ''),
            destination=data.get('destination', ''),
            vendor_amount=float(data.get('vendor_amount', 0))
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentinel/ring2', methods=['POST'])
def sentinel_ring2():
    """Ring 2: Statistical Anomaly (Z-Score)"""
    try:
        data = request.json
        result = validate_ring2_zscore(
            origin=data.get('origin', ''),
            destination=data.get('destination', ''),
            vendor_amount=float(data.get('vendor_amount', 0))
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentinel/ring3', methods=['POST'])
def sentinel_ring3():
    """Ring 3: Document Quality (Blur Detection)"""
    try:
        data = request.json
        result = validate_ring3_image_quality(
            image_path=data.get('document_path', '')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentinel/ring4', methods=['POST'])
def sentinel_ring4():
    """Ring 4: Duplicate Hunter"""
    try:
        data = request.json
        result = validate_ring4_duplicate(
            vendor_id=data.get('vendor_id', ''),
            vehicle_no=data.get('vehicle_no', ''),
            date=data.get('invoice_date', ''),
            amount=float(data.get('vendor_amount', 0)),
            invoice_no=data.get('invoice_no')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# REMARK SENTIMENT CLASSIFIER (NLP)
# ============================================================================

@app.route('/api/sentiment/analyze', methods=['POST'])
def analyze_remark_sentiment():
    """
    Analyze logistics remarks for disputes using Naive Bayes.
    
    Body: { "text": str }
    """
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "text is required"}), 400
        
        result = classify_remark_naive_bayes(text)
        return jsonify(result)
    except Exception as e:
        print(f"Sentiment Analysis Error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# CASH FLOW FORECASTING (ARIMA)
# ============================================================================

@app.route('/api/cashflow/friday', methods=['GET'])
def cashflow_next_friday():
    """
    CFO Query: "How much cash do I need next Friday for Logistics?"
    Returns: "₹45 Lakhs" (or similar)
    """
    try:
        result = get_next_friday_forecast()
        return jsonify(result)
    except Exception as e:
        print(f"Cashflow Friday Forecast Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/cashflow/forecast', methods=['GET'])
def cashflow_forecast_date():
    """
    Forecast cash requirement for a specific date.
    Query params: ?date=2025-01-03 (YYYY-MM-DD format)
    """
    try:
        target_date = request.args.get('date')
        if not target_date:
            return jsonify({"error": "date parameter required (YYYY-MM-DD)"}), 400
        
        result = forecast_for_date(target_date)
        return jsonify(result)
    except Exception as e:
        print(f"Cashflow Date Forecast Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/cashflow/weekly', methods=['GET'])
def cashflow_weekly():
    """
    Get weekly cash forecast for next N weeks.
    Query params: ?weeks=4 (optional, default 4)
    """
    try:
        weeks = int(request.args.get('weeks', 4))
        result = forecast_weekly(weeks)
        return jsonify(result)
    except Exception as e:
        print(f"Cashflow Weekly Forecast Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/cashflow/vendors', methods=['GET'])
def cashflow_vendors():
    """
    Get per-vendor payment projections for next N days.
    Query params: ?days=30 (optional, default 30)
    """
    try:
        days = int(request.args.get('days', 30))
        result = forecast_vendors(days)
        return jsonify(result)
    except Exception as e:
        print(f"Cashflow Vendor Forecast Error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# INVOICE & NOTIFICATION ENDPOINTS (MySQL Integration)
# ============================================================================

# --- NEW AUDIT ENDPOINT ---
@app.route('/api/invoices/<invoice_id>/audit', methods=['GET'])
def audit_invoice(invoice_id):
    """
    Run Atlas Sentinel validation on a specific invoice.
    In a real app, this would fetch the invoice from DB. 
    For now, we'll try to find it in the mock list or use defaults.
    """
    # Try to find invoice in DB service (Mock)
    invoice = invoice_db_service.get_invoice_by_id(invoice_id)
    
    if not invoice:
        # Fallback if not found in simplified DB service
        return jsonify({"error": "Invoice not found"}), 404

    # Run Sentinel
    # Map invoice fields to sentinel expectations
    # Note: Using 'amount' as 'vendor_amount'
    result = validate_all_rings(
        origin=invoice.get('origin', 'Unknown'),
        destination=invoice.get('destination', 'Unknown'),
        vendor_amount=float(invoice.get('amount', 0)),
        vendor_id=invoice.get('carrier', 'Unknown'),  # Using carrier name as ID proxy
        vehicle_no=invoice.get('vehicleNumber', 'Unknown'), # Might be missing
        invoice_date=invoice.get('date', datetime.datetime.now().strftime("%Y-%m-%d")),
        invoice_no=invoice.get('invoiceNumber', invoice_id)
    )
    
    return jsonify(result)

# --- EXISTING ROUTES ---
@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    try:
        supplier_id = request.args.get('supplierId')
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        result = invoice_db_service.get_invoices(supplier_id, status, page, limit)
        return jsonify(result)
    except Exception as e:
        print(f"Get Invoices Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/invoices', methods=['POST'])
def create_invoice():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        success = invoice_db_service.create_invoice(data)
        if success:
            return jsonify({"success": True}), 201
        else:
            return jsonify({"error": "Failed to create invoice"}), 500
    except Exception as e:
        print(f"Create Invoice Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/invoices/<invoice_id>/status', methods=['PUT'])
def update_invoice_status(invoice_id):
    try:
        data = request.json
        status = data.get('status')
        remarks = data.get('remarks')
        updated_by = data.get('updatedBy')
        
        if not status:
            return jsonify({"error": "status is required"}), 400
            
        success = invoice_db_service.update_status(invoice_id, status, remarks, updated_by)
        if success:
            return jsonify({"success": True})
        else:
            return jsonify({"error": "Invoice not found or update failed"}), 404
    except Exception as e:
        print(f"Update Invoice Status Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    # Placeholder: In a real app, we'd fetch from DB. 
    return jsonify([]) 

@app.route('/api/notifications/send', methods=['POST'])
def send_notification():
    try:
        data = request.json
        supplier_id = data.get('supplierId')
        notif_type = data.get('type')
        subject = data.get('subject')
        message = data.get('message')
        priority = data.get('priority', 'medium')
        
        if not all([supplier_id, notif_type, subject, message]):
            return jsonify({"error": "Missing required fields"}), 400
            
        notif_id = invoice_db_service.create_notification(supplier_id, notif_type, subject, message, priority)
        if notif_id:
            return jsonify({"success": True, "id": notif_id})
        else:
            return jsonify({"error": "Failed to create notification"}), 500
    except Exception as e:
        print(f"Send Notification Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/<notif_id>/read', methods=['POST'])
def mark_notification_read(notif_id):
    return jsonify({"success": True})

@app.route('/api/notifications/user/<user_id>', methods=['GET'])
def get_user_notifications(user_id):
    """Get all notifications for a specific user/persona."""
    try:
        notifications = invoice_db_service.get_notifications_for_user(user_id)
        return jsonify({"notifications": notifications, "count": len(notifications)})
    except Exception as e:
        print(f"Get User Notifications Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/create', methods=['POST'])
def create_user_notification():
    """Create notification for a specific user/persona."""
    try:
        data = request.json
        recipient_id = data.get('recipientId')
        notif_type = data.get('type')
        subject = data.get('subject')
        message = data.get('message')
        priority = data.get('priority', 'medium')
        related_invoice = data.get('invoiceId')
        
        if not all([recipient_id, notif_type, subject, message]):
            return jsonify({"error": "Missing required fields"}), 400
            
        notif_id = invoice_db_service.create_notification_for_user(
            recipient_id, notif_type, subject, message, priority, related_invoice
        )
        if notif_id:
            return jsonify({"success": True, "id": notif_id})
        else:
            return jsonify({"error": "Failed to create notification"}), 500
    except Exception as e:
        print(f"Create User Notification Error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# PAYMENT SYSTEM ENDPOINTS (Full Integration)
# ============================================================================

# --- Payment Queue ---
@app.route('/api/payments/queue', methods=['GET'])
def get_payment_queue():
    """Get all approved invoices ready for payment."""
    status = request.args.get('status', 'APPROVED')
    queue = payment_service.get_payment_queue(status)
    return jsonify({"invoices": queue, "count": len(queue)})

# --- Payment Batches ---
@app.route('/api/payments/batches', methods=['GET'])
def get_payment_batches():
    """Get all payment batches."""
    status = request.args.get('status')
    batches = payment_service.get_payment_batches(status)
    return jsonify({"batches": batches, "count": len(batches)})

@app.route('/api/payments/batches', methods=['POST'])
def create_payment_batch():
    """Create a new payment batch from selected invoices."""
    try:
        data = request.json
        result = payment_service.create_payment_batch(
            invoice_ids=data.get('invoiceIds', []),
            payment_method=data.get('paymentMethod', 'NEFT'),
            scheduled_date=data.get('scheduledDate'),
            created_by=data.get('createdBy', 'system'),
            notes=data.get('notes', ''),
            apply_early_discount=data.get('applyEarlyDiscount', False)
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/api/payments/batches/<batch_id>', methods=['GET'])
def get_batch_detail(batch_id):
    """Get detailed payment batch with transactions."""
    batch = payment_service.get_batch_detail(batch_id)
    if batch:
        return jsonify(batch)
    return jsonify({"error": "Batch not found"}), 404

@app.route('/api/payments/batches/<batch_id>/approve', methods=['POST'])
def approve_payment_batch(batch_id):
    """Approve a payment batch for processing."""
    data = request.json or {}
    approver = data.get('approverId', 'finance_manager')
    result = payment_service.approve_batch(batch_id, approver)
    return jsonify(result)

@app.route('/api/payments/batches/<batch_id>/process', methods=['POST'])
def process_payment_batch(batch_id):
    """Send batch to bank for processing."""
    result = payment_service.process_batch(batch_id)
    return jsonify(result)

@app.route('/api/payments/batches/<batch_id>/mark-paid', methods=['POST'])
def mark_batch_paid(batch_id):
    """Confirm batch payment with bank reference."""
    data = request.json or {}
    bank_ref = data.get('bankReference', f"REF-{batch_id[:8]}")
    result = payment_service.mark_batch_paid(batch_id, bank_ref)
    return jsonify(result)

# --- Bank Reconciliation ---
@app.route('/api/payments/bank-import', methods=['POST'])
def import_bank_statement():
    """Import bank statement for reconciliation."""
    try:
        data = request.json
        transactions = data.get('transactions', [])
        statement_id = data.get('statementId')
        result = payment_service.import_bank_statement(transactions, statement_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/api/payments/reconciliation', methods=['GET'])
def get_unmatched_transactions():
    """Get unmatched bank transactions."""
    transactions = payment_service.get_unmatched_transactions()
    return jsonify({"transactions": transactions, "count": len(transactions)})

@app.route('/api/payments/reconciliation/<recon_id>/match', methods=['POST'])
def match_bank_transaction(recon_id):
    """Match a bank transaction to a payment batch."""
    data = request.json or {}
    batch_id = data.get('batchId')
    matched_by = data.get('matchedBy', 'manual')
    if not batch_id:
        return jsonify({"error": "batchId required"}), 400
    result = payment_service.reconcile_transaction(recon_id, batch_id, matched_by)
    return jsonify(result)

@app.route('/api/payments/reconciliation/auto', methods=['POST'])
def auto_reconcile():
    """Auto-match bank transactions to payment batches."""
    result = payment_service.auto_reconcile()
    return jsonify(result)

# --- Early Payment Discounts ---
@app.route('/api/payments/discount/<invoice_id>', methods=['GET'])
def calculate_early_discount(invoice_id):
    """Calculate early payment discount for an invoice."""
    discount = payment_service.calculate_early_discount(invoice_id)
    if discount:
        return jsonify(discount)
    return jsonify({"eligible": False, "reason": "Unable to calculate discount"}), 404

@app.route('/api/payments/discount/terms', methods=['POST'])
def set_vendor_discount_terms():
    """Set early payment terms for a vendor."""
    try:
        data = request.json
        result = payment_service.set_vendor_early_payment_terms(
            vendor_id=data.get('vendorId'),
            vendor_name=data.get('vendorName', ''),
            discount_percent=data.get('discountPercent', 2.0),
            days_early=data.get('daysEarly', 10)
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

# --- Vendor Payment Portal ---
@app.route('/api/vendor/payments/<vendor_id>', methods=['GET'])
def get_vendor_payments(vendor_id):
    """Get all payments for a specific vendor."""
    payments = payment_service.get_vendor_payments(vendor_id)
    return jsonify({"payments": payments, "count": len(payments)})

@app.route('/api/vendor/payments/<vendor_id>/summary', methods=['GET'])
def get_vendor_payment_summary(vendor_id):
    """Get payment summary for vendor dashboard."""
    summary = payment_service.get_vendor_payment_summary(vendor_id)
    return jsonify(summary)

# --- Multi-Currency ---
@app.route('/api/payments/exchange-rate', methods=['GET'])
def get_exchange_rate():
    """Get exchange rate between currencies."""
    from_curr = request.args.get('from', 'USD')
    to_curr = request.args.get('to', 'INR')
    rate = payment_service.get_exchange_rate(from_curr, to_curr)
    if rate:
        return jsonify({"from": from_curr, "to": to_curr, "rate": rate})
    return jsonify({"error": "Rate not found"}), 404

@app.route('/api/payments/exchange-rate', methods=['POST'])
def set_exchange_rate():
    """Set exchange rate for a currency pair."""
    try:
        data = request.json
        result = payment_service.set_exchange_rate(
            from_currency=data.get('from'),
            to_currency=data.get('to'),
            rate=data.get('rate')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# ============================================================================
# OCR INVOICE EXTRACTION ENDPOINTS
# ============================================================================

@app.route('/api/ocr/extract', methods=['POST'])
def ocr_extract_invoice():
    """
    Extract invoice data from uploaded PDF or image file.
    
    Request:
        - file: PDF or image file (multipart/form-data)
        
    Returns:
        - success: bool
        - invoice: Extracted invoice data
        - confidence: OCR confidence score
        - processing_time_ms: Processing time
    """
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





@app.route('/api/ocr/validate', methods=['POST'])
def ocr_validate_invoice():
    """
    Validate extracted invoice data.
    
    Request JSON:
        - invoice: Extracted invoice data to validate
        
    Returns:
        - is_valid: bool
        - errors: List of validation errors
        - warnings: List of warnings
    """
    try:
        data = request.get_json()
        if not data or 'invoice' not in data:
            return jsonify({"error": "No invoice data provided"}), 400
        
        # Lazy import
        from services.invoice_models import FreightInvoice
        
        try:
            # Validate through Pydantic model
            invoice = FreightInvoice(**data['invoice'])
            
            return jsonify({
                "is_valid": len(invoice.validation_errors) == 0,
                "errors": invoice.validation_errors,
                "warnings": [],
                "invoice": invoice.model_dump()
            })
            
        except Exception as e:
            return jsonify({
                "is_valid": False,
                "errors": [str(e)],
                "warnings": []
            })
        
    except Exception as e:
        print(f"OCR Validation Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/ocr/trocr', methods=['POST'])
def ocr_trocr_extract():
    """
    Extract text from document using TrOCR (Microsoft's Transformer-based OCR).
    Best for handwritten documents and forms.
    
    Request:
        - file: PDF or image file (multipart/form-data)
        - model_type: 'handwritten' or 'printed' (optional, default: 'handwritten')
        
    Returns:
        - success: bool
        - text: Extracted text
        - processing_time_ms: Processing time
    """
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded", "success": False}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Empty filename", "success": False}), 400
        
        # Get model type (handwritten or printed)
        model_type = request.form.get('model_type', 'handwritten')
        if model_type not in ['handwritten', 'printed']:
            model_type = 'handwritten'
        
        # Check file extension
        allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({
                "error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}",
                "success": False
            }), 400
        
        # Read file bytes
        file_bytes = file.read()
        print(f"[TrOCR] Processing file: {file.filename}, model: {model_type}")
        
        # Save to uploads folder
        secure_name = secure_filename(file.filename)
        save_path = os.path.join(UPLOAD_FOLDER, secure_name)
        file.seek(0)
        file.save(save_path)
        
        # Import and run TrOCR
        try:
            from services.trocr_engine import trocr_extract_bytes
        except ImportError as e:
            print(f"[TrOCR] Import Error: {e}")
            return jsonify({
                "error": f"TrOCR not available: {e}. Install: pip install transformers torch pillow pdf2image",
                "success": False
            }), 500
        
        # Extract text
        result = trocr_extract_bytes(file_bytes, file.filename, model_type)
        
        return jsonify({
            "success": result.get('success', False),
            "text": result.get('text', ''),
            "engine": "TrOCR",
            "model_type": model_type,
            "line_count": result.get('line_count', 0),
            "page_count": result.get('page_count', 1),
            "processing_time_ms": result.get('processing_time_ms', 0),
            "confidence": result.get('confidence', 0.85),
            "filename": secure_name
        })
        
    except Exception as e:
        print(f"[TrOCR] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500


@app.route('/api/ocr/status', methods=['GET'])
def ocr_status():
    """
    Check OCR engine status and availability.
    
    Returns:
        - available: bool
        - engine: OCR engine name
        - dependencies: Status of dependencies
    """
    try:
        status = {
            "available": False,
            "engine": "PaddleOCR PP-Structure",
            "trocr_available": False,
            "dependencies": {}
        }
        
        # Check PaddleOCR
        try:
            from paddleocr import PaddleOCR
            status["dependencies"]["paddleocr"] = "installed"
        except ImportError:
            status["dependencies"]["paddleocr"] = "not installed"
        
        # Check TrOCR (transformers + torch)
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            import torch
            status["dependencies"]["transformers"] = "installed"
            status["dependencies"]["torch"] = f"installed (CUDA: {torch.cuda.is_available()})"
            status["trocr_available"] = True
        except ImportError as e:
            status["dependencies"]["transformers"] = f"not installed ({e})"
            status["dependencies"]["torch"] = "not installed"
        
        # Check pdf2image
        try:
            from pdf2image import convert_from_path
            status["dependencies"]["pdf2image"] = "installed"
        except ImportError:
            status["dependencies"]["pdf2image"] = "not installed"
        
        # Check Pillow
        try:
            from PIL import Image
            status["dependencies"]["pillow"] = "installed"
        except ImportError:
            status["dependencies"]["pillow"] = "not installed"
        
        # Check pydantic
        try:
            from pydantic import BaseModel
            status["dependencies"]["pydantic"] = "installed"
        except ImportError:
            status["dependencies"]["pydantic"] = "not installed"
        
        # All required dependencies installed?
        required = ["paddleocr", "pdf2image", "pillow", "pydantic"]
        status["available"] = all(
            status["dependencies"].get(dep) == "installed" 
            for dep in required
        )
        
        return jsonify(status)
        
    except Exception as e:
        print(f"OCR Status Error: {e}")
        return jsonify({"error": str(e), "available": False}), 500


@app.route('/api/ocr/demo', methods=['GET'])
def ocr_demo():
    """
    Get demo extraction result for UI testing.
    """
    try:
        from datetime import date, datetime
        
        demo_result = {
            "success": True,
            "confidence": 0.94,
            "processing_time_ms": 2450,
            "invoice": {
                "invoice_number": "INV-2024-001234",
                "invoice_date": "2024-12-15",
                "vendor": {
                    "name": "TCI Express Ltd.",
                    "gstin": "27AABCT1234F1Z5",
                    "pan": "AABCT1234F"
                },
                "shipment": {
                    "lr_number": "LR-MUM-DEL-78652",
                    "vehicle_number": "MH12AB1234",
                    "origin": "Mumbai",
                    "destination": "Delhi",
                    "weight_kg": 450.5
                },
                "line_items": [
                    {"description": "Freight Charges", "quantity": 1, "rate": 12500, "amount": 12500},
                    {"description": "Handling Charges", "quantity": 1, "rate": 500, "amount": 500}
                ],
                "subtotal": 13000,
                "tax_details": {
                    "cgst_rate": 9,
                    "cgst_amount": 1170,
                    "sgst_rate": 9,
                    "sgst_amount": 1170,
                    "total_tax": 2340
                },
                "total_amount": 15340,
                "confidence_score": 0.94
            }
        }
        
        return jsonify(demo_result)
        
    except Exception as e:
        print(f"OCR Demo Error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# ENTERPRISE SERVICES API ENDPOINTS
# ============================================================================

# --- ERP INTEGRATION API ---
@app.route('/api/erp/status', methods=['GET'])
def api_erp_status():
    """Get status of all ERP connections"""
    return jsonify(get_erp_status())

@app.route('/api/erp/connect', methods=['POST'])
def api_erp_connect():
    """Add and connect to an ERP system"""
    data = request.json
    name = data.get('name', 'default')
    erp_type = data.get('erp_type', 'SAP')
    config = data.get('config', {})
    
    # Add connector
    result = add_erp_connector(name, erp_type, config)
    if not result.get('success'):
        return jsonify(result), 400
    
    # Connect
    connect_result = connect_erp(name)
    return jsonify({**result, **connect_result})

@app.route('/api/erp/post-invoice', methods=['POST'])
def api_erp_post_invoice():
    """Post an invoice to the connected ERP"""
    invoice = request.json
    return jsonify(post_to_erp(invoice))

@app.route('/api/erp/master-data/<data_type>', methods=['GET'])
def api_erp_master_data(data_type):
    """Get master data from ERP (cost_centers, gl_accounts, vendors)"""
    return jsonify(get_master_data(data_type))


# --- TAX COMPLIANCE API ---
@app.route('/api/tax/calculate', methods=['POST'])
def api_tax_calculate():
    """Calculate all taxes for an invoice"""
    invoice = request.json
    return jsonify(calculate_tax(invoice))

@app.route('/api/tax/gst', methods=['POST'])
def api_tax_gst():
    """Calculate GST for a transaction"""
    data = request.json
    result = calculate_gst(
        base_amount=data.get('base_amount', 0),
        service_type=data.get('service_type', 'DEFAULT'),
        supplier_state=data.get('supplier_state', '27'),
        recipient_state=data.get('recipient_state', '27')
    )
    return jsonify(result)

@app.route('/api/tax/tds', methods=['POST'])
def api_tax_tds():
    """Calculate TDS withholding tax"""
    data = request.json
    result = calculate_tds(
        base_amount=data.get('base_amount', 0),
        section=data.get('section', '194C'),
        is_company=data.get('is_company', False)
    )
    return jsonify(result)

@app.route('/api/tax/validate-gstin', methods=['GET'])
def api_validate_gstin():
    """Validate a GSTIN number"""
    gstin = request.args.get('gstin', '')
    return jsonify(validate_gstin(gstin))

@app.route('/api/tax/einvoice', methods=['POST'])
def api_generate_einvoice():
    """Generate e-invoice IRN"""
    invoice_data = request.json
    return jsonify(generate_einvoice(invoice_data))

@app.route('/api/tax/hsn-codes', methods=['GET'])
def api_hsn_codes():
    """Get all HSN codes for freight services"""
    return jsonify(get_hsn_codes())


# --- EMISSIONS/ESG API ---
@app.route('/api/emissions/calculate', methods=['POST'])
def api_emissions_calculate():
    """Calculate CO2e emissions for a shipment"""
    data = request.json
    result = calculate_emissions(
        weight_kg=data.get('weight_kg', 0),
        distance_km=data.get('distance_km', 0),
        mode=data.get('mode', 'ROAD'),
        vehicle_type=data.get('vehicle_type')
    )
    return jsonify(result)

@app.route('/api/emissions/route', methods=['POST'])
def api_emissions_route():
    """Calculate emissions for a multi-leg route"""
    data = request.json
    legs = data.get('legs', [])
    return jsonify(calculate_route(legs))

@app.route('/api/emissions/compare', methods=['POST'])
def api_emissions_compare():
    """Compare emissions across transport modes"""
    data = request.json
    result = compare_transport_modes(
        weight_kg=data.get('weight_kg', 0),
        distance_km=data.get('distance_km', 0)
    )
    return jsonify(result)

@app.route('/api/emissions/carrier-score', methods=['POST'])
def api_emissions_carrier_score():
    """Get carrier emissions scorecard"""
    data = request.json
    result = get_carrier_emissions_score(
        carrier_id=data.get('carrier_id'),
        carrier_name=data.get('carrier_name'),
        shipments=data.get('shipments', [])
    )
    return jsonify(result)

@app.route('/api/emissions/esg-report', methods=['POST'])
def api_emissions_esg_report():
    """Generate Scope 3 ESG report"""
    data = request.json
    result = generate_esg_report(
        company_name=data.get('company_name', 'Company'),
        period=data.get('period', '2024'),
        shipments=data.get('shipments', [])
    )
    return jsonify(result)

@app.route('/api/emissions/factors', methods=['GET'])
def api_emission_factors():
    """Get all emission factors by mode"""
    return jsonify(get_emission_factors())


# --- CARRIER COMPLIANCE API ---
@app.route('/api/compliance/summary', methods=['GET'])
def api_compliance_summary():
    """Get compliance summary across all carriers"""
    return jsonify(get_compliance_summary())

@app.route('/api/compliance/carriers', methods=['GET'])
def api_compliance_carriers():
    """Get all carrier compliance profiles"""
    return jsonify(get_all_carriers_compliance())

@app.route('/api/compliance/carrier/<carrier_id>', methods=['GET'])
def api_compliance_carrier(carrier_id):
    """Get compliance profile for a specific carrier"""
    result = get_carrier_compliance(carrier_id)
    if result:
        return jsonify(result)
    return jsonify({'error': 'Carrier not found'}), 404

@app.route('/api/compliance/expiring-documents', methods=['GET'])
def api_expiring_documents():
    """Get documents expiring within specified days"""
    days = request.args.get('days', 30, type=int)
    return jsonify(get_expiring_documents(days))

@app.route('/api/compliance/verify-document', methods=['POST'])
def api_verify_document():
    """Verify a carrier document"""
    data = request.json
    result = verify_carrier_document(
        carrier_id=data.get('carrier_id'),
        doc_type=data.get('doc_type'),
        verified_by=data.get('verified_by', 'System')
    )
    return jsonify(result)

@app.route('/api/compliance/update-safety-rating', methods=['POST'])
def api_update_safety_rating():
    """Update carrier safety rating"""
    data = request.json
    result = update_carrier_safety_rating(
        carrier_id=data.get('carrier_id'),
        rating=data.get('rating')
    )
    return jsonify(result)

@app.route('/api/compliance/document-types', methods=['GET'])
def api_document_types():
    """Get all document types"""
    return jsonify(get_document_types())


# --- SUPPLY CHAIN FINANCE API ---
@app.route('/api/scf/summary', methods=['GET'])
def api_scf_summary():
    """Get supply chain finance program summary"""
    return jsonify(get_scf_program_summary())

@app.route('/api/scf/calculate-discount', methods=['POST'])
def api_scf_calculate_discount():
    """Calculate dynamic discount for early payment"""
    data = request.json
    from datetime import datetime
    
    due_date = datetime.fromisoformat(data.get('due_date'))
    payment_date = None
    if data.get('payment_date'):
        payment_date = datetime.fromisoformat(data.get('payment_date'))
    
    result = calculate_discount(
        invoice_amount=data.get('invoice_amount', 0),
        due_date=due_date,
        payment_date=payment_date
    )
    return jsonify(result)

@app.route('/api/scf/factoring-quote', methods=['POST'])
def api_scf_factoring_quote():
    """Get invoice factoring quote"""
    data = request.json
    from datetime import datetime
    
    due_date = datetime.fromisoformat(data.get('due_date'))
    result = get_factoring_quote(
        invoice_amount=data.get('invoice_amount', 0),
        due_date=due_date,
        tier=data.get('tier', 'STANDARD')
    )
    return jsonify(result)

@app.route('/api/scf/optimize-payments', methods=['POST'])
def api_scf_optimize_payments():
    """Optimize payment schedule for maximum savings"""
    data = request.json
    result = optimize_payment_schedule(
        invoices=data.get('invoices', []),
        available_cash=data.get('available_cash', 0)
    )
    return jsonify(result)

@app.route('/api/scf/enrolled-carriers', methods=['GET'])
def api_scf_enrolled_carriers():
    """Get carriers enrolled in early payment program"""
    return jsonify(get_enrolled_carriers())

@app.route('/api/scf/enroll-carrier', methods=['POST'])
def api_scf_enroll_carrier():
    """Enroll a carrier in early payment program"""
    data = request.json
    result = enroll_carrier_scf(
        carrier_id=data.get('carrier_id'),
        carrier_name=data.get('carrier_name'),
        tier=data.get('tier', 'STANDARD')
    )
    return jsonify(result)

@app.route('/api/scf/request-early-payment', methods=['POST'])
def api_scf_request_early_payment():
    """Request early payment for an invoice"""
    data = request.json
    from datetime import datetime
    
    due_date = datetime.fromisoformat(data.get('due_date'))
    result = request_early_payment(
        carrier_id=data.get('carrier_id'),
        invoice_id=data.get('invoice_id'),
        amount=data.get('amount', 0),
        due_date=due_date
    )
    return jsonify(result)

@app.route('/api/scf/pending-requests', methods=['GET'])
def api_scf_pending_requests():
    """Get pending early payment requests"""
    return jsonify(get_pending_payment_requests())


if __name__ == '__main__':
    print("Starting Flask Server on Port 5000...")
    app.run(debug=True, port=5000)

@app.route('/api/invoices/upload', methods=['POST'])
def upload_invoice():
    """
    Handle invoice file upload and data submission.
    Saves file to disk and inserts record into MySQL.
    """
    try:
        # 1. Handle File Upload
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Create uploads directory if not exists
        upload_dir = os.path.join(os.getcwd(), 'uploads', 'scenario_1_uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = secure_filename(file.filename)
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        file.save(file_path)
        
        # 2. Handle Data Submission
        # Data comes as a JSON string in the 'data' form-field
        import json
        data_str = request.form.get('data')
        if not data_str:
            return jsonify({'error': 'No invoice data provided'}), 400
            
        invoice_data = json.loads(data_str)
        
        # Add file info to the data packet
        invoice_data['filePath'] = file_path
        invoice_data['originalFileName'] = filename
        
        # 3. Save to Database
        success = invoice_db_service.create_invoice(invoice_data)
        
        if success:
            return jsonify({
                'message': 'Invoice uploaded and saved successfully',
                'file_path': file_path,
                'invoice_number': invoice_data.get('invoiceNumber')
            }), 201
        else:
            return jsonify({'error': 'Failed to save invoice to database'}), 500

    except Exception as e:
        print(f"Upload Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/pending', methods=['GET'])
def get_pending_invoices():
    """
    Get all pending invoices for approver queue.
    Query param: approver_role (optional) - filter by role
    """
    try:
        approver_role = request.args.get('approver_role', None)
        invoices = invoice_db_service.get_pending_invoices_for_approver(approver_role)
        
        # Convert date objects to ISO strings for JSON serialization
        for inv in invoices:
            if inv.get('invoice_date'):
                inv['invoice_date'] = str(inv['invoice_date'])
            if inv.get('created_at'):
                inv['created_at'] = str(inv['created_at'])
        
        return jsonify({
            'success': True,
            'invoices': invoices,
            'count': len(invoices)
        }), 200
    except Exception as e:
        print(f"Error fetching pending invoices: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/<invoice_id>/approve', methods=['POST'])
def approve_invoice(invoice_id):
    """Approve an invoice and update its status in MySQL."""
    try:
        data = request.get_json() or {}
        approver_name = data.get('approver_name', 'Unknown')
        remarks = data.get('remarks', f'Approved by {approver_name}')
        
        success = invoice_db_service.update_status(
            invoice_id=invoice_id,
            status='APPROVED',
            remarks=remarks,
            updated_by=approver_name
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Invoice {invoice_id} approved successfully',
                'new_status': 'APPROVED'
            }), 200
        else:
            return jsonify({'error': 'Failed to update invoice status'}), 500
    except Exception as e:
        print(f"Approval Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/<invoice_id>/reject', methods=['POST'])
def reject_invoice(invoice_id):
    """Reject an invoice and update its status in MySQL."""
    try:
        data = request.get_json() or {}
        approver_name = data.get('approver_name', 'Unknown')
        reason = data.get('reason', 'No reason provided')
        remarks = f'Rejected by {approver_name}: {reason}'
        
        success = invoice_db_service.update_status(
            invoice_id=invoice_id,
            status='REJECTED',
            remarks=remarks,
            updated_by=approver_name
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Invoice {invoice_id} rejected',
                'new_status': 'REJECTED'
            }), 200
        else:
            return jsonify({'error': 'Failed to update invoice status'}), 500
    except Exception as e:
        print(f"Rejection Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/all', methods=['GET'])
def get_all_invoices():
    """Get all invoices from MySQL for the main workbench."""
    try:
        invoices = invoice_db_service.get_all_invoices()
        return jsonify({
            'success': True,
            'invoices': invoices,
            'count': len(invoices),
            'source': 'mysql'
        }), 200
    except Exception as e:
        print(f"Error fetching all invoices: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/<invoice_id>/documents', methods=['POST'])
def upload_invoice_document(invoice_id):
    """Upload a document and link it to an invoice."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        doc_type = request.form.get('doc_type', 'SUPPORTING')
        uploaded_by = request.form.get('uploaded_by', 'Unknown')
        
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Save file to disk
        upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'invoice_docs', invoice_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = f"{doc_type}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Save to database
        doc_id = invoice_db_service.save_document(
            invoice_id=invoice_id,
            doc_type=doc_type,
            file_name=file.filename,
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            uploaded_by=uploaded_by
        )
        
        if doc_id:
            return jsonify({
                'success': True,
                'message': f'Document {doc_type} uploaded',
                'doc_id': doc_id,
                'file_path': file_path
            }), 201
        else:
            return jsonify({'error': 'Failed to save document record'}), 500
    except Exception as e:
        print(f"Document Upload Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/<invoice_id>/documents', methods=['GET'])
def get_invoice_documents(invoice_id):
    """Get all documents linked to an invoice."""
    try:
        documents = invoice_db_service.get_documents_for_invoice(invoice_id)
        return jsonify({
            'success': True,
            'invoice_id': invoice_id,
            'documents': documents,
            'count': len(documents)
        }), 200
    except Exception as e:
        print(f"Error fetching documents: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ATLAS MASTER DATA API ENDPOINTS
# ============================================================================

# ----------------------------
# CARRIER MASTER
# ----------------------------

@app.route('/api/master/carriers', methods=['POST'])
def create_carrier():
    """Create or update carrier in master"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('carrier_code') or not data.get('carrier_name'):
            return jsonify({'error': 'carrier_code and carrier_name are required'}), 400
        
        carrier_id = atlas_master.add_carrier(data)
        
        if carrier_id:
            return jsonify({
                'success': True,
                'carrier_id': carrier_id,
                'message': 'Carrier added successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to add carrier'}), 500
            
    except Exception as e:
        print(f"[API] Error creating carrier: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/master/carriers', methods=['GET'])
def get_carriers():
    """Get all carriers"""
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        carriers = atlas_master.get_all_carriers(active_only=active_only)
        
        return jsonify({
            'success': True,
            'carriers': carriers,
            'count': len(carriers)
        }), 200
        
    except Exception as e:
        print(f"[API] Error fetching carriers: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/master/carriers/<carrier_code>', methods=['GET'])
def get_carrier(carrier_code):
    """Get carrier by code"""
    try:
        carrier = atlas_master.get_carrier_by_code(carrier_code)
        
        if carrier:
            return jsonify({
                'success': True,
                'carrier': carrier
            }), 200
        else:
            return jsonify({'error': 'Carrier not found'}), 404
            
    except Exception as e:
        print(f"[API] Error fetching carrier: {e}")
        return jsonify({'error': str(e)}), 500


# ----------------------------
# ROUTE MASTER
# ----------------------------

@app.route('/api/master/routes', methods=['POST'])
def create_route():
    """Create or update route in master"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['route_code', 'origin', 'destination', 'distance_km']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        route_id = atlas_master.add_route(data)
        
        if route_id:
            return jsonify({
                'success': True,
                'route_id': route_id,
                'message': 'Route added successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to add route'}), 500
            
    except Exception as e:
        print(f"[API] Error creating route: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/master/routes/lookup', methods=['GET'])
def lookup_route():
    """Find route by origin and destination"""
    try:
        origin = request.args.get('origin')
        destination = request.args.get('destination')
        
        if not origin or not destination:
            return jsonify({'error': 'origin and destination parameters required'}), 400
        
        route = atlas_master.get_route_by_origin_dest(origin, destination)
        
        if route:
            return jsonify({
                'success': True,
                'route': route
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No route found for this origin-destination pair'
            }), 404
            
    except Exception as e:
        print(f"[API] Error looking up route: {e}")
        return jsonify({'error': str(e)}), 500


# ----------------------------
# FUEL MASTER
# ----------------------------

@app.route('/api/master/fuel-prices', methods=['POST'])
def create_fuel_price():
    """Add diesel price entry"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('effective_date') or not data.get('diesel_price_per_liter'):
            return jsonify({'error': 'effective_date and diesel_price_per_liter are required'}), 400
        
        fuel_id = atlas_master.add_fuel_price(data)
        
        if fuel_id:
            return jsonify({
                'success': True,
                'fuel_id': fuel_id,
                'message': 'Fuel price added successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to add fuel price'}), 500
            
    except Exception as e:
        print(f"[API] Error adding fuel price: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/master/fuel-prices', methods=['GET'])
def get_fuel_price():
    """Get diesel price for a specific date"""
    try:
        date_str = request.args.get('date')
        city = request.args.get('city', 'NATIONAL')
        
        if not date_str:
            return jsonify({'error': 'date parameter required (YYYY-MM-DD)'}), 400
        
        # Parse date
        from datetime import datetime
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        price = atlas_master.get_fuel_price_on_date(target_date, city)
        
        if price:
            return jsonify({
                'success': True,
                'date': date_str,
                'city': city,
                'diesel_price_per_liter': price
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No fuel price found for this date'
            }), 404
            
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        print(f"[API] Error fetching fuel price: {e}")
        return jsonify({'error': str(e)}), 500


# ----------------------------
# RATE CARD MASTER
# ----------------------------

@app.route('/api/master/rate-cards', methods=['POST'])
def create_rate_card():
    """Add contract rate card"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['carrier_id', 'route_id', 'vehicle_type', 'base_rate', 'valid_from']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        rate_id = atlas_master.add_rate_card(data)
        
        if rate_id:
            return jsonify({
                'success': True,
                'rate_id': rate_id,
                'message': 'Rate card added successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to add rate card'}), 500
            
    except Exception as e:
        print(f"[API] Error adding rate card: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/master/rate-cards/lookup', methods=['GET'])
def lookup_rate_card():
    """Find applicable rate card"""
    try:
        carrier_id = request.args.get('carrier_id')
        route_id = request.args.get('route_id')
        vehicle_type = request.args.get('vehicle_type')
        date_str = request.args.get('date')
        
        if not all([carrier_id, route_id, vehicle_type, date_str]):
            return jsonify({'error': 'carrier_id, route_id, vehicle_type, and date are required'}), 400
        
        # Parse date
        from datetime import datetime
        invoice_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        rate_card = atlas_master.get_rate_card(carrier_id, route_id, vehicle_type, invoice_date)
        
        if rate_card:
            return jsonify({
                'success': True,
                'rate_card': rate_card
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No rate card found for these parameters'
            }), 404
            
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        print(f"[API] Error looking up rate card: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# BULK ANNEXURE UPLOAD API
# ============================================================================

@app.route('/api/invoices/bulk-upload', methods=['POST'])
def bulk_upload_invoice():
    """
    Upload consolidated invoice with Excel annexure
    
    Expects:
        - pdf_file: Cover invoice PDF
        - excel_file: Annexure with 50+ LRs
        - vendor_id: Vendor ID
        - pdf_total: Total amount from PDF
    
    Returns:
        - invoice_id
        - reconciliation result
        - line items summary
    """
    try:
        # Validate files
        if 'pdf_file' not in request.files or 'excel_file' not in request.files:
            return jsonify({'error': 'Both pdf_file and excel_file are required'}), 400
        
        pdf_file = request.files['pdf_file']
        excel_file = request.files['excel_file']
        vendor_id = request.form.get('vendor_id')
        pdf_total = float(request.form.get('pdf_total', 0))
        
        if pdf_total <= 0:
            return jsonify({'error': 'pdf_total must be provided and > 0'}), 400
        
        # Save files temporarily
        pdf_filename = secure_filename(pdf_file.filename)
        excel_filename = secure_filename(excel_file.filename)
        
        upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'bulk_invoices')
        os.makedirs(upload_dir, exist_ok=True)
        
        pdf_path = os.path.join(upload_dir, pdf_filename)
        excel_path = os.path.join(upload_dir, excel_filename)
        
        pdf_file.save(pdf_path)
        excel_file.save(excel_path)
        
        print(f"[Bulk Upload] Processing: PDF={pdf_filename}, Excel={excel_filename}")
        
        # Step 1: Parse Excel
        df = atlas_bulk.parse_excel_file(excel_path)
        
        if df is None or len(df) == 0:
            return jsonify({'error': 'Failed to parse Excel file or file is empty'}), 400
        
        # Step 2: Auto-detect column mapping
        column_mapping = atlas_bulk.detect_column_mapping(df, vendor_id)
        
        if not column_mapping:
            return jsonify({
                'error': 'Could not auto-detect column mapping',
                'hint': 'Please provide manual mapping'
            }), 400
        
        # Step 3: Reconcile totals
        reconciliation = atlas_bulk.reconcile_totals(df, column_mapping, pdf_total, tolerance=10.0)
        
        if not reconciliation['valid']:
            return jsonify({
                'success': False,
                'error': 'Reconciliation failed',
                'reconciliation': reconciliation,
                'message': f"Excel total (₹{reconciliation['excel_total']}) does not match PDF total (₹{reconciliation['pdf_total']}). Difference: ₹{reconciliation['difference']}"
            }), 400
        
        # Step 4: Create parent invoice in database
        invoice_id = str(uuid.uuid4())
        
        # Save to supplier_invoices table
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO supplier_invoices 
            (id, invoice_number, supplier_id, amount, status, 
             invoice_date, is_consolidated, line_item_count)
            VALUES (%s, %s, %s, %s, 'PENDING', CURDATE(), TRUE, %s)
        """
        cursor.execute(query, (
            invoice_id,
            f"BULK_{invoice_id[:8]}",
            vendor_id or 'UNKNOWN',
            pdf_total,
            len(df)
        ))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"[Bulk Upload] Created invoice: {invoice_id}")
        
        # Step 5: Process line items
        line_items_summary = atlas_bulk.process_line_items(
            invoice_id, 
            df, 
            column_mapping,
            carrier_id=vendor_id
        )
        
        # Step 6: Save vendor template (if new vendor)
        if vendor_id and reconciliation['valid']:
            atlas_bulk.save_vendor_template(
                vendor_id,
                vendor_id,  # vendor_name (can be enhanced)
                f"{vendor_id}_standard",
                column_mapping
            )
        
        # Return success response
        return jsonify({
            'success': True,
            'invoice_id': invoice_id,
            'pdf_filename': pdf_filename,
            'excel_filename': excel_filename,
            'column_mapping': column_mapping,
            'reconciliation': reconciliation,
            'line_items_summary': line_items_summary,
            'message': f"Successfully uploaded {line_items_summary['total_rows']} line items"
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Bulk Upload] Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# LINE ITEMS API (Query uploaded bulk data)
# ============================================================================

@app.route('/api/invoices/<invoice_id>/line-items', methods=['GET'])
def get_invoice_line_items(invoice_id):
    """Get all line items for a bulk invoice"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT * FROM invoice_line_items 
            WHERE invoice_id = %s 
            ORDER BY line_number
        """
        cursor.execute(query, (invoice_id,))
        line_items = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'invoice_id': invoice_id,
            'line_items': line_items,
            'count': len(line_items)
        }), 200
        
    except Exception as e:
        print(f"[API] Error fetching line items: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/invoices/<invoice_id>/line-items/flagged', methods=['GET'])
def get_flagged_line_items(invoice_id):
    """Get all flagged/duplicate line items for review"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT * FROM invoice_line_items 
            WHERE invoice_id = %s 
            AND (is_duplicate = TRUE OR is_overcharged = TRUE OR audit_status = 'FLAGGED')
            ORDER BY line_number
        """
        cursor.execute(query, (invoice_id,))
        flagged_items = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'invoice_id': invoice_id,
            'flagged_items': flagged_items,
            'count': len(flagged_items)
        }), 200
        
    except Exception as e:
        print(f"[API] Error fetching flagged items: {e}")
        return jsonify({'error': str(e)}), 500


print("[Atlas API] Advanced endpoints registered successfully")

if __name__ == '__main__':
    print("Starting Atlas Backend on Port 5000...")
    app.run(debug=True, port=5000, host='0.0.0.0')
