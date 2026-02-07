"""
Supply Chain Finance Service
=============================
Dynamic discounting, early payment programs, working capital optimization.
Enables carrier financing and liquidity management.

Author: SequelString AI Team
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
import uuid
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# PAYMENT TERMS & DISCOUNT SCHEDULES
# ============================================================================

# Standard payment terms
PAYMENT_TERMS = {
    'NET15': {'days': 15, 'description': 'Net 15 days'},
    'NET30': {'days': 30, 'description': 'Net 30 days'},
    'NET45': {'days': 45, 'description': 'Net 45 days'},
    'NET60': {'days': 60, 'description': 'Net 60 days'},
    'NET90': {'days': 90, 'description': 'Net 90 days'},
    '2/10NET30': {'days': 30, 'discount': 2, 'discount_days': 10, 'description': '2% 10 Net 30'},
    '1/10NET45': {'days': 45, 'discount': 1, 'discount_days': 10, 'description': '1% 10 Net 45'}
}

# Dynamic discount rates by days early
DYNAMIC_DISCOUNT_SCHEDULE = {
    # days_early: annualized_rate (APR)
    5: 36.5,   # ~0.5% for 5 days = 36.5% APR
    10: 18.25, # ~0.5% for 10 days = 18.25% APR
    15: 12.17, # ~0.5% for 15 days
    20: 9.13,
    25: 7.30,
    30: 6.08,
    45: 4.06,
    60: 3.04
}

# Financing rates for factoring
FACTORING_RATES = {
    'STANDARD': {'advance_rate': 85, 'fee_percent': 3.0, 'apr': 18.0},
    'PREFERRED': {'advance_rate': 90, 'fee_percent': 2.5, 'apr': 15.0},
    'PREMIUM': {'advance_rate': 95, 'fee_percent': 2.0, 'apr': 12.0}
}


class DynamicDiscount:
    """Calculate dynamic discount for early payment"""
    
    def __init__(self, invoice_amount: float, due_date: datetime, payment_terms: str = 'NET30'):
        self.invoice_amount = invoice_amount
        self.due_date = due_date
        self.payment_terms = payment_terms
        self.terms_info = PAYMENT_TERMS.get(payment_terms, PAYMENT_TERMS['NET30'])
    
    def calculate_discount(self, payment_date: datetime) -> Dict:
        """
        Calculate discount for paying on a specific date
        """
        if payment_date >= self.due_date:
            return {
                'success': True,
                'days_early': 0,
                'discount_percent': 0,
                'discount_amount': 0,
                'net_payment': self.invoice_amount,
                'savings': 0,
                'apr': 0
            }
        
        days_early = (self.due_date - payment_date).days
        
        # Find applicable discount rate
        applicable_apr = 0
        for days, apr in sorted(DYNAMIC_DISCOUNT_SCHEDULE.items()):
            if days_early >= days:
                applicable_apr = apr
        
        # Calculate discount percentage
        # Formula: discount = APR * (days_early / 365)
        discount_percent = (applicable_apr * days_early) / 365
        discount_amount = round(self.invoice_amount * discount_percent / 100, 2)
        net_payment = round(self.invoice_amount - discount_amount, 2)
        
        return {
            'success': True,
            'invoice_amount': self.invoice_amount,
            'due_date': self.due_date.isoformat(),
            'payment_date': payment_date.isoformat(),
            'days_early': days_early,
            'discount_percent': round(discount_percent, 3),
            'discount_amount': discount_amount,
            'net_payment': net_payment,
            'savings': discount_amount,
            'apr': applicable_apr
        }
    
    def get_discount_ladder(self) -> List[Dict]:
        """
        Generate discount ladder showing all payment/discount options
        """
        ladder = []
        today = datetime.now()
        
        for days in sorted(DYNAMIC_DISCOUNT_SCHEDULE.keys()):
            payment_date = self.due_date - timedelta(days=days)
            if payment_date > today:
                result = self.calculate_discount(payment_date)
                ladder.append({
                    'payment_date': payment_date.strftime('%Y-%m-%d'),
                    'days_early': days,
                    'discount_percent': result['discount_percent'],
                    'discount_amount': result['discount_amount'],
                    'net_payment': result['net_payment'],
                    'apr': result['apr']
                })
        
        return ladder


class FactoringCalculator:
    """Calculate invoice factoring/reverse factoring options"""
    
    def __init__(self, carrier_tier: str = 'STANDARD'):
        self.tier = carrier_tier
        self.rates = FACTORING_RATES.get(carrier_tier, FACTORING_RATES['STANDARD'])
    
    def calculate_factoring(
        self,
        invoice_amount: float,
        invoice_date: datetime,
        due_date: datetime
    ) -> Dict:
        """
        Calculate factoring terms for an invoice
        """
        days_to_maturity = (due_date - datetime.now()).days
        if days_to_maturity < 0:
            days_to_maturity = 0
        
        advance_amount = invoice_amount * (self.rates['advance_rate'] / 100)
        reserve_amount = invoice_amount - advance_amount
        
        # Calculate fee
        fee_amount = invoice_amount * (self.rates['fee_percent'] / 100)
        
        # Pro-rate APR for days outstanding
        interest_amount = invoice_amount * (self.rates['apr'] / 100) * (days_to_maturity / 365)
        
        total_cost = fee_amount + interest_amount
        net_proceeds = advance_amount - total_cost
        
        return {
            'success': True,
            'tier': self.tier,
            'invoice_amount': invoice_amount,
            'invoice_date': invoice_date.isoformat(),
            'due_date': due_date.isoformat(),
            'days_to_maturity': days_to_maturity,
            'advance_rate_percent': self.rates['advance_rate'],
            'advance_amount': round(advance_amount, 2),
            'reserve_amount': round(reserve_amount, 2),
            'factoring_fee_percent': self.rates['fee_percent'],
            'factoring_fee': round(fee_amount, 2),
            'interest_apr': self.rates['apr'],
            'interest_amount': round(interest_amount, 2),
            'total_cost': round(total_cost, 2),
            'net_proceeds_immediate': round(net_proceeds, 2),
            'final_settlement': round(reserve_amount - interest_amount, 2)
        }


class WorkingCapitalOptimizer:
    """Optimize working capital through payment timing"""
    
    def __init__(self):
        self.cash_position = 0
        self.target_days_payable = 45
    
    def analyze_payment_schedule(
        self,
        invoices: List[Dict],
        available_cash: float
    ) -> Dict:
        """
        Analyze and optimize payment schedule for maximum discount capture
        
        Args:
            invoices: List of invoices with amount, due_date
            available_cash: Cash available for early payments
        """
        # Sort by potential savings (discount amount descending)
        scored_invoices = []
        
        for inv in invoices:
            due_date = datetime.fromisoformat(inv['due_date']) if isinstance(inv['due_date'], str) else inv['due_date']
            discount_calc = DynamicDiscount(inv['amount'], due_date)
            
            # Get best discount if paid today
            today_discount = discount_calc.calculate_discount(datetime.now())
            
            scored_invoices.append({
                **inv,
                'potential_savings': today_discount['savings'],
                'discount_percent': today_discount['discount_percent'],
                'net_payment': today_discount['net_payment'],
                'days_early': today_discount['days_early'],
                'roi': (today_discount['savings'] / inv['amount'] * 100) if inv['amount'] > 0 else 0
            })
        
        # Sort by ROI (highest first)
        scored_invoices.sort(key=lambda x: x['roi'], reverse=True)
        
        # Optimize: Pay highest ROI invoices first within cash constraint
        optimized_payments = []
        remaining_cash = available_cash
        total_savings = 0
        total_paid = 0
        
        for inv in scored_invoices:
            if inv['net_payment'] <= remaining_cash and inv['potential_savings'] > 0:
                optimized_payments.append({
                    'invoice_id': inv.get('invoice_id', 'N/A'),
                    'amount': inv['amount'],
                    'net_payment': inv['net_payment'],
                    'savings': inv['potential_savings'],
                    'action': 'PAY_EARLY'
                })
                remaining_cash -= inv['net_payment']
                total_savings += inv['potential_savings']
                total_paid += inv['net_payment']
            else:
                optimized_payments.append({
                    'invoice_id': inv.get('invoice_id', 'N/A'),
                    'amount': inv['amount'],
                    'action': 'PAY_ON_DUE_DATE'
                })
        
        return {
            'success': True,
            'available_cash': available_cash,
            'cash_used_for_early_payments': round(total_paid, 2),
            'remaining_cash': round(remaining_cash, 2),
            'total_savings_captured': round(total_savings, 2),
            'annualized_return': round((total_savings / total_paid * 365 / 30) * 100, 2) if total_paid > 0 else 0,
            'invoices_paid_early': len([p for p in optimized_payments if p['action'] == 'PAY_EARLY']),
            'invoices_on_schedule': len([p for p in optimized_payments if p['action'] == 'PAY_ON_DUE_DATE']),
            'payment_schedule': optimized_payments
        }


class EarlyPaymentProgram:
    """
    Carrier Early Payment Program
    ==============================
    Allows carriers to request early payment at a discount
    """
    
    def __init__(self):
        self.enrolled_carriers: Dict[str, Dict] = {}
        self.pending_requests: List[Dict] = []
        self._load_demo_data()
    
    def _load_demo_data(self):
        """Load demo enrolled carriers"""
        self.enrolled_carriers = {
            'TCI001': {
                'carrier_id': 'TCI001',
                'carrier_name': 'TCI Express',
                'tier': 'PREMIUM',
                'max_advance_percent': 95,
                'discount_rate_apr': 12,
                'enrolled_date': '2024-01-15',
                'total_advanced': 5000000,
                'active': True
            },
            'GATI002': {
                'carrier_id': 'GATI002',
                'carrier_name': 'Gati-KWE',
                'tier': 'PREFERRED',
                'max_advance_percent': 90,
                'discount_rate_apr': 15,
                'enrolled_date': '2024-03-01',
                'total_advanced': 2500000,
                'active': True
            }
        }
    
    def enroll_carrier(
        self,
        carrier_id: str,
        carrier_name: str,
        tier: str = 'STANDARD'
    ) -> Dict:
        """Enroll a carrier in early payment program"""
        if carrier_id in self.enrolled_carriers:
            return {'success': False, 'error': 'Carrier already enrolled'}
        
        rates = FACTORING_RATES.get(tier, FACTORING_RATES['STANDARD'])
        
        self.enrolled_carriers[carrier_id] = {
            'carrier_id': carrier_id,
            'carrier_name': carrier_name,
            'tier': tier,
            'max_advance_percent': rates['advance_rate'],
            'discount_rate_apr': rates['apr'],
            'enrolled_date': datetime.now().isoformat(),
            'total_advanced': 0,
            'active': True
        }
        
        return {
            'success': True,
            'message': f'{carrier_name} enrolled in {tier} tier',
            'enrollment': self.enrolled_carriers[carrier_id]
        }
    
    def request_early_payment(
        self,
        carrier_id: str,
        invoice_id: str,
        invoice_amount: float,
        due_date: datetime
    ) -> Dict:
        """Request early payment for an invoice"""
        if carrier_id not in self.enrolled_carriers:
            return {'success': False, 'error': 'Carrier not enrolled in early payment program'}
        
        enrollment = self.enrolled_carriers[carrier_id]
        if not enrollment['active']:
            return {'success': False, 'error': 'Enrollment is not active'}
        
        # Calculate advance
        calculator = FactoringCalculator(enrollment['tier'])
        factoring = calculator.calculate_factoring(invoice_amount, datetime.now(), due_date)
        
        request = {
            'request_id': f"EPR-{uuid.uuid4().hex[:8].upper()}",
            'carrier_id': carrier_id,
            'carrier_name': enrollment['carrier_name'],
            'invoice_id': invoice_id,
            'invoice_amount': invoice_amount,
            'advance_amount': factoring['advance_amount'],
            'fee_amount': factoring['total_cost'],
            'net_amount': factoring['net_proceeds_immediate'],
            'status': 'PENDING',
            'requested_at': datetime.now().isoformat()
        }
        
        self.pending_requests.append(request)
        
        return {
            'success': True,
            'request': request,
            'factoring_details': factoring
        }
    
    def approve_request(self, request_id: str, approved_by: str) -> Dict:
        """Approve an early payment request"""
        for req in self.pending_requests:
            if req['request_id'] == request_id:
                req['status'] = 'APPROVED'
                req['approved_by'] = approved_by
                req['approved_at'] = datetime.now().isoformat()
                
                # Update carrier total
                if req['carrier_id'] in self.enrolled_carriers:
                    self.enrolled_carriers[req['carrier_id']]['total_advanced'] += req['advance_amount']
                
                return {'success': True, 'request': req}
        
        return {'success': False, 'error': 'Request not found'}
    
    def get_pending_requests(self) -> List[Dict]:
        return [r for r in self.pending_requests if r['status'] == 'PENDING']
    
    def get_enrolled_carriers(self) -> List[Dict]:
        return list(self.enrolled_carriers.values())


class SupplyChainFinanceService:
    """
    Master Supply Chain Finance Service
    =====================================
    Unified interface for all SCF operations
    """
    
    def __init__(self):
        self.early_payment_program = EarlyPaymentProgram()
        self.working_capital_optimizer = WorkingCapitalOptimizer()
    
    def calculate_dynamic_discount(
        self,
        invoice_amount: float,
        due_date: datetime,
        payment_date: datetime = None
    ) -> Dict:
        """Calculate dynamic discount for early payment"""
        calculator = DynamicDiscount(invoice_amount, due_date)
        
        if payment_date:
            return calculator.calculate_discount(payment_date)
        else:
            return {
                'invoice_amount': invoice_amount,
                'due_date': due_date.isoformat(),
                'discount_ladder': calculator.get_discount_ladder()
            }
    
    def get_factoring_quote(
        self,
        invoice_amount: float,
        due_date: datetime,
        tier: str = 'STANDARD'
    ) -> Dict:
        """Get factoring quote for an invoice"""
        calculator = FactoringCalculator(tier)
        return calculator.calculate_factoring(invoice_amount, datetime.now(), due_date)
    
    def optimize_payments(
        self,
        invoices: List[Dict],
        available_cash: float
    ) -> Dict:
        """Optimize payment schedule for maximum savings"""
        return self.working_capital_optimizer.analyze_payment_schedule(invoices, available_cash)
    
    def get_program_summary(self) -> Dict:
        """Get summary of early payment program"""
        enrolled = self.early_payment_program.get_enrolled_carriers()
        pending = self.early_payment_program.get_pending_requests()
        
        total_advanced = sum(c['total_advanced'] for c in enrolled)
        
        return {
            'enrolled_carriers': len(enrolled),
            'pending_requests': len(pending),
            'total_advanced_ytd': total_advanced,
            'carriers': enrolled[:5],  # Top 5
            'recent_requests': pending[:5]
        }


# Singleton instance
scf_service = SupplyChainFinanceService()


# Convenience functions for API
def calculate_discount(invoice_amount: float, due_date: datetime, payment_date: datetime = None) -> Dict:
    return scf_service.calculate_dynamic_discount(invoice_amount, due_date, payment_date)

def get_factoring_quote(invoice_amount: float, due_date: datetime, tier: str = 'STANDARD') -> Dict:
    return scf_service.get_factoring_quote(invoice_amount, due_date, tier)

def optimize_payment_schedule(invoices: List[Dict], available_cash: float) -> Dict:
    return scf_service.optimize_payments(invoices, available_cash)

def get_scf_program_summary() -> Dict:
    return scf_service.get_program_summary()

def enroll_carrier_scf(carrier_id: str, carrier_name: str, tier: str = 'STANDARD') -> Dict:
    return scf_service.early_payment_program.enroll_carrier(carrier_id, carrier_name, tier)

def request_early_payment(carrier_id: str, invoice_id: str, amount: float, due_date: datetime) -> Dict:
    return scf_service.early_payment_program.request_early_payment(carrier_id, invoice_id, amount, due_date)

def get_enrolled_carriers() -> List[Dict]:
    return scf_service.early_payment_program.get_enrolled_carriers()

def get_pending_payment_requests() -> List[Dict]:
    return scf_service.early_payment_program.get_pending_requests()
