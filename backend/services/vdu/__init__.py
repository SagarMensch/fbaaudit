"""
VDU (Visual Document Understanding) Module
==========================================
Based on 2024-2025 Research Papers:

Paper #1  - GOT-OCR 2.0: End-to-end OCR
Paper #2  - Qwen2.5-VL: Handwriting specialist  
Paper #3  - Florence-2: Layout detection
Paper #4  - OmniParser: Form parsing → omniparser.py
Paper #5  - ColPali: Visual RAG → colpali_indexer.py
Paper #6  - TextMonkey: High-res text
Paper #7  - TrOCR: Handwritten text → template_learner.py
Paper #8  - Vary: Vision vocabulary
Paper #9  - StrucTexT v3: Entity linking → vdu_engine.py
Paper #10 - InternVL 2.0: Synthetic data → synthetic_generator.py

Implementation Strategy:
- Uses Groq LLM (llama-3.3-70b-versatile) for cloud-based inference
- No GPU required - runs on CPU with cloud API calls
- Falls back to Gemini 2.0 Flash for vision tasks
- Full confidence calibration and multi-signal voting

Module Components:
- vdu_engine.py: Main extraction orchestrator (StrucTexT logic)
- layout_detector.py: Document region detection (Florence-2 concepts)
- colpali_indexer.py: Visual document search (ColPali)
- omniparser.py: Form element detection (OmniParser)
- template_learner.py: One-shot learning (TrOCR concepts)
- synthetic_generator.py: Test data generation (InternVL concepts)
- confidence.py: Confidence calibration (Ensemble voting)
"""

# Main VDU Engine
from .vdu_engine import VDUEngine, vdu_extract, get_vdu_engine

# Layout Detection
from .layout_detector import LayoutDetector, detect_layout, get_layout_detector

# Visual Search (ColPali Paper #5)
from .colpali_indexer import ColPaliIndexer, index_document, visual_search, get_colpali_indexer

# Form Detection (OmniParser Paper #4)
from .omniparser import FormDetector, detect_form_elements, get_form_detector

# Template Learning (TrOCR Paper #7 + InternVL Paper #10)
from .template_learner import TemplateLearner, get_template_learner

# Synthetic Data (InternVL Paper #10)
from .synthetic_generator import SyntheticGenerator, get_synthetic_generator

# Confidence Calibration (Ensemble concepts)
from .confidence import ConfidenceCalibrator, get_confidence_calibrator

# Enterprise VDU (SAP/Oracle competitor level)
from .enterprise_vdu import EnterpriseVDU, get_enterprise_vdu

__all__ = [
    # Core Engine
    "VDUEngine",
    "vdu_extract",
    "get_vdu_engine",
    
    # Enterprise Orchestrator
    "EnterpriseVDU",
    "get_enterprise_vdu",
    
    # Layout Detection
    "LayoutDetector",
    "detect_layout",
    "get_layout_detector",
    
    # Visual Search
    "ColPaliIndexer",
    "index_document",
    "visual_search",
    "get_colpali_indexer",
    
    # Form Detection
    "FormDetector",
    "detect_form_elements",
    "get_form_detector",
    
    # Template Learning
    "TemplateLearner",
    "get_template_learner",
    
    # Synthetic Data
    "SyntheticGenerator",
    "get_synthetic_generator",
    
    # Confidence
    "ConfidenceCalibrator",
    "get_confidence_calibrator",
]

# Version
__version__ = "2.0.0"  # Enterprise Edition
__papers__ = [
    "GOT-OCR 2.0",
    "Qwen2.5-VL", 
    "Florence-2",
    "OmniParser",
    "ColPali",
    "TextMonkey",
    "TrOCR",
    "Vary",
    "StrucTexT v3",
    "InternVL 2.0"
]
