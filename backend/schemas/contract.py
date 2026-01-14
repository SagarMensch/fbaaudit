from pydantic import BaseModel, Field, validator
from typing import Optional, List
from enum import Enum


class ContractStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    PENDING_APPROVAL = "PENDING_APPROVAL"


class ServiceType(str, Enum):
    FTL = "FTL"
    LTL = "LTL"
    EXPRESS = "Express"
    AIR = "Air"


class VehicleType(str, Enum):
    TATA_ACE = "Tata Ace"
    TYPE_407 = "407"
    TYPE_19FT = "19ft"
    TYPE_32FT_SXL = "32ft SXL"
    TYPE_32FT_MXL = "32ft MXL"
    TYPE_20FT_SXL = "20ft SXL"
    TYPE_40FT_TRAILER = "40ft Trailer"
    TYPE_10_TYRE = "10-Tyre"
    TAURUS = "Taurus"


class FreightRateSchema(BaseModel):
    """Pydantic schema for freight rate validation"""
    id: str
    origin: str = Field(..., min_length=2)
    destination: str = Field(..., min_length=2)
    vehicle_type: str
    capacity_ton: float = Field(..., gt=0)
    rate_basis: str = Field(..., pattern=r'^(Per Trip|Per Kg|Per Ton|Per Km)$')
    base_rate: float = Field(..., gt=0, alias='baseRate')
    min_charge: Optional[float] = Field(None, gt=0)
    transit_time_hrs: Optional[int] = Field(None, gt=0, alias='transitTimeHrs')
    transit_time_days: Optional[int] = Field(None, gt=0, alias='transitTimeDays')
    
    class Config:
        allow_population_by_field_name = True


class PVCConfigSchema(BaseModel):
    """Price Variance Clause configuration"""
    base_diesel_price: float = Field(..., gt=0, alias='baseDieselPrice')
    mileage_benchmark: float = Field(..., gt=0, alias='mileageBenchmark')
    reference_city: str = Field(..., min_length=2, alias='referenceCity')
    
    class Config:
        allow_population_by_field_name = True


class AccessorialRulesSchema(BaseModel):
    """Accessorial charges configuration"""
    loading_unloading: dict
    detention: dict
    oda: dict
    tolls: dict


class ContractSchema(BaseModel):
    """Pydantic schema for contract validation"""
    id: str
    vendor_id: str = Field(..., alias='vendorId')
    vendor_name: str = Field(..., min_length=2, alias='vendorName')
    service_type: ServiceType = Field(..., alias='serviceType')
    valid_from: str = Field(..., alias='validFrom')
    valid_to: str = Field(..., alias='validTo')
    payment_terms: str = Field(..., alias='paymentTerms')
    is_rcm_applicable: bool = Field(..., alias='isRCMApplicable')
    status: ContractStatus
    freight_matrix: List[FreightRateSchema] = Field(default_factory=list, alias='freightMatrix')
    pvc_config: PVCConfigSchema = Field(..., alias='pvcConfig')
    accessorials: AccessorialRulesSchema
    
    @validator('valid_to')
    def validate_dates(cls, v, values):
        """Ensure valid_to is after valid_from"""
        if 'valid_from' in values and v < values['valid_from']:
            raise ValueError('valid_to must be after valid_from')
        return v
    
    class Config:
        use_enum_values = True
        allow_population_by_field_name = True


class RateCardSchema(BaseModel):
    """Simple rate card schema"""
    id: str
    carrier: str = Field(..., min_length=2)
    contract_ref: str = Field(..., alias='contractRef')
    origin: str
    destination: str
    container_type: str = Field(..., alias='containerType')
    rate: float = Field(..., gt=0)
    currency: str = Field(default='INR')
    status: str = Field(..., pattern=r'^(ACTIVE|EXPIRED|PENDING)$')
    valid_from: str = Field(..., alias='validFrom')
    valid_to: str = Field(..., alias='validTo')
    
    class Config:
        allow_population_by_field_name = True
