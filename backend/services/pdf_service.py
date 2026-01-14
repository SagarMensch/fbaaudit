from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
import os
import uuid

class PDFGenerator:
    def __init__(self):
        self.output_dir = os.path.join(os.getcwd(), 'generated_pdfs')
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_path(self, prefix):
        return os.path.join(self.output_dir, f"{prefix}_{uuid.uuid4().hex}.pdf")

    def generate_gst_certificate(self, data):
        filepath = self._get_path("GST")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        # Header
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width/2, height - 30*mm, "GOVERNMENT OF INDIA")
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width/2, height - 40*mm, "GST REGISTRATION CERTIFICATE")
        
        # Watermark
        c.saveState()
        c.translate(width/2, height/2)
        c.rotate(45)
        c.setFont("Helvetica-Bold", 80)
        c.setFillColor(colors.lightgrey, alpha=0.3)
        c.drawCentredString(0, 0, "GOVT OF INDIA")
        c.restoreState()
        
        # Content
        c.setFont("Helvetica", 12)
        c.setFillColor(colors.black)
        
        y = height - 70*mm
        x = 20*mm
        
        fields = [
            f"Registration Number (GSTIN): {data.get('gstin', 'N/A')}",
            f"Legal Name: {data.get('legalName', 'N/A')}",
            f"Trade Name: {data.get('tradeName', 'N/A')}",
            f"Constitution of Business: Private Limited Company",
            f"Date of Liability: {data.get('date', 'N/A')}",
            f"Address: Plot No 123, Industrial Area, Mumbai 400001"
        ]
        

    def generate_pan_card(self, data):
        filepath = self._get_path("PAN")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        # Simulated Card
        c.setFillColor(colors.HexColor('#E5F6FD')) # Light Blue
        c.rect(40*mm, height - 100*mm, 130*mm, 80*mm, fill=1, stroke=1)
        
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width/2, height - 35*mm, "INCOME TAX DEPARTMENT")
        c.setFont("Helvetica", 10)
        c.drawCentredString(width/2, height - 42*mm, "GOVT. OF INDIA")
        
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width/2, height - 60*mm, data.get('pan', 'ABCDE1234F'))
        
        c.setFont("Helvetica", 12)
        c.drawString(50*mm, height - 75*mm, data.get('name', 'NAME').upper())
        c.drawString(50*mm, height - 85*mm, f"DOB: {data.get('dob', '01/01/1990')}")
        
        c.save()
        return filepath

    def generate_msme_cert(self, data):
        filepath = self._get_path("MSME")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width/2, height - 30*mm, "UDYAM REGISTRATION CERTIFICATE")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width/2, height - 50*mm, "MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES")
        
        y = height - 80*mm
        x = 30*mm
        
        details = [
            f"Udyam Reg. No: {data.get('udyamNo', 'UDYAM-XX-00-0000000')}",
            f"Name of Enterprise: {data.get('name', 'Enterprise Name')}",
            f"Type of Enterprise: {data.get('type', 'MICRO')}",
            f"Major Activity: SERVICES",
            f"Date of Incorporation: {data.get('date', '2020-01-01')}"
        ]
        
        c.setFont("Helvetica", 12)
        for detail in details:
            c.drawString(x, y, detail)
            y -= 15*mm
            
        c.save()
        return filepath

    def generate_generic_cert(self, data, title="CERTIFICATE"):
        filepath = self._get_path(title.replace(" ", "_"))
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(width/2, height - 30*mm, title)
        
        y = height - 60*mm
        x = 30*mm
        
        c.setFont("Helvetica", 12)
        for key, value in data.items():
            c.drawString(x, y, f"{key}: {value}")
            y -= 12*mm
            
        c.save()
        return filepath

    def generate_invoice(self, data):
        """
        Generates a detailed Commercial Invoice PDF.
        """
        invoice_num = data.get('invoiceNumber', 'INV-000')
        filepath = self._get_path(f"INVOICE_{invoice_num.replace('/', '_')}")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        # --- HEADER ---
        c.setFillColor(colors.HexColor('#1a202c')) # Dark Slate
        c.rect(0, height - 40*mm, width, 40*mm, fill=1, stroke=0)
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(20*mm, height - 20*mm, "INVOICE")
        
        c.setFont("Helvetica", 12)
        c.drawRightString(width - 20*mm, height - 15*mm, f"Invoice #: {invoice_num}")
        c.drawRightString(width - 20*mm, height - 22*mm, f"Date: {data.get('date', 'N/A')}")
        c.drawRightString(width - 20*mm, height - 29*mm, f"Status: {data.get('status', 'DRAFT')}")

        # --- BILLING INFO ---
        y = height - 60*mm
        c.setFillColor(colors.black)
        
        # Supplier (From)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20*mm, y, "FROM:")
        c.setFont("Helvetica", 10)
        c.drawString(20*mm, y - 5*mm, data.get('supplierName', 'TCI Express Limited'))
        c.drawString(20*mm, y - 10*mm, data.get('origin', 'Mumbai'))
        
        # Bill To (Fixed)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(100*mm, y, "BILL TO:")
        c.setFont("Helvetica", 10)
        c.drawString(100*mm, y - 5*mm, "Tata Steel Limited")
        c.drawString(100*mm, y - 10*mm, data.get('destination', 'Jamshedpur'))

        # --- LINE ITEMS TABLE ---
        y = height - 90*mm
        
        # Table Header
        c.setFillColor(colors.HexColor('#f1f5f9'))
        c.rect(20*mm, y, 170*mm, 8*mm, fill=1, stroke=0)
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(25*mm, y + 2*mm, "DESCRIPTION")
        c.drawRightString(180*mm, y + 2*mm, "AMOUNT (INR)")
        
        y -= 10*mm
        
        # Items
        c.setFont("Helvetica", 9)
        items = data.get('lineItems', [])
        for item in items:
            c.drawString(25*mm, y, item.get('description', 'Item'))
            c.drawRightString(180*mm, y, f"{item.get('amount', 0):,.2f}")
            c.line(20*mm, y - 2*mm, 190*mm, y - 2*mm) # Separator
            y -= 10*mm

        # --- TOTALS ---
        y -= 5*mm
        c.setFont("Helvetica-Bold", 12)
        c.drawRightString(180*mm, y, f"Total: {data.get('amount', 0):,.2f} INR")
        
        # Signature
        y -= 40*mm
        c.setFont("Helvetica", 8)
        c.drawString(20*mm, y, "Authorized Signature")
        c.line(20*mm, y + 5*mm, 70*mm, y + 5*mm)

        c.save()
        return filepath

    def generate_bill_of_lading(self, data):
        filepath = self._get_path(f"LR_{data.get('invoiceNumber', 'Unknown').replace('/', '_')}")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width/2, height - 25*mm, "CONSIGNMENT NOTE / BILL OF LADING")
        
        y = height - 50*mm
        c.setFont("Helvetica", 12)
        c.drawString(20*mm, y, f"LR Number: {data.get('lrNumber', 'LR-001')}")
        c.drawString(120*mm, y, f"Date: {data.get('date', '2025-01-01')}")
        y -= 10*mm
        c.drawString(20*mm, y, f"Carrier: {data.get('carrier', 'TCI Express')}")
        c.drawString(120*mm, y, f"Vehicle: {data.get('vehicleNo', 'MH-04-AB-1234')}")
        
        y -= 20*mm
        c.line(20*mm, y, 190*mm, y)
        y -= 10*mm
        
        c.drawString(20*mm, y, f"Consignor: {data.get('origin', 'Origin')}")
        c.drawString(120*mm, y, f"Consignee: {data.get('destination', 'Destination')}")
        
        y -= 30*mm
        c.rect(20*mm, y - 40*mm, 170*mm, 40*mm, stroke=1, fill=0)
        c.drawString(25*mm, y - 10*mm, "Description of Goods")
        c.drawString(25*mm, y - 20*mm, "Industrial Material / Auto Parts")
        c.drawString(120*mm, y - 20*mm, f"Weight: {data.get('weight', '500')} kg")
        c.drawString(120*mm, y - 30*mm, f"Packages: {data.get('packages', '10')}")

        c.save()
        return filepath

    def generate_pod(self, data):
        filepath = self._get_path(f"POD_{data.get('invoiceNumber', 'Unknown').replace('/', '_')}")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width/2, height - 30*mm, "PROOF OF DELIVERY")
        
        y = height - 60*mm
        c.setFont("Helvetica", 12)
        c.drawString(30*mm, y, f"Invoice Ref: {data.get('invoiceNumber', 'N/A')}")
        y -= 15*mm
        c.drawString(30*mm, y, f"Received By: Store In-charge")
        y -= 15*mm
        c.drawString(30*mm, y, f"Delivery Date: {data.get('deliveryDate', '2025-01-05')}")
        y -= 15*mm
        c.drawString(30*mm, y, f"Status: Delivered in Good Condition")
        
        # Signature Box
        y -= 50*mm
        c.rect(30*mm, y, 80*mm, 30*mm, stroke=1, fill=0)
        c.drawString(35*mm, y+25*mm, "Receiver Signature & Stamp")
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(40*mm, y+10*mm, "(Signed Digitally)")

        c.save()
        return filepath

    def generate_eway_bill(self, data):
        filepath = self._get_path(f"EWB_{data.get('invoiceNumber', 'Unknown').replace('/', '_')}")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(width/2, height - 20*mm, "E-WAY BILL")
        c.setFont("Helvetica", 10)
        c.drawCentredString(width/2, height - 25*mm, "Government of India")
        
        y = height - 40*mm
        data_map = [
            ("E-Way Bill No", data.get('ewayBillNo', '141000000000')),
            ("Generated Date", data.get('date', '2025-01-01')),
            ("Generated By", data.get('carrier', 'Vendor')),
            ("Valid Upto", "2025-01-05"),
            ("Mode", "Road"),
            ("Vehicle No", data.get('vehicleNo', 'MH-04-XX-1234')),
            ("From", data.get('origin', 'Origin')),
            ("To", data.get('destination', 'Destination')),
            ("HSN Code", "7308"),
            ("Total Value", f"INR {data.get('amount', '10000')}")
        ]
        
        c.setFont("Helvetica", 11)
        for k, v in data_map:
            c.drawString(30*mm, y, f"{k}:")
            c.setFont("Helvetica-Bold", 11)
            c.drawString(80*mm, y, f"{v}")
            c.setFont("Helvetica", 11)
            y -= 10*mm
            
        c.save()
        return filepath

    def generate_contract(self, data):
        filepath = self._get_path(f"CONTRACT_{data.get('id', 'Unknown')}")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(width/2, height - 25*mm, "LOGISTICS SERVICE AGREEMENT")
        
        y = height - 50*mm
        c.setFont("Helvetica", 10)
        text = [
            f"CONTRACT ID: {data.get('id', 'CNT-001')}",
            f"BETWEEN: Hitachi Energy India Ltd (Shipper)",
            f"AND: {data.get('vendorName', 'Carrier')} (Service Provider)",
            f"EFFECTIVE DATE: {data.get('validFrom', '2024-01-01')}",
            f"EXPIRY DATE: {data.get('validTo', '2025-12-31')}",
            " ",
            "1. SCOPE OF SERVICES",
            f"The Service Provider agrees to provide {data.get('serviceType', 'Transport')} services.",
            " ",
            "2. PAYMENT TERMS",
            f"Payment shall be made within {data.get('paymentTerms', 'Net 30')} days of invoice receipt.",
            " ",
            "3. RATES",
            "Rates are as per Annexure A (Freight Matrix).",
        ]
        
        for line in text:
            c.drawString(20*mm, y, line)
            y -= 7*mm
            
        # Matrix
        y -= 10*mm
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20*mm, y, "ANNEXURE A - FREIGHT MATRIX")
        y -= 5*mm
        c.line(20*mm, y, 190*mm, y)
        y -= 5*mm
        
        c.setFont("Helvetica", 8)
        for rate in data.get('freightMatrix', [])[:10]: # Limit to 10 rows
            row = f"{rate.get('origin')} -> {rate.get('destination')} | {rate.get('vehicleType')} | INR {rate.get('baseRate')} ({rate.get('rateBasis')})"
            c.drawString(20*mm, y, row)
            y -= 5*mm

        c.save()
        return filepath

    def generate_carrier_profile(self, data):
        """
        Generates a 'Power BI' Style Graphical Report Card.
        """
        from reportlab.graphics.shapes import Drawing, Rect, String
        from reportlab.graphics.charts.barcharts import VerticalBarChart
        from reportlab.graphics.charts.piecharts import Pie
        from reportlab.lib.colors import HexColor

        clean_name = data.get('carrierName', 'Carrier').replace(' ', '_').replace('/', '_')
        filepath = self._get_path(f"EXECUTIVE_DASHBOARD_{clean_name}")
        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4
        
        # --- THEME COLORS ---
        BG_DARK = HexColor('#1A202C')
        BG_CARD = HexColor('#2D3748')
        ACCENT_BLUE = HexColor('#3182CE')
        ACCENT_GREEN = HexColor('#38A169')
        ACCENT_ORANGE = HexColor('#DD6B20')
        TEXT_WHITE = colors.white
        TEXT_GRAY = colors.lightgrey

        # --- BACKGROUND ---
        c.setFillColor(BG_DARK)
        c.rect(0, 0, width, height, fill=1)

        # --- HEADER ---
        c.setFillColor(BG_CARD)
        c.rect(0, height - 30*mm, width, 30*mm, fill=1)
        
        c.setFillColor(TEXT_WHITE)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(10*mm, height - 15*mm, f"{data.get('carrierName', 'N/A').upper()} - PERFORMANCE CARD")
        
        c.setFont("Helvetica", 10)
        c.setFillColor(ACCENT_BLUE)
        c.drawString(10*mm, height - 22*mm, f"REPORT GENERATED: {data.get('reportDate', '2025-01-01')} | PERIOD: FY 2024-25")

        # --- KPI ROW ---
        y_kpi = height - 60*mm
        kpi_width = 40*mm
        kpi_gap = 5*mm
        cols = [
            ("PERFORMANCE", f"{data.get('overallGrade', 'B')}", ACCENT_BLUE),
            ("ON-TIME %", f"{data.get('otdScore', 0)}%", ACCENT_GREEN),
            ("SPEND (INR)", f"{data.get('totalSpend', 0)/100000:.1f}L", ACCENT_ORANGE),
            ("INVOICES", f"{data.get('totalInvoices', 0)}", HexColor('#805AD5'))
        ]

        x_start = 10*mm
        for label, val, color in cols:
            # Card BG
            c.setFillColor(BG_CARD)
            c.roundRect(x_start, y_kpi, kpi_width, 25*mm, 4, fill=1, stroke=0)
            
            # Left Stripe
            c.setFillColor(color)
            c.rect(x_start, y_kpi, 2*mm, 25*mm, fill=1)
            
            # Text
            c.setFillColor(TEXT_GRAY)
            c.setFont("Helvetica", 8)
            c.drawString(x_start + 5*mm, y_kpi + 18*mm, label)
            
            c.setFillColor(TEXT_WHITE)
            c.setFont("Helvetica-Bold", 20)
            c.drawString(x_start + 5*mm, y_kpi + 8*mm, val)
            
            x_start += (kpi_width + kpi_gap)

        # --- CHARTS SECTION (SIMULATED VISUALS) ---
        
        # 1. Monthly Trend Bar Chart (Simulated)
        y_chart = height - 130*mm
        c.setFillColor(BG_CARD)
        c.roundRect(10*mm, y_chart, 120*mm, 60*mm, 4, fill=1, stroke=0) # Chart BG
        
        c.setFillColor(TEXT_WHITE)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(15*mm, y_chart + 52*mm, "6-MONTH OTD TREND")
        
        # Draw bars manually for stability WITHOUT renderPM
        bar_x = 25*mm
        bar_width = 10*mm
        bar_gap = 5*mm
        months = ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        values = [85, 88, 82, 90, 92, data.get('otdScore', 95)]
        
        for i, val in enumerate(values):
            h = (val / 100) * 40*mm
            c.setFillColor(ACCENT_BLUE if val > 90 else ACCENT_ORANGE)
            c.rect(bar_x, y_chart + 10*mm, bar_width, h, fill=1, stroke=0)
            
            # Labels
            c.setFillColor(TEXT_GRAY)
            c.setFont("Helvetica", 6)
            c.drawCentredString(bar_x + bar_width/2, y_chart + 6*mm, months[i])
            c.setFillColor(TEXT_WHITE)
            c.drawCentredString(bar_x + bar_width/2, y_chart + h + 11*mm, str(val))
            
            bar_x += (bar_width + bar_gap)

        # 2. Score Breakdown Pie (Simulated Ring)
        pie_x = 140*mm
        c.setFillColor(BG_CARD)
        c.roundRect(pie_x, y_chart, 60*mm, 60*mm, 4, fill=1, stroke=0)
        c.setFillColor(TEXT_WHITE)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(pie_x + 5*mm, y_chart + 52*mm, "COMPLIANCE")
        
        # Draw Ring
        mid_x = pie_x + 30*mm
        mid_y = y_chart + 25*mm
        
        c.setStrokeColor(HexColor('#4A5568'))
        c.setLineWidth(10)
        c.circle(mid_x, mid_y, 15*mm, stroke=1, fill=0)
        
        # Arc (Active Insurance)
        c.setStrokeColor(ACCENT_GREEN)
        c.arc(mid_x-15*mm, mid_y-15*mm, mid_x+15*mm, mid_y+15*mm, 0, 270)
        
        c.setFillColor(TEXT_WHITE)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(mid_x, mid_y - 2*mm, "100%")
        c.setFont("Helvetica", 6)
        c.drawCentredString(mid_x, mid_y - 6*mm, "COMPLIANT")
        
        # --- DETAILED METRICS GRID ---
        y_grid = 60*mm
        c.setFillColor(BG_CARD)
        c.roundRect(10*mm, y_grid, width - 20*mm, 80*mm, 4, fill=1, stroke=0)
        
        c.setFillColor(TEXT_WHITE)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(15*mm, y_grid + 72*mm, "OPERATIONAL METRICS BREAKDOWN")
        
        # Table Header
        header_y = y_grid + 62*mm
        c.setFillColor(HexColor('#4A5568'))
        c.rect(12*mm, header_y, width - 24*mm, 8*mm, fill=1, stroke=0)
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(15*mm, header_y + 2*mm, "METRIC")
        c.drawString(100*mm, header_y + 2*mm, "SCORE")
        c.drawString(130*mm, header_y + 2*mm, "STATUS")
        c.drawString(160*mm, header_y + 2*mm, "TREND")
        
        # Rows
        metrics = [
            ("On-Time Delivery", data.get('otdScore', 85), "EXCELLENT" if data.get('otdScore', 0) > 90 else "GOOD", "⬆"),
            ("Billing Accuracy", data.get('billingScore', 90), "GOOD", "➡"),
            ("POD TAT", data.get('podScore', 75), "AVERAGE", "⬇"),
            ("Damage Free %", data.get('damageScore', 99), "EXCELLENT", "⬆"),
            ("Driver Compliance", "100%", "PERFECT", "➡")
        ]
        
        row_y = header_y - 8*mm
        c.setFont("Helvetica", 9)
        for name, score, status, trend in metrics:
            c.setFillColor(TEXT_WHITE)
            c.drawString(15*mm, row_y + 2*mm, name)
            c.drawString(100*mm, row_y + 2*mm, str(score))
            
            color = ACCENT_GREEN if status in ["EXCELLENT", "PERFECT"] else ACCENT_ORANGE
            c.setFillColor(color)
            c.drawString(130*mm, row_y + 2*mm, status)
            
            c.setFillColor(TEXT_WHITE)
            c.drawString(160*mm, row_y + 2*mm, trend)
            
            c.setStrokeColor(HexColor('#4A5568'))
            c.setLineWidth(0.5)
            c.line(12*mm, row_y, width - 12*mm, row_y)
            row_y -= 10*mm

        #Footer
        c.setFillColor(TEXT_GRAY)
        c.setFont("Helvetica", 6)
        c.drawCentredString(width/2, 10*mm, "Generated by SequelString Control Tower | Confidential & Proprietary")

        c.save()
        return filepath
