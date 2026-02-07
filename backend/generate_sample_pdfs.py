"""
Generate sample invoice PDFs for demo.
Run this script to populate the uploads folder with mock PDFs.
"""
import os
from pypdf import PdfWriter
from pypdf import PdfReader
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch

# Sample invoices to generate (matching mock data in supplierInvoiceService)
SAMPLE_INVOICES = [
    {
        "id": "TCI/2024/002",
        "supplier": "TCI Express",
        "origin": "Delhi",
        "destination": "Bangalore",
        "amount": 16284,
        "date": "2024-12-15",
        "vehicle": "MH-12-AB-1234",
        "status": "APPROVED"
    },
    {
        "id": "TCI/2024/003",
        "supplier": "TCI Express",
        "origin": "Mumbai",
        "destination": "Chennai",
        "amount": 12450,
        "date": "2024-12-10",
        "vehicle": "MH-02-CD-5678",
        "status": "APPROVED"
    },
    {
        "id": "TCI/2024/002-A",
        "supplier": "TCI Express",
        "origin": "Delhi",
        "destination": "Bangalore",
        "amount": 16284,
        "date": "2024-12-15",
        "vehicle": "MH-12-AB-1234",
        "status": "DISPUTED"
    },
    {
        "id": "TCI/2024/002-R",
        "supplier": "TCI Express",
        "origin": "Delhi",
        "destination": "Bangalore",
        "amount": 16350,
        "date": "2024-12-15",
        "vehicle": "MH-12-AB-1234",
        "status": "DISPUTED"
    }
]

def create_invoice_pdf(invoice_data, output_path):
    """Generate a professional invoice PDF."""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Header
    c.setFillColor(colors.black)
    c.rect(0, height - 100, width, 100, fill=True)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 55, "FREIGHT INVOICE")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, f"Invoice #: {invoice_data['id']}")
    c.drawString(width - 200, height - 55, f"Date: {invoice_data['date']}")
    c.drawString(width - 200, height - 70, f"Status: {invoice_data['status']}")
    
    # Reset color for body
    c.setFillColor(colors.black)
    y = height - 140
    
    # Supplier Info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "FROM:")
    c.setFont("Helvetica", 11)
    c.drawString(50, y - 18, invoice_data['supplier'])
    c.drawString(50, y - 32, "GSTIN: 27AABCT1234Q1Z5")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(300, y, "TO:")
    c.setFont("Helvetica", 11)
    c.drawString(300, y - 18, "Client Organization")
    c.drawString(300, y - 32, "GSTIN: 27AABCO5678R1Z9")
    
    y -= 80
    
    # Shipment Details Box
    c.setStrokeColor(colors.gray)
    c.rect(50, y - 80, width - 100, 80, stroke=True)
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(60, y - 15, "SHIPMENT DETAILS")
    
    c.setFont("Helvetica", 10)
    c.drawString(60, y - 35, f"Origin: {invoice_data['origin']}")
    c.drawString(60, y - 50, f"Destination: {invoice_data['destination']}")
    c.drawString(300, y - 35, f"Vehicle: {invoice_data['vehicle']}")
    c.drawString(300, y - 50, "Weight: 10 MT")
    c.drawString(60, y - 65, "Material: General Cargo")
    
    y -= 110
    
    # Line Items Header
    c.setFillColor(colors.Color(0.95, 0.95, 0.95))
    c.rect(50, y - 25, width - 100, 25, fill=True)
    c.setFillColor(colors.black)
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(60, y - 18, "Description")
    c.drawString(350, y - 18, "Qty")
    c.drawString(400, y - 18, "Rate")
    c.drawString(480, y - 18, "Amount")
    
    # Line Items
    y -= 45
    c.setFont("Helvetica", 10)
    
    freight = invoice_data['amount'] * 0.85
    c.drawString(60, y, "Basic Freight Charges")
    c.drawString(350, y, "1")
    c.drawString(400, y, f"₹{freight:,.0f}")
    c.drawString(480, y, f"₹{freight:,.0f}")
    
    y -= 20
    loading = invoice_data['amount'] * 0.05
    c.drawString(60, y, "Loading/Unloading")
    c.drawString(350, y, "1")
    c.drawString(400, y, f"₹{loading:,.0f}")
    c.drawString(480, y, f"₹{loading:,.0f}")
    
    y -= 20
    toll = invoice_data['amount'] * 0.05
    c.drawString(60, y, "Toll Charges")
    c.drawString(350, y, "1")
    c.drawString(400, y, f"₹{toll:,.0f}")
    c.drawString(480, y, f"₹{toll:,.0f}")
    
    y -= 20
    gst = invoice_data['amount'] * 0.05
    c.drawString(60, y, "GST @ 5%")
    c.drawString(350, y, "1")
    c.drawString(400, y, f"₹{gst:,.0f}")
    c.drawString(480, y, f"₹{gst:,.0f}")
    
    # Total
    y -= 40
    c.setStrokeColor(colors.black)
    c.line(50, y + 10, width - 50, y + 10)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(380, y - 10, "TOTAL:")
    c.drawString(480, y - 10, f"₹{invoice_data['amount']:,}")
    
    # Footer
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.gray)
    c.drawString(50, 50, "This is a computer-generated invoice.")
    c.drawString(50, 38, f"Document generated for demo purposes - {invoice_data['id']}")
    
    c.save()
    
    # Write to file
    buffer.seek(0)
    with open(output_path, 'wb') as f:
        f.write(buffer.read())
    
    print(f"✓ Created: {output_path}")

def main():
    # Determine upload paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    
    print(f"Generating sample invoices to: {uploads_dir}")
    print("-" * 50)
    
    for inv in SAMPLE_INVOICES:
        # Create filename from ID (replacing slashes with underscores)
        safe_id = inv['id'].replace('/', '_')
        output_path = os.path.join(uploads_dir, f"{safe_id}.pdf")
        create_invoice_pdf(inv, output_path)
    
    print("-" * 50)
    print(f"Generated {len(SAMPLE_INVOICES)} sample invoices!")

if __name__ == "__main__":
    main()
