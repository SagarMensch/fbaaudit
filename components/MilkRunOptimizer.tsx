import React, { useState, useEffect } from 'react';

interface MilkRun {
    cluster_id: number;
    cluster_name: string;
    origin: string;
    destinations: string[];
    orders: Array<{
        order_id: string;
        destination: string;
        weight_kg: number;
        value_inr: number;
    }>;
    total_orders: number;
    total_weight_kg: number;
    total_value_inr: number;
    individual_shipping_cost: number;
    consolidated_cost: number;
    savings_inr: number;
    savings_percent: number;
    recommended_truck: string;
    truck_capacity_kg: number;
    capacity_utilization: number;
    total_distance_km: number;
    route: string[];
    is_recommended: boolean;
}

interface OptimizationResult {
    success: boolean;
    optimization_date: string;
    algorithm: string;
    summary: {
        total_orders: number;
        milk_runs_created: number;
        total_individual_cost: number;
        total_consolidated_cost: number;
        total_savings_inr: number;
        total_savings_percent: number;
    };
    milk_runs: MilkRun[];
    recommendation: string;
}

// 3D Geometric SVG Icons - Solid style only
const Geo3DCluster: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0066FF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill={color} />
        <circle cx="6" cy="6" r="3" fill={color} />
        <circle cx="18" cy="6" r="3" fill={color} />
        <circle cx="6" cy="18" r="3" fill={color} />
        <circle cx="18" cy="18" r="3" fill={color} />
        <path d="M12 8V6M8 10l-2-2M16 10l2-2M8 14l-2 2M16 14l2 2" stroke={color} strokeWidth="1.5" />
    </svg>
);

const Geo3DTruck: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="8" width="15" height="10" fill={color} />
        <rect x="16" y="12" width="7" height="6" fill={color} />
        <circle cx="6" cy="18" r="2" fill="#000" />
        <circle cx="18" cy="18" r="2" fill="#000" />
        <rect x="16" y="8" width="3" height="4" fill="white" />
    </svg>
);

const Geo3DSavings: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} />
        <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const Geo3DRoute: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="6" cy="6" r="4" fill={color} />
        <circle cx="18" cy="18" r="4" fill="#00C805" />
        <path d="M8 8l8 8" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
    </svg>
);

const Geo3DPackage: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#FF6B00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" fill={color} />
        <path d="M12 22V12M2 7l10 5 10-5" stroke="white" strokeWidth="1.5" />
    </svg>
);

const Geo3DCheck: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} />
        <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const API_BASE = 'http://localhost:5000';

export const MilkRunOptimizer: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedRun, setExpandedRun] = useState<number | null>(null);

    useEffect(() => {
        fetchOptimization();
    }, []);

    const fetchOptimization = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/milkrun/demo`);
            const data = await response.json();

            if (data.success) {
                setResult(data);
            } else {
                setError(data.error || 'Failed to optimize');
            }
        } catch (err) {
            console.error('Milk Run API error:', err);
            setError('Failed to connect to optimization service');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString()}`;
    };

    return (
        <div
            className="border-2 border-black bg-white"
            style={{ fontFamily: "'Berkeley Mono', 'SF Mono', 'Consolas', monospace" }}
        >
            {/* Header */}
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Geo3DCluster size={32} color="#0066FF" />
                    <div>
                        <h2 className="text-lg font-bold uppercase tracking-wider">
                            Milk Run Optimizer
                        </h2>
                        <p className="text-xs text-white/60">K-Means Clustering Algorithm</p>
                    </div>
                </div>
                <button
                    onClick={fetchOptimization}
                    disabled={loading}
                    className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-100 disabled:opacity-50"
                >
                    {loading ? 'Optimizing...' : 'Re-Optimize'}
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-sm text-black">Clustering delivery points...</p>
                </div>
            ) : error ? (
                <div className="p-8 text-center border-t-2 border-black">
                    <p className="text-sm text-black mb-4">{error}</p>
                    <button
                        onClick={fetchOptimization}
                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase"
                    >
                        Retry
                    </button>
                </div>
            ) : result ? (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 border-b-2 border-black">
                        <div className="p-4 border-r border-black">
                            <p className="text-[10px] text-black/60 uppercase tracking-wider mb-1">Orders</p>
                            <p className="text-2xl font-bold text-black">{result.summary.total_orders}</p>
                        </div>
                        <div className="p-4 border-r border-black">
                            <p className="text-[10px] text-black/60 uppercase tracking-wider mb-1">Milk Runs</p>
                            <p className="text-2xl font-bold text-black">{result.summary.milk_runs_created}</p>
                        </div>
                        <div className="p-4 border-r border-black">
                            <p className="text-[10px] text-black/60 uppercase tracking-wider mb-1">Before</p>
                            <p className="text-2xl font-bold text-black">{formatCurrency(result.summary.total_individual_cost)}</p>
                        </div>
                        <div className="p-4 bg-[#00C805]">
                            <p className="text-[10px] text-white/80 uppercase tracking-wider mb-1">After</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(result.summary.total_consolidated_cost)}</p>
                        </div>
                    </div>

                    {/* Total Savings Banner */}
                    <div className="bg-[#00C805] p-4 flex items-center justify-between border-b-2 border-black">
                        <div className="flex items-center gap-3">
                            <Geo3DSavings size={28} color="white" />
                            <div>
                                <p className="text-xs text-white/80 uppercase tracking-wider">Total Savings</p>
                                <p className="text-2xl font-bold text-white">
                                    {formatCurrency(result.summary.total_savings_inr)} ({result.summary.total_savings_percent}%)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Milk Runs List */}
                    <div className="divide-y-2 divide-black">
                        {result.milk_runs.map((run) => (
                            <div key={run.cluster_id} className="bg-white">
                                {/* Run Header */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedRun(expandedRun === run.cluster_id ? null : run.cluster_id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 flex items-center justify-center border-2 border-black"
                                            style={{ backgroundColor: run.is_recommended ? '#00C805' : 'white' }}
                                        >
                                            <span className={`font-bold ${run.is_recommended ? 'text-white' : 'text-black'}`}>
                                                {run.cluster_id}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-black">{run.cluster_name}</p>
                                            <p className="text-xs text-black/60">
                                                {run.total_orders} orders • {run.total_weight_kg.toLocaleString()} kg • {run.recommended_truck}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-[#00C805]">
                                                Save {formatCurrency(run.savings_inr)}
                                            </p>
                                            <p className="text-xs text-black/60">{run.savings_percent}% savings</p>
                                        </div>
                                        <span className="text-xl text-black">{expandedRun === run.cluster_id ? '−' : '+'}</span>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedRun === run.cluster_id && (
                                    <div className="p-4 bg-gray-50 border-t border-black">
                                        {/* Route */}
                                        <div className="mb-4">
                                            <p className="text-[10px] text-black/60 uppercase tracking-wider mb-2">Route</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {run.route.map((city, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <span className="px-3 py-1 bg-black text-white text-xs font-bold">
                                                            {city}
                                                        </span>
                                                        {idx < run.route.length - 1 && (
                                                            <span className="text-black">→</span>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-4 gap-3 mb-4">
                                            <div className="border border-black p-3 bg-white">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Geo3DRoute size={16} />
                                                    <span className="text-[10px] text-black/60 uppercase">Distance</span>
                                                </div>
                                                <p className="text-lg font-bold text-black">{run.total_distance_km} km</p>
                                            </div>
                                            <div className="border border-black p-3 bg-white">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Geo3DTruck size={16} color="#0066FF" />
                                                    <span className="text-[10px] text-black/60 uppercase">Capacity</span>
                                                </div>
                                                <p className="text-lg font-bold text-black">{run.capacity_utilization}%</p>
                                            </div>
                                            <div className="border border-black p-3 bg-white">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Geo3DPackage size={16} color="#FF6B00" />
                                                    <span className="text-[10px] text-black/60 uppercase">Value</span>
                                                </div>
                                                <p className="text-lg font-bold text-black">{formatCurrency(run.total_value_inr)}</p>
                                            </div>
                                            <div className="border border-black p-3 bg-white">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Geo3DCheck size={16} color="#00C805" />
                                                    <span className="text-[10px] text-black/60 uppercase">Status</span>
                                                </div>
                                                <p className="text-lg font-bold text-[#00C805]">
                                                    {run.is_recommended ? 'Recommended' : 'Optional'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Orders Table */}
                                        <div className="border border-black">
                                            <div className="bg-black text-white px-3 py-2 text-xs font-bold uppercase tracking-wider">
                                                Orders in this Milk Run
                                            </div>
                                            <div className="divide-y divide-black">
                                                {run.orders.map((order) => (
                                                    <div key={order.order_id} className="px-3 py-2 flex justify-between items-center bg-white">
                                                        <div>
                                                            <span className="font-bold text-sm text-black">{order.order_id}</span>
                                                            <span className="text-xs text-black/60 ml-2">→ {order.destination}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-bold text-black">{order.weight_kg} kg</span>
                                                            <span className="text-xs text-black/60 ml-2">{formatCurrency(order.value_inr)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {run.is_recommended && (
                                            <button className="mt-4 w-full py-3 bg-[#00C805] text-white font-bold uppercase tracking-wider text-sm border-2 border-black">
                                                Create Milk Run Booking
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Recommendation Footer */}
                    <div className="bg-[#0066FF] p-4 border-t-2 border-black">
                        <p className="text-white text-sm font-bold">
                            {result.recommendation}
                        </p>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default MilkRunOptimizer;
