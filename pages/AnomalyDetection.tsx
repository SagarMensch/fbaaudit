import React, { useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis, Cell } from 'recharts';
import { ArrowRight, TrendingUp, HelpCircle, Info } from 'lucide-react';
import { AnomalyRecord } from '../types';
import { exportToCSV } from '../utils/exportUtils';

// --- 3D SOLID GEOMETRIC ICONS (Uniform with Dashboard) ---
const GeoPyramid = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M12 2L2 19h20L12 2z" fillOpacity="0.8" />
        <path d="M12 2L2 19h10V2z" fillOpacity="1" />
        <path d="M12 2v17h10L12 2z" fillOpacity="0.6" />
    </svg>
);

const GeoCube = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" fillOpacity="1" />
        <path d="M2 17l10 5 10-5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <path d="M2 7v10l10 5V12L2 7z" fillOpacity="0.8" />
        <path d="M12 12v10l10-5V7l-10 5z" fillOpacity="0.6" />
    </svg>
);

const GeoHexagon = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" fillOpacity="0.8" />
        <path d="M12 12l8.5-5M12 12v10M12 12L3.5 7" stroke="white" strokeWidth="1" />
        <path d="M12 2l8.5 5L12 12 3.5 7 12 2z" fillOpacity="1" />
    </svg>
);

const GeoBrain = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M9.5 2A4.5 4.5 0 0 0 5 6.5c0 .41.05.81.16 1.18A4.5 4.5 0 0 0 2 12a4.5 4.5 0 0 0 4.5 4.5c.41 0 .81-.05 1.18-.16A4.5 4.5 0 0 0 12 19.5a4.5 4.5 0 0 0 4.5-4.5c0-.41-.05-.81-.16-1.18A4.5 4.5 0 0 0 22 12a4.5 4.5 0 0 0-4.5-4.5c-.41 0-.81.05-1.18.16A4.5 4.5 0 0 0 12 4.5a4.5 4.5 0 0 0-2.5-2.5z" fillOpacity="0.8" />
        <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.4" />
    </svg>
);

const GeoPulse = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1" fill="none" opacity="0.2" />
    </svg>
);

const GeoShield = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M12 2L3 7v6a12 12 0 0 0 9 11 12 12 0 0 0 9-11V7l-9-5z" fillOpacity="0.8" />
        <path d="M12 2v22a12 12 0 0 0 9-11V7l-9-5z" fillOpacity="1" />
    </svg>
);

const GeoDownload = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" fill="none" />
        <polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="2" fill="none" />
        <line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" />
    </svg>
);

// MOCK DATA - Indian Logistics Anomalies
const ANOMALIES: AnomalyRecord[] = [
    { id: 'A1', shipmentId: 'SHP-2025-TCI-089', type: 'EWAY_BILL_MISSING', severity: 'HIGH', score: 96, detectedAt: '2025-12-20 11:45', status: 'OPEN', description: 'E-Way Bill not generated for interstate shipment >50k value.', value: 16284, expectedValue: 0, carrierName: 'TCI Express Limited' },
    { id: 'A2', shipmentId: 'SHP-2025-DEL-142', type: 'POD_MISMATCH', severity: 'MEDIUM', score: 82, detectedAt: '2025-12-19 15:30', status: 'OPEN', description: 'POD signature does not match consignee records.', value: 12450, expectedValue: 12450, carrierName: 'Delhivery Limited' },
    { id: 'A3', shipmentId: 'SHP-2025-BD-067', type: 'GST_RATE_VARIANCE', severity: 'LOW', score: 68, detectedAt: '2025-12-18 09:20', status: 'RESOLVED', description: 'GST rate applied 18% instead of expected 12% for specific goods.', value: 2484, expectedValue: 1656, carrierName: 'Blue Dart Express' },
    // INVOICE AMOUNT PATTERN FRAUD DETECTION (Formerly Benford's Law)
    { id: 'A4', shipmentId: 'QHL-BENFORD-001', type: 'BENFORD_FRAUD', severity: 'HIGH', score: 94, detectedAt: '2025-12-22 14:20', status: 'OPEN', description: 'APPROVAL LIMIT BYPASS: 73% of vendor invoices are between ₹47K-₹50K. This is abnormal - looks like intentional avoidance of ₹50K manager approval limit.', value: 49200, expectedValue: 35000, carrierName: 'Quick Haul Logistics' },
    { id: 'A5', shipmentId: 'QHL-BENFORD-002', type: 'BENFORD_FRAUD', severity: 'HIGH', score: 91, detectedAt: '2025-12-23 09:15', status: 'OPEN', description: 'FABRICATED INVOICE PATTERN: AI detected unusual number patterns. Real invoices have natural variation. This vendor\'s amounts look manually created. Review recommended.', value: 48700, expectedValue: 34000, carrierName: 'Quick Haul Logistics' },
];

const SCATTER_DATA = [
    { x: 12000, y: 12200, z: 10 },
    { x: 13800, y: 13600, z: 15 },
    { x: 15000, y: 15200, z: 13 },
    { x: 16284, y: 12450, z: 50, isAnomaly: true },
];

interface AnomalyDetectionProps {
    onNavigate?: (page: string) => void;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ onNavigate }) => {
    const [anomalies, setAnomalies] = useState<AnomalyRecord[]>(ANOMALIES);
    const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(ANOMALIES[0]);
    const [showOnboarding, setShowOnboarding] = useState(true);

    // --- REAL R ANALYTICS INTEGRATION ---
    const [rResults, setRResults] = useState<any>(null);

    useEffect(() => {
        const detectRealAnomalies = async () => {
            try {
                // Prepare numeric data for R
                const numericData = ANOMALIES.map(a => ({
                    id: a.id,
                    value: a.value,
                    expectedValue: a.expectedValue,
                    score: a.score // Using existing score as input feature too
                }));

                const res = await fetch('http://localhost:5000/api/r/anomaly', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: numericData })
                });

                if (res.ok) {
                    const json = await res.json();
                    if (json.success) {
                        setRResults(json.data);
                        console.log("R Anomaly Results:", json.data);
                    }
                }
            } catch (e) {
                console.error("Failed to run R anomaly detection:", e);
            }
        };

        detectRealAnomalies();
    }, []);

    // Merge R results with mock data
    const displayAnomalies = useMemo(() => {
        let baseData = [...anomalies];
        if (rResults && rResults.scores) {
            baseData = baseData.map((item, index) => {
                const rScore = rResults.scores[index];
                // Map R 0-1 score to 0-100
                const scaledScore = Math.round(rScore * 100);
                const isAnomaly = rResults.anomalies.includes(index); // R returns 0-based indices

                return {
                    ...item,
                    score: scaledScore,
                    severity: scaledScore > 80 ? 'HIGH' : (scaledScore > 60 ? 'MEDIUM' : 'LOW'),
                    // Mark if R algorithm explicitly flagged it
                    r_detected: isAnomaly
                };
            });
        }
        return baseData;
    }, [anomalies, rResults]);

    const handleResolution = (id: string, action: 'DISPUTE' | 'FALSE_POSITIVE') => {
        setAnomalies(prev => prev.map(a =>
            a.id === id ? { ...a, status: action === 'DISPUTE' ? 'DISPUTED' : 'RESOLVED' } : a
        ));
        if (selectedAnomaly?.id === id) {
            setSelectedAnomaly(prev => prev ? { ...prev, status: action === 'DISPUTE' ? 'DISPUTED' : 'RESOLVED' } : null);
        }
    };

    const handleExportAnomalies = () => {
        const data = ANOMALIES.map(a => ({
            'ID': a.id,
            'Shipment': a.shipmentId,
            'Carrier': a.carrierName || 'N/A',
            'Type': a.type,
            'Severity': a.severity,
            'Score': a.score,
            'Status': a.status,
            'Value': a.value,
            'Expected': a.expectedValue
        }));
        exportToCSV(data, 'Anomaly_Report');
    };

    // Uniform KPI Card (Matching Dashboard)
    const KpiCard = ({ title, value, subtext, icon: Icon, accentColor = "text-black" }: any) => (
        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm hover:border-black transition-colors group relative">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                <div className={`w-8 h-8 ${accentColor}`}>
                    <Icon className="w-full h-full drop-shadow-md" />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-black tracking-tighter mb-1 font-mono">{value}</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{subtext}</p>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>
    );

    return (
        <div className="p-8 bg-white min-h-screen font-sans">
            {/* 1. UNIFORM HEADER (White Theme) */}
            <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-8">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest">Live Engine</span>
                        <div className="w-2 h-2 bg-[#00C805] rounded-full animate-pulse"></div>
                    </div>
                    <h1 className="text-4xl font-bold text-black tracking-tighter flex items-center">
                        Anomaly Control Center
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium max-w-2xl flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 bg-black text-red-500 text-[10px] font-bold uppercase rounded border border-black tracking-wider">Isolation Forest + GMM</span>
                        AI-driven oversight platform for identifying fiscal leaks and deviations.
                    </p>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setShowOnboarding(!showOnboarding)}
                        className="bg-gray-100 text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center"
                    >
                        <HelpCircle size={14} className="mr-2" /> {showOnboarding ? 'Hide Guide' : 'How to Use'}
                    </button>
                    <button
                        onClick={handleExportAnomalies}
                        className="bg-black text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#00C805] transition-all flex items-center"
                    >
                        <GeoDownload size={14} className="mr-2" /> Export Core
                    </button>
                </div>
            </div>

            {/* 2. ONBOARDING / FLOW GUIDE (Uniformity & Clarity) */}
            {showOnboarding && (
                <div className="mb-10 grid grid-cols-3 gap-6 bg-slate-50 p-6 border border-gray-100 animate-slide-in-top">
                    <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs mr-4 shrink-0">1</div>
                        <div>
                            <h4 className="text-[11px] font-bold text-black uppercase tracking-wider mb-1">Detect</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed">System scans 10,000+ data points for Z-Score deviations and document mismatches.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs mr-4 shrink-0">2</div>
                        <div>
                            <h4 className="text-[11px] font-bold text-black uppercase tracking-wider mb-1">Verify</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Review the statistical cluster on the right. High deviation ( الأحمر ) suggests immediate risk.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs mr-4 shrink-0">3</div>
                        <div>
                            <h4 className="text-[11px] font-bold text-black uppercase tracking-wider mb-1">Resolve</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Dispute directly via EDI or update the model mapping to prevent future false positives.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. CORE KPI TILES (Matching Dashboard Layout) */}
            <div className="grid grid-cols-4 gap-6 mb-10">
                <KpiCard
                    title="Engine Throughput"
                    value="12,402"
                    subtext="Nodes scanned today"
                    icon={GeoHexagon}
                    accentColor="text-blue-600"
                />
                <KpiCard
                    title="Active Alerts"
                    value="02"
                    subtext="Critical interventions"
                    icon={GeoPyramid}
                    accentColor="text-red-600"
                />
                <KpiCard
                    title="Fiscal Leakage Blocked"
                    value="₹12.4k"
                    subtext="Prevented over-payments"
                    icon={GeoCube}
                    accentColor="text-[#00C805]"
                />
                <KpiCard
                    title="Model Accuracy"
                    value="98.2%"
                    subtext="Confidence Interval"
                    icon={GeoBrain}
                    accentColor="text-purple-600"
                />
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* 4. ALERTS COLUMN (Uniformity) */}
                <div className="col-span-4 space-y-4">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Priority Queue</h3>
                        <span className="text-[9px] font-bold text-gray-400">Sort by: Severity</span>
                    </div>
                    {displayAnomalies.map(anomaly => (
                        <div
                            key={anomaly.id}
                            onClick={() => setSelectedAnomaly(anomaly)}
                            className={`p-6 rounded-none border transition-all cursor-pointer relative group ${selectedAnomaly?.id === anomaly.id
                                ? 'bg-black text-white border-black shadow-xl scale-[1.02]'
                                : 'bg-white border-gray-100 hover:border-gray-300 text-black'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[9px] font-bold px-2 py-1 uppercase tracking-widest ${anomaly.status === 'DISPUTED' ? 'bg-purple-600 text-white' :
                                    anomaly.status === 'RESOLVED' ? 'bg-[#00C805] text-white' :
                                        anomaly.severity === 'HIGH' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                                    }`}>
                                    {anomaly.status === 'OPEN' ? anomaly.type.replace('_', ' ') : anomaly.status}
                                </span>
                                <div className="flex items-center space-x-1">
                                    <div className={`w-1 h-1 rounded-full ${selectedAnomaly?.id === anomaly.id ? 'bg-[#00C805]' : 'bg-gray-300'}`}></div>
                                    <span className="text-[9px] font-bold text-gray-400 font-mono">{anomaly.score}% Score</span>
                                </div>
                            </div>
                            <p className="text-lg font-bold tracking-tight mb-1">{anomaly.shipmentId}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${selectedAnomaly?.id === anomaly.id ? 'text-gray-400' : 'text-blue-600'}`}>{anomaly.carrierName}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800/10">
                                <p className="text-[10px] italic line-clamp-1 opacity-70">{anomaly.description}</p>
                                <ArrowRight size={14} className={selectedAnomaly?.id === anomaly.id ? 'text-[#00C805]' : 'text-gray-300'} />
                            </div>

                            {/* Dashboard-style bottom bar */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00C805] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                        </div>
                    ))}
                </div>

                {/* 5. ANALYSIS PANEL (Uniformity & Clarity) */}
                <div className="col-span-8 space-y-8">
                    {selectedAnomaly && (
                        <>
                            {/* Deviation Visualization */}
                            <div className="bg-white p-8 border border-gray-200">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-black uppercase tracking-widest flex items-center">
                                            <GeoPulse size={18} className="mr-3 text-red-600" /> Statistical Cluster Analysis
                                        </h3>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Analyzing deviation from expected mean confidence</p>
                                    </div>
                                    <div className="flex space-x-6 items-center">
                                        <div className="flex items-center"><div className="w-2 h-2 bg-slate-200 mr-2"></div> <span className="text-[9px] font-bold text-gray-500 uppercase">Baseline</span></div>
                                        <div className="flex items-center"><div className="w-2 h-2 bg-red-600 mr-2"></div> <span className="text-[9px] font-bold text-gray-500 uppercase">Outlier</span></div>
                                    </div>
                                </div>

                                <div className="h-80 w-full bg-slate-50 p-4 border border-gray-100">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis type="number" dataKey="x" name="Value" unit="₹" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                            <YAxis type="number" dataKey="y" name="Expected" unit="₹" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                            <ZAxis type="number" dataKey="z" range={[100, 800]} />
                                            <Tooltip
                                                cursor={{ strokeDasharray: '3 3' }}
                                                contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '0px', padding: '12px' }}
                                                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                            />
                                            <Scatter name="Baseline" data={SCATTER_DATA.filter(d => !d.isAnomaly)} fill="#cbd5e1" />
                                            <Scatter name="Anomaly Outlier" data={SCATTER_DATA.filter(d => d.isAnomaly)} fill="#ef4444">
                                                {SCATTER_DATA.filter(d => d.isAnomaly).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill="#ef4444" stroke="#000" strokeWidth={2} />
                                                ))}
                                            </Scatter>
                                            <ReferenceLine x={selectedAnomaly.expectedValue} stroke="#00C805" strokeWidth={1} label={{ position: 'top', value: 'Expected Value', fill: '#00C805', fontSize: 9, fontWeight: 'bold' }} />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-6 flex items-center p-4 bg-red-50 border border-red-100">
                                    <Info size={16} className="text-red-600 mr-3 shrink-0" />
                                    <p className="text-[11px] text-red-950 font-medium">
                                        Detected Variance: <span className="font-bold underline">₹{(selectedAnomaly.value - selectedAnomaly.expectedValue).toLocaleString()} Over-spend</span>.
                                        This value represents a significant deviation from the historic mean of {selectedAnomaly.carrierName}.
                                    </p>
                                </div>
                            </div>

                            {/* Resolution Hub (Clarity) */}
                            <div className="bg-white border border-gray-200">
                                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-black uppercase tracking-widest flex items-center">
                                        <GeoShield size={18} className="mr-3 text-black" /> Resolution Hub
                                    </h3>
                                    <span className="text-[10px] font-mono text-gray-400 uppercase font-black">Record ID: SS-{selectedAnomaly.id}-2025</span>
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Action 01: External Intervention</label>
                                            <button
                                                onClick={() => handleResolution(selectedAnomaly.id, 'DISPUTE')}
                                                disabled={selectedAnomaly.status !== 'OPEN'}
                                                className={`w-full py-4 flex flex-col items-center justify-center border-2 transition-all group ${selectedAnomaly.status !== 'OPEN'
                                                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white shadow-sm'
                                                    }`}
                                            >
                                                <TrendingUp size={20} className="mb-2" />
                                                <span className="font-bold text-[11px] uppercase tracking-widest leading-none">
                                                    {selectedAnomaly.status === 'DISPUTED' ? 'Dispute Active' : 'Initiate Dispute'}
                                                </span>
                                                <span className="text-[8px] mt-1 opacity-70">Sends EDI 210 Data to Carrier</span>
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Action 02: Model Calibration</label>
                                            <button
                                                onClick={() => handleResolution(selectedAnomaly.id, 'FALSE_POSITIVE')}
                                                disabled={selectedAnomaly.status !== 'OPEN'}
                                                className={`w-full py-4 flex flex-col items-center justify-center border-2 transition-all ${selectedAnomaly.status !== 'OPEN'
                                                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-black text-black hover:bg-black hover:text-white'
                                                    }`}
                                            >
                                                <GeoHexagon size={20} className="mb-2" />
                                                <span className="font-bold text-[11px] uppercase tracking-widest leading-none">
                                                    {selectedAnomaly.status === 'RESOLVED' ? 'Logic Updated' : 'Mark as Safe'}
                                                </span>
                                                <span className="text-[8px] mt-1 opacity-70">Whitelist this pattern for ML core</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 border border-gray-100 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                            <span>Encryption: AES-256 System-to-System</span>
                                        </div>
                                        <span className="hover:text-black cursor-pointer underline">View Full Audit Trail</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* R MODEL INTERNALS (User Requested Visibility) */}
                    {rResults && (
                        <div className="mt-8 border-t border-gray-200 pt-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                                R Model Internals (Isolation Forest)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Outlier Indices</p>
                                    <div className="flex flex-wrap gap-2">
                                        {rResults.anomalies.map((idx: number) => (
                                            <span key={idx} className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold font-mono border border-red-200">
                                                Index #{idx}
                                            </span>
                                        ))}
                                        {rResults.anomalies.length === 0 && <span className="text-gray-400 text-xs italic">No statistical outliers detected by R</span>}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Severity Scores (0.0 - 1.0)</p>
                                    <div className="flex flex-wrap gap-1">
                                        {rResults.scores.map((score: number, idx: number) => (
                                            <div key={idx} className="text-[10px] font-mono p-1 border border-gray-200 bg-white" title={`Index ${idx}`}>
                                                <span className="text-gray-400 mr-1">#{idx}:</span>
                                                <span className={`font-bold ${score > 0.6 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {score.toFixed(3)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-[9px] text-gray-400 font-mono">
                                * Raw JSON output returned from specific R package `isotree`
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
