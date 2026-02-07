import React, { useState, useMemo } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { supplierInvoiceService, InvoiceStatus, PaymentStatus, SupplierInvoice } from '../../services/supplierInvoiceService';
import { SmartInvoicing } from './SmartInvoicing';

interface InvoicesProps {
    supplier: IndianSupplier;
}

// 3D Icons
const Geo3DDocument: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M8 4h12l8 8v16H8V4z" fill={color} />
        <path d="M20 4v8h8" fill={color} fillOpacity="0.5" />
        <rect x="12" y="16" width="8" height="2" fill="white" fillOpacity="0.5" />
        <rect x="12" y="20" width="12" height="2" fill="white" fillOpacity="0.5" />
    </svg>
);

const Geo3DCheck: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill={color} />
        <path d="M10 16l4 4 8-8" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const Geo3DClock: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#0052FF' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill={color} />
        <path d="M16 8v8l6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const Geo3DAlert: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FF0000' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M16 4L28 26H4Z" fill={color} />
        <rect x="14" y="12" width="4" height="8" fill="white" />
        <rect x="14" y="22" width="4" height="3" fill="white" />
    </svg>
);

const ITEMS_PER_PAGE = 10;

export const Invoices: React.FC<InvoicesProps> = ({ supplier }) => {
    const [showAddInvoice, setShowAddInvoice] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
    const [amountFilter, setAmountFilter] = useState<'all' | 'under10k' | '10k-50k' | 'over50k'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // MySQL Integration: Fetch invoices from backend
    const [allInvoices, setAllInvoices] = useState<SupplierInvoice[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                // Fetch from MySQL API
                const response = await fetch('http://localhost:5000/api/invoices/all');
                const data = await response.json();
                if (data.success && data.invoices) {
                    // Map MySQL data to SupplierInvoice format
                    const mappedInvoices: SupplierInvoice[] = data.invoices.map((inv: any) => ({
                        invoiceId: inv.id,
                        invoiceNumber: inv.invoiceNumber || inv.invoice_number,
                        supplierId: inv.carrier || inv.supplier_id || supplier.id,
                        poNumber: inv.po_number || 'PO-' + (inv.invoiceNumber || '').slice(-4),
                        invoiceDate: inv.date || inv.invoice_date || new Date().toISOString(),
                        dueDate: inv.date || new Date().toISOString(),
                        totalAmount: inv.amount || 0,
                        status: (inv.status || 'PENDING') as InvoiceStatus,
                        paymentStatus: inv.status === 'PAID' ? 'PAID' : 'PENDING' as PaymentStatus,
                        shipmentDetails: {
                            origin: inv.origin || 'MUMBAI',
                            destination: inv.destination || 'DELHI',
                            vehicleNumber: 'N/A',
                            weight: 0
                        },
                        lineItems: [],
                        documents: [],
                        createdAt: inv.created_at || new Date().toISOString(),
                        remarks: inv.remarks || ''
                    }));
                    setAllInvoices(mappedInvoices);
                } else {
                    // Fallback to localStorage service
                    setAllInvoices(supplierInvoiceService.getAllInvoices());
                }
            } catch (error) {
                console.error('[Invoices] Failed to fetch from MySQL:', error);
                // Fallback to localStorage
                setAllInvoices(supplierInvoiceService.getAllInvoices());
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, [supplier.id]);

    // Apply filters
    const filteredInvoices = useMemo(() => {
        let result = allInvoices;

        // Status filter
        if (statusFilter !== 'ALL') {
            result = result.filter(inv => inv.status === statusFilter);
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(q) ||
                inv.poNumber.toLowerCase().includes(q)
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
            const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            result = result.filter(inv => new Date(inv.invoiceDate) >= cutoff);
        }

        // Amount filter
        if (amountFilter !== 'all') {
            result = result.filter(inv => {
                if (amountFilter === 'under10k') return inv.totalAmount < 10000;
                if (amountFilter === '10k-50k') return inv.totalAmount >= 10000 && inv.totalAmount <= 50000;
                return inv.totalAmount > 50000;
            });
        }

        return result;
    }, [allInvoices, statusFilter, searchQuery, dateFilter, amountFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Stats - calculate from current data
    const stats = {
        totalInvoices: allInvoices.length,
        pendingAmount: allInvoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.totalAmount, 0),
        byStatus: {
            approved: allInvoices.filter(i => i.status === 'APPROVED').length,
            disputed: allInvoices.filter(i => i.status === 'DISPUTED').length
        }
    };

    const getStatusStyle = (status: InvoiceStatus) => {
        switch (status) {
            case 'PAID': return { bg: '#00C805', text: '#000000' };
            case 'APPROVED': return { bg: '#0052FF', text: '#FFFFFF' };
            case 'PENDING': return { bg: '#333333', text: '#FFFFFF' };
            case 'DISPUTED': return { bg: '#FF0000', text: '#FFFFFF' };
            case 'REJECTED': return { bg: '#666666', text: '#FFFFFF' };
            default: return { bg: '#333333', text: '#FFFFFF' };
        }
    };

    const getTimelineSteps = (invoice: SupplierInvoice) => {
        const steps = [
            { label: 'Submitted', done: true, date: invoice.invoiceDate },
            { label: 'Under Review', done: ['APPROVED', 'PAID', 'REJECTED', 'DISPUTED'].includes(invoice.status), date: null },
            { label: invoice.status === 'REJECTED' ? 'Rejected' : invoice.status === 'DISPUTED' ? 'Disputed' : 'Approved', done: ['APPROVED', 'PAID', 'REJECTED', 'DISPUTED'].includes(invoice.status), date: invoice.approvedDate },
            { label: 'Payment Processed', done: invoice.status === 'PAID', date: invoice.paidDate },
        ];
        return steps;
    };

    return (
        <div style={{
            backgroundColor: '#000000',
            minHeight: '100vh',
            padding: '32px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 600, margin: 0 }}>Invoices & Payments</h1>
                    <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0' }}>Track your invoices and payment status</p>
                </div>
                <button
                    onClick={() => setShowAddInvoice(true)}
                    style={{
                        backgroundColor: '#00C805',
                        color: '#000000',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Geo3DDocument size={18} color="#000000" /> New Invoice
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Invoices', value: stats.totalInvoices, color: '#FFFFFF' },
                    { label: 'Pending Amount', value: `₹${(stats.pendingAmount / 1000).toFixed(0)}K`, color: '#00C805' },
                    { label: 'Approved', value: stats.byStatus.approved, color: '#0052FF' },
                    { label: 'Disputed', value: stats.byStatus.disputed, color: '#FF0000' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        backgroundColor: '#1A1A1A',
                        borderRadius: '16px',
                        padding: '20px'
                    }}>
                        <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '1px' }}>{stat.label}</p>
                        <p style={{ color: stat.color, fontSize: '28px', fontWeight: 700, margin: 0 }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search invoice or PO number..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    style={{
                        backgroundColor: '#0A0A0A',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        width: '240px',
                        outline: 'none'
                    }}
                />

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as InvoiceStatus | 'ALL'); setCurrentPage(1); }}
                    style={{
                        backgroundColor: '#0A0A0A',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="DISPUTED">Disputed</option>
                    <option value="REJECTED">Rejected</option>
                </select>

                {/* Date Filter */}
                <select
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value as any); setCurrentPage(1); }}
                    style={{
                        backgroundColor: '#0A0A0A',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                >
                    <option value="all">All Dates</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                </select>

                {/* Amount Filter */}
                <select
                    value={amountFilter}
                    onChange={(e) => { setAmountFilter(e.target.value as any); setCurrentPage(1); }}
                    style={{
                        backgroundColor: '#0A0A0A',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                >
                    <option value="all">All Amounts</option>
                    <option value="under10k">Under ₹10K</option>
                    <option value="10k-50k">₹10K - ₹50K</option>
                    <option value="over50k">Over ₹50K</option>
                </select>

                <span style={{ color: '#666', fontSize: '12px', marginLeft: 'auto' }}>
                    Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices
                </span>
            </div>

            {/* Invoice List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {paginatedInvoices.map(invoice => {
                    const statusStyle = getStatusStyle(invoice.status);
                    return (
                        <div
                            key={invoice.invoiceId}
                            onClick={() => setSelectedInvoice(invoice)}
                            style={{
                                backgroundColor: '#1A1A1A',
                                borderRadius: '16px',
                                padding: '20px 24px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '2px solid transparent'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00C805'; e.currentTarget.style.backgroundColor = '#242424'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = '#1A1A1A'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Geo3DDocument size={32} color="#00C805" />
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                            <span style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 600 }}>{invoice.invoiceNumber}</span>
                                            <span style={{
                                                backgroundColor: statusStyle.bg,
                                                color: statusStyle.text,
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                padding: '4px 10px',
                                                borderRadius: '6px'
                                            }}>
                                                {invoice.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '12px' }}>
                                            <span>PO: {invoice.poNumber}</span>
                                            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                                            <span>{invoice.shipmentDetails.origin} → {invoice.shipmentDetails.destination}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, margin: 0 }}>₹{invoice.totalAmount.toLocaleString()}</p>
                                    <p style={{ color: invoice.paymentStatus === 'PAID' ? '#00C805' : invoice.paymentStatus === 'OVERDUE' ? '#FF0000' : '#666', fontSize: '11px', fontWeight: 600, margin: '4px 0 0' }}>
                                        {invoice.paymentStatus.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            {invoice.remarks && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                                    <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                                        <strong style={{ color: '#FFFFFF' }}>Remarks:</strong> {invoice.remarks}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {paginatedInvoices.length === 0 && (
                    <div style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
                        <Geo3DDocument size={48} color="#333" />
                        <p style={{ color: '#FFFFFF', fontSize: '16px', margin: '16px 0 8px' }}>No invoices found</p>
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                            backgroundColor: currentPage === 1 ? '#1A1A1A' : '#333',
                            color: currentPage === 1 ? '#666' : '#FFFFFF',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 600
                        }}
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            style={{
                                backgroundColor: page === currentPage ? '#00C805' : '#1A1A1A',
                                color: page === currentPage ? '#000000' : '#FFFFFF',
                                border: 'none',
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 700
                            }}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                            backgroundColor: currentPage === totalPages ? '#1A1A1A' : '#333',
                            color: currentPage === totalPages ? '#666' : '#FFFFFF',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 600
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }} onClick={() => setSelectedInvoice(null)}>
                    <div style={{
                        backgroundColor: '#1A1A1A',
                        borderRadius: '24px',
                        width: '90%',
                        maxWidth: '700px',
                        maxHeight: '85vh',
                        overflow: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, margin: 0 }}>{selectedInvoice.invoiceNumber}</h2>
                                <p style={{ color: '#666', fontSize: '12px', margin: '4px 0 0' }}>Invoice Details & Timeline</p>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} style={{
                                backgroundColor: '#333',
                                border: 'none',
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}>×</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px' }}>
                            {/* Status & Amount */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <div>
                                    <span style={{
                                        backgroundColor: getStatusStyle(selectedInvoice.status).bg,
                                        color: getStatusStyle(selectedInvoice.status).text,
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        padding: '6px 14px',
                                        borderRadius: '8px'
                                    }}>
                                        {selectedInvoice.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 700, margin: 0 }}>₹{selectedInvoice.totalAmount.toLocaleString()}</p>
                                    <p style={{ color: '#666', fontSize: '12px', margin: '4px 0 0' }}>Total Amount</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Invoice Timeline</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                    {/* Progress Line */}
                                    <div style={{ position: 'absolute', top: '12px', left: '24px', right: '24px', height: '2px', backgroundColor: '#333' }}>
                                        <div style={{
                                            height: '100%',
                                            backgroundColor: '#00C805',
                                            width: selectedInvoice.status === 'PAID' ? '100%' :
                                                ['APPROVED', 'REJECTED', 'DISPUTED'].includes(selectedInvoice.status) ? '66%' : '33%'
                                        }} />
                                    </div>
                                    {getTimelineSteps(selectedInvoice).map((step, i) => (
                                        <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: step.done ? '#00C805' : '#333',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 8px'
                                            }}>
                                                {step.done && <span style={{ color: '#000', fontSize: '12px' }}>✓</span>}
                                            </div>
                                            <p style={{ color: step.done ? '#FFFFFF' : '#666', fontSize: '11px', fontWeight: 600, margin: 0 }}>{step.label}</p>
                                            {step.date && <p style={{ color: '#666', fontSize: '10px', margin: '2px 0 0' }}>{new Date(step.date).toLocaleDateString()}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ backgroundColor: '#0A0A0A', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px' }}>PO Number</p>
                                    <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInvoice.poNumber}</p>
                                </div>
                                <div style={{ backgroundColor: '#0A0A0A', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px' }}>Invoice Date</p>
                                    <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, margin: 0 }}>{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p>
                                </div>
                                <div style={{ backgroundColor: '#0A0A0A', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px' }}>Due Date</p>
                                    <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, margin: 0 }}>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                                </div>
                                <div style={{ backgroundColor: '#0A0A0A', borderRadius: '12px', padding: '16px' }}>
                                    <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px' }}>Route</p>
                                    <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInvoice.shipmentDetails.origin} → {selectedInvoice.shipmentDetails.destination}</p>
                                </div>
                            </div>

                            {/* Remarks / Rejection Reason */}
                            {selectedInvoice.remarks && (
                                <div style={{
                                    backgroundColor: selectedInvoice.status === 'REJECTED' ? '#2A1A1A' : selectedInvoice.status === 'DISPUTED' ? '#2A2A1A' : '#0A0A0A',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                    border: selectedInvoice.status === 'REJECTED' ? '1px solid #FF0000' : selectedInvoice.status === 'DISPUTED' ? '1px solid #FF6600' : 'none'
                                }}>
                                    <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                                        {selectedInvoice.status === 'REJECTED' ? 'Rejection Reason' : 'Remarks'}
                                    </p>
                                    <p style={{ color: '#FFFFFF', fontSize: '13px', margin: 0 }}>{selectedInvoice.remarks}</p>
                                    {selectedInvoice.approvedBy && (
                                        <p style={{ color: '#666', fontSize: '11px', margin: '8px 0 0' }}>— {selectedInvoice.approvedBy}</p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        const pdfId = selectedInvoice.invoiceNumber.replace(/\//g, '_');
                                        window.open(`http://localhost:5000/api/invoices/${pdfId}/view`, '_blank');
                                    }}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#00C805',
                                        color: '#000000',
                                        border: 'none',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    View PDF
                                </button>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    style={{
                                        backgroundColor: '#333',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        padding: '14px 24px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Invoice Modal */}
            {showAddInvoice && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    overflow: 'auto',
                    padding: '32px'
                }} onClick={() => setShowAddInvoice(false)}>
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '1100px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Create New Invoice</h2>
                            <button onClick={() => setShowAddInvoice(false)} style={{
                                backgroundColor: '#F5F5F5',
                                border: 'none',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <SmartInvoicing supplier={supplier} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
