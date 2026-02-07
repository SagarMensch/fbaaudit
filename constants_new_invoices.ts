// 8 INVOICES - 4 SUPPLIERS × 2 INVOICES EACH
// Covers all workflow scenarios

export const NEW_MOCK_INVOICES = [
    // ==================== SUPPLIER 1: TCI EXPRESS LIMITED ====================

    // TCI Invoice 1: PENDING ZEYA KAPOOR (Step-2) - Missing E-Way Bill
    {
        id: 'TCI-001',
        invoiceNumber: 'TCI/2024/002',
        carrier: 'TCI Express Limited',
        origin: 'Delhi',
        destination: 'Bangalore',
        amount: 16284.00,
        currency: 'INR',
        date: '2025-12-15',
        dueDate: '2026-01-15',
        status: 'PENDING',
        variance: 0.00,
        reason: 'Awaiting E-Way Bill',
        extractionConfidence: 98,
        assignedTo: 'Zeya Kapoor',
        workflowHistory: [
            { stepId: 'step-1', status: 'APPROVED', approverName: 'Kaai Bansal', timestamp: '2025-12-16 10:30 AM' },
            { stepId: 'step-2', status: 'PENDING' },
            { stepId: 'step-3', status: 'PENDING' }
        ],
        source: 'PORTAL',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-TCI-001',
        lineItems: [
            { description: 'Express Freight - 500 kg', amount: 13800.00, expectedAmount: 13800.00 },
            { description: 'GST (18%)', amount: 2484.00, expectedAmount: 2484.00 }
        ],
        matchResults: { rate: 'MATCH', delivery: 'MATCH', unit: 'MATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'PORTAL', confidence: 100, fileName: 'TCI_Invoice_002.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'MANUAL', confidence: 100, fileName: 'LR_TCI_002.pdf', mandatory: true },
            proofOfDelivery: { status: 'ATTACHED', source: 'AI_EXTRACTED', confidence: 95, fileName: 'POD_Bangalore.pdf', mandatory: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_TCI_001.pdf', mandatory: true },
            gstInvoice: { status: 'ATTACHED', source: 'PORTAL', confidence: 100, fileName: 'GST_TCI_002.pdf', mandatory: true },
            ewayBill: { status: 'MISSING', mandatory: true, blocker: true },
            rateConfirmation: { status: 'ATTACHED', source: 'EMAIL', confidence: 100, fileName: 'Rate_TCI_2025.pdf', mandatory: true }
        },

        documentCompliance: {
            totalRequired: 7,
            totalAttached: 6,
            totalMissing: 1,
            mandatoryMissing: 1,
            canApprove: false,
            aiAssisted: true,
            aiPredictions: [
                {
                    field: 'deliveryDate',
                    predictedValue: '2025-12-18',
                    confidence: 92,
                    method: 'Transit time analysis',
                    basedOn: ['DEL-BLR lane: avg 3 days', 'TCI Express performance'],
                    accuracy: '±1 day'
                }
            ]
        }
    },

    // TCI Invoice 2: APPROVED - All docs complete
    {
        id: 'TCI-002',
        invoiceNumber: 'TCI/2024/003',
        carrier: 'TCI Express Limited',
        origin: 'Mumbai',
        destination: 'Chennai',
        amount: 12450.00,
        currency: 'INR',
        date: '2025-12-10',
        dueDate: '2026-01-10',
        status: 'APPROVED',
        variance: 0.00,
        reason: 'Auto-Approved - All validations passed',
        extractionConfidence: 99,
        workflowHistory: [
            { stepId: 'step-1', status: 'APPROVED', approverName: 'Kaai Bansal', timestamp: '2025-12-11 09:15 AM' },
            { stepId: 'step-2', status: 'APPROVED', approverName: 'Zeya Kapoor', timestamp: '2025-12-11 02:30 PM' },
            { stepId: 'step-3', status: 'APPROVED', approverName: 'System', timestamp: '2025-12-11 02:31 PM' }
        ],
        source: 'EDI',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-TCI-002',
        lineItems: [
            { description: 'Express Freight - 400 kg', amount: 10550.00, expectedAmount: 10550.00 },
            { description: 'GST (18%)', amount: 1900.00, expectedAmount: 1900.00 }
        ],
        matchResults: { rate: 'MATCH', delivery: 'MATCH', unit: 'MATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'TCI_Invoice_003.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'LR_TCI_003.pdf', mandatory: true },
            proofOfDelivery: { status: 'ATTACHED', source: 'MANUAL', confidence: 100, fileName: 'POD_Chennai.pdf', mandatory: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_TCI_002.pdf', mandatory: true },
            gstInvoice: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'GST_TCI_003.pdf', mandatory: true },
            ewayBill: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'EWB_TCI_003.pdf', mandatory: true },
            rateConfirmation: { status: 'ATTACHED', source: 'EMAIL', confidence: 100, fileName: 'Rate_TCI_2025.pdf', mandatory: true }
        },

        documentCompliance: {
            totalRequired: 7,
            totalAttached: 7,
            totalMissing: 0,
            mandatoryMissing: 0,
            canApprove: true,
            aiAssisted: false,
            aiPredictions: []
        }
    },

    // ==================== SUPPLIER 2: BLUE DART EXPRESS LIMITED ====================

    // Blue Dart Invoice 1: PENDING KAAI BANSAL (Step-1) - POD Pending Upload
    {
        id: 'BD-001',
        invoiceNumber: 'BD/2024/002',
        carrier: 'Blue Dart Express Limited',
        origin: 'Mumbai',
        destination: 'Bangalore',
        amount: 10991.70,
        currency: 'INR',
        date: '2025-12-18',
        dueDate: '2026-01-18',
        status: 'PENDING',
        variance: 0.00,
        reason: 'POD Pending Upload',
        extractionConfidence: 97,
        assignedTo: 'Kaai Bansal',
        workflowHistory: [
            { stepId: 'step-1', status: 'ACTIVE' },
            { stepId: 'step-2', status: 'PENDING' },
            { stepId: 'step-3', status: 'PENDING' }
        ],
        source: 'API',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-BD-001',
        lineItems: [
            { description: 'Air Express - 250 kg', amount: 9314.00, expectedAmount: 9314.00 },
            { description: 'GST (18%)', amount: 1677.70, expectedAmount: 1677.70 }
        ],
        matchResults: { rate: 'MATCH', delivery: 'MATCH', unit: 'MATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'API', confidence: 100, fileName: 'BD_Invoice_002.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'API', confidence: 100, fileName: 'AWB_BD_002.pdf', mandatory: true },
            proofOfDelivery: { status: 'PENDING_UPLOAD', mandatory: true, blocker: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_BD_001.pdf', mandatory: true },
            gstInvoice: { status: 'ATTACHED', source: 'API', confidence: 100, fileName: 'GST_BD_002.pdf', mandatory: true },
            rateConfirmation: { status: 'ATTACHED', source: 'EMAIL', confidence: 100, fileName: 'Rate_BD_2025.pdf', mandatory: true }
        },

        documentCompliance: {
            totalRequired: 6,
            totalAttached: 5,
            totalMissing: 1,
            mandatoryMissing: 1,
            canApprove: false,
            aiAssisted: true,
            aiPredictions: [
                {
                    field: 'deliveryDate',
                    predictedValue: '2025-12-19',
                    confidence: 88,
                    method: 'AI prediction based on tracking',
                    basedOn: ['AWB tracking shows in-transit', 'MUM-BLR: 1-day delivery'],
                    accuracy: '±4 hours'
                }
            ]
        }
    },

    // Blue Dart Invoice 2: REJECTED - Missing Multiple Mandatory Docs
    {
        id: 'BD-002',
        invoiceNumber: 'BD/2024/003',
        carrier: 'Blue Dart Express Limited',
        origin: 'Hyderabad',
        destination: 'Pune',
        amount: 8850.00,
        currency: 'INR',
        date: '2025-12-12',
        dueDate: '2026-01-12',
        status: 'REJECTED',
        variance: 0.00,
        reason: 'Rejected - Insufficient Documentation',
        extractionConfidence: 85,
        workflowHistory: [
            { stepId: 'step-1', status: 'REJECTED', approverName: 'Kaai Bansal', timestamp: '2025-12-13 11:00 AM', comment: 'Missing POD and Rate Confirmation' },
            { stepId: 'step-2', status: 'PENDING' },
            { stepId: 'step-3', status: 'PENDING' }
        ],
        source: 'EMAIL',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-BD-002',
        lineItems: [
            { description: 'Surface Express - 180 kg', amount: 7500.00, expectedAmount: 7500.00 },
            { description: 'GST (18%)', amount: 1350.00, expectedAmount: 1350.00 }
        ],
        matchResults: { rate: 'MATCH', delivery: 'MISSING', unit: 'MATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'EMAIL', confidence: 85, fileName: 'BD_Invoice_003.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'EMAIL', confidence: 90, fileName: 'AWB_BD_003.pdf', mandatory: true },
            proofOfDelivery: { status: 'MISSING', mandatory: true, blocker: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_BD_002.pdf', mandatory: true },
            gstInvoice: { status: 'MISSING', mandatory: true, blocker: true },
            rateConfirmation: { status: 'MISSING', mandatory: true, blocker: true }
        },

        documentCompliance: {
            totalRequired: 6,
            totalAttached: 3,
            totalMissing: 3,
            mandatoryMissing: 3,
            canApprove: false,
            aiAssisted: false,
            aiPredictions: []
        }
    },

    // ==================== SUPPLIER 3: DELHIVERY LIMITED ====================

    // Delhivery Invoice 1: PENDING ZEYA KAPOOR (Step-2) - Detention Charge Dispute
    {
        id: 'DEL-001',
        invoiceNumber: 'DEL/2024/002',
        carrier: 'Delhivery Limited',
        origin: 'Bangalore',
        destination: 'Chennai',
        amount: 11398.80,
        currency: 'INR',
        date: '2025-12-14',
        dueDate: '2026-01-14',
        status: 'EXCEPTION',
        variance: 1500.00,
        reason: 'Detention Charge Dispute',
        extractionConfidence: 96,
        assignedTo: 'Zeya Kapoor',
        workflowHistory: [
            { stepId: 'step-1', status: 'APPROVED', approverName: 'Kaai Bansal', timestamp: '2025-12-15 03:45 PM', comment: 'Approved with note: Verify detention charges' },
            { stepId: 'step-2', status: 'ACTIVE' },
            { stepId: 'step-3', status: 'PENDING' }
        ],
        source: 'PORTAL',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-DEL-001',
        lineItems: [
            { description: 'FTL Freight - 32ft', amount: 8400.00, expectedAmount: 8400.00 },
            { description: 'Detention Charges (6 hrs)', amount: 1500.00, expectedAmount: 0.00 },
            { description: 'GST (18%)', amount: 1498.80, expectedAmount: 1512.00 }
        ],
        matchResults: { rate: 'MATCH', delivery: 'MATCH', unit: 'MISMATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'PORTAL', confidence: 100, fileName: 'DEL_Invoice_002.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'MANUAL', confidence: 100, fileName: 'LR_DEL_002.pdf', mandatory: true },
            proofOfDelivery: { status: 'ATTACHED', source: 'MANUAL', confidence: 100, fileName: 'POD_Chennai.pdf', mandatory: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_DEL_001.pdf', mandatory: true },
            gstInvoice: { status: 'ATTACHED', source: 'PORTAL', confidence: 100, fileName: 'GST_DEL_002.pdf', mandatory: true },
            rateConfirmation: { status: 'ATTACHED', source: 'EMAIL', confidence: 100, fileName: 'Rate_DEL_2025.pdf', mandatory: true },
            detentionProof: { status: 'MISSING', mandatory: false, blocker: false }
        },

        documentCompliance: {
            totalRequired: 7,
            totalAttached: 6,
            totalMissing: 1,
            mandatoryMissing: 0,
            canApprove: true,
            aiAssisted: true,
            aiPredictions: [
                {
                    field: 'detentionCharges',
                    predictedValue: '₹0.00',
                    confidence: 82,
                    method: 'Contract validation',
                    basedOn: ['Contract allows 8 hrs free time', 'No detention clause in PO'],
                    accuracy: 'Exact'
                }
            ]
        }
    },

    // Delhivery Invoice 2: APPROVED - AI-Assisted Weight Prediction
    {
        id: 'DEL-002',
        invoiceNumber: 'DEL/2024/003',
        carrier: 'Delhivery Limited',
        origin: 'Pune',
        destination: 'Ahmedabad',
        amount: 9558.00,
        currency: 'INR',
        date: '2025-12-08',
        dueDate: '2026-01-08',
        status: 'APPROVED',
        variance: 0.00,
        reason: 'AI-Assisted Approval',
        extractionConfidence: 94,
        workflowHistory: [
            { stepId: 'step-1', status: 'APPROVED', approverName: 'Kaai Bansal', timestamp: '2025-12-09 10:20 AM' },
            { stepId: 'step-2', status: 'APPROVED', approverName: 'Zeya Kapoor', timestamp: '2025-12-09 04:15 PM' },
            { stepId: 'step-3', status: 'APPROVED', approverName: 'System', timestamp: '2025-12-09 04:16 PM' }
        ],
        source: 'API',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-DEL-002',
        lineItems: [
            { description: 'LTL Freight - 320 kg', amount: 8100.00, expectedAmount: 8100.00 },
            { description: 'GST (18%)', amount: 1458.00, expectedAmount: 1458.00 }
        ],
        matchResults: { rate: 'MATCH', delivery: 'MATCH', unit: 'MATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'API', confidence: 100, fileName: 'DEL_Invoice_003.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'API', confidence: 100, fileName: 'LR_DEL_003.pdf', mandatory: true },
            proofOfDelivery: { status: 'ATTACHED', source: 'AI_EXTRACTED', confidence: 93, fileName: 'POD_Ahmedabad.pdf', mandatory: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_DEL_002.pdf', mandatory: true },
            gstInvoice: { status: 'ATTACHED', source: 'API', confidence: 100, fileName: 'GST_DEL_003.pdf', mandatory: true },
            weightCertificate: {
                status: 'MISSING',
                aiPredicted: true,
                predictedValue: '320 kg',
                predictionMethod: 'Historical lane analysis',
                predictionConfidence: 91,
                mandatory: false
            },
            rateConfirmation: { status: 'ATTACHED', source: 'EMAIL', confidence: 100, fileName: 'Rate_DEL_2025.pdf', mandatory: true }
        },

        documentCompliance: {
            totalRequired: 7,
            totalAttached: 6,
            totalMissing: 1,
            mandatoryMissing: 0,
            canApprove: true,
            aiAssisted: true,
            aiPredictions: [
                {
                    field: 'weight',
                    predictedValue: '320 kg',
                    confidence: 91,
                    method: 'Historical lane analysis',
                    basedOn: ['Last 20 shipments PUN-AMD', 'Similar cargo type'],
                    accuracy: '±15 kg'
                }
            ]
        }
    },

    // ==================== SUPPLIER 4: GATI LIMITED ====================

    // Gati Invoice 1: PENDING KAAI BANSAL (Step-1) - Rate Mismatch
    {
        id: 'GATI-001',
        invoiceNumber: 'GATI/2024/001',
        carrier: 'Gati Limited',
        origin: 'Hyderabad',
        destination: 'Mumbai',
        amount: 8549.10,
        currency: 'INR',
        date: '2025-12-16',
        dueDate: '2026-01-16',
        status: 'EXCEPTION',
        variance: 450.00,
        reason: 'Rate Mismatch - Fuel Surcharge',
        extractionConfidence: 98,
        assignedTo: 'Kaai Bansal',
        workflowHistory: [
            { stepId: 'step-1', status: 'ACTIVE' },
            { stepId: 'step-2', status: 'PENDING' },
            { stepId: 'step-3', status: 'PENDING' }
        ],
        source: 'EDI',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-GATI-001',
        lineItems: [
            { description: 'Surface Freight - 280 kg', amount: 6850.00, expectedAmount: 6850.00 },
            { description: 'Fuel Surcharge (20%)', amount: 1370.00, expectedAmount: 920.00 },
            { description: 'GST (4%)', amount: 329.10, expectedAmount: 311.10 }
        ],
        matchResults: { rate: 'MISMATCH', delivery: 'MATCH', unit: 'MATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'GATI_Invoice_001.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'LR_GATI_001.pdf', mandatory: true },
            proofOfDelivery: { status: 'ATTACHED', source: 'MANUAL', confidence: 100, fileName: 'POD_Mumbai.pdf', mandatory: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_GATI_001.pdf', mandatory: true },
            gstInvoice: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'GST_GATI_001.pdf', mandatory: true },
            rateConfirmation: { status: 'ATTACHED', source: 'EMAIL', confidence: 100, fileName: 'Rate_GATI_2025.pdf', mandatory: true }
        },

        documentCompliance: {
            totalRequired: 6,
            totalAttached: 6,
            totalMissing: 0,
            mandatoryMissing: 0,
            canApprove: true,
            aiAssisted: true,
            aiPredictions: [
                {
                    field: 'fuelSurcharge',
                    predictedValue: '15%',
                    confidence: 95,
                    method: 'Contract rate validation',
                    basedOn: ['Contract #GATI-2025-001 specifies 15% fuel surcharge', 'Historical invoices show 15%'],
                    accuracy: 'Exact'
                }
            ]
        }
    },

    // Gati Invoice 2: PAID - Complete Workflow
    {
        id: 'GATI-002',
        invoiceNumber: 'GATI/2024/002',
        carrier: 'Gati Limited',
        origin: 'Chennai',
        destination: 'Kolkata',
        amount: 14750.00,
        currency: 'INR',
        date: '2025-11-28',
        dueDate: '2025-12-28',
        status: 'PAID',
        variance: 0.00,
        reason: 'Paid via Batch #PY-2025-12-05',
        extractionConfidence: 99,
        workflowHistory: [
            { stepId: 'step-1', status: 'APPROVED', approverName: 'Kaai Bansal', timestamp: '2025-11-29 09:00 AM' },
            { stepId: 'step-2', status: 'APPROVED', approverName: 'Zeya Kapoor', timestamp: '2025-11-29 02:30 PM' },
            { stepId: 'step-3', status: 'APPROVED', approverName: 'System', timestamp: '2025-11-29 02:31 PM' }
        ],
        source: 'EDI',
        tmsMatchStatus: 'LINKED',
        sapShipmentRef: 'SHP-GATI-002',
        lineItems: [
            { description: 'Express Freight - 450 kg', amount: 12500.00, expectedAmount: 12500.00 },
            { description: 'GST (18%)', amount: 2250.00, expectedAmount: 2250.00 }
        ],
        matchResults: { rate: 'MATCH', delivery: 'MATCH', unit: 'MATCH' },

        documentBundle: {
            commercialInvoice: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'GATI_Invoice_002.pdf', mandatory: true },
            billOfLading: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'LR_GATI_002.pdf', mandatory: true },
            proofOfDelivery: { status: 'ATTACHED', source: 'MANUAL', confidence: 100, fileName: 'POD_Kolkata.pdf', mandatory: true },
            purchaseOrder: { status: 'ATTACHED', source: 'ERP', confidence: 100, fileName: 'PO_GATI_002.pdf', mandatory: true },
            gstInvoice: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'GST_GATI_002.pdf', mandatory: true },
            ewayBill: { status: 'ATTACHED', source: 'EDI', confidence: 100, fileName: 'EWB_GATI_002.pdf', mandatory: true },
            rateConfirmation: { status: 'ATTACHED', source: 'EMAIL', confidence: 100, fileName: 'Rate_GATI_2025.pdf', mandatory: true }
        },

        documentCompliance: {
            totalRequired: 7,
            totalAttached: 7,
            totalMissing: 0,
            mandatoryMissing: 0,
            canApprove: true,
            aiAssisted: false,
            aiPredictions: []
        }
    }
];
