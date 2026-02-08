import React, { useState } from 'react';
import { ocrService } from '../../services/ocrService';
import { ShipmentUpload } from '../../types';
import { FileText, Eye, AlertTriangle, CheckCircle, Search, UploadCloud, Layers } from 'lucide-react';

export const DocumentAnalysis: React.FC = () => {
    const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'ANALYZING' | 'COMPLETED'>('IDLE');
    const [result, setResult] = useState<ShipmentUpload | null>(null);
    const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);

    // Mock File Scenarios
    const SCENARIOS = [
        { label: 'Clean POD', file: 'clean_pod.pdf' },
        { label: 'Damaged Goods (English)', file: 'damage_report.pdf' },
        { label: 'Late Delivery (Hinglish)', file: 'late_arrival.pdf' }
    ];

    const handleSimulation = async (scenarioFile: string) => {
        setStatus('UPLOADING');
        setResult(null); // Reset

        // 1. Simulate Upload
        setTimeout(async () => {
            setStatus('ANALYZING');

            // 2. Call Service
            const data = await ocrService.processUpload(`UP-${Date.now()}`, scenarioFile);
            setResult(data);
            setStatus('COMPLETED');

        }, 1500);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-gray-50 font-sans">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1B2559] flex items-center">
                    <Eye className="mr-3 text-blue-600" />
                    Intelligent Document Processing (IDP)
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Automatic splitting, classification, and "Babu" handwriting analysis for Indian Logistics documents.
                </p>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 space-x-6 overflow-hidden">

                {/* LEFT: CONTROL PANEL */}
                <div className="w-1/3 space-y-6">
                    {/* Upload Simulation */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
                        <UploadCloud size={48} className="mx-auto text-blue-200 mb-4" />
                        <h3 className="font-bold text-gray-700">Upload Messy Shipment PDF</h3>
                        <p className="text-xs text-gray-400 mb-6">Supports Combined PDF (Inv + POD + Wgt)</p>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Select Test Scenario:</p>
                            {SCENARIOS.map(s => (
                                <button
                                    key={s.label}
                                    onClick={() => handleSimulation(s.file)}
                                    disabled={status !== 'IDLE' && status !== 'COMPLETED'}
                                    className="w-full text-left px-4 py-3 rounded border hover:bg-blue-50 hover:border-blue-300 transition flex justify-between items-center text-sm font-medium text-gray-700"
                                >
                                    <span>{s.label}</span>
                                    {status === 'ANALYZING' && <span className="animate-pulse text-blue-500 text-xs">Processing...</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RESULTS SUMMARY */}
                    {status === 'COMPLETED' && result && (
                        <div className={`p-6 rounded-xl shadow-sm border ${result.overallStatus === 'NEEDS_REVIEW' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-center mb-2">
                                {result.overallStatus === 'NEEDS_REVIEW' ? <AlertTriangle className="text-orange-600 mr-2" /> : <CheckCircle className="text-green-600 mr-2" />}
                                <span className="font-bold text-lg">
                                    {result.overallStatus === 'NEEDS_REVIEW' ? 'Exceptions Found' : 'Clean Processing'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                {result.overallStatus === 'NEEDS_REVIEW'
                                    ? `System detected critical keywords: ${result.flaggedKeywords.join(', ')}`
                                    : "All documents classified and verified. No adverse remarks found."
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT: DOCUMENT VISUALIZER */}
                <div className="flex-1 bg-gray-200 rounded-xl p-4 overflow-y-auto relative">

                    {status === 'IDLE' && (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Layers size={64} className="mx-auto mb-4 opacity-50" />
                                <p>Select a scenario to start the "Babu" Engine</p>
                            </div>
                        </div>
                    )}

                    {status === 'UPLOADING' && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="font-bold text-blue-800">Uploading & Splitting PDF...</p>
                        </div>
                    )}

                    {status === 'ANALYZING' && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="font-bold text-indigo-800">Reading Handwriting (OCR)...</p>
                            <p className="text-xs text-indigo-500 mt-2">Checking for "Damage", "Toota", "Late"...</p>
                        </div>
                    )}

                    {status === 'COMPLETED' && result && (
                        <div className="space-y-4">
                            {result.splitDocuments.map((doc, idx) => (
                                <div key={doc.id} className="bg-white rounded shadow-sm overflow-hidden flex">
                                    {/* Page Preview (Mock) */}
                                    <div className="w-40 bg-gray-800 flex items-center justify-center p-4">
                                        <div className="text-center">
                                            <FileText className="text-white mx-auto mb-2" />
                                            <span className="text-xs text-gray-400 font-mono">Page {doc.pageNumber}</span>
                                        </div>
                                    </div>

                                    {/* Analysis */}
                                    <div className="flex-1 p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">{doc.type}</span>
                                            {doc.status === 'FLAGGED' && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded uppercase flex items-center"><AlertTriangle size={12} className="mr-1" /> Flagged</span>}
                                        </div>

                                        {/* Dynamic Content based on Type */}
                                        {doc.type === 'INVOICE' && (
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><span className="text-gray-500">Number:</span> <b>{doc.docNumber}</b></div>
                                                <div><span className="text-gray-500">Amount:</span> <b>${doc.docAmount?.toLocaleString()}</b></div>
                                            </div>
                                        )}

                                        {doc.type === 'POD' && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Handwriting Analysis (ROI: Bottom 30%)</p>
                                                <div className={`p-3 rounded border text-sm font-mono ${doc.ocrResult?.isClean ? 'bg-gray-50 border-gray-100 text-gray-600' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                                    "{doc.ocrResult?.fullText}"
                                                </div>
                                                {!doc.ocrResult?.isClean && (
                                                    <div className="mt-2 text-xs flex space-x-2">
                                                        <span className="font-bold text-red-600">Detected Triggers:</span>
                                                        {doc.ocrResult?.detectedKeywords.map(k => (
                                                            <span key={k} className="bg-red-200 text-red-900 px-1.5 rounded">{k}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {doc.type === 'WEIGHT_SLIP' && (
                                            <div className="text-sm text-gray-500 italic">Weight verification matched. No anomalies.</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
