import { StorageService } from './storageService';
import { localDB } from './localDBService';

// Supplier Document Service - For Supplier Portal
// Manages supplier-specific documents like compliance, vehicle, driver docs



export type SupplierDocCategory = 'COMPLIANCE' | 'FINANCIAL' | 'VEHICLE' | 'DRIVER' | 'INSURANCE';
export type SupplierDocStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'REJECTED';

export interface SupplierDocument {
    id: string;
    name: string;
    category: SupplierDocCategory;
    status: SupplierDocStatus;
    uploadDate: string;
    expiryDate?: string;
    verifiedDate?: string;
    fileUrl?: string;
    fileSize?: string;
    description?: string;
    metadata?: {
        documentNumber?: string;
        issuingAuthority?: string;
        vehicleNumber?: string;
        driverName?: string;
        [key: string]: any;
    };
}

// TCI Express Supplier Documents (Initial Mock Data)
const TCI_EXPRESS_SUPPLIER_DOCS: SupplierDocument[] = [
    // COMPLIANCE DOCUMENTS
    {
        id: 'SUP-DOC-001',
        name: 'GST Registration Certificate',
        category: 'COMPLIANCE',
        status: 'ACTIVE',
        uploadDate: '2023-01-12',
        verifiedDate: '2023-01-12',
        fileUrl: '/sample-docs/tci-express/GST_Certificate.pdf',
        fileSize: '245 KB',
        description: 'Valid forever • Verified on 12 Jan 2023',
        metadata: {
            documentNumber: '27AABCT1234F1Z5',
            issuingAuthority: 'GST Department, Government of India'
        }
    },
    {
        id: 'SUP-DOC-002',
        name: 'PAN Card',
        category: 'COMPLIANCE',
        status: 'ACTIVE',
        uploadDate: '2023-01-12',
        verifiedDate: '2023-01-12',
        fileUrl: '/sample-docs/tci-express/PAN_Card.pdf',
        fileSize: '180 KB',
        description: 'Valid forever • Verified on 12 Jan 2023',
        metadata: {
            documentNumber: 'AABCT1234F',
            issuingAuthority: 'Income Tax Department'
        }
    },
    {
        id: 'SUP-DOC-003',
        name: 'MSME/Udyam Certificate',
        category: 'COMPLIANCE',
        status: 'ACTIVE',
        uploadDate: '2023-03-15',
        verifiedDate: '2023-03-15',
        fileUrl: '/sample-docs/tci-express/MSME_Certificate.pdf',
        fileSize: '320 KB',
        description: 'Valid forever • Verified on 15 Mar 2023',
        metadata: {
            documentNumber: 'UDYAM-MH-12-0012345',
            issuingAuthority: 'Ministry of MSME'
        }
    },
    {
        id: 'SUP-DOC-004',
        name: 'Shop & Establishment Act',
        category: 'COMPLIANCE',
        status: 'EXPIRING',
        uploadDate: '2023-01-10',
        expiryDate: '2025-01-10',
        verifiedDate: '2023-01-10',
        fileUrl: '/sample-docs/tci-express/Shop_Establishment.pdf',
        fileSize: '290 KB',
        description: 'Expiring in 12 days • Action Required',
        metadata: {
            documentNumber: 'SE/MH/2023/001234',
            issuingAuthority: 'Labour Department, Maharashtra'
        }
    },
    {
        id: 'SUP-DOC-005',
        name: 'Trade License',
        category: 'COMPLIANCE',
        status: 'ACTIVE',
        uploadDate: '2023-04-20',
        expiryDate: '2026-04-20',
        verifiedDate: '2023-04-20',
        fileUrl: '/sample-docs/tci-express/Trade_License.pdf',
        fileSize: '210 KB',
        description: 'Valid till Apr 2026',
        metadata: {
            documentNumber: 'TL/MH/2023/5678',
            issuingAuthority: 'Municipal Corporation'
        }
    },
    {
        id: 'SUP-DOC-006',
        name: 'ISO 9001:2015 Certification',
        category: 'COMPLIANCE',
        status: 'ACTIVE',
        uploadDate: '2023-06-20',
        expiryDate: '2025-06-19',
        verifiedDate: '2023-06-20',
        fileUrl: '/sample-docs/tci-express/ISO9001.pdf',
        fileSize: '3.1 MB',
        description: 'Valid till Jun 2025 • Bureau Veritas',
        metadata: {
            documentNumber: 'ISO-9001-2023-456',
            issuingAuthority: 'Bureau Veritas',
            scope: 'Freight Transportation Services'
        }
    },

    // FINANCIAL DOCUMENTS
    {
        id: 'SUP-DOC-007',
        name: 'Cancelled Cheque (Bank Proof)',
        category: 'FINANCIAL',
        status: 'ACTIVE',
        uploadDate: '2023-01-15',
        verifiedDate: '2023-01-15',
        fileUrl: '/sample-docs/tci-express/Bank_Proof.pdf',
        fileSize: '150 KB',
        description: 'Verified • HDFC Bank ****9921',
        metadata: {
            documentNumber: 'HDFC Bank - 50200012349921',
            issuingAuthority: 'HDFC Bank',
            accountNumber: '****9921',
            ifscCode: 'HDFC0001234',
            bankName: 'HDFC Bank',
            branch: 'Andheri West, Mumbai'
        }
    },
    {
        id: 'SUP-DOC-008',
        name: 'Tax Clearance Certificate',
        category: 'FINANCIAL',
        status: 'ACTIVE',
        uploadDate: '2024-04-01',
        expiryDate: '2025-03-31',
        verifiedDate: '2024-04-01',
        fileUrl: '/sample-docs/tci-express/Tax_Clearance.pdf',
        fileSize: '195 KB',
        description: 'Valid till Mar 2025',
        metadata: {
            documentNumber: 'TCC/2024/001234',
            issuingAuthority: 'Income Tax Department'
        }
    },
    {
        id: 'SUP-DOC-009',
        name: 'Audited Financial Statements FY 2023-24',
        category: 'FINANCIAL',
        status: 'ACTIVE',
        uploadDate: '2024-05-30',
        verifiedDate: '2024-06-05',
        fileUrl: '/sample-docs/tci-express/Financial_Statements_2024.pdf',
        fileSize: '2.8 MB',
        description: 'Audited by M/s Deloitte & Co',
        metadata: {
            documentNumber: 'AFS/2024/TCI',
            issuingAuthority: 'Deloitte Haskins & Sells',
            fiscalYear: '2023-24'
        }
    },

    // INSURANCE DOCUMENTS
    {
        id: 'SUP-DOC-010',
        name: 'Company Insurance Certificate',
        category: 'INSURANCE',
        status: 'ACTIVE',
        uploadDate: '2024-06-15',
        expiryDate: '2025-06-14',
        verifiedDate: '2024-06-15',
        fileUrl: '/sample-docs/tci-express/Insurance_Certificate.pdf',
        fileSize: '380 KB',
        description: 'Valid till Jun 2025 • ICICI Lombard',
        metadata: {
            documentNumber: 'POL/2024/567890',
            issuingAuthority: 'ICICI Lombard General Insurance',
            policyType: 'Comprehensive Commercial Insurance',
            coverageAmount: '₹50,00,000'
        }
    },
    {
        id: 'SUP-DOC-011',
        name: 'Cargo Insurance Policy',
        category: 'INSURANCE',
        status: 'ACTIVE',
        uploadDate: '2024-07-01',
        expiryDate: '2025-06-30',
        verifiedDate: '2024-07-01',
        fileUrl: '/sample-docs/tci-express/Cargo_Insurance.pdf',
        fileSize: '420 KB',
        description: 'Valid till Jun 2025 • National Insurance',
        metadata: {
            documentNumber: 'CARGO/2024/789012',
            issuingAuthority: 'National Insurance Company',
            policyType: 'Marine Cargo Insurance',
            coverageAmount: '₹2,00,00,000'
        }
    },

    // VEHICLE DOCUMENTS - Vehicle 1: MH02AB1234
    {
        id: 'SUP-DOC-012',
        name: 'Vehicle RC - MH02AB1234',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2023-02-10',
        expiryDate: '2038-02-10',
        verifiedDate: '2023-02-10',
        fileUrl: '/sample-docs/tci-express/Vehicle_RC_MH02AB1234.pdf',
        fileSize: '420 KB',
        description: '32ft Container Truck • Valid till 2038',
        metadata: {
            vehicleNumber: 'MH02AB1234',
            documentNumber: 'RC-MH02AB1234',
            issuingAuthority: 'RTO Mumbai',
            vehicleType: '32ft Multi-Axle Container',
            chassisNumber: 'MAT123456789',
            engineNumber: 'ENG987654321',
            make: 'Tata',
            model: 'LPT 3118',
            year: '2023'
        }
    },
    {
        id: 'SUP-DOC-013',
        name: 'Fitness Certificate - MH02AB1234',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-08-15',
        expiryDate: '2025-08-14',
        verifiedDate: '2024-08-15',
        fileUrl: '/sample-docs/tci-express/Fitness_MH02AB1234.pdf',
        fileSize: '180 KB',
        description: 'Valid till Aug 2025',
        metadata: {
            vehicleNumber: 'MH02AB1234',
            documentNumber: 'FIT/MH/2024/001234',
            issuingAuthority: 'RTO Mumbai'
        }
    },
    {
        id: 'SUP-DOC-014',
        name: 'PUC Certificate - MH02AB1234',
        category: 'VEHICLE',
        status: 'EXPIRING',
        uploadDate: '2024-11-20',
        expiryDate: '2025-01-20',
        verifiedDate: '2024-11-20',
        fileUrl: '/sample-docs/tci-express/PUC_MH02AB1234.pdf',
        fileSize: '95 KB',
        description: 'Expiring in 22 days',
        metadata: {
            vehicleNumber: 'MH02AB1234',
            documentNumber: 'PUC/2024/567890',
            issuingAuthority: 'Authorized PUC Center'
        }
    },
    {
        id: 'SUP-DOC-015',
        name: 'Vehicle Insurance - MH02AB1234',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-09-01',
        expiryDate: '2025-08-31',
        verifiedDate: '2024-09-01',
        fileUrl: '/sample-docs/tci-express/Vehicle_Insurance_MH02AB1234.pdf',
        fileSize: '340 KB',
        description: 'Valid till Aug 2025 • National Insurance',
        metadata: {
            vehicleNumber: 'MH02AB1234',
            documentNumber: 'POL/VEH/2024/123456',
            issuingAuthority: 'National Insurance Company',
            policyType: 'Comprehensive',
            coverageAmount: '₹15,00,000'
        }
    },
    {
        id: 'SUP-DOC-016',
        name: 'All India Permit - MH02AB1234',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-01-05',
        expiryDate: '2024-12-31',
        verifiedDate: '2024-01-05',
        fileUrl: '/sample-docs/tci-express/Permit_MH02AB1234.pdf',
        fileSize: '210 KB',
        description: 'Valid till Dec 2024',
        metadata: {
            vehicleNumber: 'MH02AB1234',
            documentNumber: 'AIP-MH-2024-001234',
            issuingAuthority: 'RTO Mumbai',
            permitType: 'All India Permit'
        }
    },

    // VEHICLE DOCUMENTS - Vehicle 2: MH02CD5678
    {
        id: 'SUP-DOC-017',
        name: 'Vehicle RC - MH02CD5678',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2023-05-20',
        expiryDate: '2038-05-20',
        verifiedDate: '2023-05-20',
        fileUrl: '/sample-docs/tci-express/Vehicle_RC_MH02CD5678.pdf',
        fileSize: '410 KB',
        description: '20ft Container Truck • Valid till 2038',
        metadata: {
            vehicleNumber: 'MH02CD5678',
            documentNumber: 'RC-MH02CD5678',
            issuingAuthority: 'RTO Mumbai',
            vehicleType: '20ft Single Axle Container',
            chassisNumber: 'MAT987654321',
            engineNumber: 'ENG123456789',
            make: 'Ashok Leyland',
            model: 'Ecomet 1615',
            year: '2023'
        }
    },
    {
        id: 'SUP-DOC-018',
        name: 'Fitness Certificate - MH02CD5678',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-10-10',
        expiryDate: '2025-10-09',
        verifiedDate: '2024-10-10',
        fileUrl: '/sample-docs/tci-express/Fitness_MH02CD5678.pdf',
        fileSize: '175 KB',
        description: 'Valid till Oct 2025',
        metadata: {
            vehicleNumber: 'MH02CD5678',
            documentNumber: 'FIT/MH/2024/005678',
            issuingAuthority: 'RTO Mumbai'
        }
    },
    {
        id: 'SUP-DOC-019',
        name: 'PUC Certificate - MH02CD5678',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-12-01',
        expiryDate: '2025-02-28',
        verifiedDate: '2024-12-01',
        fileUrl: '/sample-docs/tci-express/PUC_MH02CD5678.pdf',
        fileSize: '92 KB',
        description: 'Valid till Feb 2025',
        metadata: {
            vehicleNumber: 'MH02CD5678',
            documentNumber: 'PUC/2024/678901',
            issuingAuthority: 'Authorized PUC Center'
        }
    },
    {
        id: 'SUP-DOC-020',
        name: 'Vehicle Insurance - MH02CD5678',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-05-15',
        expiryDate: '2025-05-14',
        verifiedDate: '2024-05-15',
        fileUrl: '/sample-docs/tci-express/Vehicle_Insurance_MH02CD5678.pdf',
        fileSize: '335 KB',
        description: 'Valid till May 2025 • ICICI Lombard',
        metadata: {
            vehicleNumber: 'MH02CD5678',
            documentNumber: 'POL/VEH/2024/234567',
            issuingAuthority: 'ICICI Lombard General Insurance',
            policyType: 'Comprehensive',
            coverageAmount: '₹12,00,000'
        }
    },

    // VEHICLE DOCUMENTS - Vehicle 3: MH02EF9012
    {
        id: 'SUP-DOC-021',
        name: 'Vehicle RC - MH02EF9012',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-01-15',
        expiryDate: '2039-01-15',
        verifiedDate: '2024-01-15',
        fileUrl: '/sample-docs/tci-express/Vehicle_RC_MH02EF9012.pdf',
        fileSize: '425 KB',
        description: '24ft Open Body Truck • Valid till 2039',
        metadata: {
            vehicleNumber: 'MH02EF9012',
            documentNumber: 'RC-MH02EF9012',
            issuingAuthority: 'RTO Mumbai',
            vehicleType: '24ft Open Body',
            chassisNumber: 'MAT456789123',
            engineNumber: 'ENG654321987',
            make: 'Eicher',
            model: 'Pro 6025',
            year: '2024'
        }
    },
    {
        id: 'SUP-DOC-022',
        name: 'Fitness Certificate - MH02EF9012',
        category: 'VEHICLE',
        status: 'ACTIVE',
        uploadDate: '2024-11-01',
        expiryDate: '2025-10-31',
        verifiedDate: '2024-11-01',
        fileUrl: '/sample-docs/tci-express/Fitness_MH02EF9012.pdf',
        fileSize: '178 KB',
        description: 'Valid till Oct 2025',
        metadata: {
            vehicleNumber: 'MH02EF9012',
            documentNumber: 'FIT/MH/2024/009012',
            issuingAuthority: 'RTO Mumbai'
        }
    },

    // DRIVER DOCUMENTS - Driver 1: Ramesh Kumar
    {
        id: 'SUP-DOC-023',
        name: 'Driving License - Ramesh Kumar',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2023-03-10',
        expiryDate: '2043-03-10',
        verifiedDate: '2023-03-10',
        fileUrl: '/sample-docs/tci-express/Driver_License_DL001.pdf',
        fileSize: '220 KB',
        description: 'Valid till 2043 • Heavy Vehicle License',
        metadata: {
            driverName: 'Ramesh Kumar',
            documentNumber: 'MH0220230012345',
            issuingAuthority: 'RTO Mumbai',
            licenseType: 'Heavy Motor Vehicle',
            bloodGroup: 'B+',
            dateOfBirth: '1985-06-15'
        }
    },
    {
        id: 'SUP-DOC-024',
        name: 'Aadhar Card - Ramesh Kumar',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2023-03-10',
        verifiedDate: '2023-03-10',
        fileUrl: '/sample-docs/tci-express/Driver_Aadhar_001.pdf',
        fileSize: '180 KB',
        description: 'Verified Identity Proof',
        metadata: {
            driverName: 'Ramesh Kumar',
            documentNumber: 'XXXX-XXXX-1234',
            issuingAuthority: 'UIDAI'
        }
    },
    {
        id: 'SUP-DOC-025',
        name: 'Police Verification - Ramesh Kumar',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2023-03-15',
        expiryDate: '2026-03-15',
        verifiedDate: '2023-03-15',
        fileUrl: '/sample-docs/tci-express/Driver_Police_001.pdf',
        fileSize: '195 KB',
        description: 'Valid till Mar 2026',
        metadata: {
            driverName: 'Ramesh Kumar',
            documentNumber: 'PV/MH/2023/001234',
            issuingAuthority: 'Mumbai Police'
        }
    },
    {
        id: 'SUP-DOC-026',
        name: 'Medical Certificate - Ramesh Kumar',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2024-03-01',
        expiryDate: '2025-02-28',
        verifiedDate: '2024-03-01',
        fileUrl: '/sample-docs/tci-express/Driver_Medical_001.pdf',
        fileSize: '145 KB',
        description: 'Valid till Feb 2025',
        metadata: {
            driverName: 'Ramesh Kumar',
            documentNumber: 'MED/2024/001234',
            issuingAuthority: 'Certified Medical Practitioner',
            fitnesStatus: 'Fit for Heavy Vehicle Driving'
        }
    },

    // DRIVER DOCUMENTS - Driver 2: Suresh Patil
    {
        id: 'SUP-DOC-027',
        name: 'Driving License - Suresh Patil',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2023-06-20',
        expiryDate: '2043-06-20',
        verifiedDate: '2023-06-20',
        fileUrl: '/sample-docs/tci-express/Driver_License_DL002.pdf',
        fileSize: '215 KB',
        description: 'Valid till 2043 • Heavy Vehicle License',
        metadata: {
            driverName: 'Suresh Patil',
            documentNumber: 'MH0220230056789',
            issuingAuthority: 'RTO Mumbai',
            licenseType: 'Heavy Motor Vehicle',
            bloodGroup: 'O+',
            dateOfBirth: '1988-09-22'
        }
    },
    {
        id: 'SUP-DOC-028',
        name: 'Aadhar Card - Suresh Patil',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2023-06-20',
        verifiedDate: '2023-06-20',
        fileUrl: '/sample-docs/tci-express/Driver_Aadhar_002.pdf',
        fileSize: '175 KB',
        description: 'Verified Identity Proof',
        metadata: {
            driverName: 'Suresh Patil',
            documentNumber: 'XXXX-XXXX-5678',
            issuingAuthority: 'UIDAI'
        }
    },
    {
        id: 'SUP-DOC-029',
        name: 'Police Verification - Suresh Patil',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2023-06-25',
        expiryDate: '2026-06-25',
        verifiedDate: '2023-06-25',
        fileUrl: '/sample-docs/tci-express/Driver_Police_002.pdf',
        fileSize: '190 KB',
        description: 'Valid till Jun 2026',
        metadata: {
            driverName: 'Suresh Patil',
            documentNumber: 'PV/MH/2023/005678',
            issuingAuthority: 'Mumbai Police'
        }
    },

    // DRIVER DOCUMENTS - Driver 3: Vijay Sharma
    {
        id: 'SUP-DOC-030',
        name: 'Driving License - Vijay Sharma',
        category: 'DRIVER',
        status: 'ACTIVE',
        uploadDate: '2024-02-10',
        expiryDate: '2044-02-10',
        verifiedDate: '2024-02-10',
        fileUrl: '/sample-docs/tci-express/Driver_License_DL003.pdf',
        fileSize: '218 KB',
        description: 'Valid till 2044 • Heavy Vehicle License',
        metadata: {
            driverName: 'Vijay Sharma',
            documentNumber: 'MH0220240012345',
            issuingAuthority: 'RTO Mumbai',
            licenseType: 'Heavy Motor Vehicle',
            bloodGroup: 'A+',
            dateOfBirth: '1990-12-05'
        }
    }
];

class SupplierDocumentService {
    private STORAGE_KEY = 'supplier_documents_v1';

    // Helper to get fresh data
    private getStore(): SupplierDocument[] {
        return StorageService.load<SupplierDocument[]>(this.STORAGE_KEY, TCI_EXPRESS_SUPPLIER_DOCS);
    }

    getAllDocuments(): SupplierDocument[] {
        return this.getStore();
    }

    // --- WRITE OPERATIONS ---

    // --- WRITE OPERATIONS (PYTHON BACKEND) ---

    async uploadDocument(doc: SupplierDocument, file?: File): Promise<void> {
        if (!file) {
            console.error("File is required for backend upload");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', doc.name);
        formData.append('category', doc.category);
        formData.append('description', doc.description || '');

        try {
            const response = await fetch('http://localhost:5000/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Uploaded to Python Backend:", data);

            // Update Metadata Cache (Optimistic functionality)
            const currentDocs = this.getStore();
            const newDoc = { ...doc, id: data.id, status: 'PENDING_VERIFICATION' as SupplierDocStatus };
            StorageService.save(this.STORAGE_KEY, [newDoc, ...currentDocs]);

        } catch (error) {
            console.error("Backend Upload Error:", error);
            throw error;
        }
    }

    // --- READ OPERATIONS ---

    async getDocumentFile(docId: string): Promise<Blob | null> {
        try {
            // Check if it's a backend file (starts with SUP-DOC-)
            // Note: Mock IDs also start with SUP-DOC, but we assume new ones are dynamic.

            const response = await fetch(`http://localhost:5000/api/documents/${docId}/view`);
            if (response.ok) {
                return await response.blob();
            }
        } catch (e) {
            console.warn("Backend fetch failed, trying fallback...", e);
        }
        return null;
    }
    // --- READ OPERATIONS ---

    getDocumentsByCategory(category: SupplierDocCategory): SupplierDocument[] {
        return this.getStore().filter(doc => doc.category === category);
    }

    getDocumentsByStatus(status: SupplierDocStatus): SupplierDocument[] {
        return this.getStore().filter(doc => doc.status === status);
    }

    getDocumentById(id: string): SupplierDocument | undefined {
        return this.getStore().find(doc => doc.id === id);
    }

    searchDocuments(query: string): SupplierDocument[] {
        const lowerQuery = query.toLowerCase();
        return this.getStore().filter(doc =>
            doc.name.toLowerCase().includes(lowerQuery) ||
            doc.description?.toLowerCase().includes(lowerQuery) ||
            doc.metadata?.documentNumber?.toLowerCase().includes(lowerQuery) ||
            doc.metadata?.vehicleNumber?.toLowerCase().includes(lowerQuery) ||
            doc.metadata?.driverName?.toLowerCase().includes(lowerQuery)
        );
    }

    getExpiringDocuments(days: number = 30): SupplierDocument[] {
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

        return this.getStore().filter(doc => {
            if (!doc.expiryDate) return false;
            const expiryDate = new Date(doc.expiryDate);
            return expiryDate > today && expiryDate <= futureDate;
        });
    }

    getExpiredDocuments(): SupplierDocument[] {
        const today = new Date();
        return this.getStore().filter(doc => {
            if (!doc.expiryDate) return false;
            return new Date(doc.expiryDate) < today;
        });
    }

    getDocumentStats() {
        const docs = this.getStore();
        return {
            total: docs.length,
            active: docs.filter(d => d.status === 'ACTIVE').length,
            expiring: docs.filter(d => d.status === 'EXPIRING').length,
            expired: docs.filter(d => d.status === 'EXPIRED').length,
            pending: docs.filter(d => d.status === 'PENDING_VERIFICATION').length,
            byCategory: {
                compliance: docs.filter(d => d.category === 'COMPLIANCE').length,
                financial: docs.filter(d => d.category === 'FINANCIAL').length,
                vehicle: docs.filter(d => d.category === 'VEHICLE').length,
                driver: docs.filter(d => d.category === 'DRIVER').length,
                insurance: docs.filter(d => d.category === 'INSURANCE').length
            }
        };
    }

    getDaysUntilExpiry(expiryDate: string): number {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get vehicle-specific documents
    getVehicleDocuments(vehicleNumber: string): SupplierDocument[] {
        return this.getStore().filter(doc =>
            doc.category === 'VEHICLE' &&
            doc.metadata?.vehicleNumber === vehicleNumber
        );
    }

    // Get driver-specific documents
    getDriverDocuments(driverName: string): SupplierDocument[] {
        return this.getStore().filter(doc =>
            doc.category === 'DRIVER' &&
            doc.metadata?.driverName === driverName
        );
    }

    // Get unique vehicle numbers
    getVehicleNumbers(): string[] {
        const vehicles = new Set<string>();
        this.getStore().forEach(doc => {
            if (doc.metadata?.vehicleNumber) {
                vehicles.add(doc.metadata.vehicleNumber);
            }
        });
        return Array.from(vehicles);
    }

    // Get unique driver names
    getDriverNames(): string[] {
        const drivers = new Set<string>();
        this.getStore().forEach(doc => {
            if (doc.metadata?.driverName) {
                drivers.add(doc.metadata.driverName);
            }
        });
        return Array.from(drivers);
    }

}

export const supplierDocumentService = new SupplierDocumentService();
