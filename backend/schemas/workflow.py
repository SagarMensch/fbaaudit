from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class WorkflowStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"


class WorkflowStepStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class WorkflowStep(BaseModel):
    """Individual workflow step"""
    step_id: str
    step_name: str
    status: WorkflowStepStatus
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class InvoiceWorkflowState(BaseModel):
    """State for invoice processing workflow"""
    workflow_id: str
    invoice_id: str
    invoice_data: Dict[str, Any]
    
    # Workflow tracking
    status: WorkflowStatus = WorkflowStatus.PENDING
    current_step: Optional[str] = None
    steps: List[WorkflowStep] = Field(default_factory=list)
    
    # Processing results
    validated_invoice: Optional[Dict[str, Any]] = None
    risk_score: float = 0.0
    matched_rate: Optional[Dict[str, Any]] = None
    approval_decision: Optional[str] = None
    
    # Error handling
    errors: List[str] = Field(default_factory=list)
    retry_count: int = 0
    
    # Metadata
    created_at: str
    updated_at: str
    
    class Config:
        use_enum_values = True


class WorkflowExecutionRequest(BaseModel):
    """Request to execute a workflow"""
    workflow_type: str = Field(..., pattern=r'^(invoice_processing|contract_validation|audit_check)$')
    input_data: Dict[str, Any]
    options: Dict[str, Any] = Field(default_factory=dict)


class WorkflowExecutionResponse(BaseModel):
    """Response from workflow execution"""
    workflow_id: str
    status: WorkflowStatus
    result: Optional[Dict[str, Any]] = None
    errors: List[str] = Field(default_factory=list)
    execution_time_ms: Optional[float] = None
