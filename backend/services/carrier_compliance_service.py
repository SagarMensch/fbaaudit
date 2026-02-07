"""
Carrier Compliance Service
==========================
Document vault, insurance verification, safety rating monitoring.
Tracks carrier compliance with regulatory requirements.

Author: SequelString AI Team  
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# COMPLIANCE DOCUMENT TYPES
# ============================================================================

DOCUMENT_TYPES = {
    'COI': {
        'name': 'Certificate of Insurance',
        'required': True,
        'validity_months': 12,
        'description': 'Cargo/liability insurance certificate'
    },
    'MC_AUTHORITY': {
        'name': 'Motor Carrier Authority',
        'required': True,
        'validity_months': None,  # Permanent unless revoked
        'description': 'USDOT/MC number authorization'
    },
    'GST_CERTIFICATE': {
        'name': 'GST Registration Certificate',
        'required': True,
        'validity_months': None,
        'description': 'GST registration document'
    },
    'PAN_CARD': {
        'name': 'PAN Card',
        'required': True,
        'validity_months': None,
        'description': 'Permanent Account Number'
    },
    'RC_BOOK': {
        'name': 'Vehicle Registration Certificate',
        'required': True,
        'validity_months': 180,  # 15 years
        'description': 'Vehicle registration book'
    },
    'FITNESS_CERTIFICATE': {
        'name': 'Fitness Certificate',
        'required': True,
        'validity_months': 12,
        'description': 'Vehicle fitness certificate'
    },
    'POLLUTION_CERTIFICATE': {
        'name': 'Pollution Under Control Certificate',
        'required': True,
        'validity_months': 6,
        'description': 'PUC certificate'
    },
    'NATIONAL_PERMIT': {
        'name': 'National Permit',
        'required': True,
        'validity_months': 12,
        'description': 'National/state carriage permit'
    },
    'DRIVER_LICENSE': {
        'name': 'Driver License',
        'required': True,
        'validity_months': 60,
        'description': 'Commercial driving license'
    },
    'W9': {
        'name': 'W-9 Tax Form',
        'required': False,
        'validity_months': 12,
        'description': 'Tax identification form (US)'
    },
    'SAFETY_RATING': {
        'name': 'Safety Rating Certificate',
        'required': False,
        'validity_months': 12,
        'description': 'FMCSA/CMVSS safety rating'
    },
    'BANK_DETAILS': {
        'name': 'Bank Account Verification',
        'required': True,
        'validity_months': None,
        'description': 'Cancelled cheque/bank letter'
    }
}

# Safety rating levels
SAFETY_RATINGS = {
    'SATISFACTORY': {'score': 100, 'status': 'Approved', 'color': 'green'},
    'CONDITIONAL': {'score': 70, 'status': 'Conditional Approval', 'color': 'yellow'},
    'UNSATISFACTORY': {'score': 30, 'status': 'Not Approved', 'color': 'red'},
    'UNRATED': {'score': 50, 'status': 'Under Review', 'color': 'gray'}
}


class CarrierDocument:
    """Represents a carrier compliance document"""
    
    def __init__(
        self,
        doc_id: str,
        carrier_id: str,
        doc_type: str,
        file_name: str,
        upload_date: datetime,
        expiry_date: Optional[datetime] = None,
        verified: bool = False,
        verified_by: str = None,
        verified_at: datetime = None,
        notes: str = ''
    ):
        self.doc_id = doc_id
        self.carrier_id = carrier_id
        self.doc_type = doc_type
        self.file_name = file_name
        self.upload_date = upload_date
        self.expiry_date = expiry_date
        self.verified = verified
        self.verified_by = verified_by
        self.verified_at = verified_at
        self.notes = notes
    
    def is_expired(self) -> bool:
        if not self.expiry_date:
            return False
        return datetime.now() > self.expiry_date
    
    def days_to_expiry(self) -> Optional[int]:
        if not self.expiry_date:
            return None
        delta = self.expiry_date - datetime.now()
        return delta.days
    
    def to_dict(self) -> Dict:
        return {
            'doc_id': self.doc_id,
            'carrier_id': self.carrier_id,
            'doc_type': self.doc_type,
            'doc_type_name': DOCUMENT_TYPES.get(self.doc_type, {}).get('name', self.doc_type),
            'file_name': self.file_name,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'is_expired': self.is_expired(),
            'days_to_expiry': self.days_to_expiry(),
            'verified': self.verified,
            'verified_by': self.verified_by,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'notes': self.notes
        }


class CarrierComplianceProfile:
    """Complete compliance profile for a carrier"""
    
    def __init__(self, carrier_id: str, carrier_name: str):
        self.carrier_id = carrier_id
        self.carrier_name = carrier_name
        self.documents: Dict[str, CarrierDocument] = {}
        self.safety_rating = 'UNRATED'
        self.safety_score = 50
        self.insurance_verified = False
        self.insurance_amount = 0
        self.gstin = None
        self.pan = None
        self.fleet_size = 0
        self.onboarding_date = None
        self.last_audit_date = None
        self.compliance_score = 0
        self.status = 'PENDING'  # PENDING, APPROVED, SUSPENDED, BLOCKED
    
    def add_document(self, document: CarrierDocument):
        self.documents[document.doc_type] = document
    
    def get_missing_documents(self) -> List[str]:
        """Get list of required documents that are missing"""
        missing = []
        for doc_type, info in DOCUMENT_TYPES.items():
            if info['required'] and doc_type not in self.documents:
                missing.append(doc_type)
        return missing
    
    def get_expired_documents(self) -> List[CarrierDocument]:
        """Get list of expired documents"""
        return [doc for doc in self.documents.values() if doc.is_expired()]
    
    def get_expiring_soon(self, days: int = 30) -> List[CarrierDocument]:
        """Get documents expiring within specified days"""
        expiring = []
        for doc in self.documents.values():
            days_left = doc.days_to_expiry()
            if days_left is not None and 0 < days_left <= days:
                expiring.append(doc)
        return expiring
    
    def calculate_compliance_score(self) -> int:
        """Calculate overall compliance score (0-100)"""
        score = 0
        max_score = 0
        
        # Document compliance (60 points)
        required_docs = [dt for dt, info in DOCUMENT_TYPES.items() if info['required']]
        doc_points = 60 / len(required_docs) if required_docs else 0
        
        for doc_type in required_docs:
            max_score += doc_points
            if doc_type in self.documents:
                doc = self.documents[doc_type]
                if not doc.is_expired():
                    score += doc_points if doc.verified else doc_points * 0.5
        
        # Safety rating (20 points)
        max_score += 20
        safety_info = SAFETY_RATINGS.get(self.safety_rating, SAFETY_RATINGS['UNRATED'])
        score += (safety_info['score'] / 100) * 20
        
        # Insurance verification (10 points)
        max_score += 10
        if self.insurance_verified:
            score += 10
        
        # Audit status (10 points)
        max_score += 10
        if self.last_audit_date:
            days_since_audit = (datetime.now() - self.last_audit_date).days
            if days_since_audit < 365:
                score += 10
            elif days_since_audit < 730:
                score += 5
        
        self.compliance_score = int((score / max_score) * 100) if max_score > 0 else 0
        return self.compliance_score
    
    def to_dict(self) -> Dict:
        return {
            'carrier_id': self.carrier_id,
            'carrier_name': self.carrier_name,
            'status': self.status,
            'compliance_score': self.calculate_compliance_score(),
            'safety_rating': self.safety_rating,
            'safety_score': self.safety_score,
            'insurance_verified': self.insurance_verified,
            'insurance_amount': self.insurance_amount,
            'gstin': self.gstin,
            'pan': self.pan,
            'fleet_size': self.fleet_size,
            'onboarding_date': self.onboarding_date.isoformat() if self.onboarding_date else None,
            'last_audit_date': self.last_audit_date.isoformat() if self.last_audit_date else None,
            'documents': {dt: doc.to_dict() for dt, doc in self.documents.items()},
            'missing_documents': self.get_missing_documents(),
            'expired_documents': [doc.to_dict() for doc in self.get_expired_documents()],
            'expiring_soon': [doc.to_dict() for doc in self.get_expiring_soon()]
        }


class CarrierComplianceService:
    """
    Master Carrier Compliance Service
    ==================================
    Manages carrier document vault, verification, and compliance monitoring.
    """
    
    def __init__(self):
        self.carriers: Dict[str, CarrierComplianceProfile] = {}
        self._load_demo_data()
    
    def _load_demo_data(self):
        """Load demo carrier profiles"""
        demo_carriers = [
            {
                'carrier_id': 'TCI001',
                'carrier_name': 'TCI Express Ltd',
                'gstin': '27AABCT1234G1Z5',
                'pan': 'AABCT1234G',
                'fleet_size': 500,
                'safety_rating': 'SATISFACTORY',
                'insurance_amount': 50000000,
                'documents': {
                    'COI': {'expiry_days': 45, 'verified': True},
                    'GST_CERTIFICATE': {'expiry_days': None, 'verified': True},
                    'PAN_CARD': {'expiry_days': None, 'verified': True},
                    'NATIONAL_PERMIT': {'expiry_days': 200, 'verified': True}
                }
            },
            {
                'carrier_id': 'GATI002',
                'carrier_name': 'Gati-KWE',
                'gstin': '27AABCG5678H1Z3',
                'pan': 'AABCG5678H',
                'fleet_size': 350,
                'safety_rating': 'CONDITIONAL',
                'insurance_amount': 30000000,
                'documents': {
                    'COI': {'expiry_days': -10, 'verified': True},  # Expired
                    'GST_CERTIFICATE': {'expiry_days': None, 'verified': True},
                    'NATIONAL_PERMIT': {'expiry_days': 15, 'verified': False}  # Expiring soon
                }
            },
            {
                'carrier_id': 'VRL003',
                'carrier_name': 'VRL Logistics',
                'gstin': '29AAACV1234L1ZP',
                'pan': 'AAACV1234L',
                'fleet_size': 200,
                'safety_rating': 'SATISFACTORY',
                'insurance_amount': 25000000,
                'documents': {
                    'COI': {'expiry_days': 300, 'verified': True},
                    'GST_CERTIFICATE': {'expiry_days': None, 'verified': True},
                    'PAN_CARD': {'expiry_days': None, 'verified': True}
                }
            }
        ]
        
        for carrier_data in demo_carriers:
            profile = CarrierComplianceProfile(
                carrier_id=carrier_data['carrier_id'],
                carrier_name=carrier_data['carrier_name']
            )
            profile.gstin = carrier_data['gstin']
            profile.pan = carrier_data['pan']
            profile.fleet_size = carrier_data['fleet_size']
            profile.safety_rating = carrier_data['safety_rating']
            profile.safety_score = SAFETY_RATINGS[carrier_data['safety_rating']]['score']
            profile.insurance_amount = carrier_data['insurance_amount']
            profile.insurance_verified = True
            profile.onboarding_date = datetime.now() - timedelta(days=365)
            profile.last_audit_date = datetime.now() - timedelta(days=90)
            profile.status = 'APPROVED'
            
            # Add documents
            for doc_type, doc_info in carrier_data.get('documents', {}).items():
                expiry = None
                if doc_info['expiry_days'] is not None:
                    expiry = datetime.now() + timedelta(days=doc_info['expiry_days'])
                
                doc = CarrierDocument(
                    doc_id=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                    carrier_id=carrier_data['carrier_id'],
                    doc_type=doc_type,
                    file_name=f"{doc_type.lower()}_{carrier_data['carrier_id']}.pdf",
                    upload_date=datetime.now() - timedelta(days=30),
                    expiry_date=expiry,
                    verified=doc_info['verified'],
                    verified_by='System' if doc_info['verified'] else None,
                    verified_at=datetime.now() - timedelta(days=25) if doc_info['verified'] else None
                )
                profile.add_document(doc)
            
            self.carriers[carrier_data['carrier_id']] = profile
    
    def get_carrier_profile(self, carrier_id: str) -> Optional[Dict]:
        """Get compliance profile for a carrier"""
        profile = self.carriers.get(carrier_id)
        return profile.to_dict() if profile else None
    
    def get_all_carriers(self) -> List[Dict]:
        """Get all carrier compliance profiles"""
        return [profile.to_dict() for profile in self.carriers.values()]
    
    def get_compliance_summary(self) -> Dict:
        """Get compliance summary across all carriers"""
        total = len(self.carriers)
        compliant = sum(1 for c in self.carriers.values() if c.compliance_score >= 80)
        at_risk = sum(1 for c in self.carriers.values() if 50 <= c.compliance_score < 80)
        non_compliant = sum(1 for c in self.carriers.values() if c.compliance_score < 50)
        
        expired_docs = sum(len(c.get_expired_documents()) for c in self.carriers.values())
        expiring_soon = sum(len(c.get_expiring_soon()) for c in self.carriers.values())
        
        return {
            'total_carriers': total,
            'compliant': compliant,
            'at_risk': at_risk,
            'non_compliant': non_compliant,
            'compliance_rate': round(compliant / total * 100, 1) if total > 0 else 0,
            'expired_documents': expired_docs,
            'expiring_soon_30_days': expiring_soon,
            'safety_ratings': {
                'satisfactory': sum(1 for c in self.carriers.values() if c.safety_rating == 'SATISFACTORY'),
                'conditional': sum(1 for c in self.carriers.values() if c.safety_rating == 'CONDITIONAL'),
                'unsatisfactory': sum(1 for c in self.carriers.values() if c.safety_rating == 'UNSATISFACTORY'),
                'unrated': sum(1 for c in self.carriers.values() if c.safety_rating == 'UNRATED')
            }
        }
    
    def get_expiring_documents_report(self, days: int = 30) -> List[Dict]:
        """Get all documents expiring within specified days"""
        expiring = []
        for profile in self.carriers.values():
            for doc in profile.get_expiring_soon(days):
                doc_dict = doc.to_dict()
                doc_dict['carrier_name'] = profile.carrier_name
                expiring.append(doc_dict)
        
        # Sort by days to expiry
        expiring.sort(key=lambda x: x.get('days_to_expiry', 999))
        return expiring
    
    def verify_document(self, carrier_id: str, doc_type: str, verified_by: str) -> Dict:
        """Verify a carrier document"""
        profile = self.carriers.get(carrier_id)
        if not profile:
            return {'success': False, 'error': 'Carrier not found'}
        
        doc = profile.documents.get(doc_type)
        if not doc:
            return {'success': False, 'error': 'Document not found'}
        
        doc.verified = True
        doc.verified_by = verified_by
        doc.verified_at = datetime.now()
        
        return {
            'success': True,
            'message': f'{doc_type} verified for {carrier_id}',
            'document': doc.to_dict()
        }
    
    def update_safety_rating(self, carrier_id: str, rating: str, notes: str = '') -> Dict:
        """Update carrier safety rating"""
        profile = self.carriers.get(carrier_id)
        if not profile:
            return {'success': False, 'error': 'Carrier not found'}
        
        if rating not in SAFETY_RATINGS:
            return {'success': False, 'error': f'Invalid rating: {rating}'}
        
        profile.safety_rating = rating
        profile.safety_score = SAFETY_RATINGS[rating]['score']
        
        return {
            'success': True,
            'message': f'Safety rating updated to {rating}',
            'carrier': profile.to_dict()
        }


# Singleton instance
compliance_service = CarrierComplianceService()


# Convenience functions for API
def get_carrier_compliance(carrier_id: str) -> Optional[Dict]:
    return compliance_service.get_carrier_profile(carrier_id)

def get_all_carriers_compliance() -> List[Dict]:
    return compliance_service.get_all_carriers()

def get_compliance_summary() -> Dict:
    return compliance_service.get_compliance_summary()

def get_expiring_documents(days: int = 30) -> List[Dict]:
    return compliance_service.get_expiring_documents_report(days)

def verify_carrier_document(carrier_id: str, doc_type: str, verified_by: str) -> Dict:
    return compliance_service.verify_document(carrier_id, doc_type, verified_by)

def update_carrier_safety_rating(carrier_id: str, rating: str) -> Dict:
    return compliance_service.update_safety_rating(carrier_id, rating)

def get_document_types() -> Dict:
    return DOCUMENT_TYPES
