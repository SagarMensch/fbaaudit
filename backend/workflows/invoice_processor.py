"""
LangGraph-based invoice processing workflow with intelligent routing
"""

from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, List, Dict, Any, Literal
from datetime import datetime
import logging

from schemas.invoice import InvoiceSchema, InvoiceStatus
from schemas.workflow import WorkflowStatus, InvoiceWorkflowState

logger = logging.getLogger(__name__)


class InvoiceProcessorState(TypedDict):
    """State for invoice processing workflow"""
    invoice_data: Dict[str, Any]
    validated_invoice: Optional[Dict[str, Any]]
    risk_score: float
    matched_rate: Optional[Dict[str, Any]]
    approval_decision: Optional[str]
    errors: List[str]
    workflow_id: str
    current_step: str


class InvoiceProcessor:
    """
    LangGraph-based invoice processor with intelligent routing
    
    Workflow Steps:
    1. Validate - Pydantic validation
    2. Risk Assessment - Calculate risk score
    3. Rate Matching - Find matching contract rate
    4. Decision Routing - Auto/AI/Manual based on risk
    5. Execute Action - Approve or flag for review
    """
    
    def __init__(self, rag_engine, llm=None):
        self.rag = rag_engine
        self.llm = llm
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(InvoiceProcessorState)
        
        # Add processing nodes
        workflow.add_node("validate", self.validate_invoice)
        workflow.add_node("risk_assessment", self.assess_risk)
        workflow.add_node("rate_matching", self.match_rates)
        workflow.add_node("auto_approve", self.auto_approve)
        workflow.add_node("ai_decision", self.ai_approval)
        workflow.add_node("manual_review", self.flag_manual_review)
        
        # Set entry point
        workflow.set_entry_point("validate")
        
        # Define workflow edges
        workflow.add_edge("validate", "risk_assessment")
        workflow.add_edge("risk_assessment", "rate_matching")
        
        # Conditional routing based on risk score
        workflow.add_conditional_edges(
            "rate_matching",
            self.route_decision,
            {
                "auto": "auto_approve",
                "ai": "ai_decision",
                "manual": "manual_review"
            }
        )
        
        # All paths end
        workflow.add_edge("auto_approve", END)
        workflow.add_edge("ai_decision", END)
        workflow.add_edge("manual_review", END)
        
        return workflow.compile()
    
    def validate_invoice(self, state: InvoiceProcessorState) -> Dict[str, Any]:
        """
        Step 1: Validate invoice data using Pydantic schema
        """
        logger.info(f"Validating invoice: {state.get('invoice_data', {}).get('invoice_number')}")
        
        try:
            # Pydantic validation
            validated = InvoiceSchema(**state['invoice_data'])
            
            return {
                "validated_invoice": validated.dict(),
                "current_step": "validate",
                "errors": []
            }
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            return {
                "validated_invoice": None,
                "current_step": "validate",
                "errors": [f"Validation error: {str(e)}"]
            }
    
    def assess_risk(self, state: InvoiceProcessorState) -> Dict[str, Any]:
        """
        Step 2: Calculate risk score based on multiple factors
        
        Risk Factors:
        - High amount (>100k): +0.4
        - High variance (>5k): +0.3
        - Unknown carrier: +0.2
        - Missing data: +0.1
        """
        logger.info("Assessing invoice risk")
        
        if not state.get('validated_invoice'):
            return {"risk_score": 1.0, "current_step": "risk_assessment"}
        
        invoice = state['validated_invoice']
        risk = 0.0
        
        # Risk factor 1: High amount
        if invoice.get('amount', 0) > 100000:
            risk += 0.4
            logger.info(f"High amount detected: ₹{invoice['amount']}")
        
        # Risk factor 2: High variance
        if abs(invoice.get('variance', 0)) > 5000:
            risk += 0.3
            logger.info(f"High variance detected: ₹{invoice['variance']}")
        
        # Risk factor 3: Unknown carrier
        known_carriers = ['SafeExpress', 'VRL', 'TCI', 'Maersk', 'DHL']
        if not any(carrier.lower() in invoice.get('carrier', '').lower() for carrier in known_carriers):
            risk += 0.2
            logger.info(f"Unknown carrier: {invoice.get('carrier')}")
        
        # Risk factor 4: Missing critical data
        if not invoice.get('origin') or not invoice.get('destination'):
            risk += 0.1
        
        logger.info(f"Calculated risk score: {risk}")
        
        return {
            "risk_score": risk,
            "current_step": "risk_assessment"
        }
    
    def match_rates(self, state: InvoiceProcessorState) -> Dict[str, Any]:
        """
        Step 3: Match invoice against contract rates using RAG
        """
        logger.info("Matching contract rates")
        
        if not state.get('validated_invoice'):
            return {"matched_rate": None, "current_step": "rate_matching"}
        
        invoice = state['validated_invoice']
        
        # Build search query
        query = f"Find rate for {invoice.get('carrier')} from {invoice.get('origin')} to {invoice.get('destination')}"
        
        try:
            # Use RAG to find matching rate
            results = self.rag.search(query, n_results=1)
            
            if results and len(results) > 0:
                matched_rate = results[0]
                logger.info(f"Found matching rate: {matched_rate}")
                return {
                    "matched_rate": matched_rate,
                    "current_step": "rate_matching"
                }
            else:
                logger.warning("No matching rate found")
                return {
                    "matched_rate": None,
                    "current_step": "rate_matching"
                }
        except Exception as e:
            logger.error(f"Rate matching failed: {str(e)}")
            return {
                "matched_rate": None,
                "current_step": "rate_matching",
                "errors": state.get('errors', []) + [f"Rate matching error: {str(e)}"]
            }
    
    def route_decision(self, state: InvoiceProcessorState) -> Literal["auto", "ai", "manual"]:
        """
        Intelligent routing based on risk score
        
        Routing Logic:
        - Risk < 0.3: Auto-approve
        - Risk 0.3-0.7: AI decision
        - Risk > 0.7: Manual review
        """
        risk = state.get('risk_score', 1.0)
        
        if risk < 0.3:
            logger.info(f"Low risk ({risk}) - routing to auto-approve")
            return "auto"
        elif risk < 0.7:
            logger.info(f"Medium risk ({risk}) - routing to AI decision")
            return "ai"
        else:
            logger.info(f"High risk ({risk}) - routing to manual review")
            return "manual"
    
    def auto_approve(self, state: InvoiceProcessorState) -> Dict[str, Any]:
        """
        Step 4a: Auto-approve low-risk invoices
        """
        logger.info("Auto-approving invoice")
        
        return {
            "approval_decision": "AUTO_APPROVED",
            "current_step": "auto_approve"
        }
    
    def ai_approval(self, state: InvoiceProcessorState) -> Dict[str, Any]:
        """
        Step 4b: AI-powered approval decision for medium-risk invoices
        """
        logger.info("AI reviewing invoice")
        
        # TODO: Implement LLM-based decision when LLM is available
        if self.llm:
            # Use LLM for intelligent decision
            pass
        
        # For now, approve if matched rate exists
        if state.get('matched_rate'):
            decision = "AI_APPROVED"
        else:
            decision = "REQUIRES_REVIEW"
        
        logger.info(f"AI decision: {decision}")
        
        return {
            "approval_decision": decision,
            "current_step": "ai_decision"
        }
    
    def flag_manual_review(self, state: InvoiceProcessorState) -> Dict[str, Any]:
        """
        Step 4c: Flag high-risk invoices for manual review
        """
        logger.info("Flagging for manual review")
        
        return {
            "approval_decision": "MANUAL_REVIEW_REQUIRED",
            "current_step": "manual_review"
        }
    
    async def process(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the invoice processing workflow
        
        Args:
            invoice_data: Raw invoice data dictionary
        
        Returns:
            Workflow execution result
        """
        workflow_id = f"WF-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        logger.info(f"Starting workflow {workflow_id}")
        
        initial_state: InvoiceProcessorState = {
            "invoice_data": invoice_data,
            "validated_invoice": None,
            "risk_score": 0.0,
            "matched_rate": None,
            "approval_decision": None,
            "errors": [],
            "workflow_id": workflow_id,
            "current_step": "init"
        }
        
        try:
            # Execute workflow
            result = await self.graph.ainvoke(initial_state)
            
            logger.info(f"Workflow {workflow_id} completed: {result.get('approval_decision')}")
            
            return {
                "success": True,
                "workflow_id": workflow_id,
                "result": result,
                "status": WorkflowStatus.COMPLETED
            }
        except Exception as e:
            logger.error(f"Workflow {workflow_id} failed: {str(e)}")
            
            return {
                "success": False,
                "workflow_id": workflow_id,
                "error": str(e),
                "status": WorkflowStatus.FAILED
            }
