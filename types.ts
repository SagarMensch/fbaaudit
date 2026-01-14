
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

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'VENDOR' | 'AUDITOR' | 'SYSTEM';
  content: string;
  timestamp: string;
  avatar?: string;
  isInternal?: boolean; // If true, hidden from Vendor
}

export interface Dispute {
  status: 'OPEN' | 'VENDOR_RESPONDED' | 'UNDER_REVIEW' | 'RESOLVED';
  ticketId?: string; // e.g. TKT-2025-001
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTo?: string;
  messages: ChatMessage[]; // The Chat Log
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
  type: 'ASSIGNMENT' | 'ALERT' | 'INFO' | 'SUCCESS';
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
  poNumber?: string;
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
  // Parcel Specific (FedEx/UPS/DHL)
  parcelDetails?: {
    serviceType: string; // e.g. "FedEx Priority Overnight"
    trackingNumber: string;
    zone: string;
    billedWeight: number;
    actualWeight: number;
    dimWeight: number;
    dimFactor: number; // e.g. 139
    dimensions: string; // "10x10x10"
    guaranteedDeliveryDate?: string;
    actualDeliveryDate?: string;
    isResidential: boolean;
    signedBy?: string;
  };

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
  source?: 'EDI' | 'API' | 'EMAIL' | 'MANUAL' | 'PORTAL' | 'ERS';
  tmsMatchStatus?: 'LINKED' | 'NOT_FOUND';
  sapShipmentRef?: string;
  spotQuoteRef?: string;

  // Added to support InvoiceDetail.tsx
  logistics?: LogisticsDetails;
  skuList?: SKUItem[];



  // Tax Compliance (Global)
  taxTotal?: number;
  taxDetails?: TaxDetail[];

  // FX & Multi-Currency
  baseAmount?: number;
  exchangeRate?: number;
  baseCurrency?: string;

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

  documentBundle?: InvoiceDocumentBundle;
  documentCompliance?: DocumentComplianceStatus;
}

export interface Dispute {
  status: 'OPEN' | 'VENDOR_RESPONDED' | 'UNDER_REVIEW' | 'RESOLVED';
  ticketId?: string;
  invoiceId?: string;
  subject?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTo?: string;
  messages: ChatMessage[];
  history: {
    actor: 'Vendor' | 'SCM' | 'System';
    timestamp: string;
    action: string;
    comment?: string;
  }[];
}

export interface SKUItem {
  id: string;
  name: string;
  quantity: number;
  weight: number; // kg
  volume: number; // cbm
  value: number; // USD
}

// Tax Compliance Types
export interface TaxDetail {
  type: string; // VAT, CGST, SGST, IGST, STATE_TAX
  rate: number;
  amount: number;
  jurisdiction?: string;
}

export interface LineItem {
  description: string;
  amount: number;
  expectedAmount: number;
}

// --- DOCUMENT COMPLIANCE SYSTEM ---

export type DocumentStatus = 'ATTACHED' | 'MISSING' | 'PENDING_UPLOAD' | 'REJECTED';
export type DocumentSource = 'MANUAL' | 'EDI' | 'API' | 'EMAIL' | 'PORTAL' | 'ERP' | 'AI_EXTRACTED' | 'AI_PREDICTED';

export interface DocumentMetadata {
  status: DocumentStatus;
  source?: DocumentSource;
  confidence?: number; // 0-100, for AI-extracted/predicted
  uploadedDate?: string;
  uploadedBy?: string;
  fileUrl?: string;
  fileName?: string;
  mandatory?: boolean; // If true, blocks approval
  blocker?: boolean; // If true and missing, cannot approve
  aiPredicted?: boolean;
  predictedValue?: string; // What AI predicted (e.g., "1,850 kg")
  predictionMethod?: string; // How AI predicted it
  predictionConfidence?: number; // 0-100
}

export interface InvoiceDocumentBundle {
  // Mandatory Documents
  commercialInvoice?: DocumentMetadata;
  billOfLading?: DocumentMetadata; // LR Number
  proofOfDelivery?: DocumentMetadata; // POD
  purchaseOrder?: DocumentMetadata;
  rateConfirmation?: DocumentMetadata;

  // India-Specific Mandatory
  gstInvoice?: DocumentMetadata;
  ewayBill?: DocumentMetadata; // For interstate

  // Recommended Documents
  packingList?: DocumentMetadata;
  weightCertificate?: DocumentMetadata;

  // Conditional Documents
  customsDocuments?: DocumentMetadata; // If international
  insuranceCertificate?: DocumentMetadata; // If insured
  detentionProof?: DocumentMetadata; // If detention charges
  demurrageProof?: DocumentMetadata; // If demurrage charges

  // Tax Documents
  tdsCertificate?: DocumentMetadata; // If TDS applicable
  msmeCertificate?: DocumentMetadata; // If vendor is MSME
}

export interface AIPrediction {
  field: string; // e.g., "weight", "deliveryDate", "fuelSurcharge"
  predictedValue: string | number;
  confidence: number; // 0-100
  method: string; // e.g., "Historical lane analysis", "Contract rate lookup"
  basedOn: string[]; // e.g., ["Last 10 shipments on DEL-MUM lane"]
  accuracy?: string; // e.g., "±50 kg", "±1 day"
}

export interface DocumentComplianceStatus {
  totalRequired: number;
  totalAttached: number;
  totalMissing: number;
  mandatoryMissing: number;
  canApprove: boolean; // False if any mandatory docs missing
  aiAssisted: boolean; // True if any AI predictions used
  aiPredictions: AIPrediction[];
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
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
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
  type: 'FUEL_SURCHARGE' | 'WEIGHT_VARIANCE' | 'RATE_MISMATCH' | 'DUPLICATE' | 'EWAY_BILL_MISSING' | 'POD_MISMATCH' | 'GST_RATE_VARIANCE' | 'BENFORD_FRAUD';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100 (Confidence)
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'DISPUTED';
  description: string;
  value: number;
  expectedValue: number;
  carrierName?: string; // Added for Phase 13 Interconnectivity
}

// --- MODULE 1: DYNAMIC CONTRACT MASTER (INDIAN LOGISTICS) ---

export type VehicleType = 'Tata Ace' | '407' | '19ft' | '32ft SXL' | '32ft MXL' | '20ft SXL' | '40ft Trailer' | '10-Tyre' | 'Taurus';

export type RateBasis = 'Per Trip' | 'Per Kg' | 'Per Ton' | 'Per Km';

// Layer 4: Accessorial Rulebook
export interface AccessorialRules {
  loadingUnloading: {
    isIncluded: boolean;
    ratePerTon?: number;
    lumpSum?: number;
  };
  detention: {
    freeTimeLoading: number; // Hours
    freeTimeUnloading: number; // Hours
    ratePerDay: number;
    excludeHolidays: boolean;
  };
  oda: {
    distanceThreshold: number; // km
    surcharge: number;
  };
  tolls: {
    isInclusive: boolean; // If false, "At Actuals"
  };
}

// Layer 3: PVC Engine (Diesel Escalation)
export interface PVCConfig {
  baseDieselPrice: number;
  mileageBenchmark: number; // KMPL
  referenceCity: string;
}

// Layer 2: Freight Matrix Entry
export interface FreightRate {
  id: string;
  origin: string; // City or Zone
  destination: string; // City or Zone
  vehicleType: VehicleType;
  capacityTon: number;
  rateBasis: RateBasis;
  baseRate: number;
  minCharge?: number;
  transitTimeHrs: number;
}

// Layer 1: The Header
export interface Contract {
  id: string;
  vendorId: string;
  vendorName: string;
  serviceType: 'FTL' | 'LTL' | 'Express' | 'Air';
  validFrom: string;
  validTo: string;
  paymentTerms: 'Net 30' | 'Net 45' | 'Net 60' | 'Immediate';
  isRCMApplicable: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PENDING_APPROVAL';

  // Layers
  freightMatrix: FreightRate[];
  pvcConfig: PVCConfig;
  accessorials: AccessorialRules;

  // Deep Contract Details (Phase 3)
  contractVersion?: string; // e.g. "v2.1"

  // Parties
  parties?: {
    shipper: {
      name: string;
      legalEntity: string;
      address: string;
      gstin: string;
      pan: string;
    };
    carrier: {
      name: string;
      legalEntity: string;
      address: string;
      gstin: string;
      pan: string;
    };
  };

  // Governing Law
  governingLaw?: string; // e.g. "Indian Contract Act, 1872; Jurisdiction: Delhi High Court"

  // SLA Metrics & Performance
  sla?: {
    onTimeDeliveryTarget: number; // e.g. 95 (%)
    podSubmissionDays: number; // e.g. 7 days
    damageLimitPercent: number; // e.g. 0.5 (%)
    claimRatioTarget: number; // e.g. 1.0 (%)
    responseTimeHours: number; // e.g. 4 hours
    penalties: {
      metric: string; // e.g. "On-Time Delivery"
      threshold: string; // e.g. "< 90%"
      penalty: string; // e.g. "₹5,000 per shipment or 2% of freight, whichever is higher"
    }[];
    incentives?: {
      metric: string;
      threshold: string;
      reward: string;
    }[];
  };

  // Insurance & Liability
  insurance?: {
    cargoInsuranceCoverage: number; // e.g. 500000 (₹)
    liabilityLimitPerShipment: number; // e.g. 100000 (₹)
    claimsProcess: string; // e.g. "Claims to be filed within 7 days with POD and damage report"
    forceMajeure: string; // e.g. "Carrier not liable for delays due to natural disasters, strikes, govt. actions"
  };

  // Terms & Conditions
  termsAndConditions?: {
    terminationNotice: string; // e.g. "90 days written notice required"
    terminationPenalty?: string; // e.g. "Early termination: 3 months average freight as penalty"
    disputeResolution: string; // e.g. "Arbitration in Delhi under Arbitration Act, 1996"
    confidentiality: string; // e.g. "Both parties agree to maintain confidentiality of rates and terms"
    compliance: string; // e.g. "Carrier must comply with Motor Vehicles Act, 1988 and GST regulations"
    amendment: string; // e.g. "Amendments require written approval from both parties"
  };

  // RCM & GST Details
  gstDetails?: {
    rcmApplicable: boolean;
    gstRate: number; // e.g. 5 or 12 or 18 (%)
    rcmSplitRatio?: string; // e.g. "50:50" or "Shipper pays full GST"
    placeOfSupply: string; // e.g. "As per delivery location"
    invoicingRequirements: string; // e.g. "E-way bill mandatory for shipments > ₹50,000"
  };

  // Cross-Linking
  relatedInvoiceIds?: string[]; // Link to invoices using this contract
  relatedShipmentIds?: string[]; // Link to shipments under this contract

  // Performance Tracking
  performanceGrade?: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C' | 'D' | 'F';
  lastAmendmentDate?: string;
  nextReviewDate?: string;
  spendMTD?: number; // Month-to-date spend
  utilizationPercent?: number; // % of target utilization
}

// --- MODULE 2: SPOT-BUY ENGINE ---

export interface SpotVendor {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  rating: number; // 1-5 stars
}

export interface SpotBid {
  id: string;
  requestId: string; // Links to SpotVendorRequest
  vendorName: string; // Denormalized for display
  amount: number;
  remarks?: string;
  bidTime: string;
  isWinningBid?: boolean;
}

export interface SpotVendorRequest {
  id: string; // "SVR-..."
  indentId: string;
  vendorId: string;
  token: string; // The "Guest Link" token
  status: 'SENT' | 'OPENED' | 'BID_RECEIVED' | 'DECLINED';
  whatsappSent: boolean;
  bid?: SpotBid;
}

export interface SpotIndent {
  id: string; // "IND-..."
  requestorId: string;
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  weightTon: number;

  benchmarkPrice: number; // From Contract Master

  status: 'OPEN' | 'BIDDING' | 'PENDING_APPROVAL' | 'BOOKED' | 'CANCELLED';

  vendorRequests: SpotVendorRequest[];

  approvedPrice?: number;
  winningBidId?: string;
  spotBookingRef?: string; // "SPOT-..."
  approvalProofUrl?: string; // For offline override

  createdAt: string;
}

// --- MODULE 3: VENDOR ONBOARDING LITE ---

export interface OnboardingVendor {
  id: string;
  mobile: string;
  email?: string;

  // Tax & Legal (Step 2)
  gstin: string;
  companyName: string; // Auto-fetched
  tradeName?: string;
  pan: string;
  legalStructure: 'Proprietorship' | 'Private Ltd' | 'Partnership' | 'LLP';
  address: string;

  // Bank (Step 3)
  bankAccount: string;
  ifsc: string;
  bankBeneficiaryName: string;
  isBankVerified: boolean;

  // Compliance (Step 4)
  isMsme: boolean;
  msmeRegNumber?: string;
  lowerDeductionCert?: boolean; // Sec 197

  // Finance Config (Auto-Computed)
  paymentTermsDays: number; // 45 (MSME) vs 60 (Std)
  tdsRate: number; // 1% (Prop) vs 2% (Pvt Ltd) or 0.5% (Cert)

  status: 'DRAFT' | 'COMPLETED' | 'APPROVED';
}

// --- MODULE 5: INDIA TAX ENGINE ---

export interface TaxBreakdown {
  // GST Components
  taxableAmount: number;
  gstRate: number; // 5, 12, 18
  cgst: number;
  sgst: number;
  igst: number;
  isRcm: boolean; // If true, Client pays tax to Govt
  gstPayableToVendor: number;
  gstPayableToGovt: number;

  // TDS Components
  tdsRate: number; // 1, 2, 0.5 (Lower Deduction)
  tdsAmount: number;
  sectionCode: '194C' | '194Q' | '194I';

  // Final Net Pay
  netPayableToVendor: number; // (Base + GST_Vendor) - TDS
}

export interface VendorTaxProfile {
  id: string;
  name: string;
  gstin: string;
  stateCode: string; // '27', '07'
  constitution: 'Proprietorship' | 'Company' | 'Partnership'; // Determines TDS 1% vs 2%
  isGta: boolean; // Goods Transport Agency
  isRcmOpted: boolean; // If GTA and yes, RCM applies (5%)
  defaultGstRate: number; // 5, 12, 18
  lowerDeductionCert?: {
    rate: number;
    validTo: string;
  };
}

// --- MODULE 6: THE BLACKBOOK SCORECARD ---

export interface VendorIncident {
  id: string;
  vendorId: string;
  date: string;
  type: 'PLACEMENT_FAILURE' | 'TRANSIT_DELAY' | 'POD_DELAY' | 'DAMAGE' | 'OTHER';
  severity: 1 | 2 | 3 | 4 | 5; // 5 = Critical
  remarks: string;
  costImpact?: number; // Estimated financial loss
  isForceMajeure?: boolean; // If true, excluded from score
}

export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  month: string; // "2025-01"

  // Raw Stats
  totalBookings: number;
  placementFailures: number;
  onTimeDeliveries: number;
  podDelays: number;

  // Scores (0-100)
  placementScore: number;
  speedScore: number;
  docScore: number;

  overallScore: number;
  rank: number;
  trend: 'UP' | 'DOWN' | 'STABLE';

  // Financial Impact (The "Killer Feature")
  costOfFailure: number;
}

// --- MODULE 4: BABU OCR ENGINE ---

export interface OCRAnalysisResult {
  fullText: string;
  detectedKeywords: string[]; // e.g. ["damage", "broken"]
  isClean: boolean;
  confidence: number;
  handwritingDetected: boolean;
}

export interface ShipmentDocument {
  id: string;
  type: 'INVOICE' | 'POD' | 'WEIGHT_SLIP' | 'EWAY_BILL' | 'UNKNOWN';
  pageNumber: number;
  imageUrl: string;

  // Extracted Data
  docDate?: string;
  docAmount?: number;
  docNumber?: string;

  // The "Babu" Analysis (POD Only)
  ocrResult?: OCRAnalysisResult;
  status: 'PROCESSING' | 'COMPLETED' | 'FLAGGED';
}

export interface ShipmentUpload {
  id: string;
  shipmentId: string; // Ref
  rawFileUrl: string; // The Multi-page PDF
  uploadedAt: string;
  splitDocuments: ShipmentDocument[];

  // Aggregate Status
  overallStatus: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'NEEDS_REVIEW';
  flaggedKeywords: string[]; // Union of all docs
}

// --- LOCATION GROUPING MASTER ---

export interface LocationZone {
  id: string;
  code: string; // e.g., "NORTH-INDIA", "DL-NCR"
  name: string; // e.g., "North India", "Delhi NCR"
  type: 'REGION' | 'STATE' | 'CITY' | 'PINCODE_CLUSTER';
  parentZoneId?: string; // Hierarchical structure
  locations: string[]; // City names
  pincodes?: string[]; // Pincode list for granular matching
  coordinates?: { lat: number; lng: number }; // For distance calculations
  metadata?: {
    population?: number;
    economicZone?: string; // SEZ, Non-SEZ
    tier?: '1' | '2' | '3'; // City tier classification
  };
  createdBy?: string;
  createdDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DistanceMatrix {
  id: string;
  fromZone: string; // Zone ID or City name
  toZone: string;
  distanceKm: number;
  estimatedTransitHrs: number;
  calculationMethod: 'HAVERSINE' | 'ROAD_NETWORK' | 'HISTORICAL' | 'MANUAL';
  lastUpdated: string;
  confidence?: number; // 0-100 for AI-calculated distances
}

export interface LocationCluster {
  id: string;
  name: string; // e.g., "Western Hub Cluster"
  zoneIds: string[];
  centroid: { lat: number; lng: number };
  aiSuggested: boolean;
  confidence?: number; // 0-100
  rationale?: string; // Why AI suggested this cluster
  shipmentVolume?: number; // Historical shipments in this cluster
  avgCost?: number;
}

// --- FUEL MASTER ---

export interface FuelPriceRecord {
  id: string;
  date: string;
  city: string;
  dieselPrice: number;
  petrolPrice?: number;
  source: 'MANUAL' | 'API' | 'GOVERNMENT' | 'VENDOR';
  verified: boolean;
  verifiedBy?: string;
  apiProvider?: string; // e.g., "Indian Oil Corporation"
}

export interface FuelSurchargeRule {
  id: string;
  name: string; // e.g., "TCI Express PVC Rule"
  contractId?: string; // Link to specific contract
  vendorId?: string; // Or apply to all contracts of a vendor
  formula: 'PVC' | 'SLAB' | 'PERCENTAGE' | 'CUSTOM';

  // PVC Formula Parameters
  baseDieselPrice: number;
  mileageBenchmark: number; // KMPL
  referenceCity: string;

  // Slab-based Formula
  slabs?: { min: number; max: number; surcharge: number }[]; // Price range → Surcharge amount

  // Percentage Formula
  percentageRate?: number; // e.g., 5% of base freight

  // Custom Formula
  customFormula?: string; // JavaScript expression, e.g., "(currentPrice - basePrice) * 0.5 * distance"

  validFrom: string;
  validTo: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DRAFT';
  autoUpdate?: boolean; // Auto-fetch fuel prices
  updateFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  createdBy?: string;
  createdDate?: string;
  lastModified?: string;
}

export interface FuelSurchargeCalculation {
  ruleId: string;
  ruleName: string;
  currentPrice: number;
  basePrice: number;
  priceDiff: number;
  distanceKm?: number;
  baseFreight?: number;
  surchargeAmount: number;
  breakdown: string[]; // Step-by-step calculation
  calculatedAt: string;
}

export interface FuelPriceTrend {
  city: string;
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  dataPoints: { date: string; price: number }[];
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
  changePercent: number;
}

// --- LANE MASTER ---

export interface Lane {
  id: string;
  laneCode: string; // e.g., "DEL-MUM-001"
  origin: string;
  destination: string;
  distance: number; // km
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'INACTIVE';

  // Request Information
  requestedBy?: string;
  requestedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;

  // Performance Metrics (Auto-calculated from shipments)
  totalShipments?: number;
  avgTransitTime?: number; // hours
  onTimePercent?: number;
  avgCost?: number;
  lastShipmentDate?: string;

  // Rate Information
  benchmarkRate?: number; // Market average
  currentRate?: number; // Active contract rate
  lowestRate?: number; // Historical lowest
  highestRate?: number; // Historical highest
  rateHistory?: LaneRateHistory[];

  // AI Insights
  aiOptimizationScore?: number; // 0-100 (higher = better optimization opportunity)
  aiRecommendations?: string[]; // e.g., ["Consider consolidating with DEL-PUN lane", "Rate 15% above market"]
  utilizationPercent?: number; // % of available capacity used

  // Linked Data
  contractIds?: string[]; // Contracts covering this lane
  vendorIds?: string[]; // Vendors servicing this lane

  createdDate?: string;
  lastModified?: string;
}

export interface LaneRateHistory {
  id: string;
  effectiveDate: string;
  rate: number;
  contractId: string;
  vendorName: string;
  changePercent?: number; // % change from previous rate
  changeReason?: string; // e.g., "GRI", "Fuel escalation", "Contract renewal"
  approvedBy?: string;
}

export interface LaneApprovalRequest {
  id: string;
  laneId?: string; // If updating existing lane
  requestType: 'NEW_LANE' | 'RATE_CHANGE' | 'REACTIVATION' | 'DEACTIVATION';

  // Request Details
  origin: string;
  destination: string;
  requestedBy: string;
  requestDate: string;
  justification: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Rate Information
  proposedRate?: number;
  currentRate?: number; // For rate changes

  // Benchmarking
  benchmarkComparison?: {
    marketAvg: number;
    variance: number; // % difference from market
    competitorRates: { vendor: string; rate: number; source: string }[];
    dataSource: string; // Where benchmark came from
  };

  // Supporting Documents
  attachments?: { name: string; url: string; type: string }[];

  // Approval Status
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  approvalWorkflow?: WorkflowHistoryItem[];
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;

  // Business Impact
  estimatedMonthlyVolume?: number; // Shipments/month
  estimatedMonthlyCost?: number;
  customerRequirement?: string; // Customer name if specific requirement
}

export interface LanePerformanceMetrics {
  laneId: string;
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

  // Volume Metrics
  totalShipments: number;
  totalWeight: number; // tons
  totalCost: number;

  // Performance Metrics
  avgTransitTime: number; // hours
  onTimeDeliveries: number;
  onTimePercent: number;
  delayedShipments: number;
  avgDelay: number; // hours

  // Quality Metrics
  damageIncidents: number;
  damagePercent: number;
  claimsCount: number;
  claimsValue: number;

  // Cost Metrics
  avgCostPerShipment: number;
  avgCostPerKg: number;
  costTrend: 'RISING' | 'FALLING' | 'STABLE';
  costVariance: number; // % from benchmark

  // Vendor Performance (if single vendor)
  primaryVendor?: string;
  vendorScore?: number; // 0-100
}

export interface LaneOptimizationSuggestion {
  id: string;
  type: 'CONSOLIDATION' | 'RATE_NEGOTIATION' | 'VENDOR_CHANGE' | 'ROUTE_CHANGE' | 'MODE_SHIFT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  affectedLanes: string[]; // Lane IDs

  // Suggestion Details
  title: string;
  description: string;
  rationale: string;

  // Impact Analysis
  estimatedSavings: number; // Annual savings
  savingsPercent: number;
  implementationCost?: number;
  roi?: number; // Return on investment
  paybackPeriod?: number; // months

  // Implementation
  actionItems: string[];
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  // AI Metadata
  aiConfidence: number; // 0-100
  basedOn: string[]; // Data sources used
  generatedDate: string;

  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED';
}

// ============================================================================
// PAYMENT SYSTEM TYPES
// ============================================================================

export type PaymentMethod = 'ACH' | 'WIRE' | 'CHECK' | 'NEFT' | 'RTGS' | 'UPI' | 'IMPS';
export type PaymentBatchStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type PaymentTransactionStatus = 'PENDING' | 'INCLUDED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type ReconciliationStatus = 'UNMATCHED' | 'MATCHED' | 'EXCEPTION' | 'IGNORED';

export interface PaymentBatch {
  id: string;
  batchNumber: string;
  totalAmount: number;
  currency: string;
  invoiceCount: number;
  status: PaymentBatchStatus;
  paymentMethod: PaymentMethod;

  // Workflow
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;

  // Bank Details
  bankReference?: string;
  bankAccount?: string;
  scheduledDate?: string;
  paidAt?: string;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt?: string;

  // Related data (when detail view)
  transactions?: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  batchId?: string;
  invoiceId: string;
  vendorId: string;
  vendorName: string;

  // Amounts
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;

  // Multi-currency
  currency: string;
  exchangeRate: number;
  baseCurrencyAmount?: number;

  // Status
  status: PaymentTransactionStatus;
  paymentReference?: string;
  paidAt?: string;
  createdAt: string;
}

export interface BankReconciliation {
  id: string;
  statementId?: string;
  transactionDate: string;
  valueDate?: string;
  bankReference: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  currency: string;
  bankAccount?: string;

  // Matching
  status: ReconciliationStatus;
  matchedBatchId?: string;
  matchedInvoiceId?: string;
  matchedBy?: string;
  matchedAt?: string;
  exceptionReason?: string;

  createdAt: string;
}

export interface EarlyPaymentTerms {
  id: string;
  vendorId: string;
  vendorName?: string;
  discountPercent: number;
  daysEarly: number;
  standardPaymentDays: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

export interface EarlyPaymentDiscount {
  eligible: boolean;
  reason?: string;
  discountPercent?: number;
  discountAmount?: number;
  finalAmount?: number;
  daysUntilDiscountExpires?: number;
  originalDueDate?: string;
}

export interface VendorPaymentSummary {
  totalPayments: number;
  totalPaid: number;
  totalDiscountsReceived: number;
  pendingPayments: number;
  pendingAmount: number;
}

export interface PaymentAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  swiftCode?: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: 'API' | 'MANUAL' | 'RBI';
}
