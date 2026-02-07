// ESG & Emissions Dashboard - Creative 3D Design
// 4 Colors: #0f62fe (Blue), #ffffff (White), #161616 (Black), #00C805 (Robinhood Green)
import React, { useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';

// --- CREATIVE 3D ISOMETRIC ICONS (4 COLORS) ---

// 3D Cloud with CO2 - For Total Emissions
const Geo3DCloud = ({ size = 48 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* 3D Cloud base */}
        <ellipse cx="24" cy="32" rx="16" ry="6" fill="#161616" />
        {/* Cloud body - isometric */}
        <path d="M8 26 C8 20 14 16 22 16 C22 10 30 8 36 14 C42 14 44 20 42 26 C42 30 38 32 32 32 L16 32 C10 32 8 30 8 26 Z"
            fill="#ffffff" stroke="#161616" strokeWidth="2" />
        {/* Inner detail */}
        <circle cx="28" cy="20" r="4" fill="#161616" />
        <circle cx="18" cy="24" r="3" fill="#0f62fe" />
    </svg>
);

// 3D Gauge Meter - For Intensity
const Geo3DGauge = ({ size = 48 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* 3D Base cylinder */}
        <ellipse cx="24" cy="38" rx="18" ry="6" fill="#161616" />
        <path d="M6 32 L6 38 C6 41 14 44 24 44 C34 44 42 41 42 38 L42 32" fill="#161616" stroke="#ffffff" strokeWidth="1" />
        {/* Gauge face */}
        <ellipse cx="24" cy="32" rx="18" ry="6" fill="#ffffff" stroke="#161616" strokeWidth="2" />
        {/* Meter arc */}
        <path d="M10 24 A14 14 0 0 1 38 24" fill="none" stroke="#161616" strokeWidth="3" />
        {/* Needle */}
        <path d="M24 24 L32 16" stroke="#0f62fe" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="24" r="4" fill="#0f62fe" stroke="#ffffff" strokeWidth="2" />
    </svg>
);

// 3D Leaf Prism - For Green Score (Robinhood Green)
const Geo3DLeafPrism = ({ size = 48 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* 3D Prism base */}
        <path d="M24 40 L8 32 L8 16 L24 8 L40 16 L40 32 Z" fill="#00C805" stroke="#161616" strokeWidth="2" />
        {/* Left face - darker */}
        <path d="M24 40 L8 32 L8 16 L24 24 Z" fill="#161616" fillOpacity="0.3" />
        {/* Top face */}
        <path d="M24 8 L40 16 L24 24 L8 16 Z" fill="#ffffff" stroke="#161616" strokeWidth="2" />
        {/* Leaf symbol inside */}
        <path d="M24 16 C28 18 30 22 28 28 L24 24 L20 28 C18 22 20 18 24 16 Z" fill="#ffffff" stroke="#161616" strokeWidth="1" />
    </svg>
);

// 3D Coin Stack - For Carbon Savings
const Geo3DCoinStack = ({ size = 48 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* Bottom coin */}
        <ellipse cx="24" cy="40" rx="14" ry="4" fill="#161616" />
        <path d="M10 36 L10 40 C10 42 16 44 24 44 C32 44 38 42 38 40 L38 36" fill="#0f62fe" stroke="#161616" strokeWidth="1" />
        <ellipse cx="24" cy="36" rx="14" ry="4" fill="#0f62fe" stroke="#161616" strokeWidth="1" />
        {/* Middle coin */}
        <path d="M10 28 L10 32 C10 34 16 36 24 36 C32 36 38 34 38 32 L38 28" fill="#ffffff" stroke="#161616" strokeWidth="1" />
        <ellipse cx="24" cy="28" rx="14" ry="4" fill="#ffffff" stroke="#161616" strokeWidth="1" />
        {/* Top coin */}
        <path d="M10 20 L10 24 C10 26 16 28 24 28 C32 28 38 26 38 24 L38 20" fill="#00C805" stroke="#161616" strokeWidth="1" />
        <ellipse cx="24" cy="20" rx="14" ry="4" fill="#00C805" stroke="#161616" strokeWidth="1" />
        {/* Rupee symbol */}
        <text x="24" y="24" fontSize="8" fill="#161616" fontWeight="bold" textAnchor="middle">₹</text>
    </svg>
);

// 3D Bar Chart - For overview section
const Geo3DBarChart = ({ size = 48 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* Base platform */}
        <path d="M4 40 L24 46 L44 40 L24 34 Z" fill="#161616" />
        {/* Bar 1 - Short */}
        <path d="M8 34 L8 28 L14 24 L14 30 Z" fill="#161616" stroke="#ffffff" strokeWidth="1" />
        <path d="M14 24 L20 28 L20 34 L14 30 Z" fill="#0f62fe" stroke="#ffffff" strokeWidth="1" />
        {/* Bar 2 - Medium */}
        <path d="M18 34 L18 20 L24 16 L24 30 Z" fill="#161616" stroke="#ffffff" strokeWidth="1" />
        <path d="M24 16 L30 20 L30 34 L24 30 Z" fill="#00C805" stroke="#ffffff" strokeWidth="1" />
        {/* Bar 3 - Tall */}
        <path d="M28 34 L28 12 L34 8 L34 30 Z" fill="#161616" stroke="#ffffff" strokeWidth="1" />
        <path d="M34 8 L40 12 L40 34 L34 30 Z" fill="#0f62fe" stroke="#ffffff" strokeWidth="1" />
    </svg>
);

// 3D Hexagon - For header
const Geo3DHexagon = ({ size = 56 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        {/* Outer hex */}
        <path d="M28 4 L48 14 L48 38 L28 48 L8 38 L8 14 Z" fill="#161616" stroke="#ffffff" strokeWidth="2" />
        {/* Middle hex */}
        <path d="M28 10 L42 18 L42 34 L28 42 L14 34 L14 18 Z" fill="#00C805" stroke="#161616" strokeWidth="2" />
        {/* Inner hex */}
        <path d="M28 16 L36 22 L36 30 L28 36 L20 30 L20 22 Z" fill="#ffffff" stroke="#161616" strokeWidth="1.5" />
        {/* Center dot */}
        <circle cx="28" cy="26" r="4" fill="#0f62fe" />
    </svg>
);

// 3D Pyramid - For summary
const Geo3DPyramid = ({ size = 32 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Right face */}
        <path d="M16 4 L28 26 L16 22 Z" fill="#0f62fe" stroke="#ffffff" strokeWidth="1" />
        {/* Left face */}
        <path d="M16 4 L4 26 L16 22 Z" fill="#161616" stroke="#ffffff" strokeWidth="1" />
        {/* Bottom face */}
        <path d="M4 26 L16 30 L28 26 L16 22 Z" fill="#00C805" stroke="#ffffff" strokeWidth="1" />
    </svg>
);

// Mock data
const CARRIER_EMISSIONS = [
    { id: 'TCI001', name: 'TCI Express', grade: 'A+', score: 115, co2e: 45.2, intensity: 52 },
    { id: 'GATI002', name: 'Gati-KWE', grade: 'A', score: 95, co2e: 52.8, intensity: 61 },
    { id: 'VRL003', name: 'VRL Logistics', grade: 'B', score: 78, co2e: 68.4, intensity: 78 },
    { id: 'BLU004', name: 'Blue Dart', grade: 'C', score: 62, co2e: 82.1, intensity: 95 }
];

const MODE_EMISSIONS = [
    { mode: 'ROAD', co2e: 168.98, percent: 68 },
    { mode: 'AIR', co2e: 54.67, percent: 22 },
    { mode: 'RAIL', co2e: 17.40, percent: 7 },
    { mode: 'SEA', co2e: 7.45, percent: 3 }
];

export const EmissionsDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'scorecard'>('overview');
    const [weight, setWeight] = useState<number>(1000);
    const [distance, setDistance] = useState<number>(500);
    const [selectedMode, setSelectedMode] = useState<string>('ROAD');
    const [calcResult, setCalcResult] = useState<any>(null);

    const calculateEmissions = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/emissions/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weight_kg: weight, distance_km: distance, mode: selectedMode })
            });
            const data = await response.json();
            setCalcResult(data);
        } catch (error) {
            console.error('Calculation error:', error);
        }
    };

    // KPI data with unique icons
    const kpiData = [
        { label: 'TOTAL EMISSIONS', val: '248.5 t', trend: '+12%', icon: <Geo3DCloud size={44} />, trendColor: '#161616' },
        { label: 'INTENSITY', val: '58.2 g/tkm', trend: '-8%', icon: <Geo3DGauge size={44} />, trendColor: '#0f62fe' },
        { label: 'GREEN SCORE', val: 'B+', trend: 'ABOVE AVG', icon: <Geo3DLeafPrism size={44} />, trendColor: '#00C805' },
        { label: 'CARBON SAVINGS', val: '₹12.4L', trend: 'YTD', icon: <Geo3DCoinStack size={44} />, trendColor: '#00C805' }
    ];

    return (
        <div className="p-8 h-full flex flex-col bg-white text-[#161616] overflow-y-auto relative min-h-screen">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-[#161616] pb-4">
                <div className="flex items-center gap-6">
                    <Geo3DHexagon size={56} />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-[#161616]">ESG Command</h1>
                        <p className="text-sm text-[#00C805] font-bold mt-1 uppercase tracking-widest pl-1 border-l-4 border-[#00C805]">
                            Scope 3 Emissions Intelligence
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <div className="text-right mr-4">
                        <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Framework</div>
                        <div className="text-lg font-bold text-[#161616] font-sans">GLEC v3.0</div>
                    </div>
                    <button className="flex items-center text-[#161616] border-2 border-[#161616] px-4 py-2 hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_#00C805] transition-all bg-white text-xs">
                        <Download size={14} className="mr-2" /> EXPORT
                    </button>
                    <button className="p-2 border-2 border-[#161616] hover:bg-[#161616] hover:text-white transition-all">
                        <Filter size={16} />
                    </button>
                </div>
            </div>

            {/* KPI CARDS - Each with unique icon */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {kpiData.map((kpi, idx) => (
                    <div key={idx} className="bg-[#161616] text-white p-5 relative group transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#00C805]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase mb-1 text-[#888] tracking-widest border-b border-[#333] inline-block pb-0.5">
                                    {kpi.label}
                                </p>
                                <h2 className="text-3xl font-bold tracking-tighter text-white">{kpi.val}</h2>
                            </div>
                            {kpi.icon}
                        </div>
                        <div className="flex items-center text-[10px] font-bold font-mono">
                            <span style={{ color: kpi.trendColor }} className="mr-2 px-1.5 py-0.5 bg-[#262626] border border-[#333]">{kpi.trend}</span>
                            <span className="opacity-50 uppercase tracking-tight text-[#ccc]">vs Last Period</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-0 mb-8 border-2 border-[#161616]">
                {[
                    { id: 'overview', label: 'EMISSIONS OVERVIEW' },
                    { id: 'calculator', label: 'CO₂ CALCULATOR' },
                    { id: 'scorecard', label: 'CARRIER SCORECARD' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-r-2 border-[#161616] last:border-r-0 ${activeTab === tab.id
                                ? 'bg-[#161616] text-white'
                                : 'bg-white text-[#161616] hover:bg-[#f4f4f4]'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-12 gap-8">
                    {/* Emissions by Mode */}
                    <div className="col-span-8 bg-white border-2 border-[#161616] p-6">
                        <div className="flex items-center justify-between mb-6 border-b-2 border-[#161616] pb-2">
                            <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider">
                                EMISSIONS BY TRANSPORT MODE
                            </h3>
                            <Geo3DBarChart size={36} />
                        </div>
                        <div className="space-y-4">
                            {MODE_EMISSIONS.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-16 text-xs font-bold text-[#161616]">{item.mode}</div>
                                    <div className="flex-1 h-8 bg-[#f4f4f4] border border-[#e0e0e0] relative">
                                        <div
                                            className="h-full flex items-center justify-end pr-2"
                                            style={{
                                                width: `${item.percent}%`,
                                                backgroundColor: idx === 0 ? '#0f62fe' : idx === 1 ? '#161616' : '#00C805'
                                            }}
                                        >
                                            <span className="text-[10px] font-bold text-white">{item.percent}%</span>
                                        </div>
                                    </div>
                                    <div className="w-20 text-right text-xs font-mono text-[#525252]">
                                        {item.co2e.toFixed(2)} t
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t-2 border-[#e0e0e0] flex justify-between items-center">
                            <span className="text-xs font-bold text-[#888] uppercase">Methodology: GLEC Framework v3.0</span>
                            <span className="text-xs font-bold text-[#161616]">Total: 248.50 tCO₂e</span>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="col-span-4 bg-[#161616] text-white p-6 border-2 border-[#161616]">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#333]">
                            <h3 className="text-xs font-bold uppercase tracking-wider">SUMMARY</h3>
                            <Geo3DPyramid size={28} />
                        </div>
                        <div className="space-y-4">
                            <div className="bg-[#262626] p-4 border border-[#333]">
                                <p className="text-[10px] text-[#888] uppercase mb-1">Total Shipments</p>
                                <p className="text-2xl font-bold font-mono">4,256</p>
                            </div>
                            <div className="bg-[#262626] p-4 border border-[#333]">
                                <p className="text-[10px] text-[#888] uppercase mb-1">Avg Intensity</p>
                                <p className="text-2xl font-bold font-mono">58.2 <span className="text-sm">g/tkm</span></p>
                            </div>
                            <div className="bg-[#262626] p-4 border border-[#333]">
                                <p className="text-[10px] text-[#888] uppercase mb-1">Reporting Period</p>
                                <p className="text-2xl font-bold font-mono">FY 2024</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CALCULATOR TAB */}
            {activeTab === 'calculator' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white border-2 border-[#161616] p-6">
                        <div className="flex items-center justify-between mb-6 border-b-2 border-[#161616] pb-2">
                            <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider">
                                CALCULATE SHIPMENT CO₂e
                            </h3>
                            <Geo3DCloud size={36} />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(Number(e.target.value))}
                                    className="w-full mt-1 px-4 py-3 border-2 border-[#161616] text-sm font-mono focus:outline-none focus:shadow-[3px_3px_0px_#00C805]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Distance (km)</label>
                                <input
                                    type="number"
                                    value={distance}
                                    onChange={(e) => setDistance(Number(e.target.value))}
                                    className="w-full mt-1 px-4 py-3 border-2 border-[#161616] text-sm font-mono focus:outline-none focus:shadow-[3px_3px_0px_#00C805]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Transport Mode</label>
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {['ROAD', 'RAIL', 'AIR', 'SEA'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setSelectedMode(mode)}
                                            className={`py-3 text-xs font-bold border-2 transition-all ${selectedMode === mode
                                                    ? 'bg-[#161616] text-white border-[#161616]'
                                                    : 'bg-white text-[#161616] border-[#161616] hover:bg-[#f4f4f4]'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={calculateEmissions}
                                className="w-full py-4 bg-[#00C805] text-white text-xs font-bold uppercase tracking-wider border-2 border-[#00C805] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#161616] transition-all"
                            >
                                CALCULATE CO₂e
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#161616] text-white p-6 border-2 border-[#161616]">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#333]">
                            <h3 className="text-xs font-bold uppercase tracking-wider">RESULT</h3>
                            <Geo3DLeafPrism size={32} />
                        </div>
                        {calcResult ? (
                            <div className="space-y-6">
                                <div className="text-center py-6">
                                    <p className="text-6xl font-bold text-[#00C805]">{calcResult.co2e_kg?.toFixed(2)}</p>
                                    <p className="text-sm text-[#888] mt-2 uppercase tracking-wider">kg CO₂e</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#262626] p-4 border border-[#333]">
                                        <p className="text-[10px] text-[#888] uppercase">Tonne-KM</p>
                                        <p className="text-lg font-bold font-mono">{calcResult.tonne_km}</p>
                                    </div>
                                    <div className="bg-[#262626] p-4 border border-[#333]">
                                        <p className="text-[10px] text-[#888] uppercase">Factor</p>
                                        <p className="text-lg font-bold font-mono">{calcResult.emission_factor_grams_per_tkm} g/tkm</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-[#888]">
                                <p className="text-xs uppercase tracking-wider">Enter values and calculate</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SCORECARD TAB */}
            {activeTab === 'scorecard' && (
                <div className="border-2 border-[#161616]">
                    <div className="px-6 py-4 bg-[#161616] text-white flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-3">
                            <Geo3DBarChart size={24} /> CARRIER EMISSIONS SCORECARD
                        </h3>
                        <div className="relative text-[#161616]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                className="pl-9 pr-3 py-1.5 text-[10px] font-bold border-none outline-none w-48 uppercase bg-white text-black"
                            />
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f4f4f4] text-[#161616] text-[10px] font-bold uppercase border-b-2 border-[#161616] tracking-wider">
                            <tr>
                                <th className="px-5 py-3 border-r border-[#e0e0e0]">Carrier</th>
                                <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">Grade</th>
                                <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">Score</th>
                                <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">CO₂e (t)</th>
                                <th className="px-5 py-3 text-center border-r border-[#e0e0e0]">Intensity</th>
                                <th className="px-5 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-[#161616] divide-y divide-[#e0e0e0]">
                            {CARRIER_EMISSIONS.map((c) => (
                                <tr key={c.id} className="hover:bg-[#f0fff4] transition-colors font-mono group">
                                    <td className="px-5 py-3 font-bold flex items-center gap-3 font-sans border-r border-[#f4f4f4] group-hover:text-[#00C805]">
                                        <div className="w-6 h-6 bg-[#161616] text-white flex items-center justify-center text-[9px] font-bold shadow-[2px_2px_0px_#00C805]">
                                            {c.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {c.name}
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-[#f4f4f4]">
                                        <span className={`px-2 py-1 text-[9px] font-bold uppercase ${c.grade === 'A+' || c.grade === 'A' ? 'bg-[#00C805] text-white' :
                                                c.grade === 'B' ? 'bg-[#0f62fe] text-white' :
                                                    'bg-[#161616] text-white'
                                            }`}>
                                            {c.grade}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold border-r border-[#f4f4f4]">{c.score}</td>
                                    <td className="px-5 py-3 text-center text-[#525252] border-r border-[#f4f4f4]">{c.co2e}</td>
                                    <td className="px-5 py-3 text-center text-[#525252] border-r border-[#f4f4f4]">{c.intensity} g/tkm</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`px-2 py-1 text-[9px] font-bold uppercase ${c.score >= 80 ? 'bg-[#00C805] text-white' :
                                                c.score >= 60 ? 'bg-[#0f62fe] text-white' :
                                                    'bg-[#161616] text-white'
                                            }`}>
                                            {c.score >= 80 ? 'EXCELLENT' : c.score >= 60 ? 'GOOD' : 'REVIEW'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EmissionsDashboard;
