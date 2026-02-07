"""
Generate Test Consolidated Invoice PDF
Creates a realistic invoice PDF to match the Excel annexure
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime

# Read Excel to get grand total
import pandas as pd

df = pd.read_excel('test_annexure_complex.xlsx')
grand_total = df['Total Amt'].replace('', 0).astype(float).sum()

# Create PDF
pdf_filename = 'test_invoice_consolidated.pdf'
doc = SimpleDocTemplate(pdf_filename, pagesize=letter,
                        rightMargin=30, leftMargin=30,
                        topMargin=30, bottomMargin=18)

# Container for story
story = []
styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#1a1a1a'),
    spaceAfter=30,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

header_style = ParagraphStyle(
    'HeaderStyle',
    parent=styles['Normal'],
    fontSize=10,
    textColor=colors.HexColor('#666666'),
    alignment=TA_LEFT
)

# Header Section
story.append(Paragraph("VRL LOGISTICS LIMITED", title_style))
story.append(Paragraph("Consolidated Freight Invoice", 
                      ParagraphStyle('Subtitle', parent=styles['Normal'], 
                                   fontSize=14, alignment=TA_CENTER, 
                                   textColor=colors.HexColor('#0066cc'))))
story.append(Spacer(1, 20))

# Vendor Details Table
vendor_data = [
    ['Vendor Details', ''],
    ['Company Name:', 'VRL Logistics Limited'],
    ['GSTIN:', '29AABCV5738L1Z4'],
    ['PAN:', 'AABCV5738L'],
    ['Address:', 'Plot No. 45, Transport Nagar, Bangalore - 560001'],
    ['Contact:', '+91-80-9876-5432 | ops@vrllogistics.com']
]

vendor_table = Table(vendor_data, colWidths=[2*inch, 4*inch])
vendor_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e6f2ff')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#003366')),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
]))

story.append(vendor_table)
story.append(Spacer(1, 20))

# Invoice Details
invoice_num = f"VRL/CONS/{datetime.now().strftime('%Y')}/0{str(datetime.now().month).zfill(2)}/1847"
invoice_data = [
    ['Invoice Details', '', 'Billing Period', ''],
    ['Invoice Number:', invoice_num, 'Period:', 'December 2024'],
    ['Invoice Date:', datetime.now().strftime('%d-%b-%Y'), 'Due Date:', '15-Jan-2025'],
    ['Payment Terms:', '30 Days from Invoice Date', 'Reference:', 'Monthly Consolidated']
]

invoice_table = Table(invoice_data, colWidths=[1.5*inch, 2*inch, 1.3*inch, 1.7*inch])
invoice_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#fff4e6')),
    ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#e6ffe6')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#663300')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
]))

story.append(invoice_table)
story.append(Spacer(1, 25))

# Summary Section
story.append(Paragraph("INVOICE SUMMARY", 
                      ParagraphStyle('SectionHeader', parent=styles['Heading2'],
                                   fontSize=14, textColor=colors.HexColor('#003366'),
                                   spaceAfter=10, fontName='Helvetica-Bold')))

lr_count = len(df) - 3  # Subtract header, empty rows, total row
summary_data = [
    ['Description', 'Quantity', 'Amount (₹)'],
    ['Total LR Consignments', str(lr_count), ''],
    ['Base Freight Charges', '', f'{(grand_total * 0.85):,.2f}'],
    ['Fuel Surcharge (5%)', '', f'{(grand_total * 0.05):,.2f}'],
    ['Loading/Unloading Charges', '', f'{(grand_total * 0.10):,.2f}'],
    ['', 'Subtotal:', f'{grand_total:,.2f}'],
]

summary_table = Table(summary_data, colWidths=[3.5*inch, 1.5*inch, 1.5*inch])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -2), 10),
    ('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (1, -1), (-1, -1), 12),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fff4e6')),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#999999')),
]))

story.append(summary_table)
story.append(Spacer(1, 20))

# TAX CALCULATION
cgst = grand_total * 0.09
sgst = grand_total * 0.09
total_tax = cgst + sgst
final_total = grand_total + total_tax

tax_data = [
    ['Tax Breakdown', ''],
    ['CGST @ 9%:', f'₹ {cgst:,.2f}'],
    ['SGST @ 9%:', f'₹ {sgst:,.2f}'],
    ['Total Tax:', f'₹ {total_tax:,.2f}'],
    ['GRAND TOTAL:', f'₹ {final_total:,.2f}'],
]

tax_table = Table(tax_data, colWidths=[4.5*inch, 2*inch])
tax_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e6f2ff')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('FONTNAME', (0, 1), (0, -2), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -2), 10),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#003366')),
    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, -1), (-1, -1), 14),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#999999')),
]))

story.append(tax_table)
story.append(Spacer(1, 30))

# Notes
story.append(Paragraph("<b>Important Notes:</b>", 
                      ParagraphStyle('Notes', parent=styles['Normal'], 
                                   fontSize=10, textColor=colors.HexColor('#cc0000'))))
story.append(Paragraph("• Detailed LR-wise breakup attached in Excel annexure", 
                      ParagraphStyle('NoteItem', parent=styles['Normal'], fontSize=9)))
story.append(Paragraph("• Payment to be made by RTGS/NEFT to account details provided", 
                      ParagraphStyle('NoteItem', parent=styles['Normal'], fontSize=9)))
story.append(Paragraph("• This is a computer-generated invoice and does not require signature", 
                      ParagraphStyle('NoteItem', parent=styles['Normal'], fontSize=9)))

# Build PDF
doc.build(story)

print(f"✅ Created consolidated invoice PDF: {pdf_filename}")
print(f"   Invoice Number: {invoice_num}")
print(f"   Subtotal: ₹{grand_total:,.2f}")
print(f"   Total Tax (18%): ₹{total_tax:,.2f}")
print(f"   GRAND TOTAL: ₹{final_total:,.2f}")
print(f"   LR Count: {lr_count}")
