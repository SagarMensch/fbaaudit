import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';

interface DocumentViewerProps {
    documentName: string;
    documentType: string;
    pdfBlob?: Blob | null;
    pdfUrl?: string;
    onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentName, documentType, pdfBlob, pdfUrl: externalUrl, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState<string>('');

    useEffect(() => {
        if (externalUrl) {
            setPdfUrl(externalUrl);
        } else if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);

            // Cleanup
            return () => URL.revokeObjectURL(url);
        }
    }, [pdfBlob, externalUrl]);

    const handleDownload = () => {
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = documentName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } else if (pdfUrl) {
            // Handle external URL download
            window.open(pdfUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-6xl h-[90vh] flex flex-col rounded-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <FileText className="text-blue-600" size={24} />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{documentType}</h3>
                            <p className="text-sm text-gray-600">{documentName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Download size={18} />
                            Download PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden">
                    {pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            title={documentName}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <FileText size={64} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Loading document...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
