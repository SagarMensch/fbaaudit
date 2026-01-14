"""
Confidence Calibrator - Multi-Model Voting
===========================================
Concept from multiple papers: Ensemble voting and confidence calibration

This module implements:
1. Multi-model extraction voting
2. Confidence score calibration
3. Uncertainty estimation
4. Self-assessment of extraction quality

Usage:
    from services.vdu.confidence import ConfidenceCalibrator
    
    calibrator = ConfidenceCalibrator()
    
    # Calibrate confidence for an extraction
    result = calibrator.calibrate(
        extracted_data={"invoice_number": "INV-001", ...},
        raw_text="...",
        model_confidences={"groq": 0.85, "regex": 0.70}
    )
"""

import os
import re
import json
import statistics
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from dotenv import load_dotenv
import requests

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


@dataclass
class FieldConfidence:
    """Confidence metrics for a single field"""
    field_name: str
    value: Any
    raw_confidence: float  # Initial confidence
    calibrated_confidence: float  # After calibration
    sources_agreed: int  # How many sources extracted same value
    validation_passed: bool  # Did it pass format validation
    
    def to_dict(self) -> Dict:
        return {
            "field_name": self.field_name,
            "value": self.value,
            "confidence": self.calibrated_confidence,
            "sources_agreed": self.sources_agreed,
            "validated": self.validation_passed
        }


class ConfidenceCalibrator:
    """
    Calibrate extraction confidence using multiple signals
    
    Calibration factors:
    1. Model agreement - Do multiple extractors agree?
    2. Format validation - Does value match expected format?
    3. Cross-field consistency - Are related fields consistent?
    4. Template match - Does value match learned patterns?
    5. LLM verification - Ask Groq to verify suspicious values
    """
    
    # Field validation patterns
    VALIDATORS = {
        "invoice_number": r'^[A-Z]{0,4}[-/]?\d{4,}.*$',
        "invoice_date": r'^\d{2}[/-]\d{2}[/-]\d{4}$',
        "vendor_gstin": r'^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$',
        "buyer_gstin": r'^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$',
        "vehicle_number": r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$',
        "lr_number": r'^[A-Z]{0,4}[-/]?\d+$',
        "total_amount": r'^[\d,]+\.?\d{0,2}$',
        "base_amount": r'^[\d,]+\.?\d{0,2}$',
        "weight_kg": r'^\d+\.?\d*$',
        "distance_km": r'^\d+$',
    }
    
    # Fields that should be cross-validated
    CROSS_VALIDATIONS = [
        ("total_amount", "base_amount", "total >= base"),
        ("cgst_amount", "sgst_amount", "should be equal for intrastate"),
        ("invoice_date", "lr_date", "invoice >= lr"),
    ]
    
    def __init__(self):
        self.groq_api_key = GROQ_API_KEY
        print("✅ ConfidenceCalibrator initialized")
    
    def calibrate(
        self,
        extracted_data: Dict[str, Any],
        raw_text: str = None,
        model_confidences: Dict[str, float] = None,
        multi_source_extractions: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calibrate confidence scores for extracted data
        
        Args:
            extracted_data: The extracted field values
            raw_text: Original OCR text (for verification)
            model_confidences: Per-model confidence scores
            multi_source_extractions: Extractions from multiple models
            
        Returns:
            Dict with calibrated confidences and overall score
        """
        field_confidences = {}
        
        for field_name, value in extracted_data.items():
            if value is None:
                continue
            
            # Start with base confidence
            base_conf = model_confidences.get(field_name, 0.7) if model_confidences else 0.7
            
            # Factor 1: Format validation
            format_valid, format_conf = self._validate_format(field_name, value)
            
            # Factor 2: Multi-source agreement
            agreement_conf = self._check_agreement(
                field_name, value, multi_source_extractions
            ) if multi_source_extractions else 0.5
            
            # Factor 3: Value present in raw text
            text_match_conf = self._verify_in_text(value, raw_text) if raw_text else 0.5
            
            # Calculate calibrated confidence
            calibrated = self._combine_confidences(
                base_conf, format_conf, agreement_conf, text_match_conf
            )
            
            field_confidences[field_name] = FieldConfidence(
                field_name=field_name,
                value=value,
                raw_confidence=base_conf,
                calibrated_confidence=calibrated,
                sources_agreed=1,  # Would be updated with multi-source
                validation_passed=format_valid
            )
        
        # Cross-field validation
        cross_valid = self._cross_validate(extracted_data)
        
        # Calculate overall confidence
        all_confs = [fc.calibrated_confidence for fc in field_confidences.values()]
        overall_confidence = statistics.mean(all_confs) if all_confs else 0.0
        
        # Identify low-confidence fields for review
        low_conf_fields = [
            name for name, fc in field_confidences.items()
            if fc.calibrated_confidence < 0.6
        ]
        
        return {
            "field_confidences": {k: v.to_dict() for k, v in field_confidences.items()},
            "overall_confidence": round(overall_confidence, 3),
            "cross_validation": cross_valid,
            "needs_review": len(low_conf_fields) > 0,
            "review_fields": low_conf_fields,
            "quality_rating": self._get_quality_rating(overall_confidence)
        }
    
    def _validate_format(self, field_name: str, value: Any) -> Tuple[bool, float]:
        """Validate value format against expected pattern"""
        if field_name not in self.VALIDATORS:
            return True, 0.8  # No validator, assume OK
        
        pattern = self.VALIDATORS[field_name]
        str_value = str(value).strip()
        
        if re.match(pattern, str_value, re.IGNORECASE):
            return True, 1.0
        else:
            return False, 0.3
    
    def _check_agreement(
        self,
        field_name: str,
        value: Any,
        extractions: List[Dict[str, Any]]
    ) -> float:
        """Check if multiple sources agree on the value"""
        if not extractions:
            return 0.5
        
        str_value = str(value).lower().strip()
        agree_count = 0
        
        for extraction in extractions:
            other_value = extraction.get(field_name)
            if other_value and str(other_value).lower().strip() == str_value:
                agree_count += 1
        
        agreement_ratio = agree_count / len(extractions)
        return 0.5 + (agreement_ratio * 0.5)  # Range: 0.5 to 1.0
    
    def _verify_in_text(self, value: Any, text: str) -> float:
        """Verify the value appears in the raw text"""
        if not text:
            return 0.5
        
        str_value = str(value).strip()
        
        if str_value.lower() in text.lower():
            return 1.0
        
        # Try numeric matching (ignore formatting)
        if re.match(r'^[\d,]+\.?\d*$', str_value):
            clean_value = str_value.replace(',', '')
            if clean_value in text.replace(',', ''):
                return 0.9
        
        return 0.3
    
    def _combine_confidences(
        self,
        base: float,
        format_conf: float,
        agreement_conf: float,
        text_match: float
    ) -> float:
        """Combine multiple confidence signals"""
        # Weighted average
        weights = {
            "base": 0.3,
            "format": 0.25,
            "agreement": 0.25,
            "text_match": 0.2
        }
        
        combined = (
            base * weights["base"] +
            format_conf * weights["format"] +
            agreement_conf * weights["agreement"] +
            text_match * weights["text_match"]
        )
        
        return round(min(1.0, max(0.0, combined)), 3)
    
    def _cross_validate(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Cross-validate related fields"""
        results = []
        
        # Total >= Base amount
        if "total_amount" in data and "base_amount" in data:
            total = self._to_number(data["total_amount"])
            base = self._to_number(data["base_amount"])
            
            if total is not None and base is not None:
                valid = total >= base
                results.append({
                    "rule": "total >= base",
                    "valid": valid,
                    "details": f"Total: {total}, Base: {base}"
                })
        
        # CGST == SGST (for intrastate)
        if "cgst_amount" in data and "sgst_amount" in data:
            cgst = self._to_number(data["cgst_amount"])
            sgst = self._to_number(data["sgst_amount"])
            
            if cgst is not None and sgst is not None:
                valid = abs(cgst - sgst) < 0.1
                results.append({
                    "rule": "cgst == sgst (intrastate)",
                    "valid": valid,
                    "details": f"CGST: {cgst}, SGST: {sgst}"
                })
        
        # If IGST present, CGST+SGST should be 0
        if "igst_amount" in data:
            igst = self._to_number(data["igst_amount"])
            cgst = self._to_number(data.get("cgst_amount", 0))
            sgst = self._to_number(data.get("sgst_amount", 0))
            
            if igst and igst > 0:
                valid = (cgst or 0) == 0 and (sgst or 0) == 0
                results.append({
                    "rule": "igst exclusive with cgst/sgst",
                    "valid": valid,
                    "details": f"IGST: {igst}, CGST: {cgst}, SGST: {sgst}"
                })
        
        return results
    
    def _to_number(self, value: Any) -> Optional[float]:
        """Convert value to number"""
        if value is None:
            return None
        
        try:
            if isinstance(value, (int, float)):
                return float(value)
            
            clean = str(value).replace(',', '').replace('Rs', '').replace('₹', '').strip()
            return float(clean) if clean else None
        except:
            return None
    
    def _get_quality_rating(self, confidence: float) -> str:
        """Get human-readable quality rating"""
        if confidence >= 0.9:
            return "EXCELLENT"
        elif confidence >= 0.75:
            return "GOOD"
        elif confidence >= 0.6:
            return "FAIR"
        elif confidence >= 0.4:
            return "POOR"
        else:
            return "VERY_LOW"
    
    def verify_with_llm(
        self,
        extracted_data: Dict[str, Any],
        raw_text: str,
        suspicious_fields: List[str]
    ) -> Dict[str, Any]:
        """
        Use Groq to verify suspicious extractions
        
        This is a final check for low-confidence fields.
        """
        if not self.groq_api_key or not suspicious_fields:
            return {"verified": False, "reason": "No LLM available or no fields to verify"}
        
        prompt = f"""Verify these extracted values from a freight invoice:

EXTRACTED VALUES:
{json.dumps({k: v for k, v in extracted_data.items() if k in suspicious_fields}, indent=2)}

ORIGINAL TEXT:
{raw_text[:2000]}

For EACH field, respond with:
- "CORRECT" if the value matches the text
- "INCORRECT" with the correct value
- "UNCLEAR" if you cannot determine

Format: JSON with field names as keys."""

        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You verify document extraction accuracy."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 500
                },
                timeout=20
            )
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                
                # Parse response
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    verification = json.loads(json_match.group())
                    return {
                        "verified": True,
                        "results": verification
                    }
                    
        except Exception as e:
            print(f"⚠️ LLM verification failed: {e}")
        
        return {"verified": False, "reason": "LLM verification failed"}


# ============================================================================
# SINGLETON
# ============================================================================

_confidence_calibrator: Optional[ConfidenceCalibrator] = None


def get_confidence_calibrator() -> ConfidenceCalibrator:
    global _confidence_calibrator
    if _confidence_calibrator is None:
        _confidence_calibrator = ConfidenceCalibrator()
    return _confidence_calibrator


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Confidence Calibrator Test")
    print("=" * 60)
    
    calibrator = ConfidenceCalibrator()
    
    # Test data
    test_data = {
        "invoice_number": "INV-2024-001",
        "vendor_gstin": "27AAACT1234M1Z5",
        "total_amount": "15000.00",
        "base_amount": "14000.00",
        "cgst_amount": "500.00",
        "sgst_amount": "500.00"
    }
    
    result = calibrator.calibrate(test_data)
    print(f"\n✅ Calibration Result:")
    print(f"   Overall Confidence: {result['overall_confidence']}")
    print(f"   Quality Rating: {result['quality_rating']}")
    print(f"   Needs Review: {result['needs_review']}")
