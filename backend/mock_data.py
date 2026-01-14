
# MOCK DATA - INDIAN LOGISTICS CONTEXT (UPDATED)
# Replaces old US/Global data with 8 Indian Invoices (4 Suppliers x 2)

MOCK_INVOICES = [
    # TCI Express Limited - Invoice 1
    {
        "id": 'TCI-001',
        "invoiceNumber": 'TCI/2024/002',
        "carrier": 'TCI Express Limited',
        "origin": 'Delhi',
        "destination": 'Bangalore',
        "amount": 16284.00,
        "currency": 'INR',
        "date": '2025-12-15',
        "dueDate": '2026-01-15',
        "status": "PENDING",  # Maps to InvoiceStatus.PENDING
        "variance": 0.00,
        "reason": 'Awaiting E-Way Bill',
        "extractionConfidence": 0.98,
        "source": 'API',
        "lineItems": [
            { "description": 'Freight Charges (Delhi to Bangalore)', "amount": 12000.00, "expectedAmount": 12000.00 },
            { "description": 'Fuel Surcharge (15%)', "amount": 1800.00, "expectedAmount": 1800.00 },
            { "description": 'IGST (18%)', "amount": 2484.00, "expectedAmount": 2484.00 }
        ]
    },
    # TCI Express Limited - Invoice 2
    {
        "id": 'TCI-002',
        "invoiceNumber": 'TCI/2024/005',
        "carrier": 'TCI Express Limited',
        "origin": 'Mumbai',
        "destination": 'Chennai',
        "amount": 8500.00,
        "currency": 'INR',
        "date": '2025-12-18',
        "dueDate": '2026-01-18',
        "status": "APPROVED",
        "variance": 0.00,
        "reason": 'Auto-Matched',
        "extractionConfidence": 0.99,
        "source": 'API',
        "lineItems": [
            { "description": 'Express Cargo', "amount": 7200.00, "expectedAmount": 7200.00 },
            { "description": 'IGST (18%)', "amount": 1300.00, "expectedAmount": 1300.00 }
        ]
    },
    # Blue Dart Express Limited - Invoice 1
    {
        "id": 'BDT-001',
        "invoiceNumber": 'BD/2024/772',
        "carrier": 'Blue Dart Express Limited',
        "origin": 'Mumbai',
        "destination": 'Bangalore',
        "amount": 10991.70,
        "currency": 'INR',
        "date": '2025-12-16',
        "dueDate": '2026-01-16',
        "status": "PENDING",
        "variance": 0.00,
        "reason": 'Pending L1 Approval',
        "extractionConfidence": 0.96,
        "source": 'API',
        "assignedTo": 'Kaai Bansal',
        "lineItems": [
            { "description": 'Air Express Service', "amount": 8100.00, "expectedAmount": 8100.00 },
            { "description": 'Fuel Surcharge', "amount": 1215.00, "expectedAmount": 1215.00 },
            { "description": 'IGST (18%)', "amount": 1676.70, "expectedAmount": 1676.70 }
        ]
    },
    # Blue Dart Express Limited - Invoice 2 (Mismatch)
    {
        "id": 'BDT-002',
        "invoiceNumber": 'BD/2024/889',
        "carrier": 'Blue Dart Express Limited',
        "origin": 'Hyderabad',
        "destination": 'Pune',
        "amount": 5600.00,
        "currency": 'INR',
        "date": '2025-12-20',
        "dueDate": '2026-01-20',
        "status": "EXCEPTION",
        "variance": 450.00,
        "reason": 'Rate Mismatch',
        "extractionConfidence": 0.95,
        "source": 'API',
        "assignedTo": 'Zeya Kapoor',
        "lineItems": [
            { "description": 'Surface Linehaul', "amount": 4200.00, "expectedAmount": 3800.00 },
            { "description": 'Docket Fee', "amount": 150.00, "expectedAmount": 100.00 },
            { "description": 'Tax', "amount": 1250.00, "expectedAmount": 1250.00 }
        ]
    },
    # Delhivery Limited - Invoice 1
    {
        "id": 'DEL-001',
        "invoiceNumber": 'DLV/24/9901',
        "carrier": 'Delhivery Limited',
        "origin": 'Bangalore',
        "destination": 'Chennai',
        "amount": 11398.80,
        "currency": 'INR',
        "date": '2025-12-17',
        "dueDate": '2026-01-17',
        "status": "PENDING",
        "variance": 0.00,
        "reason": 'System Verification',
        "extractionConfidence": 0.97,
        "source": 'API',
        "lineItems": [
            { "description": 'FTL Service', "amount": 8400.00, "expectedAmount": 8400.00 },
            { "description": 'Green Tax', "amount": 1260.00, "expectedAmount": 1260.00 },
            { "description": 'IGST (18%)', "amount": 1738.80, "expectedAmount": 1738.80 }
        ]
    },
    # Delhivery Limited - Invoice 2
    {
        "id": 'DEL-002',
        "invoiceNumber": 'DLV/24/9955',
        "carrier": 'Delhivery Limited',
        "origin": 'Pune',
        "destination": 'Ahmedabad',
        "amount": 22500.00,
        "currency": 'INR',
        "date": '2025-12-19',
        "dueDate": '2026-01-19',
        "status": "APPROVED",
        "variance": 0.00,
        "reason": 'Contract Rates Applied',
        "extractionConfidence": 0.99,
        "source": 'API',
        "lineItems": [
            { "description": 'Partial Truck Load', "amount": 19000.00, "expectedAmount": 19000.00 },
            { "description": 'GST', "amount": 3500.00, "expectedAmount": 3500.00 }
        ]
    },
    # Gati Limited - Invoice 1
    {
        "id": 'GATI-001',
        "invoiceNumber": 'GATI/24/101',
        "carrier": 'Gati Limited',
        "origin": 'Hyderabad',
        "destination": 'Mumbai',
        "amount": 8549.10,
        "currency": 'INR',
        "date": '2025-12-15',
        "dueDate": '2026-01-15',
        "status": "PENDING",
        "variance": 0.00,
        "reason": 'Pending Finance Review',
        "extractionConfidence": 0.98,
        "source": 'API',
        "assignedTo": 'Kaai Bansal',
        "lineItems": [
            { "description": 'Express Distribution', "amount": 6300.00, "expectedAmount": 6300.00 },
            { "description": 'Fuel Surcharge', "amount": 945.00, "expectedAmount": 945.00 },
            { "description": 'IGST (18%)', "amount": 1304.10, "expectedAmount": 1304.10 }
        ]
    },
    # Gati Limited - Invoice 2
    {
        "id": 'GATI-002',
        "invoiceNumber": 'GATI/24/155',
        "carrier": 'Gati Limited',
        "origin": 'Chennai',
        "destination": 'Kolkata',
        "amount": 14200.00,
        "currency": 'INR',
        "date": '2025-12-21',
        "dueDate": '2026-01-21',
        "status": "APPROVED",
        "variance": 0.00,
        "reason": 'Pre-Approved Lane',
        "extractionConfidence": 0.99,
        "source": 'API',
        "lineItems": [
            { "description": 'Standard Surface', "amount": 12000.00, "expectedAmount": 12000.00 },
            { "description": 'GST', "amount": 2200.00, "expectedAmount": 2200.00 }
        ]
    }
]

MOCK_RATES = [
  {
    "id": 'CON-2025-001',
    "carrier": 'SafeExpress Logistics',
    "contractRef": 'IOCL Mumbai Rate',
    "origin": 'Mumbai, MH',
    "destination": 'Pan-India (Zone 1)',
    "containerType": "FTL (32ft MXL)",
    "rate": 90.00,
    "currency": 'INR',
    "status": 'ACTIVE',
    "validFrom": '2025-01-01',
    "validTo": '2025-12-31'
  },
  {
    "id": 'CON-2025-002',
    "carrier": 'VRL Logistics',
    "contractRef": 'DEL-Retail-25',
    "origin": 'Delhi, DL',
    "destination": 'Bangalore, KA',
    "containerType": "LTL (Per Kg)",
    "rate": 92.00,
    "currency": 'INR',
    "status": 'ACTIVE',
    "validFrom": '2025-02-01',
    "validTo": '2026-01-31'
  },
  {
    "id": 'CON-2025-003',
    "carrier": 'TCI Freight',
    "contractRef": 'CHE-Auto-25',
    "origin": 'Chennai, TN',
    "destination": 'Pune, MH',
    "containerType": "FTL (24ft SXL)",
    "rate": 89.50,
    "currency": 'INR',
    "status": 'PENDING',
    "validFrom": '2025-03-01',
    "validTo": '2026-02-28'
  }
]

SPEND_DATA = [
  { "name": 'Ocean', "spend": 400000 },
  { "name": 'Road (LTL)', "spend": 300000 },
  { "name": 'Air', "spend": 200000 },
  { "name": 'Rail', "spend": 278000 },
]

KPIS = [
  {
    "label": 'TOTAL SPEND (YTD)',
    "value": '₹1,29,10,540',
    "subtext": 'vs Budget: -2.1%',
    "trend": 'down',
    "color": 'blue'
  },
  {
    "label": 'AUDIT SAVINGS',
    "value": '₹90,025',
    "subtext": 'From 15 Auto-Rejections',
    "trend": 'up',
    "color": 'teal'
  },
  {
    "label": 'TOUCHLESS RATE',
    "value": '57.0%',
    "subtext": 'Target: 85%',
    "trend": 'neutral',
    "color": 'orange'
  },
  {
    "label": 'OPEN EXCEPTIONS',
    "value": '2',
    "subtext": 'Avg Resolution: 1.5 Days',
    "trend": 'down',
    "color": 'red'
  }
]
