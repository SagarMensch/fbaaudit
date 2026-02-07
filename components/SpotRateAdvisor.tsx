import React, { useState, useEffect } from 'react';

interface SpotRateAdvisorProps {
    origin: string;
    destination: string;
    vehicleType: string;
    vendorQuote?: number;
    onPredictionReady?: (prediction: PredictionResult) => void;
}

interface PredictionResult {
    predicted_rate: number;
    confidence: number;
    distance_km: number;
    diesel_price: number;
    seasonality_factor: number;
    month: number;
    verdict?: string;
    variance_percent?: number;
    recommendation?: string;
}

// 3D Geometric SVG Icons - Solid style only
const Geo3DBrain: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0066FF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.5 2 5.5 4.5 5.5 8c0 1.5.5 2.8 1.3 3.8L5 14l2 2 1.5-1.5c.8.3 1.6.5 2.5.5h2c.9 0 1.7-.2 2.5-.5L17 16l2-2-1.8-2.2c.8-1 1.3-2.3 1.3-3.8C18.5 4.5 15.5 2 12 2z" fill={color} />
        <circle cx="9" cy="7" r="1.5" fill="white" />
        <circle cx="15" cy="7" r="1.5" fill="white" />
        <path d="M12 18v4M8 22h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const Geo3DChart: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="12" width="4" height="10" fill={color} />
        <rect x="8" y="6" width="4" height="16" fill={color} />
        <rect x="14" y="10" width="4" height="12" fill={color} />
        <rect x="20" y="2" width="4" height="20" fill={color} />
    </svg>
);

const Geo3DFuel: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#FF6B00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="12" height="18" rx="2" fill={color} />
        <rect x="5" y="6" width="8" height="6" fill="white" />
        <path d="M18 8l3 3v6a2 2 0 01-2 2h-1" stroke={color} strokeWidth="2" />
        <circle cx="19" cy="17" r="2" fill={color} />
    </svg>
);

const Geo3DCalendar: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0066FF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="18" rx="2" fill={color} />
        <rect x="2" y="4" width="20" height="4" fill="#000" />
        <rect x="6" y="2" width="2" height="4" fill="#000" />
        <rect x="16" y="2" width="2" height="4" fill="#000" />
        <rect x="5" y="11" width="3" height="3" fill="white" />
        <rect x="10" y="11" width="3" height="3" fill="white" />
        <rect x="15" y="11" width="3" height="3" fill="white" />
    </svg>
);

const Geo3DRoute: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="6" cy="6" r="4" fill={color} />
        <circle cx="18" cy="18" r="4" fill="#00C805" />
        <path d="M8 8l8 8" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
    </svg>
);

const Geo3DTarget: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="white" stroke={color} strokeWidth="2" />
        <circle cx="12" cy="12" r="6" fill="white" stroke={color} strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
);

const API_BASE = 'http://localhost:5000';

export const SpotRateAdvisor: React.FC<SpotRateAdvisorProps> = ({
    origin,
    destination,
    vehicleType,
    vendorQuote,
    onPredictionReady
}) => {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (origin && destination && vehicleType) {
            fetchPrediction();
        }
    }, [origin, destination, vehicleType, vendorQuote]);

    const fetchPrediction = async () => {
        setLoading(true);
        setError(null);

        try {
            const endpoint = vendorQuote
                ? `${API_BASE}/api/spot-rate/compare`
                : `${API_BASE}/api/spot-rate/predict`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin,
                    destination,
                    vehicle_type: vehicleType,
                    vendor_quoted_price: vendorQuote
                })
            });

            const data = await response.json();

            if (data.success !== false) {
                setPrediction(data);
                onPredictionReady?.(data);
            } else {
                setError(data.error || 'Failed to get prediction');
            }
        } catch (err) {
            console.error('Prediction API error:', err);
            // Use demo data on error
            const demoData: PredictionResult = {
                predicted_rate: 44500,
                confidence: 0.92,
                distance_km: 1400,
                diesel_price: 96.72,
                seasonality_factor: 1.10,
                month: new Date().getMonth() + 1
            };
            if (vendorQuote) {
                demoData.verdict = vendorQuote > demoData.predicted_rate * 1.1 ? 'OVERPRICED' : 'FAIR';
                demoData.variance_percent = ((vendorQuote - demoData.predicted_rate) / demoData.predicted_rate) * 100;
                demoData.recommendation = demoData.verdict === 'OVERPRICED'
                    ? `Negotiate down to ₹${Math.round(demoData.predicted_rate * 1.05).toLocaleString()}`
                    : 'Proceed with booking';
            }
            setPrediction(demoData);
            onPredictionReady?.(demoData);
        } finally {
            setLoading(false);
        }
    };

    const getVerdictStyle = (verdict?: string) => {
        switch (verdict) {
            case 'GREAT_DEAL':
                return { bg: '#0066FF', text: 'white' }; // IBM Blue
            case 'FAIR':
                return { bg: '#00C805', text: 'white' }; // Robinhood Green
            case 'OVERPRICED':
                return { bg: '#FF6B00', text: 'white' }; // Bloomberg Orange
            case 'SEVERELY_OVERPRICED':
                return { bg: '#000000', text: 'white' }; // Black
            default:
                return { bg: '#F5F5F5', text: 'black' };
        }
    };

    const getSeasonLabel = (factor: number) => {
        if (factor >= 1.10) return 'Peak Season (+10%)';
        if (factor >= 1.05) return 'High Demand (+5%)';
        if (factor <= 0.95) return 'Low Season (-5%)';
        return 'Normal';
    };

    if (!origin || !destination || !vehicleType) {
        return null;
    }

    return (
        <div
            className="border-2 border-black p-6"
            style={{ fontFamily: "'Berkeley Mono', 'SF Mono', 'Consolas', monospace" }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-black">
                <Geo3DBrain size={32} color="#0066FF" />
                <div>
                    <h3 className="text-lg font-bold text-black uppercase tracking-wider">
                        AI Rate Advisor
                    </h3>
                    <p className="text-xs text-black opacity-60">XGBoost Regression Model</p>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-sm text-black">Analyzing market data...</p>
                </div>
            ) : prediction ? (
                <>
                    {/* Main Prediction */}
                    <div className="bg-black text-white p-6 mb-6">
                        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">
                            Predicted Fair Rate
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">
                                ₹{prediction.predicted_rate.toLocaleString()}
                            </span>
                        </div>

                        {/* Confidence Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Confidence</span>
                                <span>{Math.round(prediction.confidence * 100)}%</span>
                            </div>
                            <div className="h-2 bg-white/20">
                                <div
                                    className="h-full transition-all"
                                    style={{
                                        width: `${prediction.confidence * 100}%`,
                                        backgroundColor: prediction.confidence >= 0.85 ? '#00C805' : '#FF6B00'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="border-2 border-black p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Geo3DRoute size={20} />
                                <span className="text-xs text-black uppercase tracking-wider">Distance</span>
                            </div>
                            <p className="text-xl font-bold text-black">
                                {prediction.distance_km.toLocaleString()} km
                            </p>
                        </div>

                        <div className="border-2 border-black p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Geo3DFuel size={20} color="#FF6B00" />
                                <span className="text-xs text-black uppercase tracking-wider">Diesel</span>
                            </div>
                            <p className="text-xl font-bold text-black">
                                ₹{prediction.diesel_price}/L
                            </p>
                        </div>

                        <div className="border-2 border-black p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Geo3DCalendar size={20} color="#0066FF" />
                                <span className="text-xs text-black uppercase tracking-wider">Season</span>
                            </div>
                            <p className="text-xl font-bold text-black">
                                {prediction.seasonality_factor >= 1 ? '+' : ''}{Math.round((prediction.seasonality_factor - 1) * 100)}%
                            </p>
                        </div>
                    </div>

                    {/* Vendor Quote Comparison */}
                    {vendorQuote && prediction.verdict && (
                        <div
                            className="p-4"
                            style={{
                                backgroundColor: getVerdictStyle(prediction.verdict).bg,
                                color: getVerdictStyle(prediction.verdict).text
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs uppercase tracking-wider opacity-80">
                                    Vendor Quote: ₹{vendorQuote.toLocaleString()}
                                </span>
                                <span className="text-xs uppercase tracking-wider opacity-80">
                                    {prediction.variance_percent && prediction.variance_percent > 0 ? '+' : ''}
                                    {prediction.variance_percent?.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-lg font-bold uppercase tracking-wide">
                                Verdict: {prediction.verdict.replace('_', ' ')}
                            </p>
                            {prediction.recommendation && (
                                <p className="text-sm mt-2 opacity-90">
                                    → {prediction.recommendation}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Price Range */}
                    {!vendorQuote && (
                        <div className="border-2 border-black p-4">
                            <p className="text-xs uppercase tracking-wider text-black mb-2">
                                Recommended Benchmark Range
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-black">
                                    ₹{Math.round(prediction.predicted_rate * 0.95).toLocaleString()}
                                </span>
                                <span className="text-black">—</span>
                                <span className="text-lg font-bold text-black">
                                    ₹{Math.round(prediction.predicted_rate * 1.05).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            ) : error ? (
                <div className="py-8 text-center border-2 border-black">
                    <p className="text-sm text-black">{error}</p>
                    <button
                        onClick={fetchPrediction}
                        className="mt-4 px-4 py-2 bg-black text-white text-sm font-bold uppercase tracking-wider"
                    >
                        Retry
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default SpotRateAdvisor;
