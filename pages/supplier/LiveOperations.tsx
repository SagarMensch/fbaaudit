import React, { useState } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { MilestoneTracker } from './components/MilestoneTracker';
import { Phone, Share2, Search, Filter, Clock } from 'lucide-react'; // Keep utility icons
import { Geo3DTruck, Geo3DMapPin, Geo3DDocument } from './components/3DGeometricIcons';

interface LiveOperationsProps {
    supplier: IndianSupplier;
}

// Mock Data for Indents
const ACTIVE_LOADS = [
    {
        id: 'IND-2024-001',
        route: 'Gurugram (HR) → Bengaluru (KA)',
        vehicle: 'HR-55-X-1234',
        driver: 'Ramesh Kumar',
        phone: '+91 98765 43210',
        status: 'UNLOADING',
        material: 'Auto Components (Gearboxes)',
        eta: 'Today, 4:00 PM',
        timestamps: {
            placed: '26 Oct, 09:00 AM',
            gateIn: '28 Oct, 06:15 AM',
            unloading: 'In Progress (Since 08:30)',
            gateOut: null
        }
    },
    {
        id: 'IND-2024-005',
        route: 'Pune (MH) → Chennai (TN)',
        vehicle: 'MH-12-PQ-9981',
        driver: 'Suresh Yadav',
        phone: '+91 99887 77665',
        status: 'GATE_IN',
        material: 'Electrical Transformers',
        eta: 'Tomorrow, 11:00 AM',
        timestamps: {
            placed: '27 Oct, 02:00 PM',
            gateIn: '28 Oct, 10:45 AM',
            unloading: null,
            gateOut: null
        }
    },
    {
        id: 'IND-2024-008',
        route: 'Sanand (GJ) → Pantnagar (UK)',
        vehicle: 'GJ-01-AB-1122',
        driver: 'Vikram Singh',
        phone: '+91 88776 65544',
        status: 'PLACED',
        material: 'Raw Material (Steel Sheets)',
        eta: '30 Oct, 09:00 AM',
        timestamps: {
            placed: '28 Oct, 05:00 AM',
            gateIn: null,
            unloading: null,
            gateOut: null
        }
    }
];

export const LiveOperations: React.FC<LiveOperationsProps> = ({ supplier }) => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">

            {/* Header with Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Live Operations</h2>
                    <p className="text-slate-500 text-sm">Track your vehicles, manage gate entries, and upload PODs.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Vehicle or Route..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#00C805] text-white rounded-lg text-sm font-bold hover:bg-green-600 shadow-sm shadow-green-200">
                        <Geo3DTruck size={16} /> Place Vehicle
                    </button>
                </div>
            </div>

            {/* Indent Cards (Uber Style) */}
            <div className="space-y-4">
                {ACTIVE_LOADS.map(load => (
                    <div key={load.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        {/* Card Header: Route & Status */}
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-1"> {/* Removed bg-indigo-50 */}
                                    <Geo3DTruck size={28} color="#3B82F6" /> {/* Solid IBM Blue */}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 text-sm">{load.vehicle}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${load.status === 'UNLOADING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {load.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{load.material} • {load.driver}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase font-bold text-slate-400">ETA</div>
                                <div className="text-sm font-bold text-slate-800">{load.eta}</div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between relative pl-4 border-l-2 border-slate-200 ml-2 space-y-4">
                            <div className="mb-4"> {/* Route Fix */}
                                <div className="flex flex-col gap-4">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-400 border-2 border-white"></div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">{load.route.split(' → ')[0]}</p>
                                        <p className="text-[10px] text-slate-400">Gate Out: 2h ago</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white animate-pulse"></div>
                                        <p className="text-xs font-bold text-slate-900 uppercase">{load.route.split(' → ')[1]}</p>
                                        <p className="text-[10px] text-green-600 font-bold">● Live Tracking</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Call Driver">
                                    <Phone size={16} />
                                </button>
                                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Share Status">
                                    <Share2 size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                    <Geo3DDocument size={18} color="#00C805" /> {/* Green/White Document */}
                                    E-Way Bill
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                    <Geo3DMapPin size={18} color="#DC2626" /> {/* Red Pin */}
                                    Track
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center py-6">
                <p className="text-xs text-slate-400">Showing 3 active loads out of 12 total this month</p>
            </div>
        </div>
    );
};
