import os
import random
from reportlab.lib import colors
from reportlab.lib.pagesizes import A5
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime, timedelta

# Setup directories
OUTPUT_DIR = "../public/assets/documents"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_pod(lrr_number, vehicle_number, date):
    filename = f"{OUTPUT_DIR}/POD-{lrr_number}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A5, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    elements.append(Paragraph("<b>PROOF OF DELIVERY (POD)</b>", styles['Title']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Details
    data = [
        ["LR / CN Number:", lrr_number],
        ["Delivery Date:", date],
        ["Vehicle Number:", vehicle_number],
        ["Consignee:", "Hitachi Energy India Ltd"],
        ["From:", "TCI Express Hub, Gurugram"],
        ["Status:", "DELIVERED IN GOOD CONDITION"]
    ]
    
    t = Table(data, colWidths=[2*inch, 2.5*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*inch))
    
    # Receiver Details
    elements.append(Paragraph("<b>Receiver's Stamp & Signature:</b>", styles['Normal']))
    elements.append(Spacer(1, 1.5*inch)) # Space for stamp
    
    # Simulated Stamp Text
    stamp_style = ParagraphStyle('Stamp', parent=styles['Normal'], textColor=colors.blue, borderColor=colors.blue, borderWidth=2, borderPadding=10, alignment=1)
    elements.append(Paragraph("RECEIVED<br/>Hitachi Energy Store<br/>Gate 4, Peenya", stamp_style))
    
    doc.build(elements)
    print(f"Generated POD: {filename}")

if __name__ == "__main__":
    print("Generating PODs...")
    vehicles = ["KA-01-AG-4922", "MH-12-PQ-9981", "DL-04-TC-8821", "HR-55-X-1234"]
    
    for i in range(1, 6):
        lrr = f"LR-8821{i}"
        date = (datetime.now() - timedelta(days=random.randint(1, 10))).strftime("%d-%b-%Y %H:%M")
        veh = random.choice(vehicles)
        generate_pod(lrr, veh, date)
        
    print("POD Generation Complete.")
