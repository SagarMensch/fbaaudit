import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const data = [
    { name: 'Week 1', amount: 120000, projected: 120000 },
    { name: 'Week 2', amount: 135000, projected: 135000 },
    { name: 'Last Wk', amount: 98000, projected: 98000 },
    { name: 'This Wk', amount: 45000, projected: 155000 }, // Current (partial)
    { name: 'Next Wk', amount: 0, projected: 180000 },
    { name: 'Week 6', amount: 0, projected: 160000 },
    { name: 'Week 7', amount: 0, projected: 175000 },
];

export const CashFlowTrend = () => {
    return (
        <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00C805" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#00C805" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip
                        content={(props) => {
                            if (!props.active || !props.payload) return null;
                            const { payload, label } = props;
                            if (!payload || payload.length === 0) return null;

                            const realized = payload.find(p => p.name === 'Realized')?.value;
                            const projected = payload.find(p => p.name === 'Projected')?.value;

                            return (
                                <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 backdrop-blur-md">
                                    <p className="font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
                                    {realized > 0 && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-[#00C805]"></div>
                                            <span className="text-slate-300">Realized:</span>
                                            <span className="font-bold">₹{realized.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {projected > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className="text-slate-300">Projected:</span>
                                            <span className="font-bold">₹{projected.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        }}
                    />
                    <Area type="monotone" dataKey="projected" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProjected)" name="Projected" />
                    <Area type="monotone" dataKey="amount" stroke="#00C805" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" name="Realized" />

                    {/* The Friday Line */}
                    <ReferenceLine x="This Wk" stroke="#F59E0B" strokeDasharray="3 3">
                        <text x="0" y="0" dy={-10} dx={10} fill="#F59E0B" fontSize={10} fontWeight="bold" textAnchor="middle">
                            Next Payout (Fri)
                        </text>
                    </ReferenceLine>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
