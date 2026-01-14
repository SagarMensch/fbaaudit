import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Eye, ChevronRight, RefreshCw, AlertTriangle, User } from 'lucide-react';

interface PendingInvoice {
    id: string;
    invoice_number: string;
    supplier_id: string;
    amount: number;
    status: string;
    invoice_date: string;
    created_at: string;
}

interface ApproverQueueProps {
    currentUser: {
        name: string;
        role: string;
    };
    onViewInvoice?: (invoiceId: string) => void;
}

export const ApproverQueue: React.FC<ApproverQueueProps> = ({ currentUser, onViewInvoice }) => {
    const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPendingInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8000/api/invoices/pending?approver_role=${encodeURIComponent(currentUser.role)}`);
            const data = await response.json();
            if (data.success) {
                setInvoices(data.invoices);
            } else {
                setError(data.error || 'Failed to fetch invoices');
            }
        } catch (err) {
            setError('Failed to connect to server. Please ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingInvoices();
    }, [currentUser.role]);

    const handleApprove = async (invoiceId: string) => {
        try {
            const response = await fetch(`http://localhost:8000/api/invoices/${invoiceId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approver_name: currentUser.name,
                    remarks: `Approved by ${currentUser.name} (${currentUser.role})`
                })
            });
            const data = await response.json();
            if (data.success) {
                alert(`✅ Invoice ${invoiceId} approved successfully!`);
                fetchPendingInvoices(); // Refresh the list
            } else {
                alert(`❌ Failed: ${data.error}`);
            }
        } catch (err) {
            alert('❌ Network error - please ensure backend is running');
        }
    };

    const handleReject = async (invoiceId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return; // User cancelled

        try {
            const response = await fetch(`http://localhost:8000/api/invoices/${invoiceId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approver_name: currentUser.name,
                    reason: reason
                })
            });
            const data = await response.json();
            if (data.success) {
                alert(`❌ Invoice ${invoiceId} rejected.`);
                fetchPendingInvoices(); // Refresh the list
            } else {
                alert(`❌ Failed: ${data.error}`);
            }
        } catch (err) {
            alert('❌ Network error - please ensure backend is running');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            'PENDING': { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={12} /> },
            'PENDING_APPROVAL': { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={12} /> },
            'APPROVED': { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} /> },
            'PAID': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle size={12} /> },
            'REJECTED': { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={12} /> },
            'PENDING_VERIFICATION': { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Eye size={12} /> },
            'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-600', icon: <FileText size={12} /> },
        };
        const config = statusConfig[status] || statusConfig['PENDING'];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${config.bg} ${config.text}`}>
                {config.icon} {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="p-8 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                            <FileText size={20} className="text-white" />
                        </div>
                        Pending Approvals
                    </h1>
                    <p className="text-gray-500 mt-1">Invoices awaiting your review • {currentUser.role}</p>
                </div>
                <button
                    onClick={fetchPendingInvoices}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-600" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && invoices.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">All Caught Up!</h3>
                    <p className="text-gray-500">No pending invoices require your approval at this time.</p>
                </div>
            )}

            {/* Invoice List */}
            {!loading && invoices.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-teal-700">{invoice.invoice_number}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <User size={14} className="text-gray-500" />
                                            </div>
                                            <span className="text-gray-800">{invoice.supplier_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-900">₹{invoice.amount?.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600 text-sm">{invoice.invoice_date}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(invoice.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewInvoice?.(invoice.id)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    // Fetch and open documents
                                                    try {
                                                        const res = await fetch(`http://localhost:8000/api/invoices/${invoice.id}/documents`);
                                                        const data = await res.json();
                                                        if (data.success && data.documents.length > 0) {
                                                            // Open first document (PDF) in new tab
                                                            const pdf = data.documents.find((d: any) => d.type === 'pdf');
                                                            if (pdf) {
                                                                window.open(`http://localhost:8000${pdf.path}`, '_blank');
                                                            }
                                                        } else {
                                                            alert('No documents found for this invoice');
                                                        }
                                                    } catch (err) {
                                                        alert('Failed to load documents');
                                                    }
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Documents"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(invoice.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                                            >
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(invoice.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary Footer */}
            {!loading && invoices.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Showing {invoices.length} pending invoice(s)</span>
                    <span className="flex items-center gap-1">
                        <Clock size={14} /> Last updated: {new Date().toLocaleTimeString()}
                    </span>
                </div>
            )}
        </div>
    );
};
