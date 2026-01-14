from services.db_service import get_db_connection, get_cursor
import uuid
from datetime import datetime

class InvoiceDBService:
    def get_invoices(self, supplier_id=None, status=None, page=1, limit=10):
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        offset = (page - 1) * limit
        
        query = "SELECT * FROM invoices WHERE 1=1"
        params = []
        
        if supplier_id:
            query += " AND vendor_id = %s"
            params.append(supplier_id)
            
        if status and status != 'ALL':
            query += " AND status = %s"
            params.append(status)
            
        # Add sorting and pagination
        query += " ORDER BY invoice_date DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, tuple(params))
        invoices = cursor.fetchall()
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) as total FROM invoices WHERE 1=1"
        count_params = []
        
        if supplier_id:
            count_query += " AND vendor_id = %s"
            count_params.append(supplier_id)
            
        if status and status != 'ALL':
            count_query += " AND status = %s"
            count_params.append(status)
            
        cursor.execute(count_query, tuple(count_params))
        total = cursor.fetchone()['total']
        
        cursor.close()
        conn.close()
        
        return {
            'invoices': invoices,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': (total + limit - 1) // limit
        }

    def update_status(self, invoice_id, status, remarks=None, updated_by=None):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                UPDATE invoices 
                SET status = %s, 
                    remarks = COALESCE(%s, remarks),
                    updated_by = COALESCE(%s, updated_by),
                    updated_at = NOW()
                WHERE invoice_id = %s
            """
            cursor.execute(query, (status, remarks, updated_by, invoice_id))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as err:
            print(f"Error updating invoice: {err}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def create_notification(self, supplier_id, type, subject, message, priority='medium'):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                INSERT INTO notifications 
                (id, supplier_id, type, subject, message, priority, is_read, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, FALSE, NOW())
            """
            # Generate a simple ID or let DB handle it if auto-increment
            # For now, assuming string ID based on type and time
            notif_id = f"notif_{int(datetime.now().timestamp())}"
            
            cursor.execute(query, (notif_id, supplier_id, type, subject, message, priority))
            conn.commit()
            return notif_id
        except Exception as err:
            print(f"Error creating notification: {err}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()

    def get_notifications_for_user(self, user_id):
        """Get all notifications for a specific user/persona."""
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        try:
            query = """
                SELECT * FROM notifications 
                WHERE recipient_id = %s OR supplier_id = %s
                ORDER BY created_at DESC
                LIMIT 50
            """
            cursor.execute(query, (user_id, user_id))
            notifications = cursor.fetchall()
            return notifications
        except Exception as err:
            print(f"Error fetching notifications: {err}")
            return []
        finally:
            cursor.close()
            conn.close()

    def create_notification_for_user(self, recipient_id, type, subject, message, priority='medium', related_invoice=None):
        """Create notification for a specific user/persona."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                INSERT INTO notifications 
                (id, recipient_id, supplier_id, type, subject, message, priority, is_read, related_invoice, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE, %s, NOW())
            """
            notif_id = f"notif_{int(datetime.now().timestamp())}"
            
            cursor.execute(query, (notif_id, recipient_id, recipient_id, type, subject, message, priority, related_invoice))
            conn.commit()
            return notif_id
        except Exception as err:
            print(f"Error creating notification for user: {err}")
            conn.rollback()
            return None
        finally:
            cursor.close()
            conn.close()

    def create_invoice(self, invoice_data):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Map to supplier_invoices table in schema.sql
            query = """
                INSERT INTO supplier_invoices 
                (id, invoice_number, supplier_id, amount, status, invoice_date, items, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """
            
            import json
            
            # Serialize items
            line_items_json = json.dumps(invoice_data.get('lineItems', []))
            
            # Helper to parse amount string to float
            def parse_amount(amt_str):
                try:
                    if isinstance(amt_str, (int, float)):
                        return float(amt_str)
                    return float(str(amt_str).replace(',', '').replace('₹', '').replace('$', '').strip())
                except:
                    return 0.0

            params = (
                invoice_data.get('id') or str(uuid.uuid4()),
                invoice_data.get('invoiceNumber'),
                invoice_data.get('vendor') or 'UNKNOWN', # Mapped from frontend 'vendor' field
                parse_amount(invoice_data.get('totalAmount')),
                'PENDING_VERIFICATION', # Initial status
                invoice_data.get('date'),
                line_items_json
            )
            
            cursor.execute(query, params)
            conn.commit()
            print(f"DEBUG: Invoice inserted into supplier_invoices: {invoice_data.get('invoiceNumber')}")
            return True
        except Exception as err:
            print(f"Error creating invoice: {err}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def get_pending_invoices_for_approver(self, approver_role: str = None):
        """Get all pending invoices for a specific approver role."""
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        try:
            query = """
                SELECT * FROM supplier_invoices 
                WHERE status IN ('PENDING', 'PENDING_VERIFICATION', 'DRAFT')
                ORDER BY created_at DESC
                LIMIT 50
            """
            cursor.execute(query)
            invoices = cursor.fetchall()
            return invoices
        except Exception as err:
            print(f"Error fetching pending invoices: {err}")
            return []
        finally:
            cursor.close()
            conn.close()

    def update_status(self, invoice_id: str, status: str, remarks: str = None, updated_by: str = None):
        """Update invoice status in MySQL database."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                UPDATE supplier_invoices 
                SET status = %s
                WHERE id = %s OR invoice_number = %s
            """
            cursor.execute(query, (status, invoice_id, invoice_id))
            conn.commit()
            
            rows_affected = cursor.rowcount
            print(f"DEBUG: Updated invoice {invoice_id} to status {status}. Rows affected: {rows_affected}")
            return rows_affected > 0
        except Exception as err:
            print(f"Error updating invoice status: {err}")
            return False
        finally:
            cursor.close()
            conn.close()

    def get_invoices_for_supplier(self, supplier_id: str):
        """Get all invoices for a specific supplier to show them their submission status."""
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        try:
            query = """
                SELECT * FROM supplier_invoices 
                WHERE supplier_id = %s
                ORDER BY created_at DESC
                LIMIT 50
            """
            cursor.execute(query, (supplier_id,))
            invoices = cursor.fetchall()
            return invoices
        except Exception as err:
            print(f"Error fetching supplier invoices: {err}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_all_invoices(self):
        """Get all invoices from MySQL for the main workbench view."""
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        try:
            query = """
                SELECT * FROM supplier_invoices 
                ORDER BY created_at DESC
                LIMIT 100
            """
            cursor.execute(query)
            invoices = cursor.fetchall()
            
            # Convert to frontend-compatible format
            formatted_invoices = []
            for inv in invoices:
                formatted_invoices.append({
                    'id': inv.get('id'),
                    'invoiceNumber': inv.get('invoice_number'),
                    'carrier': inv.get('supplier_id', 'Unknown Carrier'),
                    'origin': 'MUMBAI',  # Default for now
                    'destination': 'DELHI',  # Default for now
                    'amount': float(inv.get('amount', 0)),
                    'currency': 'INR',
                    'date': str(inv.get('invoice_date', '')),
                    'status': inv.get('status', 'PENDING'),
                    'variance': 0,
                    'source': 'MYSQL',
                    'created_at': str(inv.get('created_at', ''))
                })
            
            return formatted_invoices
        except Exception as err:
            print(f"Error fetching all invoices: {err}")
            return []
        finally:
            cursor.close()
            conn.close()

    def ensure_documents_table(self):
        """Create invoice_documents table if it doesn't exist."""
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS invoice_documents (
                    id VARCHAR(50) PRIMARY KEY,
                    invoice_id VARCHAR(50) NOT NULL,
                    doc_type VARCHAR(50) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    file_size INT,
                    mime_type VARCHAR(100),
                    uploaded_by VARCHAR(100),
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("[DB] invoice_documents table ensured.")
        except Exception as err:
            print(f"Error creating invoice_documents table: {err}")
        finally:
            cursor.close()
            conn.close()

    def save_document(self, invoice_id: str, doc_type: str, file_name: str, file_path: str, file_size: int = None, uploaded_by: str = None):
        """Save a document record linked to an invoice."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            doc_id = str(uuid.uuid4())
            query = """
                INSERT INTO invoice_documents (id, invoice_id, doc_type, file_name, file_path, file_size, uploaded_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (doc_id, invoice_id, doc_type, file_name, file_path, file_size, uploaded_by))
            conn.commit()
            print(f"[DB] Saved document {doc_type} for invoice {invoice_id}")
            return doc_id
        except Exception as err:
            print(f"Error saving document: {err}")
            return None
        finally:
            cursor.close()
            conn.close()

    def get_documents_for_invoice(self, invoice_id: str):
        """Get all documents linked to a specific invoice."""
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        try:
            query = """
                SELECT * FROM invoice_documents 
                WHERE invoice_id = %s
                ORDER BY uploaded_at DESC
            """
            cursor.execute(query, (invoice_id,))
            documents = cursor.fetchall()
            
            # Convert timestamps to strings
            for doc in documents:
                if doc.get('uploaded_at'):
                    doc['uploaded_at'] = str(doc['uploaded_at'])
            
            return documents
        except Exception as err:
            print(f"Error fetching documents for invoice {invoice_id}: {err}")
            return []
        finally:
            cursor.close()
            conn.close()

invoice_db_service = InvoiceDBService()

# Ensure the documents table exists on module load
invoice_db_service.ensure_documents_table()
