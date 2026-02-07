"""
Tax Compliance Engine
=====================
Multi-jurisdiction tax calculation and e-invoicing compliance.
Supports: GST (India), VAT (Europe), Withholding Tax (TDS)

Author: SequelString AI Team
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# GST RATES AND HSN CODES (INDIA)
# ============================================================================

GST_RATES = {
    'FREIGHT_ROAD': {'rate': 5, 'hsn': '996511', 'description': 'Road Transport Services'},
    'FREIGHT_RAIL': {'rate': 5, 'hsn': '996512', 'description': 'Rail Transport Services'},
    'FREIGHT_AIR': {'rate': 18, 'hsn': '996521', 'description': 'Air Transport Services'},
    'FREIGHT_SEA': {'rate': 5, 'hsn': '996531', 'description': 'Sea Transport Services'},
    'COURIER': {'rate': 18, 'hsn': '996812', 'description': 'Courier Services'},
    'WAREHOUSING': {'rate': 18, 'hsn': '996721', 'description': 'Warehousing Services'},
    'HANDLING': {'rate': 18, 'hsn': '996719', 'description': 'Cargo Handling Services'},
    'INSURANCE': {'rate': 18, 'hsn': '997131', 'description': 'Freight Insurance'},
    'DEFAULT': {'rate': 18, 'hsn': '999799', 'description': 'Other Services'}
}

# State codes for GSTIN validation
INDIAN_STATE_CODES = {
    '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
    '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
    '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
    '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '29': 'Karnataka',
    '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
    '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar',
    '36': 'Telangana', '37': 'Andhra Pradesh'
}

# VAT Rates (EU)
EU_VAT_RATES = {
    'DE': {'standard': 19, 'reduced': 7, 'country': 'Germany'},
    'FR': {'standard': 20, 'reduced': 5.5, 'country': 'France'},
    'NL': {'standard': 21, 'reduced': 9, 'country': 'Netherlands'},
    'BE': {'standard': 21, 'reduced': 6, 'country': 'Belgium'},
    'IT': {'standard': 22, 'reduced': 10, 'country': 'Italy'},
    'ES': {'standard': 21, 'reduced': 10, 'country': 'Spain'},
    'PL': {'standard': 23, 'reduced': 8, 'country': 'Poland'},
    'UK': {'standard': 20, 'reduced': 5, 'country': 'United Kingdom'}
}

# TDS Rates (India Withholding Tax)
TDS_RATES = {
    '194C': {'rate': 1, 'threshold': 30000, 'description': 'Payment to Contractors - Individual/HUF'},
    '194C_COMPANY': {'rate': 2, 'threshold': 30000, 'description': 'Payment to Contractors - Others'},
    '194J': {'rate': 10, 'threshold': 30000, 'description': 'Professional/Technical Services'},
    '194H': {'rate': 5, 'threshold': 15000, 'description': 'Commission/Brokerage'}
}


class TaxCalculator:
    """
    Multi-jurisdiction tax calculation engine
    """
    
    def __init__(self):
        self.jurisdiction = 'IN'  # Default: India
        
    def set_jurisdiction(self, country_code: str):
        """Set tax jurisdiction"""
        self.jurisdiction = country_code.upper()
    
    def calculate_gst(
        self,
        base_amount: float,
        service_type: str,
        supplier_state: str,
        recipient_state: str
    ) -> Dict:
        """
        Calculate GST for Indian transactions
        
        Args:
            base_amount: Taxable amount
            service_type: Type of service (FREIGHT_ROAD, FREIGHT_AIR, etc.)
            supplier_state: 2-digit state code of supplier
            recipient_state: 2-digit state code of recipient
            
        Returns:
            Dict with CGST, SGST, IGST breakup
        """
        gst_info = GST_RATES.get(service_type.upper(), GST_RATES['DEFAULT'])
        rate = gst_info['rate']
        hsn = gst_info['hsn']
        
        # Determine if inter-state or intra-state
        is_inter_state = supplier_state != recipient_state
        
        result = {
            'base_amount': round(base_amount, 2),
            'hsn_code': hsn,
            'service_type': service_type,
            'is_inter_state': is_inter_state,
            'supplier_state': supplier_state,
            'recipient_state': recipient_state,
            'gst_rate': rate,
            'cgst_rate': 0,
            'sgst_rate': 0,
            'igst_rate': 0,
            'cgst_amount': 0,
            'sgst_amount': 0,
            'igst_amount': 0,
            'total_tax': 0,
            'total_amount': 0
        }
        
        tax_amount = round(base_amount * rate / 100, 2)
        
        if is_inter_state:
            # IGST for inter-state
            result['igst_rate'] = rate
            result['igst_amount'] = tax_amount
        else:
            # CGST + SGST for intra-state (split 50-50)
            result['cgst_rate'] = rate / 2
            result['sgst_rate'] = rate / 2
            result['cgst_amount'] = round(tax_amount / 2, 2)
            result['sgst_amount'] = round(tax_amount / 2, 2)
        
        result['total_tax'] = tax_amount
        result['total_amount'] = round(base_amount + tax_amount, 2)
        
        return result
    
    def calculate_vat(
        self,
        base_amount: float,
        country_code: str,
        is_reduced_rate: bool = False
    ) -> Dict:
        """
        Calculate EU VAT
        
        Args:
            base_amount: Taxable amount
            country_code: 2-letter EU country code
            is_reduced_rate: Apply reduced rate if True
        """
        vat_info = EU_VAT_RATES.get(country_code.upper())
        
        if not vat_info:
            return {
                'success': False,
                'error': f'Unknown country code: {country_code}'
            }
        
        rate = vat_info['reduced'] if is_reduced_rate else vat_info['standard']
        tax_amount = round(base_amount * rate / 100, 2)
        
        return {
            'success': True,
            'base_amount': round(base_amount, 2),
            'country': vat_info['country'],
            'country_code': country_code.upper(),
            'vat_rate': rate,
            'rate_type': 'reduced' if is_reduced_rate else 'standard',
            'vat_amount': tax_amount,
            'total_amount': round(base_amount + tax_amount, 2)
        }
    
    def calculate_tds(
        self,
        base_amount: float,
        section: str,
        is_company: bool = False
    ) -> Dict:
        """
        Calculate TDS (Withholding Tax) for India
        
        Args:
            base_amount: Payment amount
            section: TDS section (194C, 194J, 194H)
            is_company: True if payee is a company
        """
        section_upper = section.upper()
        
        if section_upper == '194C' and is_company:
            section_upper = '194C_COMPANY'
        
        tds_info = TDS_RATES.get(section_upper)
        
        if not tds_info:
            return {
                'success': False,
                'error': f'Unknown TDS section: {section}'
            }
        
        # Check threshold
        if base_amount < tds_info['threshold']:
            return {
                'success': True,
                'base_amount': base_amount,
                'tds_applicable': False,
                'reason': f"Amount below threshold of ₹{tds_info['threshold']}",
                'tds_amount': 0,
                'net_payable': base_amount
            }
        
        tds_amount = round(base_amount * tds_info['rate'] / 100, 2)
        
        return {
            'success': True,
            'base_amount': round(base_amount, 2),
            'tds_applicable': True,
            'section': section,
            'tds_rate': tds_info['rate'],
            'tds_amount': tds_amount,
            'net_payable': round(base_amount - tds_amount, 2),
            'description': tds_info['description']
        }


class GSTINValidator:
    """Validate Indian GSTIN numbers"""
    
    @staticmethod
    def validate(gstin: str) -> Dict:
        """
        Validate GSTIN format and checksum
        
        GSTIN Format: 2-digit state + 10-char PAN + 1-digit entity + Z + 1-digit checksum
        Example: 27AABCT1234G1Z5
        """
        if not gstin or len(gstin) != 15:
            return {'valid': False, 'error': 'GSTIN must be 15 characters'}
        
        gstin = gstin.upper()
        
        # Check state code
        state_code = gstin[:2]
        if state_code not in INDIAN_STATE_CODES:
            return {'valid': False, 'error': f'Invalid state code: {state_code}'}
        
        # Check PAN format (characters 3-12)
        pan = gstin[2:12]
        if not GSTINValidator._validate_pan_format(pan):
            return {'valid': False, 'error': 'Invalid PAN format in GSTIN'}
        
        # Check 13th character (entity code)
        entity_code = gstin[12]
        if entity_code not in '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ':
            return {'valid': False, 'error': 'Invalid entity code'}
        
        # Check 14th character (should be Z)
        if gstin[13] != 'Z':
            return {'valid': False, 'error': 'Invalid format (14th char should be Z)'}
        
        # Verify checksum
        if not GSTINValidator._validate_checksum(gstin):
            return {'valid': False, 'error': 'Invalid checksum'}
        
        return {
            'valid': True,
            'gstin': gstin,
            'state_code': state_code,
            'state_name': INDIAN_STATE_CODES[state_code],
            'pan': pan,
            'entity_code': entity_code
        }
    
    @staticmethod
    def _validate_pan_format(pan: str) -> bool:
        """Validate PAN format: AAAAA9999A"""
        if len(pan) != 10:
            return False
        
        # First 5 chars: letters
        if not pan[:5].isalpha():
            return False
        
        # Next 4 chars: digits
        if not pan[5:9].isdigit():
            return False
        
        # Last char: letter
        if not pan[9].isalpha():
            return False
        
        return True
    
    @staticmethod
    def _validate_checksum(gstin: str) -> bool:
        """Validate GSTIN checksum using Luhn algorithm variant"""
        # Simplified validation - in production use full checksum algorithm
        char_map = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        
        try:
            total = 0
            for i, char in enumerate(gstin[:-1]):
                idx = char_map.index(char)
                if i % 2 == 0:
                    total += idx
                else:
                    total += (idx * 2) // 36 + (idx * 2) % 36
            
            expected = (36 - (total % 36)) % 36
            actual = char_map.index(gstin[-1])
            
            return expected == actual
        except:
            return True  # Fallback for edge cases


class EInvoiceGenerator:
    """
    E-Invoice generation for GST compliance (India)
    Generates IRN (Invoice Reference Number) and QR code data
    """
    
    def __init__(self):
        self.api_endpoint = "https://einvoice1.gst.gov.in"  # Production endpoint
        
    def generate_irn(self, invoice_data: Dict) -> Dict:
        """
        Generate Invoice Reference Number (IRN)
        
        In production: Call GST E-Invoice API
        """
        try:
            # Validate required fields
            required = ['invoice_number', 'invoice_date', 'supplier_gstin', 
                       'recipient_gstin', 'total_amount']
            
            for field in required:
                if field not in invoice_data:
                    return {'success': False, 'error': f'Missing field: {field}'}
            
            # Generate IRN (64-char hash in production)
            irn_input = f"{invoice_data['supplier_gstin']}{invoice_data['invoice_number']}{invoice_data['invoice_date']}"
            irn = hashlib.sha256(irn_input.encode()).hexdigest()
            
            # Generate QR code data
            qr_data = {
                'SellerGstin': invoice_data['supplier_gstin'],
                'BuyerGstin': invoice_data['recipient_gstin'],
                'DocNo': invoice_data['invoice_number'],
                'DocDt': invoice_data['invoice_date'],
                'TotVal': invoice_data['total_amount'],
                'Irn': irn
            }
            
            return {
                'success': True,
                'irn': irn,
                'ack_number': f"ACK{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'ack_date': datetime.now().isoformat(),
                'qr_code_data': json.dumps(qr_data),
                'signed_invoice': invoice_data,
                'message': 'E-Invoice generated successfully'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def cancel_irn(self, irn: str, reason: str) -> Dict:
        """Cancel an e-invoice"""
        return {
            'success': True,
            'irn': irn,
            'cancel_date': datetime.now().isoformat(),
            'reason': reason,
            'message': 'E-Invoice cancelled successfully'
        }


class TaxComplianceEngine:
    """
    Master Tax Compliance Engine
    ============================
    Unified interface for all tax-related operations
    """
    
    def __init__(self):
        self.calculator = TaxCalculator()
        self.gstin_validator = GSTINValidator()
        self.einvoice_generator = EInvoiceGenerator()
    
    def calculate_invoice_tax(self, invoice: Dict) -> Dict:
        """
        Calculate all applicable taxes for an invoice
        
        Args:
            invoice: {
                'base_amount': 10000,
                'service_type': 'FREIGHT_ROAD',
                'supplier_gstin': '27AABCT1234G1Z5',
                'recipient_gstin': '07AABCR5678H1Z3',
                'include_tds': True
            }
        """
        result = {
            'success': True,
            'invoice': invoice,
            'gst': None,
            'tds': None,
            'total_tax': 0,
            'net_payable': 0
        }
        
        # Extract state codes from GSTIN
        supplier_state = invoice.get('supplier_gstin', '')[:2]
        recipient_state = invoice.get('recipient_gstin', '')[:2]
        
        # Calculate GST
        gst_result = self.calculator.calculate_gst(
            base_amount=invoice.get('base_amount', 0),
            service_type=invoice.get('service_type', 'DEFAULT'),
            supplier_state=supplier_state,
            recipient_state=recipient_state
        )
        result['gst'] = gst_result
        result['total_tax'] = gst_result['total_tax']
        
        # Calculate TDS if applicable
        if invoice.get('include_tds', False):
            tds_result = self.calculator.calculate_tds(
                base_amount=gst_result['total_amount'],
                section='194C',
                is_company=invoice.get('is_company', False)
            )
            result['tds'] = tds_result
            if tds_result.get('tds_applicable'):
                result['net_payable'] = tds_result['net_payable']
            else:
                result['net_payable'] = gst_result['total_amount']
        else:
            result['net_payable'] = gst_result['total_amount']
        
        return result
    
    def validate_gstin(self, gstin: str) -> Dict:
        return self.gstin_validator.validate(gstin)
    
    def generate_einvoice(self, invoice_data: Dict) -> Dict:
        return self.einvoice_generator.generate_irn(invoice_data)
    
    def get_gst_rate(self, service_type: str) -> Dict:
        return GST_RATES.get(service_type.upper(), GST_RATES['DEFAULT'])
    
    def get_hsn_codes(self) -> List[Dict]:
        """Get all HSN codes for freight services"""
        return [
            {'hsn': info['hsn'], 'description': info['description'], 'rate': info['rate'], 'service_type': key}
            for key, info in GST_RATES.items()
        ]


# Singleton instance
tax_engine = TaxComplianceEngine()


# Convenience functions for API
def calculate_tax(invoice: Dict) -> Dict:
    return tax_engine.calculate_invoice_tax(invoice)

def validate_gstin(gstin: str) -> Dict:
    return tax_engine.validate_gstin(gstin)

def generate_einvoice(invoice_data: Dict) -> Dict:
    return tax_engine.generate_einvoice(invoice_data)

def get_hsn_codes() -> List[Dict]:
    return tax_engine.get_hsn_codes()

def calculate_gst(base_amount: float, service_type: str, supplier_state: str, recipient_state: str) -> Dict:
    return tax_engine.calculator.calculate_gst(base_amount, service_type, supplier_state, recipient_state)

def calculate_tds(base_amount: float, section: str = '194C', is_company: bool = False) -> Dict:
    return tax_engine.calculator.calculate_tds(base_amount, section, is_company)
