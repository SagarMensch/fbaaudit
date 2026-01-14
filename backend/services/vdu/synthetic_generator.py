"""
Synthetic Data Generator
========================
Paper #10 Concept: Use InternVL 2.0 / Groq to generate training data

This module generates synthetic documents for testing:
1. Realistic invoices with Indian company names
2. Lorry receipts with handwriting simulation
3. Edge cases and error scenarios

Usage:
    from services.vdu.synthetic_generator import SyntheticGenerator
    
    generator = SyntheticGenerator()
    
    # Generate sample invoice
    invoice = generator.generate_invoice()
    # Returns: {"raw_text": "...", "ground_truth": {...}}
"""

import os
import re
import json
import random
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# ============================================================================
# INDIAN DATA POOLS
# ============================================================================

INDIAN_COMPANIES = [
    "TCI Express Limited", "Blue Dart Express", "Delhivery Limited",
    "VRL Logistics", "Gati Limited", "Safexpress", "DTDC Express",
    "Allcargo Logistics", "Mahindra Logistics", "TVS SCS",
    "Om Logistics", "Rivigo", "Blackbuck", "Porter", "Shadowfax"
]

INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad",
    "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Nagpur",
    "Indore", "Vadodara", "Chandigarh", "Coimbatore", "Kochi"
]

VEHICLE_TYPES = [
    "32ft MXL", "20ft Container", "14ft Closed", "17ft Closed",
    "Tata Ace", "Eicher 19ft", "Open Truck 32ft", "Trailer 40ft"
]

DRIVER_NAMES = [
    "Ramesh Kumar", "Suresh Singh", "Vijay Sharma", "Anil Yadav",
    "Rajesh Patel", "Mohammed Khan", "Sanjay Verma", "Prakash Joshi"
]

STATE_CODES = {
    "Maharashtra": "27", "Delhi": "07", "Karnataka": "29", "Tamil Nadu": "33",
    "Gujarat": "24", "Rajasthan": "08", "Uttar Pradesh": "09", "West Bengal": "19",
    "Telangana": "36", "Madhya Pradesh": "23", "Punjab": "03", "Kerala": "32"
}


def generate_gstin(state: str = None) -> str:
    """Generate valid-format GSTIN"""
    state_code = STATE_CODES.get(state, random.choice(list(STATE_CODES.values())))
    pan_prefix = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))
    pan_digits = ''.join(random.choices('0123456789', k=4))
    pan_suffix = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    entity_number = random.choice('123456789')
    check_char = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    
    return f"{state_code}{pan_prefix}{pan_digits}{pan_suffix}{entity_number}Z{check_char}"


def generate_vehicle_number() -> str:
    """Generate Indian vehicle registration number"""
    state = random.choice(['MH', 'DL', 'KA', 'TN', 'GJ', 'RJ', 'UP', 'WB'])
    district = str(random.randint(1, 50)).zfill(2)
    series = random.choice(['A', 'B', 'C', 'AB', 'CD', 'MH'])
    number = str(random.randint(1000, 9999))
    return f"{state}{district}{series}{number}"


class SyntheticGenerator:
    """
    Generate synthetic documents for testing and training
    
    Use cases:
    1. Test OCR accuracy on known ground truth
    2. Generate training data for template learning
    3. Create edge cases for stress testing
    """
    
    def __init__(self):
        self.groq_api_key = GROQ_API_KEY
        print("✅ SyntheticGenerator initialized")
    
    def generate_invoice(
        self,
        vendor: str = None,
        difficulty: str = "normal"
    ) -> Dict[str, Any]:
        """
        Generate a synthetic invoice
        
        Args:
            vendor: Specific vendor name (random if None)
            difficulty: "easy", "normal", "hard" (affects noise/formatting)
            
        Returns:
            Dict with raw_text and ground_truth
        """
        # Generate ground truth data
        vendor_name = vendor or random.choice(INDIAN_COMPANIES)
        vendor_gstin = generate_gstin()
        
        data = {
            "invoice_number": f"INV-{random.randint(2024001, 2024999)}",
            "invoice_date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%d/%m/%Y"),
            "vendor_name": vendor_name,
            "vendor_gstin": vendor_gstin,
            "buyer_name": random.choice(["Reliance Industries", "Tata Motors", "Hindustan Unilever", "ITC Limited"]),
            "buyer_gstin": generate_gstin(),
            "origin": random.choice(INDIAN_CITIES),
            "destination": random.choice(INDIAN_CITIES),
            "vehicle_number": generate_vehicle_number(),
            "lr_number": f"LR-{random.randint(100000, 999999)}",
            "lr_date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%d/%m/%Y"),
            "base_amount": round(random.uniform(5000, 100000), 2),
            "weight_kg": random.randint(100, 20000),
            "distance_km": random.randint(100, 2500)
        }
        
        # Calculate taxes
        data["cgst_amount"] = round(data["base_amount"] * 0.025, 2)
        data["sgst_amount"] = round(data["base_amount"] * 0.025, 2)
        data["total_amount"] = round(data["base_amount"] + data["cgst_amount"] + data["sgst_amount"], 2)
        
        # Generate raw text based on difficulty
        if difficulty == "easy":
            raw_text = self._generate_clean_invoice_text(data)
        elif difficulty == "hard":
            raw_text = self._generate_noisy_invoice_text(data)
        else:
            raw_text = self._generate_normal_invoice_text(data)
        
        return {
            "raw_text": raw_text,
            "ground_truth": data,
            "document_type": "INVOICE",
            "difficulty": difficulty
        }
    
    def generate_lr(
        self,
        vendor: str = None,
        handwriting_level: str = "light"
    ) -> Dict[str, Any]:
        """
        Generate a synthetic Lorry Receipt
        
        Args:
            vendor: Transporter name
            handwriting_level: "none", "light", "heavy" (simulates handwriting noise)
        """
        data = {
            "lr_number": f"LR/{random.randint(100000, 999999)}",
            "lr_date": (datetime.now() - timedelta(days=random.randint(1, 15))).strftime("%d-%m-%Y"),
            "consignor_name": random.choice(["ABC Chemicals Pvt Ltd", "XYZ Steel Works", "PQR Textiles"]),
            "consignee_name": random.choice(["Metro Distributors", "City Warehouse", "Regional Hub"]),
            "origin": random.choice(INDIAN_CITIES),
            "destination": random.choice(INDIAN_CITIES),
            "vehicle_number": generate_vehicle_number(),
            "driver_name": random.choice(DRIVER_NAMES),
            "driver_phone": f"9{random.randint(100000000, 999999999)}",
            "goods_description": random.choice(["Chemicals", "Steel Coils", "Textiles", "FMCG", "Electronics"]),
            "weight_kg": random.randint(500, 25000),
            "packages": random.randint(10, 500),
            "declared_value": round(random.uniform(50000, 1000000), 2)
        }
        
        raw_text = self._generate_lr_text(data, handwriting_level)
        
        return {
            "raw_text": raw_text,
            "ground_truth": data,
            "document_type": "LR",
            "handwriting_level": handwriting_level
        }
    
    def generate_batch(
        self,
        count: int = 10,
        document_type: str = "INVOICE"
    ) -> List[Dict[str, Any]]:
        """Generate a batch of synthetic documents"""
        documents = []
        
        difficulties = ["easy", "normal", "normal", "hard"]
        
        for _ in range(count):
            if document_type == "INVOICE":
                doc = self.generate_invoice(difficulty=random.choice(difficulties))
            else:
                doc = self.generate_lr(handwriting_level=random.choice(["none", "light", "heavy"]))
            
            documents.append(doc)
        
        return documents
    
    def generate_with_groq(
        self,
        document_type: str = "INVOICE",
        special_instructions: str = None
    ) -> Dict[str, Any]:
        """
        Use Groq to generate more realistic synthetic documents
        """
        if not self.groq_api_key:
            return self.generate_invoice()
        
        prompt = f"""Generate a realistic Indian freight {document_type.lower()} in plain text format.
Include all standard fields like:
- Invoice/LR number, date
- Vendor/Transporter name and GSTIN
- Origin, Destination cities
- Vehicle number (Indian format like MH12AB1234)
- Weight, packages
- Base amount, taxes (GST), total

{special_instructions or ''}

Return the invoice as it would appear when OCR'd from a scanned document.
Also return the extracted data as JSON at the end, wrapped in ```json``` blocks."""

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
                        {"role": "system", "content": "You generate realistic synthetic documents for OCR testing."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500
                },
                timeout=30
            )
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                
                # Extract JSON ground truth
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
                if json_match:
                    ground_truth = json.loads(json_match.group(1))
                    raw_text = content.split('```json')[0].strip()
                else:
                    ground_truth = {}
                    raw_text = content
                
                return {
                    "raw_text": raw_text,
                    "ground_truth": ground_truth,
                    "document_type": document_type,
                    "generated_by": "groq"
                }
                
        except Exception as e:
            print(f"⚠️ Groq generation failed: {e}")
        
        return self.generate_invoice()
    
    def _generate_clean_invoice_text(self, data: Dict) -> str:
        """Generate clean, well-formatted invoice text"""
        return f"""
TAX INVOICE
{data['vendor_name']}
GSTIN: {data['vendor_gstin']}

Invoice Number: {data['invoice_number']}
Invoice Date: {data['invoice_date']}

Bill To:
{data['buyer_name']}
GSTIN: {data['buyer_gstin']}

Shipment Details:
LR Number: {data['lr_number']}
LR Date: {data['lr_date']}
From: {data['origin']}
To: {data['destination']}
Vehicle No: {data['vehicle_number']}
Weight: {data['weight_kg']} Kg
Distance: {data['distance_km']} Km

Amount Details:
Base Amount: Rs. {data['base_amount']:,.2f}
CGST @ 2.5%: Rs. {data['cgst_amount']:,.2f}
SGST @ 2.5%: Rs. {data['sgst_amount']:,.2f}

Grand Total: Rs. {data['total_amount']:,.2f}
"""
    
    def _generate_normal_invoice_text(self, data: Dict) -> str:
        """Generate normal invoice with slight variations"""
        variations = [
            ("Invoice Number", "Inv No", "Invoice #"),
            ("Invoice Date", "Date", "Inv. Date"),
            ("GSTIN", "GST No", "GST IN"),
            ("Vehicle No", "Truck No", "Vehicle"),
        ]
        
        inv_label = random.choice(variations[0])
        date_label = random.choice(variations[1])
        gst_label = random.choice(variations[2])
        vehicle_label = random.choice(variations[3])
        
        return f"""
{data['vendor_name'].upper()}
{gst_label}: {data['vendor_gstin']}

{inv_label}: {data['invoice_number']}
{date_label}: {data['invoice_date']}

Consignee: {data['buyer_name']}
{gst_label}: {data['buyer_gstin']}

LR No.: {data['lr_number']} | LR Dt: {data['lr_date']}
{data['origin']} --> {data['destination']}
{vehicle_label}: {data['vehicle_number']}
Wt: {data['weight_kg']} Kgs | Dist: {data['distance_km']} KM

Freight: {data['base_amount']:,.2f}
+CGST: {data['cgst_amount']:,.2f}
+SGST: {data['sgst_amount']:,.2f}
=========================
Total: INR {data['total_amount']:,.2f}
"""
    
    def _generate_noisy_invoice_text(self, data: Dict) -> str:
        """Generate noisy invoice simulating poor OCR"""
        def add_noise(text: str) -> str:
            # Randomly replace some characters
            chars = list(text)
            for i in range(len(chars)):
                if random.random() < 0.02:  # 2% noise
                    if chars[i].isalpha():
                        chars[i] = random.choice('Il10O')
                    elif chars[i].isdigit():
                        chars[i] = random.choice('01lIO')
            return ''.join(chars)
        
        base = self._generate_normal_invoice_text(data)
        
        # Add OCR-like noise
        noisy = add_noise(base)
        
        # Add some formatting issues
        lines = noisy.split('\n')
        random.shuffle(lines[5:10])  # Shuffle some middle lines
        
        return '\n'.join(lines)
    
    def _generate_lr_text(self, data: Dict, handwriting_level: str) -> str:
        """Generate LR text with optional handwriting simulation"""
        base_text = f"""
LORRY RECEIPT / GOODS CONSIGNMENT NOTE

LR No: {data['lr_number']}
Date: {data['lr_date']}

Consignor: {data['consignor_name']}
Consignee: {data['consignee_name']}

FROM: {data['origin']}
TO: {data['destination']}

Vehicle No: {data['vehicle_number']}
Driver: {data['driver_name']}
Mobile: {data['driver_phone']}

Goods: {data['goods_description']}
Weight: {data['weight_kg']} Kg
Packages: {data['packages']}
Declared Value: Rs. {data['declared_value']:,.2f}
"""
        
        if handwriting_level == "heavy":
            # Simulate handwriting recognition errors
            replacements = {
                'a': ['o', 'e'], 'e': ['a', 'c'], 'n': ['m', 'r'],
                'm': ['nn', 'rn'], 'l': ['1', 'i'], '0': ['O', 'o']
            }
            
            chars = list(base_text)
            for i in range(len(chars)):
                if random.random() < 0.05:  # 5% error rate
                    if chars[i].lower() in replacements:
                        chars[i] = random.choice(replacements[chars[i].lower()])
            
            return ''.join(chars)
        
        return base_text


# ============================================================================
# SINGLETON
# ============================================================================

_synthetic_generator: Optional[SyntheticGenerator] = None


def get_synthetic_generator() -> SyntheticGenerator:
    global _synthetic_generator
    if _synthetic_generator is None:
        _synthetic_generator = SyntheticGenerator()
    return _synthetic_generator


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Synthetic Data Generator Test")
    print("=" * 60)
    
    gen = SyntheticGenerator()
    
    # Generate sample
    invoice = gen.generate_invoice(difficulty="normal")
    print("\n📄 Sample Invoice:")
    print(invoice["raw_text"][:500])
    print("\n✅ Ground Truth:")
    print(json.dumps(invoice["ground_truth"], indent=2))
