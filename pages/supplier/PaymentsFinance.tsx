import React, { useState, useEffect } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { supplierInvoiceService, SupplierInvoice } from '../../services/supplierInvoiceService';
import { Download, ChevronRight, AlertCircle, CreditCard, DollarSign, RefreshCw } from 'lucide-react';
import { Geo3DWallet, Geo3DBank, Geo3DPieChart, Geo3DArrowUp, Geo3DArrowDown } from './components/3DGeometricIcons';

interface PaymentsFinanceProps {
    supplier: IndianSupplier;
}

export const PaymentsFinance: React.FC<PaymentsFinanceProps> = ({ supplier }) => {
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = () => {
        setLoading(true);
        const currentStats = supplierInvoiceService.getInvoiceStats();
        setStats(currentStats);

        // Simulate Ledger from Paid Invoices
        const allInvoices = supplierInvoiceService.getAllInvoices();
        const paidInvoices = allInvoices.filter(inv => inv.status === 'PAID');

        const ledger = paidInvoices.map(inv => ({
            id: inv.invoiceNumber,
            desc: `Payment for ${inv.poNumber}`,
            date: inv.paidDate || inv.dueDate,
            amount: inv.totalAmount,
            type: 'CREDIT',
            status: 'COMPLETED'
        }));

        setTransactions(ledger);
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleEarlyPay = () => {
        // Logic to request early pay on approved invoices
        const approvedInvoices = supplierInvoiceService.getInvoicesByStatus('APPROVED');
        let count = 0;
        approvedInvoices.forEach(inv => {
            if (supplierInvoiceService.requestEarlyPayment(inv.invoiceId)) {
                count++;
            }
        });

        if (count > 0) {
            alert(`Early payment requested for ${count} invoices!`);
            refreshData();
        } else {
            alert('No eligible invoices for early payment (Must be APPROVED).');
        }
    };

    if (loading || !stats) return <div className="p-8 text-center text-slate-400">Loading Financial Data...</div>;

    // Calculate Dynamic Early Pay Limit (e.g., 80% of Approved Invoices)
    const approvedAmount = supplierInvoiceService.getInvoicesByStatus('APPROVED').reduce((sum, inv) => sum + inv.totalAmount, 0);
    const earlyPayLimit = approvedAmount * 0.8;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        Payments & Finance
                    </h2>
                    <p className="text-slate-500 text-sm">Financial Control Tower. Track cash flow and request early payments.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleEarlyPay}
                        disabled={earlyPayLimit <= 0}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00C805] hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 transition-all"
                    >
                        <CreditCard size={16} /> Request Early Pay
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">
                        <Download size={16} /> Statement
                    </button>
                </div>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Outstanding Card */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
                        <Geo3DWallet size={80} color="#3B82F6" /> {/* Blue Wallet Tint */}
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Outstanding</p>
                    <h3 className="text-4xl font-black tracking-tight">₹{stats.pendingAmount.toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-3">
                        <span className="bg-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-300">
                            {stats.byStatus.pending + stats.byStatus.approved} Invoices
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-green-400">
                            <Geo3DArrowUp size={14} color="#00C805" /> Active
                        </span>
                    </div>
                </div>

                {/* Received Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <Geo3DBank size={80} color="#00C805" /> {/* Green Bank Tint */}
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Received (Total)</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.paidAmount.toLocaleString()}</h3>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#00C805] h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">{stats.byStatus.paid} Invoices Settled</p>
                </div>

                {/* Early Pay Eligibility */}
                <div className="bg-gradient-to-br from-[#00C805]/10 to-transparent border border-green-100 rounded-2xl p-6 relative">
                    <div className="absolute right-4 top-4">
                        <Geo3DPieChart size={32} color="#00C805" />
                    </div>
                    <p className="text-sm font-bold text-green-800 uppercase tracking-wider mb-2">Early Pay Limit</p>
                    <h3 className="text-3xl font-black text-green-700 tracking-tight">₹{earlyPayLimit.toLocaleString()}</h3>
                    <p className="text-xs text-green-800/70 font-medium mt-1 mb-4">Available for instant withdrawal @ 1.2% discount</p>
                    <button
                        onClick={handleEarlyPay}
                        disabled={earlyPayLimit <= 0}
                        className="w-full py-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:hover:bg-white rounded-lg text-sm font-bold transition-all"
                    >
                        Withdraw Now
                    </button>
                </div>
            </div>

            {/* Ledger & Transactions */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Geo3DBank size={20} className="text-slate-400" />
                        Transaction Ledger
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={refreshData} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {transactions.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">Transaction Details</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((txn, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1">
                                                    {txn.type === 'CREDIT' ?
                                                        <Geo3DArrowDown size={20} color="#00C805" /> :
                                                        <Geo3DArrowUp size={20} color="#DC2626" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{txn.id}</p>
                                                    <p className="text-xs text-slate-500">{txn.desc}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{txn.date}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-slate-900'} `}>
                                            {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                                Settled
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            No transactions found.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
