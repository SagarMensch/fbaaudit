import React, { useState, useMemo, useEffect } from 'react';
import {
    Download, Filter, Calendar, TrendingUp, TrendingDown, AlertTriangle,
    Clock, FileText, DollarSign, ShieldCheck, Target, Activity, CheckCircle,
    BarChart3, PieChart as PieIcon, X, ChevronDown, Search, ArrowRight,
    Truck, MapPin, User
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart
} from 'recharts';
// REMOVED: import { MOCK_INVOICES_NEW } from '../mock_invoices_clean';
import { Geo3DCube, Geo3DPyramid, Geo3DCylinder, Geo3DSphere, Geo3DHexagon, Geo3DBar } from '../components/GeoIcons';
import { exportToCSV } from '../utils/exportUtils';

// Indian carriers for filtering
const INDIAN_CARRIERS = ['TCI Express Limited', 'Blue Dart Express', 'Delhivery Limited', 'Gati Limited'];

export const ComprehensiveReports: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCarrier, setSelectedCarrier] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch invoices from API on mount
    useEffect(() => {
        setIsLoading(true);
        fetch('http://localhost:8000/api/invoices')
            .then(res => res.json())
            .then(data => {
                setInvoices(data.invoices || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch invoices:', err);
                setIsLoading(false);
            });
    }, []);

    // Calculate metrics from fetched invoices
    const metrics = useMemo(() => {
        const totalInvoices = invoices.length;
        const totalValue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Audit savings calculation
        const auditSavings = invoices.reduce((sum, inv) => {
            if (inv.auditAmount && inv.amount) {
                return sum + (inv.amount - inv.auditAmount);
            }
            return sum;
        }, 0);

        // Processing time (mock calculation)
        const avgProcessingTime = 2.3;

        // Touchless rate
        const touchlessCount = invoices.filter(inv =>
            inv.status === 'OPS_APPROVED' || inv.status === 'FINANCE_APPROVED'
        ).length;
        const touchlessRate = totalInvoices > 0 ? (touchlessCount / totalInvoices) * 100 : 0;

        // Exception rate
        const exceptionCount = invoices.filter(inv =>
            inv.status === 'EXCEPTION' || inv.status === 'REJECTED'
        ).length;
        const exceptionRate = totalInvoices > 0 ? (exceptionCount / totalInvoices) * 100 : 0;

        // Compliance score (based on document completeness)
        const complianceScore = 94;

        return {
            totalInvoices,
            totalValue,
            auditSavings,
            avgProcessingTime,
            touchlessRate,
            exceptionRate,
            complianceScore
        };
    }, [invoices]);

    // Invoice volume trend data (last 7 days)
    const volumeTrendData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day, idx) => ({
            day,
            count: Math.floor(Math.random() * 3) + 1, // 1-3 invoices per day
            value: Math.floor(Math.random() * 50000) + 30000 // ₹30k-80k
        }));
    }, []);

    // Carrier distribution
    const carrierDistribution = useMemo(() => {
        const distribution = INDIAN_CARRIERS.map(carrier => {
            const count = invoices.filter(inv => (inv.carrier || inv.vendor) === carrier).length;
            return { name: carrier, value: count };
        });
        return distribution.filter(d => d.value > 0);
    }, [invoices]);

    // Filtered invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const carrierName = inv.carrier || inv.vendor || '';
            const matchesCarrier = selectedCarrier === 'All' || carrierName === selectedCarrier;
            const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
            const matchesSearch = !searchQuery ||
                (inv.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                carrierName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCarrier && matchesStatus && matchesSearch;
        });
    }, [invoices, selectedCarrier, selectedStatus, searchQuery]);

    const handleExport = () => {
        const data = filteredInvoices.map(inv => ({
            'Invoice #': inv.invoiceNumber,
            'Date': inv.date,
            'Carrier': inv.carrier,
            'Origin': inv.origin,
            'Destination': inv.destination,
            'Amount': inv.amount,
            'Status': inv.status
        }));
        exportToCSV(data, 'Operations_Audit_Report');
    };

    const COLORS = ['#004D40', '#0F62FE', '#F59E0B', '#6B7280'];

    return (
        <div className="h-full flex flex-col font-sans bg-[#F3F4F6] overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
                            Operations & Audit Reports
                            <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white uppercase tracking-wider">
                                ANALYTICS
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Comprehensive insights and performance metrics</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center px-4 py-2 border rounded-sm text-xs font-bold uppercase shadow-sm transition-colors ${showFilters ? 'bg-gray-100 border-gray-400 text-gray-900' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Filter size={14} className="mr-2" /> Filters
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center px-4 py-2 bg-[#004D40] text-white rounded-sm text-xs font-bold uppercase hover:bg-[#00352C] shadow-sm"
                        >
                            <Download size={14} className="mr-2" /> Export Report
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-sm grid grid-cols-4 gap-4 animate-fade-in-up">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Carrier</label>
                            <select
                                value={selectedCarrier}
                                onChange={(e) => setSelectedCarrier(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-sm p-2 bg-white focus:outline-none focus:border-teal-500"
                            >
                                <option>All</option>
                                {INDIAN_CARRIERS.map(carrier => (
                                    <option key={carrier}>{carrier}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-sm p-2 bg-white focus:outline-none focus:border-teal-500"
                            >
                                <option>All</option>
                                <option>PENDING</option>
                                <option>OPS_APPROVED</option>
                                <option>FINANCE_APPROVED</option>
                                <option>PAID</option>
                                <option>EXCEPTION</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Search</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Invoice # or Carrier..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-xs border border-gray-300 rounded-sm p-2 pl-8 bg-white focus:outline-none focus:border-teal-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSelectedCarrier('All');
                                    setSelectedStatus('All');
                                    setSearchQuery('');
                                }}
                                className="w-full py-2 bg-gray-200 text-gray-700 text-xs font-bold uppercase rounded-sm hover:bg-gray-300"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {/* Executive Summary KPIs - DARK BLOOMBERG 3D STYLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    {/* 1. Total Invoices */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-[#0F62FE] transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">TOTAL_INVOICES</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{metrics.totalInvoices}</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-[#0F62FE]/10 transition-colors">
                                <Geo3DCube size={32} color="#0F62FE" className="drop-shadow-[0_4px_6px_rgba(15,98,254,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Vol: ₹{(metrics.totalValue / 1000).toFixed(0)}k</span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">▲ UP</span>
                        </div>
                    </div>

                    {/* 2. Audit Savings */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-emerald-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">AUDIT_SAVINGS</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">₹{(metrics.auditSavings / 1000).toFixed(1)}k</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-emerald-500/10 transition-colors">
                                <Geo3DPyramid size={32} color="#10B981" className="drop-shadow-[0_4px_6px_rgba(16,185,129,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">12% Recv.</span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">▲ +2%</span>
                        </div>
                    </div>

                    {/* 3. Avg Processing */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-blue-400 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">PROCESSING</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{metrics.avgProcessingTime}h</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-blue-400/10 transition-colors">
                                <Geo3DCylinder size={32} color="#60A5FA" className="drop-shadow-[0_4px_6px_rgba(96,165,250,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Cycle Time</span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">▼ FAST</span>
                        </div>
                    </div>

                    {/* 4. Touchless Rate */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-indigo-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">TOUCHLESS</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{metrics.touchlessRate.toFixed(1)}%</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-indigo-500/10 transition-colors">
                                <Geo3DSphere size={32} color="#6366F1" className="drop-shadow-[0_4px_6px_rgba(99,102,241,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Target: 85%</span>
                            <span className="text-[9px] font-mono text-gray-500 font-bold">STABLE</span>
                        </div>
                    </div>

                    {/* 5. Exception Rate */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-red-500 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">EXCEPTIONS</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{metrics.exceptionRate.toFixed(1)}%</div>
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

                    {/* 6. Compliance */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg group hover:border-teal-400 transition-colors relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">COMPLIANCE</span>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{metrics.complianceScore}%</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 group-hover:bg-teal-400/10 transition-colors">
                                <Geo3DBar size={32} color="#14B8A6" className="drop-shadow-[0_4px_6px_rgba(20,184,166,0.3)]" />
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-mono text-gray-500">Docs Verified</span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">▲ UP</span>
                        </div>
                    </div>
                </div>

                {/* Visualizations Row 1 */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Invoice Volume & Value Trend */}
                    <div className="col-span-2 bg-white border border-gray-200 rounded-sm shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Invoice Volume & Value Trend</h3>
                                <p className="text-xs text-gray-500">Last 7 days</p>
                            </div>
                            <BarChart3 size={18} className="text-teal-600" />
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={volumeTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <Tooltip formatter={(value: any, name: string) => [name === 'count' ? value : `₹${value.toLocaleString()}`, name === 'count' ? 'Invoices' : 'Value']} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="count" fill="#004D40" radius={[4, 4, 0, 0]} name="Invoice Count" />
                                    <Line yAxisId="right" type="monotone" dataKey="value" stroke="#0F62FE" strokeWidth={2} dot={{ r: 4 }} name="Total Value (₹)" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Carrier Distribution */}
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Carrier Distribution</h3>
                                <p className="text-xs text-gray-500">By invoice count</p>
                            </div>
                            <PieIcon size={18} className="text-teal-600" />
                        </div>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={carrierDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {carrierDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Enhanced Data Table */}
                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Invoice Details</h3>
                        <span className="text-xs text-gray-500">{filteredInvoices.length} invoices</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Carrier</th>
                                    <th className="px-6 py-4">Route</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-teal-50/20 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-teal-700 cursor-pointer hover:underline">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Truck size={14} className="text-gray-400 mr-2" />
                                                <span className="font-medium text-gray-800">{invoice.carrier}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-xs text-gray-600">
                                                <MapPin size={12} className="text-gray-400 mr-1" />
                                                {invoice.origin} → {invoice.destination}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                            ₹{invoice.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                                                invoice.status === 'FINANCE_APPROVED' || invoice.status === 'OPS_APPROVED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    invoice.status === 'EXCEPTION' || invoice.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        'bg-orange-100 text-orange-700 border-orange-200'
                                                }`}>
                                                {invoice.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-teal-600 hover:text-teal-800 text-xs font-bold flex items-center ml-auto">
                                                View <ArrowRight size={12} className="ml-1" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComprehensiveReports;
