
export enum InvoiceStatus {
  PENDING = 'PENDING',
  OPS_APPROVED = 'OPS_APPROVED',       // Step 1 Complete (Lan)
  FINANCE_APPROVED = 'FINANCE_APPROVED', // Step 2 Complete (William)
  TREASURY_PENDING = 'TREASURY_PENDING', // Ready for Payment Run
  APPROVED = 'APPROVED', // Fully Approved (Legacy/Final)
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  EXCEPTION = 'EXCEPTION',
  VENDOR_RESPONDED = 'VENDOR_RESPONDED'
}

export enum MatchStatus {
  MATCH = 'MATCH',
  MISMATCH = 'MISMATCH',
  MISSING = 'MISSING'
}

export type UserRole = 'HITACHI' | '3SC' | 'VENDOR';

export interface Dispute {
  status: 'OPEN' | 'VENDOR_RESPONDED' | 'UNDER_REVIEW' | 'RESOLVED';
  history: {
    actor: 'Vendor' | 'SCM' | 'System';
    timestamp: string;
    action: string;
    comment?: string;
  }[];
}

export interface WorkflowHistoryItem {
  stepId: string;
  status: 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'PROCESSING';
  approverName?: string;
  approverRole?: string;
  timestamp?: string;
  comment?: string;
}

export interface Notification {
  id: string;
  type: 'ASSIGNMENT' | 'ALERT' | 'INFO';
  message: string;
  timestamp: string;
  read: boolean;
  actionLink?: string;
}

export interface LogisticsDetails {
  vesselName: string;
  voyageNumber: string;
  billOfLading: string;
  containerNumber: string;
  containerType: '20GP' | '40HC' | '45HC' | 'LCL';
  weight: number;
  volume: number;
  portOfLoading: string;
  portOfDischarge: string;
  etd: string;
  eta: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessUnit?: string; // Added for Phase 6
  carrier: string;
  origin: string;
  destination: string;
  amount: number;
  currency: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  variance: number;
  reason?: string;
  extractionConfidence: number;
  lineItems: LineItem[];
  matchResults: {
    rate: MatchStatus;
    delivery: MatchStatus;
    unit: MatchStatus;
  };
  assignedTo?: string;
  currentStepId?: string;
  nextApproverRole?: string;

  // --- WORKFLOW ENGINE v2 ---
  workflowHistory?: WorkflowHistoryItem[];

  // --- SOLID FEATURES ---
  tmsEstimatedAmount?: number;
  auditAmount?: number;
  source?: 'EDI' | 'API' | 'EMAIL' | 'MANUAL' | 'PORTAL';
  tmsMatchStatus?: 'LINKED' | 'NOT_FOUND';
  sapShipmentRef?: string;

  // Smart GL Splitter
  glSegments?: {
    code: string;
    segment: string;
    amount: number;
    percentage: number;
    color: string;
  }[];

  // Dispute Management
  dispute?: Dispute;

  // Logistics Context
  logistics?: LogisticsDetails;
}

export interface LineItem {
  description: string;
  amount: number;
  expectedAmount: number;
}

export interface RateCard {
  id: string;
  carrier: string;
  contractRef: string;
  origin: string;
  destination: string;
  containerType: string;
  rate: number;
  currency: string;
  status: 'ACTIVE' | 'EXPIRED';
  validFrom: string;
  validTo: string;
}

export interface KPI {
  label: string;
  value: string;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'blue' | 'teal' | 'orange' | 'red';
}

export interface PaymentBatch {
  id: string;
  runDate: string;
  entity: string;
  bankAccount: string;
  currency: string;
  amount: number;
  invoiceCount: number;
  status: 'DRAFT' | 'AWAITING_APPROVAL' | 'APPROVED' | 'SENT_TO_BANK' | 'PAID' | 'REJECTED';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  nextApprover?: string;
  // Detail Fields
  invoiceIds: string[];
  paymentTerms: string;
  sanctionStatus: 'PASSED' | 'PENDING' | 'FAILED';
  discountAvailable?: number;
  fundingRequestId?: string; // Link to Weekly Funding
}

// --- RBAC & WORKFLOW ENGINE TYPES ---

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  users: number;
  permissions: {
    canViewInvoices: boolean;
    canApproveL1: boolean;
    canApproveL2: boolean;
    canManageRates: boolean;
    canAdminSystem: boolean;
  };
}

export interface WorkflowStepConfig {
  id: string;
  stepName: string;
  roleId: string;
  conditionType: 'ALWAYS' | 'AMOUNT_GT' | 'VARIANCE_GT';
  conditionValue?: number;
  isSystemStep?: boolean;
}

// --- PHASE 7: ADVANCED ANALYTICS ---

export interface CTSRecord {
  id: string;
  sku: string;
  customer: string;
  lane: string;
  totalCost: number;
  breakdown: {
    transport: number;
    accessorial: number;
    handling: number;
    overhead: number;
  };
  margin: number;
  units: number;
}

export interface CarrierScorecard {
  carrierId: string;
  carrierName: string;
  overallScore: number; // 0-100
  metrics: {
    onTimeDelivery: number;
    invoiceAccuracy: number;
    slaAdherence: number;
    rateConsistency: number;
    damageRatio: number;
  };
  trend: 'up' | 'down' | 'stable';
  rank: number;
}

export interface AnomalyRecord {
  id: string;
  shipmentId: string;
  type: 'FUEL_SURCHARGE' | 'WEIGHT_VARIANCE' | 'RATE_MISMATCH' | 'DUPLICATE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100 (Confidence)
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'DISPUTED';
  description: string;
  value: number;
  expectedValue: number;
  carrierName?: string; // Added for Phase 13 Interconnectivity
}
