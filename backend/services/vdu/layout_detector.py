"""
Florence-2 Layout Detector
==========================
Paper #3: "Florence-2: Advancing a Unified Representation for a Variety of Vision Tasks"
Microsoft Research, 2024

This module uses Florence-2 to detect document regions:
- HEADER, TABLE, FOOTER, HANDWRITTEN_ZONE, SIGNATURE, TEXT_BLOCK

The model outputs bounding boxes and labels for each region, which are then
passed to specialized readers (GOT-OCR for printed, Qwen for handwriting).

Usage:
    from services.vdu.layout_detector import LayoutDetector
    
    detector = LayoutDetector()
    regions = detector.detect("invoice.pdf")
    # Returns: [{"type": "TABLE", "bbox": [x1, y1, x2, y2], "confidence": 0.95}, ...]
"""

import os
import json
import time
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from enum import Enum

# Lazy imports for heavy dependencies
_torch = None
_Image = None
_florence_model = None
_florence_processor = None
_pdf2image = None

# Poppler path for PDF conversion (Windows)
POPPLER_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'poppler', 'poppler-24.02.0', 'Library', 'bin'
)


class RegionType(str, Enum):
    """Document region types detected by Florence-2"""
    HEADER = "HEADER"
    FOOTER = "FOOTER"
    TABLE = "TABLE"
    TEXT_BLOCK = "TEXT_BLOCK"
    HANDWRITTEN = "HANDWRITTEN"
    SIGNATURE = "SIGNATURE"
    LOGO = "LOGO"
    STAMP = "STAMP"
    BARCODE = "BARCODE"
    UNKNOWN = "UNKNOWN"


@dataclass
class DetectedRegion:
    """A detected region in a document"""
    type: RegionType
    bbox: List[float]  # [x1, y1, x2, y2] normalized 0-1
    confidence: float
    page: int = 0
    label: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "bbox": self.bbox,
            "confidence": self.confidence,
            "page": self.page,
            "label": self.label
        }


def get_torch():
    """Lazy load PyTorch"""
    global _torch
    if _torch is None:
        import torch
        _torch = torch
    return _torch


def get_pil():
    """Lazy load PIL"""
    global _Image
    if _Image is None:
        from PIL import Image
        _Image = Image
    return _Image


def get_pdf2image():
    """Lazy load pdf2image"""
    global _pdf2image
    if _pdf2image is None:
        from pdf2image import convert_from_path
        _pdf2image = convert_from_path
    return _pdf2image


def get_florence_model():
    """
    Lazy load Florence-2 model from HuggingFace
    
    Model: microsoft/Florence-2-base or microsoft/Florence-2-large
    
    Note: Requires transformers >= 4.40.0 and flash-attn for speed
    """
    global _florence_model, _florence_processor
    
    if _florence_model is None:
        try:
            from transformers import AutoProcessor, AutoModelForCausalLM
            
            torch = get_torch()
            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.float16 if device == "cuda" else torch.float32
            
            print("🔄 Loading Florence-2-base model...")
            model_id = "microsoft/Florence-2-base"
            
            _florence_processor = AutoProcessor.from_pretrained(
                model_id, 
                trust_remote_code=True
            )
            _florence_model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=dtype,
                trust_remote_code=True
            ).to(device)
            
            print(f"✅ Florence-2 loaded on {device}")
            
        except ImportError as e:
            print(f"⚠️ Florence-2 not available: {e}")
            print("Install with: pip install transformers torch")
            return None, None
        except Exception as e:
            print(f"❌ Failed to load Florence-2: {e}")
            return None, None
    
    return _florence_model, _florence_processor


class LayoutDetector:
    """
    Document Layout Detector using Florence-2
    
    This is the first stage of the VDU pipeline. It detects regions in a document
    and classifies them into types (header, table, handwritten, etc.).
    
    The detected regions are then routed to specialized readers:
    - TEXT_BLOCK, HEADER, FOOTER → GOT-OCR 2.0
    - HANDWRITTEN, SIGNATURE → Qwen2.5-VL
    - TABLE → GOT-OCR 2.0 with table mode
    """
    
    # Florence-2 task prompts
    TASK_PROMPTS = {
        "detect": "<OD>",  # Object Detection
        "segment": "<REFERRING_EXPRESSION_SEGMENTATION>",
        "caption": "<DETAILED_CAPTION>",
        "ocr": "<OCR_WITH_REGION>",
    }
    
    # Mapping Florence labels to our RegionTypes
    LABEL_MAPPING = {
        "table": RegionType.TABLE,
        "header": RegionType.HEADER,
        "footer": RegionType.FOOTER,
        "text": RegionType.TEXT_BLOCK,
        "paragraph": RegionType.TEXT_BLOCK,
        "title": RegionType.HEADER,
        "handwriting": RegionType.HANDWRITTEN,
        "signature": RegionType.SIGNATURE,
        "logo": RegionType.LOGO,
        "stamp": RegionType.STAMP,
        "barcode": RegionType.BARCODE,
        "qr code": RegionType.BARCODE,
    }
    
    def __init__(self, use_gpu: bool = None):
        """
        Initialize Layout Detector
        
        Args:
            use_gpu: Whether to use GPU (None = auto-detect)
        """
        self.torch = get_torch()
        
        if use_gpu is None:
            self.device = "cuda" if self.torch.cuda.is_available() else "cpu"
        else:
            self.device = "cuda" if use_gpu else "cpu"
        
        self.model = None
        self.processor = None
        self._initialized = False
    
    def _init_model(self):
        """Lazy initialization of Florence-2"""
        if not self._initialized:
            self.model, self.processor = get_florence_model()
            self._initialized = True
    
    def detect(
        self, 
        file_path: str,
        page_limit: int = 10
    ) -> Dict[str, Any]:
        """
        Detect layout regions in a document
        
        Args:
            file_path: Path to PDF or image file
            page_limit: Maximum pages to process for PDFs
            
        Returns:
            Dict with 'regions' (list of DetectedRegion), 'pages', 'processing_time'
        """
        start_time = time.time()
        self._init_model()
        
        if self.model is None:
            return self._fallback_detection(file_path)
        
        # Convert file to images
        images = self._load_file(file_path, page_limit)
        
        all_regions = []
        for page_idx, image in enumerate(images):
            regions = self._detect_page(image, page_idx)
            all_regions.extend(regions)
        
        return {
            "regions": [r.to_dict() for r in all_regions],
            "pages": len(images),
            "processing_time_s": round(time.time() - start_time, 3),
            "model": "Florence-2-base"
        }
    
    def _load_file(self, file_path: str, page_limit: int) -> List:
        """Load PDF or image file into PIL Images"""
        Image = get_pil()
        
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf":
            convert = get_pdf2image()
            try:
                images = convert(
                    file_path, 
                    dpi=150, 
                    first_page=1,
                    last_page=page_limit,
                    poppler_path=POPPLER_PATH if os.path.exists(POPPLER_PATH) else None
                )
            except Exception as e:
                print(f"⚠️ PDF conversion failed: {e}")
                return []
        else:
            images = [Image.open(file_path)]
        
        # Convert to RGB if needed
        return [img.convert("RGB") if img.mode != "RGB" else img for img in images]
    
    def _detect_page(self, image, page_idx: int) -> List[DetectedRegion]:
        """Run Florence-2 detection on a single page"""
        
        # Use Object Detection task
        task_prompt = self.TASK_PROMPTS["detect"]
        
        # Process image
        inputs = self.processor(
            text=task_prompt,
            images=image,
            return_tensors="pt"
        ).to(self.device)
        
        # Generate
        with self.torch.no_grad():
            generated_ids = self.model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                num_beams=3
            )
        
        # Decode
        generated_text = self.processor.batch_decode(
            generated_ids, 
            skip_special_tokens=False
        )[0]
        
        # Parse output (Florence returns structured format)
        parsed = self.processor.post_process_generation(
            generated_text,
            task=task_prompt,
            image_size=(image.width, image.height)
        )
        
        regions = []
        if "<OD>" in parsed:
            od_result = parsed["<OD>"]
            bboxes = od_result.get("bboxes", [])
            labels = od_result.get("labels", [])
            
            for bbox, label in zip(bboxes, labels):
                # Normalize bbox to 0-1
                norm_bbox = [
                    bbox[0] / image.width,
                    bbox[1] / image.height,
                    bbox[2] / image.width,
                    bbox[3] / image.height
                ]
                
                region_type = self._map_label(label.lower())
                
                regions.append(DetectedRegion(
                    type=region_type,
                    bbox=norm_bbox,
                    confidence=0.90,  # Florence doesn't provide per-box confidence
                    page=page_idx,
                    label=label
                ))
        
        # If no regions detected, add a full-page TEXT_BLOCK
        if not regions:
            regions.append(DetectedRegion(
                type=RegionType.TEXT_BLOCK,
                bbox=[0, 0, 1, 1],
                confidence=0.5,
                page=page_idx,
                label="full_page"
            ))
        
        return regions
    
    def _map_label(self, label: str) -> RegionType:
        """Map Florence label to our RegionType"""
        for key, region_type in self.LABEL_MAPPING.items():
            if key in label:
                return region_type
        return RegionType.UNKNOWN
    
    def _fallback_detection(self, file_path: str) -> Dict[str, Any]:
        """
        Fallback when Florence-2 is not available
        Uses simple heuristics based on page zones
        """
        Image = get_pil()
        images = self._load_file(file_path, page_limit=5)
        
        regions = []
        for page_idx, _ in enumerate(images):
            # Simple zone-based fallback
            regions.extend([
                DetectedRegion(
                    type=RegionType.HEADER,
                    bbox=[0, 0, 1, 0.15],
                    confidence=0.6,
                    page=page_idx,
                    label="header_zone"
                ),
                DetectedRegion(
                    type=RegionType.TEXT_BLOCK,
                    bbox=[0, 0.15, 1, 0.85],
                    confidence=0.6,
                    page=page_idx,
                    label="content_zone"
                ),
                DetectedRegion(
                    type=RegionType.FOOTER,
                    bbox=[0, 0.85, 1, 1],
                    confidence=0.6,
                    page=page_idx,
                    label="footer_zone"
                ),
            ])
        
        return {
            "regions": [r.to_dict() for r in regions],
            "pages": len(images),
            "processing_time_s": 0.1,
            "model": "fallback_zones"
        }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_layout_detector: Optional[LayoutDetector] = None


def get_layout_detector() -> LayoutDetector:
    """Get or create LayoutDetector singleton"""
    global _layout_detector
    if _layout_detector is None:
        _layout_detector = LayoutDetector()
    return _layout_detector


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def detect_layout(file_path: str) -> Dict[str, Any]:
    """
    Detect document layout regions
    
    Args:
        file_path: Path to PDF or image file
        
    Returns:
        Dict with detected regions
    """
    detector = get_layout_detector()
    return detector.detect(file_path)


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("VDU Layout Detector Test")
    print("=" * 60)
    
    # Test initialization
    try:
        detector = LayoutDetector()
        print("✅ LayoutDetector initialized")
        print(f"   Device: {detector.device}")
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
