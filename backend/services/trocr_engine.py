"""
TrOCR Engine - Microsoft Transformer-based OCR for Handwriting
================================================================
Uses Microsoft's TrOCR model from Hugging Face for superior handwriting recognition.
Runs on CPU by default, GPU optional.

Models used:
- microsoft/trocr-base-handwritten (for handwritten text)
- microsoft/trocr-base-printed (for printed text)

Author: SequelString AI Team
"""

import os
import logging
import time
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy imports for heavy dependencies
_trocr_processor = None
_trocr_model = None
_trocr_printed_processor = None
_trocr_printed_model = None
_torch = None
_Image = None
_pdf2image = None

# Poppler path for PDF conversion
POPPLER_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'poppler', 'poppler-24.02.0', 'Library', 'bin'
)


def get_torch():
    """Lazy load PyTorch"""
    global _torch
    if _torch is None:
        try:
            import torch
            _torch = torch
            logger.info(f"PyTorch loaded (CUDA available: {torch.cuda.is_available()})")
        except ImportError:
            logger.error("PyTorch not installed. Run: pip install torch")
            raise ImportError("PyTorch is required for TrOCR")
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
        from pdf2image import convert_from_path, convert_from_bytes
        _pdf2image = {'convert_from_path': convert_from_path, 'convert_from_bytes': convert_from_bytes}
    return _pdf2image


def get_trocr_handwritten():
    """Lazy load TrOCR handwritten model"""
    global _trocr_processor, _trocr_model
    
    if _trocr_processor is None or _trocr_model is None:
        logger.info("Loading TrOCR handwritten model (first time may take a while)...")
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            
            model_name = "microsoft/trocr-base-handwritten"
            
            _trocr_processor = TrOCRProcessor.from_pretrained(model_name)
            _trocr_model = VisionEncoderDecoderModel.from_pretrained(model_name)
            
            # Move to CPU by default (can be moved to GPU if available)
            torch = get_torch()
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _trocr_model = _trocr_model.to(device)
            _trocr_model.eval()
            
            logger.info(f"TrOCR handwritten model loaded on {device}")
            
        except ImportError as e:
            logger.error(f"TrOCR dependencies missing: {e}")
            logger.error("Install with: pip install transformers torch")
            raise
        except Exception as e:
            logger.error(f"Failed to load TrOCR: {e}")
            raise
    
    return _trocr_processor, _trocr_model


def get_trocr_printed():
    """Lazy load TrOCR printed text model"""
    global _trocr_printed_processor, _trocr_printed_model
    
    if _trocr_printed_processor is None or _trocr_printed_model is None:
        logger.info("Loading TrOCR printed model...")
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            
            model_name = "microsoft/trocr-base-printed"
            
            _trocr_printed_processor = TrOCRProcessor.from_pretrained(model_name)
            _trocr_printed_model = VisionEncoderDecoderModel.from_pretrained(model_name)
            
            torch = get_torch()
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _trocr_printed_model = _trocr_printed_model.to(device)
            _trocr_printed_model.eval()
            
            logger.info(f"TrOCR printed model loaded on {device}")
            
        except Exception as e:
            logger.warning(f"TrOCR printed model not loaded: {e}")
            return None, None
    
    return _trocr_printed_processor, _trocr_printed_model


class TrOCREngine:
    """
    TrOCR-based OCR Engine
    ======================
    Uses Microsoft's Transformer-based OCR for superior text recognition.
    
    Features:
    - Handwritten text recognition (best in class)
    - Printed text recognition
    - Line-by-line processing for documents
    - CPU support (GPU optional for faster processing)
    """
    
    def __init__(self, use_gpu: bool = None, model_type: str = 'handwritten'):
        """
        Initialize TrOCR Engine
        
        Args:
            use_gpu: Whether to use GPU (None = auto-detect)
            model_type: 'handwritten' or 'printed'
        """
        self.model_type = model_type
        
        # Auto-detect GPU
        torch = get_torch()
        if use_gpu is None:
            self.use_gpu = torch.cuda.is_available()
        else:
            self.use_gpu = use_gpu and torch.cuda.is_available()
        
        self.device = "cuda" if self.use_gpu else "cpu"
        self._processor = None
        self._model = None
        self._initialized = False
        
        logger.info(f"TrOCR Engine initialized (device: {self.device}, model: {model_type})")
    
    def _init_model(self):
        """Lazy initialization of TrOCR model"""
        if self._initialized:
            return
        
        if self.model_type == 'handwritten':
            self._processor, self._model = get_trocr_handwritten()
        else:
            self._processor, self._model = get_trocr_printed()
        
        self._initialized = True
    
    def ocr_image(self, image) -> str:
        """
        Perform OCR on a single image (treats as single line)
        
        Args:
            image: PIL Image or numpy array
            
        Returns:
            Extracted text string
        """
        self._init_model()
        
        Image = get_pil()
        torch = get_torch()
        
        # Ensure PIL Image
        if not isinstance(image, Image.Image):
            import numpy as np
            if isinstance(image, np.ndarray):
                image = Image.fromarray(image)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Process image
        pixel_values = self._processor(images=image, return_tensors="pt").pixel_values
        pixel_values = pixel_values.to(self.device)
        
        # Generate text
        with torch.no_grad():
            generated_ids = self._model.generate(pixel_values)
        
        # Decode
        text = self._processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return text.strip()
    
    def ocr_document(self, image, line_height: int = 50) -> Dict[str, Any]:
        """
        Perform OCR on a full document by splitting into lines
        
        Args:
            image: PIL Image of full document
            line_height: Approximate height of text lines in pixels
            
        Returns:
            Dict with 'text', 'lines', 'confidence'
        """
        self._init_model()
        
        Image = get_pil()
        
        if not isinstance(image, Image.Image):
            import numpy as np
            image = Image.fromarray(image)
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        width, height = image.size
        
        # Split image into horizontal strips (lines)
        lines = []
        all_text = []
        
        # Calculate number of strips
        num_strips = max(1, height // line_height)
        strip_height = height // num_strips
        
        for i in range(num_strips):
            y_start = i * strip_height
            y_end = min((i + 1) * strip_height + 10, height)  # Small overlap
            
            # Crop line
            line_img = image.crop((0, y_start, width, y_end))
            
            # Skip very thin strips
            if line_img.size[1] < 10:
                continue
            
            # OCR the line
            try:
                line_text = self.ocr_image(line_img)
                if line_text.strip():
                    lines.append({
                        'text': line_text,
                        'y_position': y_start,
                        'height': strip_height
                    })
                    all_text.append(line_text)
            except Exception as e:
                logger.warning(f"Failed to OCR line {i}: {e}")
                continue
        
        full_text = '\n'.join(all_text)
        
        return {
            'text': full_text,
            'lines': lines,
            'line_count': len(lines),
            'confidence': 0.85 if lines else 0.0  # TrOCR doesn't give per-char confidence
        }
    
    def ocr_pdf(self, pdf_path: str, dpi: int = 200) -> Dict[str, Any]:
        """
        Perform OCR on a PDF file
        
        Args:
            pdf_path: Path to PDF file
            dpi: DPI for PDF rendering
            
        Returns:
            Dict with extracted text and metadata
        """
        start_time = time.time()
        pdf2img = get_pdf2image()
        
        # Convert PDF to images
        poppler_path = POPPLER_PATH if os.path.exists(POPPLER_PATH) else None
        
        try:
            images = pdf2img['convert_from_path'](
                pdf_path,
                dpi=dpi,
                fmt='png',
                poppler_path=poppler_path
            )
        except Exception as e:
            logger.error(f"PDF conversion failed: {e}")
            return {'success': False, 'error': str(e)}
        
        logger.info(f"Converted PDF to {len(images)} pages")
        
        # Process each page
        all_pages = []
        full_text = []
        
        for i, page_img in enumerate(images):
            logger.info(f"Processing page {i+1}/{len(images)}...")
            
            page_result = self.ocr_document(page_img)
            all_pages.append({
                'page_number': i + 1,
                'text': page_result['text'],
                'line_count': page_result['line_count']
            })
            full_text.append(page_result['text'])
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            'success': True,
            'text': '\n\n--- PAGE BREAK ---\n\n'.join(full_text),
            'pages': all_pages,
            'page_count': len(images),
            'processing_time_ms': processing_time
        }
    
    def ocr_image_file(self, image_path: str) -> Dict[str, Any]:
        """
        Perform OCR on an image file
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dict with extracted text and metadata
        """
        start_time = time.time()
        Image = get_pil()
        
        image = Image.open(image_path)
        result = self.ocr_document(image)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            'success': True,
            'text': result['text'],
            'lines': result['lines'],
            'line_count': result['line_count'],
            'confidence': result['confidence'],
            'processing_time_ms': processing_time
        }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_trocr_engine: Optional[TrOCREngine] = None


def get_trocr_engine(model_type: str = 'handwritten') -> TrOCREngine:
    """Get or create TrOCR engine singleton"""
    global _trocr_engine
    if _trocr_engine is None or _trocr_engine.model_type != model_type:
        _trocr_engine = TrOCREngine(model_type=model_type)
    return _trocr_engine


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def trocr_extract(file_path: str, model_type: str = 'handwritten') -> Dict[str, Any]:
    """
    Extract text from file using TrOCR
    
    Args:
        file_path: Path to PDF or image file
        model_type: 'handwritten' or 'printed'
        
    Returns:
        Dict with extracted text and metadata
    """
    engine = get_trocr_engine(model_type)
    
    suffix = Path(file_path).suffix.lower()
    if suffix == '.pdf':
        return engine.ocr_pdf(file_path)
    else:
        return engine.ocr_image_file(file_path)


def trocr_extract_bytes(file_bytes: bytes, filename: str, model_type: str = 'handwritten') -> Dict[str, Any]:
    """
    Extract text from file bytes using TrOCR
    
    Args:
        file_bytes: Raw file bytes
        filename: Original filename
        model_type: 'handwritten' or 'printed'
        
    Returns:
        Dict with extracted text and metadata
    """
    suffix = Path(filename).suffix.lower()
    
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    
    try:
        return trocr_extract(tmp_path, model_type)
    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass


# ============================================================================
# TEST FUNCTION
# ============================================================================

if __name__ == '__main__':
    import sys
    
    print("=" * 60)
    print("TrOCR Engine Test")
    print("=" * 60)
    
    # Test with a sample image if provided
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        print(f"\nProcessing: {file_path}")
        
        result = trocr_extract(file_path)
        
        if result.get('success'):
            print(f"\n✅ Success!")
            print(f"Time: {result.get('processing_time_ms', 0)}ms")
            print(f"\n--- Extracted Text ---")
            print(result.get('text', '')[:2000])
        else:
            print(f"❌ Failed: {result.get('error')}")
    else:
        print("\nUsage: python trocr_engine.py <image_or_pdf_path>")
        print("\nChecking TrOCR availability...")
        
        try:
            engine = get_trocr_engine()
            print("✅ TrOCR engine loaded successfully!")
            print(f"   Device: {engine.device}")
            print(f"   Model: {engine.model_type}")
        except Exception as e:
            print(f"❌ TrOCR not available: {e}")
            print("\nInstall with:")
            print("  pip install transformers torch pillow pdf2image")
