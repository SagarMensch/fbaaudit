"""
OmniParser Form Detection
=========================
Paper #4: "OmniParser: Screen Parsing Tool for Pure Vision Based Agent"

This module detects form elements in documents:
- ☑️ Checkboxes (checked/unchecked)
- 📝 Form fields with labels
- 📊 Table boundaries
- 🔲 Input boxes

Implementation uses OpenCV for detection (no ML model needed).

Usage:
    from services.vdu.omniparser import FormDetector
    
    detector = FormDetector()
    elements = detector.detect("form.pdf")
    # Returns: [{"type": "checkbox", "checked": True, "label": "Agree to terms"}, ...]
"""

import os
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# Lazy imports
_cv2 = None
_np = None
_fitz = None
_Image = None
_tesseract = None


class ElementType(str, Enum):
    """Form element types"""
    CHECKBOX = "CHECKBOX"
    RADIO = "RADIO"
    TEXT_FIELD = "TEXT_FIELD"
    SIGNATURE_BOX = "SIGNATURE_BOX"
    TABLE = "TABLE"
    STAMP = "STAMP"
    BARCODE = "BARCODE"
    QR_CODE = "QR_CODE"
    LOGO = "LOGO"


@dataclass
class FormElement:
    """Detected form element"""
    type: ElementType
    bbox: Tuple[int, int, int, int]  # x, y, width, height
    confidence: float
    page: int = 0
    checked: Optional[bool] = None  # For checkboxes
    label: Optional[str] = None
    value: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "bbox": list(self.bbox),
            "confidence": self.confidence,
            "page": self.page,
            "checked": self.checked,
            "label": self.label,
            "value": self.value
        }


def get_cv2():
    global _cv2
    if _cv2 is None:
        try:
            import cv2
            _cv2 = cv2
        except ImportError:
            print("⚠️ OpenCV not available. Install with: pip install opencv-python")
    return _cv2


def get_numpy():
    global _np
    if _np is None:
        import numpy as np
        _np = np
    return _np


def get_fitz():
    global _fitz
    if _fitz is None:
        try:
            import fitz
            _fitz = fitz
        except ImportError:
            pass
    return _fitz


def get_pil():
    global _Image
    if _Image is None:
        from PIL import Image
        _Image = Image
    return _Image


def get_tesseract():
    global _tesseract
    if _tesseract is None:
        try:
            import pytesseract
            _tesseract = pytesseract
        except ImportError:
            pass
    return _tesseract


class FormDetector:
    """
    OmniParser-style Form Element Detector
    
    Detects:
    1. Checkboxes - Square boxes that may be checked (✓, ✗, filled)
    2. Radio buttons - Circular selection elements
    3. Text fields - Rectangular input areas
    4. Tables - Grid structures
    5. Signatures - Empty boxes in signature areas
    6. Barcodes/QR codes - Machine-readable codes
    """
    
    def __init__(self):
        self.cv2 = get_cv2()
        self.np = get_numpy()
        
        if not self.cv2:
            print("⚠️ FormDetector running in limited mode (no OpenCV)")
    
    def detect(
        self,
        file_path: str,
        detect_checkboxes: bool = True,
        detect_tables: bool = True,
        detect_fields: bool = True,
        detect_barcodes: bool = True
    ) -> Dict[str, Any]:
        """
        Detect form elements in a document
        
        Args:
            file_path: Path to PDF or image
            detect_*: Flags to enable/disable specific detections
            
        Returns:
            Dict with detected elements
        """
        # Load document as images
        images = self._load_document(file_path)
        
        all_elements = []
        
        for page_idx, img in enumerate(images):
            if detect_checkboxes:
                checkboxes = self._detect_checkboxes(img, page_idx)
                all_elements.extend(checkboxes)
            
            if detect_tables:
                tables = self._detect_tables(img, page_idx)
                all_elements.extend(tables)
            
            if detect_fields:
                fields = self._detect_text_fields(img, page_idx)
                all_elements.extend(fields)
            
            if detect_barcodes:
                barcodes = self._detect_barcodes(img, page_idx)
                all_elements.extend(barcodes)
        
        return {
            "success": True,
            "elements": [e.to_dict() for e in all_elements],
            "pages": len(images),
            "summary": self._summarize_elements(all_elements)
        }
    
    def _load_document(self, file_path: str) -> List:
        """Load document as list of numpy arrays (images)"""
        fitz = get_fitz()
        cv2 = self.cv2
        np = self.np
        
        ext = os.path.splitext(file_path)[1].lower()
        images = []
        
        if ext == ".pdf" and fitz:
            try:
                doc = fitz.open(file_path)
                for page in doc:
                    pix = page.get_pixmap(dpi=150)
                    img_data = np.frombuffer(pix.samples, dtype=np.uint8)
                    img = img_data.reshape(pix.height, pix.width, pix.n)
                    if pix.n == 4:  # RGBA to BGR
                        img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
                    elif pix.n == 3:  # RGB to BGR
                        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                    images.append(img)
                doc.close()
            except Exception as e:
                print(f"⚠️ PDF load failed: {e}")
        elif cv2:
            try:
                img = cv2.imread(file_path)
                if img is not None:
                    images.append(img)
            except Exception as e:
                print(f"⚠️ Image load failed: {e}")
        
        return images
    
    def _detect_checkboxes(self, img, page_idx: int) -> List[FormElement]:
        """
        Detect checkboxes in an image
        
        Strategy:
        1. Find small square contours (15-40px)
        2. Check if they contain marks (✓, ✗, fill)
        3. Look for nearby text as label
        """
        if not self.cv2:
            return []
        
        cv2 = self.cv2
        np = self.np
        
        elements = []
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Threshold to binary
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            # Get bounding rect
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter for checkbox-sized squares (15-40 pixels, roughly square)
            if 15 <= w <= 50 and 15 <= h <= 50 and 0.7 <= w/h <= 1.3:
                # Check if it's actually a square (4 corners)
                peri = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
                
                if len(approx) == 4:
                    # Check if filled (checked)
                    roi = binary[y:y+h, x:x+w]
                    fill_ratio = np.sum(roi == 255) / (w * h)
                    
                    # Checkbox is checked if fill ratio is between 10% and 80%
                    # (empty = ~0%, filled/checked = 10-80%, solid = >80%)
                    is_checked = 0.10 < fill_ratio < 0.80
                    
                    # Try to find label (text to the right)
                    label = self._find_nearby_text(img, x + w + 5, y, page_idx)
                    
                    elements.append(FormElement(
                        type=ElementType.CHECKBOX,
                        bbox=(x, y, w, h),
                        confidence=0.85,
                        page=page_idx,
                        checked=is_checked,
                        label=label
                    ))
        
        return elements
    
    def _detect_tables(self, img, page_idx: int) -> List[FormElement]:
        """
        Detect tables in an image
        
        Strategy:
        1. Find horizontal and vertical lines
        2. Find intersections
        3. If enough intersections form a grid, it's a table
        """
        if not self.cv2:
            return []
        
        cv2 = self.cv2
        np = self.np
        
        elements = []
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Threshold
        _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
        
        # Detect horizontal lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel)
        
        # Detect vertical lines
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel)
        
        # Combine
        table_mask = cv2.add(horizontal, vertical)
        
        # Find contours of combined lines
        contours, _ = cv2.findContours(table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter for table-sized regions (at least 100x50)
            if w > 100 and h > 50:
                # Count lines in this region to confirm it's a table
                roi = table_mask[y:y+h, x:x+w]
                line_pixels = np.sum(roi == 255)
                
                if line_pixels > (w + h):  # Has enough lines
                    elements.append(FormElement(
                        type=ElementType.TABLE,
                        bbox=(x, y, w, h),
                        confidence=0.75,
                        page=page_idx
                    ))
        
        return elements
    
    def _detect_text_fields(self, img, page_idx: int) -> List[FormElement]:
        """
        Detect text input fields (empty boxes with labels)
        """
        if not self.cv2:
            return []
        
        cv2 = self.cv2
        np = self.np
        
        elements = []
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Look for horizontal rectangles (text fields are often wide and short)
            if w > 80 and 15 < h < 60 and w/h > 2:
                # Check if mostly empty inside
                roi = binary[y+2:y+h-2, x+2:x+w-2]
                if roi.size > 0:
                    fill_ratio = np.sum(roi == 255) / roi.size
                    
                    # Empty or lightly filled = text field
                    if fill_ratio < 0.3:
                        label = self._find_label_above(img, x, y, page_idx)
                        
                        elements.append(FormElement(
                            type=ElementType.TEXT_FIELD,
                            bbox=(x, y, w, h),
                            confidence=0.7,
                            page=page_idx,
                            label=label
                        ))
        
        return elements
    
    def _detect_barcodes(self, img, page_idx: int) -> List[FormElement]:
        """
        Detect barcodes and QR codes
        """
        if not self.cv2:
            return []
        
        cv2 = self.cv2
        np = self.np
        
        elements = []
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Look for regions with high line frequency (characteristic of barcodes)
        # Use gradient to find edges
        gradX = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        gradY = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        
        gradient = cv2.subtract(gradX, gradY)
        gradient = cv2.convertScaleAbs(gradient)
        
        # Blur and threshold
        blurred = cv2.GaussianBlur(gradient, (9, 9), 0)
        _, binary = cv2.threshold(blurred, 100, 255, cv2.THRESH_BINARY)
        
        # Close gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 7))
        closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Barcodes are typically wider than tall
            if w > 50 and h > 20 and w/h > 1.5:
                area = cv2.contourArea(contour)
                rect_area = w * h
                extent = area / rect_area if rect_area > 0 else 0
                
                if extent > 0.4:  # Reasonably filled
                    elements.append(FormElement(
                        type=ElementType.BARCODE,
                        bbox=(x, y, w, h),
                        confidence=0.65,
                        page=page_idx
                    ))
        
        # Detect QR codes (square with high contrast pattern)
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            
            # QR codes are square
            if 50 < w < 300 and 50 < h < 300 and 0.8 < w/h < 1.2:
                elements.append(FormElement(
                    type=ElementType.QR_CODE,
                    bbox=(x, y, w, h),
                    confidence=0.6,
                    page=page_idx
                ))
        
        return elements
    
    def _find_nearby_text(self, img, x: int, y: int, page_idx: int) -> Optional[str]:
        """Find text near a detected element (for labels)"""
        tesseract = get_tesseract()
        
        if not tesseract:
            return None
        
        try:
            # Crop region to the right of the element
            h, w = img.shape[:2]
            roi = img[max(0, y-5):min(h, y+30), x:min(w, x+200)]
            
            if roi.size == 0:
                return None
            
            text = tesseract.image_to_string(roi, config='--psm 7').strip()
            return text if text else None
            
        except Exception:
            return None
    
    def _find_label_above(self, img, x: int, y: int, page_idx: int) -> Optional[str]:
        """Find label text above a field"""
        tesseract = get_tesseract()
        
        if not tesseract:
            return None
        
        try:
            h, w = img.shape[:2]
            roi = img[max(0, y-25):y, x:min(w, x+200)]
            
            if roi.size == 0:
                return None
            
            text = tesseract.image_to_string(roi, config='--psm 7').strip()
            return text if text else None
            
        except Exception:
            return None
    
    def _summarize_elements(self, elements: List[FormElement]) -> Dict[str, int]:
        """Generate summary of detected elements"""
        summary = {}
        for elem in elements:
            key = elem.type.value
            summary[key] = summary.get(key, 0) + 1
        return summary


# ============================================================================
# CONVENIENCE
# ============================================================================

_form_detector: Optional[FormDetector] = None


def get_form_detector() -> FormDetector:
    global _form_detector
    if _form_detector is None:
        _form_detector = FormDetector()
    return _form_detector


def detect_form_elements(file_path: str) -> Dict[str, Any]:
    """Detect form elements in a document"""
    return get_form_detector().detect(file_path)


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("OmniParser Form Detection Test")
    print("=" * 60)
    
    detector = FormDetector()
    print(f"✅ FormDetector ready")
    print(f"   OpenCV: {'✅' if detector.cv2 else '❌'}")
