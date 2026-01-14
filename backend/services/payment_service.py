"""
Payment Service - Full Payment System Backend
Handles: Batches, Transactions, Bank Reconciliation, Early Payment Discounts
"""

import uuid
import mysql.connector
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from decimal import Decimal
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import DB_CONFIG

# Database Connection - using db_config.py
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)


class PaymentService:
    """Complete Payment System Service"""
    
    # =========================================================================
    # PAYMENT QUEUE - Get invoices ready for payment
    # =========================================================================
    
    def get_payment_queue(self, status_filter: str = 'APPROVED') -> List[Dict]:
        """
        Get all approved invoices that are ready to be paid.
        These are invoices that have completed the approval workflow.
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get approved invoices not yet in a batch
            cursor.execute("""
                SELECT si.*, 
                       COALESCE(pt.status, 'AWAITING_PAYMENT') as payment_status,
                       pt.batch_id
                FROM supplier_invoices si
                LEFT JOIN payment_transactions pt ON si.id = pt.invoice_id
                WHERE si.status = %s
                  AND (pt.id IS NULL OR pt.status = 'PENDING')
                ORDER BY si.due_date ASC
            """, (status_filter,))
            
            invoices = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return invoices
        except Exception as e:
            print(f"[PaymentService] Error getting payment queue: {e}")
            return []
    
    # =========================================================================
    # PAYMENT BATCHES - Create, Approve, Process
    # =========================================================================
    
    def create_payment_batch(
        self, 
        invoice_ids: List[str], 
        payment_method: str = 'NEFT',
        scheduled_date: Optional[str] = None,
        created_by: str = 'system',
        notes: str = '',
        apply_early_discount: bool = False
    ) -> Dict:
        """
        Create a new payment batch from selected invoices.
        Optionally applies early payment discounts.
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Generate batch ID and number
            batch_id = str(uuid.uuid4())
            batch_number = f"PAY-{datetime.now().strftime('%Y%m%d')}-{batch_id[:6].upper()}"
            
            # Calculate totals from invoices (mock - would query real data)
            total_amount = Decimal('0.00')
            transactions = []
            
            for inv_id in invoice_ids:
                # Get invoice details
                cursor.execute("SELECT * FROM supplier_invoices WHERE id = %s", (inv_id,))
                invoice = cursor.fetchone()
                
                if invoice:
                    original_amount = Decimal(str(invoice['amount']))
                    discount_amount = Decimal('0.00')
                    
                    # Apply early payment discount if enabled
                    if apply_early_discount:
                        discount_info = self.calculate_early_discount(inv_id)
                        if discount_info and discount_info.get('eligible'):
                            discount_amount = original_amount * (Decimal(str(discount_info['discount_percent'])) / 100)
                    
                    final_amount = original_amount - discount_amount
                    total_amount += final_amount
                    
                    transactions.append({
                        'id': str(uuid.uuid4()),
                        'batch_id': batch_id,
                        'invoice_id': inv_id,
                        'vendor_id': invoice.get('supplier_id'),
                        'vendor_name': invoice.get('supplier_id'),  # Would lookup vendor name
                        'original_amount': float(original_amount),
                        'discount_amount': float(discount_amount),
                        'final_amount': float(final_amount),
                        'currency': 'INR',
                        'status': 'INCLUDED'
                    })
            
            # Insert batch
            cursor.execute("""
                INSERT INTO payment_batches 
                (id, batch_number, total_amount, currency, invoice_count, status, payment_method, 
                 created_by, scheduled_date, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                batch_id, batch_number, float(total_amount), 'INR', len(invoice_ids),
                'PENDING_APPROVAL', payment_method, created_by, 
                scheduled_date or datetime.now().strftime('%Y-%m-%d'), notes
            ))
            
            # Insert transactions
            for txn in transactions:
                cursor.execute("""
                    INSERT INTO payment_transactions
                    (id, batch_id, invoice_id, vendor_id, vendor_name, original_amount, 
                     discount_amount, final_amount, currency, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    txn['id'], txn['batch_id'], txn['invoice_id'], txn['vendor_id'],
                    txn['vendor_name'], txn['original_amount'], txn['discount_amount'],
                    txn['final_amount'], txn['currency'], txn['status']
                ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'batch_id': batch_id,
                'batch_number': batch_number,
                'total_amount': float(total_amount),
                'invoice_count': len(invoice_ids),
                'status': 'PENDING_APPROVAL',
                'transactions': transactions
            }
            
        except Exception as e:
            print(f"[PaymentService] Error creating batch: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_payment_batches(self, status_filter: Optional[str] = None) -> List[Dict]:
        """Get all payment batches, optionally filtered by status."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            if status_filter:
                cursor.execute("""
                    SELECT * FROM payment_batches 
                    WHERE status = %s 
                    ORDER BY created_at DESC
                """, (status_filter,))
            else:
                cursor.execute("SELECT * FROM payment_batches ORDER BY created_at DESC")
            
            batches = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return batches
        except Exception as e:
            print(f"[PaymentService] Error getting batches: {e}")
            return []
    
    def get_batch_detail(self, batch_id: str) -> Optional[Dict]:
        """Get batch details including all transactions."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get batch
            cursor.execute("SELECT * FROM payment_batches WHERE id = %s", (batch_id,))
            batch = cursor.fetchone()
            
            if not batch:
                return None
            
            # Get transactions
            cursor.execute("""
                SELECT * FROM payment_transactions 
                WHERE batch_id = %s 
                ORDER BY created_at
            """, (batch_id,))
            transactions = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            batch['transactions'] = transactions
            return batch
            
        except Exception as e:
            print(f"[PaymentService] Error getting batch detail: {e}")
            return None
    
    def approve_batch(self, batch_id: str, approver_id: str) -> Dict:
        """Approve a payment batch for processing."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE payment_batches 
                SET status = 'APPROVED', approved_by = %s, approved_at = NOW()
                WHERE id = %s AND status = 'PENDING_APPROVAL'
            """, (approver_id, batch_id))
            
            affected = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            
            if affected > 0:
                return {'success': True, 'message': 'Batch approved successfully'}
            else:
                return {'success': False, 'error': 'Batch not found or already processed'}
                
        except Exception as e:
            print(f"[PaymentService] Error approving batch: {e}")
            return {'success': False, 'error': str(e)}
    
    def process_batch(self, batch_id: str) -> Dict:
        """
        Process a batch - simulate sending to bank.
        In production, this would integrate with bank API.
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Update batch status to PROCESSING
            cursor.execute("""
                UPDATE payment_batches 
                SET status = 'PROCESSING'
                WHERE id = %s AND status = 'APPROVED'
            """, (batch_id,))
            
            # Update all transactions to PROCESSING
            cursor.execute("""
                UPDATE payment_transactions
                SET status = 'PROCESSING'
                WHERE batch_id = %s
            """, (batch_id,))
            
            conn.commit()
            
            # Simulate bank processing (in production, this would be async)
            # Generate mock bank reference
            bank_ref = f"BANK-{datetime.now().strftime('%Y%m%d%H%M%S')}-{batch_id[:6].upper()}"
            
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'status': 'PROCESSING',
                'bank_reference': bank_ref,
                'message': 'Batch sent to bank for processing'
            }
            
        except Exception as e:
            print(f"[PaymentService] Error processing batch: {e}")
            return {'success': False, 'error': str(e)}
    
    def mark_batch_paid(self, batch_id: str, bank_reference: str) -> Dict:
        """Mark a batch as paid after bank confirmation."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Update batch
            cursor.execute("""
                UPDATE payment_batches 
                SET status = 'PAID', bank_reference = %s, paid_at = NOW()
                WHERE id = %s
            """, (bank_reference, batch_id))
            
            # Update all transactions
            cursor.execute("""
                UPDATE payment_transactions
                SET status = 'PAID', payment_reference = %s, paid_at = NOW()
                WHERE batch_id = %s
            """, (bank_reference, batch_id))
            
            # Update original invoices to PAID
            cursor.execute("""
                UPDATE supplier_invoices si
                INNER JOIN payment_transactions pt ON si.id = pt.invoice_id
                SET si.status = 'PAID'
                WHERE pt.batch_id = %s
            """, (batch_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {'success': True, 'message': 'Batch marked as paid'}
            
        except Exception as e:
            print(f"[PaymentService] Error marking batch paid: {e}")
            return {'success': False, 'error': str(e)}
    
    # =========================================================================
    # BANK RECONCILIATION
    # =========================================================================
    
    def import_bank_statement(self, transactions: List[Dict], statement_id: Optional[str] = None) -> Dict:
        """
        Import bank statement transactions for reconciliation.
        Accepts list of: {date, reference, description, amount, type}
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            stmt_id = statement_id or f"STMT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            imported = 0
            
            for txn in transactions:
                recon_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO bank_reconciliations
                    (id, statement_id, transaction_date, bank_reference, description, 
                     amount, type, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'UNMATCHED')
                """, (
                    recon_id, stmt_id, txn.get('date'), txn.get('reference'),
                    txn.get('description'), txn.get('amount'), txn.get('type', 'DEBIT')
                ))
                imported += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'statement_id': stmt_id,
                'imported_count': imported,
                'message': f'Imported {imported} transactions'
            }
            
        except Exception as e:
            print(f"[PaymentService] Error importing statement: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_unmatched_transactions(self) -> List[Dict]:
        """Get bank transactions that haven't been matched yet."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT * FROM bank_reconciliations 
                WHERE status = 'UNMATCHED'
                ORDER BY transaction_date DESC
            """)
            
            transactions = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return transactions
        except Exception as e:
            print(f"[PaymentService] Error getting unmatched: {e}")
            return []
    
    def reconcile_transaction(self, recon_id: str, batch_id: str, matched_by: str) -> Dict:
        """Match a bank transaction to a payment batch."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE bank_reconciliations
                SET status = 'MATCHED', matched_batch_id = %s, 
                    matched_by = %s, matched_at = NOW()
                WHERE id = %s
            """, (batch_id, matched_by, recon_id))
            
            affected = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            
            if affected > 0:
                return {'success': True, 'message': 'Transaction matched successfully'}
            else:
                return {'success': False, 'error': 'Transaction not found'}
                
        except Exception as e:
            print(f"[PaymentService] Error reconciling: {e}")
            return {'success': False, 'error': str(e)}
    
    def auto_reconcile(self) -> Dict:
        """
        Automatically match bank transactions to payment batches
        based on amount and reference matching.
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get unmatched bank transactions
            cursor.execute("SELECT * FROM bank_reconciliations WHERE status = 'UNMATCHED'")
            unmatched = cursor.fetchall()
            
            matched_count = 0
            
            for txn in unmatched:
                # Try to match by bank reference
                cursor.execute("""
                    SELECT id FROM payment_batches 
                    WHERE bank_reference = %s AND status = 'PAID'
                """, (txn['bank_reference'],))
                match = cursor.fetchone()
                
                if match:
                    cursor.execute("""
                        UPDATE bank_reconciliations
                        SET status = 'MATCHED', matched_batch_id = %s, 
                            matched_by = 'AUTO', matched_at = NOW()
                        WHERE id = %s
                    """, (match['id'], txn['id']))
                    matched_count += 1
                else:
                    # Try to match by amount
                    cursor.execute("""
                        SELECT id FROM payment_batches 
                        WHERE ABS(total_amount - %s) < 0.01 AND status = 'PAID'
                        AND id NOT IN (SELECT matched_batch_id FROM bank_reconciliations WHERE matched_batch_id IS NOT NULL)
                        LIMIT 1
                    """, (txn['amount'],))
                    match = cursor.fetchone()
                    
                    if match:
                        cursor.execute("""
                            UPDATE bank_reconciliations
                            SET status = 'MATCHED', matched_batch_id = %s, 
                                matched_by = 'AUTO_AMOUNT', matched_at = NOW()
                            WHERE id = %s
                        """, (match['id'], txn['id']))
                        matched_count += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'matched_count': matched_count,
                'message': f'Auto-matched {matched_count} transactions'
            }
            
        except Exception as e:
            print(f"[PaymentService] Error auto-reconciling: {e}")
            return {'success': False, 'error': str(e)}
    
    # =========================================================================
    # EARLY PAYMENT DISCOUNTS
    # =========================================================================
    
    def calculate_early_discount(self, invoice_id: str) -> Optional[Dict]:
        """
        Calculate if early payment discount is available for an invoice.
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get invoice details
            cursor.execute("SELECT * FROM supplier_invoices WHERE id = %s", (invoice_id,))
            invoice = cursor.fetchone()
            
            if not invoice:
                return None
            
            # Get vendor's early payment terms
            cursor.execute("""
                SELECT * FROM early_payment_terms 
                WHERE vendor_id = %s AND is_active = TRUE
                  AND (valid_to IS NULL OR valid_to >= CURDATE())
                ORDER BY discount_percent DESC
                LIMIT 1
            """, (invoice.get('supplier_id'),))
            terms = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if not terms:
                return {
                    'eligible': False,
                    'reason': 'No early payment terms configured for this vendor'
                }
            
            # Calculate days remaining
            due_date = invoice.get('due_date')
            if due_date:
                if isinstance(due_date, str):
                    due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
                days_until_due = (due_date - datetime.now().date()).days
                
                if days_until_due >= terms['days_early']:
                    discount_amount = float(invoice['amount']) * (float(terms['discount_percent']) / 100)
                    return {
                        'eligible': True,
                        'discount_percent': float(terms['discount_percent']),
                        'discount_amount': discount_amount,
                        'final_amount': float(invoice['amount']) - discount_amount,
                        'days_until_discount_expires': days_until_due - terms['days_early'],
                        'original_due_date': str(due_date)
                    }
            
            return {
                'eligible': False,
                'reason': 'Invoice is past early payment window'
            }
            
        except Exception as e:
            print(f"[PaymentService] Error calculating discount: {e}")
            return None
    
    def set_vendor_early_payment_terms(
        self, vendor_id: str, vendor_name: str,
        discount_percent: float, days_early: int
    ) -> Dict:
        """Set or update early payment terms for a vendor."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            term_id = str(uuid.uuid4())
            
            # Deactivate existing terms
            cursor.execute("""
                UPDATE early_payment_terms 
                SET is_active = FALSE 
                WHERE vendor_id = %s
            """, (vendor_id,))
            
            # Insert new terms
            cursor.execute("""
                INSERT INTO early_payment_terms
                (id, vendor_id, vendor_name, discount_percent, days_early, valid_from)
                VALUES (%s, %s, %s, %s, %s, CURDATE())
            """, (term_id, vendor_id, vendor_name, discount_percent, days_early))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {'success': True, 'term_id': term_id}
            
        except Exception as e:
            print(f"[PaymentService] Error setting terms: {e}")
            return {'success': False, 'error': str(e)}
    
    # =========================================================================
    # VENDOR PAYMENT PORTAL
    # =========================================================================
    
    def get_vendor_payments(self, vendor_id: str) -> List[Dict]:
        """Get all payments for a specific vendor."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT pt.*, pb.batch_number, pb.payment_method, pb.paid_at as batch_paid_at
                FROM payment_transactions pt
                INNER JOIN payment_batches pb ON pt.batch_id = pb.id
                WHERE pt.vendor_id = %s
                ORDER BY pt.created_at DESC
            """, (vendor_id,))
            
            payments = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return payments
        except Exception as e:
            print(f"[PaymentService] Error getting vendor payments: {e}")
            return []
    
    def get_vendor_payment_summary(self, vendor_id: str) -> Dict:
        """Get payment summary for vendor dashboard."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Total paid
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_payments,
                    COALESCE(SUM(final_amount), 0) as total_paid,
                    COALESCE(SUM(discount_amount), 0) as total_discounts
                FROM payment_transactions
                WHERE vendor_id = %s AND status = 'PAID'
            """, (vendor_id,))
            paid_stats = cursor.fetchone()
            
            # Pending
            cursor.execute("""
                SELECT 
                    COUNT(*) as pending_count,
                    COALESCE(SUM(final_amount), 0) as pending_amount
                FROM payment_transactions
                WHERE vendor_id = %s AND status IN ('PENDING', 'INCLUDED', 'PROCESSING')
            """, (vendor_id,))
            pending_stats = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return {
                'total_payments': paid_stats['total_payments'],
                'total_paid': float(paid_stats['total_paid']),
                'total_discounts_received': float(paid_stats['total_discounts']),
                'pending_payments': pending_stats['pending_count'],
                'pending_amount': float(pending_stats['pending_amount'])
            }
            
        except Exception as e:
            print(f"[PaymentService] Error getting vendor summary: {e}")
            return {}
    
    # =========================================================================
    # MULTI-CURRENCY SUPPORT
    # =========================================================================
    
    def get_exchange_rate(self, from_currency: str, to_currency: str) -> Optional[float]:
        """Get latest exchange rate between currencies."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT rate FROM currency_rates
                WHERE from_currency = %s AND to_currency = %s
                ORDER BY effective_date DESC
                LIMIT 1
            """, (from_currency, to_currency))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return float(result['rate']) if result else None
            
        except Exception as e:
            print(f"[PaymentService] Error getting rate: {e}")
            return None
    
    def set_exchange_rate(self, from_currency: str, to_currency: str, rate: float) -> Dict:
        """Set exchange rate for a currency pair."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            rate_id = str(uuid.uuid4())
            today = datetime.now().strftime('%Y-%m-%d')
            
            cursor.execute("""
                INSERT INTO currency_rates (id, from_currency, to_currency, rate, effective_date)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE rate = %s
            """, (rate_id, from_currency, to_currency, rate, today, rate))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {'success': True}
            
        except Exception as e:
            print(f"[PaymentService] Error setting rate: {e}")
            return {'success': False, 'error': str(e)}


# Create singleton instance
payment_service = PaymentService()
