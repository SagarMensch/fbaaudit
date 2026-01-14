"""
Generate and Upload Demo Documents to Supabase Storage
=======================================================
Creates sample PDFs if missing, then uploads to Supabase Storage.
"""

import os
import asyncio
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Supabase config  
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

print(f"Supabase URL: {SUPABASE_URL}")
print(f"Key exists: {bool(SUPABASE_ANON_KEY)}")

# Demo invoices to create documents for
DEMO_INVOICES = [
    {
        "id": "DEMO_2024_PERFECT",
        "number": "DEMO/2024/PERFECT",
        "vendor": "TCI Express Limited",
        "origin": "Mumbai",
        "destination": "Delhi",
        "amount": 12500.00,
        "date": "2024-01-15",
    },
    {
        "id": "GPT_24-25_1145",
        "number": "GPT/24-25/1145",
        "vendor": "Blue Dart Express",
        "origin": "Chennai",
        "destination": "Bangalore",
        "amount": 8750.00,
        "date": "2024-01-20",
    },
    {
        "id": "TCI_2024_002",
        "number": "TCI/2024/002",
        "vendor": "TCI Express Limited",
        "origin": "Delhi",
        "destination": "Mumbai",
        "amount": 15200.00,
        "date": "2024-01-18",
    },
    {
        "id": "VRL_2024_778",
        "number": "VRL/2024/778",
        "vendor": "VRL Logistics",
        "origin": "Pune",
        "destination": "Hyderabad",
        "amount": 9800.00,
        "date": "2024-01-22",
    },
]


def generate_invoice_pdf(invoice: dict, output_path: Path) -> bool:
    """Generate a sample invoice PDF using reportlab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        
        doc = SimpleDocTemplate(str(output_path), pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#1a1a2e'))
        elements.append(Paragraph("TAX INVOICE", title_style))
        elements.append(Spacer(1, 20))
        
        # Invoice details
        details = [
            ["Invoice Number:", invoice['number']],
            ["Date:", invoice['date']],
            ["Vendor:", invoice['vendor']],
            ["Origin:", invoice['origin']],
            ["Destination:", invoice['destination']],
        ]
        
        detail_table = Table(details, colWidths=[2*inch, 4*inch])
        detail_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(detail_table)
        elements.append(Spacer(1, 30))
        
        # Line items
        items_data = [
            ["Description", "Qty", "Rate", "Amount"],
            ["Freight Charges", "1", f"₹{invoice['amount']*0.7:.2f}", f"₹{invoice['amount']*0.7:.2f}"],
            ["Fuel Surcharge (10%)", "1", f"₹{invoice['amount']*0.1:.2f}", f"₹{invoice['amount']*0.1:.2f}"],
            ["Loading/Unloading", "1", f"₹{invoice['amount']*0.05:.2f}", f"₹{invoice['amount']*0.05:.2f}"],
            ["Subtotal", "", "", f"₹{invoice['amount']*0.85:.2f}"],
            ["GST (18%)", "", "", f"₹{invoice['amount']*0.15:.2f}"],
            ["TOTAL", "", "", f"₹{invoice['amount']:.2f}"],
        ]
        
        items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8f5e9')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 40))
        
        # Footer
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.grey)
        elements.append(Paragraph("This is a computer-generated invoice. No signature required.", footer_style))
        elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style))
        
        doc.build(elements)
        return True
        
    except ImportError:
        print("   ⚠️  reportlab not installed. Creating placeholder PDF...")
        # Create minimal PDF without reportlab
        pdf_content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 200 >> stream
BT
/F1 24 Tf
50 700 Td
(INVOICE: {invoice['number']}) Tj
0 -40 Td
/F1 12 Tf
(Vendor: {invoice['vendor']}) Tj
0 -20 Td
(Amount: Rs. {invoice['amount']}) Tj
0 -20 Td
(Route: {invoice['origin']} to {invoice['destination']}) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
trailer << /Size 6 /Root 1 0 R >>
%%EOF"""
        with open(output_path, 'w') as f:
            f.write(pdf_content)
        return True
    except Exception as e:
        print(f"   ❌ PDF generation failed: {e}")
        return False


def upload_to_supabase_sync(bucket: str, file_bytes: bytes, path: str) -> tuple:
    """Upload file to Supabase Storage (synchronous)."""
    try:
        from supabase import create_client
        
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        # Try upload first
        try:
            response = client.storage.from_(bucket).upload(
                path=path,
                file=file_bytes,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
            print(f"   📤 Upload response: {response}")
        except Exception as e:
            error_str = str(e)
            if "Duplicate" in error_str or "already exists" in error_str.lower():
                print(f"   🔄 File exists, updating...")
                client.storage.from_(bucket).update(
                    path=path,
                    file=file_bytes,
                    file_options={"content-type": "application/pdf"}
                )
            else:
                raise e
        
        # Get URL
        public_url = client.storage.from_(bucket).get_public_url(path)
        return True, public_url
        
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 60)
    print("DEMO DOCUMENT GENERATOR & UPLOADER")
    print("=" * 60)
    
    base_path = Path(__file__).parent
    output_dir = base_path / "demo_invoices"
    output_dir.mkdir(exist_ok=True)
    
    uploaded = 0
    failed = 0
    
    for invoice in DEMO_INVOICES:
        print(f"\n📄 Processing: {invoice['number']}")
        
        # Generate PDF filename
        pdf_filename = f"invoice_{invoice['id']}.pdf"
        pdf_path = output_dir / pdf_filename
        
        # Generate PDF if not exists
        if not pdf_path.exists():
            print(f"   📝 Generating PDF...")
            if not generate_invoice_pdf(invoice, pdf_path):
                failed += 1
                continue
        
        # Read PDF
        with open(pdf_path, "rb") as f:
            file_bytes = f.read()
        
        print(f"   📦 File size: {len(file_bytes)} bytes")
        
        # Upload to Supabase
        storage_path = f"{invoice['id']}/invoice.pdf"
        success, result = upload_to_supabase_sync("invoices", file_bytes, storage_path)
        
        if success:
            print(f"   ✅ Uploaded to: {storage_path}")
            uploaded += 1
        else:
            print(f"   ❌ Upload failed: {result}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"COMPLETE: {uploaded} uploaded, {failed} failed")
    print("=" * 60)
    
    if uploaded > 0:
        print("\n🎉 Documents are now in Supabase Storage!")
        print("   Check: https://supabase.com/dashboard/project/nwyrcwizbmdvuntgqygd/storage/buckets/invoices")


if __name__ == "__main__":
    main()
