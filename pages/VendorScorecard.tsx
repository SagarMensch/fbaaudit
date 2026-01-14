import React, { useState } from 'react';
import { scorecardService } from '../services/scorecardService';
import { ChevronDown, AlertTriangle } from 'lucide-react';

// --- 3D SOLID GEOMETRIC ICONS ---

const GeoCube = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" fillOpacity="1" />
        <path d="M2 17l10 5 10-5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <path d="M2 7v10l10 5V12L2 7z" fillOpacity="0.8" />
        <path d="M12 12v10l10-5V7l-10 5z" fillOpacity="0.6" />
        <rect x="10" y="10" width="4" height="4" fill="white" fillOpacity="0.2" transform="rotate(45 12 12)" />
    </svg>
);

const GeoHexagon = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" fillOpacity="0.8" />
        <path d="M12 12l8.5-5M12 12v10M12 12L3.5 7" stroke="white" strokeWidth="1" />
        <path d="M12 2l8.5 5L12 12 3.5 7 12 2z" fillOpacity="1" />
    </svg>
);

const GeoDownload = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" fill="none" />
        <polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="2" fill="none" />
        <line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" />
        <rect x="10" y="3" width="4" height="2" fillOpacity="0.4" />
    </svg>
);

const GeoTarget = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
        <circle cx="12" cy="12" r="7" fillOpacity="0.4" stroke={color} strokeWidth="1" />
        <circle cx="12" cy="12" r="4" fillOpacity="0.8" />
        <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
    </svg>
);

const GeoDiamond = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M12 2L2 12l10 10 10-10L12 2z" fillOpacity="0.3" />
        <path d="M12 6L6 12l6 6 6-6L12 6z" fillOpacity="0.8" />
        <path d="M12 2v20M2 12h20" stroke="white" strokeWidth="0.5" opacity="0.5" />
    </svg>
);

const GeoTrendDown = ({ className, color = "currentColor", size = 24 }: { className?: string, color?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" className={className} fill={color} width={size} height={size}>
        <path d="M23 18l-9.5-9.5-5 5L1 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="17 18 23 18 23 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="21" y="16" width="4" height="4" fill={color} fillOpacity="0.2" />
    </svg>
);

export const VendorScorecard: React.FC = () => {
    const [selectedVendor, setSelectedVendor] = useState('V-ROYAL');

    const scorecard = scorecardService.calculateScore(selectedVendor, '2025-04');
    const incidents = scorecardService.getIncidents(selectedVendor);

    const handleDownloadBrief = () => {
        alert("Downloading 'Negotiation_Brief_Royal_Transporters.pdf'...");
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto">
            {/* HEADER */}
            <div className="bg-white border-b-2 border-black px-6 py-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-sm font-bold tracking-widest uppercase">VENDOR PERFORMANCE SCORECARD</h1>
                        <p className="text-xs text-gray-600 mt-1">Performance Analytics & Contract Renewal Intelligence</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <select
                                className="appearance-none bg-white border-2 border-black px-4 py-2 pr-10 text-xs font-bold focus:outline-none"
                                value={selectedVendor}
                                onChange={e => setSelectedVendor(e.target.value)}
                            >
                                <option value="V-ROYAL">Royal Transporters (Negotiation Mode)</option>
                                <option value="V-TCI">TCI Express (Top Performer)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-black pointer-events-none" />
                        </div>
                        <button
                            onClick={handleDownloadBrief}
                            className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 text-xs flex items-center"
                        >
                            <GeoDownload className="h-4 w-4 mr-2" />
                            BRIEF
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT: SCORECARD */}
                    <div className="lg:col-span-2 bg-white border-2 border-black">
                        {/* Vendor Header */}
                        <div className="bg-black px-6 py-3 flex justify-between items-center">
                            <h2 className="text-white font-bold text-sm tracking-wider uppercase">{scorecard.vendorName}</h2>
                            <span className={`px-3 py-1 font-bold text-xs ${scorecard.overallScore < 75 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                                {scorecard.overallScore < 75 ? 'AT RISK' : 'PREFERRED'}
                            </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="p-6 grid grid-cols-4 gap-6 border-b-2 border-gray-300">
                            {/* Overall Score */}
                            <div className="text-center">
                                <div className={`text-5xl font-black mb-2 font-mono ${scorecard.overallScore < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                    {scorecard.overallScore}
                                </div>
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">OVERALL SCORE</p>
                                <div className="mt-3 flex items-center justify-center text-xs text-red-600 font-bold bg-white border-2 border-red-600 py-1">
                                    <GeoTrendDown size={14} className="mr-1" /> DOWN 12% vs Q1
                                </div>
                            </div>

                            {/* Placement - Geometric Cube */}
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 text-blue-600">
                                    <GeoCube className="w-full h-full" />
                                </div>
                                <div className="text-3xl font-bold text-black font-mono">{scorecard.placementScore}%</div>
                                <p className="text-xs text-gray-600 font-bold uppercase mt-1">Placement</p>
                                <p className="text-xs text-gray-500 mt-1">{scorecard.placementFailures} Failures</p>
                            </div>

                            {/* TAT - Geometric Target */}
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 text-orange-600">
                                    <GeoTarget className="w-full h-full" />
                                </div>
                                <div className="text-3xl font-bold text-black font-mono">{scorecard.speedScore}%</div>
                                <p className="text-xs text-gray-600 font-bold uppercase mt-1">TAT Adherence</p>
                                <p className="text-xs text-gray-500 mt-1">20 Delays</p>
                            </div>

                            {/* POD - Geometric Hexagon */}
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-3 text-purple-600">
                                    <GeoHexagon className="w-full h-full" />
                                </div>
                                <div className="text-3xl font-bold text-black font-mono">{scorecard.docScore}%</div>
                                <p className="text-xs text-gray-600 font-bold uppercase mt-1">POD Submission</p>
                                <p className="text-xs text-gray-500 mt-1">Avg 18 Days</p>
                            </div>
                        </div>

                        {/* Cost of Failure */}
                        <div className="bg-white border-l-4 border-red-600 p-4 m-6 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-12 h-12 mr-4 text-red-600">
                                    <GeoDiamond className="w-full h-full" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-600 text-sm">COST OF FAILURE IMPACT</h4>
                                    <p className="text-xs text-gray-600 mt-1">Excess spot premiums & detention charges incurred</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-red-600 font-mono">₹{(scorecard.costOfFailure || 0).toLocaleString()}</div>
                                <p className="text-xs text-gray-600 font-bold mt-1">Q1 2025</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: RANKINGS */}
                    <div className="bg-white border-2 border-black">
                        <div className="bg-gray-600 px-6 py-3 border-b-2 border-black">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white">MONTHLY RANKINGS</h3>
                        </div>
                        <div className="p-6">
                            {/* Leaders */}
                            <div className="mb-6">
                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3 border-b-2 border-gray-300 pb-2">LEADERS</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span className="text-sm font-bold text-black mr-3 w-6">1.</span>
                                            <span className="text-sm text-gray-700">TCI Express</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-20 bg-gray-300 h-2 mr-3">
                                                <div className="bg-green-600 h-2" style={{ width: '98%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold font-mono text-green-600 w-8 text-right">98</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span className="text-sm font-bold text-black mr-3 w-6">2.</span>
                                            <span className="text-sm text-gray-700">Blue Dart</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-20 bg-gray-300 h-2 mr-3">
                                                <div className="bg-green-600 h-2" style={{ width: '96%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold font-mono text-green-600 w-8 text-right">96</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Laggards */}
                            <div>
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 border-b-2 border-gray-300 pb-2">LAGGARDS</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span className="text-sm font-bold text-black mr-3 w-6">18.</span>
                                            <span className="text-sm text-gray-700">Royal Transporters</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-20 bg-gray-300 h-2 mr-3">
                                                <div className="bg-red-600 h-2" style={{ width: '62%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold font-mono text-red-600 w-8 text-right">62</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <span className="text-sm font-bold text-black mr-3 w-6">19.</span>
                                            <span className="text-sm text-gray-700">Laxmi Transport</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-20 bg-gray-300 h-2 mr-3">
                                                <div className="bg-red-600 h-2" style={{ width: '52%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold font-mono text-red-600 w-8 text-right">52</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INCIDENT LOG */}
                <div className="mt-6 bg-white border-2 border-black">
                    <div className="bg-gray-600 px-6 py-3 border-b-2 border-black flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">CRITICAL INCIDENT LOG (Q1 2025)</h3>
                        <button
                            onClick={handleDownloadBrief}
                            className="text-xs text-white hover:underline font-bold"
                        >
                            Download Negotiation Brief
                        </button>
                    </div>
                    <table className="w-full">
                        <thead className="bg-white border-b-2 border-gray-300">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">DATE</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">TYPE</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">REMARKS</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">LOSS IMPACT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {incidents.map((inc, idx) => (
                                <tr key={idx} className="hover:bg-gray-200">
                                    <td className="px-6 py-3 text-sm font-mono text-black">{inc.date}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-3 py-1 text-xs font-bold ${inc.type === 'PLACEMENT_FAILURE' ? 'bg-red-600 text-white' :
                                            inc.type === 'TRANSIT_DELAY' ? 'bg-orange-600 text-white' :
                                                'bg-purple-600 text-white'
                                            }`}>
                                            {inc.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-700">{inc.remarks}</td>
                                    <td className="px-6 py-3 text-right text-sm font-bold font-mono text-red-600">₹{(inc.costImpact || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
