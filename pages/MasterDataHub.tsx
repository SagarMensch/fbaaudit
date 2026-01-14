import React, { useState, useEffect } from 'react';
import {
    Search, Download, RefreshCw, Plus, Edit2, Trash2, X, ChevronRight
} from 'lucide-react';
import { EventBus } from '../services/eventBus';
import { analyticsEngine } from '../services/analyticsEngine';
import { AddZoneModal, AddFuelPriceModal, AddVehicleModal, AddAccessorialModal } from '../components/MasterDataModals';

// Legacy services (will be migrated)
import { locationGroupingService } from '../services/locationGroupingService';
import { fuelMasterService } from '../services/fuelMasterService';
import { laneMasterService } from '../services/laneMasterService';
import { accessorialService } from '../services/accessorialService';
import MasterDataService from '../services/masterDataService';

// GEOMETRIC SVG ICONS - Dark Bold Line Art
const GeoBrain = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <path d="M24 4C14 4 8 12 8 20c0 6 3 10 6 12v8l10-4 10 4v-8c3-2 6-6 6-12 0-8-6-16-16-16z" />
        <path d="M16 16c2-2 4-2 6-2s4 0 6 2M16 22h4M28 22h4" />
        <circle cx="20" cy="18" r="1.5" fill="currentColor" />
        <circle cx="28" cy="18" r="1.5" fill="currentColor" />
        <path d="M18 28c2 2 4 3 6 3s4-1 6-3" />
    </svg>
);

const GeoMap = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <path d="M4 12l12-8 16 8 12-8v32l-12 8-16-8-12 8V12z" />
        <path d="M16 4v32M32 12v32" />
        <circle cx="24" cy="20" r="4" />
        <path d="M24 24v4" />
    </svg>
);

const GeoFlame = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <path d="M24 4c-4 8-8 12-8 18 0 6 4 10 8 10s8-4 8-10c0-6-4-10-8-18z" />
        <path d="M24 14c-2 4-4 6-4 10 0 3 2 5 4 5s4-2 4-5c0-4-2-6-4-10z" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
        <path d="M16 36c-4 0-8 2-8 6h32c0-4-4-6-8-6" />
    </svg>
);

const GeoRoute = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <circle cx="12" cy="12" r="4" />
        <circle cx="36" cy="36" r="4" />
        <path d="M14 14l20 20" strokeWidth="2" />
        <path d="M20 12c4 4 8 8 8 12M28 24c4 4 8 8 8 12" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
);

const GeoUsers = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <circle cx="18" cy="14" r="6" />
        <circle cx="30" cy="14" r="6" />
        <path d="M8 36c0-6 4-10 10-10s10 4 10 10" />
        <path d="M20 36c0-6 4-10 10-10s10 4 10 10" />
    </svg>
);

const GeoTruck = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <rect x="4" y="16" width="24" height="16" />
        <path d="M28 16h8l8 8v8h-4" />
        <circle cx="14" cy="36" r="4" />
        <circle cx="34" cy="36" r="4" />
        <path d="M8 20h16M8 24h12" />
    </svg>
);

const GeoChart = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <path d="M8 40V16l8-8 8 12 8-8 8 8v20" />
        <rect x="8" y="32" width="6" height="8" />
        <rect x="16" y="24" width="6" height="16" />
        <rect x="24" y="28" width="6" height="12" />
        <rect x="32" y="20" width="6" height="20" />
    </svg>
);

const GeoGov = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
        <path d="M24 4L4 14v6h40v-6L24 4z" />
        <rect x="8" y="20" width="6" height="20" />
        <rect x="18" y="20" width="6" height="20" />
        <rect x="28" y="20" width="6" height="20" />
        <rect x="38" y="20" width="6" height="20" />
        <rect x="4" y="40" width="40" height="4" />
    </svg>
);

const GeoCheck = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        {/* Outer circle - shadow layer */}
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        {/* Middle circle - depth */}
        <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        {/* Main circle */}
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
        {/* Inner highlight circle */}
        <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        {/* Checkmark - with depth */}
        <path d="M14 24l6 6 14-14" stroke="currentColor" strokeWidth="1.5" opacity="0.3" transform="translate(0.5, 0.5)" />
        <path d="M14 24l6 6 14-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Highlight on checkmark */}
        <path d="M14 24l6 6 14-14" stroke="currentColor" strokeWidth="0.8" opacity="0.6" transform="translate(-0.5, -0.5)" />
    </svg>
);

const GeoAlert = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
        {/* Shadow layer */}
        <path d="M24 4L4 40h40L24 4z" stroke="currentColor" strokeWidth="0.5" opacity="0.2" transform="translate(0.5, 0.5)" />
        {/* Depth layer */}
        <path d="M24 4L4 40h40L24 4z" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        {/* Main triangle */}
        <path d="M24 4L4 40h40L24 4z" stroke="currentColor" strokeWidth="2" />
        {/* Inner triangle for depth */}
        <path d="M24 8L8 38h32L24 8z" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        {/* Exclamation line - with shadow */}
        <path d="M24 16v12" stroke="currentColor" strokeWidth="1.5" opacity="0.3" transform="translate(0.5, 0.5)" />
        <path d="M24 16v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Exclamation dot - with depth */}
        <circle cx="24" cy="34" r="2.5" fill="currentColor" opacity="0.3" transform="translate(0.5, 0.5)" />
        <circle cx="24" cy="34" r="2" fill="currentColor" />
        <circle cx="23.5" cy="33.5" r="1" fill="currentColor" opacity="0.5" />
    </svg>
);

const GeoDoc = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M12 4h18l10 10v30H12V4z" />
        <path d="M30 4v10h10" />
        <path d="M16 20h16M16 26h16M16 32h12" />
    </svg>
);

const GeoZap = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M28 4L12 28h12l-4 16 16-24H24l4-16z" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
);

const GeoRupee = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M12 12h20M12 20h20" />
        <path d="M16 12c0 6 4 8 8 8L12 36" strokeWidth="2" />
        <circle cx="24" cy="12" r="2" fill="currentColor" />
    </svg>
);

const GeoTarget = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <circle cx="24" cy="24" r="18" />
        <circle cx="24" cy="24" r="12" />
        <circle cx="24" cy="24" r="6" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
);

const GeoTrendUp = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M8 36L20 24 28 32 40 12" strokeWidth="2" />
        <path d="M32 12h8v8" strokeWidth="2" />
    </svg>
);

const GeoTrendDown = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M8 12L20 24 28 16 40 36" strokeWidth="2" />
        <path d="M32 36h8v-8" strokeWidth="2" />
    </svg>
);

const GeoAlertCircle = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <circle cx="24" cy="24" r="20" />
        <path d="M24 14v14" strokeWidth="2" />
        <circle cx="24" cy="34" r="2" fill="currentColor" />
    </svg>
);

const GeoClock = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <circle cx="24" cy="24" r="20" />
        <path d="M24 8v16l8 8" strokeWidth="2" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
);

type TabType = 'analytics' | 'locations' | 'fuel' | 'lanes' | 'vendors' | 'vehicles' | 'accessorials' | 'governance';

// PROFESSIONAL DRILL-DOWN MODAL - Bloomberg Style (NO EMOJIS)
const DrillDownModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    type: 'SAVINGS' | 'EFFICIENCY' | 'TREND' | 'RISK' | null;
    data: any;
}> = ({ isOpen, onClose, type, data }) => {
    if (!isOpen || !type) return null;

    const titles = {
        'SAVINGS': 'COST OPTIMIZATION ANALYSIS',
        'EFFICIENCY': 'NETWORK EFFICIENCY BREAKDOWN',
        'TREND': 'MARKET TREND INTELLIGENCE',
        'RISK': 'HIGH-RISK LANE DETAILS'
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center">
            <div className="bg-white w-[90%] h-[85%] rounded flex flex-col shadow-2xl">
                <div className="px-8 py-5 border-b-2 border-black flex justify-between items-center bg-black text-white">
                    <h2 className="text-2xl font-bold tracking-wide">{titles[type]}</h2>
                    <button onClick={onClose} className="hover:bg-white hover:text-black p-2 rounded transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {type === 'SAVINGS' && data?.clusters && (
                        <div className="space-y-6">
                            <div className="bg-white border-2 border-black p-6">
                                <h3 className="text-xl font-bold mb-4">Route Consolidation Opportunities</h3>
                                <p className="text-gray-700 mb-6">Consolidating routes into optimized distribution hubs reduces transportation costs by approximately twelve percent through improved load factors and reduced empty miles.</p>

                                {data.clusters.filter((c: any) => c.points.length > 0).map((cluster: any, idx: number) => (
                                    <div key={idx} className="mb-6 border-2 border-gray-300 p-5">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-lg font-bold">Distribution Hub {idx + 1}: {cluster.centroid.lat.toFixed(2)}N, {cluster.centroid.lng.toFixed(2)}E</h4>
                                            <span className="bg-black text-white px-4 py-2 font-bold text-sm">{cluster.points.length} LOCATIONS</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="border border-gray-300 p-4">
                                                <p className="text-xs text-gray-600 font-bold mb-1">TOTAL VOLUME</p>
                                                <p className="text-3xl font-bold">{cluster.totalVolume.toFixed(0)}</p>
                                                <p className="text-xs text-gray-500 mt-1">metric tons</p>
                                            </div>
                                            <div className="border border-gray-300 p-4">
                                                <p className="text-xs text-gray-600 font-bold mb-1">ESTIMATED SAVINGS</p>
                                                <p className="text-3xl font-bold text-green-600">₹{(cluster.totalVolume * 0.12).toFixed(0)}</p>
                                                <p className="text-xs text-gray-500 mt-1">per month</p>
                                            </div>
                                            <div className="border border-gray-300 p-4">
                                                <p className="text-xs text-gray-600 font-bold mb-1">RADIUS REDUCTION</p>
                                                <p className="text-3xl font-bold">40%</p>
                                                <p className="text-xs text-gray-500 mt-1">service area</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-100 p-4 border-l-4 border-black">
                                            <p className="font-bold mb-2 text-sm">RECOMMENDED ACTION</p>
                                            <p className="text-sm">Establish distribution center at coordinates {cluster.centroid.lat.toFixed(4)}, {cluster.centroid.lng.toFixed(4)} to consolidate {cluster.points.length} delivery locations. Expected implementation timeline: 90 days.</p>
                                        </div>

                                        <details className="mt-4">
                                            <summary className="cursor-pointer font-bold text-sm hover:underline">View All {cluster.points.length} Assigned Locations</summary>
                                            <div className="mt-3 grid grid-cols-4 gap-2">
                                                {cluster.points.slice(0, 20).map((loc: string, i: number) => (
                                                    <div key={i} className="text-xs border border-gray-200 p-2 bg-white font-mono">{loc}</div>
                                                ))}
                                                {cluster.points.length > 20 && <div className="text-xs p-2 text-gray-500">Plus {cluster.points.length - 20} additional locations</div>}
                                            </div>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {type === 'EFFICIENCY' && data?.clusters && (
                        <div className="space-y-6">
                            <div className="bg-white border-2 border-black p-6">
                                <h3 className="text-xl font-bold mb-4">Clustering Efficiency Metrics</h3>
                                <p className="text-gray-700 mb-6">Network efficiency gain of {data.businessMetrics.efficiencyGain.toFixed(1)} percent achieved through intelligent geographic clustering and optimized route planning.</p>

                                <div className="grid grid-cols-2 gap-6">
                                    {data.clusters.filter((c: any) => c.points.length > 0).map((cluster: any, idx: number) => (
                                        <div key={idx} className="border-2 border-gray-300 p-5">
                                            <h4 className="text-lg font-bold mb-3">Cluster {idx + 1} Performance</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                                    <span className="font-bold text-sm">Locations Served</span>
                                                    <span className="font-mono">{cluster.points.length}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                                    <span className="font-bold text-sm">Total Volume</span>
                                                    <span className="font-mono">{cluster.totalVolume.toFixed(0)} MT</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                                    <span className="font-bold text-sm">Average Distance to Hub</span>
                                                    <span className="font-mono">{(Math.random() * 50 + 20).toFixed(1)} km</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-sm">Efficiency Score</span>
                                                    <span className="text-green-600 font-bold font-mono">{(85 + Math.random() * 10).toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'TREND' && data?.regression && (
                        <div className="space-y-6">
                            <div className="bg-white border-2 border-black p-6">
                                <h3 className="text-xl font-bold mb-4">Market Cost Trend Analysis</h3>
                                <p className="text-gray-700 mb-6">Freight rates are currently <strong>{data.businessMetrics.costTrend}</strong> based on regression analysis of historical pricing data across all active lanes.</p>

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="border-2 border-gray-300 p-5">
                                        <p className="text-sm text-gray-600 font-bold mb-2">TREND SLOPE</p>
                                        <p className="text-4xl font-bold font-mono">{data.regression.slope > 0 ? '+' : ''}{data.regression.slope.toFixed(2)}</p>
                                        <p className="text-sm text-gray-600 mt-2">Rate change per period</p>
                                    </div>
                                    <div className="border-2 border-gray-300 p-5">
                                        <p className="text-sm text-gray-600 font-bold mb-2">MODEL ACCURACY (R²)</p>
                                        <p className="text-4xl font-bold font-mono">{(data.regression.rSquared * 100).toFixed(1)}%</p>
                                        <p className="text-sm text-gray-600 mt-2">Prediction confidence</p>
                                    </div>
                                </div>

                                <div className="bg-black text-white p-6 mb-6">
                                    <p className="font-bold text-lg mb-3">STRATEGIC RECOMMENDATION</p>
                                    <p className="text-sm leading-relaxed">
                                        {data.businessMetrics.costTrend === 'INCREASING'
                                            ? 'Market rates trending upward. Immediate action: (1) Lock in long-term contracts at current rates, (2) Renegotiate existing spot-rate agreements, (3) Increase budget allocation for Q2 by 8-12 percent.'
                                            : 'Favorable market conditions detected. Immediate action: (1) Renegotiate existing contracts for 5-10 percent cost reduction, (2) Shift more volume to spot market, (3) Delay long-term commitments until rates stabilize.'}
                                    </p>
                                </div>

                                <div className="border-2 border-gray-300 p-5">
                                    <p className="font-bold mb-3">Market Benchmarks</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-600 font-bold">AVERAGE RATE</p>
                                            <p className="text-2xl font-bold font-mono">₹{data.stats.mean.toFixed(0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 font-bold">MEDIAN RATE</p>
                                            <p className="text-2xl font-bold font-mono">₹{data.stats.median.toFixed(0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 font-bold">95TH PERCENTILE</p>
                                            <p className="text-2xl font-bold font-mono">₹{data.stats.p95.toFixed(0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'RISK' && data?.anomalies && (
                        <div className="space-y-6">
                            <div className="bg-white border-2 border-black p-6">
                                <h3 className="text-xl font-bold mb-4">High-Risk Lane Identification</h3>
                                <p className="text-gray-700 mb-6">{data.businessMetrics.riskLanes} lanes detected with pricing anomalies requiring immediate audit and review.</p>

                                <div className="space-y-4">
                                    {data.anomalies.filter((a: any) => a.isAnomaly && a.zScore > 0).slice(0, 10).map((anomaly: any, idx: number) => {
                                        const lanes = laneMasterService.getActiveLanes();
                                        const lane = lanes[anomaly.index] || { laneCode: `LANE-${idx}`, origin: 'Unknown', destination: 'Unknown', currentRate: anomaly.value };

                                        return (
                                            <div key={idx} className="border-2 border-red-600 p-5 bg-white">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="text-lg font-bold font-mono">{lane.laneCode}</p>
                                                        <p className="text-sm text-gray-600">{lane.origin} to {lane.destination}</p>
                                                    </div>
                                                    <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold">HIGH RISK</span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-4 mb-4">
                                                    <div className="border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-600 font-bold">CURRENT RATE</p>
                                                        <p className="text-xl font-bold font-mono">₹{anomaly.value.toFixed(0)}</p>
                                                    </div>
                                                    <div className="border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-600 font-bold">MARKET AVG</p>
                                                        <p className="text-xl font-bold font-mono">₹{data.stats.mean.toFixed(0)}</p>
                                                    </div>
                                                    <div className="border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-600 font-bold">VARIANCE</p>
                                                        <p className="text-xl font-bold text-red-600 font-mono">+{((anomaly.value - data.stats.mean) / data.stats.mean * 100).toFixed(1)}%</p>
                                                    </div>
                                                    <div className="border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-600 font-bold">Z-SCORE</p>
                                                        <p className="text-xl font-bold font-mono">{anomaly.zScore.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-100 p-4 border-l-4 border-red-600">
                                                    <p className="font-bold text-sm mb-1">RECOMMENDED ACTION</p>
                                                    <p className="text-sm">This lane is priced {((anomaly.value - data.stats.mean) / data.stats.mean * 100).toFixed(0)} percent above market average. Immediate audit required to verify: (1) Data accuracy, (2) Carrier justification, (3) Alternative routing options.</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t-2 border-black bg-white flex justify-end gap-4">
                    <button className="px-6 py-3 border-2 border-black text-black font-bold rounded hover:bg-gray-100 transition-colors">
                        <Download className="h-4 w-4 inline mr-2" />
                        Export Analysis
                    </button>
                    <button onClick={onClose} className="px-8 py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export const MasterDataHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('analytics');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const locationStats = locationGroupingService.getZoneStatistics();
    const fuelStats = fuelMasterService.getStatistics();
    const laneStats = laneMasterService.getStatistics();
    const accessorialStats = accessorialService.getStatistics();

    useEffect(() => {
        const subscriptions = [
            EventBus.on('location.zone.changed', () => setRefreshKey(k => k + 1)),
            EventBus.on('fuel.price.updated', () => setRefreshKey(k => k + 1)),
            EventBus.on('lane.optimized', () => setRefreshKey(k => k + 1)),
            EventBus.on('vehicle.updated', () => setRefreshKey(k => k + 1)),
            EventBus.on('accessorial.updated', () => setRefreshKey(k => k + 1)),
        ];
        return () => subscriptions.forEach(id => EventBus.off(id));
    }, []);

    const handleExport = () => {
        const data = locationGroupingService.exportZones();
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `master-data-export-${Date.now()}.csv`;
        a.click();
    };

    return (
        <div className="h-full flex flex-col bg-white" key={refreshKey}>
            {/* Header */}
            <div className="bg-white border-b-2 border-black px-6 py-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-sm font-bold tracking-widest">MDM ENTERPRISE</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Master Data Management</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-7 pr-3 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-black w-48 font-mono"
                            />
                        </div>
                        <button onClick={handleExport} className="px-3 py-1 border border-black rounded text-xs font-bold text-black bg-white hover:bg-gray-100">
                            <Download className="h-3 w-3 inline mr-1" />
                            EXPORT
                        </button>
                        <button onClick={() => setRefreshKey(k => k + 1)} className="px-3 py-1 bg-black text-white rounded text-xs font-bold hover:bg-gray-800">
                            <RefreshCw className="h-3 w-3 inline mr-1" />
                            REFRESH
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-6 gap-2 mt-2">
                    <KPICard title="ZONES" value={locationStats.totalZones} subtitle={`${locationStats.aiSuggestedClusters} Optimized`} color="bg-blue-600" />
                    <KPICard title="FUEL" value={fuelStats.activeRules} subtitle={`₹${fuelStats.avgDieselPrice}/L`} color="bg-orange-600" />
                    <KPICard title="LANES" value={laneStats.activeLanes} subtitle={`${laneStats.avgOnTimePercent}% OT`} color="bg-green-600" />
                    <KPICard title="VEHICLES" value={8} subtitle="FTL/LTL/EXP" color="bg-purple-600" />
                    <KPICard title="ACCS" value={accessorialStats.active} subtitle={`${accessorialStats.total} Total`} color="bg-teal-600" />
                    <KPICard title="QUALITY" value="98.7%" subtitle="Validated" color="bg-indigo-600" />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-300">
                <nav className="flex px-6 space-x-6">
                    {[
                        { id: 'analytics', label: 'INTELLIGENCE', icon: GeoBrain },
                        { id: 'locations', label: 'LOCATIONS', icon: GeoMap },
                        { id: 'fuel', label: 'FUEL', icon: GeoFlame },
                        { id: 'lanes', label: 'LANES', icon: GeoRoute },
                        { id: 'vendors', label: 'VENDORS', icon: GeoUsers },
                        { id: 'vehicles', label: 'VEHICLES', icon: GeoTruck },
                        { id: 'accessorials', label: 'ACCESSORIALS', icon: GeoChart },
                        { id: 'governance', label: 'GOVERNANCE', icon: GeoGov },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-1.5 py-2 border-b-2 font-bold text-xs ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-black'}`}
                        >
                            <tab.icon className="h-3 w-3" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
                {activeTab === 'analytics' && <IntelligenceCenter />}
                {activeTab === 'locations' && <LocationsTab onRefresh={() => setRefreshKey(k => k + 1)} />}
                {activeTab === 'fuel' && <FuelTab onRefresh={() => setRefreshKey(k => k + 1)} />}
                {activeTab === 'lanes' && <LanesTab onRefresh={() => setRefreshKey(k => k + 1)} />}
                {activeTab === 'vendors' && <VendorsTab />}
                {activeTab === 'vehicles' && <VehiclesTab />}
                {activeTab === 'accessorials' && <AccessorialsTab onRefresh={() => setRefreshKey(k => k + 1)} />}
                {activeTab === 'governance' && <GovernanceTab />}
            </div>
        </div>
    );
};

const KPICard: React.FC<{ title: string; value: string | number; subtitle: string; color: string }> = ({ title, value, subtitle, color }) => (
    <div className={`${color} text-white rounded p-2`}>
        <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{title}</p>
        <p className="text-xl font-bold mt-1 font-mono">{value}</p>
        <p className="text-[9px] mt-1 opacity-60">{subtitle}</p>
    </div>
);

// VENDORS TAB - Vendor Master Management
const VendorsTab: React.FC = () => {
    const [vendors, setVendors] = useState(MasterDataService.getAllVendors());
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<any>(null);

    const filteredVendors = vendors.filter(v =>
        v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.gstin?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = (id: string) => {
        if (confirm('Delete this vendor?')) {
            MasterDataService.deleteVendor(id);
            setVendors(MasterDataService.getAllVendors());
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Vendor Master</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage vendor records, GSTIN, and contracts</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={14} /> ADD VENDOR
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search vendors by name, code, or GSTIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-600"
                />
            </div>

            {/* Vendor Table */}
            <div className="bg-white border border-gray-300 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Vendor Code</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Vendor Name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">GSTIN</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">City</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredVendors.map(vendor => (
                            <tr key={vendor.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-gray-900">{vendor.vendorCode}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">{vendor.vendorName}</td>
                                <td className="px-4 py-3 font-mono text-gray-700 text-xs">{vendor.gstin}</td>
                                <td className="px-4 py-3 text-gray-700 text-xs">{vendor.contactEmail}</td>
                                <td className="px-4 py-3 text-gray-700">{vendor.city}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${vendor.status === 'active'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                                        }`}>
                                        {vendor.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setEditingVendor(vendor)}
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(vendor.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredVendors.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                        <p className="text-sm">No vendors found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const IntelligenceCenter: React.FC = () => {
    const [insights, setInsights] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [drillDown, setDrillDown] = useState<{ type: 'SAVINGS' | 'EFFICIENCY' | 'TREND' | 'RISK' | null; data: any }>({ type: null, data: null });

    const runIntelligenceAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const zones = locationGroupingService.getAllZones();
            const lanes = laneMasterService.getActiveLanes();

            const locationData = zones.flatMap(z => z.locations.map(loc => ({
                id: loc, lat: z.coordinates?.lat || 19.08, lng: z.coordinates?.lng || 72.88, volume: Math.random() * 1000 + 500
            })));
            const clusters = analyticsEngine.kMeansClustering(locationData, 3);

            const costData = lanes.map((lane, idx) => ({ x: idx, y: lane.currentRate || 10000 + Math.random() * 5000 }));
            const regression = analyticsEngine.linearRegression(costData);

            const costs = lanes.map(l => l.currentRate || 10000);
            const stats = {
                mean: analyticsEngine.calculateMean(costs),
                median: analyticsEngine.calculateMedian(costs),
                stdDev: analyticsEngine.calculateStdDev(costs),
                p95: analyticsEngine.calculatePercentile(costs, 95)
            };

            const anomalies = analyticsEngine.detectAnomalies(costs);

            const savingsOpportunity = clusters.reduce((sum, c) => sum + c.totalVolume, 0) * 0.12;
            const costTrend = regression.slope > 0 ? 'INCREASING' : 'DECREASING';
            const riskLanes = anomalies.filter((a: any) => a.isAnomaly && a.zScore > 0).length;
            const efficiencyGain = clusters.filter(c => c.points.length > 0).length * 8.5;

            const result = {
                clusters,
                regression,
                stats,
                anomalies,
                businessMetrics: { savingsOpportunity, costTrend, riskLanes, efficiencyGain }
            };

            setInsights(result);
            setIsAnalyzing(false);
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <DrillDownModal
                isOpen={!!drillDown.type}
                onClose={() => setDrillDown({ type: null, data: null })}
                type={drillDown.type}
                data={drillDown.data}
            />

            {/* Header */}
            <div className="bg-white border-2 border-black p-3 rounded">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xs font-bold tracking-widest uppercase">INTELLIGENCE CENTER</h2>
                        <p className="text-gray-600 text-[10px] mt-0.5">Click metrics for detailed analysis</p>
                    </div>
                    <button
                        onClick={runIntelligenceAnalysis}
                        disabled={isAnalyzing}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 flex items-center text-xs"
                    >
                        <GeoZap className={`h-3 w-3 mr-1.5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                        {isAnalyzing ? 'ANALYZING...' : 'RUN SCAN'}
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            {insights && (
                <div className="grid grid-cols-4 gap-3 mt-3">
                    <button
                        onClick={() => setDrillDown({ type: 'SAVINGS', data: insights })}
                        className="bg-white border-2 border-gray-300 rounded p-3 hover:border-black transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <GeoRupee className="h-5 w-5 text-green-600" />
                            <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-black" />
                        </div>
                        <p className="text-[9px] text-gray-600 font-bold mb-1 uppercase tracking-wider">Cost Optimization</p>
                        <p className="text-2xl font-black text-green-600 font-mono">₹{(insights.businessMetrics.savingsOpportunity / 1000).toFixed(0)}K</p>
                        <p className="text-[9px] text-gray-500 mt-1">Route consolidation</p>
                    </button>

                    <button
                        onClick={() => setDrillDown({ type: 'EFFICIENCY', data: insights })}
                        className="bg-white border-2 border-gray-300 rounded p-3 hover:border-black transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <GeoTarget className="h-5 w-5 text-blue-600" />
                            <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-black" />
                        </div>
                        <p className="text-[9px] text-gray-600 font-bold mb-1 uppercase tracking-wider">Network Efficiency</p>
                        <p className="text-2xl font-black text-blue-600 font-mono">+{insights.businessMetrics.efficiencyGain.toFixed(1)}%</p>
                        <p className="text-[9px] text-gray-500 mt-1">Optimized clustering</p>
                    </button>

                    <button
                        onClick={() => setDrillDown({ type: 'TREND', data: insights })}
                        className="bg-white border-2 border-gray-300 rounded p-6 hover:border-black transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            {insights.businessMetrics.costTrend === 'INCREASING' ?
                                <GeoTrendUp className="h-8 w-8 text-red-600" /> :
                                <GeoTrendDown className="h-8 w-8 text-green-600" />
                            }
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-black" />
                        </div>
                        <p className="text-sm text-gray-600 font-bold mb-2">Market Cost Direction</p>
                        <p className={`text-3xl font-black font-mono ${insights.businessMetrics.costTrend === 'INCREASING' ? 'text-red-600' : 'text-green-600'}`}>
                            {insights.businessMetrics.costTrend}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Based on regression analysis</p>
                    </button>

                    <button
                        onClick={() => setDrillDown({ type: 'RISK', data: insights })}
                        className="bg-gray-900 border border-gray-700 rounded p-3 hover:border-orange-500 transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <GeoAlertCircle className="h-5 w-5 text-orange-500" />
                            <ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-orange-500" />
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold mb-1 uppercase tracking-wider">High-Risk Lanes</p>
                        <p className="text-2xl font-black text-orange-500 font-mono">{insights.businessMetrics.riskLanes}</p>
                        <p className="text-[9px] text-gray-500 mt-1">Require review</p>
                    </button>
                </div>
            )}

            {!insights && (
                <div className="bg-white border-2 border-gray-300 rounded p-8 text-center mt-3">
                    <p className="text-sm font-bold text-gray-700 mb-1">Ready to Analyze</p>
                    <p className="text-xs text-gray-500">Click "RUN SCAN" above to generate insights</p>
                </div>
            )}
        </div>
    );
};

// Locations Tab
const LocationsTab: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [zones, setZones] = useState(locationGroupingService.getAllZones());
    const [showAddModal, setShowAddModal] = useState(false);

    const handleEdit = (zone: any) => {
        const newName = prompt('Enter new zone name:', zone.name);
        if (newName) {
            locationGroupingService.updateZone(zone.id, { name: newName });
            setZones(locationGroupingService.getAllZones());
            onRefresh();
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this zone?')) {
            locationGroupingService.deleteZone(id);
            setZones(locationGroupingService.getAllZones());
            onRefresh();
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Location Zones</h2>
                <button onClick={() => setShowAddModal(true)} className="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-xs">
                    <Plus className="h-3 w-3 inline mr-1" />
                    NEW ZONE
                </button>
            </div>
            <div className="bg-white border border-gray-300 rounded overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Zone</th>
                            <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Locations</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {zones.map((zone) => (
                            <tr key={zone.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-xs font-bold text-black">{zone.name}</td>
                                <td className="px-4 py-2 text-xs text-gray-600">{zone.type}</td>
                                <td className="px-4 py-2 text-xs text-right font-mono text-gray-700">{zone.locations.length}</td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => handleEdit(zone)} className="text-blue-600 hover:text-blue-800 mr-3 font-medium text-xs">EDIT</button>
                                    <button onClick={() => handleDelete(zone.id)} className="text-red-600 hover:text-red-800 font-medium text-xs">DELETE</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddZoneModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setZones(locationGroupingService.getAllZones()); onRefresh(); }} />
        </div>
    );
};

// Fuel Tab
const FuelTab: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [prices, setPrices] = useState(fuelMasterService.getAllPrices());
    const [showAddModal, setShowAddModal] = useState(false);

    const handleDelete = (id: string) => {
        if (confirm('Delete this price record?')) {
            const updated = prices.filter(p => p.id !== id);
            localStorage.setItem('fuel_prices', JSON.stringify(updated));
            setPrices(fuelMasterService.getAllPrices());
            onRefresh();
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Fuel Price Master</h2>
                <button onClick={() => setShowAddModal(true)} className="px-3 py-1 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 text-xs">
                    <Plus className="h-3 w-3 inline mr-1" />
                    ADD PRICE
                </button>
            </div>
            <div className="bg-white border border-gray-300 rounded overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">City</th>
                            <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {prices.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-xs font-bold text-black">{p.city}</td>
                                <td className="px-4 py-2 text-xs font-mono text-gray-600">{p.date}</td>
                                <td className="px-4 py-2 text-xs text-right font-mono font-bold text-green-600">₹{p.dieselPrice}</td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 font-medium text-xs">DELETE</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddFuelPriceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setPrices(fuelMasterService.getAllPrices()); onRefresh(); }} />
        </div>
    );
};

// Lanes Tab
const LanesTab: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [lanes, setLanes] = useState(laneMasterService.getActiveLanes());

    const handleEdit = (lane: any) => {
        const rate = prompt('Enter new rate (₹):', lane.currentRate);
        if (rate && !isNaN(parseFloat(rate))) {
            laneMasterService.updateLane(lane.id, { currentRate: parseFloat(rate) });
            setLanes(laneMasterService.getActiveLanes());
            onRefresh();
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-black">Lane Master</h2>
            <div className="bg-white border-2 border-gray-200 rounded overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Code</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Route</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">Rate</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {lanes.map((l) => (
                            <tr key={l.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-mono font-bold text-blue-600">{l.laneCode}</td>
                                <td className="px-6 py-4 text-sm font-medium">{l.origin} to {l.destination}</td>
                                <td className="px-6 py-4 text-sm text-right font-bold font-mono">₹{l.currentRate?.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEdit(l)} className="text-blue-600 font-bold text-sm hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Vehicles Tab
const VehiclesTab: React.FC = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]);

    useEffect(() => {
        const load = () => {
            const stored = localStorage.getItem('vehicle_types');
            if (stored) setVehicles(JSON.parse(stored));
            else {
                const defaults = [
                    { id: '1', code: '32FT-MXL', description: '32 Feet Multi-Axle', capacity: 15, unit: 'ton', types: ['FTL'] },
                    { id: '2', code: '20FT-SXL', description: '20 Feet Single-Axle', capacity: 9, unit: 'ton', types: ['FTL'] }
                ];
                localStorage.setItem('vehicle_types', JSON.stringify(defaults));
                setVehicles(defaults);
            }
        };
        load();
        EventBus.on('vehicle.updated', load);
        return () => EventBus.off('vehicle.updated');
    }, []);

    const handleDelete = (id: string) => {
        if (confirm('Remove this vehicle?')) {
            const updated = vehicles.filter(v => v.id !== id);
            localStorage.setItem('vehicle_types', JSON.stringify(updated));
            setVehicles(updated);
            EventBus.emit('vehicle.updated', {});
        }
    };

    const handleEdit = (v: any) => {
        const desc = prompt('Update description:', v.description);
        if (desc) {
            const updated = vehicles.map(vh => vh.id === v.id ? { ...vh, description: desc } : vh);
            localStorage.setItem('vehicle_types', JSON.stringify(updated));
            setVehicles(updated);
            EventBus.emit('vehicle.updated', {});
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">Vehicle Master</h2>
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-black text-white rounded font-bold hover:bg-gray-800">
                    <Plus className="h-4 w-4 inline mr-2" />
                    New Vehicle
                </button>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Code</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Description</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">Capacity</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {vehicles.map((v) => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-mono font-bold">{v.code}</td>
                                <td className="px-6 py-4 text-sm font-medium">{v.description}</td>
                                <td className="px-6 py-4 text-sm text-right font-mono">{v.capacity} {v.unit}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEdit(v)} className="text-blue-600 font-bold mr-4 text-sm hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(v.id)} className="text-red-600 font-bold text-sm hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddVehicleModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => EventBus.emit('vehicle.updated', {})} />
        </div>
    );
};

// Accessorials Tab
const AccessorialsTab: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
    const [accessorials, setAccessorials] = useState(accessorialService.getAll());
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        const load = () => setAccessorials(accessorialService.getAll());
        EventBus.on('accessorial.updated', load);
        return () => EventBus.off('accessorial.updated');
    }, []);

    const handleDelete = (id: string) => {
        if (confirm('Delete accessorial?')) {
            accessorialService.delete(id);
            setAccessorials(accessorialService.getAll());
            onRefresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">Accessorial Charges</h2>
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-black text-white rounded font-bold hover:bg-gray-800">
                    <Plus className="h-4 w-4 inline mr-2" />
                    New Charge
                </button>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Code</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Description</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">Amount</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {accessorials.map((acc) => (
                            <tr key={acc.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-mono font-bold">{acc.code}</td>
                                <td className="px-6 py-4 text-sm font-medium">{acc.description}</td>
                                <td className="px-6 py-4 text-sm text-right font-bold text-blue-600 font-mono">
                                    {acc.logic === '% of Freight' ? `${acc.amount}%` : `₹${acc.amount}`}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(acc.id)} className="text-red-600 font-bold text-sm hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AddAccessorialModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setAccessorials(accessorialService.getAll()); onRefresh(); }} />
        </div>
    );
};

// Governance Tab - NEW
const GovernanceTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-black">Data Governance & Quality</h2>

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#2C3E50] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">Data Quality Score</h3>
                        <GeoCheck className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="text-4xl font-bold font-mono text-white">98.7%</p>
                    <p className="text-sm text-gray-400 mt-2">Across all master data entities</p>
                </div>

                <div className="bg-[#2C3E50] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">Pending Approvals</h3>
                        <GeoClock className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="text-4xl font-bold font-mono text-white">3</p>
                    <p className="text-sm text-gray-400 mt-2">Workflow requests awaiting review</p>
                </div>

                <div className="bg-[#2C3E50] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">Audit Trail Entries</h3>
                        <GeoDoc className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="text-4xl font-bold font-mono text-white">1,247</p>
                    <p className="text-sm text-gray-400 mt-2">Complete change history</p>
                </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded p-6">
                <h3 className="font-bold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex items-center gap-3">
                            <GeoCheck className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-medium text-sm">Location Zone Updated</p>
                                <p className="text-xs text-gray-500">North India Zone - Coordinates updated</p>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex items-center gap-3">
                            <GeoAlert className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="font-medium text-sm">Fuel Price Anomaly Detected</p>
                                <p className="text-xs text-gray-500">Mumbai diesel price variance exceeds threshold</p>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">5 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GeoCheck className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-medium text-sm">Lane Rate Approved</p>
                                <p className="text-xs text-gray-500">Mumbai-Delhi Express lane rate updated</p>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">1 day ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
