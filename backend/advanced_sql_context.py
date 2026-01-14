"""
Advanced SQL Context Provider for RAG Chatbot
==============================================
Uses advanced PostgreSQL features to answer ANY question:
- Full-text search
- JSONB queries for nested data
- Window functions for rankings
- CTEs for complex analytics
- Array operations
- Comprehensive aggregations
"""

import json
from typing import Dict, List, Any
from services.db_service import get_db_connection


class AdvancedSQLContext:
    """
    Advanced SQL query engine for RAG chatbot.
    Handles complex analytical questions using PostgreSQL's full power.
    """
    
    @staticmethod
    def get_comprehensive_context(query: str) -> str:
        """
        Get comprehensive context from PostgreSQL for ANY question.
        Uses advanced SQL features to extract maximum relevant information.
        """
        context_parts = []
        query_lower = query.lower()
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # ================================================================
            # VENDOR QUERIES - Comprehensive vendor information
            # ================================================================
            vendor_keywords = ['vendor', 'supplier', 'carrier', 'transporter', 'tci', 
                             'blue dart', 'mahindra', 'vrl', 'gati', 'safexpress',
                             'delhivery', 'allcargo', 'rivigo', 'maersk', 'professional']
            
            if any(kw in query_lower for kw in vendor_keywords):
                # Advanced vendor query with aggregated stats
                cursor.execute("""
                    WITH vendor_stats AS (
                        SELECT 
                            v.id,
                            v.name,
                            v.type,
                            v.gstin,
                            v.city,
                            v.state,
                            v.performance_grade,
                            v.contact_person,
                            v.email,
                            v.phone,
                            COUNT(DISTINCT c.id) as total_contracts,
                            COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' THEN c.id END) as active_contracts,
                            COALESCE(SUM(CASE WHEN i.status = 'APPROVED' THEN i.total_amount ELSE 0 END), 0) as total_approved_amount,
                            COUNT(DISTINCT i.id) as total_invoices,
                            AVG(CASE WHEN i.status = 'APPROVED' THEN i.total_amount END) as avg_invoice_amount
                        FROM vendors v
                        LEFT JOIN contracts c ON c.vendor_name = v.name
                        LEFT JOIN invoices i ON i.vendor_name = v.name
                        WHERE v.is_active = TRUE
                        GROUP BY v.id, v.name, v.type, v.gstin, v.city, v.state, 
                                 v.performance_grade, v.contact_person, v.email, v.phone
                    )
                    SELECT * FROM vendor_stats
                    ORDER BY total_approved_amount DESC
                    LIMIT 20
                """)
                
                vendors = cursor.fetchall()
                if vendors:
                    formatted = []
                    for v in vendors:
                        formatted.append({
                            "id": v[0],
                            "name": v[1],
                            "type": v[2],
                            "gstin": v[3],
                            "location": f"{v[4]}, {v[5]}",
                            "grade": v[6],
                            "contact": v[7],
                            "email": v[8],
                            "phone": v[9],
                            "contracts_total": v[10],
                            "contracts_active": v[11],
                            "total_business": float(v[12] or 0),
                            "invoice_count": v[13],
                            "avg_invoice_value": float(v[14] or 0)
                        })
                    context_parts.append(f"VENDOR_ANALYTICS: {json.dumps(formatted)}")
            
            # ================================================================
            # CONTRACT QUERIES - Deep contract analysis
            # ================================================================
            contract_keywords = ['contract', 'agreement', 'terms', 'payment terms', 
                               'validity', 'expiry', 'expiring']
            
            if any(kw in query_lower for kw in contract_keywords):
                cursor.execute("""
                    WITH contract_details AS (
                        SELECT 
                            c.id,
                            c.vendor_name,
                            c.service_type,
                            c.status,
                            c.payment_terms,
                            c.valid_from,
                            c.valid_to,
                            c.is_rcm_applicable,
                            c.pvc_base_diesel_price,
                            c.pvc_reference_city,
                            c.pvc_mileage_benchmark,
                            c.accessorials,
                            COUNT(fr.id) as freight_lanes,
                            AVG(fr.base_rate) as avg_rate,
                            EXTRACT(DAYS FROM (c.valid_to - CURRENT_DATE)) as days_to_expiry
                        FROM contracts c
                        LEFT JOIN freight_rates fr ON fr.contract_id = c.id
                        GROUP BY c.id
                    )
                    SELECT * FROM contract_details
                    ORDER BY 
                        CASE 
                            WHEN status = 'ACTIVE' THEN 1 
                            WHEN status = 'PENDING' THEN 2 
                            ELSE 3 
                        END,
                        days_to_expiry ASC
                    LIMIT 15
                """)
                
                contracts = cursor.fetchall()
                if contracts:
                    formatted = []
                    for c in contracts:
                        formatted.append({
                            "id": c[0],
                            "vendor": c[1],
                            "service_type": c[2],
                            "status": c[3],
                            "payment_terms": c[4],
                            "valid_from": str(c[5]),
                            "valid_to": str(c[6]),
                            "rcm_applicable": c[7],
                            "pvc_base_diesel": float(c[8] or 0),
                            "pvc_city": c[9],
                            "pvc_mileage": float(c[10] or 0),
                            "accessorials": c[11],
                            "freight_lanes_count": c[12],
                            "avg_rate": float(c[13] or 0),
                            "days_until_expiry": int(c[14] or 0)
                        })
                    context_parts.append(f"CONTRACT_DETAILS: {json.dumps(formatted)}")
            
            # ================================================================
            # FREIGHT RATE QUERIES - Rate intelligence
            # ================================================================
            rate_keywords = ['rate', 'freight', 'price', 'cost', 'lane', 'route',
                           'origin', 'destination', 'vehicle']
            
            if any(kw in query_lower for kw in rate_keywords):
                cursor.execute("""
                    WITH rate_analytics AS (
                        SELECT 
                            fr.id,
                            fr.origin,
                            fr.destination,
                            fr.vehicle_type,
                            fr.base_rate,
                            fr.min_charge,
                            fr.per_kg_rate,
                            fr.transit_time_hrs,
                            c.vendor_name,
                            c.status as contract_status,
                            c.payment_terms,
                            -- Calculate competitive index
                            RANK() OVER (
                                PARTITION BY fr.origin, fr.destination, fr.vehicle_type 
                                ORDER BY fr.base_rate ASC
                            ) as rate_rank,
                            COUNT(*) OVER (
                                PARTITION BY fr.origin, fr.destination, fr.vehicle_type
                            ) as competitors_on_lane
                        FROM freight_rates fr
                        INNER JOIN contracts c ON c.id = fr.contract_id
                        WHERE fr.is_active = TRUE AND c.status = 'ACTIVE'
                    )
                    SELECT * FROM rate_analytics
                    ORDER BY rate_rank, base_rate
                    LIMIT 30
                """)
                
                rates = cursor.fetchall()
                if rates:
                    formatted = []
                    for r in rates:
                        formatted.append({
                            "id": r[0],
                            "lane": f"{r[1]} → {r[2]}",
                            "origin": r[1],
                            "destination": r[2],
                            "vehicle": r[3],
                            "base_rate": float(r[4] or 0),
                            "min_charge": float(r[5] or 0),
                            "per_kg_rate": float(r[6] or 0),
                            "transit_time_hrs": r[7],
                            "vendor": r[8],
                            "contract_status": r[9],
                            "payment_terms": r[10],
                            "competitive_rank": r[11],
                            "competitors_count": r[12]
                        })
                    context_parts.append(f"RATE_INTELLIGENCE: {json.dumps(formatted)}")
            
            # ================================================================
            # INVOICE QUERIES - Invoice analytics
            # ================================================================
            invoice_keywords = ['invoice', 'bill', 'payment', 'pending', 'approved',
                              'amount', 'shipment', 'freight charge']
            
            if any(kw in query_lower for kw in invoice_keywords):
                cursor.execute("""
                    WITH invoice_analytics AS (
                        SELECT 
                            i.id,
                            i.invoice_number,
                            i.vendor_name,
                            i.origin,
                            i.destination,
                            i.vehicle_number,
                            i.vehicle_type,
                            i.material_description,
                            i.weight,
                            i.freight_charge,
                            i.fuel_surcharge,
                            i.total_amount,
                            i.status,
                            i.approval_date,
                            i.payment_status,
                            i.created_at,
                            -- Calculate metrics
                            (i.total_amount / NULLIF(i.weight, 0)) as cost_per_kg,
                            EXTRACT(DAYS FROM (CURRENT_DATE - i.created_at::date)) as days_pending,
                            -- Rank by amount
                            DENSE_RANK() OVER (
                                PARTITION BY i.vendor_name, i.status
                                ORDER BY i.total_amount DESC
                            ) as amount_rank_by_vendor
                        FROM invoices i
                    )
                    SELECT * FROM invoice_analytics
                    ORDER BY created_at DESC
                    LIMIT 25
                """)
                
                invoices = cursor.fetchall()
                if invoices:
                    formatted = []
                    for inv in invoices:
                        formatted.append({
                            "id": inv[0],
                            "invoice_number": inv[1],
                            "vendor": inv[2],
                            "route": f"{inv[3]} → {inv[4]}",
                            "vehicle": f"{inv[5]} ({inv[6]})",
                            "material": inv[7],
                            "weight_kg": float(inv[8] or 0),
                            "freight_charge": float(inv[9] or 0),
                            "fuel_surcharge": float(inv[10] or 0),
                            "total_amount": float(inv[11] or 0),
                            "status": inv[12],
                            "approval_date": str(inv[13]) if inv[13] else None,
                            "payment_status": inv[14],
                            "created_date": str(inv[15]),
                            "cost_per_kg": float(inv[16] or 0) if inv[16] else 0,
                            "days_pending": int(inv[17] or 0),
                            "amount_rank": inv[18]
                        })
                    context_parts.append(f"INVOICE_ANALYTICS: {json.dumps(formatted)}")
            
            # ================================================================
            # RESOLUTION TICKET QUERIES - Ticket tracking and support
            # ================================================================
            ticket_keywords = ['ticket', 'resolution', 'support', 'help', 'issue', 
                             'problem', 'dispute', 'complaint', 'query', 'request']
            
            if any(kw in query_lower for kw in ticket_keywords):
                cursor.execute("""
                    WITH ticket_details AS (
                        SELECT 
                            t.id,
                            t.ticket_id,
                            t.supplier_id,
                            t.supplier_name,
                            t.subject,
                            t.status,
                            t.priority,
                            t.assigned_to,
                            t.category,
                            t.created_at,
                            -- Count messages in thread
                            COUNT(m.id) as message_count,
                            -- Latest message timestamp
                            MAX(m.created_at) as last_activity,
                            -- Days since creation
                            EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - t.created_at)) as days_open
                        FROM resolution_tickets t
                        LEFT JOIN ticket_messages m ON m.ticket_id = t.ticket_id
                        GROUP BY t.id, t.ticket_id, t.supplier_id, t.supplier_name, 
                                 t.subject, t.status, t.priority, t.assigned_to, 
                                 t.category, t.created_at
                    )
                    SELECT * FROM ticket_details
                    ORDER BY 
                        CASE status
                            WHEN 'OPEN' THEN 1
                            WHEN 'IN_PROGRESS' THEN 2
                            WHEN 'AWAITING_RESPONSE' THEN 3
                            WHEN 'RESOLVED' THEN 4
                            WHEN 'CLOSED' THEN 5
                            ELSE 6
                        END,
                        created_at DESC
                    LIMIT 20
                """)
                
                tickets = cursor.fetchall()
                if tickets:
                    formatted = []
                    for t in tickets:
                        ticket_data = {
                            "id": t[0],
                            "ticket_id": t[1],
                            "supplier_id": t[2],
                            "supplier_name": t[3],
                            "subject": t[4],
                            "status": t[5],
                            "priority": t[6],
                            "assigned_to": t[7],
                            "category": t[8],
                            "created_at": str(t[9]),
                            "message_count": t[10],
                            "last_activity": str(t[11]) if t[11] else str(t[9]),
                            "days_open": int(t[12] or 0)
                        }
                        
                        # Also get the latest message for context
                        cursor.execute("""
                            SELECT sender, role, content, created_at
                            FROM ticket_messages
                            WHERE ticket_id = %s
                            ORDER BY created_at DESC
                            LIMIT 1
                        """, (t[1],))
                        
                        latest_msg = cursor.fetchone()
                        if latest_msg:
                            ticket_data["latest_message"] = {
                                "sender": latest_msg[0],
                                "role": latest_msg[1],
                                "content": latest_msg[2][:200],  # First 200 chars
                                "time": str(latest_msg[3])
                            }
                        
                        formatted.append(ticket_data)
                    
                    context_parts.append(f"RESOLUTION_TICKETS: {json.dumps(formatted)}")
                    
                    # Also add ticket stats
                    cursor.execute("""
                        SELECT 
                            status,
                            COUNT(*) as count,
                            AVG(EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - created_at))) as avg_days_open
                        FROM resolution_tickets
                        GROUP BY status
                    """)
                    ticket_stats = cursor.fetchall()
                    if ticket_stats:
                        stats_formatted = {
                            stat[0]: {
                                "count": stat[1],
                                "avg_days_open": round(float(stat[2] or 0), 1)
                            } for stat in ticket_stats
                        }
                        context_parts.append(f"TICKET_STATS: {json.dumps(stats_formatted)}")
            
            # ================================================================
            # AGGREGATED METRICS - Overall system statistics
            # ================================================================
            metrics_keywords = ['total', 'count', 'how many', 'statistics', 'stats',
                              'summary', 'overview', 'all']
            
            if any(kw in query_lower for kw in metrics_keywords):
                cursor.execute("""
                    SELECT 
                        'vendors' as metric_type,
                        COUNT(DISTINCT id) as count,
                        json_build_object(
                            'active', COUNT(DISTINCT CASE WHEN is_active THEN id END),
                            'with_contracts', COUNT(DISTINCT CASE WHEN EXISTS(
                                SELECT 1 FROM contracts c WHERE c.vendor_name = vendors.name
                            ) THEN id END)
                        ) as breakdown
                    FROM vendors
                    
                    UNION ALL
                    
                    SELECT 
                        'contracts',
                        COUNT(*),
                        json_build_object(
                            'active', COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END),
                            'expiring_soon', COUNT(CASE WHEN status = 'ACTIVE' AND 
                                EXTRACT(DAYS FROM (valid_to - CURRENT_DATE)) < 90 THEN 1 END),
                            'pending', COUNT(CASE WHEN status = 'PENDING' THEN 1 END)
                        )
                    FROM contracts
                    
                    UNION ALL
                    
                    SELECT 
                        'freight_lanes',
                        COUNT(*),
                        json_build_object(
                            'active', COUNT(CASE WHEN is_active THEN 1 END),
                            'avg_rate', ROUND(AVG(base_rate)::numeric, 2)
                        )
                    FROM freight_rates
                    
                    UNION ALL
                    
                    SELECT 
                        'invoices',
                        COUNT(*),
                        json_build_object(
                            'total_value', ROUND(SUM(total_amount)::numeric, 2),
                            'approved', COUNT(CASE WHEN status = 'APPROVED' THEN 1 END),
                            'pending', COUNT(CASE WHEN status = 'PENDING' THEN 1 END),
                            'avg_amount', ROUND(AVG(total_amount)::numeric, 2)
                        )
                    FROM invoices
                """)
                
                metrics = cursor.fetchall()
                if metrics:
                    formatted = {m[0]: {"count": m[1], "details": m[2]} for m in metrics}
                    context_parts.append(f"SYSTEM_METRICS: {json.dumps(formatted)}")
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"❌ Advanced SQL context error: {e}")
            import traceback
            traceback.print_exc()
        
        return "\n\n".join(context_parts) if context_parts else ""
