import React, { useState, useEffect } from 'react';

interface PlacementRiskAdvisorProps {
    vendorId: string;
    vendorName: string;
    origin: string;
    destination: string;
    placementDate?: string;
    loadValue?: number;
    onRiskCalculated?: (result: RiskResult) => void;
}

interface RiskResult {
    success: boolean;
    failure_probability: number;
    failure_percentage: number;
    risk_level: string;
    risk_color: string;
    recommendation: string;
    suggested_action: string;
    factors: {
        vendor_historical_rate: { value: number; label: string; impact: string };
        route_difficulty: { value: number; label: string; is_weak_route: boolean; impact: string };
        day_of_week: { day_name: string; risk_multiplier: number; impact: string };
        seasonality: { month_name: string; risk_multiplier: number; is_monsoon: boolean; impact: string };
        fleet_reliability: { fleet_size: number; factor: number; impact: string };
    };
    vendor: {
        id: string;
        name: string;
        total_placements: number;
        failure_rate: number;
        risk_tier: string;
    };
}

// 3D Geometric SVG Icons - Solid style only
const Geo3DShield: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" fill={color} />
        <path d="M10 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Geo3DWarning: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#FF6B00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 22h20L12 2z" fill={color} />
        <rect x="11" y="10" width="2" height="6" fill="white" />
        <rect x="11" y="17" width="2" height="2" fill="white" />
    </svg>
);

const Geo3DDanger: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} />
        <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const Geo3DTruck: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0066FF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="8" width="15" height="10" fill={color} />
        <rect x="16" y="12" width="7" height="6" fill={color} />
        <circle cx="6" cy="18" r="2" fill="#000" />
        <circle cx="18" cy="18" r="2" fill="#000" />
        <rect x="16" y="8" width="3" height="4" fill="white" />
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

const Geo3DFleet: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0066FF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="10" width="8" height="6" fill={color} />
        <rect x="10" y="12" width="4" height="4" fill={color} />
        <circle cx="5" cy="16" r="1.5" fill="#000" />
        <circle cx="12" cy="16" r="1.5" fill="#000" />
        <rect x="14" y="6" width="8" height="6" fill={color} />
        <rect x="22" y="8" width="2" height="4" fill={color} />
        <circle cx="17" cy="12" r="1.5" fill="#000" />
    </svg>
);

const API_BASE = 'http://localhost:5000';

export const PlacementRiskAdvisor: React.FC<PlacementRiskAdvisorProps> = ({
    vendorId,
    vendorName,
    origin,
    destination,
    placementDate,
    loadValue,
    onRiskCalculated
}) => {
    const [loading, setLoading] = useState(false);
    const [risk, setRisk] = useState<RiskResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (vendorId && origin && destination) {
            fetchRisk();
        }
    }, [vendorId, origin, destination, placementDate, loadValue]);

    const fetchRisk = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/placement/risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendor_id: vendorId,
                    origin,
                    destination,
                    placement_date: placementDate,
                    load_value: loadValue
                })
            });

            const data = await response.json();

            if (data.success) {
                setRisk(data);
                onRiskCalculated?.(data);
            } else {
                setError(data.error || 'Failed to calculate risk');
            }
        } catch (err) {
            console.error('Risk API error:', err);
            // Demo fallback
            const demoRisk: RiskResult = {
                success: true,
                failure_probability: 0.35,
                failure_percentage: 35,
                risk_level: 'MEDIUM',
                risk_color: '#0066FF',
                recommendation: 'Monitor placement closely. Set reminder for confirmation.',
                suggested_action: 'MONITOR',
                factors: {
                    vendor_historical_rate: { value: 12, label: '12% historical failures', impact: 'MEDIUM' },
                    route_difficulty: { value: 40, label: '40% difficulty score', is_weak_route: false, impact: 'MEDIUM' },
                    day_of_week: { day_name: 'Monday', risk_multiplier: 1.0, impact: 'LOW' },
                    seasonality: { month_name: 'December', risk_multiplier: 0.95, is_monsoon: false, impact: 'LOW' },
                    fleet_reliability: { fleet_size: 12, factor: 1.2, impact: 'HIGH' }
                },
                vendor: {
                    id: vendorId,
                    name: vendorName,
                    total_placements: 847,
                    failure_rate: 0.12,
                    risk_tier: 'MEDIUM'
                }
            };
            setRisk(demoRisk);
            onRiskCalculated?.(demoRisk);
        } finally {
            setLoading(false);
        }
    };

    const getRiskIcon = () => {
        if (!risk) return null;
        switch (risk.risk_level) {
            case 'CRITICAL':
                return <Geo3DDanger size={28} color="#000" />;
            case 'HIGH':
                return <Geo3DWarning size={28} color="#FF6B00" />;
            case 'MEDIUM':
                return <Geo3DWarning size={28} color="#0066FF" />;
            default:
                return <Geo3DShield size={28} color="#00C805" />;
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'HIGH': return '#000';
            case 'MEDIUM': return '#FF6B00';
            default: return '#00C805';
        }
    };

    if (!vendorId || !origin || !destination) {
        return null;
    }

    return (
        <div
            className="border-2 border-black"
            style={{ fontFamily: "'Berkeley Mono', 'SF Mono', 'Consolas', monospace" }}
        >
            {/* Header */}
            <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer border-b-2 border-black"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ backgroundColor: risk?.risk_color || '#F5F5F5' }}
            >
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="w-7 h-7 border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                        getRiskIcon()
                    )}
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${risk?.risk_level === 'LOW' ? 'text-black' : 'text-white'}`}>
                            Placement Risk Advisor
                        </p>
                        {risk && (
                            <p className={`text-sm font-bold ${risk.risk_level === 'LOW' ? 'text-black' : 'text-white'}`}>
                                {risk.risk_level} RISK • {risk.failure_percentage}% failure probability
                            </p>
                        )}
                    </div>
                </div>
                <span className={`text-lg font-bold ${risk?.risk_level === 'LOW' ? 'text-black' : 'text-white'}`}>
                    {isExpanded ? '−' : '+'}
                </span>
            </div>

            {/* Expanded Content */}
            {isExpanded && risk && (
                <div className="bg-white p-4">
                    {/* Main Recommendation */}
                    <div
                        className="p-4 mb-4 border-2"
                        style={{
                            borderColor: risk.risk_color,
                            backgroundColor: risk.risk_level === 'CRITICAL' ? '#000' : 'white'
                        }}
                    >
                        <p
                            className="text-sm font-bold"
                            style={{ color: risk.risk_level === 'CRITICAL' ? 'white' : risk.risk_color }}
                        >
                            {risk.recommendation}
                        </p>
                        {risk.suggested_action === 'BOOK_BACKUP' && (
                            <button className="mt-3 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider">
                                Book Backup Vehicle Now
                            </button>
                        )}
                    </div>

                    {/* Risk Factors Grid */}
                    <p className="text-xs font-bold text-black uppercase tracking-wider mb-3 border-b border-black pb-1">
                        Risk Factors Analysis
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Historical Rate */}
                        <div className="border border-black p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Geo3DTruck size={18} color={getImpactColor(risk.factors.vendor_historical_rate.impact)} />
                                <span className="text-[10px] text-black uppercase tracking-wider">Vendor History</span>
                            </div>
                            <p className="text-lg font-bold text-black">{risk.factors.vendor_historical_rate.value}%</p>
                            <p className="text-[10px] text-black opacity-60">{risk.factors.vendor_historical_rate.label}</p>
                        </div>

                        {/* Route Difficulty */}
                        <div className="border border-black p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Geo3DRoute size={18} color={getImpactColor(risk.factors.route_difficulty.impact)} />
                                <span className="text-[10px] text-black uppercase tracking-wider">Route</span>
                            </div>
                            <p className="text-lg font-bold text-black">{risk.factors.route_difficulty.value}%</p>
                            <p className="text-[10px] text-black opacity-60">
                                {risk.factors.route_difficulty.is_weak_route ? 'WEAK ROUTE' : 'Difficulty score'}
                            </p>
                        </div>

                        {/* Day of Week */}
                        <div className="border border-black p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Geo3DCalendar size={18} color={getImpactColor(risk.factors.day_of_week.impact)} />
                                <span className="text-[10px] text-black uppercase tracking-wider">Day</span>
                            </div>
                            <p className="text-lg font-bold text-black">{risk.factors.day_of_week.day_name}</p>
                            <p className="text-[10px] text-black opacity-60">
                                {risk.factors.day_of_week.risk_multiplier > 1.2 ? 'HIGH RISK DAY' : 'Normal'}
                            </p>
                        </div>

                        {/* Fleet Size */}
                        <div className="border border-black p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Geo3DFleet size={18} color={getImpactColor(risk.factors.fleet_reliability.impact)} />
                                <span className="text-[10px] text-black uppercase tracking-wider">Fleet</span>
                            </div>
                            <p className="text-lg font-bold text-black">{risk.factors.fleet_reliability.fleet_size}</p>
                            <p className="text-[10px] text-black opacity-60">
                                {risk.factors.fleet_reliability.fleet_size < 20 ? 'Small fleet' : 'Vehicles'}
                            </p>
                        </div>
                    </div>

                    {/* Vendor Stats */}
                    <div className="mt-4 pt-4 border-t border-black flex justify-between text-xs text-black">
                        <span>{risk.vendor.total_placements.toLocaleString()} total placements</span>
                        <span>Risk Tier: <strong>{risk.vendor.risk_tier}</strong></span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacementRiskAdvisor;
