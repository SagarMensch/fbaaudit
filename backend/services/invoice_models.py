"""
Invoice OCR Models - Pydantic v2 Models for Freight Invoice Extraction
========================================================================
Structured data models for extracting and validating freight invoice data
from OCR output using PaddleOCR PP-Structure.

Author: SequelString AI Team
"""

from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator, model_validator
from decimal import Decimal
import re


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_gstin(gstin: str) -> bool:
    """Validate Indian GSTIN format: 2 digit state code + 10 char PAN + 1 char + Z + 1 check digit"""
    if not gstin:
        return True  # Optional field
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    return bool(re.match(pattern, gstin.upper()))


def validate_pan(pan: str) -> bool:
    """Validate Indian PAN format: 5 letters + 4 digits + 1 letter"""
    if not pan:
        return True  # Optional field
    pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    return bool(re.match(pattern, pan.upper()))


def validate_vehicle_number(vehicle: str) -> bool:
    """Validate Indian vehicle registration number format"""
    if not vehicle:
        return True
    # Common formats: MH12AB1234, MH-12-AB-1234, MH 12 AB 1234
    pattern = r'^[A-Z]{2}[\s\-]?[0-9]{1,2}[\s\-]?[A-Z]{0,3}[\s\-]?[0-9]{1,4}$'
    return bool(re.match(pattern, vehicle.upper().replace('-', '').replace(' ', '')))


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class VendorDetails(BaseModel):
    """Carrier/Vendor information extracted from invoice"""
    name: str = Field(..., description="Vendor/Carrier name")
    gstin: Optional[str] = Field(None, description="GSTIN number (15 characters)")
    pan: Optional[str] = Field(None, description="PAN number (10 characters)")
    address: Optional[str] = Field(None, description="Registered address")
    contact: Optional[str] = Field(None, description="Contact number")
    email: Optional[str] = Field(None, description="Email address")
    
    @field_validator('gstin')
    @classmethod
    def validate_gstin_format(cls, v: Optional[str]) -> Optional[str]:
        if v and not validate_gstin(v):
            raise ValueError(f"Invalid GSTIN format: {v}")
        return v.upper() if v else None
    
    @field_validator('pan')
    @classmethod
    def validate_pan_format(cls, v: Optional[str]) -> Optional[str]:
        if v and not validate_pan(v):
            raise ValueError(f"Invalid PAN format: {v}")
        return v.upper() if v else None


class LineItem(BaseModel):
    """Individual line item from invoice (freight charges, handling, etc.)"""
    sr_no: Optional[int] = Field(None, description="Serial number")
    description: str = Field(..., description="Description of charge")
    hsn_sac_code: Optional[str] = Field(None, description="HSN/SAC code for GST")
    quantity: float = Field(1.0, ge=0, description="Quantity")
    unit: Optional[str] = Field(None, description="Unit of measurement (KG, PKG, etc.)")
    rate: float = Field(0.0, ge=0, description="Rate per unit")
    amount: float = Field(..., ge=0, description="Total amount for line item")
    
    # Freight-specific fields
    origin: Optional[str] = Field(None, description="Origin location")
    destination: Optional[str] = Field(None, description="Destination location")
    lr_number: Optional[str] = Field(None, description="Lorry Receipt / Consignment Note number")
    vehicle_number: Optional[str] = Field(None, description="Vehicle registration number")
    weight_kg: Optional[float] = Field(None, ge=0, description="Weight in KG")
    
    @field_validator('vehicle_number')
    @classmethod
    def validate_vehicle(cls, v: Optional[str]) -> Optional[str]:
        if v:
            # Normalize vehicle number
            normalized = v.upper().replace('-', '').replace(' ', '')
            return normalized
        return None


class TaxDetails(BaseModel):
    """GST tax breakdown"""
    taxable_amount: float = Field(0.0, ge=0, description="Amount before tax")
    
    # CGST + SGST (Intra-state)
    cgst_rate: float = Field(0.0, ge=0, le=50, description="CGST rate %")
    cgst_amount: float = Field(0.0, ge=0, description="CGST amount")
    sgst_rate: float = Field(0.0, ge=0, le=50, description="SGST rate %")
    sgst_amount: float = Field(0.0, ge=0, description="SGST amount")
    
    # IGST (Inter-state)
    igst_rate: float = Field(0.0, ge=0, le=50, description="IGST rate %")
    igst_amount: float = Field(0.0, ge=0, description="IGST amount")
    
    # Cess (if applicable)
    cess_rate: float = Field(0.0, ge=0, description="Cess rate %")
    cess_amount: float = Field(0.0, ge=0, description="Cess amount")
    
    # Total
    total_tax: float = Field(0.0, ge=0, description="Total tax amount")
    
    @model_validator(mode='after')
    def calculate_total_tax(self) -> 'TaxDetails':
        """Auto-calculate total tax if not provided"""
        calculated = self.cgst_amount + self.sgst_amount + self.igst_amount + self.cess_amount
        if self.total_tax == 0.0 and calculated > 0:
            self.total_tax = calculated
        return self


class ShipmentDetails(BaseModel):
    """Freight/Shipment specific details"""
    lr_number: Optional[str] = Field(None, description="LR/CN Number")
    lr_date: Optional[date] = Field(None, description="LR Date")
    vehicle_number: Optional[str] = Field(None, description="Vehicle Number")
    vehicle_type: Optional[str] = Field(None, description="Vehicle Type (Container, Truck, etc.)")
    origin: Optional[str] = Field(None, description="Origin city/location")
    destination: Optional[str] = Field(None, description="Destination city/location")
    weight_kg: Optional[float] = Field(None, ge=0, description="Chargeable weight in KG")
    packages: Optional[int] = Field(None, ge=0, description="Number of packages")
    delivery_date: Optional[date] = Field(None, description="Delivery date")
    pod_number: Optional[str] = Field(None, description="Proof of Delivery number")


class FreightInvoice(BaseModel):
    """
    Main Freight Invoice Model
    ==========================
    Comprehensive model for freight/transportation invoices with full GST compliance.
    """
    
    # Invoice Identification
    invoice_number: str = Field(..., description="Invoice number")
    invoice_date: date = Field(..., description="Invoice date")
    due_date: Optional[date] = Field(None, description="Payment due date")
    
    # Vendor/Carrier Details
    vendor: VendorDetails = Field(..., description="Vendor/Carrier details")
    
    # Bill To (Customer)
    bill_to_name: Optional[str] = Field(None, description="Customer/Bill To name")
    bill_to_gstin: Optional[str] = Field(None, description="Customer GSTIN")
    bill_to_address: Optional[str] = Field(None, description="Billing address")
    
    # Shipment Details
    shipment: Optional[ShipmentDetails] = Field(None, description="Shipment/Freight details")
    
    # Line Items
    line_items: List[LineItem] = Field(default_factory=list, description="Invoice line items")
    
    # Amounts
    subtotal: float = Field(..., ge=0, description="Subtotal before tax")
    tax_details: TaxDetails = Field(default_factory=TaxDetails, description="Tax breakdown")
    discount: float = Field(0.0, ge=0, description="Discount amount")
    round_off: float = Field(0.0, description="Round off amount")
    total_amount: float = Field(..., ge=0, description="Final invoice amount")
    
    # Amount in words
    amount_in_words: Optional[str] = Field(None, description="Total amount in words")
    
    # Bank Details (for payment)
    bank_name: Optional[str] = Field(None, description="Bank name")
    bank_account: Optional[str] = Field(None, description="Bank account number")
    bank_ifsc: Optional[str] = Field(None, description="IFSC code")
    
    # OCR Metadata
    confidence_score: float = Field(0.0, ge=0, le=1.0, description="Overall OCR confidence (0-1)")
    extraction_timestamp: datetime = Field(default_factory=datetime.now, description="When data was extracted")
    source_file: Optional[str] = Field(None, description="Source file path")
    page_count: int = Field(1, ge=1, description="Number of pages")
    
    # Validation flags
    is_validated: bool = Field(False, description="Whether invoice has been validated")
    validation_errors: List[str] = Field(default_factory=list, description="List of validation issues")
    
    @field_validator('bill_to_gstin')
    @classmethod
    def validate_customer_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v and not validate_gstin(v):
            raise ValueError(f"Invalid Customer GSTIN format: {v}")
        return v.upper() if v else None
    
    @model_validator(mode='after')
    def validate_amounts(self) -> 'FreightInvoice':
        """Validate that amounts are consistent"""
        errors = []
        
        # Check subtotal vs line items
        if self.line_items:
            line_total = sum(item.amount for item in self.line_items)
            if abs(line_total - self.subtotal) > 1:  # Allow ₹1 tolerance
                errors.append(f"Line items total ({line_total}) doesn't match subtotal ({self.subtotal})")
        
        # Check total calculation
        expected_total = self.subtotal + self.tax_details.total_tax - self.discount + self.round_off
        if abs(expected_total - self.total_amount) > 1:  # Allow ₹1 tolerance
            errors.append(f"Calculated total ({expected_total}) doesn't match invoice total ({self.total_amount})")
        
        if errors:
            self.validation_errors.extend(errors)
        
        return self
    
    def to_database_dict(self) -> dict:
        """Convert to flat dictionary for database insertion"""
        return {
            'invoice_number': self.invoice_number,
            'invoice_date': self.invoice_date.isoformat(),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'vendor_name': self.vendor.name,
            'vendor_gstin': self.vendor.gstin,
            'vendor_pan': self.vendor.pan,
            'bill_to_name': self.bill_to_name,
            'bill_to_gstin': self.bill_to_gstin,
            'lr_number': self.shipment.lr_number if self.shipment else None,
            'vehicle_number': self.shipment.vehicle_number if self.shipment else None,
            'origin': self.shipment.origin if self.shipment else None,
            'destination': self.shipment.destination if self.shipment else None,
            'weight_kg': self.shipment.weight_kg if self.shipment else None,
            'subtotal': self.subtotal,
            'cgst_amount': self.tax_details.cgst_amount,
            'sgst_amount': self.tax_details.sgst_amount,
            'igst_amount': self.tax_details.igst_amount,
            'total_tax': self.tax_details.total_tax,
            'total_amount': self.total_amount,
            'confidence_score': self.confidence_score,
            'extraction_timestamp': self.extraction_timestamp.isoformat(),
            'source_file': self.source_file,
            'is_validated': self.is_validated,
        }


class OCRExtractionResult(BaseModel):
    """Result from OCR extraction process"""
    success: bool = Field(..., description="Whether extraction was successful")
    invoice: Optional[FreightInvoice] = Field(None, description="Extracted invoice data")
    raw_text: Optional[str] = Field(None, description="Raw OCR text")
    tables: List[List[List[str]]] = Field(default_factory=list, description="Extracted tables")
    confidence: float = Field(0.0, ge=0, le=1.0, description="Overall confidence score")
    processing_time_ms: int = Field(0, ge=0, description="Processing time in milliseconds")
    errors: List[str] = Field(default_factory=list, description="Extraction errors")
    warnings: List[str] = Field(default_factory=list, description="Extraction warnings")


class OCRJobStatus(BaseModel):
    """Status of an async OCR job"""
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="pending|processing|completed|failed")
    progress: float = Field(0.0, ge=0, le=1.0, description="Progress 0-1")
    result: Optional[OCRExtractionResult] = Field(None, description="Result when completed")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    error_message: Optional[str] = Field(None, description="Error message if failed")
