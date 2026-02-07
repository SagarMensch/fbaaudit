"""
Remark Sentiment Classifier - Naive Bayes / Box of Words
Analyzes logistics remarks (POD comments) to detect disputes and sentiment.

The Pain Point: PODs have handwritten comments like "Gadi late," "Damage box," "Barish mein bheega".
You can't search this in SQL.
The Solution: Auto-tagging invoices as "DISPUTED" with specific categories.

Algorithm: Naive Bayes (Probabilistic)
P(Class | Text) proportional to P(Text | Class) * P(Class)

Classes:
- CLEAN (Positive/Neutral)
- DAMAGE (Negative)
- SHORTAGE (Negative)
- LATE_DELIVERY (Negative)
- DOCUMENT_ISSUE (Negative)
"""

import math
import re
from typing import Dict, List, Tuple

# =============================================================================
# LOGISTICS DOMAIN DICTIONARY (ENGLISH + HINGLISH)
# "Bag of Words" with pre-calculated log-likelihood weights simulating a trained model
# Positive weights indicate strong association with the category
# =============================================================================

# Base probabilities (P(Class)) - Clean is most common
PRIORS = {
    "CLEAN": math.log(0.7),
    "DAMAGE": math.log(0.1),
    "SHORTAGE": math.log(0.1),
    "LATE_DELIVERY": math.log(0.05),
    "DOCUMENT_ISSUE": math.log(0.05)
}

# Feature Classification Dictionary
# Key: Term (lowercase)
# Value: Dict of {Class: Weight}
# Weight represents P(Term | Class) influence
TERM_WEIGHTS = {
    # DAMAGE INDICATORS
    "damage": {"DAMAGE": 4.5, "CLEAN": -2.0},
    "broken": {"DAMAGE": 4.0, "CLEAN": -2.0},
    "leak": {"DAMAGE": 3.8, "CLEAN": -1.5},
    "leakage": {"DAMAGE": 3.8, "CLEAN": -1.5},
    "wet": {"DAMAGE": 3.5, "CLEAN": -1.5},
    "bheega": {"DAMAGE": 4.2, "CLEAN": -2.0}, # Hinglish: Wet
    "toota": {"DAMAGE": 4.2, "CLEAN": -2.0},  # Hinglish: Broken
    "fut": {"DAMAGE": 3.0, "CLEAN": -1.0},    # Hinglish: Foota/Broken
    "scratch": {"DAMAGE": 2.5, "CLEAN": -0.5},
    "dent": {"DAMAGE": 3.0, "CLEAN": -1.0},
    "open": {"DAMAGE": 2.0, "SHORTAGE": 2.0, "CLEAN": -1.0},
    "seal": {"DOCUMENT_ISSUE": 1.5, "SHORTAGE": 2.5, "CLEAN": 0.0},
    "torn": {"DAMAGE": 3.0, "CLEAN": -1.0},
    "condition": {"DAMAGE": 1.0, "CLEAN": 0.0},
    
    # SHORTAGE INDICATORS
    "short": {"SHORTAGE": 4.0, "CLEAN": -2.0},
    "shortage": {"SHORTAGE": 4.5, "CLEAN": -2.5},
    "less": {"SHORTAGE": 3.5, "CLEAN": -1.0},
    "kam": {"SHORTAGE": 4.0, "CLEAN": -2.0},  # Hinglish: Less
    "missing": {"SHORTAGE": 4.5, "CLEAN": -2.5},
    "gayab": {"SHORTAGE": 4.5, "CLEAN": -2.5}, # Hinglish: Missing
    "qty": {"SHORTAGE": 1.0, "CLEAN": 0.0},
    "count": {"SHORTAGE": 1.0, "CLEAN": 0.0},
    "carton": {"SHORTAGE": 1.0, "DAMAGE": 1.0, "CLEAN": 0.0},
    "box": {"SHORTAGE": 1.0, "DAMAGE": 1.0, "CLEAN": 0.0},
    
    # LATE DELIVERY INDICATORS
    "late": {"LATE_DELIVERY": 4.5, "CLEAN": -2.0},
    "delay": {"LATE_DELIVERY": 4.0, "CLEAN": -1.5},
    "wait": {"LATE_DELIVERY": 2.5, "CLEAN": -0.5},
    "waiting": {"LATE_DELIVERY": 2.5, "CLEAN": -0.5},
    "ruka": {"LATE_DELIVERY": 3.0, "CLEAN": -1.0}, # Hinglish: Stopped/Waiting
    "time": {"LATE_DELIVERY": 1.0, "CLEAN": 0.0},
    "hours": {"LATE_DELIVERY": 1.5, "CLEAN": 0.0},
    "gadi": {"LATE_DELIVERY": 1.0, "CLEAN": 0.0}, # Hinglish: Vehicle
    
    # DOCUMENT/POD ISSUES
    "pod": {"DOCUMENT_ISSUE": 1.0, "CLEAN": 0.0},
    "sign": {"DOCUMENT_ISSUE": 2.0, "CLEAN": 0.0},
    "stamp": {"DOCUMENT_ISSUE": 2.0, "CLEAN": 0.0},
    "copy": {"DOCUMENT_ISSUE": 1.5, "CLEAN": 0.0},
    "original": {"DOCUMENT_ISSUE": 1.5, "CLEAN": 0.0},
    "xerox": {"DOCUMENT_ISSUE": 2.0, "CLEAN": 0.0},
    "bill": {"DOCUMENT_ISSUE": 1.0, "CLEAN": 0.0},
    
    # OK/CLEAN INDICATORS
    "ok": {"CLEAN": 3.0, "DAMAGE": -2.0, "SHORTAGE": -2.0},
    "good": {"CLEAN": 2.5, "DAMAGE": -1.5},
    "received": {"CLEAN": 1.0},
    "full": {"CLEAN": 1.5, "SHORTAGE": -2.0},
    "sahi": {"CLEAN": 3.0, "DAMAGE": -2.0}, # Hinglish: Correct/Right
    "pura": {"CLEAN": 2.0, "SHORTAGE": -2.0} # Hinglish: Complete
}

def clean_text(text: str) -> List[str]:
    """Normalize text: distinct words, lowercase, remove punctuation."""
    if not text:
        return []
    # Replace common separators with spaces
    text = re.sub(r'[.,\-/\n\r]', ' ', text)
    # Remove non-alphanumeric (keep spaces)
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    # Lowercase and split
    words = text.lower().split()
    return words

def classify_remark_naive_bayes(text: str) -> Dict:
    """
    Classify logistics remarks using Naive Bayes logic.
    Returns the most likely category and confidence score.
    """
    words = clean_text(text)
    
    # Initialize scores with priors
    scores = {cls: prior for cls, prior in PRIORS.items()}
    
    # Calculate Log Likelihoods: sum(log(P(word|class)))
    matched_words = []
    
    for word in words:
        if word in TERM_WEIGHTS:
            weights = TERM_WEIGHTS[word]
            matched_words.append(word)
            for cls in scores:
                # Add weight if exists for this class, else add negligible/neutral weight
                weight = weights.get(cls, 0.0)
                scores[cls] += weight
    
    # Find best class
    best_class = max(scores, key=scores.get)
    best_score = scores[best_class]
    
    # Calculate Confidence (Softmax-like normalization for display)
    # Convert log-odds back to relative scale
    try:
        exps = {cls: math.exp(score - best_score) for cls, score in scores.items()} # Subtract max for stability
        total_exp = sum(exps.values())
        probabilities = {cls: val / total_exp for cls, val in exps.items()}
        confidence = probabilities[best_class]
    except OverflowError:
        confidence = 1.0
    
    # Determine Status
    is_dispute = best_class != "CLEAN"
    
    # UI Formatting
    ui_status = "Risk Detected" if is_dispute else "Clear"
    ui_color = "#00C805" # Green
    if best_class == "DAMAGE":
        ui_color = "#FF0000" # Red
    elif best_class == "SHORTAGE":
        ui_color = "#FF6B00" # Orange
    elif best_class == "LATE_DELIVERY":
        ui_color = "#0052FF" # Blue (IBM) - but indicates delay
    elif best_class == "DOCUMENT_ISSUE":
        ui_color = "#FFD700" # Yellow/Gold
        
    return {
        "text": text,
        "classification": best_class,
        "is_disputed": is_dispute,
        "confidence_score": round(confidence, 2),
        "confidence_percent": round(confidence * 100),
        "matched_keywords": list(set(matched_words)),
        
        # UI Properties
        "ui_label": ui_status,
        "ui_sublabel": best_class.replace("_", " "),
        "ui_color": ui_color,
        "ui_message": get_ui_message(best_class, matched_words)
    }

def get_ui_message(category: str, keywords: List[str]) -> str:
    """Get a simple business-friendly explanation."""
    kw_str = ", ".join(keywords) if keywords else "text analysis"
    
    if category == "CLEAN":
        return "No risk detected in remarks. POD appears clean."
    elif category == "DAMAGE":
        return f"Potential DAMAGE detected. Keywords found: {kw_str}."
    elif category == "SHORTAGE":
        return f"Potential SHORTAGE detected. Keywords found: {kw_str}."
    elif category == "LATE_DELIVERY":
        return f"LATE DELIVERY indicated. Keywords found: {kw_str}."
    elif category == "DOCUMENT_ISSUE":
        return f"DOCUMENTATION ISSUE detected. Check POD/Seal."
    return "Review required."

# =============================================================================
# TEST
# =============================================================================

def test_classifier():
    print("\n" + "="*60)
    print("REMARK SENTIMENT CLASSIFIER - NAIVE BAYES TEST")
    print("="*60)
    
    test_cases = [
        "Material received ok custom seal intact",
        "Box damage mila, 2 carton bhai bheega hua hai", # Hinglish: Box damage found, 2 cartons wet
        "Gadi 4 hours late report kiya", # Hinglish: Vehicle reported 4 hours late
        "3 box kam hai count mein", # Hinglish: 3 boxes less in count
        "Original pod missing only xerox copy received",
        "Full material good condition"
    ]
    
    for text in test_cases:
        result = classify_remark_naive_bayes(text)
        print(f"\nremark: '{text}'")
        print(f"Server Class: {result['classification']} ({result['confidence_percent']}%)")
        print(f"UI Status: {result['ui_label']} - {result['ui_sublabel']}")
        print(f"Keywords: {result['matched_keywords']}")
        print(f"Message: {result['ui_message']}")

if __name__ == "__main__":
    test_classifier()
