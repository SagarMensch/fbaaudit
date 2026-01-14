// Document Content Generator for Indian Logistics Documents
// Generates realistic document content for preview and download

import { LogisticsDocument, DocumentType } from './documentService';

export class DocumentContentGenerator {

    static generateDocumentContent(doc: LogisticsDocument): string {
        switch (doc.type) {
            case 'contract':
                return this.generateContract(doc);
            case 'rate_card':
                return this.generateRateCard(doc);
            case 'gst_cert':
                return this.generateGSTCertificate(doc);
            case 'insurance':
                return this.generateInsurance(doc);
            case 'pan_card':
                return this.generatePANCard(doc);
            case 'lr':
                return this.generateLR(doc);
            case 'pod':
                return this.generatePOD(doc);
            case 'eway_bill':
                return this.generateEwayBill(doc);
            case 'iso_cert':
                return this.generateISOCert(doc);
            case 'permit':
                return this.generatePermit(doc);
            default:
                return this.generateGenericDocument(doc);
        }
    }

    private static generateContract(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                    MASTER FREIGHT AGREEMENT                              ║
║                         ${doc.name}                                      ║
╚══════════════════════════════════════════════════════════════════════════╝

Contract Number: ${doc.documentNumber}
Date of Agreement: ${doc.uploadedDate}
Valid Until: ${doc.expiryDate || 'Perpetual'}

PARTIES TO THE AGREEMENT:

PARTY A (Service Provider):
    Name: ${doc.partnerName}
    GST Number: ${doc.metadata?.gstNumber || 'As per records'}
    Address: Registered Office, India
    
PARTY B (Client):
    Name: SequelString Logistics Pvt. Ltd.
    GST Number: 07AABCS1234F1Z5
    Address: Gurugram, Haryana, India

TERMS AND CONDITIONS:

1. SCOPE OF SERVICES
   ${doc.partnerName} agrees to provide freight transportation services across
   India including but not limited to surface transport, express delivery, and
   cargo handling services.

2. SERVICE LEVEL AGREEMENT
   - On-Time Delivery: Minimum 95% OTD required
   - POD Return: Within 7 working days
   - Damage Rate: Not to exceed 0.5%
   - Detention Charges: ₹500/hour after 2 hours free time

3. PRICING AND PAYMENT TERMS
   - Rates as per attached Rate Card (Annexure A)
   - Payment Terms: Net 30 days from invoice date
   - TDS: 2% as per Section 194C
   - GST: 18% on freight charges, 12% on loading/unloading

4. INSURANCE AND LIABILITY
   - Carrier to maintain cargo insurance of minimum ₹20 Crore
   - Liability limited to declared value of goods
   - Force majeure clause applicable

5. COMPLIANCE REQUIREMENTS
   - Valid GST registration in all operating states
   - E-way bill generation for interstate movement
   - Proper LR documentation for all shipments
   - Compliance with Motor Vehicles Act and transport regulations

6. TERMINATION
   - Either party may terminate with 90 days written notice
   - Immediate termination in case of material breach

This agreement is executed on ${doc.uploadedDate} and shall remain valid
until ${doc.expiryDate || 'terminated as per clause 6'}.

For ${doc.partnerName}                    For SequelString Logistics
_____________________                     _____________________
Authorized Signatory                      Authorized Signatory

Place: New Delhi                          Place: Gurugram
Date: ${doc.uploadedDate}                 Date: ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════
                        END OF AGREEMENT
═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generateRateCard(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                         FREIGHT RATE CARD                                ║
║                    ${doc.partnerName}                                    ║
║                    Financial Year 2024-25                                ║
╚══════════════════════════════════════════════════════════════════════════╝

Rate Card Number: ${doc.documentNumber}
Valid From: ${doc.uploadedDate}
Valid Until: 2025-03-31

═══════════════════════════════════════════════════════════════════════════

SURFACE TRANSPORT RATES (Per KG)

Route                          Weight Slab      Rate (₹/kg)    Transit Days
────────────────────────────────────────────────────────────────────────────
Delhi - Mumbai                 0-100 kg         ₹8.50          3-4 days
                               100-500 kg       ₹7.50          3-4 days
                               500+ kg          ₹6.50          3-4 days

Mumbai - Bangalore             0-100 kg         ₹9.00          4-5 days
                               100-500 kg       ₹8.00          4-5 days
                               500+ kg          ₹7.00          4-5 days

Bangalore - Chennai            0-100 kg         ₹6.50          2-3 days
                               100-500 kg       ₹5.50          2-3 days
                               500+ kg          ₹4.50          2-3 days

Delhi - Kolkata                0-100 kg         ₹10.00         4-5 days
                               100-500 kg       ₹9.00          4-5 days
                               500+ kg          ₹8.00          4-5 days

═══════════════════════════════════════════════════════════════════════════

FULL TRUCK LOAD (FTL) RATES

Vehicle Type          Capacity        Delhi-Mumbai    Mumbai-Bangalore
────────────────────────────────────────────────────────────────────────────
32 Ft MXL            15 Tons         ₹45,000         ₹52,000
20 Ft Container      10 Tons         ₹32,000         ₹38,000
14 Ft Truck          5 Tons          ₹22,000         ₹25,000

═══════════════════════════════════════════════════════════════════════════

ADDITIONAL CHARGES

Service                                              Charge
────────────────────────────────────────────────────────────────────────────
Loading/Unloading                                    ₹2/kg (Min ₹500)
Detention Charges (after 2 hrs free time)            ₹500/hour
POD Charges                                          ₹50 per shipment
Insurance (Optional)                                 0.5% of declared value
Fuel Surcharge                                       As per monthly index

═══════════════════════════════════════════════════════════════════════════

TAX STRUCTURE

GST on Freight Charges:                              18%
GST on Loading/Unloading:                            12%
TDS (Section 194C):                                  2%

═══════════════════════════════════════════════════════════════════════════

TERMS & CONDITIONS:

1. All rates are exclusive of GST
2. Rates subject to revision with 30 days notice
3. Fuel surcharge applicable as per monthly diesel price index
4. Minimum billing weight: 25 kg
5. Volumetric weight: Length x Width x Height (cm) / 5000
6. Detention free time: 2 hours for loading/unloading
7. Payment terms: Net 30 days

For queries, contact: rates@${doc.partnerName.toLowerCase().replace(/\s+/g, '')}.com

═══════════════════════════════════════════════════════════════════════════
                    ${doc.partnerName} - Rate Card FY 2024-25
═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generateGSTCertificate(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                  GOODS AND SERVICES TAX REGISTRATION                     ║
║                         CERTIFICATE                                      ║
║                     Government of India                                  ║
╚══════════════════════════════════════════════════════════════════════════╝

GSTIN: ${doc.documentNumber}

═══════════════════════════════════════════════════════════════════════════

TAXPAYER DETAILS:

Legal Name:                    ${doc.partnerName}
Trade Name:                    ${doc.partnerName}
Constitution:                  Private Limited Company

Principal Place of Business:
    ${doc.partnerName} Logistics Hub
    ${doc.metadata?.states?.[0] || 'Haryana'}, India
    PIN: 122001

═══════════════════════════════════════════════════════════════════════════

REGISTRATION DETAILS:

Date of Registration:          ${doc.uploadedDate}
Date of Validity:              ${doc.expiryDate || 'Valid until cancelled'}
Type of Registration:          Regular
Status:                        Active

═══════════════════════════════════════════════════════════════════════════

BUSINESS ACTIVITIES:

HSN Code        Description                              Tax Rate
────────────────────────────────────────────────────────────────────────────
996511          Goods Transport Services                 18%
996512          Loading and Unloading Services           12%
996513          Warehousing Services                     18%

═══════════════════════════════════════════════════════════════════════════

AUTHORIZED SIGNATORY:

This certificate is issued electronically and does not require physical
signature. The authenticity can be verified on the GST portal using GSTIN.

Issued by: GST Department, ${doc.metadata?.states?.[0] || 'Haryana'}
Issue Date: ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════

IMPORTANT NOTES:

1. This registration is valid for the state of ${doc.metadata?.states?.[0] || 'Haryana'}
2. Separate registration required for each state of operation
3. GST returns must be filed monthly (GSTR-1, GSTR-3B)
4. Annual return (GSTR-9) to be filed by December 31st
5. This certificate must be displayed at principal place of business

═══════════════════════════════════════════════════════════════════════════
          For verification, visit: www.gst.gov.in
═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generateLR(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                        LORRY RECEIPT (LR)                                ║
║                    ${doc.partnerName}                                    ║
╚══════════════════════════════════════════════════════════════════════════╝

LR Number: ${doc.documentNumber}
Date: ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════

CONSIGNOR DETAILS:
    Name: SequelString Logistics Pvt. Ltd.
    Address: Sector 44, Gurugram, Haryana - 122003
    GSTIN: 07AABCS1234F1Z5
    Contact: +91-124-4567890

CONSIGNEE DETAILS:
    Name: ABC Industries Ltd.
    Address: Andheri East, Mumbai, Maharashtra - 400069
    GSTIN: 27AABCA1234F1Z5
    Contact: +91-22-2345678

═══════════════════════════════════════════════════════════════════════════

SHIPMENT DETAILS:

From: ${doc.metadata?.route?.split('→')[0]?.trim() || 'Delhi'}
To: ${doc.metadata?.route?.split('→')[1]?.trim() || 'Mumbai'}

Vehicle Number: ${doc.metadata?.vehicleNumber || 'DL-1234'}
Driver Name: Rajesh Kumar
Driver License: DL1234567890
Driver Contact: +91-98765-43210

═══════════════════════════════════════════════════════════════════════════

CARGO DETAILS:

Description of Goods:        Electronic Components
Number of Packages:          25 Boxes
Weight:                      ${doc.metadata?.weight || '500 kg'}
Declared Value:              ₹5,00,000
Freight Charges:             ₹4,250
GST @ 18%:                   ₹765
Total Amount:                ₹5,015

═══════════════════════════════════════════════════════════════════════════

E-WAY BILL DETAILS:

E-way Bill Number:           ${doc.metadata?.ewayBill || '351234567890'}
Valid Until:                 ${doc.expiryDate || '2024-12-20'}

═══════════════════════════════════════════════════════════════════════════

TERMS & CONDITIONS:

1. Goods are transported at owner's risk
2. Claims must be filed within 7 days of delivery
3. Detention charges: ₹500/hour after 2 hours free time
4. Subject to ${doc.metadata?.route?.split('→')[0]?.trim() || 'Delhi'} jurisdiction

Consignor Signature              Carrier Signature              Driver Signature
________________                  ________________               ________________

═══════════════════════════════════════════════════════════════════════════
                    ${doc.partnerName} - LR Copy
═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generatePOD(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                    PROOF OF DELIVERY (POD)                               ║
║                    ${doc.partnerName}                                    ║
╚══════════════════════════════════════════════════════════════════════════╝

POD Number: ${doc.documentNumber}
LR Number: ${doc.relatedShipment || 'LR-TCI-241215-001'}
Delivery Date: ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════

SHIPMENT DETAILS:

From: Delhi
To: Mumbai
Vehicle Number: DL-1234
Number of Packages: 25 Boxes
Weight: 500 kg

═══════════════════════════════════════════════════════════════════════════

DELIVERY CONFIRMATION:

Delivered To:                ${doc.metadata?.deliveredTo || 'Warehouse Manager'}
Receiver Name:               ${doc.metadata?.signedBy || 'R. Patel'}
Designation:                 Warehouse Incharge
Contact Number:              +91-22-2345678

Delivery Address:
    ABC Industries Ltd.
    Andheri East, Mumbai
    Maharashtra - 400069

═══════════════════════════════════════════════════════════════════════════

PACKAGE CONDITION:

Total Packages Sent:         25
Packages Received:           25
Damaged Packages:            0
Missing Packages:            0

Condition of Goods:          ☑ Good  ☐ Damaged  ☐ Partial

═══════════════════════════════════════════════════════════════════════════

DELIVERY DETAILS:

Delivery Date:               ${doc.metadata?.deliveryDate || doc.uploadedDate}
Delivery Time:               14:30 hrs
Detention Time:              1 hour 15 minutes (No charges)

═══════════════════════════════════════════════════════════════════════════

RECEIVER'S ACKNOWLEDGEMENT:

I hereby acknowledge receipt of the above mentioned goods in good condition.

Receiver's Signature:        ${doc.metadata?.signedBy || 'R. Patel'}
Date:                        ${doc.uploadedDate}
Company Stamp:               [ABC Industries Ltd.]

═══════════════════════════════════════════════════════════════════════════

CARRIER CONFIRMATION:

Delivery Executive:          Suresh Sharma
Employee ID:                 TCI-DEL-1234
Contact:                     +91-98765-11111

═══════════════════════════════════════════════════════════════════════════
                    ${doc.partnerName} - POD Copy
                    This is a computer generated document
═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generateEwayBill(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                         E-WAY BILL                                       ║
║                    Government of India                                   ║
╚══════════════════════════════════════════════════════════════════════════╝

E-way Bill Number: ${doc.documentNumber}
Generated Date: ${doc.uploadedDate}
Valid Until: ${doc.expiryDate || '2024-12-20'}

═══════════════════════════════════════════════════════════════════════════

SUPPLIER DETAILS:

Name:                        SequelString Logistics Pvt. Ltd.
GSTIN:                       07AABCS1234F1Z5
Address:                     Sector 44, Gurugram, Haryana - 122003

RECIPIENT DETAILS:

Name:                        ABC Industries Ltd.
GSTIN:                       27AABCA1234F1Z5
Address:                     Andheri East, Mumbai, Maharashtra - 400069

═══════════════════════════════════════════════════════════════════════════

SHIPMENT DETAILS:

Document Type:               Tax Invoice
Document Number:             INV-2024-001234
Document Date:               ${doc.uploadedDate}

From:                        ${doc.metadata?.route?.split('→')[0]?.trim() || 'Bangalore'}
To:                          ${doc.metadata?.route?.split('→')[1]?.trim() || 'Chennai'}
Approximate Distance:        ${doc.metadata?.distance || '350 km'}

═══════════════════════════════════════════════════════════════════════════

GOODS DETAILS:

HSN Code:                    8471
Description:                 Electronic Components
Quantity:                    25 Boxes
Unit:                        BOX
Taxable Value:               ₹5,00,000
CGST @ 9%:                   ₹45,000
SGST @ 9%:                   ₹45,000
Total Invoice Value:         ₹5,90,000

═══════════════════════════════════════════════════════════════════════════

TRANSPORTER DETAILS:

Transporter Name:            ${doc.partnerName}
Transporter ID:              ${doc.partnerId.toUpperCase()}
Transport Document No:       ${doc.relatedShipment || 'LR-001'}
Transport Date:              ${doc.uploadedDate}

Vehicle Number:              KA-01-AB-1234
Vehicle Type:                Regular

═══════════════════════════════════════════════════════════════════════════

VALIDITY:

Generated:                   ${doc.uploadedDate} 10:30 AM
Valid For:                   ${doc.metadata?.validityHours || '24'} hours
Expires On:                  ${doc.expiryDate || '2024-12-20'} 10:30 AM

═══════════════════════════════════════════════════════════════════════════

QR CODE: [QR Code would appear here]

This is a system generated e-way bill. No signature required.
For verification, visit: https://ewaybillgst.gov.in

═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generateInsurance(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                   CARGO INSURANCE CERTIFICATE                            ║
║                    ${doc.metadata?.issuer || 'ICICI Lombard'}            ║
╚══════════════════════════════════════════════════════════════════════════╝

Certificate Number: ${doc.documentNumber}
Policy Number: POL-2024-567890
Issue Date: ${doc.uploadedDate}
Valid Until: ${doc.expiryDate || '2025-01-14'}

═══════════════════════════════════════════════════════════════════════════

INSURED PARTY:

Name:                        ${doc.partnerName}
Address:                     Registered Office, India
Type of Business:            Freight Transportation Services

═══════════════════════════════════════════════════════════════════════════

COVERAGE DETAILS:

Sum Insured:                 ${doc.metadata?.coverageAmount || '₹20 Crore'}
Type of Coverage:            Comprehensive Cargo Insurance
Geographic Scope:            All India

Covered Risks:
    ✓ Loss or damage during transit
    ✓ Fire, explosion, collision
    ✓ Theft, pilferage
    ✓ Natural calamities (flood, earthquake)
    ✓ Overturning of vehicle
    ✓ Loading/unloading risks

Exclusions:
    ✗ War and terrorism
    ✗ Nuclear risks
    ✗ Willful misconduct
    ✗ Inherent vice of goods
    ✗ Delay in transit

═══════════════════════════════════════════════════════════════════════════

PREMIUM DETAILS:

Annual Premium:              ₹2,50,000
GST @ 18%:                   ₹45,000
Total Premium:               ₹2,95,000

Payment Status:              PAID
Payment Date:                ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════

CLAIMS PROCEDURE:

1. Notify insurer within 24 hours of incident
2. File FIR with local police (for theft/accident)
3. Submit claim form with supporting documents
4. Survey will be conducted within 48 hours
5. Claim settlement within 30 days of approval

Claims Contact:
    Email: claims@icicilombard.com
    Phone: 1800-266-7766
    Available: 24x7

═══════════════════════════════════════════════════════════════════════════

TERMS & CONDITIONS:

This certificate is subject to the terms and conditions of the master policy.
The insured must maintain proper records of all shipments and report any
incidents immediately.

Authorized Signatory: ${doc.metadata?.issuer || 'ICICI Lombard General Insurance'}
Date: ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════
                    This is a computer generated certificate
═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generatePANCard(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║              PERMANENT ACCOUNT NUMBER (PAN) CARD                         ║
║                   Income Tax Department                                  ║
║                     Government of India                                  ║
╚══════════════════════════════════════════════════════════════════════════╝

PAN: ${doc.documentNumber}

═══════════════════════════════════════════════════════════════════════════

NAME:                        ${doc.partnerName.toUpperCase()}

FATHER'S NAME:               AS PER RECORDS

DATE OF BIRTH:               01/01/1990

═══════════════════════════════════════════════════════════════════════════

This is a copy of the original PAN card issued by the Income Tax Department.

PAN is a unique identification number issued to all taxpayers in India.
It is mandatory for financial transactions and tax filing.

═══════════════════════════════════════════════════════════════════════════
                    Income Tax Department, Government of India
═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generateISOCert(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                    ISO 9001:2015 CERTIFICATION                           ║
║                    ${doc.metadata?.issuer || 'Bureau Veritas'}           ║
╚══════════════════════════════════════════════════════════════════════════╝

Certificate Number: ${doc.documentNumber}
Issue Date: ${doc.uploadedDate}
Valid Until: ${doc.expiryDate || '2025-06-19'}

═══════════════════════════════════════════════════════════════════════════

This is to certify that:

    ${doc.partnerName}
    Registered Office, India

Has implemented and maintains a Quality Management System which fulfills
the requirements of ISO 9001:2015 for the following scope:

    ${doc.metadata?.scope || 'Freight Transportation Services'}

This certificate is valid for the above scope in respect of those products
and services detailed in the organization's quality manual.

═══════════════════════════════════════════════════════════════════════════

CERTIFICATION BODY:

Name:                        ${doc.metadata?.issuer || 'Bureau Veritas Certification'}
Accreditation:               NABCB (National Accreditation Board)
Auditor:                     Senior Lead Auditor
Next Surveillance:           ${doc.expiryDate || '2025-06-19'}

═══════════════════════════════════════════════════════════════════════════

Authorized Signatory
${doc.metadata?.issuer || 'Bureau Veritas Certification'}
Date: ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generatePermit(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                    ALL INDIA TOURIST PERMIT                              ║
║                    Transport Department                                  ║
╚══════════════════════════════════════════════════════════════════════════╝

Permit Number: ${doc.documentNumber}
Issue Date: ${doc.uploadedDate}
Valid Until: ${doc.expiryDate || '2024-12-31'}

═══════════════════════════════════════════════════════════════════════════

OPERATOR DETAILS:

Name:                        ${doc.partnerName}
Fleet Size:                  ${doc.metadata?.vehicleCount || '5000+'} vehicles
Coverage:                    ${doc.metadata?.states || 'All India'}

═══════════════════════════════════════════════════════════════════════════

PERMIT DETAILS:

Type:                        All India Permit
Category:                    Goods Carriage
Authorization:               Interstate transport of goods

Authorized Routes:           All National and State Highways
Restrictions:                Subject to state-specific regulations

═══════════════════════════════════════════════════════════════════════════

TERMS & CONDITIONS:

1. Valid for goods transport across all Indian states
2. Subject to payment of state taxes and tolls
3. Must comply with Motor Vehicles Act, 1988
4. Permit must be carried in vehicle at all times
5. Renewal required before expiry date

═══════════════════════════════════════════════════════════════════════════

Issued by: Regional Transport Authority
Date: ${doc.uploadedDate}

═══════════════════════════════════════════════════════════════════════════
`;
    }

    private static generateGenericDocument(doc: LogisticsDocument): string {
        return `
╔══════════════════════════════════════════════════════════════════════════╗
║                         ${doc.name.toUpperCase()}                        ║
║                    ${doc.partnerName}                                    ║
╚══════════════════════════════════════════════════════════════════════════╝

Document Number: ${doc.documentNumber || 'N/A'}
Date: ${doc.uploadedDate}
Category: ${doc.category.toUpperCase()}

═══════════════════════════════════════════════════════════════════════════

This document contains important information related to ${doc.category}
operations for ${doc.partnerName}.

File Name: ${doc.fileName}
File Size: ${doc.fileSize}
Status: ${doc.status.toUpperCase()}

${doc.expiryDate ? `Valid Until: ${doc.expiryDate}` : ''}

═══════════════════════════════════════════════════════════════════════════

For more information, please contact ${doc.partnerName}.

═══════════════════════════════════════════════════════════════════════════
`;
    }
}

export default DocumentContentGenerator;
