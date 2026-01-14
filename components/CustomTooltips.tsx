import React from 'react';

// Custom Tooltip for Financial Charts
export const FinancialTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-300 shadow-lg rounded-lg">
                <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs">
                        <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                            <span className="font-medium text-slate-600">{entry.name}:</span>
                        </span>
                        <span className="font-bold text-slate-900">
                            {entry.name.includes('Spend') || entry.name.includes('flow') || entry.name.includes('net')
                                ? `₹${entry.value}M`
                                : entry.name.includes('%') || entry.name.includes('Efficiency')
                                    ? `${entry.value}%`
                                    : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Logistics Charts
export const LogisticsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-300 shadow-lg rounded-lg">
                <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs">
                        <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                            <span className="font-medium text-slate-600">{entry.name}:</span>
                        </span>
                        <span className="font-bold text-slate-900">
                            {entry.name.includes('velocity') || entry.name.includes('volume') || entry.name.includes('capacity')
                                ? `${entry.value} shipments/hr`
                                : entry.name.includes('efficiency') || entry.name.includes('Efficiency')
                                    ? `${entry.value}%`
                                    : entry.name.includes('cost') || entry.name.includes('Cost') || entry.name.includes('Rate')
                                        ? `₹${entry.value.toLocaleString()}`
                                        : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Route Optimization
export const RouteTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const actualCost = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
        const optimalCost = payload.find((p: any) => p.dataKey === 'optimal')?.value || 0;
        const savings = actualCost - optimalCost;
        const savingsPercent = ((savings / actualCost) * 100).toFixed(1);

        return (
            <div className="bg-white p-3 border border-slate-300 shadow-lg rounded-lg min-w-[200px]">
                <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2 bg-red-500"></div>
                            <span className="font-medium text-slate-600">Current Cost:</span>
                        </span>
                        <span className="font-bold text-red-700">₹{actualCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
                            <span className="font-medium text-slate-600">Optimal Cost:</span>
                        </span>
                        <span className="font-bold text-green-700">₹{optimalCost.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1 mt-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">Potential Savings:</span>
                            <span className="font-bold text-blue-600">₹{savings.toLocaleString()} ({savingsPercent}%)</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Vendor Analysis
export const VendorTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-300 shadow-lg rounded-lg">
                <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs">
                        <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                            <span className="font-medium text-slate-600">{entry.name}:</span>
                        </span>
                        <span className="font-bold text-slate-900">
                            {entry.name.includes('spend') || entry.name.includes('Spend')
                                ? `₹${entry.value}M`
                                : entry.name.includes('days') || entry.name.includes('Days')
                                    ? `${entry.value} days`
                                    : entry.name.includes('invoices')
                                        ? `${entry.value} invoices`
                                        : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};
