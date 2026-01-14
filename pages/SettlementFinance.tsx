import React, { useState, useEffect } from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid,
   Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { UserRole, Invoice, PaymentBatch, BankReconciliation } from '../types';
// REMOVED: import { MOCK_INVOICES, MOCK_BATCHES } from '../constants';
import { exportToCSV } from '../utils/exportUtils';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import * as paymentService from '../services/paymentService';

// --- 3D SOLID GEOMETRIC ICONS ---

const GeoCube = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" fillOpacity="1" />
      <path d="M2 17l10 5 10-5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
      <path d="M2 7v10l10 5V12L2 7z" fillOpacity="0.8" />
      <path d="M12 12v10l10-5V7l-10 5z" fillOpacity="0.6" />
      <rect x="10" y="10" width="4" height="4" fill="white" fillOpacity="0.2" transform="rotate(45 12 12)" />
   </svg>
);

const GeoPyramid = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M12 2L2 19h20L12 2z" fillOpacity="0.8" />
      <path d="M12 2L2 19h10V2z" fillOpacity="1" />
      <path d="M12 2v17h10L12 2z" fillOpacity="0.6" />
   </svg>
);

const GeoHexagon = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" fillOpacity="0.8" />
      <path d="M12 12l8.5-5M12 12v10M12 12L3.5 7" stroke="white" strokeWidth="1" />
      <path d="M12 2l8.5 5L12 12 3.5 7 12 2z" fillOpacity="1" />
   </svg>
);

const GeoSphere = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <circle cx="12" cy="12" r="10" fillOpacity="0.4" />
      <circle cx="12" cy="12" r="7" fillOpacity="0.7" />
      <circle cx="12" cy="12" r="4" fillOpacity="1" />
   </svg>
);

const GeoWallet = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M20 12V8H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h12v4" fillOpacity="0.4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" fillOpacity="0.6" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" fillOpacity="1" />
   </svg>
);

const GeoClock = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <circle cx="12" cy="12" r="10" fillOpacity="0.3" />
      <path d="M12 12L12 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="11" y="11" width="2" height="2" fill="white" />
   </svg>
);

const GeoTrendUp = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke={color} strokeWidth="2" fill="none" />
      <path d="M17 6H23V12" stroke={color} strokeWidth="2" fill="none" />
      <rect x="21" y="4" width="4" height="4" fill={color} />
   </svg>
);

const GeoBuilding = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M2 22L2 8L12 2L22 8L22 22" fillOpacity="0.2" stroke={color} strokeWidth="1" />
      <path d="M6 10H18V22H6Z" fillOpacity="0.6" />
      <rect x="8" y="12" width="2" height="2" fill="white" fillOpacity="0.8" />
      <rect x="14" y="12" width="2" height="2" fill="white" fillOpacity="0.8" />
      <rect x="8" y="16" width="2" height="2" fill="white" fillOpacity="0.8" />
      <rect x="14" y="16" width="2" height="2" fill="white" fillOpacity="0.8" />
   </svg>
);

const GeoPieIcon = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" fillOpacity="0.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" fillOpacity="1" />
   </svg>
);

const GeoShield = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M12 2L3 7v6a12 12 0 0 0 9 11 12 12 0 0 0 9-11V7l-9-5z" fillOpacity="0.8" />
      <path d="M12 2v22a12 12 0 0 0 9-11V7l-9-5z" fillOpacity="1" />
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
   </svg>
);

const GeoLandmark = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M2 10L12 4L22 10V22H2V10Z" fillOpacity="0.3" stroke={color} strokeWidth="1" />
      <rect x="4" y="12" width="2" height="8" fill={color} />
      <rect x="8" y="12" width="2" height="8" fill={color} />
      <rect x="14" y="12" width="2" height="8" fill={color} />
      <rect x="18" y="12" width="2" height="8" fill={color} />
      <rect x="2" y="20" width="20" height="2" fill={color} />
   </svg>
);

const GeoFilter = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fillOpacity="0.8" />
   </svg>
);

const GeoPlus = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <rect x="11" y="2" width="2" height="20" rx="1" fillOpacity="1" />
      <rect x="2" y="11" width="20" height="2" rx="1" fillOpacity="1" />
   </svg>
);

const GeoRefresh = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M23 4v6h-6M1 20v-6h6" stroke={color} strokeWidth="2" fill="none" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
      <circle cx="12" cy="12" r="2" fillOpacity="1" />
   </svg>
);

// 3D Geometric Upload Icon
const GeoUpload = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      {/* 3D Box Base */}
      <path d="M4 17L12 21L20 17V11L12 7L4 11V17Z" fillOpacity="0.4" />
      <path d="M12 7L20 11L12 15L4 11L12 7Z" fillOpacity="1" />
      <path d="M12 15V21" stroke="white" strokeWidth="0.5" />
      {/* Upload Arrow */}
      <path d="M12 4L8 8H10V12H14V8H16L12 4Z" fillOpacity="1" />
   </svg>
);

// 3D AI Algorithm Icon - Professional reconciliation/matching
const GeoAI = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      {/* Neural network nodes */}
      <circle cx="6" cy="6" r="2.5" fillOpacity="0.8" />
      <circle cx="18" cy="6" r="2.5" fillOpacity="0.8" />
      <circle cx="6" cy="18" r="2.5" fillOpacity="0.8" />
      <circle cx="18" cy="18" r="2.5" fillOpacity="0.8" />
      {/* Central processing node - larger */}
      <circle cx="12" cy="12" r="4" fillOpacity="1" />
      <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.3" />
      {/* Connection lines */}
      <path d="M8 7.5L10 10" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M16 7.5L14 10" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M8 16.5L10 14" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <path d="M16 16.5L14 14" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      {/* Horizontal connections */}
      <path d="M8.5 6H15.5" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      <path d="M8.5 18H15.5" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      <path d="M6 8.5V15.5" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      <path d="M18 8.5V15.5" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
   </svg>
);

// Professional Matched/Linked Icon
const GeoMatched = ({ className, color = "#10B981", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill="none" width={size} height={size}>
      {/* Two linked chains/circles */}
      <circle cx="8" cy="12" r="5" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <circle cx="16" cy="12" r="5" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      {/* Overlap link */}
      <path d="M11 12H13" stroke={color} strokeWidth="2.5" />
      {/* Check mark */}
      <path d="M10 11.5L11.5 13L14 10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
   </svg>
);

// Professional Unmatched/Broken Link Icon
const GeoUnmatched = ({ className, color = "#EF4444", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill="none" width={size} height={size}>
      {/* Two separated circles */}
      <circle cx="7" cy="12" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <circle cx="17" cy="12" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      {/* Broken link indicator */}
      <path d="M11.5 10L12.5 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Question mark in gap */}
      <path d="M12 8.5V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
   </svg>
);

const GeoDownload = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" fill="none" />
      <polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="2" fill="none" />
      <line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" />
      <rect x="10" y="3" width="4" height="2" fillOpacity="0.4" />
   </svg>
);

const GeoCheck = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
      <path d="M9 11l3 3L22 4" stroke={color} strokeWidth="3" fill="none" />
   </svg>
);

const GeoAlert = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fillOpacity="0.2" stroke={color} strokeWidth="2" />
      <path d="M12 9v4" stroke={color} strokeWidth="2" />
      <path d="M12 17h.01" stroke={color} strokeWidth="3" />
   </svg>
);

const GeoCoin = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
   <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
      <ellipse cx="12" cy="6" rx="10" ry="4" fillOpacity="0.8" />
      <path d="M2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6" fillOpacity="0.4" />
      <path d="M12 22V6" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
   </svg>
);

// MOCK DATA & TYPES (Preserved)
const VENDOR_REMITTANCES = [
   {
      id: 'REM-OCT-24-001', date: '2025-10-24', ref: 'WIRE-88291', amount: 42500.00, currency: 'USD', status: 'PAID',
      invoices: [{ number: '9982770', date: '2025-09-15', amount: 22000.00 }, { number: '9982769', date: '2025-09-18', amount: 20500.00 }]
   },
   {
      id: 'REM-NOV-10-002', date: '2025-11-10', ref: 'ACH-11299', amount: 12800.00, currency: 'USD', status: 'PAID',
      invoices: [{ number: '9982772', date: '2025-10-01', amount: 12800.00 }]
   },
   {
      id: 'REM-NOV-24-PEND', date: '2025-11-28', ref: '--', amount: 2925.00, currency: 'USD', status: 'SCHEDULED',
      invoices: [{ number: '9982771-A', date: '2025-11-15', amount: 2925.00 }]
   }
];

const CASH_FLOW_DATA = [
   { day: 'Mon', inflow: 400000, outflow: 240000, net: 160000 },
   { day: 'Tue', inflow: 300000, outflow: 1398000, net: -1098000 },
   { day: 'Wed', inflow: 200000, outflow: 980000, net: -780000 },
   { day: 'Thu', inflow: 278000, outflow: 390800, net: -112800 },
   { day: 'Fri', inflow: 189000, outflow: 480000, net: -291000 },
   { day: 'Sat', inflow: 239000, outflow: 380000, net: -141000 },
   { day: 'Sun', inflow: 349000, outflow: 430000, net: -81000 },
];

const CURRENCY_DISTRIBUTION = [
   { name: 'USD', value: 65, color: '#004D40' },
   { name: 'EUR', value: 20, color: '#0F62FE' },
   { name: 'CNY', value: 10, color: '#F59E0B' },
   { name: 'Other', value: 5, color: '#6B7280' },
];

const RECONCILIATION_DATA = [
   { id: 1, date: '2025-11-24', desc: 'Outbound Payment: Maersk Line', amount: -2775.00, status: 'MATCHED', bankRef: 'TRX-99281' },
   { id: 2, date: '2025-11-24', desc: 'Outbound Payment: K Line', amount: -450.00, status: 'MATCHED', bankRef: 'TRX-99282' },
   { id: 3, date: '2025-11-25', desc: 'Bank Fee: Int Transfer', amount: -25.00, status: 'UNMATCHED', bankRef: 'FEE-001' },
];

const FUNDING_DATA = [
   { unit: 'Power Grids', amount: 1250000, color: '#004D40' },
   { unit: 'Transformers', amount: 850000, color: '#0F62FE' },
   { unit: 'High Voltage', amount: 450000, color: '#F59E0B' },
   { unit: 'Grid Auto', amount: 320000, color: '#10B981' },
];

const SLA_DATA = [
   { metric: 'On-Time Payment', value: 98.5, target: 98.0, status: 'PASS' },
   { metric: 'Funding to Pay (48h)', value: 100, target: 100, status: 'PASS' },
   { metric: 'Dispute Resolution', value: 92.0, target: 95.0, status: 'WARN' },
];

interface SettlementFinanceProps {
   userRole?: UserRole;
   onNavigate?: (page: string) => void;
}

export const SettlementFinance: React.FC<SettlementFinanceProps> = ({ userRole = '3SC', onNavigate }) => {
   const isVendor = userRole === 'VENDOR';

   // SHARED STATE
   const [activeTab, setActiveTab] = useState<'factory' | 'cashflow' | 'reconciliation' | 'funding'>('factory');
   const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

   // VENDOR STATE
   const [expandedRemittance, setExpandedRemittance] = useState<string | null>(null);

   // INTERNAL STATE
   const [batches, setBatches] = useState<PaymentBatch[]>([]); // Initially empty, fetched from API
   const [reconData, setReconData] = useState(RECONCILIATION_DATA);
   const [selectedBatch, setSelectedBatch] = useState<PaymentBatch | null>(null);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [showApprovalModal, setShowApprovalModal] = useState(false);
   const [showNewRunModal, setShowNewRunModal] = useState(false);
   const [showFilterPanel, setShowFilterPanel] = useState(false);
   const [isSyncing, setIsSyncing] = useState(false);
   const [isLoadingBatches, setIsLoadingBatches] = useState(false);
   const [bankImportFile, setBankImportFile] = useState<File | null>(null);
   const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
   const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);

   // Fetch Pending Invoices for Payment (Level 2)
   useEffect(() => {
      if (!isVendor) {
         fetch('http://localhost:8000/api/invoices/pending?approver_role=ENTERPRISE_ADMIN')
            .then(res => res.json())
            .then(data => {
               if (data.success && data.invoices) {
                  setPendingPaymentCount(data.invoices.length);
                  const total = data.invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount) || 0), 0);
                  setPendingPaymentAmount(total);
               }
            })
            .catch(err => console.error("Failed to fetch pending payments", err));
      }
   }, [isVendor]);

   // Filtering States
   const [searchQuery, setSearchQuery] = useState('');
   const [filterEntity, setFilterEntity] = useState('All Entities');
   const [filterCurrency, setFilterCurrency] = useState('All');

   // Load payment batches from backend
   useEffect(() => {
      if (!isVendor) {
         loadPaymentBatches();
         loadReconciliationData();
      }
   }, [isVendor]);

   const loadPaymentBatches = async () => {
      setIsLoadingBatches(true);
      try {
         const response = await paymentService.getPaymentBatches();
         if (response.batches && response.batches.length > 0) {
            // Map backend data to frontend format
            const mappedBatches = response.batches.map((b: any) => ({
               id: b.batch_number || b.id,
               runDate: b.scheduled_date || b.created_at?.split('T')[0],
               entity: 'Hitachi Energy',
               bankAccount: b.bank_account || 'HDFC-001',
               amount: b.total_amount,
               currency: b.currency || 'INR',
               invoiceCount: b.invoice_count,
               status: b.status === 'PAID' ? 'SENT_TO_BANK' : b.status === 'PENDING_APPROVAL' ? 'AWAITING_APPROVAL' : 'DRAFT'
            })) as any;
            setBatches(mappedBatches);
         }
      } catch (error) {
         console.error('Failed to load payment batches:', error);
      }
      setIsLoadingBatches(false);
   };

   const loadReconciliationData = async () => {
      try {
         const response = await paymentService.getUnmatchedTransactions();
         if (response.transactions && response.transactions.length > 0) {
            const mappedRecon = response.transactions.map((t: any) => ({
               id: t.id,
               date: t.transaction_date,
               desc: t.description,
               amount: t.type === 'DEBIT' ? -t.amount : t.amount,
               status: t.status,
               bankRef: t.bank_reference
            }));
            setReconData([...RECONCILIATION_DATA, ...mappedRecon]);
         }
      } catch (error) {
         console.error('Failed to load reconciliation data:', error);
      }
   };

   const handleBankImport = async () => {
      if (!bankImportFile) {
         triggerToast('Please select a CSV file to import', 'error');
         return;
      }
      try {
         const text = await bankImportFile.text();
         const transactions = paymentService.parseBankStatementCSV(text);

         // Send to backend for database storage
         const result = await paymentService.importBankStatement(transactions);

         if (result.success) {
            triggerToast(`✅ Imported ${result.importedCount} transactions to database!`);
            // Reload data from backend
            loadReconciliationData();
            setBankImportFile(null);
         } else {
            triggerToast(result.error || 'Import failed - check backend', 'error');
         }
      } catch (error) {
         console.error('Import error:', error);
         triggerToast('Failed to import - make sure backend is running', 'error');
      }
   };

   const handleAutoReconcile = async () => {
      const result = await paymentService.autoReconcile();
      if (result.success) {
         triggerToast(`Auto-matched ${result.matchedCount} transactions`);
         loadReconciliationData();
      }
   };

   const [newRunForm, setNewRunForm] = useState({
      entity: 'Hitachi Energy USA',
      paymentMethod: 'ACH',
      runDate: new Date().toISOString().split('T')[0]
   });

   const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
   };

   const handleSync = () => {
      setIsSyncing(true);
      setTimeout(() => {
         setIsSyncing(false);
         triggerToast("Bank Balances Synced with SAP S/4HANA (Last 5 mins).");
      }, 1500);
   };

   const handleApplyDiscount = () => {
      triggerToast("Optimization Applied: ₹125.00 early payment discount secured.");
   };

   const handleReconMatch = (id: number) => {
      setReconData(prev => prev.map(r => r.id === id ? { ...r, status: 'MATCHED' as any } : r));
      triggerToast("Transaction matched manually.");
   };

   const handleExport = () => {
      triggerToast("Generating Report... Download started.");
   };

   const handleDownloadRemittance = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      triggerToast(`Downloading Remittance Advice ${id}...`);
   };

   // --- RENDER VENDOR VIEW ---
   if (isVendor) {
      return (
         <div className="h-full flex flex-col font-sans bg-[#F3F4F6] overflow-hidden relative">
            {/* Vendor Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0 z-10 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <div>
                     <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
                        My Payments
                        <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                           Remittances
                        </span>
                     </h2>
                     <p className="text-sm text-gray-500 mt-1">Track incoming payments and download remittance advice.</p>
                  </div>
                  <button onClick={handleExport} className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-sm text-xs font-bold uppercase hover:bg-gray-50">
                     <GeoDownload size={14} className="mr-2 text-gray-500" /> Export History
                  </button>
               </div>

               {/* Vendor KPIs - Using Geo Icons for subtle consistent feel even in vendor view */}
               <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Paid (YTD)</p>
                     <p className="text-3xl font-bold text-gray-900 mt-2">₹55,300.00</p>
                  </div>
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Payment</p>
                     <p className="text-3xl font-bold text-gray-900 mt-2">₹12,800.00</p>
                     <p className="text-[10px] text-gray-400 mt-1">Received Nov 10</p>
                  </div>
                  <div className="bg-blue-600 p-5 rounded-sm border border-blue-700 shadow-sm text-white">
                     <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Next Scheduled</p>
                     <p className="text-3xl font-bold text-white mt-2">₹2,925.00</p>
                     <p className="text-[10px] text-blue-200 mt-1">Est. Nov 28</p>
                  </div>
               </div>
            </div>

            {/* Vendor Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
               <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-200">
                        <tr>
                           <th className="px-6 py-4">Date</th>
                           <th className="px-6 py-4">Remittance Ref</th>
                           <th className="px-6 py-4 text-right">Amount</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {VENDOR_REMITTANCES.map((remit) => (
                           <React.Fragment key={remit.id}>
                              <tr
                                 className="hover:bg-gray-50 cursor-pointer transition-colors"
                                 onClick={() => setExpandedRemittance(expandedRemittance === remit.id ? null : remit.id)}
                              >
                                 <td className="px-6 py-4 text-gray-900 font-medium">{remit.date}</td>
                                 <td className="px-6 py-4 font-mono text-xs text-blue-600">{remit.ref}</td>
                                 <td className="px-6 py-4 text-right font-bold text-gray-900">₹{remit.amount.toLocaleString()}</td>
                                 <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase
                                          ${remit.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}
                                       `}>
                                       {remit.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button
                                       onClick={(e) => handleDownloadRemittance(remit.ref, e)}
                                       className="text-gray-400 hover:text-blue-600 transition-colors"
                                       title="Download Advice"
                                    >
                                       <GeoDownload size={16} className="text-gray-400 hover:text-blue-600" />
                                    </button>
                                    <button className="ml-4 text-gray-400">
                                       {expandedRemittance === remit.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                 </td>
                              </tr>
                              {/* Expanded Invoice Details */}
                              {expandedRemittance === remit.id && (
                                 <tr className="bg-gray-50">
                                    <td colSpan={5} className="px-6 py-4">
                                       <div className="bg-white border border-gray-200 rounded-sm p-4 shadow-inner">
                                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Paid Invoices</h4>
                                          <table className="w-full text-xs">
                                             <thead className="text-gray-400 border-b border-gray-100">
                                                <tr>
                                                   <th className="text-left pb-2">Invoice #</th>
                                                   <th className="text-left pb-2">Inv Date</th>
                                                   <th className="text-right pb-2">Amount</th>
                                                </tr>
                                             </thead>
                                             <tbody>
                                                {remit.invoices.map((inv, idx) => (
                                                   <tr key={idx} className="border-b border-gray-50 last:border-0">
                                                      <td className="py-2 font-medium text-gray-800">{inv.number}</td>
                                                      <td className="py-2 text-gray-600">{inv.date}</td>
                                                      <td className="py-2 text-right font-mono">₹{inv.amount.toLocaleString()}</td>
                                                   </tr>
                                                ))}
                                             </tbody>
                                          </table>
                                       </div>
                                    </td>
                                 </tr>
                              )}
                           </React.Fragment>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      );
   }

   // --- RENDER INTERNAL VIEW (Hitachi/3SC) ---
   return (
      <div className="h-full flex flex-col font-sans bg-[#F3F4F6] overflow-hidden relative">

         {/* 1. Header & KPI Bar */}
         <div className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0 z-10 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
                     <GeoLandmark size={28} className="mr-3 text-black" />
                     Settlement & Treasury
                     <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-[#004D40] text-white uppercase tracking-wider">
                        Finance
                     </span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Manage payment runs, liquidity forecasting, and bank reconciliation.</p>
               </div>

               <div className="flex space-x-3">
                  <button
                     onClick={handleSync}
                     className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-sm text-xs font-bold uppercase hover:bg-gray-50"
                  >
                     <GeoRefresh size={14} className="mr-2 text-gray-700" />
                     Sync SAP Banks
                  </button>
                  <button
                     onClick={() => setShowNewRunModal(true)}
                     className="flex items-center px-4 py-2 bg-[#004D40] text-white rounded-sm text-xs font-bold uppercase hover:bg-[#00352C] shadow-sm"
                  >
                     <GeoPlus size={14} className="mr-2 text-white" /> New Payment Run
                  </button>
               </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-6">
               <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-5 rounded-sm shadow-md relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Global Cash Position</p>
                     <div className="bg-gray-700/50 p-1.5 rounded-full">
                        <GeoWallet size={18} className="text-teal-400" />
                     </div>
                  </div>
                  <h3 className="text-3xl font-bold relative z-10">₹42.5M</h3>
                  <p className="text-[10px] text-gray-400 mt-1 relative z-10">Across 12 Entities</p>
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-4 translate-x-4">
                     <GeoCube size={120} className="text-white" />
                  </div>
               </div>
               <div
                  onClick={() => onNavigate && onNavigate('approver_queue')}
                  className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm group hover:border-black transition-colors relative cursor-pointer"
               >
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ready for Payment</p>
                     <GeoClock size={18} className="text-orange-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">
                     {pendingPaymentAmount ? `₹${(pendingPaymentAmount / 1000).toFixed(1)}k` : '₹0'}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">
                     {pendingPaymentCount} {pendingPaymentCount === 1 ? 'Invoice' : 'Invoices'} Awaiting Settlement
                  </p>
               </div>
               <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm group hover:border-black transition-colors relative">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discount Capture (YTD)</p>
                     <GeoTrendUp size={18} className="text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-600">₹85.2k</h3>
                  <p className="text-[10px] text-gray-400 mt-1">98% Efficiency</p>
               </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-8 mt-8 -mb-5">
               {[
                  { id: 'factory', label: 'Payment Factory', icon: GeoBuilding },
                  { id: 'cashflow', label: 'Cash Flow Optimizer', icon: GeoPieIcon },
                  { id: 'reconciliation', label: 'Bank Reconciliation', icon: GeoShield },
                  { id: 'funding', label: 'Weekly Funding', icon: GeoLandmark }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === tab.id
                        ? 'border-teal-600 text-teal-800'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                  >
                     <tab.icon size={18} className={`mr-2 ${activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'}`} />
                     {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {/* 2. Main Content Area */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-8">

            {/* VIEW: PAYMENT FACTORY */}
            {activeTab === 'factory' && (
               <div className="animate-fade-in-up">
                  <div className="flex justify-between items-center mb-4">
                     <div className="relative">
                        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                           type="text"
                           placeholder="Search Batch ID..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="pl-9 pr-4 py-2 border border-gray-300 rounded-sm text-xs font-medium w-64 focus:outline-none focus:border-teal-500"
                        />
                     </div>
                     <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className="text-xs font-bold flex items-center text-gray-500 hover:text-teal-600"
                     >
                        <GeoFilter size={14} className="mr-1" /> Advanced Filters
                     </button>
                  </div>

                  {/* Filter Panel (Simplified for brevity but preserved structure) */}
                  {showFilterPanel && (
                     <div className="mb-6 p-4 bg-white border border-gray-200 rounded-sm grid grid-cols-4 gap-4 shadow-sm animate-fade-in-up">
                        <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Entity</label>
                           <select
                              value={filterEntity}
                              onChange={(e) => setFilterEntity(e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-sm p-2 bg-white focus:outline-none focus:border-teal-500"
                           >
                              <option>All Entities</option>
                              <option>Hitachi Energy USA</option>
                              <option>Hitachi Energy Canada</option>
                              <option>Hitachi Energy EU</option>
                           </select>
                        </div>
                        <div className="flex items-end space-x-2">
                           <button onClick={() => setShowFilterPanel(false)} className="w-full bg-teal-600 text-white text-xs font-bold py-2 rounded-sm hover:bg-teal-700 uppercase">Apply</button>
                        </div>
                     </div>
                  )}

                  <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-200">
                           <tr>
                              <th className="px-6 py-4">Batch ID</th>
                              <th className="px-6 py-4">Run Date</th>
                              <th className="px-6 py-4">Entity / Account</th>
                              <th className="px-6 py-4 text-right">Total Amount</th>
                              <th className="px-6 py-4 text-center">Invoices</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {batches.map((batch) => (
                              <tr key={batch.id} className="hover:bg-teal-50/20 transition-colors group cursor-pointer">
                                 <td className="px-6 py-4 font-mono text-xs font-bold text-teal-700 flex items-center">
                                    <GeoCube size={12} className="mr-2 text-teal-200" />
                                    {batch.id}
                                 </td>
                                 <td className="px-6 py-4 text-gray-600">{batch.runDate}</td>
                                 <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{batch.entity}</div>
                                    <div className="text-xs text-gray-400">{batch.bankAccount}</div>
                                 </td>
                                 <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                    {batch.amount.toLocaleString('en-US', { style: 'currency', currency: batch.currency })}
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{batch.invoiceCount}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    {batch.status === 'SENT_TO_BANK' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">PROCESSED</span>}
                                    {batch.status === 'AWAITING_APPROVAL' && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200">APPROVAL REQ</span>}
                                    {batch.status === 'DRAFT' && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">DRAFT</span>}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 group-hover:text-teal-600 transition-colors">
                                       <ChevronRight size={18} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {/* VIEW: CASH FLOW */}
            {activeTab === 'cashflow' && (
               <div className="space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-3 gap-6">
                     <div className="col-span-2 bg-white border border-gray-200 shadow-sm rounded-sm p-6">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 flex items-center">
                           <GeoTrendUp size={16} className="mr-2 text-blue-600" />
                           Liquidity Forecast (7 Days)
                        </h3>
                        <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={CASH_FLOW_DATA}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="day" />
                                 <YAxis />
                                 <Tooltip />
                                 <Legend />
                                 <Bar dataKey="inflow" fill="#10B981" name="Inflow" radius={[4, 4, 0, 0]} />
                                 <Bar dataKey="outflow" fill="#EF4444" name="Outflow" radius={[4, 4, 0, 0]} />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="col-span-1 bg-white border border-gray-200 shadow-sm rounded-sm p-6">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Currency Exposure</h3>
                        <div className="h-48">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={CURRENCY_DISTRIBUTION}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {CURRENCY_DISTRIBUTION.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                 </Pie>
                                 <Tooltip />
                                 <Legend verticalAlign="bottom" height={36} />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>

                  {/* Discount Optimization */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 flex justify-between items-center bg-gradient-to-r from-teal-50 to-white">
                     <div>
                        <h3 className="text-lg font-bold text-teal-800 flex items-center">
                           <GeoCoin size={24} className="mr-2 text-teal-800" /> Dynamic Discounting
                        </h3>
                        <p className="text-sm text-teal-600 mt-1">1 Batch eligible for early payment (2% / 10 Net 30)</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase">Potential Savings</p>
                        <p className="text-2xl font-bold text-gray-900">₹125.00</p>
                     </div>
                     <button
                        onClick={handleApplyDiscount}
                        className="px-6 py-2 bg-teal-600 text-white font-bold text-sm rounded-sm hover:bg-teal-700 shadow-sm transition-transform active:translate-y-0.5"
                     >
                        Apply & Save
                     </button>
                  </div>
               </div>
            )}

            {/* VIEW: RECONCILIATION */}
            {activeTab === 'reconciliation' && (
               <div className="animate-fade-in-up space-y-4">
                  {/* Bank Import Section - Premium Design */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                     <div className="bg-blue-600 px-6 py-4">
                        <h3 className="text-white font-bold text-lg flex items-center">
                           <GeoUpload size={20} className="mr-3" color="white" />
                           Bank Statement Import
                        </h3>
                        <p className="text-blue-100 text-sm mt-1">Upload your bank statement CSV to reconcile payments</p>
                     </div>

                     <div className="p-6">
                        {/* Step-by-step instructions */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                           <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                              <div>
                                 <p className="font-bold text-gray-800 text-sm">Select File</p>
                                 <p className="text-xs text-gray-500">Choose a CSV file from your computer</p>
                              </div>
                           </div>
                           <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                              <div>
                                 <p className="font-bold text-gray-800 text-sm">Import</p>
                                 <p className="text-xs text-gray-500">Click Import to load transactions</p>
                              </div>
                           </div>
                           <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                              <div>
                                 <p className="font-bold text-gray-800 text-sm">Reconcile</p>
                                 <p className="text-xs text-gray-500">Auto-match with payment batches</p>
                              </div>
                           </div>
                        </div>

                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                           <input
                              type="file"
                              id="bankFileInput"
                              accept=".csv"
                              onChange={(e) => setBankImportFile(e.target.files?.[0] || null)}
                              className="hidden"
                           />
                           <label htmlFor="bankFileInput" className="cursor-pointer">
                              <GeoUpload size={40} className="mx-auto mb-3" color="#9CA3AF" />
                              <p className="text-gray-700 font-bold mb-1">
                                 {bankImportFile ? bankImportFile.name : 'Click to select CSV file'}
                              </p>
                              <p className="text-xs text-gray-500">
                                 {bankImportFile
                                    ? `Selected: ${(bankImportFile.size / 1024).toFixed(1)} KB`
                                    : 'Format: Date, Reference, Description, Amount'}
                              </p>
                           </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-6">
                           <button
                              onClick={handleBankImport}
                              disabled={!bankImportFile}
                              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${bankImportFile
                                 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                 : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                 }`}
                           >
                              <GeoUpload size={16} color={bankImportFile ? 'white' : '#9CA3AF'} />
                              {bankImportFile ? 'Import File' : 'Select a file first'}
                           </button>
                           <button
                              onClick={handleAutoReconcile}
                              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 shadow-md transition-all flex items-center justify-center gap-2"
                           >
                              <GeoAI size={18} color="white" />
                              Auto-Reconcile All
                           </button>
                        </div>


                     </div>
                  </div>

                  <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Bank Statement vs Ledger</h3>
                        <span className="text-xs font-bold text-gray-500">Unmatched: <span className="text-red-600">{reconData.filter(r => r.status === 'UNMATCHED').length} Items</span></span>
                     </div>
                     <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-gray-200 text-xs text-gray-500 uppercase font-bold">
                           <tr>
                              <th className="px-6 py-3">Date</th>
                              <th className="px-6 py-3">Bank Reference</th>
                              <th className="px-6 py-3">Description</th>
                              <th className="px-6 py-3 text-right">Amount</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3 text-right">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {reconData.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                 <td className="px-6 py-4 text-gray-600">{item.date}</td>
                                 <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.bankRef}</td>
                                 <td className="px-6 py-4 font-medium text-gray-800">{item.desc}</td>
                                 <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{item.amount.toFixed(2)}</td>
                                 <td className="px-6 py-4">
                                    {item.status === 'MATCHED' ? (
                                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                                          <GeoMatched size={14} />
                                          <span className="text-xs font-bold text-green-700">Matched</span>
                                       </span>
                                    ) : (
                                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                                          <GeoUnmatched size={14} />
                                          <span className="text-xs font-bold text-red-600">Unmatched</span>
                                       </span>
                                    )}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    {item.status === 'UNMATCHED' && (
                                       <button
                                          onClick={() => handleReconMatch(item.id)}
                                          className="text-xs font-bold text-blue-600 hover:underline"
                                       >
                                          Manual Match
                                       </button>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {/* VIEW: WEEKLY FUNDING */}
            {activeTab === 'funding' && (
               <div className="space-y-6 animate-fade-in-up">
                  {/* Funding Header */}
                  <div className="flex justify-between items-center bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                     <div>
                        <h3 className="text-lg font-bold text-gray-900">Weekly Funding Request</h3>
                        <p className="text-sm text-gray-500">Generate funding requests for approved freight bills.</p>
                     </div>
                     <button onClick={() => triggerToast("Funding Request #FR-2025-48 generated and sent to Treasury.")} className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-sm hover:bg-blue-700 shadow-sm">
                        Generate Request
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     {/* Funding by Business Unit */}
                     <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Funding by Business Unit</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={FUNDING_DATA} layout="vertical">
                                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                 <XAxis type="number" hide />
                                 <YAxis dataKey="unit" type="category" width={100} tick={{ fontSize: 10 }} />
                                 <Tooltip formatter={(value) => `₹${(value as number)?.toLocaleString() || 0}`} />
                                 <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                    {FUNDING_DATA.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                 </Bar>
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Payment SLA Tracker */}
                     <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Payment SLA Compliance</h3>
                        <div className="space-y-4">
                           {SLA_DATA.map((sla, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm border border-gray-100">
                                 <div>
                                    <p className="text-sm font-bold text-gray-900">{sla.metric}</p>
                                    <p className="text-xs text-gray-500">Target: {sla.target}%</p>
                                 </div>
                                 <div className="text-right">
                                    <p className={`text-xl font-bold ${sla.status === 'PASS' ? 'text-green-600' : 'text-orange-500'}`}>
                                       {sla.value}%
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${sla.status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                       {sla.status}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Toast */}
         {toast && (
            <div className="absolute bottom-6 right-6 px-4 py-3 bg-gray-900 text-white rounded-sm shadow-xl flex items-center z-50 animate-slide-in-up">
               <GeoSphere size={16} className="text-[#00C805] mr-2" />
               <div className="text-xs font-bold">{toast.msg}</div>
            </div>
         )}
      </div>
   );
};