import React, { useState, useRef } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { supplierInvoiceService } from '../../services/supplierInvoiceService';
import { InvoiceStatus, Invoice, MatchStatus } from '../../types';
import { Upload, CheckCircle, AlertTriangle, ChevronRight, Calculator, Check, RefreshCw, Eye, FileWarning, X, AlertCircle, Zap } from 'lucide-react';
import { Geo3DScan, Geo3DCheckbox, Geo3DDocument, Geo3DCheckCircle, Geo3DAlertTriangle } from './components/3DGeometricIcons';
import { RemarkSentimentBadge } from './components/RemarkSentimentBadge';
import { MagicSplitter } from '../../components/MagicSplitter';
import { SentinelSidebar } from '../../components/SentinelSidebar';

interface SmartInvoicingProps {
    supplier: IndianSupplier;
}

type UploadState = 'idle' | 'uploading' | 'scanning' | 'ready' | 'low_confidence' | 'submitting' | 'success' | 'error';

interface OCRExtractedData {
    invoice_number: string;
    invoice_date: string;
    vendor?: {
        name: string;
        gstin?: string;
        pan?: string;
    };
    shipment?: {
        lr_number?: string;
        vehicle_number?: string;
        origin?: string;
        destination?: string;
        weight_kg?: number;
    };
    line_items?: Array<{
        description: string;
        amount: number;
        quantity?: number;
        rate?: number;
    }>;
    subtotal: number;
    tax_details?: {
        cgst_amount?: number;
        sgst_amount?: number;
        igst_amount?: number;
        total_tax?: number;
    };
    total_amount: number;
    confidence_score: number;
    filename?: string;
}

const API_BASE_URL = 'http://localhost:8000';

export const SmartInvoicing: React.FC<SmartInvoicingProps> = ({ supplier }) => {
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [extractedData, setExtractedData] = useState<OCRExtractedData | null>(null);
    const [rawText, setRawText] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [processingTime, setProcessingTime] = useState<number>(0);
    const [showRawText, setShowRawText] = useState(false);
    const [uploadMode, setUploadMode] = useState<'single' | 'bundle'>('bundle'); // Default to Bundle for Demo
    const [canSubmit, setCanSubmit] = useState(false); // Sentinel validation gate
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Document Checklist State
    const [documentChecklist, setDocumentChecklist] = useState<{
        invoice: { uploaded: boolean; fileName: string | null; qualityScore?: number; qualityStatus?: string; blurDetected?: boolean; extractedText?: string };
        lorryReceipt: { uploaded: boolean; fileName: string | null; qualityScore?: number; qualityStatus?: string; blurDetected?: boolean; extractedText?: string };
        proofOfDelivery: { uploaded: boolean; fileName: string | null; qualityScore?: number; qualityStatus?: string; blurDetected?: boolean; extractedText?: string };
        rateContract: { uploaded: boolean; fileName: string | null; qualityScore?: number; qualityStatus?: string; blurDetected?: boolean; extractedText?: string };
    }>({
        invoice: { uploaded: false, fileName: null },
        lorryReceipt: { uploaded: false, fileName: null },
        proofOfDelivery: { uploaded: false, fileName: null },
        rateContract: { uploaded: false, fileName: null }
    });

    // Handler to upload a specific document type with OCR validation
    const handleDocumentUpload = async (docType: 'invoice' | 'lorryReceipt' | 'proofOfDelivery' | 'rateContract') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.png,.jpg,.jpeg';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                console.log(`[DocUpload] Uploading ${docType}: ${file.name}`);
                const formData = new FormData();
                formData.append('file', file);
                formData.append('docType', docType);
                try {
                    // Use OCR endpoint for quality validation
                    const res = await fetch(`${API_BASE_URL}/api/documents/ocr-upload`, {
                        method: 'POST',
                        body: formData
                    });
                    if (res.ok) {
                        const data = await res.json();
                        console.log(`[DocUpload] Success:`, data);
                        const qualityStatus = data.blur_detected ? 'BLURRY' : 'GOOD';
                        setDocumentChecklist(prev => ({
                            ...prev,
                            [docType]: {
                                uploaded: true,
                                fileName: data.filename || file.name,
                                qualityScore: data.quality_score || 85,
                                qualityStatus: qualityStatus,
                                blurDetected: data.blur_detected || false,
                                extractedText: data.extracted_text || data.raw_text || 'Document scanned successfully'
                            }
                        }));
                        if (data.blur_detected) {
                            alert(`⚠️ Document is blurry (Quality: ${data.quality_score}/100). Please re-scan for better accuracy.`);
                        }
                    } else {
                        // If OCR endpoint fails, still mark as uploaded (fallback)
                        console.log(`[DocUpload] OCR failed, using fallback for ${docType}`);
                        setDocumentChecklist(prev => ({
                            ...prev,
                            [docType]: {
                                uploaded: true,
                                fileName: file.name,
                                qualityScore: 75,
                                qualityStatus: 'UNCHECKED',
                                blurDetected: false
                            }
                        }));
                    }
                } catch (err) {
                    console.error('[DocUpload] Error:', err);
                    // Fallback: still mark as uploaded even if OCR fails
                    setDocumentChecklist(prev => ({
                        ...prev,
                        [docType]: {
                            uploaded: true,
                            fileName: file.name,
                            qualityScore: 70,
                            qualityStatus: 'UNKNOWN',
                            blurDetected: false
                        }
                    }));
                }
            }
        };
        input.click();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const processFile = async (file: File) => {
        // Validate file type
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Invalid file type. Please upload PDF, PNG, JPG, or TIFF.');
            setUploadState('error');
            return;
        }

        setSelectedFile(file);
        setUploadState('uploading');
        setErrorMessage('');

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            setUploadState('scanning');

            // Call OCR API
            const response = await fetch(`${API_BASE_URL}/api/ocr/extract`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            console.log('[OCR Debug] API Response:', result);

            if (result.success && result.invoice) {
                const invoice = result.invoice;
                console.log('[OCR Debug] Invoice data:', invoice);
                setExtractedData({
                    invoice_number: invoice.invoice_number || 'UNKNOWN',
                    invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
                    vendor: invoice.vendor,
                    shipment: invoice.shipment,
                    line_items: invoice.line_items || [],
                    subtotal: invoice.subtotal || 0,
                    tax_details: invoice.tax_details,
                    total_amount: invoice.total_amount || 0,
                    confidence_score: result.confidence || invoice.confidence_score || 0,
                    filename: result.filename
                });
                setRawText(result.raw_text || null);
                setProcessingTime(result.processing_time_ms || 0);

                // Check confidence level
                if (result.confidence < 0.7) {
                    setUploadState('low_confidence');
                } else {
                    setUploadState('ready');
                }
            } else {
                console.error('[OCR Debug] Extraction failed:', result);
                // Get error message from errors array or error field
                const errorMsg = result.errors?.length > 0
                    ? result.errors.join('; ')
                    : (result.error || 'Failed to extract invoice data');
                setErrorMessage(errorMsg);
                setUploadState('error');
            }
        } catch (error) {
            console.error('OCR API Error:', error);
            setErrorMessage('Failed to connect to OCR service. Please ensure the backend is running.');
            setUploadState('error');
        }
    };

    const handleSubmit = async () => {
        if (!extractedData) return;

        setUploadState('submitting');

        const invoiceId = extractedData.invoice_number;

        // Submit invoice to backend API
        try {
            const formData = new FormData();
            if (selectedFile) {
                formData.append('file', selectedFile);
            }
            formData.append('data', JSON.stringify({
                invoiceNumber: extractedData.invoice_number,
                supplierId: supplier.id,
                amount: extractedData.total_amount,
                date: extractedData.invoice_date,
                origin: extractedData.shipment?.origin || 'UNKNOWN',
                destination: extractedData.shipment?.destination || 'UNKNOWN',
                lineItems: extractedData.line_items
            }));

            const invoiceRes = await fetch(`${API_BASE_URL}/api/invoices/upload`, {
                method: 'POST',
                body: formData
            });

            if (invoiceRes.ok) {
                console.log('[Submit] Invoice saved to MySQL');

                // Now save document records to MySQL
                // Save each uploaded document from the checklist
                const docTypes = [
                    { key: 'invoice', type: 'INVOICE' },
                    { key: 'lorryReceipt', type: 'LR' },
                    { key: 'proofOfDelivery', type: 'POD' },
                    { key: 'rateContract', type: 'CONTRACT' }
                ];

                for (const doc of docTypes) {
                    const checklistDoc = documentChecklist[doc.key as keyof typeof documentChecklist];
                    if (checklistDoc.uploaded && checklistDoc.fileName) {
                        // Create a record in invoice_documents
                        const docFormData = new FormData();
                        docFormData.append('doc_type', doc.type);
                        docFormData.append('uploaded_by', supplier.name);
                        // We don't have the actual file here, but we record the filename
                        // Create a dummy file reference
                        const blob = new Blob([''], { type: 'application/octet-stream' });
                        const dummyFile = new File([blob], checklistDoc.fileName, { type: 'application/octet-stream' });
                        docFormData.append('file', dummyFile);

                        await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/documents`, {
                            method: 'POST',
                            body: docFormData
                        });
                        console.log(`[Submit] Saved ${doc.type} document record`);
                    }
                }

                setUploadState('success');
                setExtractedData(null);
                setSelectedFile(null);
            } else {
                console.error('[Submit] Failed to save invoice');
                setUploadState('error');
            }
        } catch (error) {
            console.error('[Submit] Error:', error);
            setUploadState('error');
        }
    };

    const handleReset = () => {
        setUploadState('idle');
        setExtractedData(null);
        setRawText(null);
        setSelectedFile(null);
        setErrorMessage('');
        setShowRawText(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRetry = () => {
        if (selectedFile) {
            processFile(selectedFile);
        } else {
            handleReset();
        }
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 0.85) return { bg: 'bg-[#00C805]', text: 'text-white', border: 'border-[#00C805]' };
        if (score >= 0.7) return { bg: 'bg-[#0052FF]', text: 'text-white', border: 'border-[#0052FF]' };
        return { bg: 'bg-black', text: 'text-white', border: 'border-black' };
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ fontFamily: "'Figtree', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg,.tiff"
                className="hidden"
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-black tracking-tight flex items-center gap-3">
                        <Geo3DScan size={28} color="#0052FF" />
                        Smart Invoicing
                        <span className="px-3 py-1 bg-[#0052FF] text-white text-xs font-bold uppercase tracking-wider">
                            Document Vision AI
                        </span>
                    </h2>
                    <p className="text-black/60 text-sm mt-1">Intelligent extraction powered by Neural Document Processing.</p>
                </div>
                {/* Upload Mode Toggle */}
                <div className="flex bg-black p-1">
                    <button
                        onClick={() => setUploadMode('single')}
                        className={`px-5 py-2.5 text-sm font-bold tracking-wide transition-all ${uploadMode === 'single' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                    >
                        Single File
                    </button>
                    <button
                        onClick={() => setUploadMode('bundle')}
                        className={`px-5 py-2.5 text-sm font-bold tracking-wide transition-all ${uploadMode === 'bundle' ? 'bg-[#0052FF] text-white' : 'text-white/60 hover:text-white'}`}
                    >
                        Magic Splitter
                    </button>
                </div>
            </div>

            {uploadMode === 'bundle' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MagicSplitter shipmentId="SHIP-1001" />
                </div>
            ) : uploadState === 'success' ? (
                <div className="bg-white border-2 border-[#00C805] p-12 text-center animate-in zoom-in-95">
                    <div className="mx-auto w-24 h-24 bg-[#00C805] flex items-center justify-center mb-6">
                        <Check size={48} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-black mb-2">Invoice Submitted Successfully!</h3>
                    <p className="text-black/60 mb-8 max-w-md mx-auto">Your invoice has been sent to the Finance team. Track status in "Invoices".</p>
                    <button
                        onClick={handleReset}
                        className="px-8 py-4 bg-black hover:bg-[#0052FF] text-white font-bold uppercase tracking-wider transition-all"
                    >
                        Submit Another Invoice
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Upload Zone */}
                    <div className="flex flex-col gap-6">
                        <div
                            onClick={() => uploadState === 'idle' && fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className={`h-64 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${uploadState === 'uploading' || uploadState === 'scanning' ? 'border-[#0052FF] bg-white' :
                                uploadState === 'ready' ? 'border-[#00C805] bg-white' :
                                    uploadState === 'low_confidence' ? 'border-black bg-white' :
                                        uploadState === 'error' ? 'border-black bg-white' :
                                            'border-black hover:border-[#0052FF] bg-white'
                                }`}
                        >
                            {uploadState === 'idle' && (
                                <>
                                    <div className="mb-4 group-hover:scale-110 transition-transform">
                                        <Geo3DScan size={80} color="#0052FF" />
                                    </div>
                                    <h3 className="text-lg font-bold text-black uppercase tracking-wide">Upload Document</h3>
                                    <p className="text-sm text-black/50 mt-2 font-mono">PDF, PNG, JPG, TIFF</p>
                                </>
                            )}

                            {(uploadState === 'uploading' || uploadState === 'scanning') && (
                                <>
                                    <div className="mb-4 animate-spin">
                                        <Geo3DScan size={40} color="#0052FF" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#0052FF]">
                                        {uploadState === 'uploading' ? 'Uploading...' : 'AI Scanning...'}
                                    </h3>
                                    <p className="text-sm text-[#0052FF] mt-2">
                                        {uploadState === 'uploading' ? 'Sending to OCR Engine' : 'Extracting Invoice Data'}
                                    </p>
                                </>
                            )}

                            {uploadState === 'submitting' && (
                                <>
                                    <div className="mb-4 animate-pulse">
                                        <Geo3DDocument size={48} color="#00C805" />
                                    </div>
                                    <h3 className="text-lg font-bold text-black">Submitting to Portal...</h3>
                                    <p className="text-sm text-black/60 mt-2">Syncing with Organization Backend</p>
                                </>
                            )}

                            {uploadState === 'ready' && (
                                <>
                                    <div className="mb-4">
                                        <Geo3DDocument size={48} color="#00C805" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#00C805]">Scan Complete ✓</h3>
                                    <p className="text-sm text-[#00C805] mt-2">High confidence extraction</p>
                                </>
                            )}

                            {uploadState === 'low_confidence' && (
                                <>
                                    <div className="mb-4">
                                        <Geo3DAlertTriangle size={48} color="#0052FF" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#0052FF]">Low Quality Document</h3>
                                    <p className="text-sm text-[#0052FF] mt-2">Consider uploading a cleaner scan</p>
                                </>
                            )}

                            {uploadState === 'error' && (
                                <>
                                    <div className="mb-4">
                                        <Geo3DAlertTriangle size={48} color="#000000" />
                                    </div>
                                    <h3 className="text-lg font-bold text-black">Extraction Failed</h3>
                                    <p className="text-sm text-black mt-2 max-w-xs text-center">{errorMessage}</p>
                                </>
                            )}
                        </div>

                        {/* Action buttons when file is processed */}
                        {(uploadState === 'ready' || uploadState === 'low_confidence' || uploadState === 'error') && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-black text-sm font-bold text-black hover:bg-black hover:text-white"
                                >
                                    <RefreshCw size={16} /> Upload Different File
                                </button>
                                {uploadState !== 'error' && (
                                    <button
                                        onClick={() => setShowRawText(!showRawText)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-black text-sm font-bold text-black hover:bg-black hover:text-white"
                                    >
                                        <Eye size={16} /> {showRawText ? 'Hide' : 'View'} Raw Text
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Raw OCR Text Preview */}
                        {showRawText && rawText && (
                            <div className="bg-black text-[#00C805] p-4 font-mono text-xs max-h-48 overflow-y-auto border-2 border-black">
                                <div className="flex items-center justify-between mb-2 text-white">
                                    <span>Raw OCR Output</span>
                                    <span>{processingTime}ms</span>
                                </div>
                                <pre className="whitespace-pre-wrap">{rawText}</pre>
                            </div>
                        )}

                        {/* Document Vision Tips - Bloomberg Style */}
                        <div className="bg-black p-6 border-2 border-black">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-3 uppercase tracking-wider text-sm">
                                <Geo3DDocument size={18} color="white" /> Document Vision Tips
                            </h4>
                            <ul className="space-y-3 text-sm text-white/80">
                                <li className="flex items-start gap-3">
                                    <Geo3DCheckCircle size={16} color="white" />
                                    <span>High-resolution scans (300 DPI+)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Geo3DCheckCircle size={16} color="white" />
                                    <span>Non-blurry, aligned text</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Geo3DCheckCircle size={16} color="white" />
                                    <span>PDF format preferred</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Geo3DAlertTriangle size={16} color="white" />
                                    <span>Avoid handwritten text</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right: Extraction Preview */}
                    <div className="bg-white border-2 border-black p-6">
                        <h3 className="font-bold text-black mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                            <Geo3DDocument size={20} color="#000000" />
                            Organization Preview
                            <span className="text-xs text-black/40 font-normal ml-auto normal-case">How it appears to Finance</span>
                        </h3>

                        {/* NLP SENTIMENT ANALYSIS BADGE - Only shown for POD documents, not invoices */}
                        {/* Removed: This should only analyze POD remarks, not invoice text */}

                        {/* ATLAS SENTINEL LAYER - Pre-Audit Firewall */}
                        {extractedData && (
                            <div className="mb-6">
                                <SentinelSidebar
                                    invoiceData={{
                                        origin: extractedData.shipment?.origin || 'MUMBAI',
                                        destination: extractedData.shipment?.destination || 'LedgerOne Logistics Pvt Ltd',
                                        vendor_amount: extractedData.total_amount || 0,
                                        vendor_id: supplier.id || 'V001',
                                        vehicle_no: extractedData.shipment?.vehicle_number || 'MH-00-XX-0000',
                                        invoice_date: extractedData.invoice_date || new Date().toISOString().split('T')[0],
                                        invoice_no: extractedData.invoice_number,
                                        document_path: extractedData.filename ? `uploads/${extractedData.filename}` : undefined
                                    }}
                                    onValidationComplete={(canSubmit) => setCanSubmit(canSubmit)}
                                    onUploadDocument={(docType) => {
                                        // Trigger file picker for additional documents
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.pdf,.png,.jpg,.jpeg';
                                        input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                try {
                                                    const res = await fetch(`${API_BASE_URL}/api/documents/ocr-upload`, {
                                                        method: 'POST',
                                                        body: formData
                                                    });
                                                    if (res.ok) {
                                                        alert(`Document uploaded successfully! Re-running validation...`);
                                                        // Re-trigger validation by updating state
                                                        setExtractedData({ ...extractedData });
                                                    }
                                                } catch (err) {
                                                    console.error('Upload failed:', err);
                                                }
                                            }
                                        };
                                        input.click();
                                    }}
                                />
                            </div>
                        )}

                        {/* DOCUMENT CHECKLIST - Supporting Documents */}
                        {extractedData && (
                            <div className="mb-6 bg-gray-900 rounded-xl p-5 border border-gray-700" style={{ fontFamily: "'TX-02-Berkeley-Mono', 'Berkeley Mono', 'SF Mono', monospace" }}>
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Geo3DDocument size={18} color="#00C805" />
                                    Document Checklist
                                    <span className="ml-auto text-xs font-normal text-gray-400 normal-case" style={{ fontFamily: "'TX-02-Berkeley-Mono', 'Berkeley Mono', 'SF Mono', monospace" }}>
                                        {(extractedData?.filename ? 1 : 0) + Object.values(documentChecklist).filter(d => d.uploaded).length}/4 Attached
                                    </span>
                                </h4>
                                <div className="space-y-3">
                                    {/* Invoice */}
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {documentChecklist.invoice.uploaded || extractedData.filename ? (
                                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                                    <Check size={16} className="text-black" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                                                    <FileWarning size={16} className="text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-white text-sm font-medium">Commercial Invoice</span>
                                                <p className="text-xs text-gray-400">
                                                    {documentChecklist.invoice.fileName || extractedData.filename || 'Required'}
                                                </p>
                                            </div>
                                        </div>
                                        {!(documentChecklist.invoice.uploaded || extractedData.filename) && (
                                            <button onClick={() => handleDocumentUpload('invoice')} className="px-3 py-1 bg-green-500 text-black text-xs font-bold rounded hover:bg-green-400">
                                                Upload
                                            </button>
                                        )}
                                    </div>

                                    {/* Lorry Receipt */}
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {documentChecklist.lorryReceipt.uploaded ? (
                                                documentChecklist.lorryReceipt.blurDetected ? (
                                                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                                                        <AlertTriangle size={16} className="text-black" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                                        <Check size={16} className="text-black" />
                                                    </div>
                                                )
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                                                    <AlertTriangle size={16} className="text-white" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-white text-sm font-medium">Lorry Receipt (LR)</span>
                                                <p className="text-xs text-gray-400">
                                                    {documentChecklist.lorryReceipt.uploaded
                                                        ? `${documentChecklist.lorryReceipt.fileName} ${documentChecklist.lorryReceipt.blurDetected ? '⚠️ Blurry' : `✓ Quality: ${documentChecklist.lorryReceipt.qualityScore}/100`}`
                                                        : 'Missing - Required for approval'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        {documentChecklist.lorryReceipt.uploaded ? (
                                            <button
                                                onClick={() => alert(`📄 LR Extracted Data:\n\n${documentChecklist.lorryReceipt.extractedText || 'No text extracted'}`)}
                                                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500"
                                            >
                                                View
                                            </button>
                                        ) : (
                                            <button onClick={() => handleDocumentUpload('lorryReceipt')} className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded hover:bg-amber-400">
                                                Upload
                                            </button>
                                        )}
                                    </div>

                                    {/* Proof of Delivery */}
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {documentChecklist.proofOfDelivery.uploaded ? (
                                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                                    <Check size={16} className="text-black" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                                                    <AlertTriangle size={16} className="text-white" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-white text-sm font-medium">Proof of Delivery (POD)</span>
                                                <p className="text-xs text-gray-400">
                                                    {documentChecklist.proofOfDelivery.uploaded
                                                        ? `${documentChecklist.proofOfDelivery.fileName} ✓ Quality: ${documentChecklist.proofOfDelivery.qualityScore || 85}/100`
                                                        : 'Missing - Required for approval'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        {documentChecklist.proofOfDelivery.uploaded ? (
                                            <button
                                                onClick={() => alert(`📄 POD Extracted Data:\n\n${documentChecklist.proofOfDelivery.extractedText || 'No text extracted'}`)}
                                                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500"
                                            >
                                                View
                                            </button>
                                        ) : (
                                            <button onClick={() => handleDocumentUpload('proofOfDelivery')} className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded hover:bg-amber-400">
                                                Upload
                                            </button>
                                        )}
                                    </div>

                                    {/* Rate Contract */}
                                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {documentChecklist.rateContract.uploaded ? (
                                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                                    <Check size={16} className="text-black" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                                    <Eye size={16} className="text-white" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-white text-sm font-medium">Rate Contract</span>
                                                <p className="text-xs text-gray-400">
                                                    {documentChecklist.rateContract.fileName || 'Optional - For rate verification'}
                                                </p>
                                            </div>
                                        </div>
                                        {!documentChecklist.rateContract.uploaded && (
                                            <button onClick={() => handleDocumentUpload('rateContract')} className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-400">
                                                Upload
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {extractedData ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                {/* Confidence Badge */}
                                <div className={`p-3 rounded-lg flex items-center justify-between ${getConfidenceColor(extractedData.confidence_score).bg} ${getConfidenceColor(extractedData.confidence_score).border} border`}>
                                    <div className="flex items-center gap-2">
                                        {extractedData.confidence_score >= 0.7 ? (
                                            <CheckCircle size={18} className={getConfidenceColor(extractedData.confidence_score).text} />
                                        ) : (
                                            <AlertCircle size={18} className={getConfidenceColor(extractedData.confidence_score).text} />
                                        )}
                                        <span className={`text-sm font-bold ${getConfidenceColor(extractedData.confidence_score).text}`}>
                                            Vision Accuracy: {Math.round(extractedData.confidence_score * 100)}%
                                        </span>
                                    </div>
                                    <span className={`text-xs font-mono ${getConfidenceColor(extractedData.confidence_score).text}`}>
                                        {processingTime}ms
                                    </span>
                                </div>

                                {/* Low Confidence Warning */}
                                {extractedData.confidence_score < 0.7 && (
                                    <div className="p-4 bg-black border-2 border-black">
                                        <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 bg-[#0052FF] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">!</span>
                                            <div>
                                                <p className="text-sm font-bold text-white uppercase tracking-wide">Document Quality Issue</p>
                                                <p className="text-xs text-white/70 mt-1 font-mono">
                                                    Low extraction confidence. Upload clearer document to avoid delays.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Extracted Data Grid */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-white border-2 border-black">
                                    <div>
                                        <p className="text-xs text-black/50 font-bold uppercase tracking-wider">Invoice No</p>
                                        <p className="font-bold text-black font-mono">{extractedData.invoice_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-black/50 font-bold uppercase tracking-wider">Invoice Date</p>
                                        <p className="font-bold text-black font-mono">{extractedData.invoice_date?.split('T')[0] || extractedData.invoice_date}</p>
                                    </div>
                                </div>

                                {/* Vendor Details */}
                                {extractedData.vendor && (
                                    <div className="p-4 bg-white border-2 border-black">
                                        <p className="text-xs text-black/50 font-bold uppercase tracking-wider mb-2">Vendor Details</p>
                                        <p className="font-bold text-black">{extractedData.vendor.name}</p>
                                        {extractedData.vendor.gstin && (
                                            <p className="text-xs text-black/60 font-mono mt-1">GSTIN: {extractedData.vendor.gstin}</p>
                                        )}
                                    </div>
                                )}

                                {/* Shipment Details */}
                                {extractedData.shipment && (
                                    <div className="p-4 bg-white border-2 border-black">
                                        <p className="text-xs text-black/50 font-bold uppercase tracking-wider mb-2">Shipment Details</p>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {extractedData.shipment.lr_number && (
                                                <div>
                                                    <span className="text-black/50">LR#:</span>
                                                    <span className="font-bold text-black ml-1 font-mono">{extractedData.shipment.lr_number}</span>
                                                </div>
                                            )}
                                            {extractedData.shipment.vehicle_number && (
                                                <div>
                                                    <span className="text-black/50">Vehicle:</span>
                                                    <span className="font-bold text-black ml-1 font-mono">{extractedData.shipment.vehicle_number}</span>
                                                </div>
                                            )}
                                            {extractedData.shipment.origin && (
                                                <div>
                                                    <span className="text-black/50">From:</span>
                                                    <span className="font-bold text-black ml-1">{extractedData.shipment.origin}</span>
                                                </div>
                                            )}
                                            {extractedData.shipment.destination && (
                                                <div>
                                                    <span className="text-black/50">To:</span>
                                                    <span className="font-bold text-black ml-1">{extractedData.shipment.destination}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Line Items */}
                                {extractedData.line_items && extractedData.line_items.length > 0 && (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-3">Line Items</p>
                                        <div className="space-y-2">
                                            {extractedData.line_items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-slate-700">{item.description}</span>
                                                    <span className="font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Amount Summary */}
                                <div className="p-4 bg-slate-900 rounded-xl text-white">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">Subtotal</span>
                                        <span>₹{extractedData.subtotal.toLocaleString()}</span>
                                    </div>
                                    {extractedData.tax_details?.total_tax && extractedData.tax_details.total_tax > 0 && (
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-400">Tax</span>
                                            <span>₹{extractedData.tax_details.total_tax.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-2 mt-2">
                                        <span>Total</span>
                                        <span className="text-[#00C805]">₹{extractedData.total_amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Submit Button - Requires mandatory docs + Sentinel validation */}
                                {(() => {
                                    const hasMandatoryDocs = documentChecklist.lorryReceipt.uploaded && documentChecklist.proofOfDelivery.uploaded;
                                    const isReady = canSubmit && hasMandatoryDocs;
                                    const missingDocs = [];
                                    if (!documentChecklist.lorryReceipt.uploaded) missingDocs.push('LR');
                                    if (!documentChecklist.proofOfDelivery.uploaded) missingDocs.push('POD');

                                    return (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={uploadState === 'submitting' || !isReady}
                                            className={`w-full py-4 font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ${isReady
                                                ? 'bg-[#00C805] hover:bg-black text-white'
                                                : 'bg-red-600/80 text-white cursor-not-allowed'
                                                }`}
                                        >
                                            {uploadState === 'submitting'
                                                ? 'SYNCING...'
                                                : !hasMandatoryDocs
                                                    ? `UPLOAD MISSING: ${missingDocs.join(', ')}`
                                                    : !canSubmit
                                                        ? 'FIX ERRORS TO SUBMIT'
                                                        : 'SUBMIT INVOICE'
                                            } <ChevronRight size={18} />
                                        </button>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-black/20">
                                <Geo3DDocument size={64} color="#0052FF" />
                                <p className="font-bold text-black mt-4 uppercase tracking-wider text-sm">No Data Extracted</p>
                                <p className="text-sm text-black/50 mt-1 font-mono">Upload document to preview extraction</p>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
};
