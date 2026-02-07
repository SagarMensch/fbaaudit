
import React, { useState, useEffect } from 'react';
import { runSimulation, SimulationResult } from '../services/whatIfScenarioService';
import { ArrowRight, Shuffle, DollarSign, Clock, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
    const [source, setSource] = useState('Kuehne+Nagel');
    const [target, setTarget] = useState('MSC');
    const [percent, setPercent] = useState(20);
    const [result, setResult] = useState<SimulationResult | null>(null);

    const carriers = ['Maersk Logistics', 'MSC', 'Kuehne+Nagel', 'DHL Express', 'Expeditors'];

    useEffect(() => {
        setResult(runSimulation(source, target, percent, 5000)); // 5000 Units Annual Volume
    }, [source, target, percent]);

    if (!result) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <Shuffle className="text-indigo-600" size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Scenario Modeler</h3>
                    <p className="text-xs text-slate-500">Simulate volume shifts to optimize spend.</p>
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Shift From</label>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full text-sm font-bold text-slate-700 border-none bg-slate-100 rounded p-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            {carriers.map(c => <option key={c} value={c} disabled={c === target}>{c}</option>)}
                        </select>
                    </div>

                    <div className="pt-4 text-slate-300">
                        <ArrowRight size={20} />
                    </div>

                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Shift To</label>
                        <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full text-sm font-bold text-slate-700 border-none bg-slate-100 rounded p-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            {carriers.map(c => <option key={c} value={c} disabled={c === source}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Shift Volume</span>
                        <span className="text-indigo-600">{percent}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={percent}
                        onChange={(e) => setPercent(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${result.savings >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-xs font-bold uppercase ${result.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.savings >= 0 ? 'Annual Savings' : 'Cost Increase'}
                        </p>
                        <h4 className={`text-xl font-black mt-1 flex items-center ${result.savings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {result.savings >= 0 ? <TrendingDown size={20} className="mr-1" /> : <TrendingUp size={20} className="mr-1" />}
                            ₹{Math.abs(result.savings).toLocaleString()}
                        </h4>
                    </div>

                    <div className={`p-4 rounded-xl border ${result.transitTimeImpact <= 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                        <p className="text-xs font-bold uppercase text-slate-500">
                            Avg Transit Time
                        </p>
                        <h4 className="text-lg font-black mt-1 flex items-center text-slate-700">
                            <Clock size={16} className="mr-2 text-slate-400" />
                            {result.transitTimeImpact > 0 ? '+' : ''}{result.transitTimeImpact.toFixed(1)} Days
                        </h4>
                    </div>
                </div>

                {result.riskAssessment !== 'LOW' && (
                    <div className="mt-4 flex items-start text-xs text-amber-700 bg-amber-50 p-3 rounded border border-amber-100">
                        <AlertTriangle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>Risk Warning:</strong> Shifting to {target} may impact supply chain reliability. {target} has a lower reliability score ({(0.88 * 100).toFixed(0)}%).
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
