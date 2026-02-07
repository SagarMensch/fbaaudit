"""
Database Models - NO HARDCODING
All data comes from PostgreSQL
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from api.database import Base
import enum

# Enums
class InvoiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_AUDIT = "UNDER_AUDIT"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"
    DISPUTED = "DISPUTED"

class UserRole(str, enum.Enum):
    HITACHI_ADMIN = "HITACHI_ADMIN"
    HITACHI_FINANCE = "HITACHI_FINANCE"
    HITACHI_VIEWER = "HITACHI_VIEWER"
    TSC_ADMIN = "3SC_ADMIN"
    TSC_AUDITOR = "3SC_AUDITOR"
    CARRIER = "CARRIER"

class BIDType(str, enum.Enum):
    POINT_TO_POINT = "POINT_TO_POINT"
    ZIP_3_DIGIT = "ZIP_3_DIGIT"
    LTL_CZAR_LITE = "LTL_CZAR_LITE"
    FAK = "FAK"

# Models

class BusinessUnit(Base):
    """Business Units for Hitachi Energy"""
    __tablename__ = "business_units"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    gl_code = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    invoices = relationship("Invoice", back_populates="business_unit")

class Location(Base):
    """Locations (Origin/Destination)"""
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    city = Column(String(100))
    state = Column(String(50))
    country = Column(String(50))
    zip_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Carrier(Base):
    """Carriers/Vendors"""
    __tablename__ = "carriers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    scac = Column(String(10))
    contact_email = Column(String(200))
    contact_phone = Column(String(50))
    payment_terms_days = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    rate_files = relationship("RateFile", back_populates="carrier")
    invoices = relationship("Invoice", back_populates="carrier")

class RateFile(Base):
    """Rate Files (Requirement #1)"""
    __tablename__ = "rate_files"
    
    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False)
    origin_code = Column(String(50))
    destination_code = Column(String(50))
    bid_type = Column(SQLEnum(BIDType), nullable=False)
    rate = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    fak_provisions = Column(JSON)  # FAK rules as JSON
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    carrier = relationship("Carrier", back_populates="rate_files")

class Invoice(Base):
    """Invoices (Requirement #2)"""
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, nullable=False)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False)
    business_unit_id = Column(Integer, ForeignKey("business_units.id"))
    
    # Invoice Details
    invoice_date = Column(DateTime)
    due_date = Column(DateTime)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    
    # Origin/Destination
    origin = Column(String(100))
    destination = Column(String(100))
    
    # Status & Audit
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.PENDING)
    ingestion_method = Column(String(50))  # EDI, MANUAL, API
    
    # TMS 3-way match
    tms_reference = Column(String(100))
    match_status = Column(String(50))
    
    # Audit Trail
    audited_by = Column(Integer, ForeignKey("users.id"))
    audited_at = Column(DateTime)
    audit_notes = Column(Text)
    
    # Payment
    paid_at = Column(DateTime)
    payment_reference = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    carrier = relationship("Carrier", back_populates="invoices")
    business_unit = relationship("BusinessUnit", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice")
    approvals = relationship("InvoiceApproval", back_populates="invoice")
    disputes = relationship("Dispute", back_populates="invoice")

class InvoiceLineItem(Base):
    """Invoice Line Items"""
    __tablename__ = "invoice_line_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    description = Column(String(500))
    quantity = Column(Float)
    unit_price = Column(Float)
    amount = Column(Float, nullable=False)
    
    invoice = relationship("Invoice", back_populates="line_items")

class User(Base):
    """Users (Requirement #6)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    business_unit_id = Column(Integer, ForeignKey("business_units.id"))
    
    # RBAC
    can_view = Column(Boolean, default=True)
    can_approve = Column(Boolean, default=False)
    can_admin = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    business_unit = relationship("BusinessUnit")

class InvoiceApproval(Base):
    """Approval Flow (Requirement #3)"""
    __tablename__ = "invoice_approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    decision = Column(String(20))  # APPROVED, REJECTED
    comments = Column(Text)
    approved_at = Column(DateTime(timezone=True), server_default=func.now())
    
    invoice = relationship("Invoice", back_populates="approvals")
    approver = relationship("User")

class Dispute(Base):
    """Disputes Management (Requirement #3)"""
    __tablename__ = "disputes"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dispute_reason = Column(Text, nullable=False)
    resolution = Column(Text)
    status = Column(String(50), default="OPEN")  # OPEN, RESOLVED, CLOSED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime)
    
    invoice = relationship("Invoice", back_populates="disputes")
    raised_by = relationship("User")

class Payment(Base):
    """Payment Management (Requirement #4)"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    business_unit_id = Column(Integer, ForeignKey("business_units.id"))
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime)
    funding_week = Column(String(20))  # e.g., "2026-W06"
    is_overdue = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    invoice = relationship("Invoice")
    business_unit = relationship("BusinessUnit")
    carrier = relationship("Carrier")
