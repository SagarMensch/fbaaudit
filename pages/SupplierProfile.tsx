import React, { useState, useEffect } from 'react';
import { IndianSupplier, IndianSupplierService, IndianDocument, IndianRateLine, SupplierNotification } from '../services/supplierService';
// REMOVED: import { MOCK_INVOICES_NEW } from '../mock_invoices_clean';
import {
    Building2, Phone, Mail, MapPin, Calendar, TrendingUp, TrendingDown,
    FileText, Download, ExternalLink, AlertCircle, CheckCircle, Clock,
    Package, Truck, IndianRupee, Award, Shield, X, ChevronRight, Search,
    Filter, Bell, MessageSquare, Paperclip, Eye, ChevronDown, ChevronUp, Receipt
} from 'lucide-react';

interface SupplierProfileProps {
    supplierId: string;
    onClose: () => void;
}

export const SupplierProfile: React.FC<SupplierProfileProps> = ({ supplierId, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'rates' | 'performance' | 'notifications' | 'invoices'>('overview');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<IndianDocument | null>(null);
    const [supplierInvoices, setSupplierInvoices] = useState<any[]>([]);

    const supplier = IndianSupplierService.getSupplierById(supplierId);

    // Fetch invoices from API for this supplier
    useEffect(() => {
        if (supplier) {
            fetch('http://localhost:8000/api/invoices')
                .then(res => res.json())
                .then(data => {
                    const invoices = data.invoices || [];
                    // Filter invoices for this supplier
                    const filtered = invoices.filter((inv: any) =>
                        (inv.carrier || inv.vendor || '').includes(supplier.name) ||
                        (inv.carrier || inv.vendor || '').includes(supplier.fullName || '')
                    );
                    setSupplierInvoices(filtered);
                })
                .catch(err => console.error('Failed to fetch supplier invoices:', err));
        }
    }, [supplier]);

    if (!supplier) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md">
                    <h3 className="text-xl font-bold text-red-600 mb-4">Supplier Not Found</h3>
                    <p className="text-slate-600 mb-6">The requested supplier could not be found.</p>
                    <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const unreadNotifications = supplier.notifications.filter(n => !n.read).length;

    // Calculate freight with GST
    const calculateSampleFreight = (rate: IndianRateLine) => {
        const baseAmount = rate.baseRate * (rate.unit === 'kg' ? 100 : 1); // 100 kg sample
        const fuelAmount = (baseAmount * rate.fuelSurcharge) / 100;
        const subtotal = baseAmount + fuelAmount;
        const gstAmount = (subtotal * rate.gst) / 100;
        const total = subtotal + gstAmount;

        return {
            base: baseAmount,
            fuel: fuelAmount,
            subtotal,
            gst: gstAmount,
            total
        };
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-7xl w-full my-8 shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-t-xl">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className="text-5xl">{supplier.logo}</div>
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{supplier.fullName}</h2>
                                <p className="text-slate-300 text-sm mb-2">{supplier.description}</p>
                                <div className="flex gap-4 text-xs">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} /> {supplier.headquarters}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} /> Est. {supplier.founded}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Building2 size={12} /> {supplier.coverage.branches}+ Branches
                                    </span>
                                    {supplier.stockListed && (
                                        <span className="bg-green-600 px-2 py-0.5 rounded text-white font-bold">
                                            NSE/BSE Listed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6 border-t border-white/20 pt-4">
                        {[
                            { id: 'overview', label: 'Overview', icon: Building2 },
                            { id: 'documents', label: 'Documents', icon: FileText, badge: supplier.documents.length },
                            { id: 'rates', label: 'Rate Card', icon: IndianRupee },
                            { id: 'invoices', label: 'Invoices', icon: Receipt, badge: supplierInvoices.length },
                            { id: 'performance', label: 'Performance', icon: TrendingUp },
                            { id: 'notifications', label: 'Messages', icon: Bell, badge: unreadNotifications }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all relative ${activeTab === tab.id
                                    ? 'bg-white text-slate-900'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.badge && tab.badge > 0 && (
                                    <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <CheckCircle className="text-green-600" size={20} />
                                        <span className="text-xs text-green-600 font-bold">ON-TIME</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-900">{supplier.performance.onTimeDelivery}%</div>
                                    <div className="text-xs text-green-700">Delivery Performance</div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <IndianRupee className="text-blue-600" size={20} />
                                        <span className="text-xs text-blue-600 font-bold">CREDIT</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        ₹{(supplier.financial.creditLimit / 100000).toFixed(1)}L
                                    </div>
                                    <div className="text-xs text-blue-700">{supplier.financial.paymentTerms}</div>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Clock className="text-orange-600" size={20} />
                                        <span className="text-xs text-orange-600 font-bold">TRANSIT</span>
                                    </div>
                                    <div className="text-lg font-bold text-orange-900">{supplier.performance.avgTransitTime}</div>
                                    <div className="text-xs text-orange-700">Average Time</div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Award className="text-purple-600" size={20} />
                                        <span className="text-xs text-purple-600 font-bold">RATING</span>
                                    </div>
                                    <div className="text-2xl font-bold text-purple-900">
                                        {supplier.performance.customerSatisfaction}/5.0
                                    </div>
                                    <div className="text-xs text-purple-700">Customer Satisfaction</div>
                                </div>
                            </div>

                            {/* Service Coverage */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <MapPin size={20} className="text-slate-600" />
                                    Service Coverage
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm font-bold text-slate-600 mb-2">Regions Covered</p>
                                        <div className="flex flex-wrap gap-2">
                                            {supplier.coverage.regions.map((region, idx) => (
                                                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                                                    {region}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-600 mb-2">Strong Presence</p>
                                        <div className="flex flex-wrap gap-2">
                                            {supplier.coverage.strongIn.map((city, idx) => (
                                                <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                                                    {city}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-600 mb-2">Specialization</p>
                                        <div className="flex flex-wrap gap-2">
                                            {supplier.coverage.specialization.map((spec, idx) => (
                                                <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-600 mb-2">Network Size</p>
                                        <div className="text-sm text-slate-700">
                                            <div>📍 {supplier.coverage.pinCodes} PIN codes</div>
                                            <div>🏢 {supplier.coverage.branches}+ branches</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contacts */}
                            <div className="grid grid-cols-2 gap-4">
                                {supplier.contacts.map((contact, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{contact.name}</h4>
                                                <p className="text-xs text-slate-600">{contact.title}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${contact.type === 'primary' ? 'bg-blue-100 text-blue-800' :
                                                contact.type === 'escalation' ? 'bg-red-100 text-red-800' :
                                                    contact.type === 'operations' ? 'bg-green-100 text-green-800' :
                                                        'bg-purple-100 text-purple-800'
                                                }`}>
                                                {contact.type.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Mail size={14} />
                                                <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                                    {contact.email}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Phone size={14} />
                                                <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                                    {contact.phone}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Financial Details */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                                    <IndianRupee size={20} />
                                    Financial & Compliance Details
                                </h3>
                                <div className="grid grid-cols-3 gap-6 text-sm">
                                    <div>
                                        <p className="text-amber-700 font-bold mb-1">Payment Terms</p>
                                        <p className="text-amber-900">{supplier.financial.paymentTerms}</p>
                                    </div>
                                    <div>
                                        <p className="text-amber-700 font-bold mb-1">Credit Limit</p>
                                        <p className="text-amber-900 text-lg font-bold">
                                            ₹{(supplier.financial.creditLimit / 100000).toFixed(2)} Lakhs
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-amber-700 font-bold mb-1">Bank Details</p>
                                        <p className="text-amber-900">{supplier.financial.bankName}</p>
                                        <p className="text-xs text-amber-700">{supplier.financial.accountType}</p>
                                    </div>
                                    <div>
                                        <p className="text-amber-700 font-bold mb-1">GST Number</p>
                                        <p className="text-amber-900 font-mono text-xs">{supplier.financial.gstNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-amber-700 font-bold mb-1">PAN Number</p>
                                        <p className="text-amber-900 font-mono text-xs">{supplier.financial.panNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-amber-700 font-bold mb-1">TDS Rate</p>
                                        <p className="text-amber-900">{supplier.financial.tdsRate}% (Section 194C)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOCUMENTS TAB */}
                    {activeTab === 'documents' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Supplier Documents</h3>
                                <span className="text-sm text-slate-600">
                                    {supplier.documents.length} documents on file
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {supplier.documents.map(doc => (
                                    <div key={doc.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <FileText className="text-blue-600 mt-1" size={20} />
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900">{doc.name}</h4>
                                                    <div className="flex gap-4 mt-1 text-xs text-slate-600">
                                                        <span>Type: {doc.type.replace(/_/g, ' ').toUpperCase()}</span>
                                                        <span>Size: {doc.fileSize}</span>
                                                        <span>Uploaded: {new Date(doc.uploadedDate).toLocaleDateString('en-IN')}</span>
                                                        {doc.expiryDate && (
                                                            <span className={`font-bold ${new Date(doc.expiryDate) < new Date() ? 'text-red-600' :
                                                                new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-orange-600' :
                                                                    'text-green-600'
                                                                }`}>
                                                                Expires: {new Date(doc.expiryDate).toLocaleDateString('en-IN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Uploaded by: {doc.uploadedBy}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${doc.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    doc.status === 'expired' ? 'bg-red-100 text-red-800' :
                                                        'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {doc.status.toUpperCase()}
                                                </span>
                                                <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                                    <Download size={16} />
                                                </button>
                                                <button className="text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* INVOICES TAB */}
                    {activeTab === 'invoices' && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800">Invoice History</h3>
                                    <p className="text-sm text-slate-500">View and manage invoices for {supplier.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-bold uppercase">Total Outstanding</p>
                                    <p className="text-xl font-bold text-slate-900">
                                        ₹{supplierInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {supplierInvoices.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        No invoices found for this supplier.
                                    </div>
                                ) : (
                                    supplierInvoices.map(inv => (
                                        <div key={inv.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                        <Receipt size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-900">{inv.invoiceNumber}</h4>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                                inv.status.includes('APPROVED') ? 'bg-blue-100 text-blue-700' :
                                                                    inv.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {inv.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} /> {inv.date}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin size={12} /> {inv.origin} → {inv.destination}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-900">₹{inv.amount.toLocaleString('en-IN')}</p>
                                                        <p className="text-xs text-slate-500">Due: {inv.dueDate}</p>
                                                    </div>
                                                    <button className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Bar for Workflow */}
                                            {inv.workflowHistory && (
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                                        <span>Processing Progress</span>
                                                        <span>{Math.round((inv.workflowHistory.filter(w => w.status === 'APPROVED').length / 3) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${(inv.workflowHistory.filter(w => w.status === 'APPROVED').length / 3) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* RATES TAB */}
                    {activeTab === 'rates' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Note:</strong> All rates are in INR and exclude GST. Fuel surcharge and GST will be added to base freight.
                                    TDS @ 2% will be deducted as per Section 194C.
                                </p>
                            </div>

                            {supplier.rates.map((rate, idx) => {
                                const calculation = calculateSampleFreight(rate);
                                return (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 mb-1">
                                                    {rate.origin} → {rate.destination}
                                                </h4>
                                                <div className="flex gap-3 text-sm text-slate-600">
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                                                        {rate.mode}
                                                    </span>
                                                    {rate.weightSlab && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">
                                                            {rate.weightSlab}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-slate-900">
                                                    ₹{rate.baseRate}/{rate.unit}
                                                </div>
                                                <div className="text-xs text-slate-600">Base Rate</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 mb-2">Rate Breakdown</p>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Base Freight:</span>
                                                        <span className="font-bold">₹{rate.baseRate}/{rate.unit}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Fuel Surcharge:</span>
                                                        <span className="font-bold">{rate.fuelSurcharge}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">GST:</span>
                                                        <span className="font-bold">{rate.gst}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-slate-700 mb-2">
                                                    Sample Calculation (100 {rate.unit === 'kg' ? 'kg' : 'trip'})
                                                </p>
                                                <div className="space-y-1 text-sm bg-slate-50 p-3 rounded">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Base:</span>
                                                        <span>₹{calculation.base.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Fuel ({rate.fuelSurcharge}%):</span>
                                                        <span>₹{calculation.fuel.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-1">
                                                        <span className="text-slate-600">Subtotal:</span>
                                                        <span className="font-bold">₹{calculation.subtotal.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">GST ({rate.gst}%):</span>
                                                        <span>₹{calculation.gst.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-1 text-base">
                                                        <span className="font-bold text-slate-900">Total:</span>
                                                        <span className="font-bold text-green-600">₹{calculation.total.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {rate.additionalCharges.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <p className="text-sm font-bold text-slate-700 mb-2">Additional Charges</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {rate.additionalCharges.map((charge, cidx) => (
                                                        <div key={cidx} className="flex justify-between text-sm bg-amber-50 px-3 py-2 rounded">
                                                            <span className="text-amber-900">{charge.name}:</span>
                                                            <span className="font-bold text-amber-900">
                                                                ₹{charge.amount.toLocaleString('en-IN')}
                                                                {charge.unit && ` ${charge.unit}`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PERFORMANCE TAB */}
                    {activeTab === 'performance' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white border border-slate-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-slate-700">On-Time Delivery</h4>
                                        <TrendingUp className="text-green-600" size={20} />
                                    </div>
                                    <div className="text-4xl font-bold text-green-600 mb-2">
                                        {supplier.performance.onTimeDelivery}%
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{ width: `${supplier.performance.onTimeDelivery}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-slate-700">First Attempt Success</h4>
                                        <CheckCircle className="text-blue-600" size={20} />
                                    </div>
                                    <div className="text-4xl font-bold text-blue-600 mb-2">
                                        {supplier.performance.firstAttemptSuccess}%
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${supplier.performance.firstAttemptSuccess}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-slate-700">Damage Rate</h4>
                                        <Shield className="text-red-600" size={20} />
                                    </div>
                                    <div className="text-4xl font-bold text-red-600 mb-2">
                                        {supplier.performance.damageRate}%
                                    </div>
                                    <p className="text-xs text-slate-600">Lower is better</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                                    <h4 className="font-bold text-slate-900 mb-4">Transit Time</h4>
                                    <div className="text-2xl font-bold text-slate-900 mb-2">
                                        {supplier.performance.avgTransitTime}
                                    </div>
                                    <p className="text-sm text-slate-600">Average delivery time for metro-to-metro shipments</p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                                    <h4 className="font-bold text-slate-900 mb-4">POD Return Time</h4>
                                    <div className="text-2xl font-bold text-slate-900 mb-2">
                                        {supplier.performance.podReturnTime}
                                    </div>
                                    <p className="text-sm text-slate-600">Time to receive proof of delivery</p>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-purple-900">Customer Satisfaction</h4>
                                    <Award className="text-purple-600" size={24} />
                                </div>
                                <div className="flex items-end gap-4">
                                    <div className="text-5xl font-bold text-purple-900">
                                        {supplier.performance.customerSatisfaction}
                                    </div>
                                    <div className="text-2xl text-purple-700 mb-2">/ 5.0</div>
                                </div>
                                <div className="flex gap-1 mt-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <div key={star} className={`text-2xl ${star <= supplier.performance.customerSatisfaction ? 'text-yellow-500' : 'text-slate-300'
                                            }`}>
                                            ★
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Messages & Notifications</h3>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                                    <MessageSquare size={16} />
                                    New Message
                                </button>
                            </div>

                            {supplier.notifications.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Bell size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No messages yet</p>
                                </div>
                            ) : (
                                supplier.notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`border rounded-lg p-4 ${notif.read ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`p-2 rounded-lg ${notif.from === 'supplier' ? 'bg-green-100' : 'bg-blue-100'
                                                    }`}>
                                                    {notif.from === 'supplier' ? <Truck size={20} className="text-green-600" /> : <Building2 size={20} className="text-blue-600" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-slate-900">{notif.subject}</h4>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${notif.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                            notif.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                notif.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-slate-100 text-slate-800'
                                                            }`}>
                                                            {notif.priority.toUpperCase()}
                                                        </span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${notif.from === 'supplier' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {notif.from === 'supplier' ? 'FROM SUPPLIER' : 'FROM US'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 mb-2">{notif.message}</p>
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {new Date(notif.timestamp).toLocaleString('en-IN')}
                                                        </span>
                                                        {notif.attachments && notif.attachments.length > 0 && (
                                                            <span className="flex items-center gap-1 text-blue-600">
                                                                <Paperclip size={12} />
                                                                {notif.attachments.length} attachment(s)
                                                            </span>
                                                        )}
                                                    </div>
                                                    {notif.attachments && notif.attachments.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {notif.attachments.map((file, idx) => (
                                                                <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                                                                    <FileText size={12} />
                                                                    {file}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {!notif.read && (
                                                <button
                                                    onClick={() => IndianSupplierService.markNotificationAsRead(supplierId, notif.id)}
                                                    className="text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-bold"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 p-4 rounded-b-xl flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                        Contract Expiry: <span className="font-bold text-slate-900">
                            {new Date(supplier.contractExpiry).toLocaleDateString('en-IN')}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">
                            Export Data
                        </button>
                        <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
