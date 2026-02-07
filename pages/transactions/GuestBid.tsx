import React, { useState, useEffect } from 'react';
import { spotService } from '../../services/spotService';
import { SpotIndent, SpotVendorRequest, SpotVendor } from '../../types';
import { Truck, CheckCircle, AlertTriangle, Send } from 'lucide-react';

export const GuestBid: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<{ indent: SpotIndent, request: SpotVendorRequest, vendor: SpotVendor } | null>(null);
    const [amount, setAmount] = useState<number | ''>('');
    const [remarks, setRemarks] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            setError('Invalid Link. Token missing.');
            setLoading(false);
            return;
        }

        const match = spotService.getRequestByToken(token);
        if (match) {
            setData(match);
            if (match.request.bid) {
                setSubmitted(true);
            }
        } else {
            setError('Invalid or Expired Link.');
        }
        setLoading(false);
    }, []);

    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const success = spotService.submitBid(data!.request.token, Number(amount), remarks);
        if (success) {
            setSubmitted(true);
        } else {
            alert("Submission Failed");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <AlertTriangle className="text-red-500 mb-4" size={48} />
            <h1 className="text-xl font-bold text-gray-800">Link Error</h1>
            <p className="text-gray-500 mt-2">{error}</p>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
                <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="text-green-600" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Bid Submitted!</h1>
                <p className="text-gray-600 mb-6">Thank you, <b>{data?.vendor.name}</b>. Your quote has been sent to Atlas Manufacturing.</p>
                <div className="bg-gray-50 rounded p-4 text-left">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Your Quote</p>
                    <p className="text-2xl font-bold text-gray-900">₹{Number(amount || data?.request.bid?.amount).toLocaleString()}</p>
                </div>
            </div>
            <p className="text-gray-400 text-xs mt-8">Powered by SequelString AI Control Tower</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 py-8">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#1B2559] p-6 text-white text-center">
                    <h3 className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Request for Quotation</h3>
                    <h1 className="text-2xl font-bold">Spot Indent</h1>
                </div>

                {/* Indent Details */}
                <div className="p-6 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs text-blue-600 font-bold uppercase">Origin</p>
                            <p className="text-lg font-bold text-gray-900">{data?.indent.origin}</p>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="text-right">
                            <p className="text-xs text-blue-600 font-bold uppercase">Destination</p>
                            <p className="text-lg font-bold text-gray-900">{data?.indent.destination}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 bg-white p-3 rounded border border-blue-100">
                        <span className="flex items-center"><Truck size={16} className="mr-2 text-gray-400" /> {data?.indent.vehicleType}</span>
                        <span className="font-bold">{data?.indent.weightTon} MT</span>
                    </div>
                </div>

                {/* Bid Form */}
                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-4">Hello <b>{data?.vendor.name}</b>, please verify availability and quote your best rate immediately.</p>

                        <label className="block text-sm font-bold text-gray-700 mb-1">Your Rate (₹)</label>
                        <div className="relative">
                            <input
                                type="number"
                                autoFocus
                                className="w-full text-2xl font-bold border-2 border-gray-300 rounded-lg p-3 pl-8 focus:border-blue-500 focus:ring-blue-500 outline-none"
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                placeholder="0"
                            />
                            <span className="absolute left-4 top-4 text-gray-400 font-bold">₹</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Remarks (Optional)</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                            placeholder="e.g. Including Mathadi, tolls extra..."
                            rows={2}
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#E56910] text-white font-bold py-4 rounded-lg shadow-lg hover:bg-orange-700 transition transform active:scale-95 flex items-center justify-center"
                    >
                        <Send size={20} className="mr-2" /> Submit Quote
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">By submitting, you agree to Atlas Procurement Terms.</p>
                </div>
            </div>
        </div>
    );
};
