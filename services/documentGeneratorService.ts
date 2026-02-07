import { jsPDF } from 'jspdf';

// Service to generate realistic Indian logistics PDF documents
class DocumentGeneratorService {

    // Generate Commercial Invoice PDF
    generateCommercialInvoice(invoiceData: any): Blob {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('BLUE DART EXPRESS LIMITED', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Blue Dart Centre, Sahar Airport Road, Andheri East', 105, 28, { align: 'center' });
        doc.text('Mumbai - 400099, Maharashtra, India', 105, 33, { align: 'center' });
        doc.text('GSTIN: 27AABCB5678R1Z9 | PAN: AABCB5678R', 105, 38, { align: 'center' });

        // Invoice Details
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('COMMERCIAL INVOICE', 105, 50, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice No: ${invoiceData.invoiceNumber || 'BD/2024/002'}`, 20, 60);
        doc.text(`Date: ${invoiceData.date || '18-Dec-2025'}`, 150, 60);
        doc.text(`AWB No: ${invoiceData.awbNumber || 'AWB_BD_002'}`, 20, 67);

        // Bill To
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, 80);
        doc.setFont('helvetica', 'normal');
        doc.text('Acme Pharmaceuticals Pvt Ltd', 20, 87);
        doc.text('Electronics City, Hosur Road', 20, 94);
        doc.text('Bangalore - 560100, Karnataka', 20, 101);
        doc.text('GSTIN: 29AABCA1234R1Z5', 20, 108);

        // Shipment Details
        doc.setFont('helvetica', 'bold');
        doc.text('Shipment Details:', 120, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(`Origin: ${invoiceData.origin || 'Mumbai'}`, 120, 87);
        doc.text(`Destination: ${invoiceData.destination || 'Bangalore'}`, 120, 94);
        doc.text(`Weight: ${invoiceData.weight || '250'} kg`, 120, 101);
        doc.text('Service: Air Express', 120, 108);

        // Line Items Table
        doc.setFont('helvetica', 'bold');
        doc.text('Description', 20, 125);
        doc.text('HSN/SAC', 90, 125);
        doc.text('Amount (₹)', 150, 125);
        doc.line(20, 127, 190, 127);

        doc.setFont('helvetica', 'normal');
        doc.text('Air Express Service', 20, 135);
        doc.text('996791', 90, 135);
        doc.text('8,100.00', 150, 135);

        doc.text('Fuel Surcharge (15%)', 20, 143);
        doc.text('996791', 90, 143);
        doc.text('1,215.00', 150, 143);

        doc.text('IGST @ 18%', 20, 151);
        doc.text('', 90, 151);
        doc.text('1,676.70', 150, 151);

        doc.line(20, 155, 190, 155);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Amount', 20, 163);
        doc.text('₹10,991.70', 150, 163);

        // Bank Details
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Details:', 20, 180);
        doc.setFont('helvetica', 'normal');
        doc.text('Bank: HDFC Bank Ltd', 20, 187);
        doc.text('Account No: 50200012345678', 20, 194);
        doc.text('IFSC Code: HDFC0001234', 20, 201);
        doc.text('Branch: Andheri East, Mumbai', 20, 208);

        // Footer
        doc.setFontSize(8);
        doc.text('This is a computer generated invoice and does not require signature.', 105, 270, { align: 'center' });
        doc.text('For Blue Dart Express Limited', 150, 250);
        doc.text('Authorized Signatory', 150, 257);

        return doc.output('blob');
    }

    // Generate Bill of Lading (LR) PDF
    generateBillOfLading(invoiceData: any): Blob {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('AIR WAYBILL', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text('BLUE DART EXPRESS LIMITED', 105, 30, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`AWB Number: ${invoiceData.awbNumber || 'AWB_BD_002'}`, 20, 45);
        doc.text(`Date: ${invoiceData.date || '18-Dec-2025'}`, 150, 45);

        // Shipper Details
        doc.setFont('helvetica', 'bold');
        doc.text('Shipper:', 20, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Acme Pharmaceuticals Pvt Ltd', 20, 67);
        doc.text('Mumbai Warehouse, Andheri East', 20, 74);
        doc.text('Mumbai - 400099', 20, 81);
        doc.text('Contact: +91 98765 43210', 20, 88);

        // Consignee Details
        doc.setFont('helvetica', 'bold');
        doc.text('Consignee:', 120, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Acme Pharmaceuticals Pvt Ltd', 120, 67);
        doc.text('Electronics City, Hosur Road', 120, 74);
        doc.text('Bangalore - 560100', 120, 81);
        doc.text('Contact: +91 98765 43211', 120, 88);

        // Flight Details
        doc.setFont('helvetica', 'bold');
        doc.text('Flight Details:', 20, 105);
        doc.setFont('helvetica', 'normal');
        doc.text('Flight No: BD-4521', 20, 112);
        doc.text('Departure: 19-Dec-2025 06:30 AM', 20, 119);
        doc.text('Arrival: 19-Dec-2025 08:15 AM', 20, 126);

        // Package Details
        doc.setFont('helvetica', 'bold');
        doc.text('Package Details:', 20, 145);
        doc.setFont('helvetica', 'normal');
        doc.text('Number of Packages: 1', 20, 152);
        doc.text('Weight: 250 kg', 20, 159);
        doc.text('Dimensions: 120 x 80 x 60 cm', 20, 166);
        doc.text('Service Type: Air Express', 20, 173);

        // Handling Instructions
        doc.setFont('helvetica', 'bold');
        doc.text('Handling Instructions:', 20, 190);
        doc.setFont('helvetica', 'normal');
        doc.text('• Handle with care - Fragile items', 20, 197);
        doc.text('• Temperature controlled - Keep between 15-25°C', 20, 204);
        doc.text('• No stacking - This side up', 20, 211);

        // Signatures
        doc.setFont('helvetica', 'bold');
        doc.text('Shipper Signature:', 20, 240);
        doc.text('Carrier Signature:', 120, 240);

        doc.setFont('helvetica', 'normal');
        doc.text('_____________________', 20, 255);
        doc.text('_____________________', 120, 255);

        doc.setFontSize(8);
        doc.text('Subject to Blue Dart Express Limited Standard Terms and Conditions', 105, 280, { align: 'center' });

        return doc.output('blob');
    }

    // Generate GST Invoice PDF
    generateGSTInvoice(invoiceData: any): Blob {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('TAX INVOICE', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text('BLUE DART EXPRESS LIMITED', 105, 30, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Blue Dart Centre, Sahar Airport Road, Andheri East, Mumbai - 400099', 105, 37, { align: 'center' });
        doc.text('GSTIN: 27AABCB5678R1Z9 | PAN: AABCB5678R | CIN: U63090MH1983PLC031000', 105, 43, { align: 'center' });

        // Invoice Details
        doc.setFontSize(10);
        doc.text(`Invoice No: GST_BD_002`, 20, 55);
        doc.text(`Date: 18-Dec-2025`, 150, 55);
        doc.text(`Place of Supply: Karnataka (29)`, 20, 62);
        doc.text(`Reverse Charge: No`, 150, 62);

        // Billing Details
        doc.setFont('helvetica', 'bold');
        doc.text('Billing Details:', 20, 75);
        doc.setFont('helvetica', 'normal');
        doc.text('Acme Pharmaceuticals Pvt Ltd', 20, 82);
        doc.text('GSTIN: 29AABCA1234R1Z5', 20, 89);
        doc.text('Bangalore - 560100, Karnataka', 20, 96);

        // Tax Invoice Table
        doc.setFont('helvetica', 'bold');
        doc.text('Description', 20, 115);
        doc.text('HSN/SAC', 80, 115);
        doc.text('Taxable', 110, 115);
        doc.text('IGST', 140, 115);
        doc.text('Total', 170, 115);
        doc.line(20, 117, 190, 117);

        doc.setFont('helvetica', 'normal');
        doc.text('Courier Services', 20, 125);
        doc.text('996791', 80, 125);
        doc.text('9,315.00', 110, 125);
        doc.text('1,676.70', 140, 125);
        doc.text('10,991.70', 170, 125);

        doc.line(20, 130, 190, 130);

        // Tax Summary
        doc.setFont('helvetica', 'bold');
        doc.text('Tax Summary:', 20, 145);
        doc.setFont('helvetica', 'normal');
        doc.text('Taxable Amount:', 20, 152);
        doc.text('₹9,315.00', 170, 152);
        doc.text('IGST @ 18%:', 20, 159);
        doc.text('₹1,676.70', 170, 159);

        doc.setFont('helvetica', 'bold');
        doc.text('Total Amount:', 20, 170);
        doc.text('₹10,991.70', 170, 170);

        // Amount in Words
        doc.setFont('helvetica', 'normal');
        doc.text('Amount in Words: Rupees Ten Thousand Nine Hundred Ninety One and Seventy Paise Only', 20, 185);

        // Declaration
        doc.setFontSize(8);
        doc.text('Declaration:', 20, 200);
        doc.text('We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', 20, 206);
        doc.text('This is a computer generated invoice and does not require physical signature.', 20, 212);

        // Authorized Signatory
        doc.setFontSize(10);
        doc.text('For Blue Dart Express Limited', 140, 250);
        doc.text('Authorized Signatory', 140, 265);

        return doc.output('blob');
    }

    // Generate Proof of Delivery PDF
    generateProofOfDelivery(invoiceData: any): Blob {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('PROOF OF DELIVERY', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text('BLUE DART EXPRESS LIMITED', 105, 30, { align: 'center' });

        // POD Details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`AWB Number: ${invoiceData.awbNumber || 'AWB_BD_002'}`, 20, 50);
        doc.text(`Delivery Date: 19-Dec-2025`, 150, 50);
        doc.text(`Delivery Time: 11:30 AM`, 150, 57);

        // Shipment Details
        doc.setFont('helvetica', 'bold');
        doc.text('Shipment Details:', 20, 75);
        doc.setFont('helvetica', 'normal');
        doc.text('Origin: Mumbai', 20, 82);
        doc.text('Destination: Bangalore', 20, 89);
        doc.text('Number of Packages: 1', 20, 96);
        doc.text('Weight: 250 kg', 20, 103);

        // Delivery Details
        doc.setFont('helvetica', 'bold');
        doc.text('Delivered To:', 20, 120);
        doc.setFont('helvetica', 'normal');
        doc.text('Acme Pharmaceuticals Pvt Ltd', 20, 127);
        doc.text('Electronics City, Hosur Road', 20, 134);
        doc.text('Bangalore - 560100, Karnataka', 20, 141);

        // Receiver Details
        doc.setFont('helvetica', 'bold');
        doc.text('Received By:', 20, 160);
        doc.setFont('helvetica', 'normal');
        doc.text('Name: Rajesh Kumar', 20, 167);
        doc.text('Designation: Warehouse Manager', 20, 174);
        doc.text('Contact: +91 98765 43211', 20, 181);
        doc.text('ID Proof: Aadhaar - XXXX XXXX 5678', 20, 188);

        // Condition on Delivery
        doc.setFont('helvetica', 'bold');
        doc.text('Condition on Delivery:', 20, 205);
        doc.setFont('helvetica', 'normal');
        doc.text('☑ Package intact', 20, 212);
        doc.text('☑ No visible damage', 20, 219);
        doc.text('☑ All items accounted for', 20, 226);
        doc.text('☐ Damaged (specify): _________________', 20, 233);

        // Signature Box
        doc.rect(20, 245, 80, 30);
        doc.setFont('helvetica', 'bold');
        doc.text('Receiver Signature:', 25, 252);
        doc.setFont('helvetica', 'normal');
        doc.text('Rajesh Kumar', 25, 268);
        doc.text('19-Dec-2025 11:30 AM', 25, 273);

        // Delivery Agent
        doc.rect(110, 245, 80, 30);
        doc.setFont('helvetica', 'bold');
        doc.text('Delivery Agent:', 115, 252);
        doc.setFont('helvetica', 'normal');
        doc.text('Amit Sharma', 115, 268);
        doc.text('Agent ID: BD-MUM-4521', 115, 273);

        doc.setFontSize(8);
        doc.text('This is a system generated Proof of Delivery document.', 105, 285, { align: 'center' });

        return doc.output('blob');
    }

    // Generate E-Way Bill PDF
    generateEWayBill(invoiceData: any): Blob {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('e-WAY BILL', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('[Please carry this invoice along with Eway Bill for movement of Goods]', 105, 28, { align: 'center' });

        // E-Way Bill Number
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('E-Way Bill No: 351234567890', 105, 40, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated Date: 18-Dec-2025 14:30', 20, 50);
        doc.text('Valid Until: 19-Dec-2025 23:59', 150, 50);

        // Part A - Details
        doc.setFont('helvetica', 'bold');
        doc.text('PART A', 20, 65);

        // Supplier Details
        doc.text('1. Supplier Details:', 20, 75);
        doc.setFont('helvetica', 'normal');
        doc.text('GSTIN: 27AABCB5678R1Z9', 30, 82);
        doc.text('Trade Name: Blue Dart Express Limited', 30, 89);
        doc.text('Address: Mumbai - 400099, Maharashtra (27)', 30, 96);

        // Recipient Details
        doc.setFont('helvetica', 'bold');
        doc.text('2. Recipient Details:', 20, 110);
        doc.setFont('helvetica', 'normal');
        doc.text('GSTIN: 29AABCA1234R1Z5', 30, 117);
        doc.text('Trade Name: Acme Pharmaceuticals Pvt Ltd', 30, 124);
        doc.text('Address: Bangalore - 560100, Karnataka (29)', 30, 131);

        // Document Details
        doc.setFont('helvetica', 'bold');
        doc.text('3. Document Details:', 20, 145);
        doc.setFont('helvetica', 'normal');
        doc.text('Document Type: Tax Invoice', 30, 152);
        doc.text('Document No: BD/2024/002', 30, 159);
        doc.text('Document Date: 18-Dec-2025', 30, 166);
        doc.text('Value of Goods: ₹10,991.70', 30, 173);
        doc.text('HSN Code: 996791', 30, 180);

        // Part B - Transport Details
        doc.setFont('helvetica', 'bold');
        doc.text('PART B', 20, 195);

        doc.text('4. Transport Details:', 20, 205);
        doc.setFont('helvetica', 'normal');
        doc.text('Transporter Name: Blue Dart Express Limited', 30, 212);
        doc.text('Transporter ID: 27AABCB5678R1Z9', 30, 219);
        doc.text('Approx Distance: 850 KM', 30, 226);
        doc.text('Mode: Air', 30, 233);
        doc.text('Vehicle Type: Air Cargo', 30, 240);
        doc.text('Vehicle No: BD-4521', 30, 247);

        // QR Code Placeholder
        doc.rect(150, 200, 40, 40);
        doc.setFontSize(8);
        doc.text('QR Code', 170, 222, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.text('This is a system generated e-Way Bill. No signature required.', 105, 270, { align: 'center' });
        doc.text('For any queries, visit: https://ewaybillgst.gov.in', 105, 275, { align: 'center' });

        return doc.output('blob');
    }
}

export default new DocumentGeneratorService();
