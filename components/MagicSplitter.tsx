import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Scissors, Trash2 } from 'lucide-react';

// 3D Icons (Inline for self-containment if needed)
const IconBundle3D = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#000" />
        <rect x="4" y="6" width="16" height="12" fill="white" />
        <rect x="6" y="8" width="12" height="2" fill="#E5E7EB" />
        <rect x="6" y="12" width="12" height="2" fill="#E5E7EB" />
        <rect x="6" y="16" width="8" height="2" fill="#E5E7EB" />
    </svg>
);

const IconSlot3D = ({ active = false, completed = false, size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4z" fill={active ? "#E6FFFA" : completed ? "#F0FFF4" : "#F8FAFC"} stroke={active ? "#0066FF" : completed ? "#00C805" : "#CBD5E1"} strokeWidth="2" strokeDasharray={active ? "4 4" : "0"} />
        {completed && <circle cx="12" cy="12" r="6" fill="#00C805" />}
        {completed && <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" />}
    </svg>
);

interface DocumentRequirement {
    type: string;
    name: string;
    mandatory: boolean;
    description: string;
}

interface PageThumbnail {
    page_number: number;
    image_url: string;
}

export const MagicSplitter: React.FC<{ shipmentId?: string }> = ({ shipmentId = "SHIP-1001" }) => {
    // Stages: 'upload' -> 'split' -> 'processing' -> 'success'
    const [stage, setStage] = useState<'upload' | 'split' | 'processing' | 'success'>('upload');
    const [bundleId, setBundleId] = useState<string | null>(null);
    const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
    const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
    const [assignments, setAssignments] = useState<Record<string, number[]>>({});
    const [draggedPage, setDraggedPage] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load requirements on mount
    React.useEffect(() => {
        fetchRequirements();
    }, []);

    const fetchRequirements = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/checklist/requirements/${shipmentId}`);
            const data = await res.json();
            if (data.requirements) {
                setRequirements(data.requirements);
            }
        } catch (err) {
            console.error("Failed to fetch requirements", err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setStage('processing'); // processing upload
            const res = await fetch('http://localhost:5000/api/checklist/upload-bundle', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setBundleId(data.bundle_id);
                setThumbnails(data.thumbnails);
                setStage('split');
            } else {
                setError(data.error || "Upload failed");
                setStage('upload');
            }
        } catch (err) {
            setError("Upload error");
            setStage('upload');
        }
    };

    const handleDragStart = (pageNumber: number) => {
        setDraggedPage(pageNumber);
    };

    const handleDrop = (docType: string) => {
        if (draggedPage === null) return;

        setAssignments(prev => {
            const current = prev[docType] || [];
            if (current.includes(draggedPage)) return prev;

            // Remove page from other slots to prevent duplicates (if logic implies 1 page = 1 doc, usually yes)
            // But sometimes 1 page can be irrelevant. For now, allow 1 page -> 1 slot only.
            const newAssignments = { ...prev };
            Object.keys(newAssignments).forEach(type => {
                newAssignments[type] = newAssignments[type].filter(p => p !== draggedPage);
            });

            return {
                ...newAssignments,
                [docType]: [...(newAssignments[docType] || []), draggedPage].sort((a, b) => a - b)
            };
        });
        setDraggedPage(null);
    };

    const handleRemovePage = (docType: string, pageNum: number) => {
        setAssignments(prev => ({
            ...prev,
            [docType]: prev[docType].filter(p => p !== pageNum)
        }));
    };

    const handleSubmitSplit = async () => {
        // Validate mandatory docs
        const missing = requirements.filter(req => req.mandatory && (!assignments[req.type] || assignments[req.type].length === 0));
        if (missing.length > 0) {
            alert(`Missing mandatory documents: ${missing.map(m => m.name).join(', ')}`);
            return;
        }

        try {
            setStage('processing');
            const res = await fetch('http://localhost:5000/api/checklist/split', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bundle_id: bundleId,
                    split_map: assignments
                })
            });
            const data = await res.json();

            if (data.success) {
                setStage('success');
            } else {
                setError(data.error);
                setStage('split');
            }
        } catch (err) {
            setError("Splitting error");
            setStage('split');
        }
    };

    // --- RENDER HELPERS ---

    const isPageAssigned = (pageNum: number) => {
        return Object.values(assignments).some(pages => pages.includes(pageNum));
    };

    return (
        <div className="bg-white min-h-[600px] border-2 border-black font-sans relative">
            {/* Header */}
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                        <Scissors size={20} className="text-[#0066FF]" />
                        Magic Splitter
                    </h2>
                    <p className="text-xs text-white/60">Upload Bundle • Drag Pages • Auto-Generate Documents</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-[#00C805]">
                        AI Powered
                    </p>
                </div>
            </div>

            {/* Stages */}
            <div className="p-6">

                {stage === 'upload' && (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="text-center">
                            <IconBundle3D size={64} />
                            <h3 className="mt-4 text-xl font-bold text-slate-800">Upload Full Scan Bundle</h3>
                            <p className="text-sm text-slate-500 mt-2">Drop your single PDF containing Invoice, LR, Weight Slip...</p>
                            <button className="mt-6 px-6 py-3 bg-black text-white font-bold uppercase text-sm tracking-wider">
                                Select PDF
                            </button>
                        </div>
                    </div>
                )}

                {stage === 'processing' && (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="w-16 h-16 border-4 border-black border-t-[#0066FF] rounded-full animate-spin"></div>
                        <p className="mt-4 font-bold text-slate-800 uppercase tracking-wide">Processing Document...</p>
                    </div>
                )}

                {stage === 'split' && (
                    <div className="grid grid-cols-12 gap-6 h-[600px]">
                        {/* LEFT: PAGES GRID */}
                        <div className="col-span-8 bg-gray-50 p-4 border border-gray-200 rounded-lg overflow-y-auto">
                            <h3 className="font-bold text-slate-800 uppercase text-xs mb-4 flex items-center gap-2">
                                <FileText size={16} /> Pages in Bundle ({thumbnails.length})
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {thumbnails.map((page) => (
                                    <div
                                        key={page.page_number}
                                        draggable
                                        onDragStart={() => handleDragStart(page.page_number)}
                                        className={`relative aspect-[3/4] bg-white border-2 cursor-grab active:cursor-grabbing transition-all hover:scale-105 shadow-sm ${isPageAssigned(page.page_number) ? 'opacity-40 border-gray-300' : 'border-black hover:border-[#0066FF]'
                                            }`}
                                    >
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                            {/* Simulated Thumbnail Image */}
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 overflow-hidden">
                                                <img src={page.image_url} alt="" className="w-full h-full object-cover opacity-50" />
                                            </div>
                                            <span className="absolute bottom-2 right-2 bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                                                {page.page_number}
                                            </span>
                                            {isPageAssigned(page.page_number) && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                    <Check size={32} className="text-[#00C805]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: DOCUMENT SLOTS */}
                        <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
                            <h3 className="font-bold text-slate-800 uppercase text-xs mb-0 flex items-center gap-2">
                                <AlertCircle size={16} /> Required Documents
                            </h3>
                            {requirements.map((req) => (
                                <div
                                    key={req.type}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(req.type)}
                                    className={`bg-white border-2 p-4 transition-all relative min-h-[120px] flex flex-col ${assignments[req.type]?.length > 0
                                        ? 'border-[#00C805]'
                                        : req.mandatory ? 'border-amber-400 border-dashed' : 'border-gray-300 border-dashed'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{req.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                                {req.mandatory ? 'Mandatory' : 'Optional'}
                                            </p>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${assignments[req.type]?.length > 0 ? 'bg-[#00C805]' : 'bg-gray-200'}`} />
                                    </div>

                                    {/* Dropped Pages List */}
                                    <div className="flex-1 flex flex-wrap gap-2 content-start mt-2">
                                        {assignments[req.type]?.length > 0 ? (
                                            assignments[req.type].sort((a, b) => a - b).map(pNum => (
                                                <div key={pNum} className="bg-gray-100 border border-black px-2 py-1 flex items-center gap-2 group">
                                                    <span className="text-xs font-bold">Pg {pNum}</span>
                                                    <button onClick={() => handleRemovePage(req.type, pNum)} className="text-red-500 opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 italic">
                                                Drag pages here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={handleSubmitSplit}
                                className="mt-auto py-4 bg-black text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                            >
                                <Scissors size={18} /> Process & Split
                            </button>
                        </div>
                    </div>
                )}

                {stage === 'success' && (
                    <div className="h-96 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-[#00C805] text-white rounded-full flex items-center justify-center mb-6 shadow-xl">
                            <Check size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">Documents Created!</h3>
                        <p className="text-slate-500 mb-8">The bundle has been successfully split and assigned.</p>

                        <div className="flex gap-4">
                            {requirements.filter(r => assignments[r.type]?.length > 0).map(req => (
                                <a
                                    key={req.type}
                                    href="#" // Link to view file
                                    className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_black] hover:translate-y-1 hover:shadow-none transition-all"
                                >
                                    <p className="text-[10px] uppercase font-bold text-gray-400">{req.name}</p>
                                    <p className="font-bold text-lg text-slate-900">
                                        {assignments[req.type].length} Page{assignments[req.type].length > 1 ? 's' : ''}
                                    </p>
                                </a>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setAssets({});
                                setStage('upload');
                            }}
                            className="mt-12 text-sm font-bold underline"
                        >
                            Upload Another Bundle
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </div>
        </div>
    );

    function setAssets(obj: any) {
        setAssignments({});
        setThumbnails([]);
        setBundleId(null);
    }
};
