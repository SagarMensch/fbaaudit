from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import requests
import logging

from rag_engine import RAGController
from mock_data import MOCK_INVOICES, MOCK_RATES
from workflows.invoice_processor import InvoiceProcessor
from schemas.invoice import InvoiceSchema, CreateInvoiceRequest, InvoiceResponse
from schemas.workflow import WorkflowExecutionRequest, WorkflowExecutionResponse
from ticket_routes import router as ticket_router
from forecast_routes import router as forecast_router
from shock_routes import router as shock_router

# New consolidated routers
from routers.ocr_router import router as ocr_router
from routers.ocr_router import documents_router
from routers.atlas_router import router as atlas_router
from routers.invoices_router import router as invoices_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
rag: RAGController = None
invoice_workflow: InvoiceProcessor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize RAG and LangGraph on startup"""
    global rag, invoice_workflow
    
    logger.info("🚀 Initializing RAG Engine...")
    rag = RAGController()
    
    logger.info("📊 Ingesting mock data into Vector DB...")
    rag.ingest_data(MOCK_INVOICES, MOCK_RATES)
    logger.info("✅ RAG Engine Online")
    
    logger.info("🔄 Initializing LangGraph Workflow Engine...")
    invoice_workflow = InvoiceProcessor(rag_engine=rag)
    logger.info("✅ Workflow Engine Online")
    
    yield
    
    logger.info("👋 Shutting down...")

app = FastAPI(
    title="Freight Audit Platform API",
    description="RAG-enabled API with LangGraph workflow orchestration",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include ticket router
app.include_router(ticket_router)

# Include forecast router
app.include_router(forecast_router)

# Include shock rate benchmark router
app.include_router(shock_router)

# Include OCR router (Vision AI)
app.include_router(ocr_router)

# Include Atlas master data router
app.include_router(atlas_router)

# Include Documents router (OCR uploads)
app.include_router(documents_router)

# Include Invoices router (Bulk Upload)
app.include_router(invoices_router)

# Include Contracts router (PDF Generation)
from routers.contracts_router import router as contracts_router
app.include_router(contracts_router)

# Include VDU router (Visual Document Understanding - 10 Research Papers)
from routers.vdu_router import router as vdu_router
app.include_router(vdu_router)

# Include Data router (Database-backed endpoints - NO MOCK DATA)
from routers.data_router import router as data_router
app.include_router(data_router)


class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: list = []

@app.get("/")
async def root():
    return {
        "message": "Freight Audit Platform API with LangGraph",
        "version": "2.0.0",
        "features": ["RAG", "LangGraph Workflows", "Pydantic Validation"],
        "endpoints": {
            "health": "/health",
            "chat": "/api/chat",
            "workflows": "/api/workflows/invoice/process"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "rag_enabled": rag is not None,
        "workflow_enabled": invoice_workflow is not None,
        "timestamp": "2025-01-19"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    RAG-enabled chat endpoint
    """
    try:
        # 1. Retrieve relevant context
        context_results = rag.search(request.message, n_results=3)
        
        # 2. Build context string
        context = "\n".join([
            f"- {doc}" for doc in context_results
        ])
        
        # 3. Construct RAG-enriched prompt
        system_prompt = f"""You are Vector, an AI assistant for freight audit and logistics.

RELEVANT CONTEXT:
{context}

USER QUERY: {request.message}

Provide a helpful, accurate response based on the context above. If the context doesn't contain relevant information, say so."""
        
        # 4. Call Ollama
        ollama_response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": system_prompt,
                "stream": False,
                "options": {"temperature": 0.2}
            },
            timeout=30
        )
        
        if ollama_response.status_code == 200:
            ai_response = ollama_response.json().get("response", "")
            return ChatResponse(
                response=ai_response,
                sources=context_results
            )
        else:
            raise HTTPException(status_code=500, detail="Ollama request failed")
            
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workflows/invoice/process", response_model=WorkflowExecutionResponse)
async def process_invoice_workflow(invoice_data: CreateInvoiceRequest):
    """
    Process invoice through LangGraph workflow
    
    This endpoint:
    1. Validates invoice data (Pydantic)
    2. Assesses risk score
    3. Matches contract rates (RAG)
    4. Routes to appropriate approval path
    5. Returns workflow result
    """
    try:
        logger.info(f"Processing invoice: {invoice_data.invoice_number}")
        
        # Execute LangGraph workflow
        result = await invoice_workflow.process(invoice_data.dict())
        
        if result.get('success'):
            return WorkflowExecutionResponse(
                workflow_id=result['workflow_id'],
                status=result['status'],
                result=result.get('result'),
                errors=[],
                execution_time_ms=None
            )
        else:
            return WorkflowExecutionResponse(
                workflow_id=result['workflow_id'],
                status=result['status'],
                result=None,
                errors=[result.get('error', 'Unknown error')],
                execution_time_ms=None
            )
            
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/invoices/validate", response_model=InvoiceResponse)
async def validate_invoice(invoice_data: CreateInvoiceRequest):
    """
    Validate invoice data using Pydantic schema
    """
    try:
        # Pydantic validation happens automatically
        validated = InvoiceSchema(
            id=f"INV-{invoice_data.invoice_number}",
            **invoice_data.dict(),
            status="PENDING",
            variance=0,
            extraction_confidence=100
        )
        
        return InvoiceResponse(
            success=True,
            message="Invoice validated successfully",
            invoice=validated,
            errors=None
        )
    except Exception as e:
        return InvoiceResponse(
            success=False,
            message="Validation failed",
            invoice=None,
            errors=[str(e)]
        )
