import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contractService';
import { Contract, VehicleType } from '../types';
import { ContractDetail } from './ContractDetail';
import { crossLinkService } from '../services/crossLinkService';

// --- 3D SOLID GEOMETRIC ICONS ---

const GeoContract = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fillOpacity="0.2" />
        <path d="M14 2v6h6" fillOpacity="0.4" />
        <rect x="7" y="10" width="10" height="2" rx="1" fillOpacity="0.8" />
        <rect x="7" y="14" width="8" height="2" rx="1" fillOpacity="0.8" />
        <path d="M19 21H5v-2h14v2z" fillOpacity="1" />
    </svg>
);

const GeoFuel = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M3 22v-8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v8" fillOpacity="0.2" />
        <path d="M7 12V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5" fillOpacity="0.4" />
        <path d="M3 22h14v-4H3v4z" fillOpacity="0.8" />
        <rect x="5" y="14" width="10" height="4" rx="1" fillOpacity="0.6" />
        <path d="M19 5l2 2-2 2" stroke={color} strokeWidth="2" fill="none" />
    </svg>
);

const GeoAlert = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fillOpacity="0.4" />
        <path d="M12 9v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.5" fill="white" />
    </svg>
);

const GeoBuilding = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M3 21h18v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8z" fillOpacity="0.2" />
        <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" fillOpacity="0.4" />
        <rect x="8" y="9" width="3" height="3" fillOpacity="0.8" />
        <rect x="13" y="9" width="3" height="3" fillOpacity="0.8" />
        <rect x="8" y="14" width="3" height="3" fillOpacity="0.8" />
        <rect x="13" y="14" width="3" height="3" fillOpacity="0.8" />
    </svg>
);

const GeoCalculator = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <rect x="4" y="2" width="16" height="20" rx="2" fillOpacity="0.2" />
        <rect x="6" y="5" width="12" height="4" rx="1" fillOpacity="0.8" />
        <circle cx="8" cy="14" r="1.5" fillOpacity="0.6" />
        <circle cx="12" cy="14" r="1.5" fillOpacity="0.6" />
        <circle cx="16" cy="14" r="1.5" fillOpacity="0.6" />
        <circle cx="8" cy="18" r="1.5" fillOpacity="0.6" />
        <circle cx="12" cy="18" r="1.5" fillOpacity="0.6" />
        <circle cx="16" cy="18" r="1.5" fillOpacity="0.6" />
    </svg>
);

const GeoSearch = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <circle cx="11" cy="11" r="7" fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const GeoFilter = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fillOpacity="0.6" />
    </svg>
);

const GeoDownload = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" fill="none" />
        <path d="M7 10l5 5 5-5" stroke={color} strokeWidth="2" fill="none" />
        <path d="M12 15V3" stroke={color} strokeWidth="2" />
        <rect x="10" y="3" width="4" height="6" fillOpacity="0.3" />
    </svg>
);

const GeoPlus = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <rect x="11" y="5" width="2" height="14" rx="1" />
        <rect x="5" y="11" width="14" height="2" rx="1" />
    </svg>
);

const GeoSave = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fillOpacity="0.2" />
        <path d="M17 21v-8H7v8" fillOpacity="0.4" />
        <path d="M7 3v5h8" fillOpacity="0.4" />
    </svg>
);

const GeoCross = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const GeoChevron = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
);

const GeoCheck = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
        <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" fill="none" />
    </svg>
);

const GeoMenu = ({ size = 24, className = "", color = "currentColor" }: { size?: number, className?: string, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <circle cx="12" cy="12" r="2" fillOpacity="0.8" />
        <circle cx="19" cy="12" r="2" fillOpacity="0.8" />
        <circle cx="5" cy="12" r="2" fillOpacity="0.8" />
    </svg>
);


export const ContractManager: React.FC = () => {
    // --- STATE ---
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    // Simulator State
    const [simContractId, setSimContractId] = useState('');
    const [simOrigin, setSimOrigin] = useState('Mumbai');
    const [simDest, setSimDest] = useState('Delhi');
    const [simVehicle, setSimVehicle] = useState<VehicleType>('32ft MXL');
    const [simDiesel, setSimDiesel] = useState(92);
    const [simDist, setSimDist] = useState(1400);
    const [simResult, setSimResult] = useState<any>(null);

    // New Contract Form State
    const [newContract, setNewContract] = useState<Partial<Contract>>({
        vendorName: '',
        serviceType: 'FTL',
        paymentTerms: 'Net 45',
        pvcConfig: { baseDieselPrice: 90, mileageBenchmark: 4, referenceCity: 'Mumbai' },
        freightMatrix: [] // NOW EDITABLE
    });

    // Matrix Editor State
    const [matrixRow, setMatrixRow] = useState({ origin: '', destination: '', vehicle: '32ft MXL', rate: 0, transitTime: 3 });

    // --- EFFECTS ---
    useEffect(() => {
        const data = contractService.getAll();
        setContracts(data);
        if (data.length > 0) setSimContractId(data[0].id);
    }, []);

    // --- HANDLERS ---
    const handleAddMatrixRow = () => {
        if (!matrixRow.origin || !matrixRow.destination || matrixRow.rate <= 0) return;
        const newRow = {
            id: Date.now().toString(),
            origin: matrixRow.origin,
            destination: matrixRow.destination,
            vehicleType: matrixRow.vehicle as any,
            baseFreight: matrixRow.rate,
            transitTimeDays: matrixRow.transitTime
        };
        setNewContract(prev => ({
            ...prev,
            freightMatrix: [...(prev.freightMatrix || []), newRow]
        }));
        setMatrixRow({ ...matrixRow, origin: '', destination: '', rate: 0 }); // Reset input
    };

    const handleSimulate = () => {
        // 1. CHECK IF MATCHING CONTRACT EXISTS IN MATRIX
        const contract = contracts.find(c => c.id === simContractId);
        let matrixRate = null;

        if (contract && contract.freightMatrix) {
            const row = contract.freightMatrix.find(r =>
                r.origin.toLowerCase() === simOrigin.toLowerCase() &&
                r.destination.toLowerCase() === simDest.toLowerCase()
            );
            if (row) {
                matrixRate = row.baseFreight;
            }
        }

        const result = contractService.calculateFreight({
            contractId: simContractId,
            origin: simOrigin,
            destination: simDest,
            vehicleType: simVehicle,
            currentDieselPrice: simDiesel,
            distanceKm: simDist,
            weight: 15000, // default for FTL
            overrideBaseFreight: matrixRate // PASS REAL MATRIX RATE
        });
        setSimResult(result);
    };

    const handleCreateContract = () => {
        const id = `CON-2025-${String(contracts.length + 1).padStart(3, '0')}`;
        const newRecord: Contract = {
            id,
            vendorId: `V-${Date.now()}`,
            vendorName: newContract.vendorName || 'New Vendor',
            serviceType: newContract.serviceType as any,
            validFrom: new Date().toISOString().split('T')[0],
            validTo: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // +1 Year
            paymentTerms: newContract.paymentTerms as any,
            isRCMApplicable: true,
            status: 'DRAFT',
            freightMatrix: newContract.freightMatrix || [],
            pvcConfig: newContract.pvcConfig as any,
            accessorials: {
                loadingUnloading: { isIncluded: true },
                detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 1500, excludeHolidays: true },
                oda: { distanceThreshold: 50, surcharge: 2000 },
                tolls: { isInclusive: false }
            }
        };
        contractService.add(newRecord);
        setContracts(contractService.getAll()); // Refresh
        setIsCreateModalOpen(false);
    };

    const handleExportCSV = () => {
        const headers = ['Contract ID', 'Vendor', 'Service Type', 'Valid From', 'Valid To', 'Status'];
        const rows = contracts.map(c => [c.id, c.vendorName, c.serviceType, c.validFrom, c.validTo, c.status]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "contracts_master.csv");
        document.body.appendChild(link);
        link.click();
    };

    // --- FILTERING ---
    const filteredContracts = contracts.filter(c =>
        c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If viewing detail, render ContractDetail component
    if (selectedContract) {
        return <ContractDetail contract={selectedContract} onBack={() => setSelectedContract(null)} />;
    }

    return (
        <div className="h-full flex flex-col font-sans bg-[#F4F7FE] overflow-hidden relative">

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-black px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Create New Contract</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white"><GeoCross size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vendor Name</label>
                                <input
                                    autoFocus
                                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#00C805] outline-none"
                                    placeholder="e.g. DHL Supply Chain"
                                    value={newContract.vendorName}
                                    onChange={e => setNewContract({ ...newContract, vendorName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#00C805] outline-none"
                                        value={newContract.serviceType}
                                        onChange={e => setNewContract({ ...newContract, serviceType: e.target.value as any })}
                                    >
                                        <option value="FTL">FTL (Full Truck)</option>
                                        <option value="LTL">LTL (Part Load)</option>
                                        <option value="Express">Express</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Terms</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#00C805] outline-none"
                                        value={newContract.paymentTerms}
                                        onChange={e => setNewContract({ ...newContract, paymentTerms: e.target.value as any })}
                                    >
                                        <option>Net 30</option>
                                        <option>Net 45</option>
                                        <option>Net 60</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="border-gray-100" />
                            <h4 className="text-sm font-bold text-black">PVC Defaults</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Diesel (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#00C805] outline-none"
                                        value={newContract.pvcConfig?.baseDieselPrice}
                                        onChange={e => setNewContract({ ...newContract, pvcConfig: { ...newContract.pvcConfig!, baseDieselPrice: Number(e.target.value) } })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Benchmark (KMPL)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-[#00C805] outline-none"
                                        value={newContract.pvcConfig?.mileageBenchmark}
                                        onChange={e => setNewContract({ ...newContract, pvcConfig: { ...newContract.pvcConfig!, mileageBenchmark: Number(e.target.value) } })}
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-100" />
                            <h4 className="text-sm font-bold text-black">Rate Matrix (O-D Pairs)</h4>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                    <input placeholder="Origin" className="border p-1.5 text-xs rounded" value={matrixRow.origin} onChange={e => setMatrixRow({ ...matrixRow, origin: e.target.value })} />
                                    <input placeholder="Dest" className="border p-1.5 text-xs rounded" value={matrixRow.destination} onChange={e => setMatrixRow({ ...matrixRow, destination: e.target.value })} />
                                    <select className="border p-1.5 text-xs rounded" value={matrixRow.vehicle} onChange={e => setMatrixRow({ ...matrixRow, vehicle: e.target.value })}>
                                        <option>32ft MXL</option><option>32ft SXL</option><option>10-Tyre</option>
                                    </select>
                                    <input type="number" placeholder="Rate (₹)" className="border p-1.5 text-xs rounded" value={matrixRow.rate} onChange={e => setMatrixRow({ ...matrixRow, rate: Number(e.target.value) })} />
                                    <button onClick={handleAddMatrixRow} className="bg-[#00C805] text-white rounded text-xs font-bold hover:bg-blue-700">Add</button>
                                </div>

                                <div className="max-h-32 overflow-y-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="text-gray-500 font-bold border-b border-gray-200">
                                            <tr><th className="py-1">Route</th><th className="py-1">Type</th><th className="py-1 text-right">Base Rate</th></tr>
                                        </thead>
                                        <tbody>
                                            {newContract.freightMatrix?.map((row: any) => (
                                                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-1">{row.origin} - {row.destination}</td>
                                                    <td className="py-1">{row.vehicleType}</td>
                                                    <td className="py-1 text-right font-mono font-bold">₹{row.baseFreight.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {(!newContract.freightMatrix || newContract.freightMatrix.length === 0) && (
                                                <tr><td colSpan={3} className="text-center py-2 text-gray-400">No lanes added.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateContract}
                                className="w-full bg-[#00C805] text-white font-bold py-3 rounded shadow hover:bg-blue-700 transition flex items-center justify-center mt-4"
                            >
                                <GeoSave size={18} className="mr-2" /> Save Contract Header
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Header Section */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Logistics Procurement</h2>
                        <h1 className="text-3xl font-extrabold text-black tracking-tight">Contract Master</h1>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 text-sm shadow-sm transition-all"
                        >
                            <GeoDownload size={18} className="mr-2 text-gray-500" /> Export Template
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center px-5 py-2.5 bg-[#00C805] text-white font-bold rounded-sm hover:bg-[#00a604] text-sm shadow-md transition-all"
                        >
                            <GeoPlus size={18} className="mr-2" /> Create Contract
                        </button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="mt-8 grid grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="z-10">
                            <p className="text-sm font-medium text-gray-500">Active Agreements</p>
                            <h3 className="text-3xl font-bold text-black mt-2">{contracts.filter(c => c.status === 'ACTIVE').length}</h3>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-[#00C805]"></div>
                        <div className="absolute -right-6 -bottom-6 text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity">
                            <GeoContract size={100} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="z-10">
                            <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                            <h3 className="text-3xl font-bold text-red-600 mt-2">1</h3>
                            <p className="text-xs text-red-500 font-medium mt-1 flex items-center"><GeoAlert size={12} className="mr-1" /> Action Required</p>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
                        <div className="absolute -right-6 -bottom-6 text-red-50 opacity-10 group-hover:opacity-20 transition-opacity">
                            <GeoAlert size={100} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="z-10">
                            <p className="text-sm font-medium text-gray-500">Drafts / Pending</p>
                            <h3 className="text-3xl font-bold text-[#E56910] mt-2">{contracts.filter(c => c.status !== 'ACTIVE').length}</h3>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-[#E56910]"></div>
                        <div className="absolute -right-6 -bottom-6 text-[#E56910] opacity-10 group-hover:opacity-20 transition-opacity">
                            <GeoFuel size={100} />
                        </div>
                    </div>

                    <div className="bg-[#0052FF] p-5 rounded-xl border border-gray-800 shadow-md flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="z-10">
                            <p className="text-sm font-medium text-white">National Diesel (Ref)</p>
                            <h3 className="text-3xl font-bold text-white mt-2">₹91.25</h3>
                            <p className="text-xs text-green-400 font-medium mt-1">+1.2% vs Last Month</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 text-blue-900 opacity-20">
                            <GeoFuel size={80} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">

                <div className="grid grid-cols-12 gap-8">
                    {/* LEFT PANEL: Contracts List */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-black text-base">All Contracts</h3>
                                <div className="flex space-x-2 relative">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg w-48 outline-none focus:border-[#0F62FE]"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                        <GeoSearch size={14} className="absolute left-2.5 top-2 text-gray-400" />
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-[#0F62FE] hover:bg-blue-50 rounded-lg transition-colors"><GeoFilter size={18} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-gray-100 text-xs text-gray-700 uppercase font-bold sticky top-0 border-b-2 border-gray-300">
                                        <tr>
                                            <th className="px-3 py-2 border-r border-gray-200">Contract ID</th>
                                            <th className="px-3 py-2 border-r border-gray-200">Vendor</th>
                                            <th className="px-3 py-2 border-r border-gray-200">Validity</th>
                                            <th className="px-3 py-2 border-r border-gray-200">Routes</th>
                                            <th className="px-3 py-2 border-r border-gray-200 text-right">Spend MTD</th>
                                            <th className="px-3 py-2 border-r border-gray-200 text-right">Utilization</th>
                                            <th className="px-3 py-2 border-r border-gray-200">PVC Base</th>
                                            <th className="px-3 py-2 border-r border-gray-200 text-center">Performance</th>
                                            <th className="px-3 py-2 border-r border-gray-200 text-center">Status</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredContracts.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50 group border-b border-gray-200">
                                                <td className="px-3 py-2 border-r border-gray-200">
                                                    <div className="font-mono text-[#0F62FE] font-bold text-xs">{c.id}</div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `/suppliers?vendor=${c.vendorId}`;
                                                        }}
                                                        className="font-bold text-gray-900 text-xs hover:text-blue-600 hover:underline text-left flex items-center gap-1"
                                                    >
                                                        <GeoBuilding size={12} />
                                                        {c.vendorName}
                                                    </button>
                                                    <div className="text-[10px] text-gray-500 mt-0.5">{c.serviceType}</div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200">
                                                    <div className="text-xs text-gray-900">{c.validFrom}</div>
                                                    <div className="text-[10px] text-gray-500">to {c.validTo}</div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `/rates?contract=${c.id}`;
                                                        }}
                                                        className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        {c.freightMatrix.length}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 text-right">
                                                    <div className="font-mono font-bold text-gray-900">₹{(Math.random() * 500000 + 200000).toFixed(0)}</div>
                                                    <div className="text-[10px] text-gray-500">MTD</div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 text-right">
                                                    <div className="font-mono font-bold text-gray-900">{(Math.random() * 30 + 40).toFixed(1)}%</div>
                                                    <div className="text-[10px] text-gray-500">of target</div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `/master-data?tab=fuel`;
                                                        }}
                                                        className="font-mono font-bold text-orange-600 hover:text-orange-800 hover:underline text-left flex items-center gap-1"
                                                    >
                                                        <GeoFuel size={12} />
                                                        ₹{c.pvcConfig.baseDieselPrice}
                                                    </button>
                                                    <div className="text-[10px] text-gray-500">{c.pvcConfig.referenceCity}</div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 text-center">
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold">A</span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-gray-200 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedContract(c);
                                                        }}
                                                        className="text-gray-400 hover:text-black"
                                                    >
                                                        <GeoMenu size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredContracts.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="text-center py-8 text-gray-400 text-xs">No contracts found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Simulator */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-6">
                            <div className="bg-black px-6 py-5 border-b border-gray-800">
                                <h3 className="text-white font-bold text-lg flex items-center">
                                    <GeoCalculator size={20} className="mr-3 text-[#0F62FE]" />
                                    Rate Simulator
                                </h3>
                                <p className="text-[#A0AEC0] text-xs mt-1">Verify Module 1 Dynamic Pricing Logic</p>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Contract</label>
                                        <div className="relative">
                                            <select
                                                className="w-full text-sm bg-gray-50 border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-[#00C805] appearance-none cursor-pointer font-medium"
                                                value={simContractId}
                                                onChange={(e) => setSimContractId(e.target.value)}
                                            >
                                                {contracts.map(c => <option key={c.id} value={c.id}>{c.vendorName} ({c.id})</option>)}
                                            </select>
                                            <GeoChevron size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Origin</label>
                                            <input
                                                type="text"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#00C805] outline-none"
                                                value={simOrigin}
                                                onChange={(e) => setSimOrigin(e.target.value)}
                                                placeholder="City"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
                                            <input
                                                type="text"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#00C805] outline-none"
                                                value={simDest}
                                                onChange={(e) => setSimDest(e.target.value)}
                                                placeholder="City"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle Type</label>
                                        <div className="relative">
                                            <select
                                                className="w-full text-sm bg-gray-50 border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-[#00C805] appearance-none cursor-pointer"
                                                value={simVehicle}
                                                onChange={(e) => setSimVehicle(e.target.value as VehicleType)}
                                            >
                                                <option>32ft MXL</option>
                                                <option>32ft SXL</option>
                                                <option>10-Tyre</option>
                                            </select>
                                            <GeoChevron size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diesel (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#00C805] outline-none"
                                                value={simDiesel}
                                                onChange={(e) => setSimDiesel(Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dist (Km)</label>
                                            <input
                                                type="number"
                                                className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-2 focus:ring-[#00C805] outline-none"
                                                value={simDist}
                                                onChange={(e) => setSimDist(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSimulate}
                                        className="w-full bg-[#00C805] text-white font-bold py-3 rounded-md shadow-lg hover:bg-[#00a604] transition-all transform active:scale-95"
                                    >
                                        Calculate Rate
                                    </button>
                                </div>

                                {/* Results Area */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[160px] flex flex-col justify-center">
                                    {simResult ? (
                                        simResult.isError ? (
                                            <div className="text-center text-red-600">
                                                <GeoAlert size={24} className="mx-auto mb-2" />
                                                <p className="font-bold text-sm">{simResult.errorMessage}</p>
                                            </div>
                                        ) : (
                                            <div className="animate-fade-in-up">
                                                <div className="flex justify-between items-baseline mb-4 border-b border-gray-200 pb-2">
                                                    <span className="text-gray-500 text-xs font-bold uppercase">Total Cost</span>
                                                    <span className="text-2xl font-extrabold text-black">₹{simResult.totalCost.toLocaleString()}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {simResult.breakdown.map((line: string, idx: number) => (
                                                        <div key={idx} className="text-[11px] flex items-start text-gray-600">
                                                            <div className="w-1.5 h-1.5 bg-[#00C805] rounded-full mr-2 mt-1 flex-shrink-0"></div>
                                                            <span className="font-medium">{line}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Verification Badge */}
                                                {Math.abs(simResult.totalCost - 40700) < 50 && simDiesel === 92 && (
                                                    <div className="mt-4 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded shadow-sm flex items-center justify-center">
                                                        <GeoCheck size={14} className="mr-2" /> Logic Verified
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <GeoCalculator size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">Enter logic parameters to test pricing engine.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
