"""
Atlas Advanced API Endpoints
=============================
Configured as a Flask Blueprint
"""
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import uuid
import datetime
import importlib
from services.db_service import get_db_connection

atlas_bp = Blueprint('atlas_api', __name__)

# Add these imports at the top of app.py
from services.atlas_master_service import get_master_service
from services.atlas_bulk_service import get_bulk_service
from services.advanced_ocr_engine import AdvancedOCREngine

# Initialize services
atlas_master = get_master_service()
atlas_bulk = get_bulk_service()
advanced_ocr = AdvancedOCREngine()

# ============================================================================
# ATLAS MASTER DATA API ENDPOINTS
# ============================================================================

# ----------------------------
# CARRIER MASTER
# ----------------------------

@atlas_bp.route('/api/master/carriers', methods=['POST'])
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


@atlas_bp.route('/api/master/carriers', methods=['GET'])
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


@atlas_bp.route('/api/master/carriers/<carrier_code>', methods=['GET'])
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

@atlas_bp.route('/api/master/routes', methods=['POST'])
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


@atlas_bp.route('/api/master/routes/lookup', methods=['GET'])
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

@atlas_bp.route('/api/master/fuel-prices', methods=['POST'])
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


@atlas_bp.route('/api/master/fuel-prices', methods=['GET'])
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

@atlas_bp.route('/api/master/rate-cards', methods=['POST'])
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


@atlas_bp.route('/api/master/rate-cards/lookup', methods=['GET'])
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

@atlas_bp.route('/api/invoices/bulk-upload', methods=['POST'])
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
        pdf_total_str = request.form.get('pdf_total', '0')
        
        try:
            pdf_total = float(pdf_total_str)
        except ValueError:
            pdf_total = 0.0
        
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
        
        # OCR Extraction if total is missing
        ocr_data = {}
        ocr_confidence = 0.0
        
        if pdf_total <= 0:
            print("[Bulk Upload] pdf_total not provided. Running Advanced OCR...")
            try:
                ocr_result = advanced_ocr.extract_with_schema(
                    file_path=pdf_path,
                    document_type='INVOICE',
                    ocr_engine='GEMINI'
                )
                
                ocr_data = ocr_result.get('extracted_data', {})
                ocr_confidence = ocr_result.get('overall_confidence', 0.0)
                
                # Try to get total from amounts object or top level
                amounts = ocr_data.get('amounts', {})
                if isinstance(amounts, dict):
                    extracted_total = amounts.get('total_amount')
                else:
                    extracted_total = ocr_data.get('total_amount')
                
                if extracted_total:
                    pdf_total = float(extracted_total)
                    print(f"[Bulk Upload] OCR Extracted Total: {pdf_total} (Conf: {ocr_confidence}%)")
                else:
                    print("[Bulk Upload] OCR failed to extract total amount")
                    # Fallback to manual entry requirement if OCR fails completely? 
                    # For now proceed with 0 and fail reconciliation
            except Exception as e:
                print(f"[Bulk Upload] OCR Error: {e}")
                import traceback
                traceback.print_exc()

        if pdf_total <= 0:
             return jsonify({
                'error': 'Could not extract PDF Total automatically. Please enter amount manually.', 
                'ocr_error': True
            }), 400
        
        try:
            # Step 1: Parse Excel
            print("[Bulk Upload] Step 1: Parsing Excel...")
            df = atlas_bulk.parse_excel_file(excel_path)
            
            if df is None or len(df) == 0:
                print("[Bulk Upload] Error: Excel empty or failed to parse")
                return jsonify({'error': 'Failed to parse Excel file or file is empty'}), 400
        except Exception as step1_err:
            print(f"[Bulk Upload] STEP 1 FAILED: {step1_err}")
            raise step1_err

        try:
            # Step 2: Auto-detect column mapping
            print("[Bulk Upload] Step 2: Detecting columns...")
            column_mapping = atlas_bulk.detect_column_mapping(df, vendor_id)
            
            if not column_mapping:
                print("[Bulk Upload] Error: Column mapping failed")
                return jsonify({
                    'error': 'Could not auto-detect column mapping',
                    'hint': 'Please provide manual mapping'
                }), 400
        except Exception as step2_err:
            print(f"[Bulk Upload] STEP 2 FAILED: {step2_err}")
            raise step2_err
        
        try:
            # Step 3: Reconcile totals
            print(f"[Bulk Upload] Step 3: Reconciling pdf_total={pdf_total}...")
            reconciliation = atlas_bulk.reconcile_totals(df, column_mapping, pdf_total, tolerance=10.0)
            
            if not reconciliation['valid']:
                print(f"[Bulk Upload] Reconciliation failed: {reconciliation}")
                return jsonify({
                    'success': False,
                    'error': 'Reconciliation failed',
                    'reconciliation': reconciliation,
                    'ocr_data': ocr_data,  # Pass raw OCR data
                    'message': f"Excel total (₹{reconciliation['excel_total']}) does not match PDF total (₹{reconciliation['pdf_total']}). Difference: ₹{reconciliation['difference']}"
                }), 400
        except Exception as step3_err:
            print(f"[Bulk Upload] STEP 3 FAILED: {step3_err}")
            raise step3_err
        
        try:
            # Step 4: Create parent invoice in database
            print(f"[Bulk Upload] Step 4: Creating invoice record...")
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
            print(f"[Bulk Upload] Executing Insert: {invoice_id}, {vendor_id}, {pdf_total}, {len(df)}")
            cursor.execute(query, (
                invoice_id,
                f"BULK_{invoice_id[:8]}",
                vendor_id or 'UNKNOWN',
                float(pdf_total), # Explicit float
                len(df)
            ))
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"[Bulk Upload] Created invoice: {invoice_id}")
        except Exception as step4_err:
            print(f"[Bulk Upload] STEP 4 FAILED: {step4_err}")
            import traceback
            traceback.print_exc()
            raise step4_err
        
        try:
            # Step 5: Process line items
            print(f"[Bulk Upload] Step 5: Processing line items...")
            line_items_summary = atlas_bulk.process_line_items(
                invoice_id, 
                df, 
                column_mapping,
                carrier_id=vendor_id
            )
        except Exception as step5_err:
            print(f"[Bulk Upload] STEP 5 FAILED: {step5_err}")
            import traceback
            traceback.print_exc()
            raise step5_err
        
        try:
            # Step 6: Save vendor template (if new vendor)
            if vendor_id and reconciliation['valid']:
                print(f"[Bulk Upload] Step 6: Saving template...")
                atlas_bulk.save_vendor_template(
                    vendor_id,
                    vendor_id,  # vendor_name (can be enhanced)
                    f"{vendor_id}_standard",
                    column_mapping
                )
        except Exception as step6_err:
            print(f"[Bulk Upload] STEP 6 FAILED: {step6_err}")
            # Do not raise here, allow completion
        
        # Return success response
        return jsonify({
            'success': True,
            'invoice_id': invoice_id,
            'pdf_filename': pdf_filename,
            'excel_filename': excel_filename,
            'ocr_data': ocr_data, # Pass raw OCR data
            'column_mapping': column_mapping,
            'reconciliation': reconciliation,
            'line_items_summary': line_items_summary,
            'message': f"Successfully uploaded {line_items_summary['total_rows']} line items"
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Bulk Upload] GLOBAL ERROR: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# LINE ITEMS API (Query uploaded bulk data)
# ============================================================================

@atlas_bp.route('/api/invoices/<invoice_id>/line-items', methods=['GET'])
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


@atlas_bp.route('/api/invoices/<invoice_id>/line-items/flagged', methods=['GET'])
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


# ============================================================================
# OCR LEARNING & VALIDATION API
# ============================================================================

@atlas_bp.route('/api/ocr/learn', methods=['POST'])
def learn_ocr_template():
    """
    Trigger one-shot learning from validated/corrected data
    """
    try:
        data = request.get_json()
        document_id = data.get('document_id')
        vendor_id = data.get('vendor_id')
        vendor_name = data.get('vendor_name')
        validated_data = data.get('validated_data')  # Dict of {field: value}
        
        if not all([document_id, vendor_id, validated_data]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Get extraction result to retrieve raw text
        extraction = advanced_ocr.get_extraction_result(document_id)
        if not extraction:
            return jsonify({'error': 'Document not found'}), 404
            
        raw_text = extraction.get('raw_text', '')
        if not raw_text:
            return jsonify({'error': 'No raw text available for this document'}), 400
            
        # Run learning
        learned_patterns = advanced_ocr.learn_from_validated_data(
            document_type=extraction.get('document_type', 'INVOICE'),
            vendor_id=vendor_id,
            vendor_name=vendor_name or "Unknown Vendor",
            raw_text=raw_text,
            validated_data=validated_data
        )
        
        return jsonify({
            'success': True,
            'message': f"Learned {len(learned_patterns)} new patterns",
            'patterns': learned_patterns
        }), 200
        
    except Exception as e:
        print(f"[API] Learning failed: {e}")
        return jsonify({'error': str(e)}), 500

@atlas_bp.route('/api/ocr/validate', methods=['POST'])
def validate_ocr_result():
    """
    Update validation status and save corrections
    """
    try:
        data = request.get_json()
        document_id = data.get('document_id')
        status = data.get('status') # PASSED, FAILED
        # corrections = data.get('corrections', {}) # Optional {field: correct_value}
        # user_id = data.get('user_id', 'system')
        
        # TODO: Update extraction result status in DB
        # For now just logging
        print(f"[OCR] Validated {document_id}: {status}")
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@atlas_bp.route('/api/ocr/preview', methods=['POST'])
def preview_extraction():
    """
    Preview OCR/Excel data without saving.
    Used for the 'Inspect' modal in frontend.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'File is required'}), 400
            
        file = request.files['file']
        file_type = request.form.get('type', 'pdf') # pdf or excel
        vendor_id = request.form.get('vendor_id')
        
        filename = secure_filename(file.filename)
        temp_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'temp_preview')
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        result = {}
        
        if file_type == 'pdf':
            # Run OCR
            print(f"[Preview] Extracting PDF: {filename}")
            ocr_result = advanced_ocr.extract_with_schema(
                file_path=file_path,
                document_type='INVOICE',
                ocr_engine='GEMINI'
            )
            extracted_data = ocr_result.get('extracted_data', {})
            
            result = {
                'raw_data': extracted_data,
                'tables': extracted_data.get('line_items', []),
                'fields': {
                    'invoice_number': extracted_data.get('invoice_number'),
                    'total_amount': extracted_data.get('total_amount'),
                    'invoice_date': extracted_data.get('invoice_date'),
                    'vendor': extracted_data.get('vendor')
                },
                'confidence': ocr_result.get('overall_confidence', 0.0)
            }
            
        elif file_type == 'excel':
            # Parse Excel
            print(f"[Preview] Parsing Excel: {filename}")
            df = atlas_bulk.parse_excel_file(file_path)
            
            if df is None or len(df) == 0:
                return jsonify({'error': 'Excel file is empty or invalid'}), 400
                
            # Get Column Mapping
            mapping = atlas_bulk.detect_column_mapping(df, vendor_id)
            
            # Preview Rows (Convert NaN to null for JSON)
            preview_df = df.head(10).replace({float('nan'): None})
            preview_rows = []
            for _, row in preview_df.iterrows():
                # Convert timestamps to strings
                row_dict = {}
                for col, val in row.items():
                    if isinstance(val, (datetime.datetime, datetime.date)):
                        row_dict[col] = val.isoformat()
                    else:
                        row_dict[col] = val
                preview_rows.append(row_dict)
            
            result = {
                'headers': list(df.columns),
                'row_count': len(df),
                'mapping': mapping,
                'tables': preview_rows, # Treated as "table" for UI
                'raw_data': mapping # Show mapping as raw data for now
            }
            
        # Cleanup
        try:
            os.remove(file_path)
        except:
            pass
            
        return jsonify({
            'success': True,
            'type': file_type,
            'data': result
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


print("[Atlas API] Advanced endpoints configured as Blueprint")
