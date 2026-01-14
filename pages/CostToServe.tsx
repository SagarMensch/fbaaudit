
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, Download, Search, Settings, Cpu, Layers } from 'lucide-react';
import { CTSRecord } from '../types';
import { generateCSVReport } from '../utils/reportGenerator';

// --- HYPER-REFINED 3D ICONS ---

const SvgDefinitions = () => (
    <svg width="0" height="0">
        <defs>
            <pattern id="grid-pattern" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#262626" strokeWidth="0.5" opacity="0.2" />
            </pattern>
            <pattern id="stripe-pattern" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="2" height="4" transform="translate(0,0)" fill="#0f62fe" opacity="0.1" />
            </pattern>
        </defs>
    </svg>
);

const HyperChart = ({ size = 64, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M2 50 L32 62 L62 50" fill="none" stroke="#161616" strokeWidth="2" />
        <path d="M32 62 V56" stroke="#161616" strokeWidth="1" />
        <path d="M12 52 V24 L24 18 V46 L12 52" fill="#161616" />
        <path d="M12 24 L24 18 L36 24 L24 30 Z" fill="#0f62fe" />
        <path d="M24 46 L24 30 L36 24 V40 Z" fill="#0353e9" />
        <path d="M40 48 V14 L52 8 V42 L40 48" fill="url(#grid-pattern)" stroke="#161616" strokeWidth="1" />
        <path d="M40 14 L52 8 L64 14 L52 20 Z" fill="#00C805" />
        <path d="M52 42 L52 20 L64 14 V36 Z" fill="#009d04" />
        <path d="M24 24 L40 14" stroke="#0f62fe" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
);

const HyperGear = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M32 10 L44 14 L52 8 L60 20 L54 28 L60 38 L50 48 L42 44 L32 54 L22 44 L14 48 L4 38 L10 28 L4 20 L12 8 L20 14 Z" fill="#161616" stroke="#161616" strokeWidth="2" />
        <path d="M32 6 L44 10 L52 4 L60 16 L54 24 L60 34 L50 44 L42 40 L32 50 L22 40 L14 44 L4 34 L10 24 L4 16 L12 4 L20 10 Z" fill="#ffffff" stroke="#161616" strokeWidth="2" />
        <circle cx="32" cy="27" r="8" fill="#0f62fe" stroke="#161616" strokeWidth="2" />
    </svg>
);

const HyperVarianceBox = ({ size = 64, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path d="M32 12 L56 24 V48 L32 60 L8 48 V24 L32 12 Z" fill="#161616" stroke="#161616" strokeWidth="2" />
        <path d="M32 12 L56 24 L32 36 L8 24 Z" fill="#0f62fe" stroke="#161616" strokeWidth="2" />
        <path d="M8 24 L32 36 V60 L8 48 Z" fill="#001d6c" stroke="#161616" strokeWidth="1" />
        <path d="M32 36 L56 24 V48 L32 60 Z" fill="#001d6c" stroke="#161616" strokeWidth="1" />
        <path d="M32 24 L40 20 L40 28 L32 32 Z" fill="#00C805" stroke="#ffffff" strokeWidth="1" />
    </svg>
);

// --- CUSTOM 3D ISOMETRIC BAR SHAPE ---
const CustomIsometricBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    const depth = 10; // Depth of the 3D extrusion

    // Don't render if height is 0
    if (!height || height === 0) return null;

    // Calculate paths
    // Front Face (Rect)
    const frontPath = `M${x},${y + height} L${x + width},${y + height} L${x + width},${y} L${x},${y} Z`;

    // Top Face (Rhombus) - shift up and right
    const topPath = `M${x},${y} L${x + depth},${y - depth} L${x + width + depth},${y - depth} L${x + width},${y} Z`;

    // Side Face (Parallelogram) - right side
    const sidePath = `M${x + width},${y} L${x + width + depth},${y - depth} L${x + width + depth},${y + height - depth} L${x + width},${y + height} Z`;

    return (
        <g>
            <path d={sidePath} fill={fill} filter="brightness(0.6)" stroke="none" />
            <path d={frontPath} fill={fill} stroke="none" />
            <path d={topPath} fill={fill} filter="brightness(1.3)" stroke="none" />
            {/* Outline for definition */}
            <path d={`M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`} fill="none" stroke="#161616" strokeWidth="1" opacity="0.2" />
        </g>
    );
};

interface CostToServeProps {
    onNavigate?: (page: string) => void;
}

export const CostToServe: React.FC<CostToServeProps> = ({ onNavigate }) => {
    // STATE
    const [ctsData, setCtsData] = useState<CTSRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('Initializing...');

    // FILTERS
    const [searchQuery, setSearchQuery] = useState('');

    // SIMULATOR STATE
    const [ftlShare, setFtlShare] = useState(60);
    const [fuelIndex, setFuelIndex] = useState(100);
    const [griPercentage, setGriPercentage] = useState(0);
    const [handlingEfficiency, setHandlingEfficiency] = useState(0);

    // FETCH
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/analytics/cost-to-serve');
            const data = await response.json();
            if (data.shipments) {
                setCtsData(data.shipments);
                setLastUpdated(new Date().toLocaleTimeString());
            } else {
                setCtsData([]);
            }
        } catch (error) {
            console.error("Failed to fetch CTS data:", error);
            setCtsData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // COMPUTATION
    const simulatedData = useMemo(() => {
        let data = ctsData;
        if (searchQuery) {
            data = data.filter(r =>
                r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.sku.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return data.map(record => {
            const transportFactor = 1 - ((ftlShare - 60) * 0.005);
            const fuelFactor = 1 + ((fuelIndex - 100) * 0.002);
            const handlingFactor = 1 - (handlingEfficiency * 0.01);
            const griFactor = 1 + (griPercentage * 0.01);

            const newTransport = record.breakdown.transport * transportFactor * fuelFactor * griFactor;
            const newHandling = record.breakdown.handling * handlingFactor;

            const newTotal = newTransport + record.breakdown.accessorial + newHandling + record.breakdown.overhead;
            const originalPrice = record.totalCost / (1 - (record.margin / 100));
            const newMargin = ((originalPrice - newTotal) / originalPrice) * 100;

            return {
                ...record,
                totalCost: newTotal,
                breakdown: { ...record.breakdown, transport: newTransport, handling: newHandling },
                margin: newMargin
            };
        });
    }, [ctsData, ftlShare, fuelIndex, handlingEfficiency, griPercentage, searchQuery]);

    const waterfallData = useMemo(() => {
        const transport = simulatedData.reduce((acc, r) => acc + r.breakdown.transport, 0);
        const accessorial = simulatedData.reduce((acc, r) => acc + r.breakdown.accessorial, 0);
        const handling = simulatedData.reduce((acc, r) => acc + r.breakdown.handling, 0);
        const overhead = simulatedData.reduce((acc, r) => acc + r.breakdown.overhead, 0);
        const total = transport + accessorial + handling + overhead;

        return [
            { name: 'Transport', value: transport, fill: '#0f62fe' },
            { name: 'Accessorial', value: accessorial, fill: '#0f62fe' },
            { name: 'Handling', value: handling, fill: '#00C805' },
            { name: 'Overhead', value: overhead, fill: '#fa4d56' },
            { name: 'Total', value: total, fill: '#161616' }
        ];
    }, [simulatedData]);

    const handleExportCSV = () => {
        const columns = ['Customer', 'SKU', 'Lane', 'Transport', 'Handling', 'Total Cost', 'Margin %'];
        const data = simulatedData.map(r => [
            r.customer, r.sku, r.lane, r.breakdown.transport.toFixed(2),
            r.breakdown.handling.toFixed(2), r.totalCost.toFixed(2), r.margin.toFixed(2)
        ]);
        generateCSVReport('CostToServe_Analysis', data, columns);
    };

    return (
        <div className="p-8 bg-white min-h-screen text-[#161616]">
            {/* INJECT SVG DEFS */}
            <SvgDefinitions />

            {/* HEADER - COMPACT */}
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#161616] pb-4 relative">
                <div className="absolute bottom-0 left-0 w-32 h-1 bg-[#0f62fe]"></div>

                <div className="flex items-center gap-6">
                    <HyperChart size={48} />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tighter text-[#161616]">Cost Studio</h1>
                        <p className="text-xs text-[#525252] font-semibold tracking-wide uppercase mt-1">Margin Engineering</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                        <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Status</div>
                        <div className="text-xs font-bold text-[#00C805] font-mono flex items-center justify-end gap-2">
                            LIVE
                        </div>
                    </div>
                    <button onClick={fetchData} className="group flex items-center justify-center w-10 h-10 border-2 border-[#161616] hover:shadow-[3px_3px_0px_#0f62fe] transition-all bg-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url(#stripe-pattern)] opacity-10"></div>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} relative z-10`} />
                    </button>
                    <button onClick={handleExportCSV} className="group flex items-center justify-center w-10 h-10 bg-[#161616] text-white hover:bg-[#0f62fe] transition-all hover:shadow-[3px_3px_0px_#161616]">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* LEFT: SIMULATOR */}
                <div className="col-span-3 space-y-6">
                    <div className="bg-white border-2 border-[#161616] p-6 relative shadow-[6px_6px_0px_#e0e0e0]">
                        <h3 className="text-xs font-bold text-[#161616] uppercase tracking-widest mb-6 flex items-center border-b border-[#e0e0e0] pb-3">
                            <HyperGear size={20} className="mr-3" /> Parameters
                        </h3>

                        <div className="space-y-6">
                            {[
                                { label: 'FTL CONSOLIDATION', val: ftlShare, set: setFtlShare, min: 0, max: 100, unit: '%' },
                                { label: 'FUEL INDEX', val: fuelIndex, set: setFuelIndex, min: 80, max: 150, unit: 'pts' },
                                { label: 'PROFIT MARGIN', val: griPercentage, set: setGriPercentage, min: 0, max: 25, unit: '%' },
                                { label: 'EFFICIENCY', val: handlingEfficiency, set: setHandlingEfficiency, min: 0, max: 50, unit: '%' }
                            ].map((p, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-center mb-2 text-[10px] font-bold text-[#161616]">
                                        <span className="group-hover:text-[#0f62fe] transition-colors">{p.label}</span>
                                        <span className="font-mono text-[#161616] border border-[#e0e0e0] px-1">{p.val}{p.unit}</span>
                                    </div>
                                    <div className="relative h-4 flex items-center">
                                        <input
                                            type="range" min={p.min} max={p.max} value={p.val} onChange={(e) => p.set(Number(e.target.value))}
                                            className="w-full h-1 bg-[#161616] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#ffffff] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#161616] [&::-webkit-slider-thumb]:hover:scale-125 transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RESULTS BOX - COMPACT */}
                    <div className="bg-[#161616] p-6 text-white relative flex flex-col items-center justify-center text-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                        <HyperVarianceBox size={64} className="mb-4 relative z-10" />

                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00C805] mb-1 relative z-10">Net Variance</h3>
                        <div className="text-3xl font-mono font-bold mb-4 relative z-10 tracking-tighter">
                            ₹{(ctsData.reduce((acc, r) => acc + r.totalCost, 0) - simulatedData.reduce((acc, r) => acc + r.totalCost, 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: ANALYTICS */}
                <div className="col-span-9 space-y-8">
                    {/* CHART - 3D ISOMETRIC BARS */}
                    <div className="bg-white border-2 border-[#0f62fe] p-6 shadow-[6px_6px_0px_rgba(15,98,254,0.1)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#161616] uppercase tracking-tighter flex items-center">
                                <Layers size={18} className="mr-3 opacity-50" /> Cost Structures
                            </h3>
                            <div className="flex gap-4">
                                {waterfallData.slice(0, 4).map((d, i) => (
                                    <div key={i} className="flex items-center text-[10px] font-bold uppercase tracking-wider">
                                        <div className="w-2 h-2 mr-2 border border-[#161616]" style={{ backgroundColor: d.fill }}></div>
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={waterfallData} barSize={50}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#161616' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#888', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#161616', border: 'none', color: '#fff', fontSize: '12px', fontFamily: 'monospace', padding: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    {/* USE CUSTOM SHAPE FOR 3D EFFECT */}
                                    <Bar dataKey="value" shape={<CustomIsometricBar />} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="border-2 border-[#161616] shadow-sm">
                        <div className="px-5 py-3 bg-[#161616] text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 50%, #333 50%, #333 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>

                            <h3 className="text-xs font-bold uppercase tracking-[0.1em] relative z-10 flex items-center">
                                <Cpu size={14} className="mr-2" /> Transaction Ledger
                            </h3>
                            <div className="relative text-[#161616] z-10">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="QUERY..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 text-[10px] font-bold border-none outline-none w-48 uppercase bg-white focus:bg-[#f4f4f4]"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white text-[#161616] text-[10px] font-bold uppercase border-b-2 border-[#161616] tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 border-r border-[#e0e0e0]">Customer</th>
                                        <th className="px-5 py-3 border-r border-[#e0e0e0]">SKU Ref</th>
                                        <th className="px-5 py-3 border-r border-[#e0e0e0]">Lane</th>
                                        <th className="px-5 py-3 text-right border-r border-[#e0e0e0]">Transport</th>
                                        <th className="px-5 py-3 text-right border-r border-[#e0e0e0]">Handling</th>
                                        <th className="px-5 py-3 text-right border-r border-[#e0e0e0]">Total</th>
                                        <th className="px-5 py-3 text-right">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] text-[#161616] divide-y divide-[#e0e0e0]">
                                    {simulatedData.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-[#525252] font-mono tracking-widest opacity-50">NO DATA SIGNALS</td></tr>
                                    ) : simulatedData.map((r) => (
                                        <tr key={r.id} className="hover:bg-[#f0f4ff] font-mono transition-colors group">
                                            <td className="px-5 py-2.5 border-r border-[#f4f4f4] font-bold font-sans group-hover:text-[#0f62fe]">{r.customer}</td>
                                            <td className="px-5 py-2.5 border-r border-[#f4f4f4] text-[#525252]">{r.sku}</td>
                                            <td className="px-5 py-2.5 border-r border-[#f4f4f4]">{r.lane}</td>
                                            <td className="px-5 py-2.5 text-right border-r border-[#f4f4f4]">₹{r.breakdown.transport.toFixed(0)}</td>
                                            <td className="px-5 py-2.5 text-right border-r border-[#f4f4f4]">₹{r.breakdown.handling.toFixed(0)}</td>
                                            <td className="px-5 py-2.5 text-right font-bold border-r border-[#f4f4f4] bg-[#fafafa]">₹{r.totalCost.toFixed(0)}</td>
                                            <td className="px-5 py-2.5 text-right">
                                                <span className={`font-bold px-1.5 py-0.5 border ${r.margin > 15 ? 'text-[#00C805] border-[#00C805] bg-[#e6ffed]' : 'text-[#fa4d56] border-[#fa4d56] bg-[#fff0f1]'}`}>
                                                    {r.margin.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
