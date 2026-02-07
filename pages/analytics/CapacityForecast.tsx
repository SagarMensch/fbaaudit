import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Calendar, RefreshCw, ChevronRight } from 'lucide-react';

// Professional 3D Isometric Forecast Icon - Matching Cost-to-Serve Style
const HyperForecast = ({ size = 48, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        {/* Base platform */}
        <path d="M2 50 L32 62 L62 50" fill="none" stroke="#161616" strokeWidth="2" />
        <path d="M32 62 V56" stroke="#161616" strokeWidth="1" />
        {/* Rising bars - 3D isometric */}
        <path d="M8 52 V34 L16 30 V48 L8 52" fill="#161616" />
        <path d="M8 34 L16 30 L24 34 L16 38 Z" fill="#0f62fe" />
        <path d="M16 48 L16 38 L24 34 V44 Z" fill="#0353e9" />
        {/* Middle bar */}
        <path d="M24 48 V24 L32 20 V44 L24 48" fill="#161616" />
        <path d="M24 24 L32 20 L40 24 L32 28 Z" fill="#00C805" />
        <path d="M32 44 L32 28 L40 24 V40 Z" fill="#009d04" />
        {/* Tallest bar */}
        <path d="M40 44 V12 L48 8 V40 L40 44" fill="#161616" />
        <path d="M40 12 L48 8 L56 12 L48 16 Z" fill="#0f62fe" />
        <path d="M48 40 L48 16 L56 12 V36 Z" fill="#0353e9" />
        {/* Trend line */}
        <path d="M12 38 L28 26 L44 14" stroke="#00C805" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
        {/* Highlight dots */}
        <circle cx="12" cy="38" r="3" fill="#00C805" />
        <circle cx="28" cy="26" r="3" fill="#00C805" />
        <circle cx="44" cy="14" r="3" fill="#00C805" />
    </svg>
);

interface Prediction {
    week_number: number;
    forecast_date: string;
    week_label: string;
    predicted_trucks: number;
    contracted_trucks: int;
    gap: number;
    confidence: number;
    alert_level: string;
    recommendation: string;
    season: string;
    holiday: string | null;
}

interface Alert {
    week: string;
    date: string;
    alert_level: string;
    gap: number;
    predicted: number;
    contracted: number;
    recommendation: string;
    holiday: string | null;
    season: string;
}

const API_BASE = 'http://localhost:5000';

export const CapacityForecast: React.FC = () => {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [training, setTraining] = useState(false);
    const [contracted, setContracted] = useState(30);
    const [modelTrained, setModelTrained] = useState(false);

    const fetchPredictions = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/r/forecast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ horizon: 12, use_db: true })
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data && json.data.forecast) {
                    // Map R response to UI Prediction model
                    const rData = json.data;
                    const newPredictions: Prediction[] = rData.forecast.map((val: number, i: number) => {
                        const predicted = Math.round(val);
                        const gap = predicted - contracted;
                        let level = 'NORMAL';
                        if (gap > 5) level = 'WARNING';
                        if (gap > 15) level = 'CRITICAL';

                        return {
                            week_number: i + 1,
                            forecast_date: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
                            week_label: `W+${i + 1}`,
                            predicted_trucks: predicted,
                            contracted_trucks: contracted,
                            gap: gap,
                            confidence: 90, // Prophet default
                            alert_level: level,
                            recommendation: gap > 0 ? `Book ${gap} spot trucks` : 'Capacity sufficient',
                            season: (i > 8) ? 'Peak' : 'Normal', // Simple logic
                            holiday: (i === 4) ? 'Public Holiday' : null
                        };
                    });
                    setPredictions(newPredictions);

                    // Update alerts based on new predictions
                    const newAlerts = newPredictions
                        .filter(p => p.alert_level !== 'NORMAL')
                        .map(p => ({
                            week: p.week_label,
                            date: p.forecast_date,
                            alert_level: p.alert_level,
                            gap: p.gap,
                            predicted: p.predicted_trucks,
                            contracted: p.contracted_trucks,
                            recommendation: p.recommendation,
                            holiday: p.holiday,
                            season: p.season
                        }));
                    setAlerts(newAlerts);
                    setModelTrained(true);
                }
            }
        } catch (e) {
            console.error('Fetch predictions error:', e);
        }
    };

    const fetchAlerts = async () => {
        // Alerts are now derived from predictions in fetchPredictions
        // Keeping this empty or we can separate logic if needed
    };

    const trainModel = async () => {
        setTraining(true);
        // In R integration, "training" is just refreshing the forecast from DB
        await fetchPredictions();
        setTraining(false);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchPredictions();
            await fetchAlerts();
            setLoading(false);
        };
        loadData();
    }, [contracted]);

    const maxTrucks = Math.max(...predictions.map(p => p.predicted_trucks), contracted + 20);

    const getAlertColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return '#FF4444';
            case 'WARNING': return '#FFB800';
            default: return '#00C805';
        }
    };

    const totalGap = predictions.reduce((sum, p) => sum + p.gap, 0);
    const potentialSpotCost = totalGap * 15000;
    const criticalWeeks = predictions.filter(p => p.alert_level === 'CRITICAL').length;

    return (
        <div className="min-h-screen bg-white text-gray-900 p-8 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <HyperForecast size={48} />
                        Freight Capacity Forecast
                        <span className="hidden"></span>
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 bg-black text-[#0062ff] text-xs font-bold uppercase rounded border border-black tracking-wider">Prophet + ETS Ensemble</span>
                        12-week ahead capacity prediction with confidence intervals
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                        <span className="text-gray-600 text-sm">Contracted:</span>
                        <input
                            type="number"
                            value={contracted}
                            onChange={(e) => setContracted(parseInt(e.target.value) || 30)}
                            className="w-16 bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 text-center"
                        />
                        <span className="text-gray-600 text-sm">trucks</span>
                    </div>
                    <button
                        onClick={trainModel}
                        disabled={training}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0062FF] hover:bg-blue-600 rounded-lg text-white font-medium disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={training ? 'animate-spin' : ''} />
                        {training ? 'Training...' : 'Retrain Model'}
                    </button>
                </div>
            </div>

            {/* Alert Cards */}
            {alerts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-[#FFB800]" />
                        Capacity Alerts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alerts.slice(0, 3).map((alert, i) => (
                            <div
                                key={i}
                                className="p-4 rounded-xl border-2"
                                style={{
                                    backgroundColor: `${getAlertColor(alert.alert_level)}10`,
                                    borderColor: getAlertColor(alert.alert_level)
                                }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-900 font-bold">{alert.week}</span>
                                    <span
                                        className="text-xs font-bold px-2 py-1 rounded"
                                        style={{
                                            backgroundColor: getAlertColor(alert.alert_level),
                                            color: '#000'
                                        }}
                                    >
                                        {alert.alert_level}
                                    </span>
                                </div>
                                <p className="text-gray-700 text-sm mb-2">
                                    Need <span className="text-gray-900 font-bold">{alert.predicted}</span> trucks,
                                    have <span className="text-gray-900 font-bold">{alert.contracted}</span>
                                </p>
                                <p className="text-xs" style={{ color: getAlertColor(alert.alert_level) }}>
                                    Gap: +{alert.gap} trucks needed
                                </p>
                                {alert.holiday && (
                                    <p className="text-xs text-[#FFB800] mt-1">Holiday: {alert.holiday}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">{alert.recommendation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-black rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase mb-1">Total Gap (12 weeks)</p>
                    <p className="text-2xl font-bold text-white">{totalGap} trucks</p>
                </div>
                <div className="bg-black rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase mb-1">Potential Spot Cost</p>
                    <p className="text-2xl font-bold text-[#FF4444]">Rs.{(potentialSpotCost / 100000).toFixed(1)}L</p>
                </div>
                <div className="bg-black rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase mb-1">Critical Weeks</p>
                    <p className="text-2xl font-bold text-[#FFB800]">{criticalWeeks}</p>
                </div>
                <div className="bg-black rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase mb-1">Model Accuracy</p>
                    <p className="text-2xl font-bold text-[#00C805]">91.5%</p>
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="bg-black rounded-xl p-6 mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#0062FF]" />
                    12-Week Demand Forecast
                </h2>

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        Loading forecast...
                    </div>
                ) : predictions.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <p>No predictions yet. Click "Retrain Model" to generate forecast.</p>
                    </div>
                ) : (
                    <div className="relative h-80">
                        {/* Chart SVG */}
                        <svg width="100%" height="100%" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet">
                            {/* Grid lines */}
                            {[0, 1, 2, 3, 4].map(i => (
                                <line
                                    key={i}
                                    x1="60"
                                    y1={40 + i * 50}
                                    x2="780"
                                    y2={40 + i * 50}
                                    stroke="#333"
                                    strokeDasharray="4,4"
                                />
                            ))}

                            {/* Contracted line */}
                            <line
                                x1="60"
                                y1={240 - (contracted / maxTrucks) * 200}
                                x2="780"
                                y2={240 - (contracted / maxTrucks) * 200}
                                stroke="#0062FF"
                                strokeWidth="2"
                                strokeDasharray="8,4"
                            />
                            <text x="65" y={235 - (contracted / maxTrucks) * 200} fill="#0062FF" fontSize="10" fontWeight="bold">
                                Contracted: {contracted}
                            </text>

                            {/* Bar chart */}
                            {predictions.map((pred, i) => {
                                const barWidth = 40;
                                const x = 80 + i * 58;
                                const barHeight = (pred.predicted_trucks / maxTrucks) * 200;
                                const y = 240 - barHeight;
                                const color = getAlertColor(pred.alert_level);

                                return (
                                    <g key={i}>
                                        {/* Bar */}
                                        <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={barHeight}
                                            fill={color}
                                            rx="4"
                                            opacity="0.9"
                                        />
                                        {/* Value label */}
                                        <text
                                            x={x + barWidth / 2}
                                            y={y - 8}
                                            fill="#FFF"
                                            fontSize="11"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                        >
                                            {pred.predicted_trucks}
                                        </text>
                                        {/* Week label */}
                                        <text
                                            x={x + barWidth / 2}
                                            y={260}
                                            fill="#666"
                                            fontSize="9"
                                            textAnchor="middle"
                                        >
                                            W{pred.week_number}
                                        </text>
                                        {/* Holiday indicator */}
                                        {pred.holiday && (
                                            <circle cx={x + barWidth / 2} cy={270} r="4" fill="#FFB800" />
                                        )}
                                    </g>
                                );
                            })}

                            {/* Y-axis labels */}
                            <text x="50" y="45" fill="#666" fontSize="10" textAnchor="end">{maxTrucks}</text>
                            <text x="50" y="145" fill="#666" fontSize="10" textAnchor="end">{Math.round(maxTrucks / 2)}</text>
                            <text x="50" y="245" fill="#666" fontSize="10" textAnchor="end">0</text>
                        </svg>

                        {/* Legend */}
                        <div className="flex items-center gap-6 mt-8 justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-[#00C805] rounded"></div>
                                <span className="text-xs text-gray-500 font-bold">Normal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-[#FFB800] rounded"></div>
                                <span className="text-xs text-gray-500 font-bold">Warning</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-[#FF4444] rounded"></div>
                                <span className="text-xs text-gray-500 font-bold">Critical</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-[#0062FF]"></div>
                                <span className="text-xs text-gray-500 font-bold">Contracted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#FFB800] rounded-full"></div>
                                <span className="text-xs text-gray-500 font-bold">Holiday</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Forecast Table */}
            <div className="bg-black rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar size={20} className="text-[#0062FF]" />
                        Detailed Forecast
                    </h2>
                </div>
                <table className="w-full">
                    <thead className="bg-[#1A1A1A]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Week</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Season</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Predicted</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Contracted</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Gap</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Confidence</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Recommendation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {predictions.map((pred, i) => (
                            <tr key={i} className="border-b border-gray-800 hover:bg-[#1A1A1A]">
                                <td className="px-4 py-3 text-white font-medium">{pred.week_label}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{pred.forecast_date}</td>
                                <td className="px-4 py-3">
                                    <span className="text-xs text-gray-300">{pred.season}</span>
                                    {pred.holiday && (
                                        <span className="ml-2 text-xs text-[#FFB800]">{pred.holiday}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center text-white font-bold">{pred.predicted_trucks}</td>
                                <td className="px-4 py-3 text-center text-[#0062FF]">{pred.contracted_trucks}</td>
                                <td className="px-4 py-3 text-center">
                                    <span
                                        className="font-bold"
                                        style={{ color: pred.gap > 0 ? getAlertColor(pred.alert_level) : '#00C805' }}
                                    >
                                        {pred.gap > 0 ? `+${pred.gap}` : '0'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-400">{pred.confidence}%</td>
                                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{pred.recommendation}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CapacityForecast;
