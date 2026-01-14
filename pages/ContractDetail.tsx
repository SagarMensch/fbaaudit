import React, { useState } from 'react';
import { Contract } from '../types';
import { DocumentViewer } from '../components/DocumentViewer';

// ============================================
// 3D SOLID GEOMETRIC ICONS - PROFESSIONAL
// Colors: White, Black, IBM Blue (#0F62FE), Robinhood Green (#00C805)
// ============================================

const IBM_BLUE = "#0F62FE";
const GREEN = "#00C805";
const BLACK = "#161616";
const WHITE = "#FFFFFF";

const Geo3DArrowBack = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M15 19l-7-7 7-7" stroke={BLACK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 12h12" stroke={BLACK} strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const Geo3DClock = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Clock Face - Isometric */}
        <ellipse cx="12" cy="12" rx="10" ry="10" fill={IBM_BLUE} />
        <ellipse cx="12" cy="12" rx="8" ry="8" fill={WHITE} />
        <path d="M12 6v6l4 2" stroke={BLACK} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.5" fill={BLACK} />
    </svg>
);

const Geo3DShield = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Shield - Solid Isometric */}
        <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill={GREEN} />
        <path d="M12 2l8 4v6c0 5.55-3.84 10.74-8 12V2z" fill={BLACK} fillOpacity="0.15" />
        <path d="M9 12l2 2 4-4" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Geo3DFuel = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Fuel Pump - Solid Block */}
        <rect x="4" y="6" width="10" height="14" rx="1" fill={IBM_BLUE} />
        <rect x="14" y="6" width="4" height="14" fill={BLACK} fillOpacity="0.2" />
        <rect x="6" y="9" width="6" height="4" fill={WHITE} />
        <path d="M18 8v8a2 2 0 01-2 2" stroke={BLACK} strokeWidth="2" />
        <path d="M18 6l2 2" stroke={BLACK} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const Geo3DTrend = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Trend Arrow */}
        <path d="M4 18l6-6 4 4 6-8" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8h4v4" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Geo3DMapPin = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Location Pin - Solid */}
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={IBM_BLUE} />
        <circle cx="12" cy="9" r="3" fill={WHITE} />
        <ellipse cx="12" cy="22" rx="3" ry="1" fill={BLACK} fillOpacity="0.2" />
    </svg>
);

const Geo3DLayers = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Stacked Layers - Isometric */}
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill={IBM_BLUE} />
        <path d="M2 12l10 5 10-5" stroke={IBM_BLUE} strokeWidth="2" strokeLinecap="round" />
        <path d="M2 17l10 5 10-5" stroke={IBM_BLUE} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const Geo3DDocument = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Document - Solid Block */}
        <path d="M6 2h8l6 6v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill={WHITE} stroke={BLACK} strokeWidth="1.5" />
        <path d="M14 2v6h6" fill={IBM_BLUE} />
        <rect x="8" y="12" width="8" height="2" fill={IBM_BLUE} />
        <rect x="8" y="16" width="6" height="2" fill={BLACK} fillOpacity="0.3" />
    </svg>
);

const Geo3DDownload = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Download Arrow */}
        <path d="M12 4v12" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M7 12l5 5 5-5" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 18h16v2H4z" fill={WHITE} />
    </svg>
);

const Geo3DPrinter = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Printer - Solid Block */}
        <rect x="6" y="2" width="12" height="5" fill={WHITE} stroke={BLACK} strokeWidth="1.5" />
        <rect x="4" y="7" width="16" height="10" rx="1" fill={BLACK} />
        <rect x="6" y="14" width="12" height="8" fill={WHITE} stroke={BLACK} strokeWidth="1.5" />
        <circle cx="16" cy="10" r="1" fill={GREEN} />
    </svg>
);

const Geo3DCheckCircle = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 3D Check Badge */}
        <circle cx="12" cy="12" r="10" fill={GREEN} />
        <path d="M8 12l3 3 5-6" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface ContractDetailProps {
    contract: Contract;
    onBack: () => void;
}

export const ContractDetail: React.FC<ContractDetailProps> = ({ contract, onBack }) => {
    const [showContractDoc, setShowContractDoc] = useState(false);

    // Parse accessorials safely
    const acc = contract.accessorials as any || {};

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden font-['Figtree']">
            {/* ═══════════════════════════════════════════════════════════════
                1. HEADER SECTION - Professional Minimal
            ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white border-b border-black/10 px-8 py-6 flex-shrink-0">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <Geo3DArrowBack size={24} />
                        </button>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-bold text-black tracking-tight">
                                    {contract.vendorName}
                                </h1>
                                <span className="text-lg font-mono text-black/40">/</span>
                                <span className="text-base font-mono text-black/50">{contract.id}</span>
                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${contract.status === 'ACTIVE' ? 'bg-[#00C805] text-white' :
                                    contract.status === 'DRAFT' ? 'bg-black/10 text-black' :
                                        'bg-[#0F62FE] text-white'
                                    }`}>
                                    {contract.status}
                                </span>
                            </div>
                            <p className="text-sm text-black/50 mt-1">
                                <span className="font-semibold text-black/70">{contract.serviceType}</span> Agreement • Valid from {contract.validFrom} to {contract.validTo}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.print()}
                            className="p-2.5 text-black/40 hover:text-black hover:bg-black/5 rounded-lg transition-colors border border-black/10"
                        >
                            <Geo3DPrinter size={18} />
                        </button>
                        <button
                            onClick={() => setShowContractDoc(true)}
                            className="flex items-center px-4 py-2.5 bg-white border border-black/20 text-black font-semibold rounded-lg hover:bg-black/5 transition-all text-sm"
                        >
                            <Geo3DDocument size={18} />
                            <span className="ml-2">View Signed Contract</span>
                        </button>
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = `http://127.0.0.1:8000/api/contracts/${contract.id}/pdf`;
                                link.download = `Contract_${contract.id}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex items-center px-4 py-2.5 bg-[#0F62FE] text-white font-semibold rounded-lg hover:bg-[#0043CE] transition-all text-sm">
                            <Geo3DDownload size={18} />
                            <span className="ml-2">Download PDF</span>
                        </button>
                    </div>
                </div>

                {/* KPI Cards - Clean Grid */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-black/[0.02] p-4 rounded-lg border border-black/10">
                        <div className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-2">Payment Terms</div>
                        <div className="font-bold text-black flex items-center text-lg">
                            <Geo3DClock size={18} />
                            <span className="ml-2">{contract.paymentTerms}</span>
                        </div>
                    </div>
                    <div className="bg-black/[0.02] p-4 rounded-lg border border-black/10">
                        <div className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-2">RCM Status</div>
                        <div className="font-bold text-black flex items-center text-lg">
                            <Geo3DShield size={18} />
                            <span className="ml-2">{(contract as any).isRcmApplicable || (contract as any).is_rcm_applicable ? 'Applicable' : 'Not Applicable'}</span>
                        </div>
                    </div>
                    <div className="bg-black/[0.02] p-4 rounded-lg border border-black/10">
                        <div className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-2">PVC Base</div>
                        <div className="font-bold text-black flex items-center text-lg">
                            <Geo3DFuel size={18} />
                            <span className="ml-2">₹{contract.pvcConfig?.baseDieselPrice || (contract as any).pvc_base_diesel_price || '—'}</span>
                            <span className="text-xs text-black/40 ml-1 font-normal">@ {contract.pvcConfig?.referenceCity || (contract as any).pvc_reference_city || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="bg-black/[0.02] p-4 rounded-lg border border-black/10">
                        <div className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-2">Mileage Benchmark</div>
                        <div className="font-bold text-black flex items-center text-lg">
                            <Geo3DTrend size={18} />
                            <span className="ml-2">{contract.pvcConfig?.mileageBenchmark || (contract as any).pvc_mileage_benchmark || '—'} KMPL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                2. SCROLLABLE CONTENT
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto p-8 bg-black/[0.02]">
                <div className="space-y-6 max-w-7xl mx-auto">

                    {/* Freight Rate Matrix */}
                    <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/10 flex justify-between items-center">
                            <h3 className="font-bold text-black flex items-center text-lg">
                                <Geo3DMapPin size={20} />
                                <span className="ml-3">Freight Rate Matrix</span>
                            </h3>
                            <span className="text-xs font-bold text-black/50 bg-black/5 px-3 py-1.5 rounded">
                                {contract.freightMatrix?.length || 0} Lanes Configured
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-black/[0.03] text-[10px] text-black/50 uppercase font-bold tracking-wider border-b border-black/10">
                                    <tr>
                                        <th className="px-6 py-4">Origin</th>
                                        <th className="px-6 py-4">Destination</th>
                                        <th className="px-6 py-4">Vehicle Type</th>
                                        <th className="px-6 py-4 text-center">Transit Time</th>
                                        <th className="px-6 py-4 text-right">Base Freight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {contract.freightMatrix?.map((rate) => (
                                        <tr key={rate.id} className="hover:bg-[#0F62FE]/5 transition-colors group">
                                            <td className="px-6 py-4 font-semibold text-black">{rate.origin}</td>
                                            <td className="px-6 py-4 font-semibold text-black">{rate.destination}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-[#0F62FE]/10 text-[#0F62FE] px-2.5 py-1 rounded text-xs font-bold">
                                                    {rate.vehicleType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-black/60">{rate.transitTimeHrs || 72} hrs</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-black text-base">
                                                ₹{rate.baseRate?.toLocaleString() || rate.minCharge?.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!contract.freightMatrix || contract.freightMatrix.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-black/30 text-sm">
                                                No lanes configured for this contract.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Accessorials & Terms Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Accessorials */}
                        <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
                            <div className="px-6 py-4 border-b border-black/10">
                                <h3 className="font-bold text-black flex items-center text-lg">
                                    <Geo3DLayers size={20} />
                                    <span className="ml-3">Accessorial Charges</span>
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between items-center p-4 bg-black/[0.02] rounded-lg border border-black/5">
                                    <span className="text-sm font-medium text-black/70">Loading / Unloading</span>
                                    <span className="text-sm font-bold text-[#00C805]">
                                        ₹{acc.loading_charges || 500} each
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/[0.02] rounded-lg border border-black/5">
                                    <span className="text-sm font-medium text-black/70">Detention (Free Time)</span>
                                    <span className="text-sm font-bold text-black">
                                        24h Load / 24h Unload
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/[0.02] rounded-lg border border-black/5">
                                    <span className="text-sm font-medium text-black/70">Detention Rate</span>
                                    <span className="text-sm font-bold text-black">
                                        ₹{acc.detention_per_hour || 1500} / day
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-black/[0.02] rounded-lg border border-black/5">
                                    <span className="text-sm font-medium text-black/70">ODA Surcharge</span>
                                    <span className="text-sm font-bold text-black">
                                        ₹{acc.multi_point_delivery || 2000} (&gt;50km)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Compliance */}
                        <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
                            <div className="px-6 py-4 border-b border-black/10">
                                <h3 className="font-bold text-black flex items-center text-lg">
                                    <Geo3DShield size={20} />
                                    <span className="ml-3">Terms & Compliance</span>
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-black/70">
                                        <span className="font-bold text-black">Governing Law:</span> Indian Contract Act, 1872; Carriage of Goods by Road Act, 2007. Jurisdiction: Delhi High Court
                                    </p>
                                </div>
                                <hr className="border-black/5" />
                                <div>
                                    <p className="text-sm text-black/70">
                                        <span className="font-bold text-black">Payment Terms:</span> Invoice submission by 5th of every month. Standard payment cycle is {contract.paymentTerms}.
                                    </p>
                                </div>
                                <hr className="border-black/5" />
                                <div>
                                    <p className="text-sm text-black/70">
                                        <span className="font-bold text-black">Force Majeure:</span> Carrier is not liable for delays caused by natural disasters, strikes, acts of god, or government actions.
                                    </p>
                                </div>
                                <hr className="border-black/5" />
                                <div className="flex items-center bg-[#00C805]/10 text-[#00C805] p-3 rounded-lg border border-[#00C805]/20">
                                    <Geo3DCheckCircle size={18} />
                                    <span className="text-xs font-bold uppercase ml-2 tracking-wider">Compliance Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTRACT DOCUMENT VIEWER MODAL */}
            {showContractDoc && (
                <DocumentViewer
                    documentName={`Contract - ${contract.id}`}
                    documentType="Logistics Service Agreement"
                    pdfUrl={`http://127.0.0.1:8000/api/contracts/${contract.id}/pdf`}
                    onClose={() => setShowContractDoc(false)}
                />
            )}
        </div>
    );
};
