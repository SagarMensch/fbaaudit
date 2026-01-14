// Organization Invoice Review Page
// Review supplier invoices with auto-matching against contracts

import React, { useState } from 'react';
import InvoiceStorageService from '../services/invoiceStorageService';
import InvoiceMatchingService, { SupplierInvoice, MatchingResult } from '../services/invoiceMatchingService';
import IndianSupplierService from '../services/supplierService';
import {
    FileText, CheckCircle, XCircle, AlertTriangle, Eye, Download,
    TrendingUp, TrendingDown, Minus, Check, X
} from 'lucide-react';

export const InvoiceReview: React.FC = () => {
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
    const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | SupplierInvoice['status']>('all');

    const allInvoices = InvoiceStorageService.getAllInvoices();
    const filteredInvoices = filterStatus === 'all'
        ? allInvoices
        : allInvoices.filter(inv => inv.status === filterStatus);

    const handleViewInvoice = (invoice: SupplierInvoice) => {
        setSelectedInvoice(invoice);

        // Get supplier and run matching
        const supplier = IndianSupplierService.getSupplierById(invoice.supplierId);
        if (supplier) {
            const result = InvoiceMatchingService.matchInvoice(invoice, supplier);
            setMatchingResult(result);
        }
    };

    const handleApprove = () => {
        if (selectedInvoice) {
            InvoiceStorageService.updateInvoiceStatus(
                selectedInvoice.id,
                'approved',
                'System Admin',
                'Invoice approved after review'
            );
            setSelectedInvoice(null);
            setMatchingResult(null);
        }
    };

    const handleReject = () => {
        if (selectedInvoice) {
            const reason = prompt('Enter rejection reason:');
            if (reason) {
                InvoiceStorageService.updateInvoiceStatus(
                    selectedInvoice.id,
                    'rejected',
                    'System Admin',
                    reason
                );
                setSelectedInvoice(null);
                setMatchingResult(null);
            }
        }
    };

    const getStatusBadge = (status: SupplierInvoice['status']) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-0.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded">APPROVED</span>;
            case 'submitted':
                return <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">NEW</span>;
            case 'under_review':
                return <span className="px-2 py-0.5 text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded">UNDER REVIEW</span>;
            case 'rejected':
                return <span className="px-2 py-0.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded">REJECTED</span>;
            case 'paid':
                return <span className="px-2 py-0.5 text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200 rounded">PAID</span>;
        }
    };

    return (
        <div className="h-full flex flex-col font-sans p-8 overflow-hidden bg-[#F8F9FA]">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Invoice Review</h2>
                    <p className="text-sm text-gray-600 mt-1">Review and approve supplier invoices with auto-matching</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4 mb-6 flex-shrink-0">
                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Invoices</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{allInvoices.length}</p>
                </div>
                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">New</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">
                        {allInvoices.filter(i => i.status === 'submitted').length}
                    </p>
                </div>
                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-orange-700 font-medium uppercase tracking-wide">Under Review</p>
                    <p className="text-3xl font-bold text-orange-700 mt-2">
                        {allInvoices.filter(i => i.status === 'under_review').length}
                    </p>
                </div>
                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Approved</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                        {allInvoices.filter(i => i.status === 'approved').length}
                    </p>
                </div>
                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-red-700 font-medium uppercase tracking-wide">Rejected</p>
                    <p className="text-3xl font-bold text-red-700 mt-2">
                        {allInvoices.filter(i => i.status === 'rejected').length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                >
                    <option value="all">All Status</option>
                    <option value="submitted">New</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Invoice List */}
            <div className="flex-1 overflow-auto bg-white border border-gray-200">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">LR Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">POD Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-mono text-gray-900">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{inv.supplierName}</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-900">{inv.lrNumber}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{inv.invoiceDate}</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{inv.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    {inv.podStatus === 'uploaded' ? (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded">UPLOADED</span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded">PENDING</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleViewInvoice(inv)}
                                        className="text-sm text-gray-900 hover:text-gray-700 font-medium"
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State */}
                {filteredInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <p className="text-lg font-medium">No invoices found</p>
                        <p className="text-sm mt-1">Invoices submitted by suppliers will appear here</p>
                    </div>
                )}
            </div>

            {/* Invoice Detail Modal */}
            {selectedInvoice && matchingResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Invoice Review - {selectedInvoice.invoiceNumber}</h3>
                            <button onClick={() => { setSelectedInvoice(null); setMatchingResult(null); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div className="space-y-6">
                                {/* Matching Summary */}
                                <div className={`p-4 border-2 ${matchingResult.matched ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Auto-Matching Result</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {matchingResult.matched ? 'All checks passed' : `${matchingResult.discrepancies.length} discrepancies found`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">Recommendation</p>
                                            <p className={`text-lg font-bold ${matchingResult.recommendation === 'approve' ? 'text-green-700' :
                                                    matchingResult.recommendation === 'review' ? 'text-orange-700' : 'text-red-700'
                                                }`}>
                                                {matchingResult.recommendation.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Comparison */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 border border-gray-200">
                                        <p className="text-xs text-gray-600">Expected Amount</p>
                                        <p className="text-xl font-bold text-gray-900 mt-1">₹{matchingResult.expectedAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 border border-gray-200">
                                        <p className="text-xs text-gray-600">Actual Amount</p>
                                        <p className="text-xl font-bold text-gray-900 mt-1">₹{matchingResult.actualAmount.toLocaleString()}</p>
                                    </div>
                                    <div className={`p-4 border ${Math.abs(matchingResult.variancePercent) < 2 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                        }`}>
                                        <p className="text-xs text-gray-600">Variance</p>
                                        <p className={`text-xl font-bold mt-1 ${Math.abs(matchingResult.variancePercent) < 2 ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            {matchingResult.variancePercent > 0 ? '+' : ''}{matchingResult.variancePercent.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>

                                {/* Discrepancies */}
                                {matchingResult.discrepancies.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-3">Discrepancies Found</h4>
                                        <div className="space-y-2">
                                            {matchingResult.discrepancies.map((disc, idx) => (
                                                <div key={idx} className={`p-3 border ${disc.severity === 'high' ? 'bg-red-50 border-red-200' :
                                                        disc.severity === 'medium' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
                                                    }`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-900">{disc.description}</p>
                                                            <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                                                                <div>
                                                                    <p className="text-gray-600">Expected</p>
                                                                    <p className="font-mono text-gray-900">{disc.expected}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-600">Actual</p>
                                                                    <p className="font-mono text-gray-900">{disc.actual}</p>
                                                                </div>
                                                            </div>
                                                            {disc.impact !== 0 && (
                                                                <p className="text-xs text-gray-600 mt-2">
                                                                    Impact: ₹{disc.impact.toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${disc.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                                disc.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {disc.severity.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Invoice Details */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Invoice Details</h4>
                                    <div className="bg-gray-50 p-4 border border-gray-200">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Supplier</p>
                                                <p className="text-gray-900 font-medium">{selectedInvoice.supplierName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">LR Number</p>
                                                <p className="text-gray-900 font-mono">{selectedInvoice.lrNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Route</p>
                                                <p className="text-gray-900">
                                                    {selectedInvoice.lineItems[0].origin} → {selectedInvoice.lineItems[0].destination}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Weight</p>
                                                <p className="text-gray-900">{selectedInvoice.lineItems[0].weight} kg</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Rate</p>
                                                <p className="text-gray-900">₹{selectedInvoice.lineItems[0].rate}/kg</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">POD Status</p>
                                                <p className="text-gray-900">{selectedInvoice.podStatus.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => { setSelectedInvoice(null); setMatchingResult(null); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-medium text-sm flex items-center gap-2"
                            >
                                <XCircle size={16} />
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium text-sm flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceReview;
