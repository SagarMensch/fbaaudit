from enum import Enum
from datetime import datetime
from typing import Dict, List, Optional, Any

class StateMachineError(Exception):
    pass

class BaseStateMachine:
    """
    Base class for SAP-style process flow engines.
    """
    def __init__(self, entity, transitions: Dict[str, Dict[str, str]]):
        self.entity = entity
        self.transitions = transitions

    def get_allowed_actions(self) -> List[str]:
        """Returns list of events allowed from current state."""
        current_state = self.entity.status
        if current_state not in self.transitions:
            return []
        return list(self.transitions[current_state].keys())

    def can_transition(self, event: str) -> bool:
        return event in self.get_allowed_actions()

    def transition(self, event: str, user_id: str = 'SYSTEM', metadata: Dict[str, Any] = None) -> str:
        """
        Executes a state transition.
        Updates entity status and logs the change.
        """
        if not self.can_transition(event):
            raise StateMachineError(f"Invalid transition: Cannot trigger '{event}' from state '{self.entity.status}'")

        next_state = self.transitions[self.entity.status][event]
        previous_state = self.entity.status
        
        # Update State
        self.entity.status = next_state
        self.entity.updated_at = datetime.utcnow()
        
        # Log Audit (Mock implementation - connect to DB in real app)
        print(f"AUDIT: {self.entity.id} transitioned from {previous_state} to {next_state} by {user_id}")
        
        return next_state

# Example Definitions (to be moved to respective modules)

class InvoiceStatus(str, Enum):
    UPLOADED = "UPLOADED"
    OCR_IN_PROGRESS = "OCR_IN_PROGRESS"
    OCR_COMPLETED = "OCR_COMPLETED"
    OCR_FAILED = "OCR_FAILED"
    CONTRACT_MATCHING = "CONTRACT_MATCHING"
    MATCH_FAILED = "MATCH_FAILED"
    RATED = "RATED"
    VARIANCE_CHECK = "VARIANCE_CHECK"
    AUTO_APPROVED = "AUTO_APPROVED"
    DISPUTE_RAISED = "DISPUTE_RAISED"
    FINANCE_POSTING = "FINANCE_POSTING"
    PAID = "PAID"
    REJECTED = "REJECTED"

INVOICE_TRANSITIONS = {
    InvoiceStatus.UPLOADED: {
        "START_OCR": InvoiceStatus.OCR_IN_PROGRESS
    },
    InvoiceStatus.OCR_IN_PROGRESS: {
        "OCR_SUCCESS": InvoiceStatus.OCR_COMPLETED,
        "OCR_ERROR": InvoiceStatus.OCR_FAILED
    },
    InvoiceStatus.OCR_COMPLETED: {
        "START_MATCH": InvoiceStatus.CONTRACT_MATCHING
    },
    # ... more transitions
}
