import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis } from 'recharts';
import { AlertOctagon, CheckCircle, XCircle, Activity, ArrowRight, ShieldAlert, Download, ExternalLink, Brain, Lightbulb } from 'lucide-react';
import { generateCSVReport } from '../utils/reportGenerator';

import { AnomalyRecord } from '../types';
import { exportToCSV } from '../utils/exportUtils';

// MOCK DATA
const ANOMALIES: AnomalyRecord[] = [
    { id: 'A1', shipmentId: 'SH-2025-001', type: 'FUEL_SURCHARGE', severity: 'HIGH', score: 98, detectedAt: '2025-12-05 09:30', status: 'OPEN', description: 'Fuel surcharge 15% higher than DOE index.', value: 450, expectedValue: 390, carrierName: 'Maersk Line' },
    { id: 'A2', shipmentId: 'SH-2025-042', type: 'WEIGHT_VARIANCE', severity: 'MEDIUM', score: 85, detectedAt: '2025-12-04 14:15', status: 'OPEN', description: 'Billed weight exceeds max container capacity.', value: 28000, expectedValue: 22000, carrierName: 'MSC' },
    { id: 'A3', shipmentId: 'SH-2025-089', type: 'RATE_MISMATCH', severity: 'LOW', score: 65, detectedAt: '2025-12-04 11:00', status: 'RESOLVED', description: 'Minor rate variance within tolerance.', value: 1200, expectedValue: 1180, carrierName: 'Hapag-Lloyd' },
];

// SCATTER PLOT DATA (Simulating Cluster)
const SCATTER_DATA = [
    { x: 100, y: 200, z: 10 }, { x: 120, y: 100, z: 12 },
    { x: 170, y: 300, z: 15 }, { x: 140, y: 250, z: 11 },
    { x: 150, y: 400, z: 13 }, { x: 110, y: 280, z: 14 },
    { x: 450, y: 390, z: 50, isAnomaly: true }, // The Anomaly
];

interface AnomalyDetectionProps {
    onNavigate?: (page: string) => void;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ onNavigate }) => {
    const [anomalies, setAnomalies] = useState<AnomalyRecord[]>(ANOMALIES);
    const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(ANOMALIES[0]);



    // ... (inside component)

    const handleResolution = (id: string, action: 'DISPUTE' | 'FALSE_POSITIVE') => {
        setAnomalies(prev => prev.map(a =>
            a.id === id ? { ...a, status: action === 'DISPUTE' ? 'DISPUTED' : 'RESOLVED' } : a
        ));

        // Update selected anomaly to reflect change immediately
        if (selectedAnomaly?.id === id) {
            setSelectedAnomaly(prev => prev ? { ...prev, status: action === 'DISPUTE' ? 'DISPUTED' : 'RESOLVED' } : null);
        }

        // alert(action === 'DISPUTE' ? "Invoice automatically disputed via EDI 210." : "Anomaly marked as False Positive. Model updated.");
        // Replaced with Toast/Console for now, assuming triggerToast existence or just silent update
        console.log(action === 'DISPUTE' ? "Invoice automatically disputed via EDI 210." : "Anomaly marked as False Positive. Model updated.");
    };

    const handleExportAnomalies = () => {
        const data = ANOMALIES.map(a => ({
            'ID': a.id,
            'Shipment': a.shipmentId,
            'Carrier': a.carrierName || 'N/A',
            'Type': a.type,
            'Severity': a.severity,
            'Score': a.score,
            'Status': a.status,
            'Value': a.value,
            'Expected': a.expectedValue
        }));
        exportToCSV(data, 'Anomaly_Report');
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <AlertOctagon className="mr-3 text-red-600" /> Automated Anomaly Detection (AAD)
                    </h1>
                    <p className="text-slate-500 mt-1">ML-powered fraud detection and cost leakage prevention.</p>
                </div>
                <div className="flex space-x-4">
                    <button onClick={handleExportAnomalies} className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-blue-600 font-bold text-xs flex items-center transition-colors">
                        <Download size={14} className="mr-2" /> Export CSV
                    </button>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Active Anomalies</p>
                        <p className="text-xl font-bold text-red-600">2</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Prevented Leakage</p>
                        <p className="text-xl font-bold text-green-600">$12.4k</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* ANOMALY FEED */}
                <div className="col-span-4 space-y-4">
                    {anomalies.map(anomaly => (
                        <div
                            key={anomaly.id}
                            onClick={() => setSelectedAnomaly(anomaly)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAnomaly?.id === anomaly.id ? 'bg-white border-red-500 shadow-md ring-1 ring-red-100' : 'bg-white border-slate-200 hover:border-red-300'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${anomaly.status === 'DISPUTED' ? 'bg-purple-100 text-purple-700' :
                                    anomaly.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                        anomaly.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {anomaly.status === 'OPEN' ? anomaly.type.replace('_', ' ') : anomaly.status}
                                </span>
                                <span className="text-xs text-slate-400">{anomaly.detectedAt.split(' ')[1]}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 mb-1">{anomaly.shipmentId}</p>
                            <p className="text-xs font-bold text-blue-600 mb-1">{anomaly.carrierName}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{anomaly.description}</p>
                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-600">Confidence Score</span>
                                <div className="flex items-center">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mr-2 overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${anomaly.score}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-red-600">{anomaly.score}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DETAIL & VISUALIZATION */}
                <div className="col-span-8 space-y-6">
                    {selectedAnomaly && (
                        <>
                            {/* Z-SCORE CHART */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center">
                                    <Activity size={16} className="mr-2 text-blue-600" /> Statistical Deviation Analysis (Z-Score)
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" dataKey="x" name="Value" unit="$" />
                                            <YAxis type="number" dataKey="y" name="Expected" unit="$" />
                                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                            <Scatter name="Normal" data={SCATTER_DATA.filter(d => !d.isAnomaly)} fill="#94a3b8" />
                                            <Scatter name="Anomaly" data={SCATTER_DATA.filter(d => d.isAnomaly)} fill="#ef4444" shape="star" />
                                            <ReferenceLine x={selectedAnomaly.expectedValue} stroke="green" strokeDasharray="3 3" label="Expected" />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-xs text-slate-500 mt-4 text-center">
                                    The detected value (<span className="font-bold text-red-600">${selectedAnomaly.value}</span>) is <span className="font-bold">3.2σ</span> away from the mean, indicating a high probability of error.
                                </p>
                            </div>

                            {/* ACTION CARD */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Resolution Workflow</h3>
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">ID: {selectedAnomaly.id}</span>
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleResolution(selectedAnomaly.id, 'DISPUTE')}
                                        disabled={selectedAnomaly.status !== 'OPEN'}
                                        className={`flex-1 py-3 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center transition-colors ${selectedAnomaly.status !== 'OPEN' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                                            }`}
                                    >
                                        <ShieldAlert size={16} className="mr-2" />
                                        {selectedAnomaly.status === 'DISPUTED' ? 'Dispute Sent' : 'Auto-Dispute Invoice'}
                                    </button>
                                    <button
                                        onClick={() => handleResolution(selectedAnomaly.id, 'FALSE_POSITIVE')}
                                        disabled={selectedAnomaly.status !== 'OPEN'}
                                        className={`flex-1 border py-3 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${selectedAnomaly.status !== 'OPEN' ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <CheckCircle size={16} className="mr-2" />
                                        {selectedAnomaly.status === 'RESOLVED' ? 'Marked as Safe' : 'Mark as False Positive'}
                                    </button>
                                </div>
                                {onNavigate && selectedAnomaly.carrierName && (
                                    <button
                                        onClick={() => onNavigate('cps')}
                                        className="w-full mt-4 bg-slate-50 border border-slate-200 text-slate-600 py-2 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center"
                                    >
                                        <ExternalLink size={14} className="mr-2" /> View {selectedAnomaly.carrierName} Scorecard
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
