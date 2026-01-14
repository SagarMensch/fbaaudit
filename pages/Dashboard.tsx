
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight, Activity, Zap, Shield, Globe } from 'lucide-react';
import { Invoice, Notification } from '../types';
import { FinanceTicker } from '../components/FinanceTicker';

interface DashboardProps {
    onNavigate: (page: string) => void;
    activePersona?: any;
    notifications?: Notification[];
    invoices?: Invoice[];
}

// --- 3D SOLID GEOMETRIC ICONS ---
const GeoCube = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="0" />
        <path d="M12 22v-10" stroke="currentColor" strokeWidth="2" />
        <path d="M2.5 7.5v10l9.5 5V12.5L2.5 7.5z" fillOpacity="0.8" />
        <path d="M21.5 7.5v10l-9.5 5V12.5l9.5-5z" fillOpacity="0.6" />
        <path d="M12 2l9.5 5-9.5 5-9.5-5L12 2z" fillOpacity="1" />
    </svg>
);

const GeoPyramid = ({ className, color = "currentColor" }: { className?: string, color?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color}>
        <path d="M12 2L2 19h20L12 2z" fillOpacity="0.8" />
        <path d="M12 2L2 19h10V2z" fillOpacity="1" />
        <path d="M12 2v17h10L12 2z" fillOpacity="0.6" />
    </svg>
);

const GeoHexagon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" fillOpacity="0.8" />
        <path d="M12 12l8.5-5M12 12v10M12 12L3.5 7" stroke="white" strokeWidth="1" />
        <path d="M12 2l8.5 5L12 12 3.5 7 12 2z" fillOpacity="1" />
    </svg>
);

const GeoSphere = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <circle cx="12" cy="12" r="10" fillOpacity="0.4" />
        <circle cx="12" cy="12" r="7" fillOpacity="0.7" />
        <circle cx="12" cy="12" r="4" fillOpacity="1" />
    </svg>
);

const GeoPrism = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2l10 6v10l-10 4-10-4V8l10-6z" fillOpacity="0.2" />
        <path d="M12 6l6 4v6l-6 4-6-4v-6l6-4z" fillOpacity="1" />
    </svg>
);

const GeoPie = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 12V2A10 10 0 0 1 22 12H12z" fillOpacity="1" />
        <path d="M12 12H2a10 10 0 0 1 10-10v10z" fillOpacity="0.6" />
        <path d="M12 12l-7.07 7.07A10 10 0 0 1 2 12h10z" fillOpacity="0.4" />
        <path d="M12 12H22a10 10 0 0 1-10 10V12z" fillOpacity="0.8" />
    </svg>
);

const GeoBar = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <rect x="2" y="10" width="4" height="12" fillOpacity="0.4" />
        <rect x="8" y="6" width="4" height="16" fillOpacity="0.7" />
        <rect x="14" y="14" width="4" height="8" fillOpacity="0.4" />
        <rect x="20" y="2" width="4" height="20" fillOpacity="1" />
    </svg>
);

const GeoPulseIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M3 12h3l3-9 4 18 3-9h5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

const GeoCoin = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <cylinder cx="12" cy="12" r="8" height="4" fillOpacity="1" />
        {/* Abstract 3D Coin representation */}
        <path d="M12 4c-4.42 0-8 1.79-8 4s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4z" fillOpacity="1" />
        <path d="M20 8v8c0 2.21-3.58 4-8 4s-8-1.79-8-4V8" fillOpacity="0.6" />
        <path d="M12 12c-4.42 0-8-1.79-8-4" fill="none" stroke="white" strokeWidth="0.5" />
    </svg>
);


export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, activePersona, notifications = [], invoices = [] }) => {
    const [showHelp, setShowHelp] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string, meaning: string, action: string } | null>(null);
    const [liveData, setLiveData] = useState({ requests: 1240, latency: 45, throughput: 99.9 });

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveData(prev => ({
                requests: prev.requests + Math.floor(Math.random() * 10),
                latency: 40 + Math.floor(Math.random() * 15),
                throughput: 99.0 + Math.random()
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleNav = (page: string) => {
        if (onNavigate) onNavigate(page);
    };

    const InfoButton = ({ onClick }: { onClick: () => void }) => (
        <button
            onClick={onClick}
            className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 hover:bg-black hover:text-white transition-colors text-xs font-bold"
            title="Click for analysis"
        >
            i
        </button>
    );

    const personaId = activePersona?.id || 'admin';

    // Shared Components - SOLID 3D GEOMETRIC STYLE
    const KpiCard = ({ title, value, subtext, icon: Icon, trend, onClick, accentColor = "text-[#00C805]" }: any) => (
        <div onClick={onClick} className="bg-white p-6 rounded-none border border-gray-200 shadow-sm hover:border-black transition-colors cursor-pointer group relative">
            <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                {/* 3D Icon Container */}
                <div className={`w-8 h-8 ${accentColor}`}>
                    <Icon className="w-full h-full drop-shadow-md" />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-black tracking-tight mb-1 font-mono">{value}</h3>
            <div className="flex items-center text-xs font-bold text-gray-500">
                {trend && (
                    <span className={`flex items-center mr-2 ${trend > 0 ? 'text-[#00C805]' : 'text-red-600'}`}>
                        {trend > 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                        {Math.abs(trend)}%
                    </span>
                )}
                {subtext}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>
    );

    const LiveIndicator = () => (
        <div className="flex items-center space-x-2 px-3 py-1 bg-white border border-gray-200">
            <div className="w-2 h-2 bg-[#00C805] rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-black uppercase tracking-wider">Live Updates</span>
        </div>
    );

    // ==================== KAAI BANSAL - LOGISTICS ====================
    if (personaId === 'lan') {
        const velocityData = [
            { time: '08:00', volume: 45, efficiency: 88 },
            { time: '10:00', volume: 62, efficiency: 92 },
            { time: '12:00', volume: 78, efficiency: 96 },
            { time: '14:00', volume: 85, efficiency: 94 },
            { time: '16:00', volume: 72, efficiency: 91 },
            { time: '18:00', volume: 55, efficiency: 89 },
        ];

        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <FinanceTicker bgColor="bg-black" textColor="text-[#00C805]" />
                <div className="p-8 max-w-[1600px] mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="flex items-center text-black font-bold text-xs uppercase tracking-widest mb-1">
                                <Activity size={12} className="mr-2" /> Logistics Control Tower
                            </div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">Supply Chain Operations</h1>
                        </div>
                        <LiveIndicator />
                    </div>

                    {/* KPI Grid - 3D Icons */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <KpiCard title="Active Shipments" value="1,247" subtext="vs 1,100 last week" trend={12.4} icon={GeoCube} onClick={() => handleNav('workbench')} />
                        <KpiCard title="On-Time Delivery" value="98.2%" subtext="Exceeds target" trend={2.1} icon={GeoHexagon} onClick={() => handleNav('cps')} />
                        <KpiCard title="Fleet Utilization" value="94%" subtext="Optimal efficiency" trend={5.3} icon={GeoPrism} onClick={() => handleNav('network')} />
                        <KpiCard title="Critical Anomalies" value="3" subtext="Requires attention" trend={-15} icon={GeoPyramid} accentColor="text-red-600" onClick={() => handleNav('aad')} />
                    </div>

                    {/* Main Charts */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="col-span-2 bg-white p-6 border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-black">Shipment Velocity & Efficiency</h3>
                                <InfoButton onClick={() => { }} />
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={velocityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 12, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 12, fontWeight: 600 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #000', borderRadius: '0px', color: '#000' }}
                                            itemStyle={{ color: '#000' }}
                                        />
                                        <Area type="monotone" dataKey="volume" stroke="#000" strokeWidth={2} fillOpacity={1} fill="#f3f4f6" />
                                        <Area type="monotone" dataKey="efficiency" stroke="#00C805" strokeWidth={2} fillOpacity={1} fill="#dcfce7" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white p-6 border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-black">Carrier Performance</h3>
                                <InfoButton onClick={() => { }} />
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={[
                                        { name: 'TCI Express', score: 98, fill: '#00C805' },
                                        { name: 'Blue Dart', score: 95, fill: '#16a34a' },
                                        { name: 'Delhivery', score: 88, fill: '#4ade80' },
                                        { name: 'Gati', score: 82, fill: '#86efac' },
                                    ]}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#000', fontWeight: 600, fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ border: '1px solid #000', borderRadius: '0px' }} />
                                        <Bar dataKey="score" radius={[0, 0, 0, 0]} barSize={24} background={{ fill: '#f9fafb' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== ZEYA KAPOOR - FINANCE ====================
    if (personaId === 'william') {
        const cashFlow = [
            { day: 'Mon', in: 4.2, out: -3.8 },
            { day: 'Tue', in: 5.1, out: -4.2 },
            { day: 'Wed', in: 3.9, out: -3.5 },
            { day: 'Thu', in: 6.2, out: -5.1 },
            { day: 'Fri', in: 5.8, out: -4.5 },
        ];

        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <FinanceTicker bgColor="bg-black" textColor="text-[#00C805]" />
                <div className="p-8 max-w-[1600px] mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="flex items-center text-black font-bold text-xs uppercase tracking-widest mb-1">
                                <Zap size={12} className="mr-2" /> Global Finance Hub
                            </div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">Financial Liquidity & Spend</h1>
                        </div>
                        <LiveIndicator />
                    </div>

                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <KpiCard title="Cash Position" value="₹245.8M" subtext="Strong liquidity" trend={8.4} icon={GeoCoin} onClick={() => handleNav('settlement')} />
                        <KpiCard title="Pending Invoices" value="42" subtext="₹12.4M value" trend={-5.2} icon={GeoPie} onClick={() => handleNav('workbench')} />
                        <KpiCard title="Cost Savings" value="₹3.2M" subtext="YTD achieved" trend={15.4} icon={GeoBar} onClick={() => handleNav('network')} />
                        <KpiCard title="Audit Flags" value="5" subtext="High risk items" trend={-2} icon={GeoPyramid} accentColor="text-red-600" onClick={() => handleNav('aad')} />
                    </div>

                    <div className="bg-white p-6 border border-gray-200 shadow-sm mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-black">Cash Flow Forecast (ARIMA Model)</h3>
                        </div>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cashFlow} stackOffset="sign">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#000', fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#000', fontWeight: 600 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #000', borderRadius: '0px', color: '#000' }} />
                                    <Bar dataKey="in" fill="#00C805" radius={[0, 0, 0, 0]} barSize={40} />
                                    <Bar dataKey="out" fill="#000000" radius={[0, 0, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== ENTERPRISE DIRECTOR (ATLAS) ====================
    if (personaId === 'atlas') {
        const globalSpend = [
            { month: 'Jan', spend: 18.5, prediction: 18.5 },
            { month: 'Feb', spend: 19.2, prediction: 19.0 },
            { month: 'Mar', spend: 20.1, prediction: 19.8 },
            { month: 'Apr', spend: 19.8, prediction: 20.2 },
            { month: 'May', spend: 21.3, prediction: 20.8 },
            { month: 'Jun', spend: 20.5, prediction: 21.0 },
            { month: 'Jul', spend: null, prediction: 21.5 },
            { month: 'Aug', spend: null, prediction: 22.1 },
        ];

        return (
            <div className="min-h-screen bg-white font-sans text-black">
                {/* Solid Black Enterprise Header */}
                <div className="bg-black text-white px-8 py-4">
                    <div className="max-w-[1800px] mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-[#00C805] flex items-center justify-center">
                                <Globe size={24} className="text-black" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Enterprise Control Tower</h1>
                                <div className="text-xs text-gray-400 font-mono flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-[#00C805] rounded-full animate-pulse"></span>
                                    <span>SYSTEM ONLINE • LATENCY {liveData.latency}MS • {liveData.requests.toLocaleString()} OPS/SEC</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <button onClick={() => handleNav('finance_terminal')} className="px-5 py-2 border border-white hover:bg-white hover:text-black transition-colors text-sm font-bold tracking-wide">
                                FINANCE TERMINAL
                            </button>
                            <button onClick={() => handleNav('rbac')} className="px-5 py-2 bg-[#00C805] text-black font-bold hover:bg-[#00E000] transition-colors text-sm tracking-wide">
                                MANAGE RBAC
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 max-w-[1800px] mx-auto space-y-8">

                    {/* Top Level Metrics - Solid Cards + 3D Icons */}
                    <div className="grid grid-cols-4 gap-6">
                        <KpiCard title="Total Spend Projection" value="₹245.8M" subtext="Tracking 3% below budget" trend={-3.2} icon={GeoBar} />
                        <KpiCard title="AI Invoices Processed" value="1,847" subtext="99.9% accuracy rate" trend={12.5} icon={GeoSphere} />
                        <KpiCard title="Supply Chain Health" value="98.4%" subtext="Network optimized" trend={1.2} icon={GeoHexagon} />
                        <KpiCard title="Active Exceptions" value="23" subtext="14 requiring intervention" trend={-5} icon={GeoPyramid} accentColor="text-red-600" />
                    </div>

                    {/* Central Command Visualizations - Solid Fills */}
                    <div className="grid grid-cols-3 gap-8 h-[500px]">

                        {/* 1. Predictive Spend Modeling */}
                        <div className="col-span-2 bg-white p-8 border border-gray-200">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-black tracking-tight">Predictive Spend Modeling</h3>
                                    <p className="text-sm text-gray-500 mt-1">AI-driven forecasting with 98% confidence interval</p>
                                </div>
                                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1">
                                    <div className="w-2 h-2 bg-black"></div>
                                    <span className="text-xs font-bold text-black">ACTUAL</span>
                                    <div className="w-2 h-2 bg-[#00C805]"></div>
                                    <span className="text-xs font-bold text-[#00C805]">AI PREDICTION</span>
                                </div>
                            </div>

                            <div className="h-[380px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={globalSpend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 12, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 12, fontWeight: 600 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '0px' }}
                                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                                        />
                                        <Area type="monotone" dataKey="spend" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="#e5e7eb" />
                                        <Line type="monotone" dataKey="prediction" stroke="#00C805" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#00C805', strokeWidth: 0 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Regional Heatmap / Distribution - Solid Colors */}
                        <div className="bg-black text-white p-8 border border-black flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold tracking-tight">Regional Optimization</h3>
                                <p className="text-xs text-gray-400 mt-1">Efficiency scoring by zone</p>
                            </div>

                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'North', value: 35, fill: '#00C805' },
                                                { name: 'South', value: 25, fill: '#ffffff' },
                                                { name: 'West', value: 20, fill: '#666666' },
                                                { name: 'East', value: 20, fill: '#333333' },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            <Cell fill="#00C805" />
                                            <Cell fill="#ffffff" />
                                            <Cell fill="#666666" />
                                            <Cell fill="#333333" />
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', border: 'none', color: '#000', borderRadius: '0px' }}
                                            itemStyle={{ color: '#000' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-3xl font-bold text-white">96%</span>
                                    <span className="text-[10px] text-gray-400 tracking-widest uppercase">Efficiency</span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">North Optimization</span>
                                    <span className="font-bold text-[#00C805]">98.2%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">South Optimization</span>
                                    <span className="font-bold text-white">94.5%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Cross-Border</span>
                                    <span className="font-bold text-white">99.1%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Ticker / Action Bar */}
                    <div className="bg-white p-4 flex items-center justify-between border border-gray-200">
                        <div className="flex items-center space-x-6 overflow-hidden">
                            <div className="flex items-center space-x-2 text-sm font-bold text-black border-r border-gray-200 pr-6">
                                <Zap size={16} className="text-[#00C805]" />
                                <span>SYSTEM ALERTS</span>
                            </div>
                            <div className="flex items-center space-x-8 text-xs font-mono text-gray-500 animate-marquee whitespace-nowrap">
                                <span>• MUMBAI HUB: CAPACITY 84% (OPTIMAL)</span>
                                <span>• PAYMENT BATCH #4022 PROCESSED</span>
                                <span>• NEW VENDOR ONBOARDING: MAERSK LINE</span>
                                <span>• 12 EXCEPTIONS RESOLVED AUTOMATICALLY</span>
                            </div>
                        </div>
                        <button onClick={() => {
                            import('../services/pdfGenerator').then(({ pdfGenerator }) => {
                                const blob = pdfGenerator.generateExecutiveReport();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `ATLAS_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                            });
                        }} className="flex items-center text-xs font-bold text-black bg-white border border-gray-200 px-4 py-2 hover:bg-black hover:text-white transition-colors">
                            Generate Executive Report <ArrowRight size={14} className="ml-2" />
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    // ==================== SYSTEM ADMIN (DEFAULT) ====================
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="text-center py-20">
                <h1 className="text-3xl font-bold text-black">System Administrator</h1>
                <p className="text-gray-500 mt-2">Please switch to Enterprise Director persona for the Full Command Center experience.</p>
                <button onClick={() => { }} className="mt-8 px-6 py-3 bg-black text-white rounded-none font-bold">Manage Roles</button>
            </div>
        </div>
    );
};
