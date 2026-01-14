import React, { useState, useEffect } from 'react';
import { spotService } from '../services/spotService';
import { SpotIndent, SpotVendor } from '../types';
import { Geo3DGavel, Geo3DTruck, Geo3DClock, Geo3DBroadcast, Geo3DMap, Geo3DWallet, Geo3DCube, Geo3DSphere, Geo3DZap, Geo3DCheck, Geo3DArrowRight, Geo3DPlus, Geo3DCross } from '../components/GeoIcons';
import { SpotRateAdvisor } from '../components/SpotRateAdvisor';
import { MilkRunOptimizer } from '../components/MilkRunOptimizer';
import { PlacementRiskAdvisor } from '../components/PlacementRiskAdvisor';

export const SpotMarket: React.FC = () => {
    // State
    const [indents, setIndents] = useState<SpotIndent[]>([]);
    const [vendors, setVendors] = useState<SpotVendor[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
    const [selectedIndent, setSelectedIndent] = useState<SpotIndent | null>(null);
    const [newIndent, setNewIndent] = useState({
        origin: '',
        destination: '',
        vehicleType: '32ft MXL',
        weightTon: 20,
        benchmarkPrice: 40000,
        selectedVendorIds: [] as string[]
    });

    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setIndents(spotService.getAllIndents());
        setVendors(spotService.getVendors());
    };

    // --- BID SIMULATION LOGIC ---
    const simulateIncomingBids = (indentId: string) => {
        setIsSimulating(true);
        const bench = indents.find(i => i.id === indentId)?.benchmarkPrice || 40000;

        const simBids = [
            { vendorId: 'V-SPOT-001', name: 'Sharma Transporters', amount: bench * 0.95, remark: 'Ready vehicle', delay: 2000 },
            { vendorId: 'V-SPOT-002', name: 'VRL Logistics', amount: bench * 1.05, remark: 'Premium placement', delay: 4500 },
            { vendorId: 'V-SPOT-003', name: 'Ghatge Patil', amount: bench * 1.02, remark: 'Loading in 2 hrs', delay: 6000 },
            { vendorId: 'V-SPOT-004', name: 'Blue Dart', amount: bench * 1.25, remark: 'Express Priority', delay: 8000 },
        ];

        simBids.forEach(bid => {
            setTimeout(() => {
                spotService.simulateBid(indentId, bid.vendorId, bid.amount, bid.remark);
                loadData();
                if (selectedIndent && selectedIndent.id === indentId) {
                    setSelectedIndent(spotService.getIndentById(indentId) || null);
                }
            }, bid.delay);
        });

        setTimeout(() => setIsSimulating(false), 9000);
    };

    const handleCreate = () => {
        if (!newIndent.origin || !newIndent.destination || newIndent.selectedVendorIds.length === 0) {
            alert("Please fill all fields and select at least one vendor.");
            return;
        }
        const createdIndent = spotService.createIndent(newIndent);
        setIsCreateModalOpen(false);
        loadData();
        setSelectedIndent(createdIndent);
        setNewIndent({ ...newIndent, origin: '', destination: '', selectedVendorIds: [] });
    };

    const toggleVendor = (vId: string) => {
        setNewIndent(prev => {
            const exists = prev.selectedVendorIds.includes(vId);
            return {
                ...prev,
                selectedVendorIds: exists
                    ? prev.selectedVendorIds.filter(id => id !== vId)
                    : [...prev.selectedVendorIds, vId]
            };
        });
    };

    const handleApprove = (indentId: string, bidId: string) => {
        const result = spotService.approveBooking(indentId, bidId);
        if (result.success) {
            loadData();
            if (selectedIndent && selectedIndent.id === indentId) {
                setSelectedIndent(spotService.getIndentById(indentId) || null);
            }
        } else {
            alert(result.message);
        }
    };

    const getTimeDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes
        if (diff < 60) return `${diff}m ago`;
        return `${Math.floor(diff / 60)}h ago`;
    };

    // SOLID COLORS
    const RH_GREEN = '#00C805';
    const SOLID_BLUE = '#0052FF';

    // Helper for borders to ensure they are solid
    const solidBorder = "border border-gray-300";
    const activeBorder = "border border-[#00C805]";

    return (
        <div className="h-full flex flex-col font-sans bg-white text-slate-900 overflow-hidden relative">

            {/* MODAL: BROADCAST WIZARD */}
            {isCreateModalOpen && (
                <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-black shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2 uppercase tracking-wide">
                                <Geo3DBroadcast size={20} color={RH_GREEN} />
                                Broadcast Wizard
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="hover:text-gray-600 transition-colors">
                                <Geo3DCross size={20} color="black" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-8 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-gray-200 pb-1">1. Route Definition</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center bg-white border border-gray-300 hover:border-black transition-colors px-2">
                                            <Geo3DMap size={16} color="black" />
                                            <input
                                                className="w-full bg-transparent p-2 text-sm text-slate-900 outline-none font-bold placeholder-gray-400"
                                                placeholder="Origin (e.g. Pune)"
                                                value={newIndent.origin}
                                                onChange={e => setNewIndent({ ...newIndent, origin: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center bg-white border border-gray-300 hover:border-black transition-colors px-2">
                                            <Geo3DMap size={16} color="black" />
                                            <input
                                                className="w-full bg-transparent p-2 text-sm text-slate-900 outline-none font-bold placeholder-gray-400"
                                                placeholder="Destination (e.g. Delhi)"
                                                value={newIndent.destination}
                                                onChange={e => setNewIndent({ ...newIndent, destination: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-gray-200 pb-1">2. Load Specs</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Vehicle</label>
                                            <div className="flex items-center bg-white border border-gray-300 px-2 h-10">
                                                <Geo3DTruck size={16} color="black" className="mr-2" />
                                                <select
                                                    className="w-full bg-transparent text-sm text-slate-900 outline-none font-bold"
                                                    value={newIndent.vehicleType}
                                                    onChange={e => setNewIndent({ ...newIndent, vehicleType: e.target.value })}
                                                >
                                                    <option>32ft MXL</option>
                                                    <option>19ft Open</option>
                                                    <option>10-Tyre</option>
                                                    <option>20ft Container</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price (₹)</label>
                                            <div className="flex items-center bg-white border border-gray-300 px-2 h-10">
                                                <span className="text-slate-900 mr-1 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent text-sm text-slate-900 outline-none font-bold"
                                                    value={newIndent.benchmarkPrice}
                                                    onChange={e => setNewIndent({ ...newIndent, benchmarkPrice: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI RATE ADVISOR */}
                                    {newIndent.origin && newIndent.destination && (
                                        <div className="space-y-4">
                                            <SpotRateAdvisor
                                                origin={newIndent.origin}
                                                destination={newIndent.destination}
                                                vehicleType={newIndent.vehicleType}
                                                vendorQuote={newIndent.benchmarkPrice}
                                            />

                                            {/* PLACEMENT RISK ADVISOR FOR SELECTED VENDOR */}
                                            {newIndent.selectedVendorIds.length > 0 && (
                                                <PlacementRiskAdvisor
                                                    vendorId={newIndent.selectedVendorIds[0]} // Show for first selected
                                                    vendorName={vendors.find(v => v.id === newIndent.selectedVendorIds[0])?.name || 'Vendor'}
                                                    origin={newIndent.origin}
                                                    destination={newIndent.destination}
                                                    placementDate={new Date().toISOString().split('T')[0]}
                                                    loadValue={250000} // Default load value
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col h-full border-l border-gray-200 pl-6">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-gray-200 pb-1 mb-3">3. Vendors</h4>
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {vendors.map(v => (
                                        <div
                                            key={v.id}
                                            onClick={() => toggleVendor(v.id)}
                                            className={`p-3 border cursor-pointer flex justify-between items-center transition-all ${newIndent.selectedVendorIds.includes(v.id)
                                                ? 'bg-gray-50 border-[#00C805] shadow-sm'
                                                : 'bg-white border-gray-200 hover:border-gray-400'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold border border-black ${newIndent.selectedVendorIds.includes(v.id) ? 'bg-[#00C805] text-white border-[#00C805]' : 'bg-white text-black'}`}>
                                                    {v.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-xs text-slate-900">{v.name}</div>
                                                    <div className="text-[10px] text-gray-500">★ {v.rating}</div>
                                                </div>
                                            </div>
                                            {newIndent.selectedVendorIds.includes(v.id) && (
                                                <Geo3DCheck size={16} color="#00C805" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleCreate}
                                    className="w-full mt-4 bg-[#00C805] text-white font-bold uppercase text-xs tracking-wider py-3 border border-black shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_black] transition-all flex items-center justify-center gap-2"
                                >
                                    <Geo3DBroadcast size={16} color="white" />
                                    BROADCAST INDENT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MILK RUN OPTIMIZER */}
            {isOptimizerOpen && (
                <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-black shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
                        <div className="bg-black px-6 py-4 border-b border-gray-200 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-wide">
                                <Geo3DCube size={20} color="#0066FF" />
                                Milk Run Route Optimizer (AI)
                            </h3>
                            <button onClick={() => setIsOptimizerOpen(false)} className="hover:text-gray-300 transition-colors">
                                <Geo3DCross size={20} color="white" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <MilkRunOptimizer />
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN LAYOUT */}
            <div className="flex h-full">

                {/* LEFT SIDEBAR */}
                <div className="w-72 bg-white border-r border-gray-300 flex flex-col z-20">
                    <div className="p-4 border-b border-gray-300 bg-white">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 uppercase">
                            <Geo3DCube size={20} color="#00C805" /> Trading Floor
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 text-center border-b border-gray-300 text-xs">
                        <div className="p-3 border-r border-gray-300">
                            <div className="text-gray-500 uppercase font-bold tracking-wider mb-1">Active</div>
                            <div className="text-lg font-bold text-slate-900">{indents.filter(i => i.status === 'BIDDING').length}</div>
                        </div>
                        <div className="p-3">
                            <div className="text-gray-500 uppercase font-bold tracking-wider mb-1">Won</div>
                            <div className="text-lg font-bold text-[#00C805]">{indents.filter(i => i.status === 'BOOKED').length}</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
                        <div className="p-3 space-y-3">
                            <button
                                onClick={() => setIsOptimizerOpen(true)}
                                className="w-full py-3 bg-black text-white border border-black shadow-[3px_3px_0px_rgba(0,0,0,0.2)] font-bold uppercase tracking-wide text-[10px] flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            >
                                <Geo3DCube size={14} color="#0066FF" /> AI OPTIMIZE ROUTES
                            </button>

                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="w-full py-3 bg-white border border-black shadow-[2px_2px_0px_black] text-slate-900 font-bold uppercase tracking-wide text-[10px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_black]"
                            >
                                <Geo3DPlus size={14} color="black" /> New Request
                            </button>
                        </div>

                        {indents.map(indent => {
                            const isSelected = selectedIndent?.id === indent.id;
                            const isBooked = indent.status === 'BOOKED';
                            return (
                                <div
                                    key={indent.id}
                                    onClick={() => setSelectedIndent(indent)}
                                    className={`px-4 py-3 border-b cursor-pointer transition-all relative ${isSelected
                                        ? 'bg-white border-l-4 border-l-[#00C805] border-gray-300 shadow-sm'
                                        : 'bg-white border-l-4 border-l-transparent border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${isBooked ? 'bg-[#00C805] text-white border-black' : 'bg-white text-blue-600 border-blue-600'}`}>
                                            {indent.status}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">{getTimeDisplay(indent.createdAt)}</span>
                                    </div>

                                    <div className="mt-1">
                                        <h4 className="font-bold text-slate-900 text-xs truncate">{indent.origin}</h4>
                                        <div className="flex items-center justify-center my-0.5"><Geo3DArrowRight size={10} color="#cbd5e1" /></div>
                                        <h4 className="font-bold text-slate-900 text-xs truncate">{indent.destination}</h4>
                                    </div>

                                    <div className="mt-2 flex justify-between items-center opacity-70">
                                        <div className="flex items-center text-[9px] text-slate-900 gap-1 font-bold">
                                            <Geo3DTruck size={12} color="black" /> {indent.vehicleType}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-900">
                                            {indent.vendorRequests.filter(r => r.bid).length} BIDS
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CENTRE: THE BIDDING PIT */}
                <div className="flex-1 bg-white flex flex-col relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    {selectedIndent ? (
                        <div className="relative z-10 flex flex-col h-full">
                            {/* Header Panel */}
                            <div className="h-24 border-b border-black bg-white flex items-center justify-between px-8 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{selectedIndent.origin}</h2>
                                        <Geo3DArrowRight size={20} color="black" />
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{selectedIndent.destination}</h2>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="bg-slate-900 text-white px-1.5 py-0.5 text-[10px] font-bold font-mono">{selectedIndent.id}</span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-slate-700"><Geo3DTruck size={14} color="black" /> {selectedIndent.vehicleType}</span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-[#00C805] bg-[#00C805]/5 px-1.5 py-0.5 border border-[#00C805]">
                                            BENCHMARK: ₹{selectedIndent.benchmarkPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {selectedIndent.status !== 'BOOKED' && (
                                    <button
                                        onClick={() => simulateIncomingBids(selectedIndent.id)}
                                        disabled={isSimulating}
                                        className={`px-5 py-2.5 border-2 border-black font-bold uppercase text-xs tracking-wide shadow-[3px_3px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_black] transition-all flex items-center gap-2 ${isSimulating
                                            ? 'bg-yellow-400 text-black'
                                            : 'bg-black text-white hover:bg-slate-800'}`}
                                    >
                                        <Geo3DClock size={16} color={isSimulating ? 'black' : 'white'} />
                                        {isSimulating ? 'MARKET LIVE...' : 'START AUCTION'}
                                    </button>
                                )}

                                {selectedIndent.status === 'BOOKED' && (
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 text-[#00C805] font-bold mb-0.5 uppercase tracking-wide text-xs">
                                            <Geo3DCheck size={16} color="#00C805" />
                                            BOOKING CONFIRMED
                                        </div>
                                        <div className="text-xl font-mono font-bold tracking-widest text-slate-900 bg-[#00C805]/10 px-3 py-0.5 border border-[#00C805]">
                                            {selectedIndent.spotBookingRef}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* AI RATE ADVISOR - XGBoost Prediction Panel */}
                            {selectedIndent.vendorRequests.filter(r => r.bid).length > 0 && (
                                <div className="mx-8 mt-4 bg-[#0052FF] p-4 border border-black shadow-[4px_4px_0px_black]">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-white p-2 border border-black">
                                            <Geo3DZap size={24} color="#0052FF" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-white font-bold text-xs uppercase tracking-wide">AI Rate Advisor</h4>
                                                <span className="bg-white text-[#0052FF] text-[9px] font-bold px-2 py-0.5">XGBoost REGRESSION</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-white/70 text-[10px] uppercase font-bold mb-1">Fair Market Rate</div>
                                                    <div className="text-white text-xl font-mono font-bold">
                                                        ₹{Math.round(selectedIndent.benchmarkPrice * 0.88).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-white/70 text-[10px] uppercase font-bold mb-1">L1 Bid vs Fair</div>
                                                    <div className="text-white text-xl font-mono font-bold">
                                                        {(() => {
                                                            const bids = selectedIndent.vendorRequests.filter(r => r.bid);
                                                            if (bids.length === 0) return '—';
                                                            const l1 = Math.min(...bids.map(b => b.bid!.amount));
                                                            const fair = selectedIndent.benchmarkPrice * 0.88;
                                                            const diff = ((l1 - fair) / fair) * 100;
                                                            return diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
                                                        })()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-white/70 text-[10px] uppercase font-bold mb-1">Verdict</div>
                                                    <div className={`text-lg font-bold ${(() => {
                                                        const bids = selectedIndent.vendorRequests.filter(r => r.bid);
                                                        if (bids.length === 0) return 'text-white';
                                                        const l1 = Math.min(...bids.map(b => b.bid!.amount));
                                                        const fair = selectedIndent.benchmarkPrice * 0.88;
                                                        const diff = ((l1 - fair) / fair) * 100;
                                                        if (diff > 10) return 'text-red-300';
                                                        if (diff > 3) return 'text-yellow-300';
                                                        return 'text-[#00C805]';
                                                    })()}`}>
                                                        {(() => {
                                                            const bids = selectedIndent.vendorRequests.filter(r => r.bid);
                                                            if (bids.length === 0) return 'AWAITING BIDS';
                                                            const l1 = Math.min(...bids.map(b => b.bid!.amount));
                                                            const fair = selectedIndent.benchmarkPrice * 0.88;
                                                            const diff = ((l1 - fair) / fair) * 100;
                                                            if (diff > 10) return '⚠ OVERPRICED';
                                                            if (diff > 3) return '△ SLIGHTLY HIGH';
                                                            return '✓ FAIR PRICE';
                                                        })()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-white/70 text-[10px] uppercase font-bold mb-1">Recommendation</div>
                                                    <div className="text-white text-[11px] font-medium leading-relaxed">
                                                        {(() => {
                                                            const bids = selectedIndent.vendorRequests.filter(r => r.bid);
                                                            if (bids.length === 0) return 'Waiting for vendor quotes...';
                                                            const l1 = Math.min(...bids.map(b => b.bid!.amount));
                                                            const fair = selectedIndent.benchmarkPrice * 0.88;
                                                            const diff = ((l1 - fair) / fair) * 100;
                                                            if (diff > 10) return `NEGOTIATE: Counter at ₹${Math.round(fair * 1.05).toLocaleString()} (+5% of fair rate)`;
                                                            if (diff > 3) return `NEGOTIATE: Target ₹${Math.round(fair * 1.02).toLocaleString()} for better deal`;
                                                            return 'APPROVE: Rate is at or below market average';
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-2 border-t border-white/20 text-white/80 text-[10px] italic">
                                                💡 Negotiation Tip: "{selectedIndent.origin} → {selectedIndent.destination} averaged ₹{Math.round(selectedIndent.benchmarkPrice * 0.85).toLocaleString()} in past 30 days. Your competitor did this route for ₹{Math.round(selectedIndent.benchmarkPrice * 0.82).toLocaleString()} last week."
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BIDDING ARENA */}
                            <div className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                                <div className="grid grid-cols-1 gap-3 max-w-5xl mx-auto">
                                    <div className="grid grid-cols-12 text-slate-500 font-bold text-[10px] uppercase tracking-wider px-6 mb-1">
                                        <div className="col-span-1 text-center">Rank</div>
                                        <div className="col-span-4">Vendor Partner</div>
                                        <div className="col-span-2 text-right">Bid Price</div>
                                        <div className="col-span-2 text-right">Variance</div>
                                        <div className="col-span-3 text-center">Action</div>
                                    </div>

                                    {selectedIndent.vendorRequests.filter(r => r.bid).sort((a, b) => (a.bid!.amount - b.bid!.amount)).map((req, idx) => {
                                        const bid = req.bid!;
                                        const variance = ((bid.amount - selectedIndent.benchmarkPrice) / selectedIndent.benchmarkPrice) * 100;
                                        const isWinner = selectedIndent.winningBidId === bid.id;
                                        const isL1 = idx === 0;

                                        return (
                                            <div
                                                key={bid.id}
                                                className={`grid grid-cols-12 items-center bg-white border px-6 py-3 transition-all ${isWinner
                                                    ? 'border-[#00C805] shadow-[4px_4px_0px_#00C805] z-10'
                                                    : 'border-black shadow-[3px_3px_0px_rgba(0,0,0,0.1)]'}`}
                                            >
                                                {/* Rank */}
                                                <div className="col-span-1 flex justify-center">
                                                    {isWinner ? (
                                                        <Geo3DCheck size={24} color="#00C805" />
                                                    ) : (
                                                        <div className={`font-mono text-lg font-bold ${isL1 ? 'text-[#00C805]' : 'text-gray-300'}`}>
                                                            {idx + 1}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Vendor */}
                                                <div className="col-span-4">
                                                    <div className="font-bold text-slate-900 text-sm uppercase">{bid.vendorName}</div>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                                        <span className="flex items-center gap-1 text-blue-600"><Geo3DBroadcast size={10} /> Read</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="font-mono">#{bid.id.split('-')[1]}</span>
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="col-span-2 text-right">
                                                    <div className="font-mono text-lg font-bold text-slate-900">₹{bid.amount.toLocaleString()}</div>
                                                    <div className="text-[9px] text-gray-500 font-bold uppercase">{bid.remarks}</div>
                                                </div>

                                                {/* Variance */}
                                                <div className="col-span-2 text-right">
                                                    <div className={`font-bold font-mono text-sm ${variance > 10 ? 'text-red-600' : variance > 0 ? 'text-amber-500' : 'text-[#00C805]'}`}>
                                                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="col-span-3 flex justify-end gap-2 pl-4">
                                                    {selectedIndent.status === 'BOOKED' ? (
                                                        isWinner ? (
                                                            <div className="px-3 py-1 bg-[#00C805] text-white border border-black text-[10px] font-bold uppercase shadow-[2px_2px_0px_black]">
                                                                Awarded
                                                            </div>
                                                        ) : (
                                                            <div className="px-3 py-1 text-gray-400 text-[10px] font-bold uppercase">Lost</div>
                                                        )
                                                    ) : (
                                                        <button
                                                            onClick={() => handleApprove(selectedIndent.id, bid.id)}
                                                            className={`flex-1 px-3 py-1.5 border border-black font-bold text-[10px] uppercase tracking-wide transition-all shadow-[2px_2px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_black] ${variance > 10
                                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                                : 'bg-[#00C805] text-white hover:bg-[#00a604]'}`}
                                                        >
                                                            {variance > 10 ? 'Request Approval' : 'Book Now'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {selectedIndent.vendorRequests.filter(r => r.bid).length === 0 && (
                                        <div className="text-center py-16 border-2 border-dashed border-gray-300 bg-white">
                                            <div className="opacity-20 mb-3"><Geo3DGavel size={48} className="mx-auto text-slate-900" /></div>
                                            <h3 className="text-gray-400 font-bold text-lg uppercase tracking-widest">Floor Silent</h3>
                                            <p className="text-gray-400 text-sm mt-1">Waiting for bids from {selectedIndent.vendorRequests.length} vendors...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AUDIT BLACK BOX (Solid Footer) */}
                            <div className="h-40 border-t border-black bg-white p-6 overflow-hidden">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Geo3DCube size={16} color="black" /> Audit Trail
                                </h4>
                                <div className="flex gap-12 overflow-x-auto pb-2 custom-scrollbar">
                                    <div className="relative pl-4 border-l-4 border-[#00C805]">
                                        <div className="text-[10px] font-mono font-bold text-gray-400 mb-0.5">10:00 AM</div>
                                        <div className="text-sm text-slate-900 font-bold uppercase leading-none">Indent Created</div>
                                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">User: Kaai Bansal</div>
                                    </div>
                                    <div className="relative pl-4 border-l-4 border-blue-600">
                                        <div className="text-[10px] font-mono font-bold text-gray-400 mb-0.5">10:02 AM</div>
                                        <div className="text-sm text-slate-900 font-bold uppercase leading-none">Broadcast Sent</div>
                                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">To 4 Vendors</div>
                                    </div>
                                    <div className="relative pl-4 border-l-4 border-amber-500">
                                        <div className="text-[10px] font-mono font-bold text-gray-400 mb-0.5">10:05 AM</div>
                                        <div className="text-sm text-slate-900 font-bold uppercase leading-none">Market Active</div>
                                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">Bid Receiving Started</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                            <div className="w-24 h-24 bg-white flex items-center justify-center mb-6 border-2 border-black shadow-[4px_4px_0px_black]">
                                <Geo3DGavel size={40} className="text-black" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase mb-2">Spot Trading Desk</h2>
                            <p className="text-gray-500 font-bold text-sm max-w-sm mb-6">
                                Select a load to start trading or create a new request.
                            </p>
                            <button onClick={() => setIsCreateModalOpen(true)} className="px-6 py-3 bg-[#00C805] text-white font-bold text-sm uppercase tracking-wider border border-black shadow-[3px_3px_0px_black] hover:shadow-[2px_2px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                                Open New Market Request
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f8fafc;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};
