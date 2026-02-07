import React, { useState, useEffect } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { spotService } from '../../services/spotService';
import { SpotIndent, SpotVendor } from '../../types';
import { Search, Filter, Clock, ChevronRight, TrendingDown, RefreshCw, CheckCircle } from 'lucide-react';
import { Geo3DGavel, Geo3DTarget, Geo3DPackage, Geo3DScale, Geo3DCalendar, Geo3DTrophy } from './components/3DGeometricIcons';

interface SpotMarketProps {
    supplier: IndianSupplier;
}

interface BidModalState {
    isOpen: boolean;
    indent: SpotIndent | null;
    bidAmount: number;
    remarks: string;
}

export const SpotMarket: React.FC<SpotMarketProps> = ({ supplier }) => {
    const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
    const [indents, setIndents] = useState<SpotIndent[]>([]);
    const [spotVendor, setSpotVendor] = useState<SpotVendor | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [bidModal, setBidModal] = useState<BidModalState>({
        isOpen: false,
        indent: null,
        bidAmount: 0,
        remarks: ''
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Load data on mount and when supplier changes
    useEffect(() => {
        loadData();
    }, [supplier.name]);

    const loadData = () => {
        setLoading(true);

        // Find the spot vendor by matching supplier name
        const vendor = spotService.getVendorByName(supplier.name);
        setSpotVendor(vendor);

        if (vendor) {
            // Get all active indents for this vendor
            const vendorIndents = spotService.getIndentsForVendor(vendor.id);
            setIndents(vendorIndents);
            console.log(`[SpotMarket] Loaded ${vendorIndents.length} indents for ${supplier.name} (${vendor.id})`);
        } else {
            setIndents([]);
            console.log(`[SpotMarket] No spot vendor found matching "${supplier.name}"`);
        }

        setLoading(false);
    };

    const openBidModal = (indent: SpotIndent) => {
        // Get current L1 or use benchmark price
        const currentL1 = getCurrentL1(indent);
        setBidModal({
            isOpen: true,
            indent,
            bidAmount: currentL1 > 0 ? currentL1 - 500 : indent.benchmarkPrice,
            remarks: ''
        });
    };

    const closeBidModal = () => {
        setBidModal({
            isOpen: false,
            indent: null,
            bidAmount: 0,
            remarks: ''
        });
    };

    const submitBid = () => {
        if (!bidModal.indent || !spotVendor) return;

        const result = spotService.submitBidFromSupplier(
            bidModal.indent.id,
            spotVendor.id,
            bidModal.bidAmount,
            bidModal.remarks
        );

        if (result.success) {
            setSuccessMessage(`Bid of ₹${bidModal.bidAmount.toLocaleString()} submitted successfully!`);
            closeBidModal();
            loadData(); // Refresh data

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            alert(result.message);
        }
    };

    const getCurrentL1 = (indent: SpotIndent): number => {
        const bids = indent.vendorRequests
            .filter(r => r.bid)
            .map(r => r.bid!.amount);
        return bids.length > 0 ? Math.min(...bids) : 0;
    };

    const getMyBid = (indent: SpotIndent): number | null => {
        if (!spotVendor) return null;
        const myRequest = indent.vendorRequests.find(r => r.vendorId === spotVendor.id);
        return myRequest?.bid?.amount || null;
    };

    const getMyRank = (indent: SpotIndent): string | null => {
        if (!spotVendor) return null;
        const myBid = getMyBid(indent);
        if (!myBid) return null;

        const sortedBids = indent.vendorRequests
            .filter(r => r.bid)
            .map(r => r.bid!.amount)
            .sort((a, b) => a - b);

        const rank = sortedBids.indexOf(myBid) + 1;
        return `L${rank}`;
    };

    const getTimeLeft = (createdAt: string): string => {
        const created = new Date(createdAt);
        const deadline = new Date(created.getTime() + 4 * 60 * 60 * 1000); // 4 hours from creation
        const now = new Date();
        const remaining = deadline.getTime() - now.getTime();

        if (remaining <= 0) return 'Expired';

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getBidCount = (indent: SpotIndent): number => {
        return indent.vendorRequests.filter(r => r.bid).length;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">

            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
                    <CheckCircle size={20} />
                    {successMessage}
                </div>
            )}

            {/* Bid Modal */}
            {bidModal.isOpen && bidModal.indent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Geo3DGavel size={24} className="text-green-600" />
                            Place Your Bid
                        </h3>

                        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600">
                                <strong>{bidModal.indent.origin}</strong> → <strong>{bidModal.indent.destination}</strong>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {bidModal.indent.vehicleType} • {bidModal.indent.weightTon} MT
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Bid Amount (₹)</label>
                            <input
                                type="number"
                                value={bidModal.bidAmount}
                                onChange={(e) => setBidModal(prev => ({ ...prev, bidAmount: Number(e.target.value) }))}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Benchmark: ₹{bidModal.indent.benchmarkPrice.toLocaleString()} •
                                Current L1: ₹{getCurrentL1(bidModal.indent).toLocaleString() || 'No bids yet'}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Remarks (Optional)</label>
                            <textarea
                                value={bidModal.remarks}
                                onChange={(e) => setBidModal(prev => ({ ...prev, remarks: e.target.value }))}
                                placeholder="e.g., Own vehicle, can pickup same day"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeBidModal}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitBid}
                                className="flex-1 py-3 bg-[#00C805] text-white rounded-lg font-bold hover:bg-green-600 shadow-lg shadow-green-200"
                            >
                                Submit Bid
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        Spot Market
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200 animate-pulse">
                            ● Live
                        </span>
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {spotVendor
                            ? `Logged in as ${spotVendor.name} • Real-time bidding floor`
                            : 'No matching vendor found in spot market'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Live Bids ({indents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Won/Lost History
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <Geo3DGavel size={64} />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Opportunities</p>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-bold">{indents.length}</span>
                        <span className="text-xs text-green-400 font-bold mb-1">invites</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Your Bids</p>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-bold text-slate-900">
                            {indents.filter(i => getMyBid(i) !== null).length}
                        </span>
                        <span className="text-xs text-slate-400 mb-1">submitted</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">L1 Positions</p>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-bold text-green-600">
                            {indents.filter(i => getMyRank(i) === 'L1').length}
                        </span>
                        <span className="text-xs text-slate-400 mb-1">winning</span>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <RefreshCw className="animate-spin mx-auto text-slate-400 mb-3" size={32} />
                    <p className="text-slate-500">Loading opportunities...</p>
                </div>
            )}

            {/* No Vendor Warning */}
            {!loading && !spotVendor && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <p className="text-amber-800 font-bold">No Spot Vendor Match</p>
                    <p className="text-amber-600 text-sm mt-1">
                        Your company "{supplier.name}" is not registered in the spot market. Contact the organization to get invited to broadcasts.
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading && spotVendor && indents.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                    <Geo3DGavel size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold">No Active Broadcasts</p>
                    <p className="text-slate-500 text-sm mt-1">
                        You'll see opportunities here when the organization invites {spotVendor.name} to a spot requirement.
                    </p>
                </div>
            )}

            {/* Bidding Grid */}
            {!loading && indents.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    {indents.map(indent => {
                        const myBid = getMyBid(indent);
                        const myRank = getMyRank(indent);
                        const currentL1 = getCurrentL1(indent);
                        const timeLeft = getTimeLeft(indent.createdAt);
                        const bidCount = getBidCount(indent);

                        return (
                            <div
                                key={indent.id}
                                className={`bg-white rounded-xl border ${myRank === 'L1' ? 'border-green-500 ring-1 ring-green-500/20' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all`}
                            >
                                <div className="p-5 flex flex-col lg:flex-row gap-6">

                                    {/* Left: Route & Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${timeLeft.includes('m') && !timeLeft.includes('h') ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                                                {timeLeft.includes('m') && !timeLeft.includes('h') ? 'Urgent' : 'Open'}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                                <Clock size={12} /> Ends in {timeLeft}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {indent.id}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="text-lg font-bold text-slate-900">{indent.origin}</h3>
                                            <ChevronRight size={20} className="text-slate-400" />
                                            <h3 className="text-lg font-bold text-slate-900">{indent.destination}</h3>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                                            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 font-medium flex items-center gap-1.5">
                                                <Geo3DPackage size={14} className="text-slate-400" /> {indent.vehicleType}
                                            </span>
                                            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 font-medium flex items-center gap-1.5">
                                                <Geo3DScale size={14} className="text-slate-400" /> {indent.weightTon} MT
                                            </span>
                                            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 font-medium">
                                                {bidCount} bid{bidCount !== 1 ? 's' : ''} received
                                            </span>
                                        </div>
                                    </div>

                                    {/* Center: Price Discovery */}
                                    <div className="flex flex-col justify-center items-center px-6 lg:border-x border-slate-100 min-w-[200px]">
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                                                {currentL1 > 0 ? 'Current L1 Price' : 'Benchmark Price'}
                                            </p>
                                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                                                ₹{(currentL1 > 0 ? currentL1 : indent.benchmarkPrice).toLocaleString()}
                                            </p>
                                            {currentL1 > 0 && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Target: ₹{indent.benchmarkPrice.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        {myRank && (
                                            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${myRank === 'L1' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {myRank === 'L1' ? <Geo3DTarget size={14} className="text-green-600" /> : <TrendingDown size={14} />}
                                                You are {myRank} (₹{myBid?.toLocaleString()})
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col justify-center gap-2 min-w-[180px]">
                                        {myRank === 'L1' ? (
                                            <div className="h-full flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-100 border-dashed text-center">
                                                <div className="flex justify-center mb-1">
                                                    <Geo3DTrophy size={24} className="text-amber-500" />
                                                </div>
                                                <p className="text-sm font-bold text-green-800">Winning Position!</p>
                                                <p className="text-xs text-green-600 mt-1">Hold rank until bidding closes.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => openBidModal(indent)}
                                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#00C805] hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                                                >
                                                    <Geo3DGavel size={16} />
                                                    {myBid ? 'Revise Bid' : 'Place Bid'}
                                                </button>
                                                {currentL1 > 0 && !myBid && (
                                                    <button
                                                        onClick={() => {
                                                            if (!spotVendor) return;
                                                            const result = spotService.submitBidFromSupplier(indent.id, spotVendor.id, currentL1, 'Match L1');
                                                            if (result.success) {
                                                                setSuccessMessage('Matched L1 successfully!');
                                                                loadData();
                                                                setTimeout(() => setSuccessMessage(null), 3000);
                                                            }
                                                        }}
                                                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-lg text-sm font-bold transition-all"
                                                    >
                                                        Match L1 (₹{currentL1.toLocaleString()})
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
