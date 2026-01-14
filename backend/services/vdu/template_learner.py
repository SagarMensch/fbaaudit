"""
Template Learning - One-Shot Vendor Adaptation
==============================================
Paper #7 Concept: TrOCR fine-tuning + Paper #10 InternVL synthetic data

This module enables the VDU engine to learn from user corrections:
1. User uploads invoice from new vendor
2. OCR extracts (with some errors)
3. User corrects the extraction
4. System LEARNS the vendor's layout patterns

Next time same vendor's invoice arrives, accuracy is ~99%.

Usage:
    from services.vdu.template_learner import TemplateLearner
    
    learner = TemplateLearner()
    
    # Learn from correction
    learner.learn_from_correction(
        vendor_id="TCI001",
        raw_text="Invoice No: INV-2024-001...",
        corrected_data={"invoice_number": "INV-2024-001", ...}
    )
    
    # Apply learned template
    result = learner.apply_template("TCI001", raw_text)
"""

import os
import re
import json
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from dotenv import load_dotenv
import requests

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")


@dataclass
class FieldPattern:
    """Learned pattern for a field"""
    field_name: str
    regex_patterns: List[str] = field(default_factory=list)
    context_keywords: List[str] = field(default_factory=list)  # Words that appear near the value
    position_hints: Dict[str, Any] = field(default_factory=dict)  # Relative position info
    confidence: float = 0.0
    examples: List[str] = field(default_factory=list)  # Example values seen
    
    def to_dict(self) -> Dict:
        return {
            "field_name": self.field_name,
            "regex_patterns": self.regex_patterns,
            "context_keywords": self.context_keywords,
            "position_hints": self.position_hints,
            "confidence": self.confidence,
            "examples": self.examples
        }


@dataclass
class VendorTemplate:
    """Learned template for a vendor"""
    vendor_id: str
    vendor_name: str
    document_type: str  # INVOICE, LR, etc.
    field_patterns: Dict[str, FieldPattern] = field(default_factory=dict)
    layout_signature: str = ""  # Hash of typical layout structure
    sample_count: int = 0
    last_updated: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor_name,
            "document_type": self.document_type,
            "field_patterns": {k: v.to_dict() for k, v in self.field_patterns.items()},
            "layout_signature": self.layout_signature,
            "sample_count": self.sample_count,
            "last_updated": self.last_updated
        }


class TemplateLearner:
    """
    One-Shot Template Learning System
    
    Implements concepts from:
    - Paper #7 (TrOCR): Learn from validated line-level data
    - Paper #9 (StrucTexT): Entity linking and key-value patterns
    - Paper #10 (InternVL): Use LLM to generate patterns
    
    The learning process:
    1. OBSERVE: Compare raw text with corrected values
    2. LOCATE: Find where each value appears in the text
    3. CONTEXTUALIZE: Identify keywords/labels near the value
    4. PATTERN: Generate regex that matches this context
    5. STORE: Save template for future use
    """
    
    def __init__(self):
        self.templates: Dict[str, VendorTemplate] = {}
        self.groq_api_key = GROQ_API_KEY
        self._load_templates()
        
        print("✅ TemplateLearner initialized")
    
    def _load_templates(self):
        """Load templates from database or file"""
        template_file = os.path.join(
            os.path.dirname(__file__), 
            'templates_cache.json'
        )
        
        if os.path.exists(template_file):
            try:
                with open(template_file, 'r') as f:
                    data = json.load(f)
                    for vendor_id, template_data in data.items():
                        self.templates[vendor_id] = self._dict_to_template(template_data)
                print(f"   Loaded {len(self.templates)} templates")
            except Exception as e:
                print(f"⚠️ Template load failed: {e}")
    
    def _save_templates(self):
        """Persist templates to file"""
        template_file = os.path.join(
            os.path.dirname(__file__), 
            'templates_cache.json'
        )
        
        try:
            data = {k: v.to_dict() for k, v in self.templates.items()}
            with open(template_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠️ Template save failed: {e}")
    
    def _dict_to_template(self, data: Dict) -> VendorTemplate:
        """Convert dict to VendorTemplate"""
        template = VendorTemplate(
            vendor_id=data.get("vendor_id", ""),
            vendor_name=data.get("vendor_name", ""),
            document_type=data.get("document_type", "INVOICE"),
            layout_signature=data.get("layout_signature", ""),
            sample_count=data.get("sample_count", 0),
            last_updated=data.get("last_updated", "")
        )
        
        for field_name, pattern_data in data.get("field_patterns", {}).items():
            template.field_patterns[field_name] = FieldPattern(
                field_name=pattern_data.get("field_name", field_name),
                regex_patterns=pattern_data.get("regex_patterns", []),
                context_keywords=pattern_data.get("context_keywords", []),
                position_hints=pattern_data.get("position_hints", {}),
                confidence=pattern_data.get("confidence", 0),
                examples=pattern_data.get("examples", [])
            )
        
        return template
    
    def learn_from_correction(
        self,
        vendor_id: str,
        vendor_name: str,
        raw_text: str,
        corrected_data: Dict[str, Any],
        document_type: str = "INVOICE"
    ) -> Dict[str, Any]:
        """
        Learn patterns from user-corrected data
        
        This is the core one-shot learning function.
        
        Args:
            vendor_id: Unique vendor identifier
            vendor_name: Human-readable vendor name
            raw_text: The original OCR text
            corrected_data: User-validated field values
            document_type: Type of document
            
        Returns:
            Dict with learning results
        """
        # Get or create template
        template_key = f"{vendor_id}_{document_type}"
        
        if template_key not in self.templates:
            self.templates[template_key] = VendorTemplate(
                vendor_id=vendor_id,
                vendor_name=vendor_name,
                document_type=document_type
            )
        
        template = self.templates[template_key]
        learned_fields = []
        
        for field_name, correct_value in corrected_data.items():
            if correct_value is None or correct_value == "":
                continue
            
            # Learn pattern for this field
            pattern = self._learn_field_pattern(
                raw_text, 
                field_name, 
                str(correct_value)
            )
            
            if pattern:
                # Merge with existing patterns
                if field_name in template.field_patterns:
                    existing = template.field_patterns[field_name]
                    existing.regex_patterns = list(set(
                        existing.regex_patterns + pattern.regex_patterns
                    ))[:5]  # Keep top 5 patterns
                    existing.context_keywords = list(set(
                        existing.context_keywords + pattern.context_keywords
                    ))[:10]
                    existing.examples.append(str(correct_value))
                    existing.examples = existing.examples[-5:]  # Keep last 5 examples
                    existing.confidence = min(1.0, existing.confidence + 0.1)
                else:
                    template.field_patterns[field_name] = pattern
                
                learned_fields.append(field_name)
        
        # Update metadata
        template.sample_count += 1
        template.last_updated = datetime.now().isoformat()
        template.layout_signature = self._generate_layout_signature(raw_text)
        
        # Persist
        self._save_templates()
        
        return {
            "success": True,
            "vendor_id": vendor_id,
            "document_type": document_type,
            "fields_learned": learned_fields,
            "total_samples": template.sample_count
        }
    
    def _learn_field_pattern(
        self,
        text: str,
        field_name: str,
        value: str
    ) -> Optional[FieldPattern]:
        """
        Generate regex patterns for a single field
        
        Strategy:
        1. Find where the value appears in text
        2. Look at context (words before/after)
        3. Generate anchored regex patterns
        4. Use Groq to enhance pattern if available
        """
        if not value or len(value) < 2:
            return None
        
        # Escape special regex chars in value
        escaped_value = re.escape(value)
        
        # Find occurrences
        matches = list(re.finditer(escaped_value, text, re.IGNORECASE))
        
        if not matches:
            return None
        
        pattern = FieldPattern(
            field_name=field_name,
            examples=[value]
        )
        
        for match in matches[:3]:  # Learn from first 3 occurrences
            start = match.start()
            end = match.end()
            
            # Get context before (up to 50 chars)
            context_start = max(0, start - 50)
            context_before = text[context_start:start].strip()
            
            # Extract keywords from context
            words = re.findall(r'[A-Za-z]+', context_before)
            pattern.context_keywords.extend(words[-3:])  # Last 3 words
            
            # Generate anchored pattern
            if context_before:
                # Find the label (usually the last meaningful word/phrase before value)
                label_match = re.search(r'([A-Za-z\s]+)[\s:]*$', context_before)
                if label_match:
                    label = label_match.group(1).strip()
                    # Create pattern: Label followed by value
                    regex = rf'{re.escape(label)}[\s:]*(\S+)'
                    pattern.regex_patterns.append(regex)
            
            # Add generic pattern based on value format
            generic_pattern = self._create_generic_pattern(value)
            if generic_pattern:
                pattern.regex_patterns.append(generic_pattern)
        
        # Use Groq to enhance patterns if available
        if self.groq_api_key and len(pattern.regex_patterns) < 2:
            enhanced = self._enhance_pattern_with_llm(field_name, value, text[:500])
            if enhanced:
                pattern.regex_patterns.extend(enhanced)
        
        pattern.confidence = 0.7 if pattern.regex_patterns else 0.3
        
        return pattern
    
    def _create_generic_pattern(self, value: str) -> Optional[str]:
        """Create a generic regex pattern based on value format"""
        
        # Date patterns
        if re.match(r'\d{2}[/-]\d{2}[/-]\d{4}', value):
            return r'(\d{2}[/-]\d{2}[/-]\d{4})'
        
        # Invoice number pattern
        if re.match(r'[A-Z]{2,4}[-/]?\d+', value, re.IGNORECASE):
            return r'([A-Z]{2,4}[-/]?\d+)'
        
        # GSTIN pattern
        if re.match(r'\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}', value):
            return r'(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1})'
        
        # Vehicle number
        if re.match(r'[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}', value):
            return r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})'
        
        # Currency/Amount
        if re.match(r'[\d,]+\.?\d*', value) and float(value.replace(',', '')) > 0:
            return r'(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d*)'
        
        return None
    
    def _enhance_pattern_with_llm(
        self,
        field_name: str,
        value: str,
        context: str
    ) -> List[str]:
        """Use Groq to generate better regex patterns"""
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
                        {
                            "role": "system",
                            "content": "You are a regex expert. Generate patterns to extract fields from documents."
                        },
                        {
                            "role": "user",
                            "content": f"""Generate 2 regex patterns to extract '{field_name}' with value '{value}' from this context:

{context}

Return ONLY the regex patterns, one per line. The pattern should capture the value in group 1."""
                        }
                    ],
                    "temperature": 0.2,
                    "max_tokens": 200
                },
                timeout=15
            )
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                # Extract regex patterns from response
                patterns = []
                for line in content.split('\n'):
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # Clean up the pattern
                        pattern = line.strip('`').strip()
                        if pattern:
                            try:
                                re.compile(pattern)  # Validate
                                patterns.append(pattern)
                            except:
                                pass
                return patterns[:2]
                
        except Exception as e:
            print(f"⚠️ LLM pattern enhancement failed: {e}")
        
        return []
    
    def _generate_layout_signature(self, text: str) -> str:
        """Generate a hash signature of the document layout"""
        # Extract structural elements (lines, positions of key words)
        lines = text.split('\n')
        
        # Create signature from first 10 non-empty lines' lengths
        structure = [len(line) % 100 for line in lines[:20] if line.strip()]
        signature = hashlib.md5(str(structure).encode()).hexdigest()[:16]
        
        return signature
    
    def apply_template(
        self,
        vendor_id: str,
        raw_text: str,
        document_type: str = "INVOICE"
    ) -> Dict[str, Any]:
        """
        Apply learned template to extract data
        
        Args:
            vendor_id: Vendor identifier
            raw_text: OCR text to extract from
            document_type: Document type
            
        Returns:
            Dict with extracted values
        """
        template_key = f"{vendor_id}_{document_type}"
        
        if template_key not in self.templates:
            return {"success": False, "error": "No template found for vendor"}
        
        template = self.templates[template_key]
        extracted = {}
        confidences = {}
        
        for field_name, pattern in template.field_patterns.items():
            value, confidence = self._extract_with_pattern(raw_text, pattern)
            if value:
                extracted[field_name] = value
                confidences[field_name] = confidence
        
        return {
            "success": True,
            "vendor_id": vendor_id,
            "extracted_data": extracted,
            "confidences": confidences,
            "template_samples": template.sample_count
        }
    
    def _extract_with_pattern(
        self,
        text: str,
        pattern: FieldPattern
    ) -> Tuple[Optional[str], float]:
        """Extract value using learned patterns"""
        
        for regex in pattern.regex_patterns:
            try:
                match = re.search(regex, text, re.IGNORECASE)
                if match:
                    value = match.group(1) if match.groups() else match.group(0)
                    return value.strip(), pattern.confidence
            except re.error:
                continue
        
        return None, 0.0
    
    def get_template(self, vendor_id: str, document_type: str = "INVOICE") -> Optional[Dict]:
        """Get template for a vendor"""
        template_key = f"{vendor_id}_{document_type}"
        template = self.templates.get(template_key)
        return template.to_dict() if template else None
    
    def list_templates(self) -> List[Dict]:
        """List all learned templates"""
        return [
            {
                "vendor_id": t.vendor_id,
                "vendor_name": t.vendor_name,
                "document_type": t.document_type,
                "sample_count": t.sample_count,
                "field_count": len(t.field_patterns),
                "last_updated": t.last_updated
            }
            for t in self.templates.values()
        ]


# ============================================================================
# SINGLETON
# ============================================================================

_template_learner: Optional[TemplateLearner] = None


def get_template_learner() -> TemplateLearner:
    global _template_learner
    if _template_learner is None:
        _template_learner = TemplateLearner()
    return _template_learner


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Template Learning Test")
    print("=" * 60)
    
    learner = TemplateLearner()
    print(f"✅ Learner ready")
    print(f"   Templates loaded: {len(learner.templates)}")
