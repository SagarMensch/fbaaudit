import React, { useState } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { Upload, CheckCircle, AlertTriangle, FileText, Table, ArrowRight, RefreshCw, X, Check } from 'lucide-react';
import { Geo3DDocument, Geo3DCheckCircle, Geo3DAlertTriangle, Geo3DTable, Geo3DUpload, Geo3DRefresh, Geo3DArrowRight, Geo3DX, Geo3DCheck, Geo3DScan } from './components/3DGeometricIcons';

interface BulkInvoiceUploadProps {
    supplier: IndianSupplier;
}

type UploadStep = 'upload' | 'mapping' | 'reconcile' | 'results';

interface UploadedFiles {
    pdf: File | null;
    excel: File | null;
}

interface ColumnMapping {
    [systemField: string]: string;
}

interface ReconciliationResult {
    valid: boolean;
    excel_total: number;
    pdf_total: number;
    difference: number;
}

interface LineItemsSummary {
    total_rows: number;
    valid_rows: number;
    duplicate_rows: number;
    error_rows: number;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export const BulkInvoiceUpload: React.FC<BulkInvoiceUploadProps> = ({ supplier }) => {
    const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
    const [files, setFiles] = useState<UploadedFiles>({ pdf: null, excel: null });
    const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
    const [detectedMapping, setDetectedMapping] = useState<ColumnMapping>({});
    const [excelColumns, setExcelColumns] = useState<string[]>([]);
    const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
    const [lineItemsSummary, setLineItemsSummary] = useState<LineItemsSummary | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const [invoiceId, setInvoiceId] = useState<string>('');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualTotal, setManualTotal] = useState<string>('');
    const [ocrData, setOcrData] = useState<any>(null);
    const [inspectData, setInspectData] = useState<any>(null);
    const [inspecting, setInspecting] = useState(false);
    const [showInspectModal, setShowInspectModal] = useState(false);
    const [activeInspectTab, setActiveInspectTab] = useState<'raw' | 'table' | 'mapping'>('raw');
    const [showExtractionPanel, setShowExtractionPanel] = useState(false);

    // VDU Engine - Confidence & Teach AI States
    const [confidenceData, setConfidenceData] = useState<any>(null);
    const [vduEnabled, setVduEnabled] = useState(false);
    const [showTeachAIModal, setShowTeachAIModal] = useState(false);
    const [teachingAI, setTeachingAI] = useState(false);
    const [correctedData, setCorrectedData] = useState<any>({});
    const [rawText, setRawText] = useState<string>('');
    const [submittingForApproval, setSubmittingForApproval] = useState(false);
    const [submittedToWorkflow, setSubmittedToWorkflow] = useState(false);
    const [workflowInfo, setWorkflowInfo] = useState<any>(null);
    // Document storage paths
    const [documentPaths, setDocumentPaths] = useState<{ pdf_path: string, excel_path: string }>({ pdf_path: '', excel_path: '' });

    // System fields that need mapping
    const systemFields = [
        { key: 'lr_number', label: 'LR Number*', required: true },
        { key: 'origin', label: 'Origin*', required: true },
        { key: 'destination', label: 'Destination*', required: true },
        { key: 'base_freight', label: 'Freight Amount*', required: true },
        { key: 'weight', label: 'Weight (kg)', required: false },
        { key: 'fuel_surcharge', label: 'Fuel Surcharge', required: false },
        { key: 'handling_charges', label: 'Handling Charges', required: false },
    ];

    const handleFileSelect = (type: 'pdf' | 'excel', file: File | null) => {
        setFiles(prev => ({ ...prev, [type]: file }));
        setError('');
        // Reset inspection data when file changes
        setInspectData(null);
    };

    const handleInspect = async (type: 'pdf' | 'excel') => {
        const file = files[type];
        if (!file) return;

        setInspecting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            if (type === 'excel') {
                formData.append('vendor_id', supplier.id);
            }

            const response = await fetch(`${API_BASE_URL}/api/ocr/preview`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                setInspectData({ type, ...result.data });
                setShowInspectModal(true);
                // Default tab based on type
                setActiveInspectTab(type === 'excel' ? 'mapping' : 'raw');
            } else {
                setError(result.error || 'Inspection failed');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to inspect file');
        } finally {
            setInspecting(false);
        }
    };

    const handleUploadAndMap = async (manualAmount?: string) => {
        if (!files.pdf || !files.excel) {
            setError('Please upload both PDF and Excel files');
            return;
        }

        setUploading(true);
        setError('');
        setShowManualEntry(false);

        try {
            const formData = new FormData();
            formData.append('pdf_file', files.pdf);
            formData.append('excel_file', files.excel);
            formData.append('vendor_id', supplier.id);
            // Use manual amount if provided, otherwise 0 to trigger OCR
            formData.append('pdf_total', manualAmount || '0');

            const response = await fetch(`${API_BASE_URL}/api/invoices/bulk-upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            // Capture OCR data whenever available (success or failure)
            if (result.ocr_data) {
                setOcrData(result.ocr_data);
                // Initialize corrected data with OCR results for editing
                setCorrectedData(result.ocr_data);
            }

            // Capture VDU-specific data
            if (result.confidence) {
                setConfidenceData(result.confidence);
            }
            if (result.vdu_enabled !== undefined) {
                setVduEnabled(result.vdu_enabled);
            }
            if (result.ocr_data?.raw_text) {
                setRawText(result.ocr_data.raw_text);
            }

            if (result.success) {
                setDetectedMapping(result.column_mapping);
                setColumnMapping(result.column_mapping);
                setReconciliation(result.reconciliation);
                setLineItemsSummary(result.line_items_summary);
                setInvoiceId(result.invoice_id);

                // Store document paths for approval workflow
                if (result.documents) {
                    setDocumentPaths({
                        pdf_path: result.documents.pdf_path || '',
                        excel_path: result.documents.excel_path || ''
                    });
                }

                // Move to results if reconciliation passed
                if (result.reconciliation.valid) {
                    setCurrentStep('results');
                } else {
                    setCurrentStep('reconcile');
                }
            } else {
                // Check if this is a specific OCR failure that allows manual override
                if (result.ocr_error) {
                    setShowManualEntry(true);
                    setError('Automatic extraction low confidence. Please verify total manually.');
                } else if (result.ocr_data) {
                    // If we have OCR data but failed validaiton/recon
                    setError(result.error || 'Upload failed');
                    // Only show panel if user asks, or maybe hint at it
                } else {
                    setError(result.error || 'Upload failed');
                }
            }
        } catch (err) {
            setError('Failed to upload files. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    // Add manual retry handler
    const handleManualRetry = () => {
        if (!manualTotal) return;
        // Clean input to ensure valid number
        const cleanTotal = manualTotal.replace(/,/g, '');
        handleUploadAndMap(cleanTotal);
    };

    // Teach AI Handler - One-Shot Learning
    const handleTeachAI = async () => {
        if (!correctedData || Object.keys(correctedData).length === 0) {
            setError('No corrections to teach');
            return;
        }

        setTeachingAI(true);
        try {
            const formData = new FormData();
            formData.append('vendor_id', supplier.id);
            formData.append('vendor_name', supplier.name || supplier.id);
            formData.append('raw_text', rawText || ocrData?.raw_text || '');
            formData.append('corrected_data', JSON.stringify(correctedData));

            const response = await fetch(`${API_BASE_URL}/api/invoices/learn-correction`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setShowTeachAIModal(false);
                // Show success message
                setError(''); // Clear any errors
                alert(`SUCCESS: AI learned ${result.fields_learned?.length || 0} patterns from your corrections. Future invoices from this vendor will be more accurate.`);
            } else {
                setError(result.error || 'Teaching failed');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to teach AI');
        } finally {
            setTeachingAI(false);
        }
    };

    // Get confidence color based on score
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-50';
        if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        return 'Low';
    };

    const renderUploadStep = () => (
        <div className="space-y-6">
            {/* PDF Upload */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                        <Geo3DDocument className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Cover Invoice (PDF)</h3>
                        <p className="text-xs text-slate-500">Upload the main invoice document</p>
                    </div>
                </div>

                {!files.pdf ? (
                    <label className="block">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all">
                            <Geo3DUpload className="mx-auto text-slate-400 mb-2" size={32} />
                            <p className="text-sm font-bold text-slate-600">Click to upload Invoice</p>
                            <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG supported</p>
                        </div>
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => handleFileSelect('pdf', e.target.files?.[0] || null)}
                        />
                    </label>
                ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <Geo3DDocument size={24} className="text-green-600" />
                            <div>
                                <p className="text-sm font-bold text-slate-900">{files.pdf.name}</p>
                                <p className="text-xs text-slate-500">{(files.pdf.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleInspect('pdf')}
                                disabled={inspecting}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                title="Inspect extracted data"
                            >
                                <Geo3DScan size={14} className="text-blue-600" />
                                {inspecting ? 'Scanning...' : 'Inspect'}
                            </button>
                            <button
                                onClick={() => handleFileSelect('pdf', null)}
                                className="text-red-500 hover:text-red-700 ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Excel Upload */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Geo3DTable className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Annexure (Excel/CSV)</h3>
                        <p className="text-xs text-slate-500">Upload Excel with LR line items</p>
                    </div>
                </div>

                {!files.excel ? (
                    <label className="block">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all">
                            <Geo3DTable className="mx-auto text-slate-400 mb-2" size={32} />
                            <p className="text-sm font-bold text-slate-600">Click to upload Excel/CSV</p>
                            <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv</p>
                        </div>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => handleFileSelect('excel', e.target.files?.[0] || null)}
                        />
                    </label>
                ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <Table className="text-green-600" size={24} />
                            <div>
                                <p className="text-sm font-bold text-slate-900">{files.excel.name}</p>
                                <p className="text-xs text-slate-500">{(files.excel.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleInspect('excel')}
                                disabled={inspecting}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                title="Inspect parsed columns"
                            >
                                <Geo3DScan size={14} className="text-blue-600" />
                                {inspecting ? 'Scanning...' : 'Inspect'}
                            </button>
                            <button
                                onClick={() => handleFileSelect('excel', null)}
                                className="text-red-500 hover:text-red-700 ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <Geo3DAlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-sm font-bold text-red-900">Upload Error</p>
                            <p className="text-xs text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                    {ocrData && (
                        <button
                            type="button"
                            onClick={() => setShowExtractionPanel(true)}
                            className="text-xs font-bold text-red-700 underline hover:text-red-900"
                        >
                            View Scan Data
                        </button>
                    )}
                </div>
            )}

            <button
                type="button"
                onClick={() => handleUploadAndMap()}
                disabled={!files.pdf || !files.excel || uploading}
                className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${files.pdf && files.excel && !uploading
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                    : 'bg-slate-300 cursor-not-allowed'
                    }`}
            >
                {uploading ? (
                    <>
                        <Geo3DRefresh className="animate-spin" size={20} />
                        Processing...
                    </>
                ) : (
                    <>
                        Process Invoice
                        <Geo3DArrowRight size={20} />
                    </>
                )}
            </button>
        </div>
    );

    const renderReconcileStep = () => {
        if (!reconciliation) return null;

        return (
            <div className="space-y-6">
                <div className={`rounded-xl p-6 border-2 ${reconciliation.valid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center gap-3 mb-4">
                        {reconciliation.valid ? (
                            <Geo3DCheckCircle size={32} className="text-green-600" />
                        ) : (
                            <Geo3DAlertTriangle size={32} className="text-red-600" />
                        )}
                        <div>
                            <h3 className="font-bold text-lg">
                                {reconciliation.valid ? 'Reconciliation Passed' : 'Reconciliation Failed'}
                            </h3>
                            <p className="text-sm text-slate-600">
                                {reconciliation.valid
                                    ? 'Excel total matches PDF total'
                                    : 'Excel and PDF totals do not match'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Excel Total</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                ₹{reconciliation.excel_total.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">PDF Total</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                ₹{reconciliation.pdf_total.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Difference</p>
                            <p className={`text-2xl font-bold mt-1 ${reconciliation.difference === 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                ₹{reconciliation.difference.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {!reconciliation.valid && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm font-bold text-amber-900">Action Required</p>
                        <p className="text-xs text-amber-700 mt-1">
                            Please ask the vendor to correct the Excel file or verify the PDF total.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const renderResultsStep = () => {
        if (!lineItemsSummary) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Success Header */}
                <div className="bg-[#00C805] rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Geo3DCheck className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Bulk Upload Complete</h2>
                            <p className="text-white/80 text-sm">Invoice ID: {invoiceId}</p>
                        </div>
                    </div>
                </div>

                {/* OCR Extraction Results - Document Data Layer */}
                {reconciliation && (
                    <div className="bg-white rounded-xl p-6 border border-black">
                        <div className="relative z-10">
                            <h3 className="flex items-center gap-2 font-bold mb-6 text-lg text-black">
                                <Geo3DDocument className="text-black" size={24} />
                                Document Extraction
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                <div>
                                    <p className="text-black/60 text-xs font-bold uppercase tracking-wider mb-1">Detected Total</p>
                                    <p className="text-3xl font-bold font-mono text-[#00C805]">
                                        ₹{reconciliation.pdf_total.toLocaleString()}
                                    </p>
                                </div>
                                <div className="border-l border-black/20 pl-8">
                                    <p className="text-black/60 text-xs font-bold uppercase tracking-wider mb-1">Source</p>
                                    <p className="text-black font-bold">Consolidated Invoice</p>
                                    <p className="text-xs text-black/60 mt-1">PDF Document</p>
                                </div>
                                <div className="border-l border-black/20 pl-8">
                                    <p className="text-black/60 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                                    <span className="inline-flex items-center gap-1.5 bg-[#00C805] text-white px-2.5 py-1 rounded text-xs font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                        VERIFIED
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-black rounded-xl p-4">
                        <p className="text-xs text-black/60 font-bold uppercase tracking-wider">Total Rows</p>
                        <p className="text-3xl font-bold text-black mt-2">{lineItemsSummary.total_rows}</p>
                    </div>
                    <div className="bg-white border border-[#00C805] rounded-xl p-4">
                        <p className="text-xs text-black/60 font-bold uppercase tracking-wider">Valid</p>
                        <p className="text-3xl font-bold text-[#00C805] mt-2">{lineItemsSummary.valid_rows}</p>
                    </div>
                    <div className="bg-white border border-[#0062FF] rounded-xl p-4">
                        <p className="text-xs text-black/60 font-bold uppercase tracking-wider">Duplicates</p>
                        <p className="text-3xl font-bold text-[#0062FF] mt-2">{lineItemsSummary.duplicate_rows}</p>
                    </div>
                    <div className="bg-white border border-black rounded-xl p-4">
                        <p className="text-xs text-black/60 font-bold uppercase tracking-wider">Errors</p>
                        <p className="text-3xl font-bold text-black mt-2">{lineItemsSummary.error_rows}</p>
                    </div>
                </div>

                {/* Reconciliation Summary */}
                {reconciliation && (
                    <div className="bg-white border border-black rounded-xl p-6">
                        <h3 className="font-bold text-black mb-4">Reconciliation Summary</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-black/60">Excel Total</p>
                                <p className="text-xl font-bold text-black">
                                    ₹{reconciliation.excel_total.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-[#00C805]">
                                <Geo3DCheck size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-black/60">PDF Total</p>
                                <p className="text-xl font-bold text-black">
                                    ₹{reconciliation.pdf_total.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enterprise VDU Engine - Intelligence Layer */}
                {vduEnabled && ocrData && (
                    <div className="bg-black rounded-xl p-6 text-white relative overflow-hidden border border-white/20">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="flex items-center gap-2 font-bold text-lg">
                                    <Geo3DScan className="text-[#0062FF]" size={24} />
                                    Enterprise VDU Engine
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowTeachAIModal(true)}
                                    className="flex items-center gap-2 bg-[#0062FF] hover:bg-[#0050D4] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                                >
                                    <Geo3DRefresh size={16} />
                                    Calibrate
                                </button>
                            </div>

                            {/* Main Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                <div>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Confidence Score</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold font-mono">
                                            {((ocrData.confidence || confidenceData?.overall_confidence || 0) * 100).toFixed(0)}%
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${(ocrData.confidence || 0) >= 0.8 ? 'bg-[#00C805] text-white' :
                                            (ocrData.confidence || 0) >= 0.6 ? 'bg-[#0062FF] text-white' :
                                                'bg-black text-white border border-white/40'
                                            }`}>
                                            {getConfidenceLabel(ocrData.confidence || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-l border-white/20 pl-6">
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Quality</p>
                                    <p className="text-white font-medium">{ocrData.quality_rating || 'N/A'}</p>
                                </div>
                                <div className="border-l border-white/20 pl-6">
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Engine</p>
                                    <p className="text-white font-medium text-sm">Enterprise AI Core</p>
                                </div>
                                <div className="border-l border-white/20 pl-6">
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Processing</p>
                                    <p className="text-white font-medium">{(ocrData.processing_time_s || 0).toFixed(2)}s</p>
                                </div>
                            </div>

                            {/* Vendor Learning Stats */}
                            {ocrData.vendor_stats && (
                                <div className="grid grid-cols-3 gap-4 mb-4 bg-white/5 rounded-lg p-4 border border-white/20">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-[#0062FF]">{ocrData.vendor_stats.total_invoices_processed || 0}</p>
                                        <p className="text-xs text-white/60">Invoices Processed</p>
                                    </div>
                                    <div className="text-center border-l border-white/20">
                                        <p className="text-2xl font-bold text-[#00C805]">{ocrData.vendor_stats.accuracy_rate || '0%'}</p>
                                        <p className="text-xs text-white/60">Accuracy Rate</p>
                                    </div>
                                    <div className="text-center border-l border-white/20">
                                        <p className="text-2xl font-bold text-white">{ocrData.vendor_stats.learned_patterns || 0}</p>
                                        <p className="text-xs text-white/60">Patterns Learned</p>
                                    </div>
                                </div>
                            )}

                            {/* AI Suggestions */}
                            {ocrData.suggestions && ocrData.suggestions.length > 0 && (
                                <div className="bg-black border border-white/20 rounded-lg p-3 mb-4">
                                    <p className="text-white text-xs font-bold uppercase mb-2">SYSTEM RECOMMENDATIONS</p>
                                    {ocrData.suggestions.map((suggestion: string, i: number) => (
                                        <p key={i} className="text-white/80 text-sm">• {suggestion}</p>
                                    ))}
                                </div>
                            )}

                            {/* Processing Pipeline */}
                            {ocrData.processing_steps && ocrData.processing_steps.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {ocrData.processing_steps.slice(0, 7).map((step: string, i: number) => (
                                        <span key={i} className="flex-shrink-0 bg-white/10 text-white text-[10px] px-2 py-1 rounded border border-white/20 font-bold">
                                            {i + 1}. {step.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {confidenceData?.needs_review && (
                                <div className="mt-4 bg-black border border-[#0062FF] rounded-lg p-3">
                                    <p className="text-white text-sm">
                                        Some fields have low confidence. Click "Calibrate" to correct and improve future accuracy.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setCurrentStep('upload');
                            setFiles({ pdf: null, excel: null });
                            setReconciliation(null);
                            setLineItemsSummary(null);
                            setConfidenceData(null);
                            setOcrData(null);
                        }}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50"
                    >
                        Upload Another
                    </button>
                    {!submittedToWorkflow ? (
                        <button
                            type="button"
                            onClick={async () => {
                                setSubmittingForApproval(true);
                                try {
                                    const formData = new FormData();
                                    formData.append('invoice_id', invoiceId);
                                    formData.append('invoice_number', ocrData?.invoice_number || invoiceId);
                                    formData.append('supplier_id', supplier?.id || 'unknown');
                                    formData.append('total_amount', String(reconciliation?.pdf_total || 0));
                                    formData.append('invoice_date', ocrData?.invoice_date || new Date().toISOString().split('T')[0]);
                                    formData.append('line_items_count', String(lineItemsSummary?.total_rows || 0));
                                    formData.append('ocr_data', JSON.stringify(ocrData || {}));
                                    formData.append('confidence_score', String(ocrData?.confidence || confidenceData?.overall_confidence || 0));
                                    formData.append('reconciliation_status', reconciliation?.valid ? 'MATCHED' : 'VARIANCE');
                                    // Pass document paths for workflow access
                                    formData.append('pdf_path', documentPaths.pdf_path);
                                    formData.append('excel_path', documentPaths.excel_path);

                                    const res = await fetch('http://localhost:8000/api/invoices/submit-for-approval', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    const result = await res.json();
                                    if (result.success) {
                                        setSubmittedToWorkflow(true);
                                        setWorkflowInfo(result.workflow);
                                    } else {
                                        alert(`Failed to submit: ${result.error}`);
                                    }
                                } catch (err) {
                                    console.error('Submit error:', err);
                                    alert('Failed to submit for approval');
                                } finally {
                                    setSubmittingForApproval(false);
                                }
                            }}
                            disabled={submittingForApproval}
                            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submittingForApproval ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Submitting...</>
                            ) : (
                                <><Geo3DArrowRight size={16} /> Submit for Approval</>)
                            }
                        </button>
                    ) : (
                        <div className="flex-1 py-3 bg-[#00C805] text-white rounded-lg font-bold text-center flex items-center justify-center gap-2">
                            <Geo3DCheck size={16} /> Submitted to Workflow
                        </div>
                    )}
                </div>

                {/* Workflow Pipeline Card - Shows after submission */}
                {submittedToWorkflow && workflowInfo && (
                    <div className="mt-6 bg-black border border-white/20 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-[#00C805] rounded-full flex items-center justify-center text-sm"><Geo3DRefresh size={16} /></span>
                            Approval Workflow Started
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                            {workflowInfo.next_steps?.map((step: string, idx: number) => (
                                <div key={idx} className={`p-4 rounded-lg border ${idx === 0 ? 'bg-[#00C805]/20 border-[#00C805]' : 'bg-white/5 border-white/20'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-[#00C805]' : 'bg-white/20'}`}>
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-bold">{idx === 0 ? 'CURRENT' : 'PENDING'}</span>
                                    </div>
                                    <p className="text-sm text-white/80">{step}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/20">
                            <p className="text-sm text-white/80">
                                <span className="font-bold text-[#00C805]">Current Approver:</span> {workflowInfo.current_approver || 'Kaai Bansal'}
                            </p>
                            <p className="text-xs text-white/60 mt-1">
                                Invoice is now visible in Kaai's Approver Queue. Once approved, it moves to Finance.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bulk Invoice Upload</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Upload consolidated invoices with Excel annexure (50+ LRs)
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {[
                            { key: 'upload', label: 'Upload Files' },
                            { key: 'reconcile', label: 'Reconciliation' },
                            { key: 'results', label: 'Results' }
                        ].map((step, idx) => (
                            <React.Fragment key={step.key}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep === step.key
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <span className={`text-sm font-bold ${currentStep === step.key ? 'text-slate-900' : 'text-slate-400'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < 2 && (
                                    <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                    {currentStep === 'upload' && renderUploadStep()}
                    {currentStep === 'reconcile' && renderReconcileStep()}
                    {currentStep === 'results' && renderResultsStep()}
                </div>
            </div>

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-2 border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Geo3DAlertTriangle size={24} className="text-amber-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">Manual Verification Required</h3>
                        </div>

                        <p className="text-sm text-slate-600 mb-6">
                            We couldn't automatically extract the total from the PDF with high confidence.
                            Please enter the <strong>Grand Total</strong> manually to proceed with reconciliation.
                        </p>

                        {ocrData && (
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowExtractionPanel(true)}
                                    className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Geo3DScan size={16} />
                                    Need help? View Extracted Data
                                </button>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Invoice Grand Total</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="text"
                                    value={manualTotal}
                                    onChange={(e) => setManualTotal(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowManualEntry(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleManualRetry}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200"
                            >
                                Confirm & Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Extraction Results Side Panel */}
            {showExtractionPanel && (
                <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-[60] border-l border-slate-200 overflow-y-auto transform transition-transform duration-300">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Geo3DScan size={24} className="text-blue-600" />
                                Raw Extraction Data
                            </h3>
                            <button
                                onClick={() => setShowExtractionPanel(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <Geo3DX size={24} />
                            </button>
                        </div>

                        {!ocrData ? (
                            <div className="text-center py-12 text-slate-500">
                                No extraction data available yet.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Summary Metrics */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Total Amount</div>
                                        <div className="text-lg font-bold text-slate-900">
                                            {ocrData.total_amount || ocrData.amounts?.total_amount || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Invoice No</div>
                                        <div className="text-lg font-bold text-slate-900">
                                            {ocrData.invoice_number || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Date</div>
                                        <div className="text-lg font-bold text-slate-900">
                                            {ocrData.invoice_date || ocrData.dates?.invoice_date || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Vendor</div>
                                        <div className="text-lg font-bold text-slate-900 truncate">
                                            {typeof ocrData.vendor === 'string' ? ocrData.vendor : (ocrData.vendor?.name || 'N/A')}
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items / Tables View */}
                                {ocrData.line_items && Array.isArray(ocrData.line_items) && ocrData.line_items.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-2 text-sm flex items-center gap-2">
                                            <Geo3DTable size={16} className="text-blue-600" />
                                            Extracted Line Items ({ocrData.line_items.length})
                                        </h4>
                                        <div className="bg-white border text-xs border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-slate-200">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            {Object.keys(ocrData.line_items[0] || {}).map(header => (
                                                                <th key={header} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                                    {header.replace(/_/g, ' ')}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-slate-200">
                                                        {ocrData.line_items.map((item: any, idx: number) => (
                                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                                {Object.values(item).map((val: any, vIdx: number) => (
                                                                    <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-slate-700">
                                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Other Extracted Fields (Key-Value) */}
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2 text-sm">Targeted Fields</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {Object.entries(ocrData).map(([key, value]) => {
                                            if (key === 'line_items' || key === 'amounts' || key === 'vendor' || typeof value === 'object') return null;
                                            return (
                                                <div key={key} className="flex flex-col">
                                                    <span className="text-slate-500 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-slate-900 font-bold truncate" title={String(value)}>{String(value)}</span>
                                                </div>
                                            );
                                        })}
                                        {/* Flatten specific objects if needed */}
                                        {ocrData.vendor && typeof ocrData.vendor === 'object' && (
                                            <>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-500 font-medium">Vendor Name</span>
                                                    <span className="text-slate-900 font-bold truncate">{ocrData.vendor.name}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-500 font-medium">GSTIN</span>
                                                    <span className="text-slate-900 font-bold truncate">{ocrData.vendor.gstin}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Raw JSON View */}
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2 text-sm">Full JSON Output</h4>
                                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar">
                                        <pre className="text-xs font-mono text-green-400">
                                            {JSON.stringify(ocrData, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Extraction Results Side Panel (Legacy/Fallback for Error State) */}
            {showExtractionPanel && ocrData && (
                <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-[60] border-l border-slate-200 overflow-y-auto transform transition-transform duration-300">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Geo3DScan size={24} className="text-blue-600" />
                                Raw Extraction Data
                            </h3>
                            <button
                                onClick={() => setShowExtractionPanel(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <Geo3DX size={24} />
                            </button>
                        </div>
                        {/* Reuse the existing side panel content structure here or a simplified version */}
                        <div className="space-y-4">
                            <div className="bg-slate-900 rounded-xl p-6 overflow-auto custom-scrollbar">
                                <pre className="text-xs font-mono text-green-400">
                                    {JSON.stringify(ocrData, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Inspection Modal */}
            {showInspectModal && inspectData && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[70] p-4 transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${inspectData.type === 'pdf' ? 'bg-slate-900' : 'bg-green-600'
                                    }`}>
                                    {inspectData.type === 'pdf' ? (
                                        <Geo3DDocument className="text-white" size={24} />
                                    ) : (
                                        <Geo3DTable className="text-white" size={24} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">
                                        Inspect {inspectData.type === 'pdf' ? 'Extracted Data' : 'Excel Parsing'}
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        Verify the data before processing.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInspectModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <Geo3DX size={24} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-slate-200 px-6 flex gap-8">
                            {[
                                { id: 'raw', label: 'Raw Extraction' },
                                { id: 'table', label: 'Tables Detection' },
                                { id: 'mapping', label: 'Field Mappings' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveInspectTab(tab.id as any)}
                                    className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeInspectTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                            {/* RAW DATA TAB */}
                            {activeInspectTab === 'raw' && (
                                <div className="space-y-4">
                                    <div className="bg-slate-900 rounded-xl p-6 overflow-auto custom-scrollbar">
                                        <pre className="text-xs font-mono text-green-400">
                                            {JSON.stringify(inspectData.raw_data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* TABLES TAB */}
                            {activeInspectTab === 'table' && (
                                <div className="space-y-4">
                                    {inspectData.tables && inspectData.tables.length > 0 ? (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-slate-200">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            {Object.keys(inspectData.tables[0]).map(header => (
                                                                <th key={header} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                                                    {header.replace(/_/g, ' ')}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-slate-200">
                                                        {inspectData.tables.map((row: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50">
                                                                {Object.values(row).map((val: any, vIdx: number) => (
                                                                    <td key={vIdx} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 font-bold">
                                                Showing {inspectData.tables.length} rows
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                            <Geo3DTable className="mx-auto text-slate-300 mb-3" size={40} />
                                            <p className="text-slate-500 font-bold">No tabular data detected</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MAPPING TAB */}
                            {activeInspectTab === 'mapping' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* PDF Fields */}
                                    {inspectData.type === 'pdf' && (
                                        <>
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                    <Geo3DCheckCircle size={18} className="text-green-600" />
                                                    Key Fields Identified
                                                </h4>
                                                <div className="space-y-3">
                                                    {inspectData.fields && Object.entries(inspectData.fields).map(([key, value]) => (
                                                        <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                            <span className="text-xs font-bold text-slate-500 uppercase">{key.replace(/_/g, ' ')}</span>
                                                            <span className="font-mono text-sm font-bold text-slate-900">{String(value || 'N/A')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                                <h4 className="font-bold text-blue-900 mb-2">Confidence Score</h4>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-bold text-blue-700">{inspectData.confidence}%</span>
                                                    <span className="text-sm text-blue-600 font-medium">AI Certainty</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Excel Columns */}
                                    {inspectData.type === 'excel' && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
                                            <h4 className="font-bold text-slate-900 mb-4">Column Auto-Mapping</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {systemFields.map(field => {
                                                    const mappedCol = inspectData.mapping?.[field.key];
                                                    return (
                                                        <div key={field.key} className={`p-4 rounded-lg border-2 transition-all ${mappedCol
                                                            ? 'border-green-200 bg-green-50'
                                                            : 'border-slate-200 bg-slate-50'
                                                            }`}>
                                                            <p className="text-xs font-bold uppercase mb-1 text-slate-500" title="System Field">
                                                                {field.label}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <ArrowRight size={14} className="text-slate-400" />
                                                                <p className={`font-bold truncate ${mappedCol ? 'text-green-700' : 'text-slate-400 italic'
                                                                    }`}>
                                                                    {mappedCol || 'Not Found'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-2xl">
                            <button
                                onClick={() => setShowInspectModal(false)}
                                className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTeachAIModal && ocrData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="bg-black p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Geo3DRefresh size={24} className="text-[#0062FF]" />
                                    <div>
                                        <h2 className="text-xl font-bold">Calibrate Engine</h2>
                                        <p className="text-white/60 text-sm">Correct any errors to improve future accuracy</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTeachAIModal(false)}
                                    className="text-white/70 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Editable Fields */}
                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            <p className="text-black mb-4 text-sm">
                                Review the extracted data below. Fix any errors and click "Calibrate" to help the system learn.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { key: 'invoice_number', label: 'Invoice Number' },
                                    { key: 'invoice_date', label: 'Invoice Date' },
                                    { key: 'vendor_name', label: 'Vendor Name' },
                                    { key: 'vendor_gstin', label: 'Vendor GSTIN' },
                                    { key: 'total_amount', label: 'Total Amount' },
                                    { key: 'base_amount', label: 'Base Amount' },
                                    { key: 'vehicle_number', label: 'Vehicle Number' },
                                    { key: 'lr_number', label: 'LR Number' },
                                ].map(field => (
                                    <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-bold text-slate-700">{field.label}</label>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={correctedData[field.key] || ''}
                                                onChange={(e) => setCorrectedData({
                                                    ...correctedData,
                                                    [field.key]: e.target.value
                                                })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                            <p className="text-xs text-slate-500">
                                Vendor: <span className="font-bold">{supplier.name || supplier.id}</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowTeachAIModal(false)}
                                    className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTeachAI}
                                    disabled={teachingAI}
                                    className="px-6 py-2 bg-[#0062FF] text-white rounded-lg font-bold hover:bg-[#0050D4] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {teachingAI ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Calibrating...
                                        </>
                                    ) : (
                                        <>
                                            <Geo3DCheck size={16} />
                                            Calibrate Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
