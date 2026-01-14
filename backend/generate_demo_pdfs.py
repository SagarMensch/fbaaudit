"""
Generate Demo PDF Documents for Sentinel Testing
Creates a "perfect" invoice package that passes all 4 Sentinel rings.
"""
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'uploads')

def create_invoice_pdf():
    """Commercial Invoice - DEMO_PERFECT_INV.pdf"""
    filepath = os.path.join(OUTPUT_DIR, 'DEMO_PERFECT_INV.pdf')
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 60, "TCI EXPRESS LIMITED")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, "CIN: L64200MH1986PLC038076 | GSTIN: 27AAACT1234F1ZP")
    
    # Invoice Details
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 120, "TAX INVOICE")
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 150, "Invoice No: DEMO/2024/PERFECT")
    c.drawString(50, height - 165, "Date: 28-Dec-2024")
    c.drawString(50, height - 180, "LR No: LR-DEMO-001")
    
    # Route
    c.drawString(350, height - 150, "Origin: MUMBAI")
    c.drawString(350, height - 165, "Destination: DELHI")
    c.drawString(350, height - 180, "Vehicle: MH04AB1234")
    
    # Bill To
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 220, "Bill To:")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 235, "LedgerOne Logistics Pvt Ltd")
    c.drawString(50, height - 250, "Andheri East, Mumbai - 400069")
    c.drawString(50, height - 265, "GSTIN: 27AABCL1234D1ZS")
    
    # Line Items Table
    c.setFont("Helvetica-Bold", 10)
    y = height - 310
    c.drawString(50, y, "Description")
    c.drawString(300, y, "HSN")
    c.drawString(380, y, "Rate")
    c.drawString(450, y, "Amount")
    c.line(50, y - 5, 550, y - 5)
    
    c.setFont("Helvetica", 10)
    y -= 25
    c.drawString(50, y, "LTL Transportation - Mumbai to Delhi")
    c.drawString(300, y, "996511")
    c.drawString(380, y, "₹10,593")
    c.drawString(450, y, "₹10,593")
    
    # Totals
    c.line(50, y - 40, 550, y - 40)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(350, y - 60, "Subtotal:")
    c.drawString(450, y - 60, "₹10,593")
    c.drawString(350, y - 80, "CGST (9%):")
    c.drawString(450, y - 80, "₹953")
    c.drawString(350, y - 100, "SGST (9%):")
    c.drawString(450, y - 100, "₹954")
    c.line(350, y - 110, 550, y - 110)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(350, y - 135, "TOTAL:")
    c.drawString(450, y - 135, "₹12,500")
    
    # Footer
    c.setFont("Helvetica", 9)
    c.drawString(50, 80, "Payment Terms: Net 30 Days | Bank: HDFC Bank, A/C: 50200012345678")
    c.drawString(50, 65, "This is a computer-generated document. No signature required.")
    
    c.save()
    print(f"Created: {filepath}")

def create_lr_pdf():
    """Lorry Receipt - LR_DEMO_PERFECT.pdf"""
    filepath = os.path.join(OUTPUT_DIR, 'LR_DEMO_PERFECT.pdf')
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 60, "LORRY RECEIPT (LR)")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, "TCI Express Limited")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "LR Number: LR-DEMO-001")
    c.drawString(300, height - 120, "Date: 26-Dec-2024")
    
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 160, "Consignor: ABC Manufacturing Ltd, Mumbai")
    c.drawString(50, height - 180, "Consignee: XYZ Distributors, Delhi")
    c.drawString(50, height - 200, "Vehicle No: MH04AB1234")
    c.drawString(50, height - 220, "Driver: Ramesh Kumar | License: MH0420200012345")
    
    c.drawString(50, height - 260, "Goods Description: Industrial Machinery Parts")
    c.drawString(50, height - 280, "Weight: 8,500 Kg | Packages: 12")
    c.drawString(50, height - 300, "Declared Value: ₹15,00,000")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 350, "Origin: Mumbai Warehouse, Bhiwandi")
    c.drawString(50, height - 370, "Destination: Delhi DC, Gurgaon")
    
    c.drawString(50, 100, "Authorized Signatory")
    c.line(50, 95, 200, 95)
    
    c.save()
    print(f"Created: {filepath}")

def create_pod_pdf():
    """Proof of Delivery - POD_DEMO_PERFECT.pdf"""
    filepath = os.path.join(OUTPUT_DIR, 'POD_DEMO_PERFECT.pdf')
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 60, "PROOF OF DELIVERY (POD)")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, "TCI Express Limited")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "LR Number: LR-DEMO-001")
    c.drawString(300, height - 120, "Delivery Date: 28-Dec-2024")
    
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 160, "Delivered To: XYZ Distributors")
    c.drawString(50, height - 180, "Address: Plot 45, Sector 18, Gurgaon - 122001")
    c.drawString(50, height - 200, "Received By: Suresh Sharma (Store Manager)")
    c.drawString(50, height - 220, "Contact: +91-9876543210")
    
    c.drawString(50, height - 260, "Packages Received: 12 / 12")
    c.drawString(50, height - 280, "Condition: Good - No Damage Reported")
    c.drawString(50, height - 300, "Delivery Time: 14:35 IST")
    
    # Stamp box
    c.rect(350, height - 350, 150, 100)
    c.setFont("Helvetica", 10)
    c.drawString(380, height - 290, "RECEIVED")
    c.drawString(360, height - 310, "XYZ Distributors")
    c.drawString(370, height - 330, "28-Dec-2024")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 120, "Receiver's Signature:")
    c.line(180, 115, 350, 115)
    c.drawString(50, 100, "Seal:")
    
    c.save()
    print(f"Created: {filepath}")

def create_contract_pdf():
    """Rate Contract - CONTRACT_DEMO.pdf"""
    filepath = os.path.join(OUTPUT_DIR, 'CONTRACT_DEMO.pdf')
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 60, "TRANSPORTATION RATE CONTRACT")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 90, "Contract ID: CNT-2024-DEMO")
    c.drawString(300, height - 90, "Effective: 01-Jan-2024 to 31-Dec-2024")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 130, "PARTIES:")
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 150, "Carrier: TCI Express Limited")
    c.drawString(50, height - 170, "Shipper: LedgerOne Logistics Pvt Ltd")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 210, "CONTRACTED RATES (FTL):")
    
    # Rate Table
    c.setFont("Helvetica-Bold", 10)
    y = height - 240
    c.drawString(50, y, "Route")
    c.drawString(250, y, "Vehicle Type")
    c.drawString(380, y, "Rate (INR)")
    c.line(50, y - 5, 500, y - 5)
    
    c.setFont("Helvetica", 10)
    routes = [
        ("MUMBAI → DELHI", "32FT Container", "₹45,000"),
        ("MUMBAI → BANGALORE", "32FT Container", "₹38,000"),
        ("DELHI → CHENNAI", "32FT Container", "₹52,000"),
        ("MUMBAI → KOLKATA", "32FT Container", "₹48,000"),
    ]
    for route, vehicle, rate in routes:
        y -= 20
        c.drawString(50, y, route)
        c.drawString(250, y, vehicle)
        c.drawString(380, y, rate)
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 380, "TERMS:")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 400, "• Payment: Net 30 days from invoice date")
    c.drawString(50, height - 415, "• Fuel Surcharge: As per diesel index, adjusted monthly")
    c.drawString(50, height - 430, "• Detention: ₹1,500/hour after 4 hours free time")
    c.drawString(50, height - 445, "• Insurance: Carrier liability up to ₹50 lakhs per shipment")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 120, "For TCI Express Limited")
    c.line(50, 100, 200, 100)
    c.drawString(300, 120, "For LedgerOne Logistics")
    c.line(300, 100, 450, 100)
    
    c.save()
    print(f"Created: {filepath}")

if __name__ == '__main__':
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    create_invoice_pdf()
    create_lr_pdf()
    create_pod_pdf()
    create_contract_pdf()
    print("\n✓ All demo PDFs created successfully!")
