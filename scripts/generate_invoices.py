import random
import os
from datetime import datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm

# Setup directories
OUTPUT_DIR = "../public/assets/documents"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SUPPLIERS = [
    {
        "name": "TCI Express Ltd.",
        "address": "TCI House, 69 Institutional Area, Sector 32, Gurugram - 122001, Haryana",
        "gstin": "06AAACT5656Q1Z8",
        "logo_color": colors.HexColor("#E60012"), # Red-ish
        "prefix": "TCI"
    },
    {
        "name": "Blue Dart Express Ltd.",
        "address": "Blue Dart Centre, Sahar Airport Road, Andheri (East), Mumbai - 400099",
        "gstin": "27AAACB0446L1Z2",
        "logo_color": colors.HexColor("#0047BA"), # Blue
        "prefix": "BD"
    }
]

CUSTOMERS = [
    {
        "name": "Hitachi Energy India Limited",
        "address": "8th Floor, Brigade Opus, 70/1, Hebbal, Bengaluru - 560092, Karnataka",
        "gstin": "29AAACH7409R1Z3"
    }
]

def generate_invoice(invoice_number, date, amount, supplier, customer, status="UNPAID"):
    filename = f"{OUTPUT_DIR}/{invoice_number}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    styles.add(ParagraphStyle(name='HeaderRight', parent=styles['Normal'], alignment=2)) # Right align
    styles.add(ParagraphStyle(name='RefText', parent=styles['Normal'], fontSize=8, textColor=colors.gray))
    
    # --- HEADER ---
    # Logo (Simulated with a colored box for now if image missing, or just text)
    title = Paragraph(f"<font size=18 color={supplier['logo_color']}><b>{supplier['name']}</b></font>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # Address Header Table
    addr_data = [
        [Paragraph(f"<b>Registered Office:</b><br/>{supplier['address']}<br/><b>GSTIN:</b> {supplier['gstin']}", styles['Normal']),
         Paragraph(f"<font size=14><b>TAX INVOICE</b></font><br/><br/><b>Invoice #:</b> {invoice_number}<br/><b>Date:</b> {date}", styles['HeaderRight'])]
    ]
    t_header = Table(addr_data, colWidths=[4*inch, 2.5*inch])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    elements.append(t_header)
    elements.append(Spacer(1, 0.3*inch))
    
    # --- BILL TO / HIP TO ---
    bill_data = [
        [Paragraph("<b>BILL TO:</b>", styles['Normal']), Paragraph("<b>SHIP TO:</b>", styles['Normal'])],
        [Paragraph(f"{customer['name']}<br/>{customer['address']}<br/><b>GSTIN:</b> {customer['gstin']}", styles['Normal']),
         Paragraph(f"{customer['name']}<br/>Factory Unit II, Peenya Industrial Area<br/>Bengaluru - 560058", styles['Normal'])]
    ]
    t_bill = Table(bill_data, colWidths=[3.5*inch, 3*inch])
    t_bill.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (1,0), colors.whitesmoke),
        ('BOTTOMPADDING', (0,0), (1,0), 6),
    ]))
    elements.append(t_bill)
    elements.append(Spacer(1, 0.3*inch))
    
    # --- LINE ITEMS ---
    data = [['Sl.', 'Description of Services', 'HSN/SAC', 'Qty', 'Rate', 'Amount (INR)']]
    
    # Generate random line items
    base_amt = amount / 1.18 # Assume 18% GST included in total
    services = [
        ("Freight Charges - Road Transport (LTL)", "996511"),
        ("Loading/Unloading Charges", "9967"),
        ("Fuel Surcharge", "996511"),
        ("Documentation Charges", "9967")
    ]
    
    total_taxable = 0
    
    for i, (desc, hsn) in enumerate(services, 1):
        if i == len(services): # Last item balancing
            item_amt = base_amt - total_taxable
        else:
            item_amt = base_amt * random.uniform(0.1, 0.4)
            
        total_taxable += item_amt
        data.append([str(i), desc, hsn, "1", f"{item_amt:,.2f}", f"{item_amt:,.2f}"])
        
    # Totals
    cgst = base_amt * 0.09
    sgst = base_amt * 0.09
    total = base_amt + cgst + sgst
    
    data.append(['', 'Total Taxable Value', '', '', '', f"{base_amt:,.2f}"])
    data.append(['', 'CGST (9%)', '', '', '', f"{cgst:,.2f}"])
    data.append(['', 'SGST (9%)', '', '', '', f"{sgst:,.2f}"])
    data.append(['', '<b>Grand Total</b>', '', '', '', f"<b>{total:,.2f}</b>"])
    
    t_items = Table(data, colWidths=[0.5*inch, 3*inch, 1*inch, 0.5*inch, 1*inch, 1.5*inch])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F3F4F6")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (1,0), (1,-1), 'LEFT'), # Desc align left
        ('ALIGN', (-1,0), (-1,-1), 'RIGHT'), # Amount align right
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('SPAN', (0,-4), (-2,-4)), # Span total taxable
        ('SPAN', (0,-3), (-2,-3)), # Span CGST
        ('SPAN', (0,-2), (-2,-2)), # Span SGST
        ('SPAN', (0,-1), (-2,-1)), # Span Grand Total
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#E8F0FE")), # Total Row Blue
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 0.2*inch))
    
    # Amount in words (Simplistic)
    elements.append(Paragraph(f"<b>Amount in Words:</b> INR {int(total)} Only", styles['Normal']))
    elements.append(Spacer(1, 0.5*inch))
    
    # --- FOOTER ---
    # Signature
    sig_data = [
        [Paragraph(f"For <b>{supplier['name']}</b>", styles['Normal'])],
        [Spacer(1, 0.5*inch)],
        [Paragraph("(Authorized Signatory)", styles['Normal'])]
    ]
    t_sig = Table(sig_data, colWidths=[3*inch])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
    ]))
    # Push signature to right
    main_sig_table = Table([[Spacer(1, 1*inch), t_sig]], colWidths=[3.5*inch, 3*inch])
    elements.append(main_sig_table)
    
    # Stamp (Watermark-ish)
    if status == "PAID":
        # Draw a big Green PAID text if possible, simpler to just add text
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph("<font color='green' size=24><b>PAID</b></font>", styles['Title']))
        
    doc.build(elements)
    print(f"Generated: {filename}")

# --- MAIN GENERATION LOOP ---
if __name__ == "__main__":
    print("Generating TCI Express & Blue Dart Invoices...")
    
    # 1. TCI Express Invoices
    for i in range(1, 6):
        inv_num = f"TCI/24-25/{1000+i:04d}"
        date = (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%d-%b-%Y")
        amt = random.randint(5000, 45000)
        generate_invoice(inv_num.replace("/","-"), date, amt, SUPPLIERS[0], CUSTOMERS[0])

    # 2. Blue Dart Invoices
    for i in range(1, 4):
        inv_num = f"BD-INV-{9000+i}"
        date = (datetime.now() - timedelta(days=random.randint(5, 60))).strftime("%d-%b-%Y")
        amt = random.randint(1200, 8500)
        generate_invoice(inv_num, date, amt, SUPPLIERS[1], CUSTOMERS[0])

    print("Done! Look in public/assets/documents/")
