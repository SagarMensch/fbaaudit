import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Truck, Package, Settings, RefreshCw, Download } from 'lucide-react';
import { CTSRecord } from '../types';
import { generateCSVReport } from '../utils/reportGenerator';

// MOCK DATA
const INITIAL_CTS_DATA: CTSRecord[] = [
    { id: '1', sku: 'Transformer-X1', customer: 'GridCorp', lane: 'CN-US', totalCost: 1250, breakdown: { transport: 800, accessorial: 150, handling: 200, overhead: 100 }, margin: 15, units: 50 },
    { id: '2', sku: 'Switchgear-A2', customer: 'PowerGen', lane: 'DE-US', totalCost: 950, breakdown: { transport: 600, accessorial: 100, handling: 150, overhead: 100 }, margin: 22, units: 120 },
    { id: '3', sku: 'Cable-HV', customer: 'CityElectric', lane: 'MX-US', totalCost: 450, breakdown: { transport: 300, accessorial: 50, handling: 50, overhead: 50 }, margin: 8, units: 500 },
];

interface CostToServeProps {
    onNavigate?: (page: string) => void;
}

export const CostToServe: React.FC<CostToServeProps> = ({ onNavigate }) => {
    // SIMULATOR STATE
    const [ftlShare, setFtlShare] = useState(60); // %
    const [fuelIndex, setFuelIndex] = useState(100); // Base 100
    const [griPercentage, setGriPercentage] = useState(0); // General Rate Increase %
    const [handlingEfficiency, setHandlingEfficiency] = useState(0); // % improvement

    // DYNAMIC CALCULATION
    const simulatedData = useMemo(() => {
        return INITIAL_CTS_DATA.map(record => {
            // Logic: Higher FTL share reduces transport cost
            const transportFactor = 1 - ((ftlShare - 60) * 0.005);
            // Logic: Higher Fuel Index increases transport cost
            const fuelFactor = 1 + ((fuelIndex - 100) * 0.002);
            // Logic: Efficiency reduces handling cost
            const handlingFactor = 1 - (handlingEfficiency * 0.01);

            // Logic: GRI adds directly to the base rate
            const griFactor = 1 + (griPercentage * 0.01);

            const newTransport = record.breakdown.transport * transportFactor * fuelFactor * griFactor;
            const newHandling = record.breakdown.handling * handlingFactor;

            const newTotal = newTransport + record.breakdown.accessorial + newHandling + record.breakdown.overhead;
            // Assume Price is fixed at Cost + Original Margin%
            const originalPrice = record.totalCost * (1 + (record.margin / 100));
            const newMargin = ((originalPrice - newTotal) / originalPrice) * 100;

            return {
                ...record,
                totalCost: newTotal,
                breakdown: {
                    ...record.breakdown,
                    transport: newTransport,
                    handling: newHandling
                },
                margin: newMargin
            };
        });
    }, [ftlShare, fuelIndex, handlingEfficiency, griPercentage]);

    // WATERFALL DATA PREP (Aggregated)
    const waterfallData = useMemo(() => {
        const total = simulatedData.reduce((acc, r) => acc + r.totalCost, 0);
        const transport = simulatedData.reduce((acc, r) => acc + r.breakdown.transport, 0);
        const accessorial = simulatedData.reduce((acc, r) => acc + r.breakdown.accessorial, 0);
        const handling = simulatedData.reduce((acc, r) => acc + r.breakdown.handling, 0);
        const overhead = simulatedData.reduce((acc, r) => acc + r.breakdown.overhead, 0);

        return [
            { name: 'Base Transport', value: transport, fill: '#3B82F6' },
            { name: 'Accessorials', value: accessorial, fill: '#F59E0B' },
            { name: 'Handling', value: handling, fill: '#10B981' },
            { name: 'Overheads', value: overhead, fill: '#6366F1' },
            { name: 'Total Cost', value: total, fill: '#1F2937', isTotal: true }
        ];
    }, [simulatedData]);

    const handleExportCSV = () => {
        const columns = ['Customer', 'SKU', 'Lane', 'Transport', 'Handling', 'Total Cost', 'Margin %'];
        const data = simulatedData.map(r => [
            r.customer,
            r.sku,
            r.lane,
            r.breakdown.transport.toFixed(2),
            r.breakdown.handling.toFixed(2),
            r.totalCost.toFixed(2),
            r.margin.toFixed(2)
        ]);
        generateCSVReport('Cost_To_Serve_Analysis', data, columns);
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Calculator className="mr-3 text-teal-600" /> Cost-to-Serve Engine
                    </h1>
                    <p className="text-slate-500 mt-1">Dynamic cost allocation and margin simulation.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center">
                    <RefreshCw size={16} className="text-slate-400 mr-2" />
                    <span className="text-xs font-bold text-slate-600 uppercase">Last Updated: Just now</span>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* SIMULATOR PANEL */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center">
                            <Settings size={16} className="mr-2 text-blue-600" /> What-If Simulator
                        </h3>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-600">FTL Consolidation Share</label>
                                    <span className="text-xs font-bold text-blue-600">{ftlShare}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" value={ftlShare}
                                    onChange={(e) => setFtlShare(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Higher FTL share reduces transport unit costs.</p>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-600">Fuel Price Index</label>
                                    <span className="text-xs font-bold text-orange-600">{fuelIndex}</span>
                                </div>
                                <input
                                    type="range" min="80" max="150" value={fuelIndex}
                                    onChange={(e) => setFuelIndex(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Base 100. Impacts variable transport costs.</p>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-600">GRI Impact (General Rate Increase)</label>
                                    <span className="text-xs font-bold text-red-600">+{griPercentage}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="25" value={griPercentage}
                                    onChange={(e) => setGriPercentage(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Simulate carrier rate hikes (0-25%).</p>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-600">Handling Efficiency</label>
                                    <span className="text-xs font-bold text-green-600">+{handlingEfficiency}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="50" value={handlingEfficiency}
                                    onChange={(e) => setHandlingEfficiency(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Reduces warehouse and handling overheads.</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600">Projected Savings</span>
                                <span className="text-xl font-bold text-teal-600">
                                    ${(INITIAL_CTS_DATA.reduce((acc, r) => acc + r.totalCost, 0) - simulatedData.reduce((acc, r) => acc + r.totalCost, 0)).toFixed(0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* KEY INSIGHTS */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg shadow-lg text-white">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">AI Recommendations</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start">
                                <TrendingUp size={16} className="mr-3 text-teal-400 mt-0.5" />
                                <span>Increasing FTL share to <strong>75%</strong> could improve margins by <strong>4.2%</strong>.</span>
                            </li>
                            <li className="flex items-start">
                                <Truck size={16} className="mr-3 text-blue-400 mt-0.5" />
                                <span>Switching <strong>GridCorp</strong> to Intermodal on Lane CN-US is recommended.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* VISUALIZATION PANEL */}
                <div className="col-span-8 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[400px]">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Cost Waterfall Analysis</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={waterfallData}>
                                <defs>
                                    <linearGradient id="colorTransport" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorAccessorial" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorHandling" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorOverhead" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1F2937" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#1F2937" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(val) => `$${val}`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(val) => [`$${Number(val).toFixed(0)}`, 'Cost']}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                    cursor={{ fill: 'rgba(226, 232, 240, 0.5)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {waterfallData.map((entry, index) => {
                                        let fillId = 'url(#colorTotal)';
                                        if (entry.name === 'Base Transport') fillId = 'url(#colorTransport)';
                                        if (entry.name === 'Accessorials') fillId = 'url(#colorAccessorial)';
                                        if (entry.name === 'Handling') fillId = 'url(#colorHandling)';
                                        if (entry.name === 'Overheads') fillId = 'url(#colorOverhead)';

                                        return <Cell key={`cell-${index}`} fill={fillId} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* DETAILED DATA GRID (Bloomberg Style) */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer Profitability Matrix</h3>
                            <button onClick={handleExportCSV} className="text-xs font-bold text-blue-600 hover:underline flex items-center">
                                <Download size={14} className="mr-1" /> Export CSV
                            </button>
                        </div>
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-500 uppercase font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3">Lane</th>
                                    <th className="px-4 py-3 text-right">Transport</th>
                                    <th className="px-4 py-3 text-right">Handling</th>
                                    <th className="px-4 py-3 text-right">Total Cost</th>
                                    <th className="px-4 py-3 text-right">Margin %</th>
                                    <th className="px-4 py-3 text-right">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                                {simulatedData.map(record => (
                                    <tr key={record.id} className="hover:bg-blue-50 transition-colors cursor-pointer">
                                        <td className="px-4 py-3 font-bold text-slate-700 font-sans">
                                            {record.customer}
                                            {onNavigate && (
                                                <button onClick={() => onNavigate('workbench')} className="ml-2 text-[10px] text-blue-600 hover:underline">
                                                    (View Invoices)
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-sans">{record.sku}</td>
                                        <td className="px-4 py-3 text-slate-500 font-sans">{record.lane}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">${record.breakdown.transport.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">${record.breakdown.handling.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800 bg-slate-50/50">${record.totalCost.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-green-600 font-bold group relative cursor-help">
                                            ${record.margin.toFixed(1)}%
                                            {/* TOOLTIP */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                Margin calculated after transport, handling, and overhead allocation.
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-slate-400">
                                            {record.margin > INITIAL_CTS_DATA.find(r => r.id === record.id)!.margin ? (
                                                <span className="text-green-600 flex items-center justify-end"><TrendingUp size={12} className="mr-1" /> +</span>
                                            ) : (
                                                <span className="text-red-500 flex items-center justify-end"><TrendingUp size={12} className="mr-1 rotate-180" /> -</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-right">
                            Showing {simulatedData.length} records based on current simulation parameters.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
