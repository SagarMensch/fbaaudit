import React, { useState } from 'react';
import {
    Search, Filter, Download, Upload, X, ChevronDown, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import DocumentService, { LogisticsDocument, DocumentType, DocumentCategory, DocumentStatus } from '../services/documentService';
import DocumentContentGenerator from '../services/documentContentGenerator';

export const DocumentLibrary: React.FC = () => {
    const [documents, setDocuments] = useState<LogisticsDocument[]>(DocumentService.getAllDocuments());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
    const [filterPartner, setFilterPartner] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [viewingDocument, setViewingDocument] = useState<LogisticsDocument | null>(null);

    const stats = DocumentService.getDocumentStats();

    // Get unique partners
    const partners = Array.from(new Set(documents.map(d => ({ id: d.partnerId, name: d.partnerName }))))
        .sort((a, b) => a.name.localeCompare(b.name));

    // Filter documents
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = searchQuery === '' ||
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.partnerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
        const matchesPartner = filterPartner === 'all' || doc.partnerId === filterPartner;

        return matchesSearch && matchesCategory && matchesStatus && matchesPartner;
    });

    const getStatusBadge = (status: DocumentStatus) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-0.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded">ACTIVE</span>;
            case 'expired':
                return <span className="px-2 py-0.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded">EXPIRED</span>;
            case 'pending_renewal':
                return <span className="px-2 py-0.5 text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded">PENDING</span>;
        }
    };

    const handleDownload = (doc: LogisticsDocument) => {
        // Generate realistic document content
        const content = DocumentContentGenerator.generateDocumentContent(doc);

        // Create and download file
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = doc.fileName.replace('.pdf', '.txt');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleView = (doc: LogisticsDocument) => {
        setViewingDocument(doc);
    };

    return (
        <div className="h-full flex flex-col font-sans p-8 overflow-hidden bg-[#F8F9FA]">

            {/* Header */}
            <div className="flex justify-between items-start mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Document Library</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage logistics documents and compliance certificates</p>
                </div>
                <button className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 font-medium text-sm rounded">
                    <Upload size={16} className="inline mr-2" />
                    Upload Document
                </button>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-5 gap-4 mb-6 flex-shrink-0">
                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Documents</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>

                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Active</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">{stats.active}</p>
                </div>

                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-orange-700 font-medium uppercase tracking-wide">Expiring Soon</p>
                    <p className="text-3xl font-bold text-orange-700 mt-2">{stats.expiringIn30Days}</p>
                </div>

                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-red-700 font-medium uppercase tracking-wide">Pending Renewal</p>
                    <p className="text-3xl font-bold text-red-700 mt-2">{stats.pendingRenewal}</p>
                </div>

                <div className="bg-white p-4 border border-gray-200">
                    <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Shipment Docs</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">{stats.byCategory.shipment}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 text-sm"
                    />
                    <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 border text-sm font-medium ${showFilters ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Filter size={14} className="inline mr-2" />
                    Filters
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white border border-gray-200 p-4 mb-6 flex-shrink-0">
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-700 uppercase block mb-2">Category</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value as any)}
                                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                            >
                                <option value="all">All Categories</option>
                                <option value="shipment">Shipment</option>
                                <option value="compliance">Compliance</option>
                                <option value="financial">Financial</option>
                                <option value="operational">Operational</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 uppercase block mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending_renewal">Pending Renewal</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 uppercase block mb-2">Partner</label>
                            <select
                                value={filterPartner}
                                onChange={(e) => setFilterPartner(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                            >
                                <option value="all">All Partners</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilterCategory('all');
                                    setFilterStatus('all');
                                    setFilterPartner('all');
                                }}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Table */}
            <div className="flex-1 overflow-auto bg-white border border-gray-200">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Document Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Partner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Uploaded</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredDocuments.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                    {doc.documentNumber && (
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{doc.documentNumber}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">{doc.partnerName}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{DocumentService.getDocumentTypeLabel(doc.type)}</td>
                                <td className="px-6 py-4 text-sm text-gray-700 capitalize">{doc.category}</td>
                                <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{doc.uploadedDate}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleView(doc)}
                                        className="text-sm text-gray-900 hover:text-gray-700 font-medium mr-4"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="text-sm text-gray-900 hover:text-gray-700 font-medium"
                                    >
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State */}
                {filteredDocuments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <p className="text-lg font-medium">No documents found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewingDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">{viewingDocument.name}</h3>
                            <button onClick={() => setViewingDocument(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Partner</p>
                                        <p className="text-sm text-gray-900 mt-1">{viewingDocument.partnerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
                                        <p className="text-sm text-gray-900 mt-1">{DocumentService.getDocumentTypeLabel(viewingDocument.type)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                                        <p className="text-sm text-gray-900 mt-1 capitalize">{viewingDocument.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                                        <div className="mt-1">{getStatusBadge(viewingDocument.status)}</div>
                                    </div>
                                    {viewingDocument.documentNumber && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Document Number</p>
                                            <p className="text-sm text-gray-900 mt-1 font-mono">{viewingDocument.documentNumber}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">File Size</p>
                                        <p className="text-sm text-gray-900 mt-1">{viewingDocument.fileSize}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Uploaded Date</p>
                                        <p className="text-sm text-gray-900 mt-1">{viewingDocument.uploadedDate}</p>
                                    </div>
                                    {viewingDocument.expiryDate && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Expiry Date</p>
                                            <p className="text-sm text-gray-900 mt-1">{viewingDocument.expiryDate}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 font-mono text-xs overflow-auto max-h-96">
                                    <pre className="whitespace-pre-wrap text-gray-800">
                                        {DocumentContentGenerator.generateDocumentContent(viewingDocument)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setViewingDocument(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleDownload(viewingDocument)}
                                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 font-medium text-sm"
                            >
                                <Download size={16} className="inline mr-2" />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentLibrary;
