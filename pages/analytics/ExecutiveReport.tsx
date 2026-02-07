import React, { useState, useEffect, useRef } from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    ComposedChart, ScatterChart, Scatter, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
    ArrowLeft, Download, Printer, Share2, Calendar, Filter, TrendingUp,
    TrendingDown, AlertTriangle, CheckCircle, Clock, Target, Zap,
    BarChart3, PieChart as PieChartIcon, Activity, Globe, Layers,
    Database, Shield, FileText, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface ExecutiveReportProps {
    onNavigate: (page: string) => void;
}

// Color Palette - Power BI inspired
const COLORS = {
    primary: '#0078D4',      // Microsoft Blue
    secondary: '#00C805',    // Green
    accent: '#FFB900',       // Yellow/Gold
    danger: '#D83B01',       // Red/Orange
    purple: '#8764B8',
    teal: '#00B294',
    navy: '#002050',
    black: '#000000',
    white: '#FFFFFF',
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    }
};

// Executive Report Data
const monthlySpendData = [
    { month: 'Jan', actual: 18.5, budget: 19.0, forecast: 18.5, variance: -2.6 },
    { month: 'Feb', actual: 19.2, budget: 19.5, forecast: 19.0, variance: -1.5 },
    { month: 'Mar', actual: 20.1, budget: 20.0, forecast: 19.8, variance: 0.5 },
    { month: 'Apr', actual: 19.8, budget: 20.5, forecast: 20.2, variance: -3.4 },
    { month: 'May', actual: 21.3, budget: 21.0, forecast: 20.8, variance: 1.4 },
    { month: 'Jun', actual: 20.5, budget: 21.5, forecast: 21.0, variance: -4.7 },
    { month: 'Jul', actual: 22.1, budget: 22.0, forecast: 21.5, variance: 0.5 },
    { month: 'Aug', actual: 21.8, budget: 22.5, forecast: 22.1, variance: -3.1 },
    { month: 'Sep', actual: 23.2, budget: 23.0, forecast: 22.8, variance: 0.9 },
    { month: 'Oct', actual: null, budget: 23.5, forecast: 23.4, variance: null },
    { month: 'Nov', actual: null, budget: 24.0, forecast: 24.1, variance: null },
    { month: 'Dec', actual: null, budget: 24.5, forecast: 24.8, variance: null },
];

const carrierPerformanceData = [
    { carrier: 'TCI Express', onTime: 98.2, cost: 92, quality: 96, volume: 2450 },
    { carrier: 'Blue Dart', onTime: 95.8, cost: 88, quality: 94, volume: 1890 },
    { carrier: 'Delhivery', onTime: 93.5, cost: 95, quality: 91, volume: 1650 },
    { carrier: 'Gati KWE', onTime: 91.2, cost: 89, quality: 88, volume: 1420 },
    { carrier: 'DTDC', onTime: 89.5, cost: 94, quality: 86, volume: 980 },
    { carrier: 'Safexpress', onTime: 94.1, cost: 86, quality: 92, volume: 1250 },
];

const regionData = [
    { region: 'North', spend: 45.2, invoices: 1245, savings: 3.2, compliance: 98 },
    { region: 'South', spend: 38.5, invoices: 1050, savings: 2.8, compliance: 96 },
    { region: 'West', spend: 52.8, invoices: 1580, savings: 4.1, compliance: 99 },
    { region: 'East', spend: 28.3, invoices: 820, savings: 1.9, compliance: 94 },
];

const anomalyTrendData = [
    { week: 'W1', detected: 12, resolved: 10, falsePositive: 2 },
    { week: 'W2', detected: 18, resolved: 15, falsePositive: 1 },
    { week: 'W3', detected: 8, resolved: 8, falsePositive: 0 },
    { week: 'W4', detected: 22, resolved: 19, falsePositive: 3 },
    { week: 'W5', detected: 15, resolved: 14, falsePositive: 1 },
    { week: 'W6', detected: 10, resolved: 10, falsePositive: 0 },
    { week: 'W7', detected: 14, resolved: 12, falsePositive: 2 },
    { week: 'W8', detected: 9, resolved: 9, falsePositive: 0 },
];

const invoiceProcessingData = [
    { status: 'Auto-Approved', value: 68, color: COLORS.secondary },
    { status: 'Pending Review', value: 18, color: COLORS.accent },
    { status: 'Flagged', value: 9, color: COLORS.danger },
    { status: 'Rejected', value: 5, color: COLORS.gray[400] },
];

const benfordData = [
    { digit: '1', expected: 30.1, actual: 28.5 },
    { digit: '2', expected: 17.6, actual: 18.2 },
    { digit: '3', expected: 12.5, actual: 13.1 },
    { digit: '4', expected: 9.7, actual: 9.2 },
    { digit: '5', expected: 7.9, actual: 8.5 },
    { digit: '6', expected: 6.7, actual: 6.9 },
    { digit: '7', expected: 5.8, actual: 5.4 },
    { digit: '8', expected: 5.1, actual: 5.8 },
    { digit: '9', expected: 4.6, actual: 4.4 },
];

const radarMetrics = [
    { metric: 'Cost Efficiency', value: 92 },
    { metric: 'On-Time Delivery', value: 96 },
    { metric: 'Invoice Accuracy', value: 98 },
    { metric: 'Carrier Compliance', value: 94 },
    { metric: 'Dispute Resolution', value: 88 },
    { metric: 'Process Automation', value: 85 },
];

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ onNavigate }) => {
    const [reportDate] = useState(new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }));
    const [selectedPeriod, setSelectedPeriod] = useState('YTD');
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // PDF download logic would go here
        alert('Generating PDF Report...');
    };

    // KPI Card Component
    const KPICard = ({ title, value, change, changeType, icon: Icon, subValue, color }: any) => (
        <div className="bg-white border border-gray-200 p-6 relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
                <div className="z-10">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
                    {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
                    {change !== undefined && (
                        <div className={`flex items-center mt-2 text-sm font-semibold ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
                            {changeType === 'positive' ? <ArrowUpRight size={16} className="mr-1" /> : changeType === 'negative' ? <ArrowDownRight size={16} className="mr-1" /> : null}
                            {change}
                        </div>
                    )}
                </div>
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${color || 'bg-blue-100'}`}>
                    <Icon size={28} className={color ? 'text-white' : 'text-blue-600'} />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>
    );

    // Section Header Component
    const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
        <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
                <Icon size={20} className="text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white" ref={reportRef}>
            {/* Header Bar */}
            <div className="bg-black text-white px-8 py-4 print:hidden sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => onNavigate('dashboard')}
                            className="p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Executive Analytics Report</h1>
                            <p className="text-xs text-gray-400">Freight Audit Control Tower • {reportDate}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 text-sm focus:outline-none"
                        >
                            <option value="MTD">Month to Date</option>
                            <option value="QTD">Quarter to Date</option>
                            <option value="YTD">Year to Date</option>
                            <option value="LY">Last Year</option>
                        </select>
                        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 transition-colors text-sm">
                            <Printer size={16} className="mr-2" /> Print
                        </button>
                        <button onClick={handleDownload} className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-500 transition-colors text-sm font-semibold">
                            <Download size={16} className="mr-2" /> Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="max-w-[1800px] mx-auto px-8 py-8 space-y-8">

                {/* Report Title - Print Header */}
                <div className="bg-white border border-gray-200 p-8 print:border-none">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-black flex items-center justify-center">
                                    <Globe size={24} className="text-green-500" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ATLAS Control Tower</h1>
                                    <p className="text-gray-500">Freight Audit & Analytics Platform</p>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mt-6">Executive Summary Report</h2>
                            <p className="text-gray-500 mt-1">Period: {selectedPeriod} • Generated: {reportDate}</p>
                        </div>
                        <div className="text-right">
                            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 font-semibold text-sm">
                                SYSTEM STATUS: OPTIMAL
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Report ID: RPT-{Date.now().toString(36).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-5 gap-4">
                    <KPICard
                        title="Total Freight Spend"
                        value="₹164.8M"
                        subValue="YTD Actual"
                        change="+12.4% vs LY"
                        changeType="negative"
                        icon={BarChart3}
                        color="bg-blue-600"
                    />
                    <KPICard
                        title="Cost Savings"
                        value="₹8.2M"
                        subValue="5.2% of Spend"
                        change="+₹1.8M vs Target"
                        changeType="positive"
                        icon={TrendingUp}
                        color="bg-green-600"
                    />
                    <KPICard
                        title="Invoices Processed"
                        value="4,695"
                        subValue="Automated: 68%"
                        change="99.2% Accuracy"
                        changeType="neutral"
                        icon={FileText}
                        color="bg-purple-600"
                    />
                    <KPICard
                        title="Anomalies Detected"
                        value="108"
                        subValue="Resolved: 97"
                        change="₹2.4M Prevented"
                        changeType="positive"
                        icon={Shield}
                        color="bg-orange-500"
                    />
                    <KPICard
                        title="Avg Processing Time"
                        value="4.2 hrs"
                        subValue="Target: 8 hrs"
                        change="-48% vs Manual"
                        changeType="positive"
                        icon={Clock}
                        color="bg-teal-600"
                    />
                </div>

                {/* Main Analytics Section */}
                <div className="grid grid-cols-3 gap-6">

                    {/* Spend Trend Chart */}
                    <div className="col-span-2 bg-white border border-gray-200 p-6">
                        <SectionHeader icon={BarChart3} title="Freight Spend Analysis" subtitle="Actual vs Budget vs AI Forecast" />
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={monthlySpendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} tickFormatter={(v) => `₹${v}M`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }}
                                        formatter={(value: any, name: string) => [`₹${value}M`, name.charAt(0).toUpperCase() + name.slice(1)]}
                                    />
                                    <Legend />
                                    <Bar dataKey="actual" name="Actual Spend" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="budget" name="Budget" stroke={COLORS.gray[400]} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                    <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke={COLORS.secondary} strokeWidth={3} dot={{ fill: COLORS.secondary, r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase">Total Budget</p>
                                <p className="text-xl font-bold text-gray-900">₹261.5M</p>
                            </div>
                            <div className="text-center border-l border-r border-gray-200">
                                <p className="text-xs text-gray-500 uppercase">YTD Actual</p>
                                <p className="text-xl font-bold text-gray-900">₹164.8M</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase">Forecast EOY</p>
                                <p className="text-xl font-bold text-green-600">₹258.2M</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Processing Breakdown */}
                    <div className="bg-white border border-gray-200 p-6">
                        <SectionHeader icon={PieChartIcon} title="Invoice Processing" subtitle="Status Distribution" />
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={invoiceProcessingData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {invoiceProcessingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => [`${value}%`, 'Percentage']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {invoiceProcessingData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-gray-700">{item.status}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Carrier Performance & Anomaly Detection */}
                <div className="grid grid-cols-2 gap-6">

                    {/* Carrier Performance Table */}
                    <div className="bg-white border border-gray-200 p-6">
                        <SectionHeader icon={Activity} title="Carrier Performance Matrix" subtitle="Top Carriers by Volume" />
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Carrier</th>
                                        <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Volume</th>
                                        <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">On-Time %</th>
                                        <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Cost Score</th>
                                        <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Quality</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carrierPerformanceData.map((carrier, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-2 font-medium text-gray-900">{carrier.carrier}</td>
                                            <td className="py-3 px-2 text-center text-gray-700">{carrier.volume.toLocaleString()}</td>
                                            <td className="py-3 px-2 text-center">
                                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${carrier.onTime >= 95 ? 'bg-green-100 text-green-800' : carrier.onTime >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                    {carrier.onTime}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${carrier.cost}%` }} />
                                                    </div>
                                                    <span className="ml-2 text-xs text-gray-600">{carrier.cost}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-center font-semibold text-gray-900">{carrier.quality}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Anomaly Detection Trend */}
                    <div className="bg-white border border-gray-200 p-6">
                        <SectionHeader icon={AlertTriangle} title="Anomaly Detection Trend" subtitle="Weekly Detection & Resolution" />
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={anomalyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="detected" name="Detected" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.3} strokeWidth={2} />
                                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.3} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 border-t border-gray-200 pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">108</p>
                                <p className="text-xs text-gray-500">Total Detected</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">97</p>
                                <p className="text-xs text-gray-500">Resolved</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">89.8%</p>
                                <p className="text-xs text-gray-500">Resolution Rate</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Analytics Section */}
                <div className="grid grid-cols-3 gap-6">

                    {/* Benford's Law Analysis */}
                    <div className="bg-white border border-gray-200 p-6">
                        <SectionHeader icon={Database} title="Benford's Law Analysis" subtitle="First Digit Distribution" />
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={benfordData} barGap={0}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis dataKey="digit" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip formatter={(value: any) => [`${value}%`]} />
                                    <Bar dataKey="expected" name="Expected" fill={COLORS.gray[300]} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="actual" name="Actual" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center text-green-800">
                                <CheckCircle size={16} className="mr-2" />
                                <span className="text-sm font-medium">Data conforms to expected distribution</span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">Chi-Square Test: p-value = 0.847 (No anomalies)</p>
                        </div>
                    </div>

                    {/* Operational Radar */}
                    <div className="bg-white border border-gray-200 p-6">
                        <SectionHeader icon={Target} title="Operational Excellence" subtitle="Multi-Dimensional Scoring" />
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarMetrics}>
                                    <PolarGrid stroke="#E5E7EB" />
                                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#374151', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                    <Radar name="Score" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.4} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-3xl font-bold text-gray-900">92.2</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Overall Excellence Score</p>
                        </div>
                    </div>

                    {/* Regional Performance */}
                    <div className="bg-white border border-gray-200 p-6">
                        <SectionHeader icon={Globe} title="Regional Distribution" subtitle="Spend & Savings by Zone" />
                        <div className="space-y-4 mt-4">
                            {regionData.map((region, index) => (
                                <div key={index} className="p-3 border border-gray-100 rounded hover:border-gray-300 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-gray-900">{region.region}</span>
                                        <span className="text-sm text-gray-500">{region.invoices} invoices</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">₹{region.spend}M</p>
                                            <p className="text-xs text-gray-500">Spend</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-green-600">₹{region.savings}M</p>
                                            <p className="text-xs text-gray-500">Savings</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-blue-600">{region.compliance}%</p>
                                            <p className="text-xs text-gray-500">Compliance</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-900 text-white p-6 print:bg-black">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold">ATLAS Freight Audit Control Tower</p>
                            <p className="text-sm text-gray-400">Powered by SequelString AI Engine</p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                            <p>Report Generated: {reportDate}</p>
                            <p>Confidential - For Internal Use Only</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExecutiveReport;
