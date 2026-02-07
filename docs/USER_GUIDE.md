# User Guide - Freight Audit & Settlement Platform

**Version 3.0** | Last Updated: December 2024

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Invoice Workbench](#invoice-workbench)
4. [Contract Manager](#contract-manager)
5. [Settlement & Finance](#settlement--finance)
6. [Intelligence Hub](#intelligence-hub)
7. [Vendor Portal](#vendor-portal)
8. [Aether AI Assistant](#aether-ai-assistant)
9. [Reports](#reports)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Navigate to the application URL
2. Select your persona from the dropdown:
   - **Operations Manager** (Sarah Chen) - Full audit access
   - **Finance Controller** (David Kumar) - Settlement and approval
   - **Vendor** (John - Oman Steel) - Supplier portal access
   - **Admin** - System administration

3. Click **Login** to access your dashboard

> **Note**: In demo mode, no password is required. Production deployments use SSO/LDAP authentication.

---

## Dashboard Overview

The **Command Center** provides a real-time snapshot of your freight operations.

### Key Performance Indicators (KPIs)

| Metric | Description |
|--------|-------------|
| **Total Spend (YTD)** | Year-to-date freight expenditure |
| **Invoices Processed** | Total invoices in the system |
| **Pending Approval** | Invoices awaiting review |
| **Exception Rate** | % of invoices flagged for review |

### Quick Actions

- **Upload Invoice**: Drag & drop PDF files or click to browse
- **View Workbench**: Access all pending invoices
- **Run Report**: Generate analytics
- **Search**: Find specific invoices by number, carrier, or amount

---

## Invoice Workbench

The **Invoice Workbench** is your central hub for processing freight invoices.

### Viewing Invoices

1. Navigate to **Workbench** from the sidebar
2. Use filters to narrow down invoices:
   - **Status**: Pending, Approved, Exception, Paid
   - **Carrier**: Filter by specific vendors
   - **Date Range**: Custom date selection
   - **Amount**: Min/max thresholds

### Invoice Details

Click any invoice to view:

#### Left Panel: Original Document
- PDF preview of the invoice
- Download and print options
- OCR confidence score

#### Right Panel: Digitized Data
- **AI Insights**: Automated analysis and recommendations
- **Smart Match**: Side-by-side comparison of billed vs. expected amounts
- **3-Way Match**: Invoice ↔ PO ↔ POD reconciliation
- **Tax Breakdown**: GST, TDS, and RCM calculations
- **GL Coding**: Automated account allocation
- **Approval Workflow**: Current status and pending actions

### Taking Action

#### Approving an Invoice
1. Review all audit checks
2. Add approval comment (optional)
3. Click **Approve Invoice**
4. Invoice moves to next workflow step

#### Rejecting an Invoice
1. Select rejection reason
2. Add detailed comment
3. Click **Reject**
4. Vendor is notified automatically

#### Requesting Information
1. Click **Request Info**
2. Specify what information is needed
3. System sends query to vendor
4. Invoice status changes to "Pending Info"

---

## Contract Manager

Manage rate cards and carrier agreements.

### Viewing Contracts

1. Navigate to **Contract Manager**
2. View all active contracts with:
   - Contract ID
   - Carrier name
   - Validity period
   - Rate structure

### Creating a New Contract

1. Click **+ New Contract**
2. Fill in contract details:
   - Carrier selection
   - Origin/Destination pairs
   - Base rates
   - Accessorial charges
   - Validity dates
3. Click **Save Contract**

### GRI Simulation

Test the impact of General Rate Increases:

1. Select a contract
2. Click **Simulate GRI**
3. Enter proposed rate increase (%)
4. View projected cost impact
5. Export analysis to CSV

---

## Settlement & Finance

Process approved invoices for payment.

### Creating Payment Batches

1. Navigate to **Settlement & Finance**
2. Click **Create Batch**
3. Select invoices for payment:
   - Filter by approval date
   - Select specific vendors
   - Set payment date
4. Review batch summary:
   - Total amount
   - Number of invoices
   - TDS deductions
5. Click **Generate Batch**

### GL Coding

The system automatically allocates costs to GL accounts:

- **Freight Charges**: 5100-FREIGHT
- **Fuel Surcharge**: 5110-FUEL
- **Accessorials**: 5120-ACCESS
- **Taxes**: 5200-TAX

You can override allocations manually if needed.

### Tax Calculations (India)

For each invoice, the system calculates:

1. **GST**: 
   - Forward Charge (FCM): Vendor charges GST
   - Reverse Charge (RCM): You pay GST directly to government
2. **TDS**: Tax Deducted at Source (typically 2% under Section 194C)
3. **Net Payable**: Amount to transfer to vendor

**Example**:
```
Base Freight:        ₹100,000
GST @ 18% (RCM):     ₹18,000 (pay to govt)
TDS @ 2%:            -₹2,000 (deduct)
─────────────────────────────
Net to Vendor:       ₹98,000
```

---

## Intelligence Hub

Access advanced analytics and insights.

### Available Reports

#### 1. Vendor Freight Cost
- Total spend by carrier
- Breakdown: Approved, Pending, Rejected
- Export to CSV

#### 2. Contract Utilization
- % of spend on contract vs. spot rates
- Utilization by carrier
- Validity tracking

#### 3. Exception Frequency
- Exception count by vendor
- Exception rate (%)
- Root cause analysis

#### 4. Duplicate Attempts
- Fraud detection metrics
- Duplicate invoice attempts
- Last 30-day summary

#### 5. Approval TAT (Turnaround Time)
- Average approval time
- SLA breach rate
- Bottleneck identification

### Exporting Data

1. Select desired report
2. Apply date filters
3. Click **Export CSV**
4. File downloads automatically

---

## Vendor Portal

**For Suppliers**: Self-service portal for invoice management.

### Uploading Invoices

1. Log in as vendor
2. Click **Upload Invoice**
3. Drag & drop PDF or select file
4. System automatically extracts data
5. Review extracted information
6. Click **Submit**

### Tracking Status

View all submitted invoices with:
- Current status (Pending, Approved, Paid)
- Audit comments
- Expected payment date

### Dispute Management

If an invoice is flagged:

1. Click on the invoice
2. View audit findings
3. Use **Dispute Chat** to communicate with auditor
4. Upload supporting documents
5. Submit clarification

---

## Aether AI Assistant

Your intelligent logistics assistant.

### How to Use

1. Click the **chat icon** in bottom-right corner
2. Type your question in natural language
3. Aether responds with insights and data

### Example Queries

- "Show me pending invoices"
- "What is my total spend?"
- "Generate carrier performance graph"
- "Find invoice #INV-2024-001"
- "Show me contract utilization"
- "What are the payment status?"

### Chart Generation

Aether can automatically create visualizations:
- **Spend Trends**: 6-month spend velocity
- **Carrier Distribution**: Volume by mode
- **Invoice Status**: Workflow breakdown
- **Payment Outflow**: Weekly payment batches

---

## Reports

### Comprehensive Reporting Dashboard

Access via **Intelligence Hub** → **Reports**

#### Key Metrics

- **Total Invoices**: Overall volume
- **Duplicate Rate**: Fraud detection %
- **Avg Approval Time**: Efficiency metric
- **SLA Breach Rate**: Performance indicator

#### Report Types

1. **Vendor Freight Cost**: Spend analysis
2. **Contract Utilization**: Rate card usage
3. **Exception Frequency**: Quality metrics
4. **Duplicate Attempts**: Security monitoring
5. **Approval TAT**: Process efficiency

#### Customization

- **Date Range**: Custom period selection
- **Filters**: Vendor, status, amount
- **Export**: CSV download for all reports

---

## Troubleshooting

### Common Issues

#### Invoice Not Uploading
- **Check file format**: Only PDF supported
- **File size**: Maximum 10MB
- **Network**: Ensure stable connection

#### OCR Extraction Errors
- **Low confidence**: Manual review required
- **Poor quality scan**: Request clearer document from vendor
- **Foreign language**: System supports English only

#### Workflow Stuck
- **Check permissions**: Ensure you have approval rights
- **Missing data**: Complete all required fields
- **System error**: Contact support

#### Tax Calculation Issues
- **Vendor type**: Verify if RCM applies
- **TDS rate**: Confirm correct section code
- **GST registration**: Check vendor GSTIN

### Getting Help

1. **In-App Help**: Click **?** icon in top-right
2. **Documentation**: Refer to this guide
3. **Support**: Email support@freightaudit.com
4. **Training**: Request demo session

---

## Best Practices

### For Operations Managers
- Review exceptions daily
- Maintain up-to-date rate cards
- Monitor SLA compliance
- Train vendors on portal usage

### For Finance Controllers
- Reconcile batches before release
- Verify GL coding accuracy
- Monitor TDS compliance
- Review exception approvals

### For Vendors
- Submit invoices promptly
- Ensure clear PDF scans
- Respond to queries quickly
- Maintain accurate master data

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open search |
| `Ctrl + U` | Upload invoice |
| `Ctrl + R` | Refresh data |
| `Esc` | Close modal |
| `Tab` | Navigate fields |

---

## Glossary

- **3-Way Match**: Reconciliation of Invoice, Purchase Order, and Proof of Delivery
- **BAF**: Bunker Adjustment Factor (fuel surcharge)
- **EDI**: Electronic Data Interchange
- **FCM**: Forward Charge Mechanism (GST)
- **GL**: General Ledger
- **GRI**: General Rate Increase
- **GSR**: Guaranteed Service Refund
- **OCR**: Optical Character Recognition
- **POD**: Proof of Delivery
- **RCM**: Reverse Charge Mechanism (GST)
- **TAT**: Turnaround Time
- **TDS**: Tax Deducted at Source

---

**Need More Help?**  
Contact: support@freightaudit.com  
Documentation: [docs/](../docs/)
