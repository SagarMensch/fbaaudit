// Document Management Service for Indian Logistics
// Mock document system for LR, POD, e-way bills, rate cards, and compliance documents

export type DocumentType =
    | 'lr' | 'pod' | 'eway_bill' | 'rate_card' | 'gst_cert'
    | 'pan_card' | 'insurance' | 'contract' | 'permit' | 'iso_cert'
    | 'tan_reg' | 'bank_details' | 'msme_cert';

export type DocumentCategory = 'shipment' | 'compliance' | 'financial' | 'operational';
export type DocumentStatus = 'active' | 'expired' | 'pending_renewal';

export interface LogisticsDocument {
    id: string;
    partnerId: string;
    partnerName: string;
    type: DocumentType;
    category: DocumentCategory;
    name: string;
    fileName: string;
    fileSize: string;
    uploadedDate: string;
    expiryDate?: string;
    status: DocumentStatus;
    uploadedBy: string;
    documentNumber?: string;
    relatedShipment?: string;
    metadata?: {
        route?: string;
        validFrom?: string;
        validTo?: string;
        issuer?: string;
        states?: string[];
        coverageAmount?: string;
        [key: string]: any;
    };
}

// Mock document data for all 12 Indian logistics partners
const MOCK_DOCUMENTS: LogisticsDocument[] = [
    // TCI EXPRESS DOCUMENTS
    {
        id: 'doc-tci-001',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'contract',
        category: 'operational',
        name: 'Master Freight Agreement 2024-25',
        fileName: 'TCI_MFA_2024-25.pdf',
        fileSize: '2.4 MB',
        uploadedDate: '2024-04-01',
        expiryDate: '2025-12-31',
        status: 'active',
        uploadedBy: 'Rajesh Sharma',
        documentNumber: 'MFA-TCI-2024-001',
        metadata: {
            validFrom: '2024-04-01',
            validTo: '2025-12-31',
            issuer: 'TCI Express Limited'
        }
    },
    {
        id: 'doc-tci-002',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'rate_card',
        category: 'financial',
        name: 'Rate Card FY 2024-25',
        fileName: 'TCI_RateCard_2024-25.xlsx',
        fileSize: '856 KB',
        uploadedDate: '2024-04-01',
        status: 'active',
        uploadedBy: 'Rajesh Sharma',
        documentNumber: 'RC-TCI-2024',
        metadata: {
            validFrom: '2024-04-01',
            routes: 'All India'
        }
    },
    {
        id: 'doc-tci-003',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'gst_cert',
        category: 'compliance',
        name: 'GST Registration Certificate - Haryana',
        fileName: 'TCI_GST_Haryana.pdf',
        fileSize: '1.2 MB',
        uploadedDate: '2023-07-15',
        expiryDate: '2026-03-31',
        status: 'active',
        uploadedBy: 'Compliance Team',
        documentNumber: '07AABCT1234F1Z5',
        metadata: {
            states: ['Haryana', 'Delhi', 'UP'],
            issuer: 'GST Department'
        }
    },
    {
        id: 'doc-tci-004',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'insurance',
        category: 'compliance',
        name: 'Cargo Insurance Certificate',
        fileName: 'TCI_Insurance_2024.pdf',
        fileSize: '1.8 MB',
        uploadedDate: '2024-11-15',
        expiryDate: '2025-01-14',
        status: 'pending_renewal',
        uploadedBy: 'Risk Management',
        documentNumber: 'INS-TCI-2024-789',
        metadata: {
            coverageAmount: '₹20 Crore',
            issuer: 'ICICI Lombard',
            validFrom: '2024-01-15',
            validTo: '2025-01-14'
        }
    },
    {
        id: 'doc-tci-005',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'pan_card',
        category: 'compliance',
        name: 'PAN Card Copy',
        fileName: 'TCI_PAN.pdf',
        fileSize: '245 KB',
        uploadedDate: '2023-01-10',
        status: 'active',
        uploadedBy: 'Finance Team',
        documentNumber: 'AABCT1234F'
    },
    {
        id: 'doc-tci-006',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'iso_cert',
        category: 'compliance',
        name: 'ISO 9001:2015 Certification',
        fileName: 'TCI_ISO9001.pdf',
        fileSize: '3.1 MB',
        uploadedDate: '2023-06-20',
        expiryDate: '2025-06-19',
        status: 'active',
        uploadedBy: 'Quality Team',
        documentNumber: 'ISO-TCI-2023-456',
        metadata: {
            issuer: 'Bureau Veritas',
            scope: 'Freight Transportation Services'
        }
    },
    {
        id: 'doc-tci-007',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'permit',
        category: 'operational',
        name: 'All India Permit',
        fileName: 'TCI_AllIndiaPermit.pdf',
        fileSize: '1.5 MB',
        uploadedDate: '2024-01-05',
        expiryDate: '2024-12-31',
        status: 'pending_renewal',
        uploadedBy: 'Operations Team',
        documentNumber: 'AIP-TCI-2024',
        metadata: {
            vehicleCount: '5000+',
            states: 'All India'
        }
    },

    // BLUE DART DOCUMENTS
    {
        id: 'doc-bd-001',
        partnerId: 'bluedart-express',
        partnerName: 'Blue Dart',
        type: 'contract',
        category: 'operational',
        name: 'Master Service Agreement 2024',
        fileName: 'BlueDart_MSA_2024.pdf',
        fileSize: '3.2 MB',
        uploadedDate: '2024-01-15',
        expiryDate: '2025-12-31',
        status: 'active',
        uploadedBy: 'Priya Desai',
        documentNumber: 'MSA-BD-2024-001'
    },
    {
        id: 'doc-bd-002',
        partnerId: 'bluedart-express',
        partnerName: 'Blue Dart',
        type: 'rate_card',
        category: 'financial',
        name: 'Express Rate Card 2024',
        fileName: 'BlueDart_Rates_2024.xlsx',
        fileSize: '1.1 MB',
        uploadedDate: '2024-01-15',
        status: 'active',
        uploadedBy: 'Priya Desai',
        documentNumber: 'RC-BD-2024'
    },
    {
        id: 'doc-bd-003',
        partnerId: 'bluedart-express',
        partnerName: 'Blue Dart',
        type: 'gst_cert',
        category: 'compliance',
        name: 'GST Certificate - Maharashtra',
        fileName: 'BlueDart_GST_MH.pdf',
        fileSize: '980 KB',
        uploadedDate: '2023-08-20',
        status: 'active',
        uploadedBy: 'Compliance Team',
        documentNumber: '27AABCB1234F1Z5'
    },
    {
        id: 'doc-bd-004',
        partnerId: 'bluedart-express',
        partnerName: 'Blue Dart',
        type: 'insurance',
        category: 'compliance',
        name: 'Air Cargo Insurance',
        fileName: 'BlueDart_AirInsurance.pdf',
        fileSize: '2.1 MB',
        uploadedDate: '2024-03-01',
        expiryDate: '2025-02-28',
        status: 'active',
        uploadedBy: 'Risk Team',
        documentNumber: 'INS-BD-2024-123',
        metadata: {
            coverageAmount: '₹15 Crore',
            issuer: 'HDFC ERGO'
        }
    },

    // DELHIVERY DOCUMENTS
    {
        id: 'doc-del-001',
        partnerId: 'delhivery',
        partnerName: 'Delhivery',
        type: 'contract',
        category: 'operational',
        name: 'Logistics Partnership Agreement',
        fileName: 'Delhivery_LPA_2024.pdf',
        fileSize: '2.8 MB',
        uploadedDate: '2024-02-01',
        expiryDate: '2025-12-31',
        status: 'active',
        uploadedBy: 'Amit Verma',
        documentNumber: 'LPA-DEL-2024-001'
    },
    {
        id: 'doc-del-002',
        partnerId: 'delhivery',
        partnerName: 'Delhivery',
        type: 'rate_card',
        category: 'financial',
        name: 'E-commerce Rate Card 2024',
        fileName: 'Delhivery_Ecom_Rates.xlsx',
        fileSize: '1.4 MB',
        uploadedDate: '2024-02-01',
        status: 'active',
        uploadedBy: 'Amit Verma',
        documentNumber: 'RC-DEL-2024'
    },
    {
        id: 'doc-del-003',
        partnerId: 'delhivery',
        partnerName: 'Delhivery',
        type: 'gst_cert',
        category: 'compliance',
        name: 'GST Registration - Haryana',
        fileName: 'Delhivery_GST_HR.pdf',
        fileSize: '1.1 MB',
        uploadedDate: '2023-09-10',
        status: 'active',
        uploadedBy: 'Compliance',
        documentNumber: '07AABCD1234F1Z5'
    },

    // VRL LOGISTICS DOCUMENTS
    {
        id: 'doc-vrl-001',
        partnerId: 'vrl-logistics',
        partnerName: 'VRL Logistics',
        type: 'contract',
        category: 'operational',
        name: 'Freight Services Agreement',
        fileName: 'VRL_FSA_2024.pdf',
        fileSize: '2.6 MB',
        uploadedDate: '2024-03-01',
        expiryDate: '2025-12-31',
        status: 'active',
        uploadedBy: 'Suresh Reddy',
        documentNumber: 'FSA-VRL-2024-001'
    },
    {
        id: 'doc-vrl-002',
        partnerId: 'vrl-logistics',
        partnerName: 'VRL Logistics',
        type: 'rate_card',
        category: 'financial',
        name: 'South India Rate Card',
        fileName: 'VRL_SouthRates_2024.xlsx',
        fileSize: '920 KB',
        uploadedDate: '2024-03-01',
        status: 'active',
        uploadedBy: 'Suresh Reddy',
        documentNumber: 'RC-VRL-2024'
    },
    {
        id: 'doc-vrl-003',
        partnerId: 'vrl-logistics',
        partnerName: 'VRL Logistics',
        type: 'gst_cert',
        category: 'compliance',
        name: 'GST Certificate - Karnataka',
        fileName: 'VRL_GST_KA.pdf',
        fileSize: '1.0 MB',
        uploadedDate: '2023-07-25',
        status: 'active',
        uploadedBy: 'Compliance',
        documentNumber: '29AABCV1234F1Z5'
    },

    // Sample shipment documents (LR, POD, E-way bills)
    {
        id: 'doc-ship-001',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'lr',
        category: 'shipment',
        name: 'Lorry Receipt - Delhi to Mumbai',
        fileName: 'LR_TCI_DEL_MUM_001.pdf',
        fileSize: '456 KB',
        uploadedDate: '2024-12-15',
        status: 'active',
        uploadedBy: 'Operations',
        documentNumber: 'LR-TCI-241215-001',
        relatedShipment: 'SHP-001',
        metadata: {
            route: 'Delhi → Mumbai',
            vehicleNumber: 'DL-1234',
            weight: '500 kg'
        }
    },
    {
        id: 'doc-ship-002',
        partnerId: 'tci-express',
        partnerName: 'TCI Express',
        type: 'pod',
        category: 'shipment',
        name: 'Proof of Delivery - Mumbai',
        fileName: 'POD_TCI_MUM_001.pdf',
        fileSize: '234 KB',
        uploadedDate: '2024-12-18',
        status: 'active',
        uploadedBy: 'Delivery Team',
        documentNumber: 'POD-TCI-241218-001',
        relatedShipment: 'SHP-001',
        metadata: {
            deliveredTo: 'Warehouse Manager',
            deliveryDate: '2024-12-18',
            signedBy: 'R. Patel'
        }
    },
    {
        id: 'doc-ship-003',
        partnerId: 'bluedart-express',
        partnerName: 'Blue Dart',
        type: 'eway_bill',
        category: 'shipment',
        name: 'E-way Bill - Bangalore to Chennai',
        fileName: 'Eway_BD_BLR_CHE_001.pdf',
        fileSize: '189 KB',
        uploadedDate: '2024-12-19',
        expiryDate: '2024-12-20',
        status: 'active',
        uploadedBy: 'Logistics',
        documentNumber: 'EWB-351234567890',
        relatedShipment: 'SHP-002',
        metadata: {
            route: 'Bangalore → Chennai',
            distance: '350 km',
            validityHours: '24'
        }
    }
];

// Document Service Class
export class DocumentService {
    static getAllDocuments(): LogisticsDocument[] {
        return MOCK_DOCUMENTS;
    }

    static getDocumentById(id: string): LogisticsDocument | undefined {
        return MOCK_DOCUMENTS.find(doc => doc.id === id);
    }

    static getDocumentsByPartner(partnerId: string): LogisticsDocument[] {
        return MOCK_DOCUMENTS.filter(doc => doc.partnerId === partnerId);
    }

    static getDocumentsByType(type: DocumentType): LogisticsDocument[] {
        return MOCK_DOCUMENTS.filter(doc => doc.type === type);
    }

    static getDocumentsByCategory(category: DocumentCategory): LogisticsDocument[] {
        return MOCK_DOCUMENTS.filter(doc => doc.category === category);
    }

    static getDocumentsByStatus(status: DocumentStatus): LogisticsDocument[] {
        return MOCK_DOCUMENTS.filter(doc => doc.status === status);
    }

    static getExpiringDocuments(days: number = 30): LogisticsDocument[] {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return MOCK_DOCUMENTS.filter(doc => {
            if (!doc.expiryDate) return false;
            const expiry = new Date(doc.expiryDate);
            return expiry >= today && expiry <= futureDate;
        });
    }

    static getExpiredDocuments(): LogisticsDocument[] {
        return MOCK_DOCUMENTS.filter(doc => doc.status === 'expired');
    }

    static searchDocuments(query: string): LogisticsDocument[] {
        const lowerQuery = query.toLowerCase();
        return MOCK_DOCUMENTS.filter(doc =>
            doc.name.toLowerCase().includes(lowerQuery) ||
            doc.fileName.toLowerCase().includes(lowerQuery) ||
            doc.documentNumber?.toLowerCase().includes(lowerQuery) ||
            doc.partnerName.toLowerCase().includes(lowerQuery)
        );
    }

    static getDocumentStats() {
        return {
            total: MOCK_DOCUMENTS.length,
            active: MOCK_DOCUMENTS.filter(d => d.status === 'active').length,
            expired: MOCK_DOCUMENTS.filter(d => d.status === 'expired').length,
            pendingRenewal: MOCK_DOCUMENTS.filter(d => d.status === 'pending_renewal').length,
            expiringIn30Days: this.getExpiringDocuments(30).length,
            byCategory: {
                shipment: MOCK_DOCUMENTS.filter(d => d.category === 'shipment').length,
                compliance: MOCK_DOCUMENTS.filter(d => d.category === 'compliance').length,
                financial: MOCK_DOCUMENTS.filter(d => d.category === 'financial').length,
                operational: MOCK_DOCUMENTS.filter(d => d.category === 'operational').length
            }
        };
    }

    static getDocumentTypeLabel(type: DocumentType): string {
        const labels: Record<DocumentType, string> = {
            lr: 'Lorry Receipt',
            pod: 'Proof of Delivery',
            eway_bill: 'E-way Bill',
            rate_card: 'Rate Card',
            gst_cert: 'GST Certificate',
            pan_card: 'PAN Card',
            insurance: 'Insurance Certificate',
            contract: 'Contract Agreement',
            permit: 'Transport Permit',
            iso_cert: 'ISO Certification',
            tan_reg: 'TAN Registration',
            bank_details: 'Bank Details',
            msme_cert: 'MSME Certificate'
        };
        return labels[type] || type;
    }

    // Mock upload function
    static uploadDocument(document: Omit<LogisticsDocument, 'id' | 'uploadedDate'>): LogisticsDocument {
        const newDoc: LogisticsDocument = {
            ...document,
            id: `doc-${Date.now()}`,
            uploadedDate: new Date().toISOString().split('T')[0]
        };
        MOCK_DOCUMENTS.push(newDoc);
        return newDoc;
    }

    // Mock download function
    static downloadDocument(documentId: string): boolean {
        const doc = this.getDocumentById(documentId);
        if (doc) {
            console.log(`Downloading: ${doc.fileName}`);
            // In real implementation, trigger file download
            return true;
        }
        return false;
    }

    // Mock delete function
    static deleteDocument(documentId: string): boolean {
        const index = MOCK_DOCUMENTS.findIndex(doc => doc.id === documentId);
        if (index !== -1) {
            MOCK_DOCUMENTS.splice(index, 1);
            return true;
        }
        return false;
    }
}

export default DocumentService;
