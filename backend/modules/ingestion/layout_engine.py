import requests
import json
import os
import re
from typing import Dict, Any

class LayoutEngine:
    """
    Layer 1: Layout-Aware Analysis
    Classifies document sections and extracts key fields using LLM (Mistral/Gemini).
    """

    def __init__(self, llm_client=None):
        self.llm_client = llm_client 
        # Support both MISTRAL_API_KEY and generic API_KEY
        self.api_key = os.getenv("MISTRAL_API_KEY") or os.getenv("API_KEY") 
        self.model = "mistral-large-latest" 
        self.api_url = "https://api.mistral.ai/v1/chat/completions"

    def analyze_layout(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes the document structure and classifies sections.
        """
        content_markdown = document_data.get("content_markdown", "")
        
        if not content_markdown:
            return document_data

        # Combined LLM Call for Layout separation & Extraction
        # This replaces separate heuristic and regex steps with a single robust LLM call
        analysis = self._call_llm_analysis(content_markdown)

        # Fallback to heuristic if LLM returns empty sections (safety net)
        sections = analysis.get("sections")
        if not sections or not sections.get("line_items"):
             sections = self._heuristic_split(content_markdown)

        document_data["layout_analysis"] = sections
        document_data["extracted_data"] = analysis.get("key_fields", {})
        
        return document_data

    def _call_llm_analysis(self, markdown: str) -> Dict[str, Any]:
        """
        Calls Mistral/LLM to extract structure and fields in one go.
        """
        prompt = f"""
        Analyze this invoice markdown and return a JSON object with two keys:
        1. "sections": {{ "header": "start...end", "line_items": "start...end", "footer": "start...end" }} - Extract the exact text content for each section.
        2. "key_fields": {{ 
            "invoice_number": "string", 
            "invoice_date": "YYYY-MM-DD", 
            "total_amount": number, 
            "vendor": {{ "name": "string", "gstin": "string" }},
            "shipment": {{ "origin": "string", "destination": "string", "lr_number": "string" }},
            "line_items": [ {{ "description": "string", "amount": number }} ]
        }}
        
        Markdown Content:
        {markdown[:6000]}  # Truncate to avoid context limit if needed
        """

        try:
             if not self.api_key:
                 print("Warning: No API Key found for LayoutEngine. Returning mock.")
                 return self._mock_fallback(markdown)

             headers = {
                 "Authorization": f"Bearer {self.api_key}",
                 "Content-Type": "application/json"
             }
             
             payload = {
                 "model": self.model,
                 "messages": [{"role": "user", "content": prompt}],
                 "response_format": {"type": "json_object"}
             }
             
             # Attempt to call Mistral API
             response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
             
             if response.status_code == 200:
                 result = response.json()
                 content = result["choices"][0]["message"]["content"]
                 return json.loads(content)
             elif response.status_code == 401:
                  print("Mistral API Unauthorized - Check API Key. Falling back to mock.")
                  return self._mock_fallback(markdown)
             else:
                 print(f"LLM API Error: {response.status_code} - {response.text}")
                 return self._mock_fallback(markdown)

        except Exception as e:
            print(f"LayoutEngine Error: {e}")
            return self._mock_fallback(markdown)

    def _mock_fallback(self, markdown: str) -> Dict[str, Any]:
        """Fallback if API fails - uses Regex but structures it like the LLM output"""
        
        # Heuristic Split
        sections = self._heuristic_split(markdown)
        
        # Regex Extraction
        inv_match = re.search(r'Invoice\s*#?\s*:?\s*(\S+)', markdown, re.IGNORECASE)
        date_match = re.search(r'Date\s*:?\s*(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})', markdown, re.IGNORECASE)
        amount_match = re.search(r'Total\s*:?\s*\$?\s*([\d,]+\.?\d{2})', markdown, re.IGNORECASE)
        vendor_match = re.search(r'Vendor\s*:?\s*(.+)', markdown, re.IGNORECASE)

        return {
            "sections": sections,
            "key_fields": {
                "invoice_number": inv_match.group(1) if inv_match else "UNKNOWN",
                "invoice_date": date_match.group(1) if date_match else None,
                "total_amount": float(amount_match.group(1).replace(',', '')) if amount_match else 0.0,
                "confidence_score": 0.5,
                "vendor": {"name": vendor_match.group(1).strip() if vendor_match else "Unknown Vendor"},
                "shipment": {"origin": "Unknown", "destination": "Unknown"}
            }
        }

    def _heuristic_split(self, markdown: str) -> Dict[str, str]:
        """Simple keyword-based splitting."""
        lower_md = markdown.lower()
        header_end = lower_md.find("description")
        if header_end == -1: header_end = lower_md.find("item")
        
        footer_start = lower_md.find("total")
        if footer_start == -1: footer_start = len(markdown)
        
        return {
            "header": markdown[:header_end] if header_end > 0 else "",
            "line_items": markdown[header_end:footer_start] if header_end > 0 else markdown,
            "footer": markdown[footer_start:]
        }
