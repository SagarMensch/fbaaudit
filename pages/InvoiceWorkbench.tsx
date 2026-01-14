import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { MoreHorizontal, FileText, Filter, Download, ShieldAlert, Ghost, AlertTriangle, Search, X, RotateCcw, Check, Eye, Flag, Calculator, Briefcase, Inbox, FileCheck, Maximize2, Minimize2 } from 'lucide-react';
import { generateCSVReport, generatePDFReport, formatInvoiceDataForReport, INVOICE_REPORT_COLUMNS } from '../utils/reportGenerator';
import { exportToCSV } from '../utils/exportUtils';
import { MOCK_UNBILLED_SHIPMENTS, generateSelfBillingAdvice } from '../services/selfBillingService';
import DocumentChecklist from '../components/DocumentChecklist';
import { Geo3DCube, Geo3DPyramid, Geo3DCylinder, Geo3DSphere, Geo3DHexagon, Geo3DBar } from '../components/GeoIcons';
import { IndianSupplierService } from '../services/supplierService';

// Premium Geometric Icons
// Premium 3D Geometric Icons
const GeoInvoice = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <rect x="6" y="4" width="12" height="16" rx="2" fillOpacity="0.4" />
    <path d="M10 4V20" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
    <rect x="8" y="8" width="8" height="2" rx="1" fill="white" fillOpacity="0.6" />
    <rect x="8" y="12" width="8" height="2" rx="1" fill="white" fillOpacity="0.6" />
    <rect x="8" y="16" width="5" height="2" rx="1" fill="white" fillOpacity="0.6" />
  </svg>
);

const GeoValue = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <circle cx="12" cy="12" r="9" fillOpacity="0.2" />
    <path d="M12 6v12M8 10h8M8 14h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 6a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4" fillOpacity="0.6" />
  </svg>
);

const GeoPending = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
    <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill="white" />
  </svg>
);

const GeoApproved = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="4" fillOpacity="0.2" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="7" r="1.5" fill="white" fillOpacity="0.8" />
  </svg>
);

const GeoException = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M12 4L4 20h16L12 4z" fillOpacity="0.2" />
    <path d="M12 4L4 20h16L12 4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    <path d="M12 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 16v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GeoRejected = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
    <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface InvoiceWorkbenchProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  currentUser?: { name: string; role: string }; // Current logged-in user
  onUpdateInvoices?: (invoice: Invoice) => void;
  onAddInvoice?: (invoice: Invoice) => void;
}

export const InvoiceWorkbench: React.FC<InvoiceWorkbenchProps> = ({ invoices, onSelectInvoice, currentUser, onUpdateInvoices, onAddInvoice }) => {
  // Role-Based View Filter
  const [viewFilter, setViewFilter] = useState<'PENDING_ON_ME' | 'APPROVED_BY_ME' | 'ALL'>('PENDING_ON_ME');

  // Quick Status Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXCEPTION' | 'APPROVED'>('ALL');

  // Advanced Filters
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('All');

  // Interaction
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [documentPopupInvoice, setDocumentPopupInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Fullscreen Mode for Invoice Grid
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract Unique Carriers for Dropdown
  const uniqueCarriers = ['All', ...Array.from(new Set(invoices.map(inv => inv.carrier))).sort()];

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    triggerToast("Exporting filtered grid to CSV... Download started.");

    // Create export data from filtered view
    const exportData = filteredInvoices.map(inv => ({
      "Invoice Number": inv.invoiceNumber,
      "Vendor": inv.carrier,
      "Date": inv.date,
      "Amount": inv.amount,
      "Status": inv.status,
      "GL Code": inv.glSegments?.[0]?.code || 'N/A',
      "Origin": inv.origin,
      "Destination": inv.destination
    }));

    exportToCSV(exportData, 'Freight_Audit_Invoices');
  };

  const handleSinglePDFDownload = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    setActiveActionMenu(null);
    triggerToast(`Downloading PDF for Invoice #${invoice.invoiceNumber}...`);
    const data = formatInvoiceDataForReport([invoice]);
    generatePDFReport(`Invoice_${invoice.invoiceNumber}`, data, INVOICE_REPORT_COLUMNS);
  };

  const handleQuickApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveActionMenu(null);

    if (onUpdateInvoices && currentUser) {
      const invoice = invoices.find(i => i.id === id);
      if (invoice) {
        let newStatus = invoice.status;
        let newHistory = [...(invoice.workflowHistory || [])];
        let notificationToSend = null;

        // Workflow Logic
        if (currentUser.name === 'Kaai Bansal') {
          // Step 1: Logistics -> Finance
          triggerToast(`Logistics Approval Complete. Moved to Finance.`);
          newStatus = InvoiceStatus.OPS_APPROVED;

          // Updates
          const step1Index = newHistory.findIndex(w => w.stepId === 'step-1');
          if (step1Index !== -1) {
            newHistory[step1Index] = { ...newHistory[step1Index], status: 'APPROVED', timestamp: new Date().toISOString(), approverName: 'Kaai Bansal' };
          }
          // Add Step 2
          newHistory.push({ stepId: 'step-2', status: 'PENDING', approverRole: 'Finance Head', timestamp: '' });

        } else if (currentUser.name === 'Zeya Kapoor') {
          // Step 2: Finance -> Admin
          triggerToast(`Finance Approval Complete. Moved to Admin.`);
          newStatus = InvoiceStatus.FINANCE_APPROVED;

          const step2Index = newHistory.findIndex(w => w.stepId === 'step-2');
          if (step2Index !== -1) {
            newHistory[step2Index] = { ...newHistory[step2Index], status: 'APPROVED', timestamp: new Date().toISOString(), approverName: 'Zeya Kapoor' };
          }
          // Add Step 3
          newHistory.push({ stepId: 'step-3', status: 'PENDING', approverRole: 'System Admin', timestamp: '' });

        } else if (currentUser.name === 'System Admin' || currentUser.name === 'Atlas') {
          // Step 3: Admin -> Final
          triggerToast(`Final Approval Complete. Payment Scheduled.`);
          newStatus = InvoiceStatus.APPROVED;

          const step3Index = newHistory.findIndex(w => w.stepId === 'step-3');
          if (step3Index !== -1) {
            newHistory[step3Index] = { ...newHistory[step3Index], status: 'APPROVED', timestamp: new Date().toISOString(), approverName: 'System Admin' };
          }

          notificationToSend = {
            subject: 'Invoice Approved',
            message: `Invoice #${invoice.invoiceNumber} has been approved and scheduled for payment.`,
            priority: 'high'
          };
        } else {
          // Fallback for unknown users
          triggerToast(`Invoice #${id} quick-approved.`);
          newStatus = InvoiceStatus.APPROVED;
        }

        // 1. Update State
        onUpdateInvoices({ ...invoice, status: newStatus, workflowHistory: newHistory });

        // 2. Send Role-Based Notifications
        const sendNotification = (recipientId: string, subject: string, message: string) => {
          fetch('http://localhost:5000/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId,
              type: 'invoice',
              subject,
              message,
              priority: 'high',
              invoiceId: invoice.id
            })
          }).catch(err => console.error("Failed to send notification:", err));
        };

        // Dispatch notifications based on who approved
        if (currentUser.name === 'Kaai Bansal') {
          // Notify Zeya (Finance)
          sendNotification('zeya.kapoor',
            `Invoice Ready for Finance Review`,
            `Invoice #${invoice.invoiceNumber} from ${invoice.carrier} (₹${invoice.amount.toLocaleString()}) has passed Logistics review.`
          );
        } else if (currentUser.name === 'Zeya Kapoor') {
          // Notify System Admin
          sendNotification('system.admin',
            `Invoice Ready for Final Approval`,
            `Invoice #${invoice.invoiceNumber} from ${invoice.carrier} (₹${invoice.amount.toLocaleString()}) has passed Finance review.`
          );
        } else if (currentUser.name === 'System Admin' || currentUser.name === 'Atlas') {
          // Notify Supplier and Enterprise Director
          const supplierId = invoice.carrier.toLowerCase().replace(/\s+/g, '.');
          sendNotification(supplierId,
            `Invoice Approved - Payment Scheduled`,
            `Your invoice #${invoice.invoiceNumber} for ₹${invoice.amount.toLocaleString()} has been approved and scheduled for payment.`
          );
          sendNotification('enterprise.director',
            `Invoice Final Approval Complete`,
            `Invoice #${invoice.invoiceNumber} from ${invoice.carrier} (₹${invoice.amount.toLocaleString()}) has been fully approved.`
          );
        }
      }
    }
  };

  const handleFlagReview = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveActionMenu(null);
    triggerToast(`Invoice #${id} flagged for senior audit review.`);
    if (onUpdateInvoices) {
      const invoice = invoices.find(i => i.id === id);
      if (invoice) {
        onUpdateInvoices({ ...invoice, status: InvoiceStatus.EXCEPTION, reason: 'Flagged for Review' });

        // Trigger Supplier Notification
        const supplier = IndianSupplierService.getAllSuppliers().find(s => s.name === invoice.carrier || s.name.includes(invoice.carrier) || invoice.carrier.includes(s.name));
        if (supplier) {
          // 1. Local UI Update
          IndianSupplierService.sendNotification(
            supplier.id,
            'organization',
            'invoice',
            'Action Required: Invoice Flagged',
            `Invoice #${invoice.invoiceNumber} has been flagged for review. Please check the remarks.`,
            'high'
          );

          // 2. MySQL Backend Persistence
          fetch('http://localhost:5000/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplierId: supplier.id,
              type: 'invoice',
              subject: 'Action Required: Invoice Flagged',
              message: `Invoice #${invoice.invoiceNumber} has been flagged for review. Please check the remarks.`,
              priority: 'high'
            })
          }).catch(err => console.error("Failed to sync notification to DB:", err));
        }
      }
    }
  };

  const handleReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveActionMenu(null);
    triggerToast(`Invoice #${id} rejected.`);
    if (onUpdateInvoices) {
      const invoice = invoices.find(i => i.id === id);
      if (invoice) {
        // Update History to reflect rejection
        let newHistory = [...(invoice.workflowHistory || [])];
        const pendingIndex = newHistory.findIndex(w => w.status === 'PENDING');
        if (pendingIndex !== -1) {
          newHistory[pendingIndex] = {
            ...newHistory[pendingIndex],
            status: 'REJECTED',
            timestamp: new Date().toISOString(),
            comment: 'Rejected by Auditor'
          };
        }

        onUpdateInvoices({ ...invoice, status: InvoiceStatus.REJECTED, reason: 'Rejected by Auditor', workflowHistory: newHistory });

        // Trigger Supplier Notification
        const supplier = IndianSupplierService.getAllSuppliers().find(s => s.name === invoice.carrier || s.name.includes(invoice.carrier) || invoice.carrier.includes(s.name));
        if (supplier) {
          // 1. Local UI Update
          IndianSupplierService.sendNotification(
            supplier.id,
            'organization',
            'invoice',
            'URGENT: Invoice Rejected',
            `Invoice #${invoice.invoiceNumber} has been rejected. Reason: Rejected by Auditor. Please review and resubmit.`,
            'urgent'
          );

          // 2. MySQL Backend Persistance
          fetch('http://localhost:5000/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplierId: supplier.id,
              type: 'invoice',
              subject: 'URGENT: Invoice Rejected',
              message: `Invoice #${invoice.invoiceNumber} has been rejected. Reason: Rejected by Auditor. Please review and resubmit.`,
              priority: 'urgent'
            })
          }).catch(err => console.error("Failed to sync notification to DB:", err));
        }
      }
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.APPROVED:
        return <span className="px-2 py-1 rounded-sm text-xs font-bold bg-teal-100 text-teal-700 uppercase tracking-wide border border-teal-200">APPROVED</span>;
      case InvoiceStatus.EXCEPTION:
        return <span className="px-2 py-1 rounded-sm text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide border border-red-200">EXCEPTION</span>;
      case InvoiceStatus.PENDING:
        return <span className="px-2 py-1 rounded-sm text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-wide border border-orange-200">PENDING</span>;
      default:
        return <span className="px-2 py-1 rounded-sm text-xs font-bold bg-gray-100 text-gray-700 uppercase tracking-wide border border-gray-200">{status}</span>;

    }
  };

  // --- ERS STATE ---
  const [viewMode, setViewMode] = useState<'INVOICES' | 'ERS'>('INVOICES');
  const [unbilledShipments, setUnbilledShipments] = useState(MOCK_UNBILLED_SHIPMENTS);

  const handleGenerateERS = (shipment: any) => {
    if (onAddInvoice) {
      const newInvoice = generateSelfBillingAdvice(shipment);
      onAddInvoice(newInvoice);
      setUnbilledShipments(prev => prev.filter(s => s.shipmentId !== shipment.shipmentId));
      triggerToast(`Payment Advice generated for ${shipment.shipmentId} (Inv: ${newInvoice.invoiceNumber})`);
      setViewMode('INVOICES');
      if (onSelectInvoice) onSelectInvoice(newInvoice);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredInvoices = invoices.filter(inv => {
    // 0. Role-Based Filter (NEW)
    if (currentUser && viewFilter !== 'ALL') {
      // Find the current pending workflow stage
      const currentStage = inv.workflowHistory?.find(w => w.status === 'PENDING' || w.status === 'ACTIVE');

      if (viewFilter === 'PENDING_ON_ME') {
        // Show only invoices pending current user's approval
        const isAssignedToMe = inv.assignedTo === currentUser.name;
        const isPendingMyApproval = currentStage && (
          (currentStage.stepId === 'step-1' && currentUser.name === 'Kaai Bansal') ||
          (currentStage.stepId === 'step-2' && currentUser.name === 'Zeya Kapoor') ||
          (currentStage.stepId === 'step-3' && (currentUser.name === 'System Admin' || currentUser.name === 'Atlas'))
        );

        if (!isAssignedToMe && !isPendingMyApproval) {
          return false;
        }
      } else if (viewFilter === 'APPROVED_BY_ME') {
        // Show only invoices approved by current user
        const approvedByMe = inv.workflowHistory?.some(w =>
          w.status === 'APPROVED' && w.approverName === currentUser.name
        );
        if (!approvedByMe) return false;
      }
    }

    // 1. Status Filter (Quick Toggle)
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;

    // 2. Search Query (Invoice #, Reason, Lane)
    const q = searchQuery.toLowerCase();
    if (q) {
      const match = inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.reason?.toLowerCase().includes(q) ||
        inv.origin.toLowerCase().includes(q) ||
        inv.destination.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 3. Carrier Filter
    if (carrierFilter !== 'All' && inv.carrier !== carrierFilter) return false;

    return true;
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setCarrierFilter('All');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = searchQuery !== '' || carrierFilter !== 'All' || statusFilter !== 'ALL';

  // --- GRID SUMMARY CALCULATIONS ---
  const totalListValue = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // --- TOP KPI CALCULATIONS ---
  // Using hardcoded values to create a more realistic dashboard view beyond the 5 mock invoices
  const totalPendingCount = invoices.filter(i => i.status === 'PENDING').length + 24;
  const totalApprovedCount = invoices.filter(i => i.status === 'APPROVED').length + 142;
  const totalExceptionCount = invoices.filter(i => i.status === 'EXCEPTION').length + 11;
  const totalRejectedCount = invoices.filter(i => i.status === 'REJECTED').length + 5;
  const totalInvoiceCount = totalPendingCount + totalApprovedCount + totalExceptionCount + totalRejectedCount;

  // Calculate Total Value of ALL invoices, adding a base for realism
  const totalAllInvoicesValue = invoices.reduce((sum, inv) => sum + inv.amount, 0) + 2545900.00;

  return (
    <div className="h-full flex flex-col p-8 font-sans overflow-hidden bg-[#F3F4F6] relative" onClick={() => setActiveActionMenu(null)}>

      {/* HEADER / TOGGLE */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            Invoice Workbench
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage, audit, and approve freight invoices.</p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('INVOICES')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'INVOICES' ? 'bg-slate-100 text-slate-800 shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Invoices
          </button>
          <button
            onClick={() => setViewMode('ERS')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${viewMode === 'ERS' ? 'bg-indigo-50 text-indigo-700 shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Self-Billing (ERS)
            {unbilledShipments.length > 0 && <span className="ml-2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unbilledShipments.length}</span>}
          </button>
        </div>
      </div>

      {viewMode === 'ERS' ? (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-gray-200 bg-indigo-50 flex justify-between items-center">
            <div>
              <h3 className="text-indigo-900 font-bold flex items-center">Ready for Self-Billing</h3>
              <p className="text-xs text-indigo-600 mt-1">Shipments delivered but not yet invoiced. Generate payment advice automatically.</p>
            </div>
          </div>
          {unbilledShipments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Check size={48} className="mx-auto text-green-200 mb-4" />
              <p>All shipments have been billed.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Shipment ID</th>
                  <th className="p-4">Carrier</th>
                  <th className="p-4">Origin / Destination</th>
                  <th className="p-4">Activity Date</th>
                  <th className="p-4">Rate Card</th>
                  <th className="p-4 text-right">Est. Amount</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unbilledShipments.map(shipment => (
                  <tr key={shipment.shipmentId} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-4 font-mono font-bold text-indigo-600">{shipment.shipmentId}</td>
                    <td className="p-4 font-bold text-gray-800">{shipment.carrier}</td>
                    <td className="p-4">
                      <div className="flex items-center text-xs">
                        <span>{shipment.origin}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span>{shipment.destination}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{shipment.activityDate}</td>
                    <td className="p-4 font-mono text-xs bg-gray-50 rounded text-gray-600 px-2 py-1 w-fit">{shipment.rateCardId}</td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      ₹{(shipment.contractedRate * 1.05).toFixed(2)}
                      <span className="block text-[10px] text-gray-400 font-normal">incl. 5% fuel</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleGenerateERS(shipment)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1.5 text-xs font-bold shadow-sm transition-all flex items-center mx-auto"
                      >
                        Generate Advice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <>
          {/* 1. Top Audit KPIs - DARK BLOOMBERG 3D STYLE */}
          <div className="grid grid-cols-6 gap-6 mb-8 flex-shrink-0">
            {/* Total Invoices */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-[#0F62FE] transition-colors relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">TOTAL INVOICES</span>
                  <div className="text-2xl font-mono font-bold text-white tracking-tighter">{totalInvoiceCount.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-[#0F62FE]/10 transition-colors">
                  <Geo3DCube size={32} color="#0F62FE" className="drop-shadow-[0_4px_6px_rgba(15,98,254,0.3)]" />
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-mono text-gray-500">Volume</span>
                <span className="text-[9px] font-mono text-emerald-500 font-bold">▲ UP</span>
              </div>
            </div>

            {/* Total Value */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-blue-400 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">TOTAL VALUE</span>
                  <div className="text-xl font-mono font-bold text-white tracking-tighter truncate" title={`₹${totalAllInvoicesValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                    ₹{(totalAllInvoicesValue / 100000).toFixed(2)}L
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-blue-400/10 transition-colors">
                  <Geo3DPyramid size={32} color="#60A5FA" className="drop-shadow-[0_4px_6px_rgba(96,165,250,0.3)]" />
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-mono text-gray-500">Aggregate</span>
                <span className="text-[9px] font-mono text-emerald-500 font-bold">▲ +12%</span>
              </div>
            </div>

            {/* Pending Audit */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-orange-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">PENDING AUDIT</span>
                  <div className="text-2xl font-mono font-bold text-white tracking-tighter">{totalPendingCount}</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-orange-500/10 transition-colors">
                  <Geo3DSphere size={32} color="#F97316" className="drop-shadow-[0_4px_6px_rgba(249,115,22,0.3)]" />
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-mono text-gray-500">Queue</span>
                <span className="text-[9px] font-mono text-orange-500 font-bold">ACTIVE</span>
              </div>
            </div>

            {/* Auto-Approved */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-teal-400 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">AUTO-APPROVED</span>
                  <div className="text-2xl font-mono font-bold text-white tracking-tighter">{totalApprovedCount}</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-teal-400/10 transition-colors">
                  <Geo3DBar size={32} color="#14B8A6" className="drop-shadow-[0_4px_6px_rgba(20,184,166,0.3)]" />
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-mono text-gray-500">Fast Track</span>
                <span className="text-[9px] font-mono text-emerald-500 font-bold">94%</span>
              </div>
            </div>

            {/* Exceptions */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-red-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">EXCEPTIONS</span>
                  <div className="text-2xl font-mono font-bold text-white tracking-tighter">{totalExceptionCount}</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-red-500/10 transition-colors">
                  <Geo3DHexagon size={32} color="#EF4444" className="drop-shadow-[0_4px_6px_rgba(239,68,68,0.3)]" />
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-mono text-gray-500">Flagged</span>
                <span className="text-[9px] font-mono text-red-500 font-bold">▲ HIGH</span>
              </div>
            </div>

            {/* Rejected */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-rose-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">REJECTED</span>
                  <div className="text-2xl font-mono font-bold text-white tracking-tighter">{totalRejectedCount}</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-rose-500/10 transition-colors">
                  <Geo3DCylinder size={32} color="#F43F5E" className="drop-shadow-[0_4px_6px_rgba(244,63,94,0.3)]" />
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-mono text-gray-500">Invalid</span>
                <span className="text-[9px] font-mono text-red-500 font-bold">ACTION</span>
              </div>
            </div>
          </div>

          {/* 2. Role-Based View Tabs (NEW) */}
          {currentUser && (
            <div className="flex space-x-2 mb-4 flex-shrink-0">
              <button
                onClick={() => setViewFilter('PENDING_ON_ME')}
                className={`px-6 py-2.5 text-sm font-bold rounded-sm transition-all flex items-center space-x-2 ${viewFilter === 'PENDING_ON_ME'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Inbox size={16} />
                <span>Pending on Me</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {invoices.filter(inv => {
                    const currentStage = inv.workflowHistory?.find(w => w.status === 'PENDING' || w.status === 'ACTIVE');
                    const isAssignedToMe = inv.assignedTo === currentUser.name;
                    const isPendingMyApproval = currentStage && (
                      (currentStage.stepId === 'step-1' && currentUser.name === 'Kaai Bansal') ||
                      (currentStage.stepId === 'step-2' && currentUser.name === 'Zeya Kapoor') ||
                      (currentStage.stepId === 'step-3' && (currentUser.name === 'System Admin' || currentUser.name === 'Atlas'))
                    );
                    return isAssignedToMe || isPendingMyApproval;
                  }).length}
                </span>
              </button>
              <button
                onClick={() => setViewFilter('APPROVED_BY_ME')}
                className={`px-6 py-2.5 text-sm font-bold rounded-sm transition-all flex items-center space-x-2 ${viewFilter === 'APPROVED_BY_ME'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Check size={16} />
                <span>Approved by Me</span>
              </button>
              <button
                onClick={() => setViewFilter('ALL')}
                className={`px-6 py-2.5 text-sm font-bold rounded-sm transition-all flex items-center space-x-2 ${viewFilter === 'ALL'
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span>All Invoices</span>
              </button>
            </div>
          )}

          {/* 3. Controls & Filter Bar */}
          <div className="flex flex-col mb-4 flex-shrink-0">
            <div className="flex justify-between items-end">
              <div className="flex space-x-1 bg-gray-200 p-1 rounded-sm">
                {['ALL', 'EXCEPTION', 'APPROVED'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f as any)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-all uppercase tracking-wide ${statusFilter === f
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300/50'
                      }`}
                  >
                    {f === 'ALL' ? 'Show: All' : f === 'EXCEPTION' ? 'Exceptions' : 'Approved'}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center space-x-2 px-4 py-2 border rounded-sm text-xs font-bold uppercase tracking-wider shadow-sm transition-colors ${showFilterPanel
                    ? 'bg-teal-50 border-teal-500 text-teal-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Filter size={14} />
                  <span>Filter Grid</span>
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* 3. Collapsible Filter Panel */}
            {showFilterPanel && (
              <div className="mt-4 p-5 bg-white border border-gray-200 shadow-sm rounded-sm animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Advanced Search</h3>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="text-xs text-red-600 font-bold hover:underline flex items-center">
                      <RotateCcw size={12} className="mr-1" /> Reset Filters
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {/* Search Input */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Search Query</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Invoice #, Reason, Lane..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-sm text-sm focus:border-teal-500 focus:outline-none"
                      />
                      <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Carrier Dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Carrier</label>
                    <select
                      value={carrierFilter}
                      onChange={(e) => setCarrierFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:border-teal-500 focus:outline-none bg-white"
                    >
                      {uniqueCarriers.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SUMMARY HEADER (Total Amounts) */}
          <div className="flex justify-between items-center mb-3 flex-shrink-0">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
              <Calculator size={14} className="mr-2" /> Active View Summary
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-sm border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Count</span>
                  <span className="text-sm font-bold text-gray-900">{filteredInvoices.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Value</span>
                  <span className="text-lg font-bold text-teal-700 font-mono">
                    ₹{totalListValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {/* EXPAND BUTTON */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#0F62FE] text-white rounded-sm hover:bg-[#0353E9] text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                title="Expand to fullscreen"
              >
                <Maximize2 size={14} />
                <span>Expand Grid</span>
              </button>
            </div>
          </div>

          {/* 4. The Workhorse Grid */}
          <div className="bg-white border border-slate-400 shadow-sm rounded-sm flex-1 overflow-auto custom-scrollbar pb-24">
            <table className="w-full text-left border-collapse border border-slate-400">
              <thead className="sticky top-0 bg-slate-200 z-10 shadow-sm">
                <tr className="text-[10px] font-bold text-slate-900 border-b border-slate-400 uppercase tracking-wider">
                  <th className="py-1.5 px-3 bg-slate-200 border-r border-slate-400">Status</th>
                  <th className="py-1.5 px-3 bg-slate-200 border-r border-slate-400">Invoice #</th>
                  <th className="py-1.5 px-3 bg-slate-200 border-r border-slate-400">Carrier</th>

                  {/* --- SOLID FEATURE: DUAL-RATING COLUMNS --- */}
                  <th className="py-1.5 px-3 text-right bg-slate-200 border-r border-slate-400">TMS Est.</th>
                  <th className="py-1.5 px-3 text-right bg-slate-200 border-r border-slate-400">ATLAS Audit</th>
                  <th className="py-1.5 px-3 text-right bg-slate-200 border-r border-slate-400">Billed Amt</th>
                  <th className="py-1.5 px-3 text-right bg-slate-200 border-r border-slate-400">Variance</th>

                  <th className="py-1.5 px-3 bg-slate-200 border-r border-slate-400">Reason</th>
                  <th className="py-1.5 px-3 text-center bg-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => {
                    const isDuplicate = inv.reason?.includes('Duplicate');
                    const isGhost = inv.tmsMatchStatus === 'NOT_FOUND';
                    const isMenuOpen = activeActionMenu === inv.id;

                    return (
                      <tr
                        key={inv.id}
                        className={`border-b border-slate-300 cursor-pointer transition-colors group
                       ${isDuplicate ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50/50'}
                     `}
                        onClick={() => onSelectInvoice(inv)}
                      >
                        <td className="py-1.5 px-3 border-r border-slate-300">
                          {getStatusBadge(inv.status)}
                          {/* --- SOLID FEATURE: GHOST TAG --- */}
                          {isGhost && (
                            <div className="mt-0.5 flex items-center text-[9px] text-gray-500 font-bold uppercase">
                              <Ghost size={9} className="mr-1 text-gray-400" />
                              Non-TMS
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-blue-700 border-r border-slate-300 group-hover:underline">
                          <div className="flex items-center space-x-1.5">
                            <FileText size={12} className="text-slate-400" />
                            <span className="text-xs">#{inv.invoiceNumber}</span>
                          </div>
                          {/* Source Tag */}
                          <span className="text-[9px] text-gray-400 font-normal ml-4 block">Src: {inv.source}</span>
                        </td>
                        <td className="py-1.5 px-3 font-medium border-r border-slate-300">
                          <div className="text-xs">{inv.carrier}</div>
                          <span className="block text-[10px] text-slate-500 font-normal">{inv.origin} → {inv.destination}</span>
                        </td>

                        <td className="py-1.5 px-3 text-right font-mono text-[11px] text-gray-500 border-r border-slate-300">
                          {inv.tmsEstimatedAmount ? `₹${inv.tmsEstimatedAmount.toLocaleString()}` : <span className="text-[9px] italic">--</span>}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-[11px] font-bold text-slate-800 border-r border-slate-300">
                          ₹{(inv.auditAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-[11px] text-slate-600 border-r border-slate-300">
                          ₹{inv.amount.toLocaleString()}
                        </td>
                        <td className={`py-1.5 px-3 text-right font-bold font-mono text-[11px] border-r border-slate-300 ${inv.variance > 0 ? 'text-red-600' : 'text-teal-600'}`}>
                          {inv.variance > 0 ? '+' : ''}₹{inv.variance.toFixed(2)}
                        </td>

                        <td className="py-1.5 px-3 text-[10px] font-medium text-slate-500 border-r border-slate-300">
                          <div className="flex items-center">
                            {isDuplicate && <ShieldAlert size={12} className="mr-1 text-red-600" />}
                            {isGhost && <AlertTriangle size={12} className="mr-1 text-amber-500" />}
                            <span className={isDuplicate ? 'text-red-700 font-bold' : isGhost ? 'text-amber-700 font-bold' : ''}>{inv.reason}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-3 text-center relative border-r border-slate-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenu(isMenuOpen ? null : inv.id);
                            }}
                            className={`p-1 rounded-sm transition-colors ${isMenuOpen ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-200 text-slate-400 hover:text-teal-600'}`}
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {/* Context Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-8 top-8 w-48 bg-white shadow-xl border border-gray-200 rounded-sm z-50 animate-fade-in-up">
                              <div className="py-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onSelectInvoice(inv); }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Eye size={14} className="mr-2 text-gray-400" /> View Details
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDocumentPopupInvoice(inv); setActiveActionMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center"
                                >
                                  <FileCheck size={14} className="mr-2" /> View Documents
                                </button>
                                <button
                                  onClick={(e) => handleQuickApprove(e, inv.id)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center"
                                >
                                  <Check size={14} className="mr-2" /> Quick Approve
                                </button>
                                <button
                                  onClick={(e) => handleFlagReview(e, inv.invoiceNumber)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 flex items-center"
                                >
                                  <Flag size={14} className="mr-2" /> Flag for Review
                                </button>
                                <button
                                  onClick={(e) => handleReject(e, inv.id)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 flex items-center"
                                >
                                  <ShieldAlert size={14} className="mr-2" /> Reject Invoice
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={(e) => handleSinglePDFDownload(e, inv)}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 flex items-center"
                                >
                                  <Download size={14} className="mr-2" /> Download PDF
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Filter size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-bold text-gray-600">No invoices match your filters.</p>
                        <button onClick={clearAllFilters} className="mt-2 text-teal-600 hover:underline text-xs font-bold">Clear all filters</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className="absolute bottom-6 right-6 px-4 py-3 rounded-sm shadow-xl flex items-center animate-slideIn z-50 bg-gray-900 text-white">
          <Check size={16} className="text-green-400 mr-2" />
          <div className="text-xs font-bold">{toast}</div>
        </div>
      )}

      {/* DOCUMENT POPUP MODAL */}
      {documentPopupInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setDocumentPopupInvoice(null)}>
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center z-10">
              <div>
                <h3 className="text-lg font-bold text-white">Document Compliance</h3>
                <p className="text-sm text-slate-400">Invoice #{documentPopupInvoice.invoiceNumber} - {documentPopupInvoice.carrier}</p>
              </div>
              <button
                onClick={() => setDocumentPopupInvoice(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Document Checklist */}
            <div className="p-6">
              {documentPopupInvoice.documentBundle && documentPopupInvoice.documentCompliance ? (
                <DocumentChecklist
                  documentBundle={documentPopupInvoice.documentBundle}
                  documentCompliance={documentPopupInvoice.documentCompliance}
                  invoiceData={{
                    invoiceNumber: documentPopupInvoice.invoiceNumber,
                    date: documentPopupInvoice.date,
                    carrier: documentPopupInvoice.carrier,
                    origin: documentPopupInvoice.origin,
                    destination: documentPopupInvoice.destination,
                    amount: documentPopupInvoice.amount,
                    weight: documentPopupInvoice.weight || 250,
                    awbNumber: documentPopupInvoice.invoiceNumber.replace('/', '_'),
                    lineItems: documentPopupInvoice.lineItems
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText size={64} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No document information available for this invoice</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN INVOICE GRID MODAL - WHITE THEME */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-white flex flex-col z-50" onClick={() => setIsFullscreen(false)}>
          {/* Professional Header */}
          <div className="bg-[#0F62FE] px-6 py-4 flex justify-between items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-4">
              {/* 3D Geometric Solid Cube Icon */}
              <svg width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E0E0E0" />
                  </linearGradient>
                </defs>
                <polygon points="20,4 36,12 36,28 20,36 4,28 4,12" fill="url(#cubeTop)" />
                <polygon points="4,12 20,20 20,36 4,28" fill="#CCCCCC" />
                <polygon points="36,12 20,20 20,36 36,28" fill="#E8E8E8" />
                <polygon points="20,4 36,12 20,20 4,12" fill="white" />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Freight Audit Console</h3>
                <div className="flex items-center space-x-3 text-sm text-white/80">
                  <span className="font-bold">{filteredInvoices.length} Invoices</span>
                  <span>•</span>
                  <span>₹{totalListValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-[#0F62FE] rounded font-bold hover:bg-gray-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="8" height="8" rx="1" />
                <rect x="13" y="13" width="8" height="8" rx="1" />
              </svg>
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Table Container */}
          <div className="flex-1 overflow-y-auto bg-gray-50" onClick={(e) => e.stopPropagation()}>
            <table className="w-full text-left border-collapse bg-white">
              <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                <tr className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b-2 border-slate-300">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Carrier</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 text-right">TMS Est.</th>
                  <th className="py-3 px-4 text-right">Audit Amt</th>
                  <th className="py-3 px-4 text-right">Billed</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredInvoices.map((inv, index) => {
                  const isDuplicate = inv.reason?.includes('Duplicate');
                  const isDetention = inv.reason?.includes('Detention');
                  const isFraud = inv.reason?.includes('Fraud');
                  const isException = inv.status === InvoiceStatus.EXCEPTION;

                  return (
                    <tr
                      key={inv.id}
                      className={`cursor-pointer transition-colors border-b border-gray-200
                        ${isDuplicate || isFraud ? 'bg-red-50 hover:bg-red-100' :
                          isDetention && isException ? 'bg-amber-50 hover:bg-amber-100' :
                            isException ? 'bg-red-50 hover:bg-red-100' :
                              index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}`}
                      onClick={() => { onSelectInvoice(inv); setIsFullscreen(false); }}
                    >
                      <td className="py-3 px-4">
                        {/* SOLID status badge - no transparency */}
                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase
                          ${inv.status === InvoiceStatus.APPROVED ? 'bg-emerald-600 text-white' :
                            inv.status === InvoiceStatus.OPS_APPROVED ? 'bg-teal-600 text-white' :
                              inv.status === InvoiceStatus.EXCEPTION ? 'bg-red-600 text-white' :
                                inv.status === InvoiceStatus.PENDING ? 'bg-amber-500 text-white' :
                                  inv.status === InvoiceStatus.REJECTED ? 'bg-rose-700 text-white' :
                                    'bg-gray-600 text-white'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-700">#{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{inv.carrier}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{inv.origin} → {inv.destination}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        {inv.tmsEstimatedAmount ? `₹${inv.tmsEstimatedAmount.toLocaleString()}` : '--'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">₹{(inv.auditAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">₹{inv.amount.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${inv.variance > 0 ? 'text-red-600' : inv.variance < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {inv.variance > 0 ? '+' : ''}{inv.variance !== 0 ? `₹${inv.variance.toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-xs">
                          {/* 3D Geometric Solid Pyramid Warning Icon */}
                          {(isDuplicate || isFraud) && (
                            <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2 flex-shrink-0">
                              <defs>
                                <linearGradient id="pyFront" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#EF4444" />
                                  <stop offset="100%" stopColor="#B91C1C" />
                                </linearGradient>
                              </defs>
                              <polygon points="12,2 22,20 12,16" fill="url(#pyFront)" />
                              <polygon points="12,2 2,20 12,16" fill="#DC2626" />
                              <polygon points="2,20 22,20 12,16" fill="#7F1D1D" />
                            </svg>
                          )}
                          {/* 3D Geometric Solid Sphere Alert Icon */}
                          {isDetention && !isFraud && (
                            <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2 flex-shrink-0">
                              <defs>
                                <radialGradient id="spGrad" cx="30%" cy="30%">
                                  <stop offset="0%" stopColor="#FCD34D" />
                                  <stop offset="100%" stopColor="#D97706" />
                                </radialGradient>
                              </defs>
                              <circle cx="12" cy="12" r="10" fill="url(#spGrad)" />
                              <ellipse cx="12" cy="17" rx="8" ry="2" fill="#B45309" />
                            </svg>
                          )}
                          <span className={`truncate ${isDuplicate || isFraud ? 'text-red-700 font-bold' : isDetention && isException ? 'text-amber-700 font-bold' : 'text-gray-600'}`}>
                            {inv.reason}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer - Solid Gray */}
          <div className="bg-slate-800 px-6 py-2 flex justify-between items-center flex-shrink-0 text-xs text-white" onClick={(e) => e.stopPropagation()}>
            <span className="font-bold">SEQUELSTRING AI • Freight Audit Terminal</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center"><span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>LIVE</span>
              <span className="text-gray-400">Press ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};