
import { Invoice, InvoiceStatus, MatchStatus, RateCard, KPI, PaymentBatch, RoleDefinition, WorkflowStepConfig } from './types';
// REMOVED: import { MOCK_INVOICES_NEW } from './mock_invoices_clean';
// All components now fetch from database APIs - mock data no longer needed

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
    stepName: 'SCM Operations', // Explicit request: SCM Operations (Kaai Bansal)
    roleId: 'OPS_MANAGER',
    conditionType: 'ALWAYS'
  },
  {
    id: 'step-2',
    stepName: 'Finance Review', // Explicit request: Finance Review (Zeya Kapoor)
    roleId: 'FINANCE_MANAGER',
    conditionType: 'ALWAYS' // User implied linear flow: "then i will go to wiliiam he will seee everthing"
  },
  {
    id: 'step-3',
    stepName: 'ERP Settlement', // Explicit request: ERP Settlement (System Admin)
    roleId: 'ENTERPRISE_ADMIN',
    conditionType: 'ALWAYS',
    isSystemStep: true
  }
];

export const KPIS: KPI[] = [
  {
    label: 'TOTAL SPEND (YTD)',
    value: '₹12,910,540',
    subtext: 'vs Budget: -2.1%',
    trend: 'down',
    color: 'blue'
  },
  {
    label: 'AUDIT SAVINGS',
    value: '₹90,025',
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

// DEPRECATED: All components now fetch from database APIs
// This is kept as empty array for backward compatibility only
export const MOCK_INVOICES: Invoice[] = [];

// OLD DATA BELOW - DEPRECATED (keeping for reference only)
// OLD DATA REMOVED - CLEANED FOR INDIAN CONTEXT
const OLD_MOCK_INVOICES_DEPRECATED: Invoice[] = [];

export const AGING_DATA = [
  { name: '0-30 Days', amount: 850000 },
  { name: '30-60 Days', amount: 350000 },
  { name: '60+ Days (Overdue)', amount: 15000 },
];

export const MOCK_BATCHES: PaymentBatch[] = [];

export const SPEND_DATA = [
  { name: 'Ocean', value: 400000 },
  { name: 'Road (LTL)', value: 300000 },
  { name: 'Air', value: 200000 },
  { name: 'Rail', value: 278000 },
];

export const MOCK_RATES: RateCard[] = [
  {
    id: 'CON-2025-001',
    carrier: 'SafeExpress Logistics',
    contractRef: 'IOCL Mumbai Rate',
    origin: 'Mumbai, MH',
    destination: 'Pan-India (Zone 1)',
    containerType: "FTL (32ft MXL)",
    rate: 90.00,
    currency: 'INR',
    status: 'ACTIVE',
    validFrom: '2025-01-01',
    validTo: '2025-12-31'
  },
  {
    id: 'CON-2025-002',
    carrier: 'VRL Logistics',
    contractRef: 'DEL-Retail-25',
    origin: 'Delhi, DL',
    destination: 'Bangalore, KA',
    containerType: "LTL (Per Kg)",
    rate: 92.00,
    currency: 'INR',
    status: 'ACTIVE',
    validFrom: '2025-02-01',
    validTo: '2026-01-31'
  }
];

export const MOCK_PARTNERS = [
  { id: '1', name: 'Maersk', mode: 'Ocean', performance: 98 },
  { id: '2', name: 'Hapag-Lloyd', mode: 'Ocean', performance: 95 },
  { id: '3', name: 'TCI Express', mode: 'Road', performance: 92 },
  { id: '4', name: 'Blue Dart', mode: 'Road (Express)', performance: 96 },
  { id: '5', name: 'Delhivery', mode: 'Road', performance: 94 },
  { id: '6', name: 'Emirates', mode: 'Air', performance: 99 }
];
