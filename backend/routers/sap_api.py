from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# Import workflow engine (mock import for now)
# from backend.modules.workflow.engine import InvoiceStateMachine

router = APIRouter(prefix="/api/v2", tags=["SAP Core"])

# --- DATA MODELS ---

class ActionRequest(BaseModel):
    action: str
    comment: Optional[str] = None
    user_id: str

class InvoiceResponse(BaseModel):
    id: str
    status: str
    allowed_actions: List[str]
    data: dict

# --- ENDPOINTS ---

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str):
    # TODO: Fetch from DB using Canonical Model
    # Mock Response
    return {
        "id": invoice_id,
        "status": "VARIANCE_CHECK",
        "allowed_actions": ["APPROVE_WITH_EXCEPTION", "REJECT"],
        "data": {
            "amount": 1000.0,
            "vendor": "TCI Express"
        }
    }

@router.post("/invoices/{invoice_id}/process")
async def process_invoice(invoice_id: str, request: ActionRequest):
    # TODO: Initialize State Machine and Transition
    # machine = InvoiceStateMachine(invoice)
    # new_state = machine.transition(request.action)
    
    # Mock Transition
    if request.action == "APPROVE_WITH_EXCEPTION":
        # Simulate ERP Posting
        from backend.modules.finance.erp_connector import ERPConnector
        erp = ERPConnector()
        result = erp.post_invoice_voucher({"invoice_number": "INV-MOCK-001", "amount": 1000})
        
        return {
            "success": True,
            "new_status": "FINANCE_POSTING",
            "message": f"Invoice approved. ERP Voucher: {result['voucher_id']}"
        }
    
    raise HTTPException(status_code=400, detail="Invalid action")

@router.get("/shipments/{shipment_id}")
async def get_shipment(shipment_id: str):
    return {
        "id": shipment_id,
        "status": "DELIVERED",
        "allowed_actions": ["UPLOAD_POD"]
    }

@router.post("/contracts/rate-check")
async def check_rate(origin: str, destination: str):
    return {
        "estimated_cost": 5000,
        "contract_applied": "CNT-001"
    }

@router.get("/invoices/{invoice_id}/audit-log")
async def get_audit_log(invoice_id: str):
    # Mock Data for Demo
    return [
        {
            "id": "LOG-001",
            "timestamp": "2024-02-07T10:00:00Z",
            "user_id": "SYS-OCR",
            "user_name": "System OCR",
            "action": "CREATE",
            "comment": "Invoice created from PDF upload"
        },
        {
            "id": "LOG-002",
            "timestamp": "2024-02-07T10:00:05Z",
            "user_id": "SYS-AUDIT",
            "user_name": "Audit Engine",
            "action": "UPDATE_FIELD",
            "field_changed": "status",
            "old_value": "OCR_COMPLETED",
            "new_value": "VARIANCE_CHECK"
        },
        {
            "id": "LOG-003",
            "timestamp": "2024-02-07T10:00:06Z",
            "user_id": "SYS-AUDIT",
            "user_name": "Audit Engine",
            "action": "FLAG_VARIANCE",
            "comment": "Price variance of 5.2% detected (Threshold: 2%)"
        }
    ]

