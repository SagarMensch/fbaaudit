import React from 'react';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';

const data = [
    { name: 'USD', value: 58, color: 'bg-emerald-700' },
    { name: 'EUR', value: 22, color: 'bg-blue-600' },
    { name: 'CNY', value: 12, color: 'bg-amber-500' },
    { name: 'Other', value: 8, color: 'bg-slate-500' },
];

export const CurrencyExposure: React.FC = () => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 z-10">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    CURRENCY EXPOSURE
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">
                    Q4 Allocation
                </span>
            </div>

            <div className="flex-grow flex flex-col justify-center space-y-4 z-10">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center">
                        {/* Label Fixed Width */}
                        <div className="w-12 flex-shrink-0">
                            <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        </div>

                        {/* Bar Container */}
                        <div className="flex-grow h-8 bg-slate-100 rounded-sm overflow-hidden relative border border-slate-200">
                            <div
                                className={`h-full ${item.color}`}
                                style={{ width: `${item.value}%` }}
                            ></div>
                        </div>

                        {/* Value Label */}
                        <div className="w-12 flex-shrink-0 text-right">
                            <span className="text-xs font-mono font-bold text-slate-600">{item.value}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Suggestion Box */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start z-10">
                <div className="mt-0.5 mr-2 text-blue-600">
                    <TrendingUp size={14} />
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                    <strong className="block mb-1">Recommendation:</strong> Hedge <span className="font-bold">EUR</span> positions.
                </p>
            </div>
        </div>
    );
};
