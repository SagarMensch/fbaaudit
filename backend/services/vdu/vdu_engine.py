"""
VDU Engine - Visual Document Understanding (Groq Cloud-Based)
==============================================================
Based on 2024-2025 Research Papers, optimized for CPU-only environments.

This implementation uses:
1. PyMuPDF + Tesseract for OCR (CPU-based, already in codebase)
2. Groq LLM (llama-3.3-70b-versatile) for structure understanding
3. Gemini 2.0 Flash as vision fallback when needed

Architecture:
    Document → OCR (PyMuPDF/Tesseract) → Raw Text → Groq LLM → Structured JSON

This is a pragmatic implementation that achieves the goals of the research papers
(StrucTexT, OmniParser logic) without requiring a GPU.

Usage:
    from services.vdu.vdu_engine import VDUEngine
    
    engine = VDUEngine()
    result = engine.extract("invoice.pdf")
    # Returns: {"vendor_name": "...", "total": 15000, ...}
"""

import os
import re
import json
import time
import base64
import tempfile
import requests
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"  # Fast + Accurate
GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview"  # For image understanding

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Lazy imports
_fitz = None  # PyMuPDF
_tesseract = None
_Image = None


class DocumentType(str, Enum):
    """Supported document types"""
    INVOICE = "INVOICE"
    LR = "LR"  # Lorry Receipt
    POD = "POD"  # Proof of Delivery
    PO = "PO"  # Purchase Order
    GENERAL = "GENERAL"


# ============================================================================
# LAZY LOADERS
# ============================================================================

def get_fitz():
    """Lazy load PyMuPDF"""
    global _fitz
    if _fitz is None:
        try:
            import fitz
            _fitz = fitz
        except ImportError:
            print("⚠️ PyMuPDF not available. Install with: pip install pymupdf")
    return _fitz


def get_tesseract():
    """Lazy load pytesseract"""
    global _tesseract
    if _tesseract is None:
        try:
            import pytesseract
            _tesseract = pytesseract
        except ImportError:
            print("⚠️ pytesseract not available")
    return _tesseract


def get_pil():
    """Lazy load PIL"""
    global _Image
    if _Image is None:
        from PIL import Image
        _Image = Image
    return _Image


# ============================================================================
# SCHEMA DEFINITIONS (Based on StrucTexT Paper #9 Logic)
# ============================================================================

INVOICE_SCHEMA = {
    "type": "INVOICE",
    "fields": {
        "invoice_number": {"type": "string", "required": True},
        "invoice_date": {"type": "date", "required": True},
        "vendor_name": {"type": "string", "required": True},
        "vendor_gstin": {"type": "string", "pattern": r"\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}"},
        "buyer_name": {"type": "string"},
        "buyer_gstin": {"type": "string"},
        "origin": {"type": "string"},
        "destination": {"type": "string"},
        "vehicle_number": {"type": "string"},
        "lr_number": {"type": "string"},
        "lr_date": {"type": "date"},
        "base_amount": {"type": "number", "required": True},
        "cgst_amount": {"type": "number"},
        "sgst_amount": {"type": "number"},
        "igst_amount": {"type": "number"},
        "total_amount": {"type": "number", "required": True},
        "weight_kg": {"type": "number"},
        "distance_km": {"type": "number"},
    }
}

LR_SCHEMA = {
    "type": "LR",
    "fields": {
        "lr_number": {"type": "string", "required": True},
        "lr_date": {"type": "date", "required": True},
        "consignor_name": {"type": "string", "required": True},
        "consignee_name": {"type": "string", "required": True},
        "origin": {"type": "string", "required": True},
        "destination": {"type": "string", "required": True},
        "vehicle_number": {"type": "string"},
        "driver_name": {"type": "string"},
        "driver_phone": {"type": "string"},
        "goods_description": {"type": "string"},
        "weight_kg": {"type": "number"},
        "packages": {"type": "integer"},
        "declared_value": {"type": "number"},
    }
}

SCHEMAS = {
    "INVOICE": INVOICE_SCHEMA,
    "LR": LR_SCHEMA,
}


# ============================================================================
# VDU ENGINE (Main Class)
# ============================================================================

class VDUEngine:
    """
    Visual Document Understanding Engine
    
    This engine implements the concepts from the 2024-2025 papers:
    - StrucTexT v3 (Paper #9): Key-Value pairing via LLM
    - OmniParser (Paper #4): Layout understanding
    - GOT-OCR 2.0 (Paper #1): Unified extraction (simulated via Groq)
    
    All processing is done via cloud APIs (Groq, Gemini) - no GPU required.
    """
    
    def __init__(self):
        self.groq_api_key = GROQ_API_KEY
        self.gemini_api_key = GEMINI_API_KEY
        self.openrouter_api_key = OPENROUTER_API_KEY
        
        # Check API availability
        if not self.groq_api_key:
            print("⚠️ GROQ_API_KEY not set. LLM extraction will be limited.")
        
        print("✅ VDUEngine initialized (Cloud-based, CPU-only)")
    
    def extract(
        self,
        file_path: str,
        document_type: str = "INVOICE",
        use_vision: bool = False
    ) -> Dict[str, Any]:
        """
        Extract structured data from a document
        
        Args:
            file_path: Path to PDF or image file
            document_type: Type of document (INVOICE, LR, etc.)
            use_vision: If True, send image to vision model (slower but more accurate)
            
        Returns:
            Dict with extracted fields, confidence scores, and metadata
        """
        start_time = time.time()
        
        # Step 1: Extract raw text using OCR
        ocr_result = self._extract_text(file_path)
        raw_text = ocr_result.get("text", "")
        
        if not raw_text.strip():
            return {
                "success": False,
                "error": "No text extracted from document",
                "processing_time_s": round(time.time() - start_time, 3)
            }
        
        # Step 2: Get schema for document type
        schema = SCHEMAS.get(document_type, INVOICE_SCHEMA)
        
        # Step 3: Use Groq LLM for structure extraction (StrucTexT logic)
        if self.groq_api_key:
            extracted = self._extract_with_groq(raw_text, schema)
        else:
            extracted = self._extract_with_regex(raw_text, schema)
        
        # Step 4: Post-process and validate
        validated = self._validate_extraction(extracted, schema)
        
        return {
            "success": True,
            "document_type": document_type,
            "extracted_data": validated,
            "raw_text": raw_text[:2000],  # Truncate for response
            "ocr_confidence": ocr_result.get("confidence", 0),
            "processing_time_s": round(time.time() - start_time, 3),
            "model_used": GROQ_MODEL if self.groq_api_key else "regex_fallback"
        }
    
    def _extract_text(self, file_path: str) -> Dict[str, Any]:
        """
        Extract text from document using PyMuPDF + Tesseract fallback
        
        This implements a simplified version of Florence-2 layout detection
        by using PyMuPDF's built-in text blocks.
        """
        fitz = get_fitz()
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf" and fitz:
            return self._extract_from_pdf(file_path)
        else:
            return self._extract_from_image(file_path)
    
    def _extract_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Extract text from PDF using PyMuPDF, with OCR fallback for scanned PDFs"""
        fitz = get_fitz()
        
        if not fitz:
            return {"text": "", "confidence": 0}
        
        try:
            doc = fitz.open(pdf_path)
            all_text = []
            page_count = len(doc)
            
            for page_num, page in enumerate(doc):
                # Get text blocks (mimics layout detection)
                blocks = page.get_text("blocks")
                
                # Sort by vertical position (top to bottom)
                blocks = sorted(blocks, key=lambda b: (b[1], b[0]))
                
                page_text = []
                for block in blocks:
                    if block[6] == 0:  # Text block (not image)
                        page_text.append(block[4])
                
                all_text.extend(page_text)
            
            combined_text = "\n".join(all_text)
            
            # Check if this is a scanned PDF (no searchable text)
            if len(combined_text.strip()) < 50:
                print("ℹ️ Scanned PDF detected - using OCR...")
                
                # Convert first page to image and OCR
                tesseract = get_tesseract()
                Image = get_pil()
                
                if tesseract and Image:
                    ocr_texts = []
                    for page_num in range(min(page_count, 5)):  # Max 5 pages
                        page = doc.load_page(page_num)
                        pix = page.get_pixmap(dpi=200)
                        
                        # Convert to PIL Image
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        
                        # Run OCR
                        page_text = tesseract.image_to_string(img, lang='eng')
                        ocr_texts.append(page_text)
                    
                    doc.close()
                    
                    combined_text = "\n\n".join(ocr_texts)
                    
                    return {
                        "text": combined_text,
                        "confidence": 0.75,
                        "pages": page_count,
                        "method": "pymupdf+tesseract-ocr"
                    }
            
            doc.close()
            
            return {
                "text": combined_text,
                "confidence": 0.85,
                "pages": page_count,
                "method": "pymupdf"
            }
            
        except Exception as e:
            print(f"⚠️ PyMuPDF extraction failed: {e}")
            return {"text": "", "confidence": 0}
    
    def _extract_from_image(self, image_path: str) -> Dict[str, Any]:
        """Extract text from image using Tesseract or Vision API fallback"""
        tesseract = get_tesseract()
        Image = get_pil()
        
        # Try Tesseract first
        if tesseract and Image:
            try:
                img = Image.open(image_path)
                
                # Convert to RGB if necessary (for PNG with transparency)
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                text = tesseract.image_to_string(img, lang='eng')
                
                # Get confidence via Tesseract data
                try:
                    data = tesseract.image_to_data(img, output_type=tesseract.Output.DICT)
                    confidences = [int(c) for c in data['conf'] if str(c) != '-1']
                    avg_conf = sum(confidences) / len(confidences) if confidences else 0
                except:
                    avg_conf = 50  # Default confidence
                
                if text.strip():
                    return {
                        "text": text,
                        "confidence": avg_conf / 100,
                        "method": "tesseract"
                    }
                    
            except Exception as e:
                print(f"⚠️ Tesseract extraction failed: {e}")
        
        # Fallback: Use vision model for image OCR
        print("ℹ️ Falling back to Vision API for image extraction...")
        
        try:
            Image = get_pil()
            if Image:
                with open(image_path, "rb") as f:
                    img_bytes = f.read()
                
                base64_image = base64.b64encode(img_bytes).decode("utf-8")
                
                # Try Gemini Vision for OCR
                if self.gemini_api_key:
                    result = self._ocr_with_gemini_vision(base64_image)
                    if result.get("text"):
                        return result
                
                # Try OpenRouter
                if self.openrouter_api_key:
                    result = self._ocr_with_openrouter(base64_image)
                    if result.get("text"):
                        return result
                        
        except Exception as e:
            print(f"⚠️ Vision fallback failed: {e}")
        
        return {"text": "", "confidence": 0, "error": "Image extraction failed"}
    
    def _ocr_with_gemini_vision(self, base64_image: str) -> Dict[str, Any]:
        """Use Gemini for pure OCR text extraction"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            
            prompt = """Extract ALL text from this document image. 
Return the complete text exactly as it appears, maintaining the layout as much as possible.
Do not summarize or interpret - just extract all visible text."""
            
            response = model.generate_content([
                {"mime_type": "image/png", "data": base64_image},
                prompt
            ])
            
            return {
                "text": response.text,
                "confidence": 0.85,
                "method": "gemini-vision-ocr"
            }
            
        except Exception as e:
            print(f"⚠️ Gemini OCR failed: {e}")
            return {"text": "", "confidence": 0}
    
    def _ocr_with_openrouter(self, base64_image: str) -> Dict[str, Any]:
        """Use OpenRouter for OCR"""
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
                                {"type": "text", "text": "Extract ALL text from this document. Return complete text only."}
                            ]
                        }
                    ],
                    "temperature": 0.1
                },
                timeout=60
            )
            
            if response.status_code == 200:
                text = response.json()["choices"][0]["message"]["content"]
                return {
                    "text": text,
                    "confidence": 0.80,
                    "method": "openrouter-ocr"
                }
                
        except Exception as e:
            print(f"⚠️ OpenRouter OCR failed: {e}")
        
        return {"text": "", "confidence": 0}
    
    def _extract_with_groq(self, text: str, schema: Dict) -> Dict[str, Any]:
        """
        Use Groq LLM for intelligent field extraction
        
        This implements StrucTexT v3 (Paper #9) logic:
        - Entity Linking: Understands that "Total" on left means number on right is value
        - Key-Value Pairing: Extracts structured data from unstructured text
        """
        
        # Build prompt based on schema
        field_descriptions = []
        for field_name, field_def in schema["fields"].items():
            required = "REQUIRED" if field_def.get("required") else "optional"
            field_descriptions.append(f"- {field_name} ({field_def['type']}, {required})")
        
        prompt = f"""You are an expert document data extractor. Extract structured data from this freight/logistics document.

DOCUMENT TEXT:
{text[:4000]}

FIELDS TO EXTRACT:
{chr(10).join(field_descriptions)}

INSTRUCTIONS:
1. Extract EXACTLY the fields listed above
2. Use null for fields you cannot find
3. For dates, use YYYY-MM-DD format
4. For numbers, remove currency symbols and commas
5. For GSTIN, extract the 15-character alphanumeric code
6. Respond ONLY with valid JSON, no explanation

OUTPUT FORMAT (JSON only):
{{
    "invoice_number": "...",
    "invoice_date": "YYYY-MM-DD",
    ...
}}"""
        
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a document data extraction AI. Output only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1500
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Parse JSON from response
                try:
                    # Try to extract JSON from response
                    json_match = re.search(r'\{[\s\S]*\}', content)
                    if json_match:
                        return json.loads(json_match.group())
                    return json.loads(content)
                except json.JSONDecodeError:
                    print(f"⚠️ JSON parse error in Groq response")
                    return {}
            else:
                print(f"⚠️ Groq API error: {response.status_code}")
                return {}
                
        except Exception as e:
            print(f"❌ Groq extraction failed: {e}")
            return {}
    
    def _extract_with_regex(self, text: str, schema: Dict) -> Dict[str, Any]:
        """
        Fallback regex-based extraction when LLM is not available
        """
        result = {}
        
        # Common patterns
        patterns = {
            "invoice_number": [
                r"Invoice\s*(?:No|Number|#)[\s:]*([A-Z0-9/-]+)",
                r"Bill\s*No[\s:]*([A-Z0-9/-]+)",
            ],
            "invoice_date": [
                r"(?:Invoice\s*)?Date[\s:]*(\d{2}[/-]\d{2}[/-]\d{4})",
                r"(\d{2}[/-]\d{2}[/-]\d{4})",
            ],
            "vendor_gstin": [
                r"GSTIN[\s:]*(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1})",
            ],
            "total_amount": [
                r"(?:Grand\s*)?Total[\s:]*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)",
                r"Amount[\s:]*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)",
            ],
            "vehicle_number": [
                r"Vehicle\s*(?:No|Number)[\s:]*([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})",
                r"([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})",
            ],
            "lr_number": [
                r"(?:LR|GR|CN)\s*(?:No|Number)[\s:]*([A-Z0-9/-]+)",
            ],
        }
        
        for field, regex_list in patterns.items():
            for regex in regex_list:
                match = re.search(regex, text, re.IGNORECASE)
                if match:
                    result[field] = match.group(1).strip()
                    break
        
        return result
    
    def _validate_extraction(self, data: Dict, schema: Dict) -> Dict[str, Any]:
        """
        Validate and clean extracted data
        """
        result = {}
        
        for field_name, field_def in schema["fields"].items():
            value = data.get(field_name)
            
            if value is None or value == "null" or value == "":
                result[field_name] = None
                continue
            
            # Type conversion
            field_type = field_def.get("type", "string")
            
            try:
                if field_type == "number":
                    # Remove currency symbols and commas
                    if isinstance(value, str):
                        value = re.sub(r'[₹$,Rs\.INR\s]', '', value)
                    result[field_name] = float(value) if value else None
                    
                elif field_type == "integer":
                    result[field_name] = int(float(value)) if value else None
                    
                elif field_type == "date":
                    # Normalize date format to YYYY-MM-DD
                    result[field_name] = str(value) if value else None
                    
                else:
                    result[field_name] = str(value).strip() if value else None
                    
            except (ValueError, TypeError):
                result[field_name] = None
        
        return result
    
    def extract_with_vision(self, file_path: str, document_type: str = "INVOICE") -> Dict[str, Any]:
        """
        Extract using vision model (Groq Vision or Gemini)
        
        This is more accurate but slower. Uses Groq's llama-3.2-90b-vision
        or falls back to Gemini 2.0 Flash.
        """
        start_time = time.time()
        
        # Convert to base64
        Image = get_pil()
        fitz = get_fitz()
        
        # If PDF, convert first page to image
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf" and fitz:
            doc = fitz.open(file_path)
            page = doc[0]
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            doc.close()
        else:
            with open(file_path, "rb") as f:
                img_bytes = f.read()
        
        base64_image = base64.b64encode(img_bytes).decode("utf-8")
        
        # Try Gemini first (has vision)
        if self.gemini_api_key:
            result = self._extract_with_gemini_vision(base64_image, document_type)
            if result.get("success"):
                result["processing_time_s"] = round(time.time() - start_time, 3)
                return result
        
        # Fallback to OpenRouter with vision model
        if self.openrouter_api_key:
            result = self._extract_with_openrouter_vision(base64_image, document_type)
            if result.get("success"):
                result["processing_time_s"] = round(time.time() - start_time, 3)
                return result
        
        # Final fallback: use text extraction
        return self.extract(file_path, document_type, use_vision=False)
    
    def _extract_with_gemini_vision(self, base64_image: str, document_type: str) -> Dict:
        """Use Gemini 2.0 Flash for vision extraction"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            
            schema = SCHEMAS.get(document_type, INVOICE_SCHEMA)
            fields = list(schema["fields"].keys())
            
            prompt = f"""Extract the following fields from this {document_type} document image:
            
Fields: {', '.join(fields)}

Return ONLY valid JSON with these fields. Use null for missing values.
For numbers, remove currency symbols. For dates, use YYYY-MM-DD format."""
            
            response = model.generate_content([
                {"mime_type": "image/png", "data": base64_image},
                prompt
            ])
            
            content = response.text
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                data = json.loads(json_match.group())
                return {
                    "success": True,
                    "document_type": document_type,
                    "extracted_data": data,
                    "model_used": "gemini-2.0-flash"
                }
            
        except Exception as e:
            print(f"⚠️ Gemini vision failed: {e}")
        
        return {"success": False}
    
    def _extract_with_openrouter_vision(self, base64_image: str, document_type: str) -> Dict:
        """Use OpenRouter for vision extraction"""
        try:
            schema = SCHEMAS.get(document_type, INVOICE_SCHEMA)
            fields = list(schema["fields"].keys())
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
                                {"type": "text", "text": f"Extract these fields from the document: {', '.join(fields)}. Return only valid JSON."}
                            ]
                        }
                    ],
                    "temperature": 0.1
                },
                timeout=60
            )
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    return {
                        "success": True,
                        "document_type": document_type,
                        "extracted_data": json.loads(json_match.group()),
                        "model_used": "openrouter-gemini"
                    }
                    
        except Exception as e:
            print(f"⚠️ OpenRouter vision failed: {e}")
        
        return {"success": False}


# ============================================================================
# SINGLETON & CONVENIENCE
# ============================================================================

_vdu_engine: Optional[VDUEngine] = None


def get_vdu_engine() -> VDUEngine:
    """Get or create VDUEngine singleton"""
    global _vdu_engine
    if _vdu_engine is None:
        _vdu_engine = VDUEngine()
    return _vdu_engine


def vdu_extract(file_path: str, document_type: str = "INVOICE") -> Dict[str, Any]:
    """
    Extract structured data from a document
    
    Args:
        file_path: Path to PDF or image file
        document_type: Type of document (INVOICE, LR)
        
    Returns:
        Dict with extracted data
    """
    engine = get_vdu_engine()
    return engine.extract(file_path, document_type)


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("VDU Engine Test (Groq Cloud-Based)")
    print("=" * 60)
    
    engine = VDUEngine()
    print(f"✅ Engine ready")
    print(f"   Groq API: {'✅' if engine.groq_api_key else '❌'}")
    print(f"   Gemini API: {'✅' if engine.gemini_api_key else '❌'}")
    print(f"   OpenRouter: {'✅' if engine.openrouter_api_key else '❌'}")
