import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Package, Truck, AlertCircle, Zap, Globe, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { getCachedMarketData } from '../services/financeDataService';

interface TickerData {
    symbol: string;
    name: string;
    value: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down';
}

interface FinanceDashboardProps {
    onNavigate?: (page: string) => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ onNavigate }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tickers, setTickers] = useState<TickerData[]>([
        { symbol: 'FRT-IDX', name: 'Freight Index', value: 8547.82, change: 125.40, changePercent: 1.49, trend: 'up' },
        { symbol: 'DSL-MUM', name: 'Diesel Mumbai', value: 94.50, change: -0.75, changePercent: -0.79, trend: 'down' },
        { symbol: 'DSL-DEL', name: 'Diesel Delhi', value: 89.66, change: 0.45, changePercent: 0.50, trend: 'up' },
        { symbol: 'CNT-20FT', name: '20FT Container', value: 2850, change: 45, changePercent: 1.60, trend: 'up' },
        { symbol: 'CNT-40FT', name: '40FT Container', value: 4200, change: -80, changePercent: -1.87, trend: 'down' },
        { symbol: 'AIR-KG', name: 'Air Freight/Kg', value: 185.25, change: -2.10, changePercent: -1.12, trend: 'down' },
        { symbol: 'FTL-32FT', name: 'FTL 32ft MXL', value: 15800, change: 300, changePercent: 1.93, trend: 'up' },
        { symbol: 'LTL-KG', name: 'LTL per Kg', value: 8.50, change: 0.15, changePercent: 1.79, trend: 'up' },
    ]);
    const [dataSource, setDataSource] = useState<string>('Loading...');
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [pendingAmount, setPendingAmount] = useState<number>(0);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/invoices/pending?approver_role=FINANCE_MANAGER');
                const data = await res.json();
                if (data.success && data.invoices) {
                    setPendingCount(data.invoices.length);
                    const total = data.invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount) || 0), 0);
                    setPendingAmount(total);
                }
            } catch (err) {
                console.error("Failed to fetch pending invoices", err);
            }
        };
        fetchPending();
    }, []);

    // Load real market data from API
    useEffect(() => {
        async function loadMarketData() {
            try {
                const data = await getCachedMarketData();

                // Update tickers with real data
                setTickers(prev => prev.map(ticker => {
                    if (ticker.symbol === 'DSL-MUM' && data.diesel.mumbai) {
                        return {
                            ...ticker,
                            value: data.diesel.mumbai.diesel,
                            change: data.diesel.mumbai.change,
                            changePercent: (data.diesel.mumbai.change / data.diesel.mumbai.diesel) * 100,
                            trend: data.diesel.mumbai.change >= 0 ? 'up' : 'down'
                        };
                    }
                    if (ticker.symbol === 'DSL-DEL' && data.diesel.delhi) {
                        return {
                            ...ticker,
                            value: data.diesel.delhi.diesel,
                            change: data.diesel.delhi.change,
                            changePercent: (data.diesel.delhi.change / data.diesel.delhi.diesel) * 100,
                            trend: data.diesel.delhi.change >= 0 ? 'up' : 'down'
                        };
                    }
                    if (ticker.symbol === 'FRT-IDX') {
                        return {
                            ...ticker,
                            value: data.freightIndex
                        };
                    }
                    return ticker;
                }));

                setDataSource(data.dataSource.diesel);
            } catch (error) {
                console.error('Error loading market data:', error);
                setDataSource('Using fallback data');
            }
        }

        loadMarketData();
    }, []);

    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Simulate ticker updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTickers(prev => prev.map(ticker => {
                const randomChange = (Math.random() - 0.5) * (ticker.value * 0.02);
                const newValue = ticker.value + randomChange;
                const newChange = newValue - ticker.value;
                const newChangePercent = (newChange / ticker.value) * 100;

                return {
                    ...ticker,
                    value: parseFloat(newValue.toFixed(2)),
                    change: parseFloat(newChange.toFixed(2)),
                    changePercent: parseFloat(newChangePercent.toFixed(2)),
                    trend: newChange >= 0 ? 'up' : 'down'
                };
            }));
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const freightIndexData = [
        { time: '09:00', value: 8420, volume: 245 },
        { time: '10:00', value: 8465, volume: 312 },
        { time: '11:00', value: 8510, volume: 289 },
        { time: '12:00', value: 8485, volume: 267 },
        { time: '13:00', value: 8520, volume: 298 },
        { time: '14:00', value: 8548, volume: 324 },
    ];

    const laneData = [
        { lane: 'MUM-DEL', rate: 15800, volume: 142, change: 1.9 },
        { lane: 'DEL-KOL', rate: 18200, volume: 98, change: 2.5 },
        { lane: 'CHE-BLR', rate: 8500, volume: 187, change: -1.4 },
        { lane: 'PUN-HYD', rate: 9200, volume: 124, change: 2.0 },
        { lane: 'MUM-BLR', rate: 12400, volume: 156, change: 0.8 },
    ];

    return (
        <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden z-50">
            {/* TOP BAR */}
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 px-4 py-1.5 flex items-center justify-between border-b border-orange-400">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <Activity className="text-white" size={18} />
                        <span className="font-bold text-sm tracking-wider">SEQUELSTRING TERMINAL</span>
                    </div>
                    <div className="text-xs flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white/90">LIVE</span>
                        </div>
                        <span className="text-white/70">|</span>
                        <span className="font-bold">{currentTime.toLocaleTimeString('en-IN', { hour12: false })}</span>
                        <span className="text-white/70">{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                        <Globe size={12} className="text-white/70" />
                        <span className="text-white/70">INDIA</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-white/70">MARKET:</span>
                        <span className="font-bold text-green-300">OPEN</span>
                    </div>
                </div>
            </div>

            {/* TICKER TAPE */}
            <div className="bg-gray-950 border-b border-gray-800 overflow-hidden">
                <div className="flex animate-scroll-left whitespace-nowrap py-1.5">
                    {[...tickers, ...tickers, ...tickers].map((ticker, idx) => (
                        <div key={idx} className="inline-flex items-center px-4 border-r border-gray-800">
                            <span className="font-bold text-orange-400 text-xs mr-2">{ticker.symbol}</span>
                            <span className="text-white text-xs mr-2">₹{ticker.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className={`flex items-center text-[10px] ${ticker.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                {ticker.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                <span className="ml-0.5">{ticker.changePercent > 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT - 3 COLUMN LAYOUT */}
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">

                {/* LEFT COLUMN - MARKET DATA */}
                <div className="w-1/3 border-r border-gray-800 overflow-y-auto custom-scrollbar">
                    {/* FREIGHT INDEX */}
                    <div className="border-b border-gray-800 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="text-[10px] text-orange-400 font-bold tracking-wider">FREIGHT INDEX</div>
                                <div className="text-2xl font-bold mt-0.5">8,547.82</div>
                            </div>
                            <div className="text-right">
                                <div className="text-green-400 flex items-center justify-end text-sm">
                                    <TrendingUp size={14} />
                                    <span className="ml-1">+125.40</span>
                                </div>
                                <div className="text-green-400 text-xs">+1.49%</div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={120}>
                            <AreaChart data={freightIndexData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#4b5563" style={{ fontSize: '9px' }} />
                                <YAxis stroke="#4b5563" style={{ fontSize: '9px' }} domain={['dataMin - 50', 'dataMax + 50']} />
                                <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={1.5} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* DIESEL PRICES */}
                    <div className="border-b border-gray-800 p-3">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2">DIESEL PRICES (₹/L)</div>
                        <div className="space-y-2">
                            {[
                                { city: 'Mumbai', price: 94.50, change: -0.75 },
                                { city: 'Delhi', price: 89.66, change: 0.45 },
                                { city: 'Bangalore', price: 92.30, change: -0.20 },
                                { city: 'Chennai', price: 91.85, change: 0.15 },
                            ].map(item => (
                                <div key={item.city} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">{item.city}</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold">₹{item.price.toFixed(2)}</span>
                                        <span className={`text-[10px] ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MARKET METRICS */}
                    <div className="border-b border-gray-800 p-3">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2">MARKET METRICS</div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'PAYABLES', value: '₹24.5M', change: '+2.3%', trend: 'up' },
                                {
                                    label: 'PENDING',
                                    value: pendingAmount ? `₹${(pendingAmount / 1000).toFixed(1)}k` : '₹0',
                                    change: pendingCount > 0 ? `+${pendingCount} Inv` : '0',
                                    trend: pendingCount > 0 ? 'up' : 'down',
                                    action: () => onNavigate && onNavigate('approver_queue')
                                },
                                { label: 'SHIPMENTS', value: '1,247', change: '+12.5%', trend: 'up' },
                                { label: 'CARRIERS', value: '42', change: '+3', trend: 'up' },
                            ].map(metric => (
                                <div
                                    key={metric.label}
                                    onClick={metric.action}
                                    className={`bg-gray-900 border border-gray-800 p-2 ${metric.action ? 'cursor-pointer hover:border-orange-500 transition-colors' : ''}`}
                                >
                                    <div className="text-[9px] text-gray-500 font-bold">{metric.label}</div>
                                    <div className="text-sm font-bold mt-0.5">{metric.value}</div>
                                    <div className={`text-[9px] ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                        {metric.change}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CONTAINER RATES */}
                    <div className="p-3">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2">CONTAINER RATES</div>
                        <div className="space-y-1.5">
                            {[
                                { type: '20FT STD', rate: 2850, change: 1.6 },
                                { type: '40FT HC', rate: 4200, change: -1.9 },
                                { type: '40FT STD', rate: 3900, change: 0.8 },
                            ].map(item => (
                                <div key={item.type} className="flex items-center justify-between text-xs bg-gray-900 border border-gray-800 p-2">
                                    <span className="text-gray-400 font-mono">{item.type}</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold">₹{item.rate.toLocaleString()}</span>
                                        <span className={`text-[10px] ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN - LIVE RATES */}
                <div className="flex-1 border-r border-gray-800 overflow-y-auto custom-scrollbar">
                    <div className="p-3 border-b border-gray-800 bg-gray-950">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider">LIVE FREIGHT RATES - TOP LANES</div>
                    </div>
                    <table className="w-full text-xs">
                        <thead className="bg-gray-950 border-b border-gray-800 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 tracking-wider">LANE</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 tracking-wider">MODE</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 tracking-wider">RATE (₹)</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 tracking-wider">VOL</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 tracking-wider">CHG %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-900">
                            {[
                                { route: 'Mumbai → Delhi', mode: 'FTL', rate: 15800, vol: 142, change: 1.93 },
                                { route: 'Delhi → Kolkata', mode: 'FTL', rate: 18200, vol: 98, change: 2.53 },
                                { route: 'Chennai → Bangalore', mode: 'LTL', rate: 8500, vol: 187, change: -1.39 },
                                { route: 'Pune → Hyderabad', mode: 'LTL', rate: 9200, vol: 124, change: 1.99 },
                                { route: 'Mumbai → Bangalore', mode: 'FTL', rate: 12400, vol: 156, change: 0.82 },
                                { route: 'Ahmedabad → Delhi', mode: 'FTL', rate: 14200, vol: 89, change: -0.45 },
                                { route: 'Kolkata → Chennai', mode: 'FTL', rate: 19800, vol: 67, change: 3.12 },
                                { route: 'Jaipur → Mumbai', mode: 'LTL', rate: 11200, vol: 112, change: 1.45 },
                            ].map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-900 transition-colors">
                                    <td className="px-3 py-2 font-medium">{row.route}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.mode === 'FTL' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                                            {row.mode}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold font-mono">₹{row.rate.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-gray-500">{row.vol}</td>
                                    <td className={`px-3 py-2 text-right flex items-center justify-end ${row.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {row.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        <span className="ml-1">{row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* LANE VOLUME CHART */}
                    <div className="p-3 border-t border-gray-800 mt-4">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2">LANE VOLUME DISTRIBUTION</div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={laneData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="lane" stroke="#6b7280" style={{ fontSize: '9px' }} />
                                <YAxis stroke="#6b7280" style={{ fontSize: '9px' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', fontSize: '10px' }}
                                    labelStyle={{ color: '#f97316' }}
                                />
                                <Bar dataKey="volume" fill="#0F62FE" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT COLUMN - NEWS & ALERTS */}
                <div className="w-1/4 overflow-y-auto custom-scrollbar">
                    {/* MARKET NEWS */}
                    <div className="p-3 border-b border-gray-800">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2 flex items-center">
                            <Zap size={12} className="mr-1" />
                            MARKET ALERTS
                        </div>
                        <div className="space-y-2">
                            {[
                                { time: '14:23', text: 'Diesel prices drop 0.75₹ in Mumbai', type: 'positive' },
                                { time: '13:45', text: 'FTL rates surge 2.5% on Delhi-Kolkata lane', type: 'alert' },
                                { time: '12:10', text: 'Container shortage at JNPT port', type: 'warning' },
                                { time: '11:30', text: 'New GST compliance rules effective', type: 'info' },
                            ].map((news, idx) => (
                                <div key={idx} className={`p-2 rounded border text-[10px] ${news.type === 'positive' ? 'bg-green-900/20 border-green-800/30 text-green-400' :
                                    news.type === 'alert' ? 'bg-orange-900/20 border-orange-800/30 text-orange-400' :
                                        news.type === 'warning' ? 'bg-red-900/20 border-red-800/30 text-red-400' :
                                            'bg-blue-900/20 border-blue-800/30 text-blue-400'
                                    }`}>
                                    <div className="font-bold mb-0.5">{news.time} IST</div>
                                    <div className="text-white/90">{news.text}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TOP MOVERS */}
                    <div className="p-3 border-b border-gray-800">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2">TOP MOVERS</div>
                        <div className="space-y-1.5">
                            {[
                                { name: 'Kolkata-Chennai', change: 3.12, value: 19800 },
                                { name: 'Delhi-Kolkata', change: 2.53, value: 18200 },
                                { name: 'Pune-Hyderabad', change: 1.99, value: 9200 },
                            ].map(item => (
                                <div key={item.name} className="flex items-center justify-between text-xs bg-gray-900 border border-gray-800 p-2">
                                    <span className="text-gray-400 text-[10px]">{item.name}</span>
                                    <div className="text-right">
                                        <div className="font-bold text-[10px]">₹{item.value.toLocaleString()}</div>
                                        <div className="text-green-400 text-[9px]">+{item.change}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SYSTEM STATUS */}
                    <div className="p-3">
                        <div className="text-[10px] text-orange-400 font-bold tracking-wider mb-2">SYSTEM STATUS</div>
                        <div className="space-y-1.5 text-[10px]">
                            {[
                                { system: 'Data Feed', status: 'ACTIVE', color: 'green' },
                                { system: 'RAG Engine', status: 'ONLINE', color: 'green' },
                                { system: 'Workflow', status: 'RUNNING', color: 'blue' },
                                { system: 'Analytics', status: 'SYNCED', color: 'green' },
                            ].map(item => (
                                <div key={item.system} className="flex items-center justify-between bg-gray-900 border border-gray-800 p-2">
                                    <span className="text-gray-400">{item.system}</span>
                                    <div className="flex items-center space-x-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.color === 'green' ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`}></div>
                                        <span className={item.color === 'green' ? 'text-green-400' : 'text-blue-400'}>{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DATA SOURCE DISCLAIMER */}
                    <div className="p-3 border-t border-gray-800 bg-gray-950">
                        <div className="text-[9px] text-orange-400 font-bold tracking-wider mb-1.5">📊 DATA SOURCES</div>
                        <div className="space-y-1 text-[9px] text-gray-400">
                            <div className="flex items-center justify-between">
                                <span>Diesel Prices:</span>
                                <span className="text-gray-300">{dataSource}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Freight Index:</span>
                                <span className="text-gray-300">Market-based calculations</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Container Rates:</span>
                                <span className="text-gray-300">Market averages</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-800 text-center">
                                <span className="text-yellow-500 font-bold">⚠️ DEMO MODE</span>
                                <span className="text-gray-500 ml-1">- For production, contact for premium APIs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
        </div>
    );
};
