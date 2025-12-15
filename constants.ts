

import { Invoice, InvoiceStatus, MatchStatus, RateCard, KPI, PaymentBatch, RoleDefinition, WorkflowStepConfig } from './types';

// ... (Previous constants remain, appending new ones)

export const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'OPS_MANAGER',
    name: 'SCM Operations',
    description: 'Logistics leads responsible for operational verification.',
    users: 4,
    color: 'bg-teal-600',
    permissions: { canViewInvoices: true, canApproveL1: true, canApproveL2: false, canManageRates: true, canAdminSystem: false }
  },
  {
    id: 'FINANCE_MANAGER',
    name: 'Finance & Treasury',
    description: 'Controllers responsible for budget and payment release.',
    users: 2,
    color: 'bg-blue-600',
    permissions: { canViewInvoices: true, canApproveL1: false, canApproveL2: true, canManageRates: false, canAdminSystem: false }
  },
  {
    id: 'ENTERPRISE_ADMIN',
    name: 'System Admin',
    description: 'Super users with full system configuration access.',
    users: 1,
    color: 'bg-purple-600',
    permissions: { canViewInvoices: true, canApproveL1: true, canApproveL2: true, canManageRates: true, canAdminSystem: true }
  }
];

export const INITIAL_WORKFLOW: WorkflowStepConfig[] = [
  {
    id: 'step-1',
    stepName: 'Operational Review',
    roleId: 'OPS_MANAGER',
    conditionType: 'ALWAYS'
  },
  {
    id: 'step-2',
    stepName: 'High Value Approval',
    roleId: 'FINANCE_MANAGER',
    conditionType: 'AMOUNT_GT',
    conditionValue: 5000
  },
  {
    id: 'step-3',
    stepName: 'ERP Settlement',
    roleId: 'ENTERPRISE_ADMIN', // Changed from 'admin' to match persona
    conditionType: 'ALWAYS',
    isSystemStep: true
  }
];

export const KPIS: KPI[] = [
  {
    label: 'TOTAL SPEND (YTD)',
    value: '$12,910,540',
    subtext: 'vs Budget: -2.1%',
    trend: 'down',
    color: 'blue'
  },
  {
    label: 'AUDIT SAVINGS',
    value: '$90,025',
    subtext: 'From 15 Auto-Rejections',
    trend: 'up',
    color: 'teal'
  },
  {
    label: 'TOUCHLESS RATE',
    value: '57.0%',
    subtext: 'Target: 85%',
    trend: 'neutral',
    color: 'orange'
  },
  {
    label: 'OPEN EXCEPTIONS',
    value: '12',
    subtext: 'Avg Resolution: 1.5 Days',
    trend: 'down',
    color: 'red'
  }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: '5467',
    invoiceNumber: '5467',
    carrier: 'Maersk',
    origin: 'Bloomington, IL',
    destination: 'Brisbane, AU',
    amount: 2775.00,
    currency: 'USD',
    date: '2025-11-19',
    dueDate: '2025-12-19',
    status: InvoiceStatus.APPROVED,
    variance: 0.00,
    reason: '3-Way Match OK',
    extractionConfidence: 99,
    workflowHistory: [
      { stepId: 'step-1', status: 'APPROVED', approverName: 'System', approverRole: 'Auto-Matcher', timestamp: '2025-11-19 08:00 AM', comment: '3-way match successful.' },
      { stepId: 'step-2', status: 'SKIPPED', comment: 'Amount below threshold.' },
      { stepId: 'step-3', status: 'APPROVED', approverName: 'System', approverRole: 'Automation', timestamp: '2025-11-19 08:01 AM', comment: 'Posted to SAP.' }
    ],
    tmsEstimatedAmount: 2775.00,
    auditAmount: 2775.00,
    source: 'EDI',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-889210-01',
    lineItems: [
      { description: 'Ocean Freight - 20FT Standard', amount: 2775.00, expectedAmount: 2775.00 }
    ],
    matchResults: {
      rate: MatchStatus.MATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '101-20', segment: 'Power Grids', amount: 2775.00, percentage: 100, color: 'bg-blue-500' }
    ],
    logistics: {
      vesselName: 'MAERSK MC-KINNEY MOLLER',
      voyageNumber: '214E',
      billOfLading: 'MAEU91283741',
      containerNumber: 'MSKU9012834',
      containerType: '40HC',
      weight: 18500,
      volume: 68.5,
      portOfLoading: 'USCHI',
      portOfDischarge: 'AUBNE',
      etd: '2025-11-01',
      eta: '2025-12-15'
    }
  },
  {
    id: '709114',
    invoiceNumber: '709114',
    carrier: 'Chilean Line',
    origin: 'Baltimore, MD',
    destination: 'Santiago, CL',
    amount: 2678.00,
    currency: 'USD',
    date: '2025-11-20',
    dueDate: '2025-12-20',
    status: InvoiceStatus.EXCEPTION,
    variance: 178.00,
    reason: 'Rate Mismatch (>5%)',
    extractionConfidence: 96,
    assignedTo: 'Lan Banh',
    workflowHistory: [
      { stepId: 'step-1', status: 'ACTIVE' },
      { stepId: 'step-2', status: 'PENDING' },
      { stepId: 'step-3', status: 'PENDING' }
    ],
    tmsEstimatedAmount: 2500.00,
    auditAmount: 2500.00,
    source: 'EDI',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-889210-02',
    lineItems: [
      { description: 'Ocean Freight - 40FT', amount: 2500.00, expectedAmount: 2500.00 },
      { description: 'Peak Season Surcharge', amount: 178.00, expectedAmount: 0.00 }
    ],
    matchResults: {
      rate: MatchStatus.MISMATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '101-55', segment: 'Transformers', amount: 1339.00, percentage: 50, color: 'bg-teal-500' },
      { code: '102-90', segment: 'Spare Parts', amount: 1339.00, percentage: 50, color: 'bg-orange-500' }
    ],
    logistics: {
      vesselName: 'CMA CGM MARCO POLO',
      voyageNumber: '0ME2QE1MA',
      billOfLading: 'CMDU29384712',
      containerNumber: 'CMAU1293847',
      containerType: '20GP',
      weight: 9200,
      volume: 33.2,
      portOfLoading: 'CNSHA',
      portOfDischarge: 'USLAX',
      etd: '2025-11-10',
      eta: '2025-11-28'
    },
    dispute: {
      status: 'OPEN',
      history: [
        { actor: 'System', timestamp: '2025-11-20 10:05 AM', action: 'Exception Raised', comment: 'Billed amount $2678.00 exceeds contracted rate $2500.00 by $178.00.' }
      ]
    }
  },
  {
    id: 'INV-GHOST-001',
    invoiceNumber: 'EXP-991-URGENT',
    carrier: 'Expeditors',
    origin: 'JFK Airport',
    destination: 'Raleigh Hub',
    amount: 12500.00,
    currency: 'USD',
    date: '2025-11-26',
    dueDate: '2025-12-26',
    status: InvoiceStatus.EXCEPTION,
    variance: 0.00,
    reason: 'Ghost Shipment (No TMS Link)',
    extractionConfidence: 88,
    assignedTo: 'Logistics Mgr',
    workflowHistory: [
      { stepId: 'step-1', status: 'ACTIVE' },
      { stepId: 'step-2', status: 'PENDING' },
      { stepId: 'step-3', status: 'PENDING' }
    ],
    tmsEstimatedAmount: undefined,
    auditAmount: 12500.00,
    source: 'EMAIL',
    tmsMatchStatus: 'NOT_FOUND',
    sapShipmentRef: undefined,
    lineItems: [
      { description: 'Air Charter - Urgent Parts', amount: 12500.00, expectedAmount: 12500.00 }
    ],
    matchResults: {
      rate: MatchStatus.MATCH,
      delivery: MatchStatus.MISSING,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '999-00', segment: 'Unallocated / Suspense', amount: 12500.00, percentage: 100, color: 'bg-gray-400' }
    ],
    logistics: {
      vesselName: 'MSC GULSUN',
      voyageNumber: 'MS9281',
      billOfLading: 'MEDU29183741',
      containerNumber: 'MSCU2938471',
      containerType: '40HC',
      weight: 22100,
      volume: 71.0,
      portOfLoading: 'DEHAM',
      portOfDischarge: 'USNYC',
      etd: '2025-11-15',
      eta: '2025-11-25'
    },
    dispute: {
      status: 'OPEN',
      history: [
        { actor: 'System', timestamp: '2025-11-26 09:00 AM', action: 'Exception Raised', comment: 'Invoice received via email has no corresponding shipment in TMS. Manual verification required.' }
      ]
    }
  },
  {
    id: 'LTL-992',
    invoiceNumber: 'LTL-992',
    carrier: 'K Line America',
    origin: 'Zone 1 (East)',
    destination: 'Zone 4 (Midwest)',
    amount: 450.00,
    currency: 'USD',
    date: '2025-11-21',
    dueDate: '2025-12-21',
    status: InvoiceStatus.APPROVED,
    variance: 0.00,
    reason: 'Czar-Lite Match OK',
    extractionConfidence: 92,
    workflowHistory: [
      { stepId: 'step-1', status: 'APPROVED', approverName: 'System', approverRole: 'Auto-Matcher' },
      { stepId: 'step-2', status: 'SKIPPED' },
      { stepId: 'step-3', status: 'APPROVED', approverName: 'System' }
    ],
    tmsEstimatedAmount: 450.00,
    auditAmount: 450.00,
    source: 'API',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-889210-03',
    lineItems: [
      { description: 'LTL Base Rate', amount: 450.00, expectedAmount: 450.00 }
    ],
    matchResults: {
      rate: MatchStatus.MATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '101-20', segment: 'Power Grids', amount: 450.00, percentage: 100, color: 'bg-blue-500' }
    ],
    logistics: {
      vesselName: 'HMM ALGECIRAS',
      voyageNumber: 'HM1029',
      billOfLading: 'HMMU29381723',
      containerNumber: 'HMMU9283712',
      containerType: '45HC',
      weight: 14500,
      volume: 85.0,
      portOfLoading: 'KRPUS',
      portOfDischarge: 'USSEA',
      etd: '2025-11-18',
      eta: '2025-12-02'
    }
  },
  {
    id: 'INV-992-DUP',
    invoiceNumber: 'LTL-992-B',
    carrier: 'K Line America',
    origin: 'Zone 1 (East)',
    destination: 'Zone 4 (Midwest)',
    amount: 450.00,
    currency: 'USD',
    date: '2025-11-25',
    dueDate: '2025-12-25',
    status: InvoiceStatus.EXCEPTION,
    variance: 0.00,
    reason: 'Suspect Duplicate (95% Match)',
    extractionConfidence: 98,
    assignedTo: 'System Sentinel',
    workflowHistory: [
      { stepId: 'step-1', status: 'ACTIVE' },
      { stepId: 'step-2', status: 'PENDING' },
      { stepId: 'step-3', status: 'PENDING' }
    ],
    tmsEstimatedAmount: 450.00,
    auditAmount: 450.00,
    source: 'API',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-889210-03',
    lineItems: [
      { description: 'LTL Base Rate', amount: 450.00, expectedAmount: 450.00 }
    ],
    matchResults: {
      rate: MatchStatus.MATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    dispute: {
      status: 'OPEN',
      history: [
        { actor: 'System', timestamp: '2025-11-25 11:00 AM', action: 'Exception Raised', comment: 'Invoice is a 95% match to existing invoice #LTL-992. Please verify this is not a duplicate.' }
      ]
    }
  },
  {
    id: 'PAID-001',
    invoiceNumber: 'MSC-881-C',
    carrier: 'MSC',
    origin: 'Hamburg, DE',
    destination: 'Newark, NJ',
    amount: 4200.00,
    currency: 'USD',
    date: '2025-10-15',
    dueDate: '2025-11-15',
    status: InvoiceStatus.PAID,
    variance: 0.00,
    reason: 'Paid via Batch #PY-2025-10-24',
    extractionConfidence: 99,
    workflowHistory: [{ stepId: 'step-1', status: 'APPROVED' }, { stepId: 'step-2', status: 'SKIPPED' }, { stepId: 'step-3', status: 'APPROVED' }],
    tmsEstimatedAmount: 4200.00,
    auditAmount: 4200.00,
    source: 'EDI',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-889100-01',
    lineItems: [{ description: 'Ocean Freight 40HC', amount: 4200.00, expectedAmount: 4200.00 }],
    matchResults: { rate: MatchStatus.MATCH, delivery: MatchStatus.MATCH, unit: MatchStatus.MATCH },
    glSegments: [{ code: '101-55', segment: 'Transformers', amount: 4200.00, percentage: 100, color: 'bg-teal-500' }],
    logistics: {
      vesselName: 'EVER GIVEN',
      voyageNumber: '102W',
      billOfLading: 'EGLV29384712',
      containerNumber: 'EGHU2938471',
      containerType: '40HC',
      weight: 19200,
      volume: 67.8,
      portOfLoading: 'CNYTN',
      portOfDischarge: 'NLRTM',
      etd: '2025-11-05',
      eta: '2025-12-10'
    }
  },
  {
    id: 'REJECTED-001',
    invoiceNumber: 'REJ-001',
    carrier: 'Flexport',
    origin: 'Shanghai, CN',
    destination: 'Los Angeles, CA',
    amount: 3500.00,
    currency: 'USD',
    date: '2025-11-18',
    dueDate: '2025-12-18',
    status: InvoiceStatus.REJECTED,
    variance: 3500.00,
    reason: 'Auto-Rejected: No Proof of Delivery',
    extractionConfidence: 95,
    workflowHistory: [{ stepId: 'step-1', status: 'REJECTED', approverName: 'System', comment: 'Missing POD.' }, { stepId: 'step-2', status: 'PENDING' }, { stepId: 'step-3', status: 'PENDING' }],
    tmsEstimatedAmount: 3500.00,
    auditAmount: 0.00,
    source: 'PORTAL',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-889205-01',
    lineItems: [{ description: 'Freight Charges', amount: 3500.00, expectedAmount: 3500.00 }],
    matchResults: { rate: MatchStatus.MATCH, delivery: MatchStatus.MISSING, unit: MatchStatus.MATCH },
    glSegments: [{ code: '101-20', segment: 'Power Grids', amount: 3500.00, percentage: 100, color: 'bg-blue-500' }]
  },
  // --- NEW MOCK DATA ---
  {
    id: 'INV-2025-008',
    invoiceNumber: 'INV-2025-008',
    carrier: 'DHL Express',
    origin: 'London, UK',
    destination: 'New York, NY',
    amount: 1250.50,
    currency: 'USD',
    date: '2025-12-01',
    dueDate: '2025-12-31',
    status: InvoiceStatus.PENDING,
    variance: 0.00,
    reason: 'Awaiting Approval',
    extractionConfidence: 99,
    workflowHistory: [
      { stepId: 'step-1', status: 'PENDING' },
      { stepId: 'step-2', status: 'PENDING' },
      { stepId: 'step-3', status: 'PENDING' }
    ],
    tmsEstimatedAmount: 1250.50,
    auditAmount: 1250.50,
    source: 'API',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-990011-01',
    lineItems: [
      { description: 'Express Worldwide', amount: 1250.50, expectedAmount: 1250.50 }
    ],
    matchResults: {
      rate: MatchStatus.MATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '101-20', segment: 'Power Grids', amount: 1250.50, percentage: 100, color: 'bg-blue-500' }
    ]
  },
  {
    id: 'INV-2025-009',
    invoiceNumber: 'INV-2025-009',
    carrier: 'Kuehne+Nagel',
    origin: 'Berlin, DE',
    destination: 'Chicago, IL',
    amount: 5600.00,
    currency: 'USD',
    date: '2025-12-02',
    dueDate: '2026-01-02',
    status: InvoiceStatus.EXCEPTION,
    variance: 450.00,
    reason: 'Unexpected Accessorials',
    extractionConfidence: 94,
    assignedTo: 'William Carswell',
    workflowHistory: [
      { stepId: 'step-1', status: 'ACTIVE' },
      { stepId: 'step-2', status: 'PENDING' },
      { stepId: 'step-3', status: 'PENDING' }
    ],
    tmsEstimatedAmount: 5150.00,
    auditAmount: 5150.00,
    source: 'EDI',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-990012-01',
    lineItems: [
      { description: 'Ocean Freight', amount: 5150.00, expectedAmount: 5150.00 },
      { description: 'Port Congestion Fee', amount: 450.00, expectedAmount: 0.00 }
    ],
    matchResults: {
      rate: MatchStatus.MISMATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '102-90', segment: 'Spare Parts', amount: 5600.00, percentage: 100, color: 'bg-orange-500' }
    ],
    dispute: {
      status: 'OPEN',
      history: [
        { actor: 'System', timestamp: '2025-12-02 09:30 AM', action: 'Exception Raised', comment: 'Unplanned accessorial charge detected.' }
      ]
    }
  },
  {
    id: 'INV-2025-010',
    invoiceNumber: 'INV-2025-010',
    carrier: 'FedEx',
    origin: 'Memphis, TN',
    destination: 'Atlanta, GA',
    amount: 320.00,
    currency: 'USD',
    date: '2025-12-03',
    dueDate: '2026-01-03',
    status: InvoiceStatus.APPROVED,
    variance: 0.00,
    reason: 'Auto-Approved (Low Value)',
    extractionConfidence: 99,
    workflowHistory: [
      { stepId: 'step-1', status: 'APPROVED', approverName: 'System', approverRole: 'Auto-Matcher' },
      { stepId: 'step-2', status: 'SKIPPED' },
      { stepId: 'step-3', status: 'APPROVED', approverName: 'System' }
    ],
    tmsEstimatedAmount: 320.00,
    auditAmount: 320.00,
    source: 'API',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-990013-01',
    lineItems: [
      { description: 'Ground Shipping', amount: 320.00, expectedAmount: 320.00 }
    ],
    matchResults: {
      rate: MatchStatus.MATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '101-20', segment: 'Power Grids', amount: 320.00, percentage: 100, color: 'bg-blue-500' }
    ]
  },
  {
    id: 'INV-2025-011',
    invoiceNumber: 'INV-2025-011',
    carrier: 'C.H. Robinson',
    origin: 'Laredo, TX',
    destination: 'Detroit, MI',
    amount: 1850.00,
    currency: 'USD',
    date: '2025-12-04',
    dueDate: '2026-01-04',
    status: InvoiceStatus.VENDOR_RESPONDED,
    variance: 150.00,
    reason: 'Detention Dispute',
    extractionConfidence: 97,
    assignedTo: 'Lan Banh',
    workflowHistory: [
      { stepId: 'step-1', status: 'ACTIVE' },
      { stepId: 'step-2', status: 'PENDING' },
      { stepId: 'step-3', status: 'PENDING' }
    ],
    tmsEstimatedAmount: 1700.00,
    auditAmount: 1700.00,
    source: 'PORTAL',
    tmsMatchStatus: 'LINKED',
    sapShipmentRef: 'SHP-990014-01',
    lineItems: [
      { description: 'FTL Freight', amount: 1700.00, expectedAmount: 1700.00 },
      { description: 'Driver Detention (2hrs)', amount: 150.00, expectedAmount: 0.00 }
    ],
    matchResults: {
      rate: MatchStatus.MISMATCH,
      delivery: MatchStatus.MATCH,
      unit: MatchStatus.MATCH
    },
    glSegments: [
      { code: '101-55', segment: 'Transformers', amount: 1850.00, percentage: 100, color: 'bg-teal-500' }
    ],
    dispute: {
      status: 'VENDOR_RESPONDED',
      history: [
        { actor: 'System', timestamp: '2025-12-04 10:00 AM', action: 'Exception Raised', comment: 'Detention charges not pre-approved.' },
        { actor: 'Vendor', timestamp: '2025-12-04 02:00 PM', action: 'Justification Submitted', comment: 'Driver was held at dock for 3 hours. POD attached.' }
      ]
    }
  }
];

export const MOCK_RATES: RateCard[] = [
  {
    id: 'rc-001',
    carrier: 'Maersk',
    contractRef: 'GB01/0010',
    origin: 'Bloomington, IL',
    destination: 'Brisbane, AU',
    containerType: "20' Standard",
    rate: 2775.00,
    currency: 'USD',
    status: 'ACTIVE',
    validFrom: '2025-01-01',
    validTo: '2026-12-31'
  },
  {
    id: 'rc-002',
    carrier: 'Hapag-Lloyd',
    contractRef: 'HL-EUR-NA-25',
    origin: 'Hamburg, DE',
    destination: 'Charleston, SC',
    containerType: "40' High Cube",
    rate: 4500.00,
    currency: 'USD',
    status: 'ACTIVE',
    validFrom: '2025-02-01',
    validTo: '2026-02-01'
  }
];

export const SPEND_DATA = [
  { name: 'Ocean', spend: 400000 },
  { name: 'Road (LTL)', spend: 300000 },
  { name: 'Air', spend: 200000 },
  { name: 'Rail', spend: 278000 },
];

export const MOCK_PARTNERS = [
  {
    id: 1,
    name: 'Maersk Line',
    scac: 'MAEU',
    mode: 'Ocean',
    region: 'Global',
    integration: 'EDI (210/310)',
    status: 'Verified',
    integrationType: 'edi'
  },
  {
    id: 2,
    name: 'K Line America',
    scac: 'KKLU',
    mode: 'Road/Intermodal',
    region: 'North America',
    integration: 'API',
    status: 'Verified',
    integrationType: 'api'
  },
  {
    id: 3,
    name: 'Old Dominion Freight',
    scac: 'ODFL',
    mode: 'Road (LTL)',
    region: 'USA',
    integration: 'Vendor Portal',
    status: 'Pending Docs',
    integrationType: 'portal'
  }
];

export const MOCK_BATCHES: PaymentBatch[] = [
  {
    id: 'PY-2025-11-24-001',
    runDate: '2025-11-24',
    entity: 'Hitachi Energy USA',
    bankAccount: 'JPM-8829 (USD)',
    currency: 'USD',
    amount: 7425.00,
    invoiceCount: 3,
    discountAvailable: 125.00,
    status: 'SENT_TO_BANK',
    riskScore: 'LOW',
    invoiceIds: ['5467', 'LTL-992', 'PAID-001'],
    paymentTerms: 'Net 30',
    sanctionStatus: 'PASSED'
  },
  {
    id: 'PY-2025-11-25-002',
    runDate: '2025-11-25',
    entity: 'Hitachi Energy Canada',
    bankAccount: 'RBC-9921 (CAD)',
    currency: 'USD', // For demo simplicity
    amount: 2678.00,
    invoiceCount: 1,
    status: 'AWAITING_APPROVAL',
    riskScore: 'LOW',
    nextApprover: 'William Carswell',
    invoiceIds: ['709114'],
    paymentTerms: 'Net 45',
    sanctionStatus: 'PASSED'
  },
  {
    id: 'PY-2025-11-25-003',
    runDate: '2025-11-25',
    entity: 'Hitachi Energy EU',
    bankAccount: 'DB-1120 (EUR)',
    currency: 'USD', // For demo simplicity
    amount: 12950.00,
    invoiceCount: 2,
    status: 'DRAFT',
    riskScore: 'MEDIUM',
    invoiceIds: ['INV-GHOST-001', 'INV-992-DUP'],
    paymentTerms: 'Net 60',
    sanctionStatus: 'PENDING'
  }
];

export const AGING_DATA = [
  { name: '0-30 Days', amount: 850000 },
  { name: '30-60 Days', amount: 350000 },
  { name: '60+ Days (Overdue)', amount: 15000 },
];
