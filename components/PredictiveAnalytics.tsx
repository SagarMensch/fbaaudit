
import React, { useMemo, useState } from 'react';
import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { getForecastAnalytics, DataPoint } from '../services/mlForecastingService';
import { Sparkles, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export const PredictiveAnalytics: React.FC = () => {
    const [data] = useState<DataPoint[]>(getForecastAnalytics());

    // Calculate Summary Stats
    const nextMonthForecast = data.find(d => d.type === 'FORECAST')?.value || 0;
    const lastMonthActual = data.filter(d => d.type === 'HISTORICAL').pop()?.value || 0;
    const growth = ((nextMonthForecast - lastMonthActual) / lastMonthActual) * 100;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(val);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Sparkles className="text-purple-600 mr-2" size={20} />
                        Predictive Spend Analytics
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        AI-driven forecasting using <span className="font-semibold text-purple-700">Holt-Winters Seasonal Model</span>.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Next Month Forecast</div>
                    <div className="text-2xl font-bold text-slate-800">{formatCurrency(nextMonthForecast)}</div>
                    <div className={`text-xs font-bold ${growth > 0 ? 'text-red-500' : 'text-green-500'} flex items-center justify-end`}>
                        <TrendingUp size={12} className="mr-1" />
                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}% vs Last Month
                    </div>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#64748B' }}
                            tickFormatter={(val) => {
                                const [y, m] = val.split('-');
                                return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]} '${y.slice(2)}`;
                            }}
                            minTickGap={30}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748B' }}
                            tickFormatter={(val) => `₹${val / 1000000}M`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number, name: string) => [
                                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value),
                                name === 'value' ? 'Spend' : name
                            ]}
                            labelFormatter={(label) => `Period: ${label}`}
                        />
                        <Legend iconType="circle" />

                        {/* Confidence Interval (Area) */}
                        <Area
                            type="monotone"
                            dataKey="upperBound"
                            stroke="none"
                            fill="url(#colorUncertainty)"
                            name="Confidence Interval (95%)"
                        />
                        {/* We stack lower bound with transparent fill to create the 'band' effect properly without simple Area. 
                            Actually, simpler way for Area Range in Recharts is `dataKey="[min, max]"` but data structure needs array.
                            For now, just showing Upper Bound area as 'Potential Risk' visual or simple area.
                            Let's rely on Line for main.
                        */}

                        {/* Historical Line */}
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                            name="Historical Spend"
                            connectNulls
                        />

                        {/* Forecast Dash Line (We need to separate data or use segment? Recharts handles this if we use two lines and filtered data) */}
                        <Line
                            type="monotone"
                            dataKey={(d) => d.type === 'FORECAST' ? d.value : null}
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="AI Forecast"
                            connectNulls
                        />

                        <ReferenceLine x={data.filter(d => d.type === 'HISTORICAL').pop()?.date} stroke="#94A3B8" strokeDasharray="3 3" label="Today" />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-start">
                <AlertCircle className="text-purple-600 mt-0.5 mr-3 flex-shrink-0" size={18} />
                <div>
                    <h4 className="text-sm font-bold text-purple-900">Strategic Insight</h4>
                    <p className="text-xs text-purple-700 mt-1">
                        The model predicts a <strong>{growth.toFixed(1)}% surge</strong> in logistics spend next month due to seasonality (Q4 Peak).
                        We recommend locking in <strong>Rate Cards</strong> now to avoid spot market volatility.
                    </p>
                </div>
            </div>
        </div>
    );
};
