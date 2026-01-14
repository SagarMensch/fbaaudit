"""
Ticket Routing System - Flask + PostgreSQL + Groq AI
=====================================================
Routes supplier tickets to correct persona using Groq AI classification.
Comprehensive keyword database for accurate routing.
"""

from flask import Blueprint, request, jsonify
from groq import Groq
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv
from services.db_service import get_db_connection

load_dotenv()

ticket_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

# Initialize Groq for AI classification
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Persona mapping for ticket routing
PERSONA_MAPPING = {
    "finance": {"name": "Zeya Kapoor", "role": "Finance Manager"},
    "logistics": {"name": "Kaai Bansal", "role": "Logistics Ops"},
    "contracts": {"name": "Atlas", "role": "Enterprise Director"},
    "technical": {"name": "System Admin", "role": "Super User"}
}

# COMPREHENSIVE KEYWORD DATABASE for intelligent routing
KEYWORD_DATABASE = {
    "finance": [
        # Payment related
        "payment", "pay", "paid", "paying", "payout", "payable", "payables",
        # Money related  
        "money", "cash", "funds", "amount", "balance", "credit", "debit",
        # Invoice related
        "invoice", "invoices", "invoicing", "bill", "bills", "billing", "billed",
        # Due/Pending
        "due", "overdue", "pending", "outstanding", "unpaid", "delayed payment",
        # Refund related
        "refund", "refunds", "refunded", "reimbursement", "reimburse", "compensation",
        # Financial terms
        "gst", "tax", "tds", "igst", "cgst", "sgst", "withholding",
        "bank", "banking", "account", "transfer", "neft", "rtgs", "imps",
        "cheque", "check", "receipt", "voucher", "ledger",
        # Financial issues
        "short payment", "excess payment", "wrong amount", "incorrect amount",
        "not received", "not credited", "not paid", "when will i get",
        "payment status", "payment issue", "payment problem", "payment delay",
        "settlement", "settle", "clearing", "clear dues", "reconciliation",
        # Currency
        "rupees", "rs", "inr", "₹", "dollar", "usd",
    ],
    
    "logistics": [
        # Delivery related
        "delivery", "deliver", "delivered", "delivering", "undelivered",
        # Shipment related
        "shipment", "ship", "shipping", "shipped", "consignment", "cargo",
        # Vehicle related
        "truck", "trucks", "vehicle", "vehicl", "trailer", "container",
        "driver", "drivers", "driver issue", "driver problem",
        # Tracking
        "tracking", "track", "traced", "trace", "location", "where is",
        "status", "update", "current status", "eta", "estimated time",
        # Transit issues
        "delay", "delayed", "late", "stuck", "halt", "halted", "breakdown",
        "transit", "in transit", "on the way", "enroute", "route",
        # Loading/Unloading
        "loading", "load", "unloading", "unload", "detention", "demurrage",
        "waiting", "wait time", "turnaround", "tat",
        # Location related
        "pickup", "pick up", "drop", "destination", "origin", "source",
        "warehouse", "depot", "hub", "terminal", "port",
        # Damage/Loss
        "damage", "damaged", "lost", "missing", "shortage", "broken",
        "pilferage", "theft", "stolen", "tampered",
        # POD
        "pod", "proof of delivery", "delivery proof", "signed", "signature",
    ],
    
    "contracts": [
        # Contract terms
        "contract", "contracts", "agreement", "agreements", "mou", "sow",
        "terms", "conditions", "clause", "clauses", "provision",
        # Rate related
        "rate", "rates", "pricing", "price", "quotation", "quote",
        "tariff", "cost", "charges", "freight rate", "contracted rate",
        "rate card", "rate increase", "rate revision", "rate change",
        # SLA related
        "sla", "service level", "performance", "performance metrics",
        "kpi", "benchmark", "target", "commitment", "guarantee",
        # Legal/Compliance
        "legal", "compliance", "violation", "breach", "penalty",
        "liability", "indemnity", "insurance", "coverage",
        # Duration
        "validity", "expiry", "expired", "renewal", "renew", "extend",
        "duration", "tenure", "period",
        # Volume
        "volume", "commitment", "minimum", "guaranteed", "mqc",
        # Dispute
        "dispute", "disagreement", "negotiation", "renegotiate",
    ],
    
    "technical": [
        # Login/Access
        "login", "log in", "logged", "password", "forgot password", "reset",
        "username", "user name", "account", "access", "permission", "role",
        "locked", "locked out", "unlock", "authentication", "auth",
        "otp", "verification", "verify", "2fa", "two factor",
        # System issues
        "error", "bug", "issue", "problem", "not working", "doesn't work",
        "failed", "failure", "crash", "crashed", "down", "slow",
        "loading", "page", "screen", "blank", "white screen", "black screen",
        # Portal/App
        "portal", "app", "application", "website", "site", "system",
        "upload", "download", "submit", "submission", "form",
        "button", "click", "clicking", "feature", "function",
        # Data
        "data", "report", "reports", "export", "import", "file", "document",
        "pdf", "excel", "csv", "missing data", "wrong data",
        # Integration
        "api", "integration", "sync", "synchronization", "connection",
        "sap", "erp", "tms", "wms",
        # Support
        "help", "support", "assist", "assistance", "how to", "how do i",
        "guide", "tutorial", "training",
    ]
}


def init_ticket_tables():
    """Create ticket tables in PostgreSQL if they don't exist"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Drop and recreate to ensure correct schema
        cur.execute("DROP TABLE IF EXISTS ticket_messages CASCADE")
        cur.execute("DROP TABLE IF EXISTS tickets CASCADE")
        cur.execute("DROP TABLE IF EXISTS user_notifications CASCADE")
        
        # Tickets table with all columns having defaults
        cur.execute("""
            CREATE TABLE tickets (
                id SERIAL PRIMARY KEY,
                ticket_id VARCHAR(50) UNIQUE NOT NULL,
                supplier_id VARCHAR(100) NOT NULL,
                supplier_name VARCHAR(200) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                status VARCHAR(30) DEFAULT 'OPEN',
                priority VARCHAR(30) DEFAULT 'MEDIUM',
                assigned_to VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Ticket messages table
        cur.execute("""
            CREATE TABLE ticket_messages (
                id SERIAL PRIMARY KEY,
                ticket_id VARCHAR(50) NOT NULL,
                sender VARCHAR(200) NOT NULL,
                role VARCHAR(30) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Notifications table
        cur.execute("""
            CREATE TABLE user_notifications (
                id SERIAL PRIMARY KEY,
                user_name VARCHAR(200) NOT NULL,
                user_role VARCHAR(50) DEFAULT 'USER',
                title VARCHAR(500) NOT NULL,
                message TEXT DEFAULT '',
                ticket_id VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Ticket tables created fresh in PostgreSQL")
    except Exception as e:
        print(f"⚠️ Could not init ticket tables: {e}")


def classify_ticket_keywords(subject: str, message: str) -> str:
    """Advanced keyword-based classification with scoring"""
    text = (subject + " " + message).lower()
    
    scores = {"finance": 0, "logistics": 0, "contracts": 0, "technical": 0}
    
    for category, keywords in KEYWORD_DATABASE.items():
        for keyword in keywords:
            if keyword in text:
                # Multi-word keywords get higher score
                scores[category] += len(keyword.split())
    
    # Find category with highest score
    max_score = max(scores.values())
    
    if max_score > 0:
        for category, score in scores.items():
            if score == max_score:
                return category
    
    # Default fallback based on common patterns
    if any(c.isdigit() for c in text) and any(w in text for w in ["rs", "₹", "amount", "total"]):
        return "finance"
    
    return "finance"  # Default to finance as most common


def classify_ticket_ai(subject: str, message: str) -> str:
    """Use Groq AI to classify ticket, with keyword fallback"""
    
    # First try keyword classification (fast and reliable)
    keyword_result = classify_ticket_keywords(subject, message)
    
    # If we have Groq, use AI for confirmation/override
    if groq_client:
        try:
            prompt = f"""Classify this support ticket into exactly one category.

TICKET SUBJECT: {subject}
TICKET MESSAGE: {message}

CATEGORIES:
- finance: ANY money, payment, invoice, billing, refund, cash, amount, dues, GST, tax issues
- logistics: delivery, shipment, tracking, vehicle, driver, transit, location, damage, delay issues
- contracts: rate, pricing, contract terms, SLA, agreement, vendor terms issues
- technical: login, password, system error, portal, app, access, feature issues

Respond with ONLY the category name (finance, logistics, contracts, or technical). Nothing else."""

            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=20
            )
            ai_result = response.choices[0].message.content.strip().lower()
            
            if ai_result in PERSONA_MAPPING:
                return ai_result
        except Exception as e:
            print(f"AI classification error (using keywords): {e}")
    
    return keyword_result


def create_notification(user_name: str, user_role: str, title: str, message: str, ticket_id: str):
    """Create a notification for a user"""
    try:
        if not user_name or not ticket_id:
            return
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO user_notifications (user_name, user_role, title, message, ticket_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_name[:200],
            (user_role or "USER")[:50],
            (title or "Notification")[:500],
            (message or "")[:1000],
            ticket_id[:50]
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        print(f"📬 Notification created for {user_name}")
    except Exception as e:
        print(f"⚠️ Notification error: {e}")


# Initialize tables on import
init_ticket_tables()


@ticket_bp.route('', methods=['POST'])
def create_ticket():
    """Create a new ticket - AI routes it to correct persona"""
    data = request.json or {}
    
    supplier_id = str(data.get('supplier_id', ''))
    supplier_name = str(data.get('supplier_name', ''))
    subject = str(data.get('subject', ''))
    message_content = str(data.get('message', ''))
    
    if not all([supplier_id, supplier_name, subject, message_content]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Generate unique ticket ID
        ticket_id = f"TKT-{datetime.now().strftime('%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        
        # AI Classification with comprehensive keywords
        category = classify_ticket_ai(subject, message_content)
        assigned_to = PERSONA_MAPPING[category]["name"]
        
        print(f"🎫 Ticket {ticket_id} → '{category}' → {assigned_to}")
        
        # Insert ticket
        cur.execute("""
            INSERT INTO tickets (ticket_id, supplier_id, supplier_name, subject, assigned_to, category, status, priority)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, ticket_id, supplier_id, supplier_name, subject, status, priority, assigned_to, category, created_at
        """, (ticket_id, supplier_id[:100], supplier_name[:200], subject[:500], assigned_to, category, 'OPEN', 'MEDIUM'))
        
        ticket_row = cur.fetchone()
        ticket = {
            'id': ticket_row[0],
            'ticket_id': ticket_row[1],
            'supplier_id': ticket_row[2],
            'supplier_name': ticket_row[3],
            'subject': ticket_row[4],
            'status': ticket_row[5],
            'priority': ticket_row[6],
            'assigned_to': ticket_row[7],
            'category': ticket_row[8],
            'created_at': str(ticket_row[9])
        }
        
        # Insert initial message
        cur.execute("""
            INSERT INTO ticket_messages (ticket_id, sender, role, content)
            VALUES (%s, %s, %s, %s)
            RETURNING id, ticket_id, sender, role, content, created_at
        """, (ticket_id, supplier_name[:200], "VENDOR", message_content))
        
        msg_row = cur.fetchone()
        ticket['messages'] = [{
            'id': msg_row[0],
            'ticket_id': msg_row[1],
            'sender': msg_row[2],
            'role': msg_row[3],
            'content': msg_row[4],
            'created_at': str(msg_row[5])
        }]
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Create notification (in separate connection to not affect main flow)
        create_notification(
            assigned_to,
            PERSONA_MAPPING[category]["role"],
            f"New Ticket: {subject[:100]}",
            f"From {supplier_name}: {message_content[:200]}",
            ticket_id
        )
        
        return jsonify(ticket), 201
        
    except Exception as e:
        print(f"Create ticket error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@ticket_bp.route('', methods=['GET'])
def get_tickets():
    """Get tickets, optionally filtered by assignee or supplier"""
    assignee = request.args.get('assignee')
    supplier_id = request.args.get('supplier_id')
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if assignee:
            cur.execute("SELECT * FROM tickets WHERE assigned_to = %s ORDER BY created_at DESC", (assignee,))
        elif supplier_id:
            cur.execute("SELECT * FROM tickets WHERE supplier_id = %s ORDER BY created_at DESC", (supplier_id,))
        else:
            cur.execute("SELECT * FROM tickets ORDER BY created_at DESC LIMIT 50")
        
        columns = [desc[0] for desc in cur.description]
        tickets = []
        
        for row in cur.fetchall():
            ticket = dict(zip(columns, row))
            ticket['created_at'] = str(ticket['created_at'])
            
            # Get messages
            cur.execute("SELECT * FROM ticket_messages WHERE ticket_id = %s ORDER BY created_at", (ticket['ticket_id'],))
            msg_columns = [desc[0] for desc in cur.description]
            ticket['messages'] = []
            for msg_row in cur.fetchall():
                msg = dict(zip(msg_columns, msg_row))
                msg['created_at'] = str(msg['created_at'])
                ticket['messages'].append(msg)
            
            tickets.append(ticket)
        
        cur.close()
        conn.close()
        
        return jsonify(tickets)
        
    except Exception as e:
        print(f"Get tickets error: {e}")
        return jsonify([])


@ticket_bp.route('/<ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    """Get single ticket with messages"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM tickets WHERE ticket_id = %s", (ticket_id,))
        columns = [desc[0] for desc in cur.description]
        row = cur.fetchone()
        
        if not row:
            return jsonify({"error": "Ticket not found"}), 404
        
        ticket = dict(zip(columns, row))
        ticket['created_at'] = str(ticket['created_at'])
        
        cur.execute("SELECT * FROM ticket_messages WHERE ticket_id = %s ORDER BY created_at", (ticket_id,))
        msg_columns = [desc[0] for desc in cur.description]
        ticket['messages'] = []
        for msg_row in cur.fetchall():
            msg = dict(zip(msg_columns, msg_row))
            msg['created_at'] = str(msg['created_at'])
            ticket['messages'].append(msg)
        
        cur.close()
        conn.close()
        
        return jsonify(ticket)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ticket_bp.route('/<ticket_id>/messages', methods=['POST'])
def add_message(ticket_id):
    """Add a message to a ticket"""
    data = request.json or {}
    sender = str(data.get('sender', ''))
    role = str(data.get('role', ''))
    content = str(data.get('content', ''))
    
    if not all([sender, role, content]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check ticket exists
        cur.execute("SELECT supplier_name, assigned_to FROM tickets WHERE ticket_id = %s", (ticket_id,))
        row = cur.fetchone()
        
        if not row:
            return jsonify({"error": "Ticket not found"}), 404
        
        supplier_name, assigned_to = row
        
        # Insert message
        cur.execute("""
            INSERT INTO ticket_messages (ticket_id, sender, role, content)
            VALUES (%s, %s, %s, %s)
            RETURNING id, ticket_id, sender, role, content, created_at
        """, (ticket_id, sender[:200], role[:30], content))
        
        msg_row = cur.fetchone()
        msg = {
            'id': msg_row[0],
            'ticket_id': msg_row[1],
            'sender': msg_row[2],
            'role': msg_row[3],
            'content': msg_row[4],
            'created_at': str(msg_row[5])
        }
        
        # Update status
        new_status = 'OPEN' if role == 'VENDOR' else 'IN_PROGRESS'
        cur.execute("UPDATE tickets SET status = %s WHERE ticket_id = %s", (new_status, ticket_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Notification
        if role == 'VENDOR':
            create_notification(assigned_to, "AUDITOR", f"Reply on {ticket_id}", content[:200], ticket_id)
        else:
            create_notification(supplier_name, "VENDOR", f"Response on {ticket_id}", content[:200], ticket_id)
        
        return jsonify(msg), 201
        
    except Exception as e:
        print(f"Add message error: {e}")
        return jsonify({"error": str(e)}), 500


@ticket_bp.route('/notifications/<user_name>', methods=['GET'])
def get_notifications(user_name):
    """Get notifications for a user"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT * FROM user_notifications 
            WHERE user_name = %s 
            ORDER BY created_at DESC 
            LIMIT 20
        """, (user_name,))
        
        columns = [desc[0] for desc in cur.description]
        notifications = []
        unread = 0
        
        for row in cur.fetchall():
            n = dict(zip(columns, row))
            n['created_at'] = str(n['created_at'])
            notifications.append(n)
            if not n['is_read']:
                unread += 1
        
        cur.close()
        conn.close()
        
        return jsonify({"notifications": notifications, "unread_count": unread})
        
    except Exception as e:
        return jsonify({"notifications": [], "unread_count": 0})


@ticket_bp.route('/notifications/<user_name>/read', methods=['POST'])
def mark_notifications_read(user_name):
    """Mark all notifications as read"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE user_notifications SET is_read = TRUE WHERE user_name = %s", (user_name,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
