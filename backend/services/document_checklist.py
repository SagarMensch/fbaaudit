"""
Document Checklist & Magic Splitter Service
Bridges the gap between physical receipts and digital audit.

Features:
1. Configuration Rules Engine: Defines mandatory documents based on shipment attributes.
2. Magic Splitter Logic: Handles the splitting of a large "bundle" PDF into individual docs.
"""

import os
from typing import Dict, List, Optional
import time

# =============================================================================
# DOCUMENT CHECKLIST RULES ENGINE
# Defines which documents are mandatory for a shipment
# =============================================================================

class DocumentType:
    INVOICE = "INVOICE"
    LR_COPY = "LR_COPY" # Lorry Receipt / Proof of Delivery
    WEIGHT_SLIP = "WEIGHT_SLIP"
    TOLL_RECEIPT = "TOLL_RECEIPT"
    EWAY_BILL = "EWAY_BILL"

def get_document_requirements(shipment_data: Dict) -> Dict:
    """
    Determine which documents are mandatory for a given shipment.
    
    Rules:
    1. Standard FTL: Invoice + LR
    2. Weight-Based Payment: Invoice + LR + Weight Slip
    3. Reimbursements: If 'Toll Charges' in invoice -> Toll Receipt
    """
    requirements = []
    
    # Rule 1: Invoice and LR are ALWAYS mandatory
    requirements.append({
        "type": DocumentType.INVOICE,
        "name": "Tax Invoice / Bill",
        "mandatory": True,
        "description": "Primary vendor invoice (GST compliant)"
    })
    
    requirements.append({
        "type": DocumentType.LR_COPY,
        "name": "Signed LR / POD",
        "mandatory": True,
        "description": "Lorry Receipt signed by security/store"
    })
    
    # Rule 2: Weight-Based Payment
    # Check if contract type is 'Per Kg' or 'Per Ton'
    is_weight_based = shipment_data.get('contract_type') in ['PER_KG', 'PER_TON']
    if is_weight_based:
        requirements.append({
            "type": DocumentType.WEIGHT_SLIP,
            "name": "Weighbridge Slip",
            "mandatory": True,
            "description": "Electronic weight slip from factory weighbridge"
        })
    
    # Rule 3: Reimbursements (Tolls)
    # Check if 'toll_charges' is present and > 0
    toll_charges = shipment_data.get('toll_charges', 0)
    if toll_charges > 0:
        requirements.append({
            "type": DocumentType.TOLL_RECEIPT,
            "name": "Toll Receipts",
            "mandatory": True,
            "description": "Original toll receipts for reimbursement"
        })
        
    # Optional Docs
    requirements.append({
        "type": DocumentType.EWAY_BILL,
        "name": "E-Way Bill",
        "mandatory": False,
        "description": "Government E-Way bill copy"
    })
    
    return {
        "shipment_id": shipment_data.get('id'),
        "requirements": requirements,
        "allow_submission": False # Default to False until uploaded
    }

# =============================================================================
# MAGIC SPLITTER LOGIC
# Uses pypdf to physically split the PDF Bundle
# =============================================================================

from pypdf import PdfReader, PdfWriter

def split_pdf_bundle(source_path: str, split_map: Dict[str, List[int]], output_dir: str) -> Dict:
    """
    Split a large PDF file into smaller PDFs based on page mapping.
    
    Args:
        source_path: Absolute path to the source "Bundle" PDF.
        split_map: Dictionary mapping DocType to list of Page Numbers (1-indexed).
                   e.g. { "INVOICE": [1], "LR_COPY": [2], "WEIGHT_SLIP": [3, 4] }
        output_dir: Directory to save the split files.
    
    Returns:
        Dict containing paths to the created files.
    """
    if not os.path.exists(source_path):
        return {"success": False, "error": "Source file not found"}
        
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    results = {}
    total_pages_used = 0
    
    try:
        reader = PdfReader(source_path)
        total_source_pages = len(reader.pages)
        
        for doc_type, page_numbers in split_map.items():
            if not page_numbers:
                continue
                
            writer = PdfWriter()
            valid_pages = []
            
            for page_num in page_numbers:
                # Convert 1-indexed to 0-indexed
                idx = page_num - 1
                if 0 <= idx < total_source_pages:
                    writer.add_page(reader.pages[idx])
                    valid_pages.append(page_num)
            
            if valid_pages:
                filename = f"{os.path.basename(source_path).replace('.pdf', '')}_{doc_type}.pdf"
                output_path = os.path.join(output_dir, filename)
                
                with open(output_path, "wb") as f:
                    writer.write(f)
                    
                results[doc_type] = {
                    "status": "SPLIT_SUCCESS",
                    "pages": valid_pages,
                    "filename": filename,
                    "path": output_path,
                    "url": f"/api/documents/view/{filename}" # Assuming endpoint serves from output_dir
                }
                total_pages_used += len(valid_pages)
                
        return {
            "success": True,
            "source_file": os.path.basename(source_path),
            "documents_created": results,
            "total_pages_processed": total_pages_used,
            "message": "Bundle successfully split into individual documents"
        }
        
    except Exception as e:
        print(f"PDF Split Error: {e}")
        return {"success": False, "error": str(e)}

# =============================================================================
# MOCK DATA FOR UI DEMO
# =============================================================================

def get_demo_shipment_config():
    return {
        "id": "SHIP-1001",
        "contract_type": "PER_TON", # Triggers Rule 2 (Weight Slip)
        "toll_charges": 500         # Triggers Rule 3 (Toll Receipt)
    }

def get_mock_pdf_thumbnails(page_count: int = 4) -> List[Dict]:
    """
    Returns mock thumbnail URLs for the UI Magic Splitter.
    In real app, these would be generated from the PDF.
    """
    thumbnails = []
    # Using placeholder images that look like documents
    placeholders = [
        "https://via.placeholder.com/300x400/FFFFFF/000000?text=Invoice+Page+1",
        "https://via.placeholder.com/300x400/FFFFFF/000000?text=LR+Copy+Signed",
        "https://via.placeholder.com/300x400/FFFFFF/000000?text=Weight+Slip+20T",
        "https://via.placeholder.com/300x400/FFFFFF/000000?text=Toll+Receipts"
    ]
    
    for i in range(page_count):
        idx = i %len(placeholders)
        thumbnails.append({
            "page_number": i + 1,
            "image_url": placeholders[idx]
        })
    return thumbnails
