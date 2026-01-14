from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


class InvoiceStatus(str, Enum):
    PENDING = "PENDING"
    OPS_APPROVED = "OPS_APPROVED"
    FINANCE_APPROVED = "FINANCE_APPROVED"
    TREASURY_PENDING = "TREASURY_PENDING"
    APPROVED = "APPROVED"
    PAID = "PAID"
    REJECTED = "REJECTED"
    EXCEPTION = "EXCEPTION"
    VENDOR_RESPONDED = "VENDOR_RESPONDED"


class MatchStatus(str, Enum):
    MATCH = "MATCH"
    MISMATCH = "MISMATCH"
    MISSING = "MISSING"


class LineItemSchema(BaseModel):
    description: str
    amount: float = Field(..., gt=0)
    expected_amount: float = Field(..., gt=0)


class InvoiceSchema(BaseModel):
    """Pydantic schema for invoice validation with strict type checking"""
    
    id: str
    invoice_number: str = Field(..., min_length=3, max_length=50)
    business_unit: Optional[str] = None
    carrier: str = Field(..., min_length=2, max_length=200)
    origin: str = Field(..., min_length=2)
    destination: str = Field(..., min_length=2)
    amount: float = Field(..., gt=0, description="Invoice amount must be positive")
    currency: str = Field(default='INR', pattern=r'^[A-Z]{3}$')
    date: str  # ISO format date string
    due_date: Optional[str] = None
    status: InvoiceStatus
    variance: float = Field(default=0)
    reason: Optional[str] = None
    extraction_confidence: float = Field(default=100, ge=0, le=100)
    
    # Validation
    @field_validator('variance')
    @classmethod
    def validate_variance(cls, v, info):
        """Ensure variance is not more than 50% of amount"""
        return v
    
    @field_validator('invoice_number')
    @classmethod
    def validate_invoice_number(cls, v):
        """Ensure invoice number is properly formatted"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Invoice number cannot be empty')
        return v.strip()
    
    @field_validator('carrier')
    @classmethod
    def validate_carrier(cls, v):
        """Normalize carrier name"""
        return v.strip().title()
    
    class Config:
        use_enum_values = True
        validate_assignment = True



class CreateInvoiceRequest(BaseModel):
    """Request schema for creating new invoices"""
    invoice_number: str
    carrier: str
    origin: str
    destination: str
    amount: float = Field(..., gt=0)
    currency: str = Field(default='INR')
    date: str
    
    class Config:
        schema_extra = {
            "example": {
                "invoice_number": "INV-2025-001",
                "carrier": "SafeExpress Logistics",
                "origin": "Mumbai, MH",
                "destination": "Delhi, DL",
                "amount": 45000.00,
                "currency": "INR",
                "date": "2025-01-15"
            }
        }


class InvoiceResponse(BaseModel):
    """Response schema for invoice operations"""
    success: bool
    message: str
    invoice: Optional[InvoiceSchema] = None
    errors: Optional[List[str]] = None
