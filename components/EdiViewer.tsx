import React, { useState, useEffect } from 'react';
import { parseEDI, ParsedEdi, SAMPLE_EDI_210 } from '../utils/ediParser';
import { FileText, ArrowRight, Code, Database, CheckCircle, Play, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface EdiViewerProps {
    onIngest: (parsed: ParsedEdi) => void;
    onClose: () => void;
}

export const EdiViewer: React.FC<EdiViewerProps> = ({ onIngest, onClose }) => {
    const [rawInput, setRawInput] = useState(SAMPLE_EDI_210);
    const [parsed, setParsed] = useState<ParsedEdi | null>(null);
    const [activeTab, setActiveTab] = useState<'raw' | 'tree'>('split');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        handleParse();
    }, []);

    const handleParse = () => {
        try {
            const result = parseEDI(rawInput);
            setParsed(result);
        } catch (e) {
            console.error("EDI Parse Error", e);
        }
    };

    const handleIngest = () => {
        if (!parsed) return;
        setIsProcessing(true);
        setTimeout(() => {
            onIngest(parsed);
            setIsProcessing(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-6xl h-[80vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-scaleIn">

                {/* HEADER */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        <div className="bg-teal-500/20 p-2 rounded-lg border border-teal-500/30">
                            <Code size={20} className="text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">EDI Simulator & Parser</h2>
                            <p className="text-xs text-slate-400">X12 / EDIFACT Real-time Processing Engine</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">Cancel</Button>
                        <Button
                            onClick={handleIngest}
                            variant="primary"
                            icon={Database}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Ingesting...' : 'Ingest to Workflow'}
                        </Button>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT: RAW INPUT */}
                    <div className="w-1/2 flex flex-col border-r border-slate-200">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                <FileText size={14} className="mr-2" /> Raw EDI Stream
                            </span>
                            <button
                                onClick={() => { setRawInput(SAMPLE_EDI_210); handleParse(); }}
                                className="text-xs text-blue-600 hover:underline flex items-center"
                            >
                                <RefreshCw size={12} className="mr-1" /> Reset Sample
                            </button>
                        </div>
                        <textarea
                            className="flex-1 w-full p-4 font-mono text-xs bg-slate-900 text-green-400 resize-none focus:outline-none"
                            value={rawInput}
                            onChange={(e) => { setRawInput(e.target.value); handleParse(); }}
                            spellCheck={false}
                        />
                    </div>

                    {/* RIGHT: PARSED TREE */}
                    <div className="w-1/2 flex flex-col bg-white">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                <Database size={14} className="mr-2" /> Parsed Object Model
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {parsed ? (
                                <div className="space-y-6">

                                    {/* METADATA CARD */}
                                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                                        <h4 className="text-xs font-bold text-teal-800 uppercase mb-3 border-b border-teal-200 pb-2">Extracted Metadata</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-teal-600 text-xs block">Invoice Number</span>
                                                <span className="font-bold text-slate-800">{parsed.metadata.invoiceNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-teal-600 text-xs block">Amount</span>
                                                <span className="font-bold text-slate-800">
                                                    {parsed.metadata.amount?.toLocaleString('en-US', { style: 'currency', currency: parsed.metadata.currency || 'USD' })}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-teal-600 text-xs block">Carrier</span>
                                                <span className="font-bold text-slate-800">{parsed.metadata.carrier}</span>
                                            </div>
                                            <div>
                                                <span className="text-teal-600 text-xs block">Date</span>
                                                <span className="font-bold text-slate-800">{parsed.metadata.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SEGMENT TREE */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Segment Structure</h4>
                                        <div className="space-y-2">
                                            {parsed.segments.map((seg, idx) => (
                                                <div key={idx} className="group flex items-start p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all">
                                                    <div className="w-12 flex-shrink-0 font-mono text-xs font-bold text-purple-600 bg-purple-50 px-1 py-0.5 rounded text-center mr-3">
                                                        {seg.id}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-700 mb-1">{seg.name}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {seg.elements.map((el, i) => (
                                                                <span key={i} className="inline-block bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-200" title={`Element ${i + 1}`}>
                                                                    {el}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                    Parsing...
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
