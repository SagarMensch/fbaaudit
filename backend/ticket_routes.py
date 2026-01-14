"""
Ticket Routing System with AI Classification
Stores tickets in MySQL, routes to correct persona based on AI analysis
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import mysql.connector
import requests
import logging

from db_config import DB_CONFIG

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

# MySQL Connection using centralized config
def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# Pydantic Models
class CreateTicketRequest(BaseModel):
    supplier_id: str
    supplier_name: str
    subject: str
    message: str

class TicketMessageRequest(BaseModel):
    sender: str
    role: str  # VENDOR, AUDITOR, SYSTEM
    content: str

class TicketMessage(BaseModel):
    id: int
    ticket_id: str
    sender: str
    role: str
    content: str
    created_at: str

class Ticket(BaseModel):
    id: int
    ticket_id: str
    supplier_id: str
    supplier_name: str
    subject: str
    status: str
    priority: str
    assigned_to: str
    category: str
    created_at: str
    messages: List[TicketMessage] = []

# AI Classification using Ollama
PERSONA_MAPPING = {
    "finance": {"name": "Zeya Kapoor", "role": "Finance Manager"},
    "logistics": {"name": "Kaai Bansal", "role": "Logistics Ops"},
    "contracts": {"name": "Atlas", "role": "Enterprise Director"},
    "technical": {"name": "System Admin", "role": "Super User"}
}

def classify_ticket_ai(subject: str, message: str) -> str:
    """Use Ollama to classify ticket into category"""
    prompt = f"""Classify this support ticket into exactly one category.

TICKET SUBJECT: {subject}
TICKET MESSAGE: {message}

CATEGORIES:
- finance: payment issues, invoice disputes, amounts, pending payments, refunds
- logistics: delivery delays, shipment tracking, driver issues, truck problems, ETA
- contracts: rate disputes, contract terms, pricing agreements, SLA violations
- technical: login problems, system errors, password reset, access issues

Respond with ONLY the category name (finance, logistics, contracts, or technical). Nothing else."""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False, "options": {"temperature": 0.1}},
            timeout=15
        )
        if response.status_code == 200:
            category = response.json().get("response", "").strip().lower()
            if category in PERSONA_MAPPING:
                return category
    except Exception as e:
        logger.error(f"AI classification failed: {e}")
    
    # Fallback: keyword-based classification
    text = (subject + " " + message).lower()
    if any(w in text for w in ["payment", "invoice", "amount", "pending", "due", "refund"]):
        return "finance"
    elif any(w in text for w in ["delivery", "shipment", "delay", "truck", "driver", "eta", "tracking"]):
        return "logistics"
    elif any(w in text for w in ["contract", "rate", "agreement", "pricing", "sla"]):
        return "contracts"
    else:
        return "technical"

def init_tables():
    """Create tables if they don't exist"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id VARCHAR(20) UNIQUE,
            supplier_id VARCHAR(50),
            supplier_name VARCHAR(100),
            subject VARCHAR(255),
            status ENUM('OPEN','IN_PROGRESS','RESOLVED') DEFAULT 'OPEN',
            priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
            assigned_to VARCHAR(100),
            category VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ticket_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id VARCHAR(20),
            sender VARCHAR(100),
            role VARCHAR(20),
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ticket (ticket_id)
        )
    """)
    
    db.commit()
    cursor.close()
    db.close()
    logger.info("Ticket tables initialized")

# Initialize tables on import
try:
    init_tables()
except Exception as e:
    logger.warning(f"Could not init tables (DB may not be ready): {e}")

@router.post("/", response_model=Ticket)
async def create_ticket(request: CreateTicketRequest):
    """Create a new ticket - AI routes it to correct persona"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Generate ticket ID
        ticket_id = f"TKT-{datetime.now().strftime('%H%M%S')}"
        
        # AI Classification
        category = classify_ticket_ai(request.subject, request.message)
        assigned_to = PERSONA_MAPPING[category]["name"]
        
        logger.info(f"Ticket {ticket_id} classified as '{category}' → assigned to {assigned_to}")
        
        # Insert ticket
        cursor.execute("""
            INSERT INTO tickets (ticket_id, supplier_id, supplier_name, subject, assigned_to, category)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (ticket_id, request.supplier_id, request.supplier_name, request.subject, assigned_to, category))
        
        # Insert initial message
        cursor.execute("""
            INSERT INTO ticket_messages (ticket_id, sender, role, content)
            VALUES (%s, %s, %s, %s)
        """, (ticket_id, request.supplier_name, "VENDOR", request.message))
        
        db.commit()
        
        # Return created ticket
        cursor.execute("SELECT * FROM tickets WHERE ticket_id = %s", (ticket_id,))
        ticket = cursor.fetchone()
        ticket['messages'] = []
        ticket['created_at'] = str(ticket['created_at'])
        
        cursor.execute("SELECT * FROM ticket_messages WHERE ticket_id = %s", (ticket_id,))
        for msg in cursor.fetchall():
            msg['created_at'] = str(msg['created_at'])
            ticket['messages'].append(msg)
        
        return ticket
        
    finally:
        cursor.close()
        db.close()

@router.get("/", response_model=List[Ticket])
async def get_tickets(assignee: Optional[str] = None, supplier_id: Optional[str] = None):
    """Get tickets, optionally filtered by assignee or supplier"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        if assignee:
            cursor.execute("SELECT * FROM tickets WHERE assigned_to = %s ORDER BY created_at DESC", (assignee,))
        elif supplier_id:
            cursor.execute("SELECT * FROM tickets WHERE supplier_id = %s ORDER BY created_at DESC", (supplier_id,))
        else:
            cursor.execute("SELECT * FROM tickets ORDER BY created_at DESC")
        
        tickets = cursor.fetchall()
        
        for ticket in tickets:
            ticket['created_at'] = str(ticket['created_at'])
            cursor.execute("SELECT * FROM ticket_messages WHERE ticket_id = %s ORDER BY created_at", (ticket['ticket_id'],))
            ticket['messages'] = []
            for msg in cursor.fetchall():
                msg['created_at'] = str(msg['created_at'])
                ticket['messages'].append(msg)
        
        return tickets
        
    finally:
        cursor.close()
        db.close()

@router.get("/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str):
    """Get single ticket with messages"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM tickets WHERE ticket_id = %s", (ticket_id,))
        ticket = cursor.fetchone()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        ticket['created_at'] = str(ticket['created_at'])
        cursor.execute("SELECT * FROM ticket_messages WHERE ticket_id = %s ORDER BY created_at", (ticket_id,))
        ticket['messages'] = []
        for msg in cursor.fetchall():
            msg['created_at'] = str(msg['created_at'])
            ticket['messages'].append(msg)
        
        return ticket
        
    finally:
        cursor.close()
        db.close()

@router.post("/{ticket_id}/messages", response_model=TicketMessage)
async def add_message(ticket_id: str, request: TicketMessageRequest):
    """Add a message to a ticket"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Check ticket exists
        cursor.execute("SELECT * FROM tickets WHERE ticket_id = %s", (ticket_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Insert message
        cursor.execute("""
            INSERT INTO ticket_messages (ticket_id, sender, role, content)
            VALUES (%s, %s, %s, %s)
        """, (ticket_id, request.sender, request.role, request.content))
        
        # Update ticket status if vendor responded
        if request.role == "VENDOR":
            cursor.execute("UPDATE tickets SET status = 'OPEN' WHERE ticket_id = %s", (ticket_id,))
        elif request.role == "AUDITOR":
            cursor.execute("UPDATE tickets SET status = 'IN_PROGRESS' WHERE ticket_id = %s", (ticket_id,))
        
        db.commit()
        
        # Return the message
        cursor.execute("SELECT * FROM ticket_messages WHERE id = LAST_INSERT_ID()")
        msg = cursor.fetchone()
        msg['created_at'] = str(msg['created_at'])
        
        return msg
        
    finally:
        cursor.close()
        db.close()

@router.put("/{ticket_id}/status")
async def update_status(ticket_id: str, status: str):
    """Update ticket status"""
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute("UPDATE tickets SET status = %s WHERE ticket_id = %s", (status, ticket_id))
        db.commit()
        return {"success": True, "ticket_id": ticket_id, "status": status}
    finally:
        cursor.close()
        db.close()
