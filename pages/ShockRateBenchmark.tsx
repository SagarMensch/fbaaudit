import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, RefreshCw } from 'lucide-react';

interface Benchmark {
    lane: string;
    base_level: number;
    shock_component: number;
    total_benchmark: number;
    is_disruption: boolean;
    confidence: number;
}

interface ValidationResult {
    submitted_rate: number;
    benchmark: number;
    base_level: number;
    shock_premium: number;
    variance_pct: number;
    verdict: string;
    is_disruption: boolean;
    explanation: string;
}

const API_BASE = 'http://localhost:8000';

// Professional 3D Isometric Shock Icon
const HyperShock = ({ size = 48, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        {/* Shield base */}
        <path d="M32 4 L56 16 V36 C56 48 32 60 32 60 C32 60 8 48 8 36 V16 L32 4Z" fill="#161616" stroke="#161616" strokeWidth="2" />
        <path d="M32 4 L56 16 L32 28 L8 16 Z" fill="#0f62fe" />
        <path d="M8 16 L32 28 V60 C32 60 8 48 8 36 V16Z" fill="#001d6c" />
        <path d="M32 28 L56 16 V36 C56 48 32 60 32 60 V28Z" fill="#0353e9" />
        {/* Lightning bolt */}
        <path d="M36 20 L28 34 H36 L28 48" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 3D Geometric Lightning Bolt Icon
const Geo3DLightning = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* 3D Lightning bolt with depth */}
        <path d="M13 2L4 14H11L10 22L19 10H12L13 2Z" fill="#FFB800" />
        <path d="M13 2L14 2L15 10H19L10 22L11 14H4L13 2Z" fill="#CC9400" />
        <path d="M13 2L4 14H11" fill="#FFD54F" />
    </svg>
);

// 3D Geometric Shield Icon
const Geo3DShield = ({ size = 12, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L4 6V12C4 17 12 22 12 22C12 22 20 17 20 12V6L12 2Z" fill="#00C805" />
        <path d="M12 2L20 6V12C20 17 12 22 12 22V2Z" fill="#009904" />
        <path d="M12 2L4 6L12 10L20 6L12 2Z" fill="#00E806" />
        <path d="M9 11L11 13L15 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ShockRateBenchmark: React.FC = () => {
    const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);

    // Validation form
    const [selectedLane, setSelectedLane] = useState('Mumbai-Delhi');
    const [inputRate, setInputRate] = useState('');
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    // Common lanes
    const lanes = [
        'Mumbai-Delhi', 'Chennai-Bangalore', 'Pune-Hyderabad',
        'Ahmedabad-Jaipur', 'Kolkata-Lucknow', 'Mumbai-Pune', 'Delhi-Chandigarh'
    ];

    const fetchBenchmarks = async () => {
        try {
            // Simulate 2 years of rate history (MockDB) for R analysis
            const contractHistory = Array.from({ length: 24 }, (_, i) => 3000 + (i * 20) + Math.random() * 100);
            const marketHistory = Array.from({ length: 24 }, (_, i) => 2800 + (i * 30) + Math.random() * 300);

            const res = await fetch(`http://localhost:5000/api/r/benchmark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract_rates: contractHistory,
                    market_rates: marketHistory,
                    horizon: 6
                })
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    const rData = json.data;
                    // Transform R result into UI Benchmark format
                    const newBenchmark: Benchmark = {
                        lane: 'Mumbai-Delhi (R-Calc)',
                        base_level: Math.round(rData.forecast[0]), // First forecast point
                        // GARCH volatility as shock component
                        shock_component: Math.round(rData.volatility[0] || 50),
                        total_benchmark: Math.round(rData.forecast[0] + (rData.volatility[0] || 50)),
                        is_disruption: (rData.volatility[0] > 100), // Simple threshold
                        confidence: 95
                    };
                    setBenchmarks([newBenchmark]);
                }
            }
        } catch (e) {
            console.error('Fetch benchmarks error:', e);
            // Fallback to mock if API fails
            setBenchmarks([{
                lane: 'Mumbai-Delhi',
                base_level: 3100,
                shock_component: 150,
                total_benchmark: 3250,
                is_disruption: false,
                confidence: 92
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleValidateRate = async () => {
        if (!inputRate) return;

        setValidating(true);
        try {
            const res = await fetch(`${API_BASE}/api/shock/validate-rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lane: selectedLane,
                    rate: parseFloat(inputRate),
                    update_model: true
                })
            });

            if (res.ok) {
                const data = await res.json();
                setValidationResult(data);
                fetchBenchmarks(); // Refresh benchmarks
            }
        } catch (e) {
            console.error('Validation error:', e);
        } finally {
            setValidating(false);
        }
    };

    const handleToggleDisruption = async (lane: string, currentState: boolean) => {
        try {
            const res = await fetch(`${API_BASE}/api/shock/disruption`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lane: lane,
                    is_disruption: !currentState,
                    event_type: 'STRIKE'
                })
            });

            if (res.ok) {
                fetchBenchmarks();
            }
        } catch (e) {
            console.error('Toggle disruption error:', e);
        }
    };

    useEffect(() => {
        fetchBenchmarks();
    }, []);

    const getVerdictColor = (verdict: string) => {
        switch (verdict) {
            case 'APPROVED': return '#00C805';
            case 'FLAGGED_HIGH': return '#FF4444';
            case 'FLAGGED_LOW': return '#FFB800';
            default: return '#666';
        }
    };

    const getVerdictIcon = (verdict: string) => {
        switch (verdict) {
            case 'APPROVED': return <CheckCircle size={24} className="text-[#00C805]" />;
            case 'FLAGGED_HIGH': return <XCircle size={24} className="text-[#FF4444]" />;
            case 'FLAGGED_LOW': return <AlertTriangle size={24} className="text-[#FFB800]" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 p-8 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                    <HyperShock size={48} />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-black">Shock-Proof Rate Benchmark</h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 bg-black text-[#00C805] text-[10px] font-bold uppercase rounded border border-black tracking-wider">BSTS + GARCH</span>
                            s-ETS Algorithm • Separates Base Rate from Disruption Premium
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchBenchmarks}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left: Rate Validator */}
                <div className="col-span-4 space-y-6">
                    {/* Validator Card */}
                    <div className="bg-black text-white rounded-xl p-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                            <Geo3DLightning size={18} />
                            Rate Validator
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Lane</label>
                                <select
                                    value={selectedLane}
                                    onChange={(e) => setSelectedLane(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                                >
                                    {lanes.map(lane => (
                                        <option key={lane} value={lane}>{lane}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Submitted Rate (₹)</label>
                                <input
                                    type="number"
                                    value={inputRate}
                                    onChange={(e) => setInputRate(e.target.value)}
                                    placeholder="e.g., 80000"
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                                />
                            </div>

                            <button
                                onClick={handleValidateRate}
                                disabled={validating || !inputRate}
                                className="w-full bg-[#0f62fe] hover:bg-blue-600 text-white font-bold py-3 rounded disabled:opacity-50"
                            >
                                {validating ? 'Validating...' : 'Validate Rate'}
                            </button>
                        </div>
                    </div>

                    {/* Validation Result */}
                    {validationResult && (
                        <div
                            className="rounded-xl p-6 border-2"
                            style={{
                                borderColor: getVerdictColor(validationResult.verdict),
                                backgroundColor: `${getVerdictColor(validationResult.verdict)}10`
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                {getVerdictIcon(validationResult.verdict)}
                                <span
                                    className="text-xl font-bold"
                                    style={{ color: getVerdictColor(validationResult.verdict) }}
                                >
                                    {validationResult.verdict.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Submitted:</span>
                                    <span className="font-bold">₹{validationResult.submitted_rate.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Base Level:</span>
                                    <span className="font-mono">₹{validationResult.base_level.toLocaleString()}</span>
                                </div>
                                {validationResult.is_disruption && (
                                    <div className="flex justify-between text-[#FFB800]">
                                        <span>+ Shock Premium:</span>
                                        <span className="font-mono">₹{validationResult.shock_premium.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-gray-300 pt-2">
                                    <span className="font-bold">Benchmark:</span>
                                    <span className="font-bold">₹{validationResult.benchmark.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Variance:</span>
                                    <span
                                        className="font-bold"
                                        style={{ color: getVerdictColor(validationResult.verdict) }}
                                    >
                                        {validationResult.variance_pct > 0 ? '+' : ''}{validationResult.variance_pct}%
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 mt-4 p-2 bg-white rounded">
                                {validationResult.explanation}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Lane Benchmarks */}
                <div className="col-span-8">
                    <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
                        <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={16} />
                                Lane Benchmarks
                            </h3>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#00C805] rounded-full"></div>
                                    Normal
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#FFB800] rounded-full animate-pulse"></div>
                                    Disruption Active
                                </div>
                            </div>
                        </div>

                        <table className="w-full">
                            <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left">Lane</th>
                                    <th className="px-4 py-3 text-right">Base Level</th>
                                    <th className="px-4 py-3 text-right">Shock</th>
                                    <th className="px-4 py-3 text-right">Total Benchmark</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Disruption</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {benchmarks.map((b, i) => (
                                    <tr key={i} className={`hover:bg-gray-50 ${b.is_disruption ? 'bg-amber-50' : ''}`}>
                                        <td className="px-4 py-3 font-medium">{b.lane}</td>
                                        <td className="px-4 py-3 text-right font-mono">₹{b.base_level.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-mono text-[#FFB800]">
                                            {b.shock_component > 0 ? `+₹${b.shock_component.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold font-mono">
                                            ₹{b.total_benchmark.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {b.is_disruption ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-black bg-[#FFB800] px-2 py-1 rounded">
                                                    <Geo3DLightning size={12} /> SHOCK
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#00C805] px-2 py-1 rounded">
                                                    <Geo3DShield size={12} /> NORMAL
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleDisruption(b.lane, b.is_disruption)}
                                                className={`text-xs font-bold px-3 py-1 rounded transition-all ${b.is_disruption
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                            >
                                                {b.is_disruption ? 'End Strike' : 'Start Strike'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Algorithm Explanation */}
                    <div className="mt-6 bg-gray-100 rounded-xl p-6">
                        <h3 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Geo3DShield size={18} />
                            How s-ETS Works
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="bg-white p-4 rounded-lg border">
                                <div className="text-xs text-gray-500 uppercase mb-1">Normal Day</div>
                                <div className="font-mono font-bold">Benchmark = Base Level</div>
                                <div className="text-xs text-gray-600 mt-2">₹40,000 rate → Approved</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-[#FFB800]">
                                <div className="text-xs text-[#FFB800] uppercase mb-1">During Strike</div>
                                <div className="font-mono font-bold">Benchmark = Base + Shock</div>
                                <div className="text-xs text-gray-600 mt-2">₹80,000 rate → Approved (₹40K + ₹40K shock)</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-[#00C805]">
                                <div className="text-xs text-[#00C805] uppercase mb-1">Strike Ends</div>
                                <div className="font-mono font-bold">Shock → 0 Instantly</div>
                                <div className="text-xs text-gray-600 mt-2">₹80,000 rate → Flagged (100% over)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShockRateBenchmark;
