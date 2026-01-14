import React, { useState } from 'react';
import { DocumentMetadata, InvoiceDocumentBundle, DocumentComplianceStatus, AIPrediction } from '../types';
import DocumentGeneratorService from '../services/documentGeneratorService';
import { DocumentViewer } from './DocumentViewer';
import { Eye } from 'lucide-react';

interface DocumentChecklistProps {
    documentBundle?: InvoiceDocumentBundle;
    documentCompliance?: DocumentComplianceStatus;
    invoiceData?: any; // Invoice data for PDF generation
}

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ documentBundle, documentCompliance, invoiceData }) => {
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentPDF, setCurrentPDF] = useState<Blob | null>(null);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [currentDocName, setCurrentDocName] = useState('');
    const [currentDocType, setCurrentDocType] = useState('');

    const handleViewDocument = (documentType: string, fileName: string) => {
        // USE BACKEND GENERATED PDFS
        const backendUrl = `http://localhost:5000/api/files/view?filename=${fileName}`;

        setCurrentUrl(backendUrl);
        setCurrentPDF(null); // Clear any blob
        setCurrentDocName(fileName);
        setCurrentDocType(documentType.replace(/([A-Z])/g, ' $1').trim());
        setViewerOpen(true);
    };

    if (!documentBundle || !documentCompliance) {
        return (
            <div className="border-2 border-gray-300 p-4 bg-gray-50">
                <p className="text-sm text-gray-600">No document information available</p>
            </div>
        );
    }

    const documentTypes = [
        { key: 'commercialInvoice', label: 'Commercial Invoice', mandatory: true },
        { key: 'billOfLading', label: 'Bill of Lading / LR', mandatory: true },
        { key: 'proofOfDelivery', label: 'Proof of Delivery (POD)', mandatory: true },
        { key: 'purchaseOrder', label: 'Purchase Order', mandatory: true },
        { key: 'rateConfirmation', label: 'Rate Confirmation', mandatory: true },
        { key: 'gstInvoice', label: 'GST Invoice', mandatory: true },
        { key: 'ewayBill', label: 'E-Way Bill', mandatory: false },
        { key: 'weightCertificate', label: 'Weight Certificate', mandatory: false },
        { key: 'packingList', label: 'Packing List', mandatory: false },
        { key: 'customsDocuments', label: 'Customs Documents', mandatory: false },
        { key: 'insuranceCertificate', label: 'Insurance Certificate', mandatory: false },
        { key: 'detentionProof', label: 'Detention/Demurrage Proof', mandatory: false },
        { key: 'tdsCertificate', label: 'TDS Certificate', mandatory: false },
        { key: 'msmeCertificate', label: 'MSME Certificate', mandatory: false },
    ];

    const getStatusIcon = (doc?: DocumentMetadata) => {
        if (!doc) return '○';
        switch (doc.status) {
            case 'ATTACHED': return '✓';
            case 'MISSING': return doc.blocker ? '✗' : '⚠';
            case 'PENDING_UPLOAD': return '◷';
            case 'REJECTED': return '✗';
            default: return '○';
        }
    };

    const getStatusColor = (doc?: DocumentMetadata) => {
        if (!doc) return 'text-gray-400';
        switch (doc.status) {
            case 'ATTACHED': return 'text-green-700';
            case 'MISSING': return doc.blocker ? 'text-red-700' : 'text-orange-600';
            case 'PENDING_UPLOAD': return 'text-blue-600';
            case 'REJECTED': return 'text-red-700';
            default: return 'text-gray-400';
        }
    };

    const getSourceBadge = (source?: string) => {
        if (!source) return null;
        const colors: Record<string, string> = {
            'MANUAL': 'bg-gray-200 text-gray-800',
            'EDI': 'bg-blue-100 text-blue-800',
            'API': 'bg-purple-100 text-purple-800',
            'EMAIL': 'bg-yellow-100 text-yellow-800',
            'PORTAL': 'bg-green-100 text-green-800',
            'ERP': 'bg-indigo-100 text-indigo-800',
            'AI_EXTRACTED': 'bg-teal-100 text-teal-800',
            'AI_PREDICTED': 'bg-orange-100 text-orange-800',
        };
        return (
            <span className={`text-xs px-2 py-0.5 rounded ${colors[source] || 'bg-gray-100 text-gray-700'}`}>
                {source.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="font-serif text-sm">
            {/* Summary Section - Compact Text */}
            <div className="mb-4 border border-black p-3 bg-white">
                <div className="flex justify-between items-center border-b border-black pb-2 mb-2">
                    <h3 className="font-bold uppercase tracking-wide text-black">Compliance Abstract</h3>
                    <div className="text-xs">Ref: {invoiceData?.invoiceNumber || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center divide-x divide-black">
                    <div>
                        <div className="text-xs uppercase text-gray-600">Required</div>
                        <div className="font-bold">{documentCompliance.totalRequired}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-600">Attached</div>
                        <div className="font-bold">{documentCompliance.totalAttached}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-600">Missing</div>
                        <div className="font-bold text-red-700">{documentCompliance.totalMissing}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-600">Disposition</div>
                        <div className={`font-bold ${documentCompliance.canApprove ? 'text-green-800' : 'text-red-800'}`}>
                            {documentCompliance.canApprove ? 'APPROVED' : 'BLOCKED'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Academic Table */}
            <div className="overflow-hidden border border-black">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b border-black text-xs uppercase font-bold text-black">
                        <tr>
                            <th className="px-3 py-2 border-r border-black w-12 text-center">St.</th>
                            <th className="px-3 py-2 border-r border-black">Document Type</th>
                            <th className="px-3 py-2 border-r border-black w-32">Source</th>
                            <th className="px-3 py-2 border-r border-black w-20 text-center">Conf.</th>
                            <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black text-xs">
                        {documentTypes.map(({ key, label, mandatory }) => {
                            const doc = documentBundle[key as keyof InvoiceDocumentBundle] as DocumentMetadata | undefined;
                            if (!doc && !mandatory) return null;

                            return (
                                <tr key={key} className="hover:bg-gray-50">
                                    <td className="px-3 py-1.5 border-r border-black text-center font-bold">
                                        {doc?.status === 'ATTACHED' ? <span className="text-green-800">✓</span> :
                                            doc?.status === 'MISSING' ? <span className="text-red-800">✗</span> :
                                                doc?.status === 'PENDING_UPLOAD' ? <span className="text-blue-800">○</span> : '-'}
                                    </td>
                                    <td className="px-3 py-1.5 border-r border-black font-medium text-black">
                                        {label}
                                        {doc?.blocker && <span className="ml-2 text-[10px] text-red-700 font-bold uppercase">(Req)</span>}
                                    </td>
                                    <td className="px-3 py-1.5 border-r border-black font-mono text-gray-700">
                                        {doc?.source?.replace('_', ' ') || '-'}
                                    </td>
                                    <td className="px-3 py-1.5 border-r border-black text-center font-mono">
                                        {doc?.confidence ? `${doc.confidence}%` : '-'}
                                    </td>
                                    <td className="px-3 py-1.5 text-center">
                                        {doc?.status === 'ATTACHED' ? (
                                            <button
                                                onClick={() => handleViewDocument(key, doc.fileName || '')}
                                                className="text-blue-900 underline hover:text-blue-700 font-bold"
                                            >
                                                View
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 italic">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* AI Predictions - Footnote Style */}
            {documentCompliance.aiAssisted && documentCompliance.aiPredictions.length > 0 && (
                <div className="mt-4 text-xs">
                    <div className="font-bold border-b border-black w-max mb-1">Automated Validation Notes:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-800">
                        {documentCompliance.aiPredictions.map((prediction, idx) => (
                            <li key={idx}>
                                <span className="font-bold">{prediction.field}:</span> {prediction.predictedValue}
                                <span className="text-gray-600 italic ml-1">
                                    (Conf: {prediction.confidence}%, Method: {prediction.method})
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Document Viewer Modal */}
            {viewerOpen && (
                <DocumentViewer
                    documentName={currentDocName}
                    documentType={currentDocType}
                    pdfBlob={currentPDF}
                    pdfUrl={currentUrl}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </div>
    );
};

export default DocumentChecklist;
