import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Award, TrendingUp, AlertTriangle, CheckCircle, Search, Sliders, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { generateCSVReport } from '../utils/reportGenerator';
import { CarrierScorecard } from '../types';

// MOCK DATA
const CARRIERS: CarrierScorecard[] = [
    { carrierId: 'C1', carrierName: 'Maersk Line', overallScore: 0, metrics: { onTimeDelivery: 92, invoiceAccuracy: 98, slaAdherence: 95, rateConsistency: 90, damageRatio: 99 }, trend: 'up', rank: 0 },
    { carrierId: 'C2', carrierName: 'MSC', overallScore: 0, metrics: { onTimeDelivery: 88, invoiceAccuracy: 92, slaAdherence: 90, rateConsistency: 95, damageRatio: 98 }, trend: 'stable', rank: 0 },
    { carrierId: 'C3', carrierName: 'CMA CGM', overallScore: 0, metrics: { onTimeDelivery: 95, invoiceAccuracy: 85, slaAdherence: 88, rateConsistency: 85, damageRatio: 96 }, trend: 'down', rank: 0 },
    { carrierId: 'C4', carrierName: 'Hapag-Lloyd', overallScore: 0, metrics: { onTimeDelivery: 90, invoiceAccuracy: 99, slaAdherence: 92, rateConsistency: 88, damageRatio: 99 }, trend: 'up', rank: 0 },
];

interface CarrierPerformanceProps {
    onNavigate?: (page: string) => void;
}

export const CarrierPerformance: React.FC<CarrierPerformanceProps> = ({ onNavigate }) => {
    // WEIGHTS STATE
    const [weights, setWeights] = useState({
        onTime: 30,
        accuracy: 25,
        sla: 15,
        rate: 20,
        damage: 10
    });

    // DYNAMIC SCORING
    const scoredCarriers = useMemo(() => {
        const totalWeight = (Object.values(weights) as number[]).reduce((a, b) => a + b, 0);

        return CARRIERS.map(c => {
            const score = (
                (c.metrics.onTimeDelivery * weights.onTime) +
                (c.metrics.invoiceAccuracy * weights.accuracy) +
                (c.metrics.slaAdherence * weights.sla) +
                (c.metrics.rateConsistency * weights.rate) +
                (c.metrics.damageRatio * weights.damage)
            ) / totalWeight;

            return { ...c, overallScore: score };
        }).sort((a, b) => b.overallScore - a.overallScore)
            .map((c, idx) => ({ ...c, rank: idx + 1 }));
    }, [weights]);

    const topCarrier = scoredCarriers[0];

    const handleExportScorecard = () => {
        const columns = ['Rank', 'Carrier', 'CPS Score', 'On-Time %', 'Accuracy %', 'SLA %', 'Rate Consistency %', 'Damage Ratio %', 'Trend'];
        const data = scoredCarriers.map(c => ({
            'Rank': c.rank,
            'Carrier': c.carrierName,
            'CPS Score': c.overallScore.toFixed(2),
            'On-Time %': c.metrics.onTimeDelivery,
            'Accuracy %': c.metrics.invoiceAccuracy,
            'SLA %': c.metrics.slaAdherence,
            'Rate Consistency %': c.metrics.rateConsistency,
            'Damage Ratio %': c.metrics.damageRatio,
            'Trend': c.trend.toUpperCase()
        }));
        exportToCSV(data, 'Carrier_Performance_Scorecard');
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Award className="mr-3 text-purple-600" /> Carrier Performance Score (CPS)
                    </h1>
                    <p className="text-slate-500 mt-1">Weighted scoring and automated vendor ranking.</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* WEIGHT CONFIGURATOR */}
                <div className="col-span-3 bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center">
                        <Sliders size={16} className="mr-2 text-blue-600" /> Scoring Weights
                    </h3>
                    <div className="space-y-6">
                        {Object.entries(weights).map(([key, val]) => (
                            <div key={key}>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">{key}</label>
                                    <span className="text-xs font-bold text-blue-600">{val}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="50" value={val}
                                    onChange={(e) => setWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        ))}
                        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                            Total Weight: {(Object.values(weights) as number[]).reduce((a, b) => a + b, 0)}%
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="col-span-9 space-y-6">
                    {/* TOP CARRIER CARD */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white shadow-lg flex justify-between items-center">
                        <div>
                            <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">Top Performer</p>
                            <h2 className="text-3xl font-bold">{topCarrier.carrierName}</h2>
                            <div className="flex items-center mt-2 space-x-4">
                                <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">Score: {topCarrier.overallScore.toFixed(1)}</span>
                                <span className="flex items-center text-xs text-purple-100"><CheckCircle size={14} className="mr-1" /> 99% Damage Free</span>
                            </div>
                        </div>
                        <div className="h-32 w-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                    { subject: 'On-Time', A: topCarrier.metrics.onTimeDelivery, fullMark: 100 },
                                    { subject: 'Accuracy', A: topCarrier.metrics.invoiceAccuracy, fullMark: 100 },
                                    { subject: 'SLA', A: topCarrier.metrics.slaAdherence, fullMark: 100 },
                                    { subject: 'Rate', A: topCarrier.metrics.rateConsistency, fullMark: 100 },
                                    { subject: 'Damage', A: topCarrier.metrics.damageRatio, fullMark: 100 },
                                ]}>
                                    <PolarGrid stroke="rgba(255,255,255,0.3)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name={topCarrier.carrierName} dataKey="A" stroke="#fff" strokeWidth={2} fill="#fff" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* SCORECARD GRID */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Carrier Rankings</h3>
                            <button onClick={handleExportScorecard} className="text-xs font-bold text-blue-600 hover:underline flex items-center">
                                <Download size={14} className="mr-1" /> Export CSV
                            </button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Carrier</th>
                                    <th className="px-6 py-4 text-center">CPS Score</th>
                                    <th className="px-6 py-4 text-center">On-Time</th>
                                    <th className="px-6 py-4 text-center">Accuracy</th>
                                    <th className="px-6 py-4 text-center">6-Month Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {scoredCarriers.map((c) => (
                                    <tr key={c.carrierId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${c.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {c.rank}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            {c.carrierName}
                                            {onNavigate && ['Maersk Line', 'MSC'].includes(c.carrierName) && (
                                                <button
                                                    onClick={() => onNavigate('aad')}
                                                    className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    title="View Active Anomalies"
                                                >
                                                    <AlertTriangle size={10} className="mr-1" /> 1
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-lg font-bold text-purple-600">{c.overallScore.toFixed(1)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600">{c.metrics.onTimeDelivery}%</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{c.metrics.invoiceAccuracy}%</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                {/* Simulated Sparkline */}
                                                <div className="w-1 h-3 bg-slate-300 rounded-sm"></div>
                                                <div className="w-1 h-4 bg-slate-300 rounded-sm"></div>
                                                <div className="w-1 h-3 bg-slate-300 rounded-sm"></div>
                                                <div className="w-1 h-5 bg-slate-300 rounded-sm"></div>
                                                <div className={`w-1 h-6 rounded-sm ${c.trend === 'up' ? 'bg-green-500' : c.trend === 'down' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                                {c.trend === 'up' && <TrendingUp size={14} className="text-green-500 ml-2" />}
                                                {c.trend === 'down' && <TrendingUp size={14} className="text-red-500 ml-2 rotate-180" />}
                                                {c.trend === 'stable' && <span className="text-slate-400 ml-2 text-xs font-bold">-</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* AUTO RECOMMEND WIDGET */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-1">Auto-Recommend Engine</h4>
                            <p className="text-xs text-blue-600">Based on current weights, <strong>{topCarrier.carrierName}</strong> is recommended for high-value lanes.</p>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center">
                            <Search size={16} className="mr-2" /> Find Carrier for Lane
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
