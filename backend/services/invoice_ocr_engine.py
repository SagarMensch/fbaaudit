"""
Invoice OCR Engine - PaddleOCR PP-Structure Based Extraction
=============================================================
Advanced OCR engine for extracting structured data from freight invoices.
Uses PaddleOCR PP-Structure for text, table, and layout analysis.

Features:
- PDF and Image support
- Table structure recognition
- Field extraction with regex patterns
- Confidence scoring
- Multi-page support

Author: SequelString AI Team
"""

import os
import re
import time
import logging
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Poppler path (local installation)
# Update this if you installed Poppler elsewhere
POPPLER_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'poppler', 'poppler-24.02.0', 'Library', 'bin'
)

# Lazy imports for heavy dependencies
_paddleocr = None
_pdf2image = None
_Image = None
_tesseract = None
_use_tesseract_fallback = False


def get_paddleocr():
    """Lazy load PaddleOCR to avoid startup delay. Falls back to pytesseract if needed."""
    global _paddleocr, _tesseract, _use_tesseract_fallback
    
    # If we already know PaddleOCR doesn't work, use tesseract
    if _use_tesseract_fallback:
        return get_tesseract_fallback()
    
    if _paddleocr is None:
        try:
            from paddleocr import PaddleOCR, PPStructure
            _paddleocr = {'PaddleOCR': PaddleOCR, 'PPStructure': PPStructure}
            logger.info("PaddleOCR loaded successfully")
        except (ImportError, Exception) as e:
            logger.warning(f"PaddleOCR not available ({e}). Falling back to pytesseract...")
            _use_tesseract_fallback = True
            return get_tesseract_fallback()
    return _paddleocr


def get_tesseract_fallback():
    """Fallback to pytesseract for OCR when PaddleOCR fails"""
    global _tesseract
    if _tesseract is None:
        try:
            import pytesseract
            _tesseract = {'pytesseract': pytesseract, 'fallback': True}
            logger.info("Using pytesseract as OCR fallback")
        except ImportError:
            logger.error("Neither PaddleOCR nor pytesseract available")
            raise ImportError("No OCR engine available. Install paddleocr or pytesseract")
    return _tesseract


def get_pdf2image():
    """Lazy load pdf2image"""
    global _pdf2image
    if _pdf2image is None:
        try:
            from pdf2image import convert_from_path, convert_from_bytes
            _pdf2image = {'convert_from_path': convert_from_path, 'convert_from_bytes': convert_from_bytes}
            logger.info("pdf2image loaded successfully")
        except ImportError:
            logger.error("pdf2image not installed. Run: pip install pdf2image")
            raise ImportError("pdf2image not installed")
    return _pdf2image


def get_pil():
    """Lazy load PIL"""
    global _Image
    if _Image is None:
        try:
            from PIL import Image
            _Image = Image
            logger.info("PIL loaded successfully")
        except ImportError:
            logger.error("Pillow not installed. Run: pip install Pillow")
            raise ImportError("Pillow not installed")
    return _Image


# Import Pydantic models
from .invoice_models import (
    FreightInvoice, LineItem, TaxDetails, VendorDetails, 
    ShipmentDetails, OCRExtractionResult
)


# ============================================================================
# REGEX PATTERNS FOR FIELD EXTRACTION
# ============================================================================

PATTERNS = {
    # Invoice identification
    'invoice_number': [
        r'(?:Invoice\s*(?:No|Number|#|:)\s*[:\s]?\s*)([A-Z0-9\-\/]+)',
        r'(?:Bill\s*(?:No|Number)\s*[:\s]?\s*)([A-Z0-9\-\/]+)',
        r'(?:Tax\s*Invoice\s*(?:No)?\s*[:\s]?\s*)([A-Z0-9\-\/]+)',
    ],
    'invoice_date': [
        r'(?:Invoice\s*Date|Inv\.?\s*Date|Date)\s*[:\s]?\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})',
        r'(?:Dated|Dt\.?)\s*[:\s]?\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})',
    ],
    'due_date': [
        r'(?:Due\s*Date|Payment\s*Due)\s*[:\s]?\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})',
    ],
    
    # GST Numbers
    'gstin': [
        r'(?:GSTIN|GST\s*(?:No|Number|IN)|GSTN)\s*[:\s]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})',
    ],
    'pan': [
        r'(?:PAN|PAN\s*(?:No|Number))\s*[:\s]?\s*([A-Z]{5}[0-9]{4}[A-Z]{1})',
    ],
    
    # Freight-specific
    'lr_number': [
        r'(?:LR\s*(?:No|Number)|CN\s*(?:No|Number)|Consignment\s*(?:No|Note))\s*[:\s]?\s*([A-Z0-9\-\/]+)',
        r'(?:Lorry\s*Receipt|Docket\s*No)\s*[:\s]?\s*([A-Z0-9\-\/]+)',
    ],
    'vehicle_number': [
        r'(?:Vehicle\s*(?:No|Number)|Truck\s*(?:No|Number))\s*[:\s]?\s*([A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{1,4})',
        r'(?:Veh\.?\s*No\.?)\s*[:\s]?\s*([A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{1,4})',
    ],
    'weight': [
        r'(?:Weight|Wt\.?|Chargeable\s*Weight)\s*[:\s]?\s*([\d,]+\.?\d*)\s*(?:KG|Kgs?|Kg)',
        r'([\d,]+\.?\d*)\s*(?:KG|Kgs?)\s*(?:Chargeable)?',
    ],
    
    # Locations
    'origin': [
        r'(?:From|Origin|Source|Pickup)\s*[:\s]?\s*([A-Za-z\s]+?)(?:\s*To|\s*-|\n|$)',
    ],
    'destination': [
        r'(?:To|Destination|Dest\.?|Delivery)\s*[:\s]?\s*([A-Za-z\s]+?)(?:\n|,|$)',
    ],
    
    # Amounts
    'subtotal': [
        r'(?:Sub\s*Total|Subtotal|Taxable\s*(?:Value|Amount))\s*[:\s]?\s*(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d*)',
    ],
    'cgst': [
        r'(?:CGST)\s*[@\s]?\s*(\d+\.?\d*)\s*%?\s*[:\s]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)',
    ],
    'sgst': [
        r'(?:SGST)\s*[@\s]?\s*(\d+\.?\d*)\s*%?\s*[:\s]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)',
    ],
    'igst': [
        r'(?:IGST)\s*[@\s]?\s*(\d+\.?\d*)\s*%?\s*[:\s]?\s*(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)',
    ],
    'total': [
        r'(?:Grand\s*Total|Total\s*(?:Amount)?|Net\s*(?:Amount|Payable)|Amount\s*Payable)\s*[:\s]?\s*(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d*)',
        r'(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)\s*(?:Only)?$',
        r'TOTAL[:\s]*(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d*)',
        r'Amount[:\s]*(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d*)',
        r'(?:^|\s)([\d,]{5,}(?:\.\d{2})?)\s*$',  # Match standalone large numbers (likely totals)
    ],
}


class InvoiceOCREngine:
    """
    Advanced OCR Engine for Freight Invoice Extraction
    ===================================================
    Uses PaddleOCR PP-Structure for document understanding.
    """
    
    def __init__(self, use_gpu: bool = False, lang: str = 'en'):
        """
        Initialize OCR Engine
        
        Args:
            use_gpu: Whether to use GPU (default False for CPU)
            lang: Language for OCR ('en', 'hi', 'ch', etc.)
        """
        self.use_gpu = use_gpu
        self.lang = lang
        self._ocr = None
        self._table_engine = None
        self._initialized = False
        
    def _init_engines(self):
        """Lazy initialization of OCR engines"""
        if self._initialized:
            return
            
        try:
            paddle = get_paddleocr()
            
            # Check if we're using tesseract fallback
            if paddle.get('fallback'):
                logger.info("Using pytesseract fallback - skipping PaddleOCR/PPStructure init")
                self._ocr = None
                self._table_engine = None
                self._use_tesseract = True
                self._tesseract = paddle['pytesseract']
                self._initialized = True
                return
            
            self._use_tesseract = False
            
            # Main OCR engine - wrap in try/except for reinitialization issues
            try:
                self._ocr = paddle['PaddleOCR'](
                    use_angle_cls=True,
                    lang=self.lang,
                    use_gpu=self.use_gpu,
                    show_log=False,
                    det_model_dir=None,  # Use default
                    rec_model_dir=None,  # Use default
                )
            except Exception as e:
                if 'already been initialized' in str(e) or 'Reinitialization' in str(e):
                    logger.warning("PaddleOCR already initialized, reusing existing instance")
                    # Try to get existing instance or create minimal one
                    self._ocr = paddle['PaddleOCR'](
                        use_angle_cls=True,
                        lang=self.lang,
                        use_gpu=self.use_gpu,
                        show_log=False,
                    )
                else:
                    raise
            
            # Table structure engine - also handle reinitialization
            try:
                self._table_engine = paddle['PPStructure'](
                    table=True,
                    ocr=True,
                    show_log=False,
                    use_gpu=self.use_gpu,
                    lang=self.lang,
                )
            except Exception as e:
                if 'already been initialized' in str(e) or 'Reinitialization' in str(e):
                    logger.warning("PPStructure already initialized, skipping table engine")
                    self._table_engine = None
                else:
                    raise
            
            self._initialized = True
            logger.info("OCR engines initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize OCR: {e}")
            raise
    
    def extract_from_pdf(self, pdf_path: str) -> OCRExtractionResult:
        """
        Extract invoice data from PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            OCRExtractionResult with extracted data
        """
        start_time = time.time()
        errors = []
        warnings = []
        
        try:
            # Convert PDF to images
            pdf2img = get_pdf2image()
            
            # Use local Poppler installation
            poppler_path = POPPLER_PATH if os.path.exists(POPPLER_PATH) else None
            
            images = pdf2img['convert_from_path'](
                pdf_path,
                dpi=300,
                fmt='png',
                poppler_path=poppler_path
            )
            
            logger.info(f"Converted PDF to {len(images)} images")
            
            # Process each page
            all_text = []
            all_tables = []
            page_confidences = []
            
            for i, image in enumerate(images):
                page_result = self._process_image(image)
                all_text.append(page_result['text'])
                all_tables.extend(page_result['tables'])
                page_confidences.append(page_result['confidence'])
                
            # Combine results
            combined_text = '\n\n--- PAGE BREAK ---\n\n'.join(all_text)
            avg_confidence = sum(page_confidences) / len(page_confidences) if page_confidences else 0
            
            # Extract structured data
            invoice = self._extract_invoice_data(
                combined_text, 
                all_tables, 
                avg_confidence,
                pdf_path,
                len(images)
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return OCRExtractionResult(
                success=True,
                invoice=invoice,
                raw_text=combined_text,
                tables=all_tables,
                confidence=avg_confidence,
                processing_time_ms=processing_time,
                errors=errors,
                warnings=warnings
            )
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return OCRExtractionResult(
                success=False,
                errors=[str(e)],
                processing_time_ms=int((time.time() - start_time) * 1000)
            )
    
    def extract_from_image(self, image_path: str) -> OCRExtractionResult:
        """
        Extract invoice data from image file
        
        Args:
            image_path: Path to image file (JPG, PNG, etc.)
            
        Returns:
            OCRExtractionResult with extracted data
        """
        start_time = time.time()
        
        try:
            Image = get_pil()
            image = Image.open(image_path)
            
            result = self._process_image(image)
            
            invoice = self._extract_invoice_data(
                result['text'],
                result['tables'],
                result['confidence'],
                image_path,
                1
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return OCRExtractionResult(
                success=True,
                invoice=invoice,
                raw_text=result['text'],
                tables=result['tables'],
                confidence=result['confidence'],
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            logger.error(f"Image extraction failed: {e}")
            return OCRExtractionResult(
                success=False,
                errors=[str(e)],
                processing_time_ms=int((time.time() - start_time) * 1000)
            )
    
    def extract_from_bytes(self, file_bytes: bytes, filename: str) -> OCRExtractionResult:
        """
        Extract from file bytes (for API uploads)
        
        Args:
            file_bytes: Raw file bytes
            filename: Original filename (to detect type)
            
        Returns:
            OCRExtractionResult
        """
        # Save to temp file
        suffix = Path(filename).suffix.lower()
        
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        try:
            if suffix == '.pdf':
                return self.extract_from_pdf(tmp_path)
            else:
                return self.extract_from_image(tmp_path)
        finally:
            # Cleanup temp file
            try:
                os.unlink(tmp_path)
            except:
                pass
    
    def _process_image(self, image) -> Dict[str, Any]:
        """
        Process single image with OCR
        
        Returns:
            Dict with 'text', 'tables', 'confidence'
        """
        self._init_engines()
        
        # Convert PIL Image to numpy array
        import numpy as np
        img_array = np.array(image)
        
        # TESSERACT FALLBACK MODE
        if hasattr(self, '_use_tesseract') and self._use_tesseract:
            logger.info("Using pytesseract for OCR extraction")
            try:
                # Use pytesseract for OCR
                full_text = self._tesseract.image_to_string(image)
                # Estimate confidence (tesseract doesn't give per-line confidence easily)
                avg_confidence = 0.75  # Default reasonable confidence
                logger.info(f"Tesseract extracted {len(full_text)} characters")
            except Exception as e:
                logger.error(f"Tesseract OCR failed: {e}")
                full_text = ""
                avg_confidence = 0.0
            
            return {
                'text': full_text,
                'tables': [],  # No table extraction with tesseract fallback
                'confidence': avg_confidence
            }
        
        # PADDLEOCR MODE (original code)
        # Run text OCR
        ocr_result = self._ocr.ocr(img_array, cls=True)
        
        # Extract text and confidence
        text_lines = []
        confidences = []
        
        if ocr_result and ocr_result[0]:
            for line in ocr_result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]
                    conf = line[1][1]
                    text_lines.append(text)
                    confidences.append(conf)
        
        full_text = '\n'.join(text_lines)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Run table extraction
        tables = []
        try:
            table_result = self._table_engine(img_array)
            for item in table_result:
                if item.get('type') == 'table' and 'res' in item:
                    # Extract table structure
                    if 'html' in item['res']:
                        # Parse HTML table
                        table_data = self._parse_html_table(item['res']['html'])
                        if table_data:
                            tables.append(table_data)
        except Exception as e:
            logger.warning(f"Table extraction failed: {e}")
        
        return {
            'text': full_text,
            'tables': tables,
            'confidence': avg_confidence
        }
    
    def _parse_html_table(self, html: str) -> List[List[str]]:
        """Parse HTML table to 2D list"""
        try:
            from html.parser import HTMLParser
            
            class TableParser(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.rows = []
                    self.current_row = []
                    self.current_cell = ''
                    self.in_cell = False
                    
                def handle_starttag(self, tag, attrs):
                    if tag in ('td', 'th'):
                        self.in_cell = True
                        self.current_cell = ''
                    elif tag == 'tr':
                        self.current_row = []
                        
                def handle_endtag(self, tag):
                    if tag in ('td', 'th'):
                        self.in_cell = False
                        self.current_row.append(self.current_cell.strip())
                    elif tag == 'tr':
                        if self.current_row:
                            self.rows.append(self.current_row)
                            
                def handle_data(self, data):
                    if self.in_cell:
                        self.current_cell += data
            
            parser = TableParser()
            parser.feed(html)
            return parser.rows
            
        except Exception as e:
            logger.warning(f"HTML table parsing failed: {e}")
            return []
    
    def _extract_invoice_data(
        self, 
        text: str, 
        tables: List[List[List[str]]], 
        confidence: float,
        source_file: str,
        page_count: int
    ) -> FreightInvoice:
        """
        Extract structured invoice data from OCR text and tables
        """
        
        # Extract fields using regex patterns
        invoice_number = self._extract_field(text, PATTERNS['invoice_number']) or 'UNKNOWN'
        invoice_date = self._extract_date(text, PATTERNS['invoice_date']) or date.today()
        due_date = self._extract_date(text, PATTERNS['due_date'])
        
        # Vendor details
        vendor_gstin = self._extract_field(text, PATTERNS['gstin'])
        vendor_pan = self._extract_field(text, PATTERNS['pan'])
        vendor_name = self._extract_vendor_name(text, vendor_gstin)
        
        # Shipment details
        lr_number = self._extract_field(text, PATTERNS['lr_number'])
        vehicle_number = self._extract_field(text, PATTERNS['vehicle_number'])
        weight = self._extract_number(text, PATTERNS['weight'])
        origin = self._extract_field(text, PATTERNS['origin'])
        destination = self._extract_field(text, PATTERNS['destination'])
        
        # Amounts
        subtotal = self._extract_number(text, PATTERNS['subtotal']) or 0.0
        total = self._extract_number(text, PATTERNS['total']) or subtotal
        
        # Tax extraction
        cgst_match = self._extract_tax(text, PATTERNS['cgst'])
        sgst_match = self._extract_tax(text, PATTERNS['sgst'])
        igst_match = self._extract_tax(text, PATTERNS['igst'])
        
        # Build line items from tables
        line_items = self._extract_line_items(tables, text)
        
        # If no subtotal found, calculate from line items
        if subtotal == 0 and line_items:
            subtotal = sum(item.amount for item in line_items)
        
        # FALLBACK: If subtotal is still 0 but we have a total, use total as subtotal
        # This happens when invoice doesn't have itemized breakdown
        if subtotal == 0 and total > 0:
            subtotal = total
        
        # Build tax details
        tax_details = TaxDetails(
            taxable_amount=subtotal,
            cgst_rate=cgst_match[0] if cgst_match else 0,
            cgst_amount=cgst_match[1] if cgst_match else 0,
            sgst_rate=sgst_match[0] if sgst_match else 0,
            sgst_amount=sgst_match[1] if sgst_match else 0,
            igst_rate=igst_match[0] if igst_match else 0,
            igst_amount=igst_match[1] if igst_match else 0,
        )
        
        # Build shipment details
        shipment = ShipmentDetails(
            lr_number=lr_number,
            vehicle_number=vehicle_number,
            weight_kg=weight,
            origin=origin,
            destination=destination,
        ) if any([lr_number, vehicle_number, weight, origin, destination]) else None
        
        # Build invoice
        return FreightInvoice(
            invoice_number=invoice_number,
            invoice_date=invoice_date,
            due_date=due_date,
            vendor=VendorDetails(
                name=vendor_name or 'Unknown Vendor',
                gstin=vendor_gstin,
                pan=vendor_pan,
            ),
            shipment=shipment,
            line_items=line_items,
            subtotal=subtotal,
            tax_details=tax_details,
            total_amount=total,
            confidence_score=confidence,
            source_file=source_file,
            page_count=page_count,
            extraction_timestamp=datetime.now(),
        )
    
    def _extract_field(self, text: str, patterns: List[str]) -> Optional[str]:
        """Extract field using multiple regex patterns"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_date(self, text: str, patterns: List[str]) -> Optional[date]:
        """Extract and parse date"""
        date_str = self._extract_field(text, patterns)
        if date_str:
            # Try multiple date formats
            formats = ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y', '%d/%m/%y', '%d-%m-%y']
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt).date()
                except ValueError:
                    continue
        return None
    
    def _extract_number(self, text: str, patterns: List[str]) -> Optional[float]:
        """Extract numeric value"""
        value_str = self._extract_field(text, patterns)
        if value_str:
            try:
                # Remove commas and parse
                return float(value_str.replace(',', ''))
            except ValueError:
                pass
        return None
    
    def _extract_tax(self, text: str, patterns: List[str]) -> Optional[Tuple[float, float]]:
        """Extract tax rate and amount"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    rate = float(match.group(1))
                    amount = float(match.group(2).replace(',', ''))
                    return (rate, amount)
                except (ValueError, IndexError):
                    continue
        return None
    
    def _extract_vendor_name(self, text: str, gstin: Optional[str]) -> Optional[str]:
        """Extract vendor name (usually at top of invoice)"""
        lines = text.split('\n')
        
        # First few lines often contain company name
        for line in lines[:10]:
            line = line.strip()
            # Skip lines with common headers
            if any(x in line.lower() for x in ['invoice', 'tax', 'bill', 'gstin', 'pan']):
                continue
            # Company name is usually uppercase or proper case with length > 5
            if len(line) > 5 and line[0].isupper():
                return line
        
        return None
    
    def _extract_line_items(self, tables: List[List[List[str]]], text: str) -> List[LineItem]:
        """Extract line items from tables"""
        items = []
        
        for table in tables:
            if len(table) < 2:
                continue
                
            # Find header row
            header = [cell.lower() for cell in table[0]]
            
            # Look for amount/rate columns
            amount_idx = None
            desc_idx = None
            rate_idx = None
            qty_idx = None
            
            for i, h in enumerate(header):
                if 'amount' in h or 'total' in h:
                    amount_idx = i
                elif 'description' in h or 'particular' in h or 'item' in h:
                    desc_idx = i
                elif 'rate' in h or 'price' in h:
                    rate_idx = i
                elif 'qty' in h or 'quantity' in h:
                    qty_idx = i
            
            # Parse data rows
            for row in table[1:]:
                try:
                    if amount_idx is not None and amount_idx < len(row):
                        amount_str = row[amount_idx].replace(',', '').replace('₹', '').strip()
                        amount = float(amount_str) if amount_str else 0
                        
                        desc = row[desc_idx] if desc_idx is not None and desc_idx < len(row) else 'Freight Charges'
                        
                        rate = 0.0
                        if rate_idx is not None and rate_idx < len(row):
                            rate_str = row[rate_idx].replace(',', '').strip()
                            rate = float(rate_str) if rate_str else 0
                        
                        qty = 1.0
                        if qty_idx is not None and qty_idx < len(row):
                            qty_str = row[qty_idx].replace(',', '').strip()
                            qty = float(qty_str) if qty_str else 1
                        
                        if amount > 0:
                            items.append(LineItem(
                                description=desc,
                                quantity=qty,
                                rate=rate,
                                amount=amount
                            ))
                            
                except (ValueError, IndexError) as e:
                    logger.debug(f"Failed to parse row: {e}")
                    continue
        
        return items


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

# Global engine instance (lazy init)
_engine: Optional[InvoiceOCREngine] = None


def get_ocr_engine() -> InvoiceOCREngine:
    """Get or create OCR engine singleton"""
    global _engine
    if _engine is None:
        _engine = InvoiceOCREngine(use_gpu=False, lang='en')
    return _engine


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def extract_invoice(file_path: str) -> OCRExtractionResult:
    """
    Extract invoice from file path
    
    Args:
        file_path: Path to PDF or image file
        
    Returns:
        OCRExtractionResult
    """
    engine = get_ocr_engine()
    
    suffix = Path(file_path).suffix.lower()
    if suffix == '.pdf':
        return engine.extract_from_pdf(file_path)
    else:
        return engine.extract_from_image(file_path)


def extract_invoice_from_bytes(file_bytes: bytes, filename: str) -> OCRExtractionResult:
    """
    Extract invoice from file bytes
    
    Args:
        file_bytes: Raw file bytes
        filename: Original filename
        
    Returns:
        OCRExtractionResult
    """
    engine = get_ocr_engine()
    return engine.extract_from_bytes(file_bytes, filename)


# ============================================================================
# TEST / DEMO
# ============================================================================

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python invoice_ocr_engine.py <path_to_invoice.pdf>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    print(f"Extracting invoice from: {file_path}")
    
    result = extract_invoice(file_path)
    
    if result.success:
        print("\n" + "="*60)
        print("EXTRACTION SUCCESSFUL")
        print("="*60)
        print(f"Confidence: {result.confidence:.2%}")
        print(f"Processing Time: {result.processing_time_ms}ms")
        print("\n--- INVOICE DATA ---")
        print(result.invoice.model_dump_json(indent=2))
    else:
        print("\n" + "="*60)
        print("EXTRACTION FAILED")
        print("="*60)
        print(f"Errors: {result.errors}")
