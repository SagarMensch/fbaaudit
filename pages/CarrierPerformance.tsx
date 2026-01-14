// Updated: 2025-12-28 19:06 - Premium 3D Ribbon Chart
import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    Search, Filter, Download, Sliders, MapPin, Truck, AlertTriangle, ShieldCheck, Activity, Box
} from 'lucide-react';
import { DocumentViewer } from '../components/DocumentViewer';

// --- HYPER-GEOMETRIC ICONS (DARK MODE VARIANTS) ---

const SvgDefinitions = () => (
    <svg width="0" height="0">
        <defs>
            <pattern id="grid-pattern-sm" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#262626" strokeWidth="0.5" opacity="0.1" />
            </pattern>
            <pattern id="hatch-pattern-dark" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            </pattern>
        </defs>
    </svg>
);

const DarkHypnoTruck = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M46 32 L58 38 V50 L46 44 V32 Z" fill="#0f62fe" stroke="#ffffff" strokeWidth="2" />
        <path d="M46 32 L34 38 V50 L46 44 Z" fill="#0353e9" stroke="#ffffff" strokeWidth="2" />
        <path d="M46 20 L58 26 L46 32 L34 26 Z" fill="#161616" stroke="#ffffff" strokeWidth="2" />
        <path d="M46 22 L54 26 L46 30 L38 26 Z" fill="url(#hatch-pattern-dark)" opacity="0.8" />
        <path d="M34 26 L10 14 L34 2 L58 14 L46 20" stroke="#ffffff" strokeWidth="2" fill="#262626" />
        <path d="M10 14 V38 L34 50 V26 Z" fill="#393939" stroke="#ffffff" strokeWidth="2" />
        <path d="M58 14 V26" stroke="#ffffff" strokeWidth="2" />
        <circle cx="20" cy="46" r="4" fill="#ffffff" stroke="#ffffff" strokeWidth="2" />
        <circle cx="20" cy="46" r="1" fill="#161616" />
        <circle cx="48" cy="52" r="4" fill="#ffffff" stroke="#ffffff" strokeWidth="2" />
        <circle cx="48" cy="52" r="1" fill="#161616" />
    </svg>
);

const DarkHypnoShield = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M32 4 L56 12 L56 32 C56 48 44 58 32 62 V4 Z" fill="#00C805" stroke="#ffffff" strokeWidth="2" />
        <path d="M32 4 L8 12 L8 32 C8 48 20 58 32 62 V4 Z" fill="#005f02" stroke="#ffffff" strokeWidth="2" />
        <path d="M32 4 C32 4 48 10 48 32 C48 42 38 52 32 56" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
        <path d="M32 4 C32 4 16 10 16 32 C16 42 26 52 32 56" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
        <rect x="28" y="24" width="8" height="16" fill="#ffffff" stroke="#161616" strokeWidth="2" />
        <path d="M28 24 L36 40" stroke="#161616" strokeWidth="1" />
        <path d="M36 24 L28 40" stroke="#161616" strokeWidth="1" />
    </svg>
);

const DarkHypnoWarning = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M32 4 L58 48 H6 L32 4 Z" fill="#262626" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
        <path d="M28 40 L36 40" stroke="#fa4d56" strokeWidth="2" />
        <path d="M32 14 V36" stroke="#fa4d56" strokeWidth="6" />
        <rect x="29" y="44" width="6" height="6" fill="#fa4d56" />
        <path d="M58 48 L62 52 H10 L6 48" stroke="#ffffff" strokeWidth="1" fill="#161616" />
    </svg>
);

const DarkHypnoBox = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M32 10 L54 22 V42 L32 54 L10 42 V22 L32 10 Z" fill="#262626" stroke="#ffffff" strokeWidth="2" />
        <path d="M32 10 V32 L54 22" stroke="#ffffff" strokeWidth="2" />
        <path d="M32 32 L10 22" stroke="#ffffff" strokeWidth="2" />
        <path d="M32 32 V54" stroke="#ffffff" strokeWidth="2" />
        <circle cx="32" cy="22" r="4" fill="#ffffff" />
    </svg>
);

const HyperTruck = ({ size = 64, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M46 32 L58 38 V50 L46 44 V32 Z" fill="#0f62fe" stroke="#161616" strokeWidth="2" />
        <path d="M46 32 L34 38 V50 L46 44 Z" fill="#0353e9" stroke="#161616" strokeWidth="2" />
        <path d="M46 20 L58 26 L46 32 L34 26 Z" fill="#ffffff" stroke="#161616" strokeWidth="2" />
        <path d="M46 22 L54 26 L46 30 L38 26 Z" fill="url(#hatch-pattern-dark)" opacity="0.8" />
        <path d="M34 26 L10 14 L34 2 L58 14 L46 20" stroke="#161616" strokeWidth="2" fill="#ffffff" />
        <path d="M10 14 V38 L34 50 V26 Z" fill="#e0e0e0" stroke="#161616" strokeWidth="2" />
        <path d="M58 14 V26" stroke="#161616" strokeWidth="2" />
        <circle cx="20" cy="46" r="4" fill="#161616" stroke="#ffffff" strokeWidth="2" />
        <circle cx="48" cy="52" r="4" fill="#161616" stroke="#ffffff" strokeWidth="2" />
    </svg>
);

// --- MOCK DATA ---
const ESCALATION_DATA = [
    { id: 'ESC-001', carrier: 'TCI Express', type: 'Delay', severity: 'High', status: 'Open', date: '2024-03-10' },
    { id: 'ESC-002', carrier: 'VRL Logistics', type: 'Damage', severity: 'Critical', status: 'In-Prog', date: '2024-03-11' },
    { id: 'ESC-003', carrier: 'Safexpress', type: 'Billing', severity: 'Medium', status: 'Closed', date: '2024-03-09' },
];

const CAR_DATA_MOCK = [
    { id: 1, name: 'TCI Express Limtied', tier: 'Platinum', score: 94, trend: 'up', od: 98, de: 0.2, tat: 2.1, vol: '1.2Cr', benford: 'PASS' },
    { id: 2, name: 'VRL Logistics', tier: 'Gold', score: 88, trend: 'stable', od: 92, de: 0.8, tat: 3.5, vol: '85L', benford: 'PASS' },
    { id: 3, name: 'Safexpress', tier: 'Gold', score: 86, trend: 'down', od: 89, de: 1.1, tat: 2.8, vol: '92L', benford: 'PASS' },
    { id: 4, name: 'Blue Dart Express', tier: 'Platinum', score: 91, trend: 'up', od: 96, de: 0.1, tat: 1.5, vol: '2.5Cr', benford: 'PASS' },
    { id: 5, name: 'Gati KWE', tier: 'Silver', score: 78, trend: 'down', od: 82, de: 2.5, tat: 4.2, vol: '45L', benford: 'PASS' },
    // BENFORD'S LAW HIGH RISK VENDOR
    { id: 6, name: 'Quick Haul Logistics', tier: 'Silver', score: 52, trend: 'down', od: 75, de: 1.8, tat: 5.1, vol: '28L', benford: 'HIGH_RISK' },
];

export const CarrierPerformance: React.FC = () => {
    const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
    const [viewDocName, setViewDocName] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const openProfile = (carrier: any) => {
        const cleanName = carrier.name.replace(/ /g, '_').replace(/\+/g, '').replace(/\//g, '_');
        const filename = `PROFILE_${cleanName}.pdf`;
        setViewDocName(`${carrier.name} - Profile`);
        setViewDocUrl(`http://localhost:5000/api/files/view?filename=${filename}`);
    };

    // --- REAL R ANALYTICS INTEGRATION ---
    const [rData, setRData] = useState<any>(null);

    useEffect(() => {
        const fetchRScores = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/r/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: CAR_DATA_MOCK })
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success) setRData(json.data);
                }
            } catch (e) { console.error("R Scoring error", e); }
        };
        fetchRScores();
    }, []);

    const displayData = useMemo(() => {
        if (!rData || !rData.scores) return CAR_DATA_MOCK;
        return CAR_DATA_MOCK.map(c => ({
            ...c,
            score: rData.scores[c.id] ? Math.round(rData.scores[c.id]) : c.score,
            // Use grade from R if available
            grade: rData.grades && rData.grades[c.id] ? rData.grades[c.id] : 'B'
        }));
    }, [rData]);

    const filteredCarriers = useMemo(() => {
        return displayData.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, displayData]);

    return (
        <div className="p-8 h-full flex flex-col bg-white text-[#161616] overflow-y-auto relative min-h-screen">
            <SvgDefinitions />

            {/* HEADER - COMPACT */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-[#161616] pb-4">
                <div className="flex items-center gap-6">
                    <HyperTruck size={56} />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-[#161616]">Carrier Hub</h1>
                        <p className="text-sm text-[#0f62fe] font-bold mt-1 uppercase tracking-widest pl-1 border-l-4 border-[#0f62fe] flex items-center gap-3">
                            <span className="text-white bg-black px-2 py-0.5 text-[10px] tracking-wider border border-black">SEM + FACTOR ANALYSIS</span>
                            360° Partner Matrix
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <div className="text-right mr-4">
                        <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Active</div>
                        <div className="text-lg font-bold text-[#161616] font-sans">142</div>
                    </div>
                    <button className="flex items-center text-[#161616] border-2 border-[#161616] px-4 py-2 hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_#161616] transition-all bg-white text-xs">
                        <Download size={14} className="mr-2" /> EXPORT
                    </button>
                    <button className="p-2 border-2 border-[#161616] hover:bg-[#161616] hover:text-white transition-all"><Filter size={16} /></button>
                </div>
            </div>

            {/* KPI STRIP - COMPACT DARK CARDS */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'AVG OTD SCORE', val: '94.2%', trend: '+2.1%', icon: <DarkHypnoTruck size={36} />, color: '#0f62fe' },
                    { label: 'DAMAGE RATIO', val: '0.42%', trend: '-0.1%', icon: <DarkHypnoWarning size={36} />, color: '#fa4d56' },
                    { label: 'RISK EXPOSURE', val: 'LOW', trend: 'STABLE', icon: <DarkHypnoShield size={36} />, color: '#00C805' },
                    { label: 'ACTIVE FLEET', val: '1,240', trend: 'UNITS', icon: <DarkHypnoBox size={36} />, color: '#ffffff' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-[#161616] text-white p-4 relative group transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#888]">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold uppercase mb-1 text-[#888] tracking-widest border-b border-[#333] inline-block pb-0.5">
                                    {kpi.label}
                                </p>
                                <h2 className="text-3xl font-bold tracking-tighter text-white">{kpi.val}</h2>
                            </div>
                            <div className="opacity-100">{kpi.icon}</div>
                        </div>
                        <div className="flex items-center text-[10px] font-bold font-mono relative z-10">
                            <span style={{ color: kpi.color }} className="mr-2 px-1.5 py-0.5 bg-[#262626] border border-[#333]">{kpi.trend}</span>
                            <span className="opacity-50 uppercase tracking-tight text-[#ccc]">vs Last Period</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* SPLIT LAYOUT */}
            <div className="grid grid-cols-12 gap-8 mb-8">
                {/* PREMIUM 3D RIBBON CHART */}
                <div className="col-span-8 bg-white border-2 border-[#161616] p-6 relative overflow-hidden">
                    <div className="absolute inset-0 z-0" style={{
                        backgroundImage: 'linear-gradient(0deg, #f4f4f4 1px, transparent 1px), linear-gradient(90deg, #f4f4f4 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        opacity: 0.4
                    }}></div>

                    <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider mb-6 flex items-center relative z-10">
                        <Activity size={16} className="mr-3 text-[#0f62fe]" /> Performance Trajectory
                    </h3>

                    <div className="h-[280px] w-full relative z-10">
                        <svg width="100%" height="100%" viewBox="0 0 600 280" preserveAspectRatio="xMidYMid meet">
                            <defs>
                                <linearGradient id="ribbon-top" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#4ca0ff" />
                                    <stop offset="100%" stopColor="#0f62fe" />
                                </linearGradient>
                                <linearGradient id="ribbon-side" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#0353e9" />
                                    <stop offset="100%" stopColor="#001d6c" />
                                </linearGradient>
                                <filter id="shadow">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                    <feOffset dx="2" dy="4" />
                                    <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
                                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>

                            <g opacity="0.15">
                                <line x1="50" y1="220" x2="550" y2="220" stroke="#161616" strokeDasharray="4 4" />
                                <line x1="50" y1="165" x2="550" y2="165" stroke="#161616" strokeDasharray="4 4" />
                                <line x1="50" y1="110" x2="550" y2="110" stroke="#161616" strokeDasharray="4 4" />
                                <line x1="50" y1="55" x2="550" y2="55" stroke="#161616" strokeDasharray="4 4" />
                            </g>

                            <g fontSize="10" fontFamily="monospace" fill="#888">
                                <text x="35" y="225" textAnchor="end">0</text>
                                <text x="35" y="170" textAnchor="end">25</text>
                                <text x="35" y="115" textAnchor="end">50</text>
                                <text x="35" y="60" textAnchor="end">75</text>
                                <text x="35" y="30" textAnchor="end">100</text>
                            </g>

                            <g filter="url(#shadow)">
                                <path d="M 80 57.8 Q 120 42.2 160 42.2 Q 200 68.6 240 49 Q 280 30.6 320 49 Q 360 68.6 400 53.8 Q 440 38.2 480 34.2 L 500 254.2 L 60 254.2 Z" fill="url(#ribbon-side)" opacity="0.7" />

                                <path d="M 80 37.8 Q 120 22.2 160 22.2 Q 200 48.6 240 29 Q 280 10.6 320 29 Q 360 48.6 400 33.8 Q 440 18.2 480 14.2 L 480 234.2 L 80 234.2 Z" fill="url(#ribbon-top)" stroke="#0f62fe" strokeWidth="2" />

                                <circle cx="100" cy="57.8" r="5" fill="#001d6c" opacity="0.4" />
                                <circle cx="80" cy="37.8" r="6" fill="#fff" stroke="#0f62fe" strokeWidth="3" />
                                <text x="80" y="23" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#161616" fontFamily="monospace">88</text>

                                <circle cx="180" cy="42.2" r="5" fill="#001d6c" opacity="0.4" />
                                <circle cx="160" cy="22.2" r="6" fill="#fff" stroke="#0f62fe" strokeWidth="3" />
                                <text x="160" y="8" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#161616" fontFamily="monospace">92</text>

                                <circle cx="260" cy="49" r="5" fill="#001d6c" opacity="0.4" />
                                <circle cx="240" cy="29" r="6" fill="#fff" stroke="#0f62fe" strokeWidth="3" />
                                <text x="240" y="15" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#161616" fontFamily="monospace">85</text>

                                <circle cx="340" cy="49" r="5" fill="#001d6c" opacity="0.4" />
                                <circle cx="320" cy="29" r="6" fill="#fff" stroke="#00C805" strokeWidth="3" />
                                <text x="320" y="15" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#00C805" fontFamily="monospace">95</text>

                                <circle cx="420" cy="53.8" r="5" fill="#001d6c" opacity="0.4" />
                                <circle cx="400" cy="33.8" r="6" fill="#fff" stroke="#0f62fe" strokeWidth="3" />
                                <text x="400" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#161616" fontFamily="monospace">90</text>

                                <circle cx="500" cy="34.2" r="5" fill="#001d6c" opacity="0.4" />
                                <circle cx="480" cy="14.2" r="6" fill="#fff" stroke="#00C805" strokeWidth="3" />
                                <text x="480" y="0" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#00C805" fontFamily="monospace">98</text>
                            </g>

                            <g fontSize="11" fontWeight="bold" fill="#161616">
                                <text x="80" y="250" textAnchor="middle">W1</text>
                                <text x="160" y="250" textAnchor="middle">W2</text>
                                <text x="240" y="250" textAnchor="middle">W3</text>
                                <text x="320" y="250" textAnchor="middle">W4</text>
                                <text x="400" y="250" textAnchor="middle">W5</text>
                                <text x="480" y="250" textAnchor="middle">W6</text>
                            </g>

                            <line x1="50" y1="220" x2="550" y2="220" stroke="#161616" strokeWidth="2" />
                            <line x1="50" y1="25" x2="50" y2="220" stroke="#161616" strokeWidth="2" />
                        </svg>
                    </div>
                </div>

                {/* ESCALATIONS feed */}
                <div className="col-span-4 bg-[#161616] text-white p-6 border-2 border-[#161616] relative">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#333]">
                        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center">
                            <AlertTriangle size={14} className="mr-2 text-[#fa4d56]" /> Status Feed
                        </h3>
                        <div className="h-1.5 w-1.5 rounded-full bg-[#fa4d56] animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                        {ESCALATION_DATA.map(item => (
                            <div key={item.id} className="p-4 bg-[#262626] border-l-4 border-[#fa4d56] hover:bg-[#333] transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold group-hover:text-[#fa4d56] transition-colors">{item.carrier}</span>
                                    <span className="text-[9px] text-[#888] font-mono border border-[#444] px-1 rounded">{item.date}</span>
                                </div>
                                <div className="text-[10px] mb-2 text-[#ccc] font-medium">{item.type} Issue - {item.severity}</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-[#fa4d56] uppercase bg-[#3d181a] px-1.5 py-0.5 border border-[#fa4d56] tracking-widest">{item.status}</span>
                                    <span className="text-[9px] text-[#555] font-mono">{item.id}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA GRID */}
            <div className="border-2 border-[#161616] shadow-sm">
                <div className="px-6 py-4 bg-[#161616] text-white flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center">
                        <Truck size={14} className="mr-2" /> Partner Matrix
                    </h3>
                    <div className="relative text-[#161616]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-1.5 text-[10px] font-bold border-none outline-none w-48 uppercase bg-white text-black focus:bg-[#f4f4f4] transition-colors"
                        />
                    </div>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f4f4f4] text-[#161616] text-[10px] font-bold uppercase border-b-2 border-[#161616] tracking-wider">
                        <tr>
                            <th className="px-5 py-3 border-r border-[#e0e0e0]">Carrier Identity</th>
                            <th className="px-5 py-3 border-r border-[#e0e0e0]">Tier</th>
                            <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">Score</th>
                            <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">OTD %</th>
                            <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">Dmg %</th>
                            <th className="px-5 py-3 border-r border-[#e0e0e0]">Vol</th>
                            <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">Invoice Trust</th>
                            <th className="px-5 py-3 text-right">Profile</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs text-[#161616] divide-y divide-[#e0e0e0]">
                        {filteredCarriers.map((c) => (
                            <tr key={c.id} className="hover:bg-[#f0f4ff] transition-colors font-mono group">
                                <td className="px-5 py-3 font-bold flex items-center gap-3 font-sans border-r border-[#f4f4f4] group-hover:text-[#0f62fe]">
                                    <div className="w-6 h-6 bg-[#161616] text-white flex items-center justify-center text-[9px] font-bold shadow-[2px_2px_0px_#0f62fe]">
                                        {c.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    {c.name}
                                </td>
                                <td className="px-5 py-3 border-r border-[#f4f4f4]">
                                    {/* SOLID colors for tier badges */}
                                    <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${c.tier === 'Platinum' ? 'bg-[#0f62fe] text-white' :
                                        c.tier === 'Gold' ? 'bg-[#f1c21b] text-[#161616]' :
                                            'bg-[#888888] text-white'
                                        }`}>
                                        {c.tier}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-center font-bold border-r border-[#f4f4f4]">{c.score}</td>
                                <td className="px-5 py-3 text-center text-[#525252] border-r border-[#f4f4f4]">{c.od}%</td>
                                <td className="px-5 py-3 text-center text-[#525252] border-r border-[#f4f4f4]">{c.de}%</td>
                                <td className="px-5 py-3 text-center text-[#525252] border-r border-[#f4f4f4]">{c.vol}</td>
                                <td className="px-5 py-3 text-center border-r border-[#f4f4f4]">
                                    {/* SOLID colors only - no gradients or shades */}
                                    <span
                                        className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wide cursor-pointer transition-transform hover:scale-105 ${c.benford === 'PASS'
                                            ? 'bg-[#00C805] text-white'
                                            : 'bg-[#fa4d56] text-white'
                                            }`}
                                        title={c.benford === 'PASS'
                                            ? 'Invoice amounts follow natural patterns - no fraud indicators'
                                            : 'ALERT: 73% invoices cluster near ₹50K approval limit. Click Anomaly Detection for details.'}
                                    >
                                        {c.benford === 'PASS' ? '✓ PASS' : '⚠ HIGH RISK'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button onClick={() => openProfile(c)} className="text-[#0f62fe] font-bold text-[10px] hover:underline border border-transparent hover:border-[#0f62fe] px-2 py-0.5 transition-all">VIEW</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DOCUMENT VIEWER */}
            {viewDocUrl && (
                <DocumentViewer
                    documentName={viewDocName || 'Document'}
                    documentType="Carrier Profile"
                    pdfUrl={viewDocUrl}
                    onClose={() => { setViewDocUrl(null); setViewDocName(null); }}
                />
            )}
        </div>
    );
};
