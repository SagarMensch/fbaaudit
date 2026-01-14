import React, { useState } from 'react';
import { SpotRateAdvisor } from '../components/SpotRateAdvisor';
import { PlacementRiskAdvisor } from '../components/PlacementRiskAdvisor';
import { MilkRunOptimizer } from '../components/MilkRunOptimizer';

// 3D Geometric Icons - Solid style only
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

const Geo3DWarning: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#FF6B00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 22h20L12 2z" fill={color} />
        <rect x="11" y="10" width="2" height="6" fill="white" />
        <rect x="11" y="17" width="2" height="2" fill="white" />
    </svg>
);

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

type TabType = 'spot-rate' | 'placement-risk' | 'milk-run';

const TABS: Array<{ id: TabType; name: string; icon: React.ReactNode; mlType: string; color: string }> = [
    {
        id: 'spot-rate',
        name: 'Spot Rate Predictor',
        icon: <Geo3DChart size={20} color="#00C805" />,
        mlType: 'XGBoost Regression',
        color: '#00C805'
    },
    {
        id: 'placement-risk',
        name: 'Placement Risk Advisor',
        icon: <Geo3DWarning size={20} color="#FF6B00" />,
        mlType: 'Logistic Regression',
        color: '#FF6B00'
    },
    {
        id: 'milk-run',
        name: 'Milk Run Optimizer',
        icon: <Geo3DCluster size={20} color="#0066FF" />,
        mlType: 'K-Means Clustering',
        color: '#0066FF'
    },
];

// Demo scenarios for Spot Rate
const SPOT_RATE_SCENARIOS = [
    { origin: 'Mumbai', destination: 'Delhi', vehicleType: '32FT MXL', label: 'Mumbai → Delhi' },
    { origin: 'Bangalore', destination: 'Chennai', vehicleType: '20ft Container', label: 'Bangalore → Chennai' },
    { origin: 'Ahmedabad', destination: 'Kolkata', vehicleType: '40FT HT', label: 'Ahmedabad → Kolkata' },
];

// Demo scenarios for Placement Risk
const PLACEMENT_SCENARIOS = [
    { vendorId: 'V-SPOT-001', vendorName: 'Sharma Transporters', origin: 'Delhi', destination: 'Chennai' },
    { vendorId: 'V-SPOT-002', vendorName: 'VRL Logistics', origin: 'Mumbai', destination: 'Bangalore' },
    { vendorId: 'V-SPOT-004', vendorName: 'Blue Dart', origin: 'Pune', destination: 'Hyderabad' },
];

export const AIIntelligenceHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('milk-run');
    const [spotScenario, setSpotScenario] = useState(0);
    const [placementScenario, setPlacementScenario] = useState(0);

    return (
        <div
            className="h-full flex flex-col bg-white"
            style={{ fontFamily: "'Berkeley Mono', 'SF Mono', 'Consolas', monospace" }}
        >
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 flex items-center justify-between border-b-2 border-black">
                <div className="flex items-center gap-4">
                    <Geo3DBrain size={40} color="#0066FF" />
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider">
                            AI Intelligence Hub
                        </h1>
                        <p className="text-white/60 text-sm">
                            Enterprise ML Models • Real-time Predictions • Cost Optimization
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-white/40">Competing with</p>
                    <p className="text-sm font-bold">Oracle • SAP • C.H. Robinson</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b-2 border-black">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-6 py-4 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-wider transition-all border-r border-black last:border-r-0 ${activeTab === tab.id
                                ? 'bg-white text-black'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        style={{
                            borderBottom: activeTab === tab.id ? `4px solid ${tab.color}` : '4px solid transparent'
                        }}
                    >
                        {tab.icon}
                        <span>{tab.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-black text-white">
                            {tab.mlType}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
                {/* Spot Rate Predictor */}
                {activeTab === 'spot-rate' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="border-2 border-black p-6 bg-white">
                            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-4 border-b border-black pb-2">
                                💡 The Pain Point
                            </h2>
                            <p className="text-black">
                                A manager needs to book a spot truck. Vendor quotes <strong>₹50,000</strong>.
                                Is that fair? Or is it a rip-off?
                            </p>
                            <div className="mt-4 bg-[#00C805] p-4 text-white">
                                <p className="font-bold">The AI Solution:</p>
                                <p className="text-2xl font-bold">Recommended Fair Price: ₹44,500</p>
                                <p className="text-sm opacity-80 mt-1">
                                    "Your competitor did this for ₹44k last week, why are you charging ₹50k?"
                                </p>
                            </div>
                        </div>

                        {/* Scenario Selector */}
                        <div className="flex gap-2">
                            {SPOT_RATE_SCENARIOS.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSpotScenario(idx)}
                                    className={`flex-1 py-3 text-sm font-bold uppercase border-2 ${spotScenario === idx
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-black border-black hover:bg-gray-100'
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Live Prediction */}
                        <SpotRateAdvisor
                            origin={SPOT_RATE_SCENARIOS[spotScenario].origin}
                            destination={SPOT_RATE_SCENARIOS[spotScenario].destination}
                            vehicleType={SPOT_RATE_SCENARIOS[spotScenario].vehicleType}
                            vendorQuote={50000}
                        />
                    </div>
                )}

                {/* Placement Risk Advisor */}
                {activeTab === 'placement-risk' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="border-2 border-black p-6 bg-white">
                            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-4 border-b border-black pb-2">
                                💡 The Pain Point
                            </h2>
                            <p className="text-black">
                                You assign a load to <strong>"Sharma Transport"</strong>.
                                Will they actually send the truck, or cancel at the last minute?
                            </p>
                            <div className="mt-4 bg-[#FF6B00] p-4 text-white">
                                <p className="font-bold">The AI Solution:</p>
                                <p className="text-2xl font-bold">Risk Alert: 78% chance Sharma will fail</p>
                                <p className="text-sm opacity-80 mt-1">
                                    "This vendor has 18% historical failure rate and it's a Sunday during monsoon."
                                </p>
                            </div>
                        </div>

                        {/* Scenario Selector */}
                        <div className="flex gap-2">
                            {PLACEMENT_SCENARIOS.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setPlacementScenario(idx)}
                                    className={`flex-1 py-3 text-sm font-bold uppercase border-2 ${placementScenario === idx
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-black border-black hover:bg-gray-100'
                                        }`}
                                >
                                    {s.vendorName}
                                </button>
                            ))}
                        </div>

                        {/* Live Prediction */}
                        <PlacementRiskAdvisor
                            vendorId={PLACEMENT_SCENARIOS[placementScenario].vendorId}
                            vendorName={PLACEMENT_SCENARIOS[placementScenario].vendorName}
                            origin={PLACEMENT_SCENARIOS[placementScenario].origin}
                            destination={PLACEMENT_SCENARIOS[placementScenario].destination}
                        />
                    </div>
                )}

                {/* Milk Run Optimizer */}
                {activeTab === 'milk-run' && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="border-2 border-black p-6 bg-white">
                            <h2 className="text-lg font-bold text-black uppercase tracking-wider mb-4 border-b border-black pb-2">
                                💡 The Pain Point
                            </h2>
                            <p className="text-black">
                                You're booking <strong>3 separate small trucks</strong> for 3 nearby cities.
                                It costs a fortune!
                            </p>
                            <div className="mt-4 bg-[#0066FF] p-4 text-white">
                                <p className="font-bold">The AI Solution:</p>
                                <p className="text-2xl font-bold">Combine into 1 Milk Run. Save ₹33,300 (39%)</p>
                                <p className="text-sm opacity-80 mt-1">
                                    K-Means clustering groups nearby deliveries and optimizes capacity utilization.
                                </p>
                            </div>
                        </div>

                        {/* Live Optimizer */}
                        <MilkRunOptimizer />
                    </div>
                )}
            </div>

            {/* Footer - ML Specs */}
            <div className="bg-black text-white px-6 py-3 flex items-center justify-between text-xs">
                <div className="flex gap-6">
                    <span>
                        <strong className="text-[#00C805]">XGBoost</strong> • Spot Rate Prediction
                    </span>
                    <span>
                        <strong className="text-[#FF6B00]">Logistic Regression</strong> • Risk Classification
                    </span>
                    <span>
                        <strong className="text-[#0066FF]">K-Means</strong> • Route Clustering
                    </span>
                </div>
                <span className="text-white/40">
                    Powered by Python ML Stack • Real-time API
                </span>
            </div>
        </div>
    );
};

export default AIIntelligenceHub;
