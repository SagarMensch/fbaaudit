// Enhanced Invoice Review - ROLE-BASED ACADEMIC ANALYTICS DASHBOARD
// Each user sees different statistical view based on their role

import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { Geo3DCube, Geo3DPyramid, Geo3DCylinder, Geo3DSphere, Geo3DHexagon, Geo3DBar } from '../components/GeoIcons';

// --- 3D SOLID GEOMETRIC ICONS ---

const GeoStack = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M2 12l10 5 10-5-10-5z" fillOpacity="0.8" />
        <path d="M12 17l10-5V7L12 12z" fillOpacity="0.6" />
        <path d="M2 12l10 5V7L2 2z" fillOpacity="1" />
        <path d="M2 17l10 5 10-5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
    </svg>
);

const GeoClock = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <circle cx="12" cy="12" r="10" fillOpacity="0.3" />
        <path d="M12 12L12 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <rect x="11" y="11" width="2" height="2" fill="white" />
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" opacity="0.8" />
    </svg>
);

const GeoCheck = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
        <path d="M9 11l3 3L22 4" stroke={color} strokeWidth="3" fill="none" />
        <circle cx="12" cy="12" r="8" fill={color} fillOpacity="0.1" />
    </svg>
);

const GeoCross = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
        <path d="M8 8l8 8M16 8l-8 8" stroke={color} strokeWidth="3" fill="none" />
        <circle cx="12" cy="12" r="8" fill={color} fillOpacity="0.1" />
    </svg>
);

const GeoWallet = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M20 12V8H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h12v4" fillOpacity="0.4" />
        <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" fillOpacity="0.8" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" fill="white" fillOpacity="0.6" />
        <circle cx="20" cy="14" r="1" fill={color} />
    </svg>
);

const GeoCalculator = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <rect x="4" y="2" width="16" height="20" rx="2" fillOpacity="0.8" />
        <rect x="6" y="5" width="12" height="4" rx="1" fill="white" fillOpacity="0.6" />
        <circle cx="8" cy="13" r="1" fill="white" />
        <circle cx="12" cy="13" r="1" fill="white" />
        <circle cx="16" cy="13" r="1" fill="white" />
        <circle cx="8" cy="17" r="1" fill="white" />
        <circle cx="12" cy="17" r="1" fill="white" />
        <circle cx="16" cy="17" r="1" fill="white" />
    </svg>
);

interface EnhancedInvoiceReviewProps {
    currentUser?: { name: string; role: string };
    invoices: Invoice[];
}

export const EnhancedInvoiceReview: React.FC<EnhancedInvoiceReviewProps> = ({ currentUser: currentUserProp, invoices }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const currentUser = currentUserProp?.name || 'Zeya Kapoor';

    // ROLE-BASED FILTERING - Each person sees different invoices
    // FIXED: Now matches Freight Audit logic exactly
    const roleBasedInvoices = useMemo(() => {
        return invoices.filter(inv => {
            // Find the CURRENT pending workflow stage (not historical)
            const currentStage = inv.workflowHistory?.find(w => w.status === 'PENDING' || w.status === 'ACTIVE');

            if (currentUser === 'Kaai Bansal') {
                // Kaai sees: Invoices CURRENTLY pending at Step-1
                const isAssignedToMe = inv.assignedTo === 'Kaai Bansal';
                const isPendingMyApproval = currentStage && currentStage.stepId === 'step-1';
                return isAssignedToMe || isPendingMyApproval;
            } else if (currentUser === 'Zeya Kapoor') {
                // Zeya sees: Invoices CURRENTLY pending at Step-2
                const isAssignedToMe = inv.assignedTo === 'Zeya Kapoor';
                const isPendingMyApproval = currentStage && currentStage.stepId === 'step-2';
                return isAssignedToMe || isPendingMyApproval;
            }

            return true; // Default: show all invoices for other users
        });
    }, [invoices, currentUser]);

    // Academic Statistical Analysis
    const analytics = useMemo(() => {
        const total = roleBasedInvoices.length;
        const pending = roleBasedInvoices.filter(inv => inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.EXCEPTION).length;
        const approved = roleBasedInvoices.filter(inv => inv.status === InvoiceStatus.APPROVED).length;
        const rejected = roleBasedInvoices.filter(inv => inv.status === InvoiceStatus.REJECTED).length;
        const paid = roleBasedInvoices.filter(inv => inv.status === InvoiceStatus.PAID).length;

        const totalValue = roleBasedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const avgValue = total > 0 ? totalValue / total : 0;
        const totalVariance = roleBasedInvoices.reduce((sum, inv) => sum + (inv.variance || 0), 0);

        // Variance distribution
        const withVariance = roleBasedInvoices.filter(inv => inv.variance > 0).length;
        const varianceRate = total > 0 ? (withVariance / total) * 100 : 0;

        // Carrier distribution
        const carrierStats = roleBasedInvoices.reduce((acc, inv) => {
            acc[inv.carrier] = (acc[inv.carrier] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            pending,
            approved,
            rejected,
            paid,
            totalValue,
            avgValue,
            totalVariance,
            varianceRate,
            carrierStats,
            approvalRate: total > 0 ? (approved / total) * 100 : 0,
            rejectionRate: total > 0 ? (rejected / total) * 100 : 0
        };
    }, [roleBasedInvoices]);

    // Filter by search
    const filteredInvoices = useMemo(() => {
        if (!searchQuery) return roleBasedInvoices;
        const query = searchQuery.toLowerCase();
        return roleBasedInvoices.filter(inv =>
            inv.invoiceNumber.toLowerCase().includes(query) ||
            inv.carrier.toLowerCase().includes(query) ||
            inv.origin.toLowerCase().includes(query) ||
            inv.destination.toLowerCase().includes(query)
        );
    }, [roleBasedInvoices, searchQuery]);

    return (
        <div className="h-full bg-slate-50 overflow-auto">
            <div className="max-w-[1800px] mx-auto p-8">
                {/* Academic Header */}
                <div className="mb-8 pb-6 border-b-2 border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">Invoice Analytics Dashboard</h1>
                            <p className="text-slate-600 mt-1 font-medium">Role-Based View • {currentUser}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500 uppercase tracking-wider">Total Invoices</div>
                            <div className="text-3xl font-bold text-slate-900 mt-1">{analytics.total}</div>
                        </div>
                    </div>
                </div>

                {/* Key Performance Indicators - DARK BLOOMBERG 3D STYLE */}
                <div className="grid grid-cols-6 gap-6 mb-8">
                    {/* Total Invoices */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-[#0F62FE] transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">TOTAL INVOICES</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{analytics.total}</div>
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

                    {/* Pending */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-orange-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">PENDING</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{analytics.pending}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-orange-500/10 transition-colors">
                                <Geo3DSphere size={32} color="#F97316" className="drop-shadow-[0_4px_6px_rgba(249,115,22,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Queue</span>
                            <span className="text-[9px] font-mono text-orange-500 font-bold">{analytics.total > 0 ? ((analytics.pending / analytics.total) * 100).toFixed(1) : 0}%</span>
                        </div>
                    </div>

                    {/* Approved */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-teal-400 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">APPROVED</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{analytics.approved}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-teal-400/10 transition-colors">
                                <Geo3DBar size={32} color="#14B8A6" className="drop-shadow-[0_4px_6px_rgba(20,184,166,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Fast Track</span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">{analytics.approvalRate.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Rejected */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-red-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">REJECTED</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{analytics.rejected}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-red-500/10 transition-colors">
                                <Geo3DHexagon size={32} color="#EF4444" className="drop-shadow-[0_4px_6px_rgba(239,68,68,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Flagged</span>
                            <span className="text-[9px] font-mono text-red-500 font-bold">{analytics.rejectionRate.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Total Value */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-blue-400 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">TOTAL VALUE</span>
                                <div className="text-xl font-mono font-bold text-white tracking-tighter truncate" title={`₹${analytics.totalValue.toLocaleString()}`}>
                                    ₹{(analytics.totalValue / 1000).toFixed(1)}k
                                </div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-blue-400/10 transition-colors">
                                <Geo3DPyramid size={32} color="#60A5FA" className="drop-shadow-[0_4px_6px_rgba(96,165,250,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Aggregate</span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">Sum</span>
                        </div>
                    </div>

                    {/* Avg Value */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-slate-400 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">AVG VALUE</span>
                                <div className="text-xl font-mono font-bold text-white tracking-tighter">₹{analytics.avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-slate-400/10 transition-colors">
                                <Geo3DCylinder size={32} color="#94A3B8" className="drop-shadow-[0_4px_6px_rgba(148,163,184,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Mean</span>
                            <span className="text-[9px] font-mono text-gray-400 font-bold">Avg</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by invoice number, carrier, or route..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-5 py-3 bg-white border-2 border-slate-300 rounded-none text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none font-medium"
                    />
                </div>

                {/* Invoice Data Table */}
                <div className="bg-white shadow-lg border-2 border-slate-800 mb-8">
                    <div className="bg-slate-800 px-6 py-4 border-b-2 border-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Invoice Data Table</h2>
                            <div className="text-xs text-slate-300 font-medium">
                                Count: <span className="text-white font-bold">{filteredInvoices.length}</span> |
                                Total: <span className="text-white font-bold">₹{filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-100 border-b-2 border-slate-300">
                                    <th className="px-4 py-3 text-left">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</div>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice ID</div>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Carrier</div>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Route</div>
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Amount (₹)</div>
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Variance</div>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Assigned To</div>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reason</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 ${invoice.status === InvoiceStatus.APPROVED ? 'border-emerald-700 bg-emerald-50 text-emerald-800' :
                                                invoice.status === InvoiceStatus.REJECTED ? 'border-red-700 bg-red-50 text-red-800' :
                                                    invoice.status === InvoiceStatus.PENDING ? 'border-orange-600 bg-orange-50 text-orange-700' :
                                                        invoice.status === InvoiceStatus.EXCEPTION ? 'border-yellow-600 bg-yellow-50 text-yellow-800' :
                                                            invoice.status === InvoiceStatus.PAID ? 'border-blue-700 bg-blue-50 text-blue-800' :
                                                                'border-slate-400 bg-slate-50 text-slate-700'
                                                }`}>
                                                {invoice.status}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-mono text-sm font-bold text-slate-900">{invoice.invoiceNumber}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Src: {invoice.source || 'EDI'}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-sm text-slate-900">{invoice.carrier}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-slate-700">{invoice.origin} → {invoice.destination}</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="font-mono text-sm font-bold text-slate-900">₹{invoice.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {invoice.variance > 0 ? (
                                                <div className="font-mono text-sm font-bold text-red-700">+₹{invoice.variance.toLocaleString()}</div>
                                            ) : (
                                                <div className="font-mono text-sm text-emerald-700">₹0.00</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-slate-900">{invoice.assignedTo || '-'}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-slate-700 max-w-xs truncate">{invoice.reason || '-'}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Statistical Analysis Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Carrier Distribution */}
                    <div className="bg-white shadow-lg border-2 border-slate-800">
                        <div className="bg-slate-800 px-6 py-4 border-b-2 border-slate-900">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Carrier Distribution Analysis</h2>
                        </div>
                        <div className="p-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-300">
                                        <th className="text-left pb-2 text-xs font-bold text-slate-700 uppercase">Carrier</th>
                                        <th className="text-right pb-2 text-xs font-bold text-slate-700 uppercase">Count</th>
                                        <th className="text-right pb-2 text-xs font-bold text-slate-700 uppercase">%</th>
                                        <th className="text-left pb-2 pl-4 text-xs font-bold text-slate-700 uppercase">Distribution</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(analytics.carrierStats)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([carrier, count]) => {
                                            const percentage = (count / analytics.total) * 100;
                                            return (
                                                <tr key={carrier} className="border-b border-slate-200">
                                                    <td className="py-3 font-bold text-slate-900">{carrier}</td>
                                                    <td className="py-3 text-right font-mono text-slate-900">{count}</td>
                                                    <td className="py-3 text-right font-mono text-slate-700">{percentage.toFixed(1)}%</td>
                                                    <td className="py-3 pl-4">
                                                        <div className="w-full h-6 bg-slate-200 border border-slate-300">
                                                            <div
                                                                className="h-full bg-slate-800"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Variance Analysis */}
                    <div className="bg-white shadow-lg border-2 border-slate-800">
                        <div className="bg-slate-800 px-6 py-4 border-b-2 border-slate-900">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Variance Analysis</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <div className="text-xs text-slate-600 uppercase tracking-wider mb-1">Total Variance</div>
                                <div className="text-3xl font-bold text-red-700">₹{analytics.totalVariance.toLocaleString()}</div>
                            </div>
                            <div className="border-b-2 border-slate-200 pb-4">
                                <div className="text-xs text-slate-600 uppercase tracking-wider mb-1">Variance Rate</div>
                                <div className="text-3xl font-bold text-orange-600">{analytics.varianceRate.toFixed(1)}%</div>
                                <div className="text-xs text-slate-600 mt-1">{roleBasedInvoices.filter(inv => inv.variance > 0).length} of {analytics.total} invoices</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-600 uppercase tracking-wider mb-3">Status Breakdown</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-700">Pending</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-3 bg-slate-200 border border-slate-300">
                                                <div className="h-full bg-orange-600" style={{ width: `${(analytics.pending / analytics.total) * 100}%` }}></div>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-slate-900 w-12 text-right">{analytics.pending}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-700">Approved</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-3 bg-slate-200 border border-slate-300">
                                                <div className="h-full bg-emerald-700" style={{ width: `${(analytics.approved / analytics.total) * 100}%` }}></div>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-slate-900 w-12 text-right">{analytics.approved}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-700">Rejected</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-3 bg-slate-200 border border-slate-300">
                                                <div className="h-full bg-red-700" style={{ width: `${(analytics.rejected / analytics.total) * 100}%` }}></div>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-slate-900 w-12 text-right">{analytics.rejected}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
