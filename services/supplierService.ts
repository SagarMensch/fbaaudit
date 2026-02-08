// Global Supplier Management Service
// Hitachi-style global logistics context with international suppliers

export interface GlobalDocument {
    id: string;
    name: string;
    type: 'contract' | 'rate_card' | 'vat' | 'tax_id' | 'insurance' | 'certificate' | 'iso' | 'bol_format' | 'pod_format' | 'bank_details' | 'other';
    url: string;
    uploadedDate: string;
    expiryDate?: string;
    status: 'active' | 'expired' | 'pending_renewal';
    fileSize: string;
    uploadedBy: string;
}

export interface SupplierContact {
    name: string;
    title: string;
    email: string;
    phone: string;
    type: 'primary' | 'escalation' | 'operations' | 'finance';
}

export interface SupplierPerformance {
    onTimeDelivery: number;
    firstAttemptSuccess: number;
    damageRate: number;
    avgTransitTime: string;
    podReturnTime: string;
    customerSatisfaction: number;
}

export interface GlobalRateLine {
    origin: string;
    destination: string;
    mode: 'Ground Express' | 'FTL' | 'LTL' | 'Air Express' | 'Ocean FCL' | 'Ocean LCL';
    baseRate: number;
    unit: 'lb' | 'shipment' | 'container' | 'kg';
    weightSlab?: string; // e.g., "0-50 lb", "100-500 kg"
    fuelSurcharge: number; // percentage
    tax: number; // percentage
    additionalCharges: {
        name: string;
        amount: number;
        unit?: string;
    }[];
}

export interface SupplierNotification {
    id: string;
    from: 'organization' | 'supplier';
    to: 'organization' | 'supplier';
    type: 'rate_negotiation' | 'pod_pending' | 'detention_dispute' | 'urgent_booking' | 'damage_claim' | 'tracking' | 'delay_alert' | 'pod_scanned' | 'invoice' | 'rate_revision';
    subject: string;
    message: string;
    timestamp: string;
    read: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    attachments?: string[];
}

export interface GlobalSupplier {
    id: string;
    name: string;
    fullName: string;
    logo: string;
    type: 'ground' | 'express' | 'air' | 'ocean' | 'multimodal';
    status: 'active' | 'inactive' | 'suspended';

    // Company Info
    headquarters: string;
    founded: number;
    website: string;
    description: string;
    stockListed: boolean;

    // Service Coverage
    coverage: {
        regions: string[];
        strongIn: string[];
        countries: string;
        facilities: number;
        specialization: string[];
    };

    // Contacts
    contacts: SupplierContact[];

    // Financial (Global Context)
    financial: {
        paymentTerms: string;
        creditLimit: number;
        vatNumber: string;
        taxId: string;
        dunsNumber: string;
        withholdingRate: number; // percentage
        bankName: string;
        accountType: string;
        currency: string;
    };

    // Performance
    performance: SupplierPerformance;

    // Documents
    documents: GlobalDocument[];

    // Rate Master (Global Routes)
    rates: GlobalRateLine[];

    // Notifications
    notifications: SupplierNotification[];

    // Metadata
    createdDate: string;
    lastUpdated: string;
    contractExpiry: string;

    // Backward compatibility aliases
    gstin?: string;
    contactPerson?: string;
}

// ==================== GLOBAL SUPPLIER DATA ====================

export const GLOBAL_SUPPLIERS: GlobalSupplier[] = [
    // 1. DHL EXPRESS
    {
        id: 'dhl-express',
        name: 'DHL Express',
        fullName: 'DHL Express (USA), Inc.',
        logo: '📦',
        type: 'express',
        status: 'active',
        headquarters: 'Plantation, Florida, USA',
        founded: 1969,
        website: 'https://www.dhl.com',
        description: 'World\'s leading international express and logistics company with global network spanning 220+ countries.',
        stockListed: true,

        coverage: {
            regions: ['Americas', 'Europe', 'Asia-Pacific', 'Middle East', 'Africa'],
            strongIn: ['USA', 'Germany', 'UK', 'China', 'Japan', 'Singapore'],
            countries: '220+',
            facilities: 5000,
            specialization: ['International Express', 'E-commerce', 'Life Sciences', 'Automotive', 'Technology']
        },

        contacts: [
            {
                name: 'Michael Thompson',
                title: 'Global Account Director',
                email: 'michael.thompson@dhl.com',
                phone: '+1-954-888-7000',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 30 days',
            creditLimit: 500000,
            vatNumber: 'DE123456789',
            taxId: '65-0843887',
            dunsNumber: '00-470-4588',
            withholdingRate: 0,
            bankName: 'Deutsche Bank, Frankfurt',
            accountType: 'Corporate Account',
            currency: 'USD'
        },

        performance: {
            onTimeDelivery: 97.5,
            firstAttemptSuccess: 94.0,
            damageRate: 0.2,
            avgTransitTime: '24-48 hours',
            podReturnTime: '2 days',
            customerSatisfaction: 4.7
        },

        documents: [
            {
                id: 'dhl-master-agreement',
                name: 'Master Service Agreement 2024',
                type: 'contract',
                url: '/documents/dhl/MSA_DHL_2024.pdf',
                uploadedDate: '2024-01-15',
                expiryDate: '2025-01-14',
                status: 'active',
                fileSize: '2.4 MB',
                uploadedBy: 'Michael Thompson'
            },
            {
                id: 'dhl-rate-card',
                name: 'Rate Card 2024-2025',
                type: 'rate_card',
                url: '/documents/dhl/Rate_DHL_2025.pdf',
                uploadedDate: '2024-01-15',
                status: 'active',
                fileSize: '890 KB',
                uploadedBy: 'Michael Thompson'
            },
            {
                id: 'dhl-insurance',
                name: 'Certificate of Insurance',
                type: 'insurance',
                url: '/documents/dhl/COI_DHL_2024.pdf',
                uploadedDate: '2024-03-01',
                expiryDate: '2025-03-01',
                status: 'active',
                fileSize: '156 KB',
                uploadedBy: 'Risk Management'
            },
            {
                id: 'dhl-iso',
                name: 'ISO 9001:2015 Certification',
                type: 'iso',
                url: '/documents/dhl/ISO_9001_DHL.pdf',
                uploadedDate: '2024-02-10',
                expiryDate: '2027-02-10',
                status: 'active',
                fileSize: '245 KB',
                uploadedBy: 'Compliance'
            }
        ],

        rates: [
            {
                origin: 'Los Angeles',
                destination: 'Tokyo',
                mode: 'Air Express',
                baseRate: 8.50,
                unit: 'lb',
                fuelSurcharge: 18,
                tax: 0,
                additionalCharges: [{ name: 'Security Fee', amount: 0.15, unit: 'lb' }]
            },
            {
                origin: 'New York',
                destination: 'London',
                mode: 'Air Express',
                baseRate: 6.25,
                unit: 'lb',
                fuelSurcharge: 16,
                tax: 0,
                additionalCharges: []
            }
        ],

        notifications: [],
        createdDate: '2020-03-15',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-01-14'
    },

    // 2. FEDEX LOGISTICS
    {
        id: 'fedex-logistics',
        name: 'FedEx',
        fullName: 'FedEx Corporation',
        logo: '✈️',
        type: 'multimodal',
        status: 'active',
        headquarters: 'Memphis, Tennessee, USA',
        founded: 1971,
        website: 'https://www.fedex.com',
        description: 'Premier global transportation and logistics company offering express, ground, freight, and supply chain solutions.',
        stockListed: true,

        coverage: {
            regions: ['Americas', 'Europe', 'Asia-Pacific'],
            strongIn: ['USA', 'Canada', 'Mexico', 'UK', 'Germany', 'Japan'],
            countries: '220+',
            facilities: 6500,
            specialization: ['Express Delivery', 'Ground Shipping', 'Freight', 'E-commerce', 'Cold Chain']
        },

        contacts: [
            {
                name: 'Jennifer Martinez',
                title: 'Enterprise Solutions Manager',
                email: 'jennifer.martinez@fedex.com',
                phone: '+1-800-463-3339',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 30 days',
            creditLimit: 750000,
            vatNumber: 'US62-1721435',
            taxId: '62-1721435',
            dunsNumber: '05-080-8535',
            withholdingRate: 0,
            bankName: 'First Tennessee Bank',
            accountType: 'Corporate Account',
            currency: 'USD'
        },

        performance: {
            onTimeDelivery: 98.2,
            firstAttemptSuccess: 95.5,
            damageRate: 0.15,
            avgTransitTime: '24 hours',
            podReturnTime: '1 day',
            customerSatisfaction: 4.8
        },

        documents: [
            {
                id: 'fedex-agreement',
                name: 'Corporate Transportation Agreement 2024',
                type: 'contract',
                url: '/documents/fedex/CTA_FedEx_2024.pdf',
                uploadedDate: '2024-02-01',
                expiryDate: '2025-01-31',
                status: 'active',
                fileSize: '1.9 MB',
                uploadedBy: 'Jennifer Martinez'
            },
            {
                id: 'fedex-rate-schedule',
                name: 'Rate Schedule 2025',
                type: 'rate_card',
                url: '/documents/fedex/Rate_FedEx_2025.pdf',
                uploadedDate: '2024-12-01',
                status: 'active',
                fileSize: '1.4 MB',
                uploadedBy: 'Jennifer Martinez'
            },
            {
                id: 'fedex-w9',
                name: 'W-9 Form',
                type: 'tax_id',
                url: '/documents/fedex/W9_FedEx.pdf',
                uploadedDate: '2024-01-05',
                status: 'active',
                fileSize: '85 KB',
                uploadedBy: 'Finance'
            }
        ],

        rates: [
            {
                origin: 'Memphis',
                destination: 'Chicago',
                mode: 'Ground Express',
                baseRate: 3.25,
                unit: 'lb',
                fuelSurcharge: 14,
                tax: 0,
                additionalCharges: []
            },
            {
                origin: 'Los Angeles',
                destination: 'New York',
                mode: 'Air Express',
                baseRate: 5.50,
                unit: 'lb',
                fuelSurcharge: 17,
                tax: 0,
                additionalCharges: []
            }
        ],

        notifications: [],
        createdDate: '2019-08-20',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-01-31'
    },

    // 3. MAERSK LOGISTICS
    {
        id: 'maersk-logistics',
        name: 'Maersk',
        fullName: 'A.P. Moller - Maersk A/S',
        logo: '🚢',
        type: 'ocean',
        status: 'active',
        headquarters: 'Copenhagen, Denmark',
        founded: 1904,
        website: 'https://www.maersk.com',
        description: 'World\'s largest container shipping company and integrated logistics provider.',
        stockListed: true,

        coverage: {
            regions: ['Global Ocean Network', 'Americas', 'Europe', 'Asia', 'Africa'],
            strongIn: ['Rotterdam', 'Singapore', 'Shanghai', 'Los Angeles', 'Hamburg'],
            countries: '130+',
            facilities: 750,
            specialization: ['Ocean Container', 'Intermodal', 'Warehousing', 'Cold Chain', 'Customs Brokerage']
        },

        contacts: [
            {
                name: 'Henrik Andersen',
                title: 'Senior Commercial Manager',
                email: 'henrik.andersen@maersk.com',
                phone: '+45-33-63-3363',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 45 days',
            creditLimit: 1000000,
            vatNumber: 'DK22756214',
            taxId: '22756214',
            dunsNumber: '36-962-1884',
            withholdingRate: 0,
            bankName: 'Danske Bank, Copenhagen',
            accountType: 'Corporate Account',
            currency: 'USD'
        },

        performance: {
            onTimeDelivery: 88.5,
            firstAttemptSuccess: 92.0,
            damageRate: 0.8,
            avgTransitTime: '21-35 days',
            podReturnTime: '5 days',
            customerSatisfaction: 4.3
        },

        documents: [
            {
                id: 'maersk-contract',
                name: 'Service Contract 2024-2025',
                type: 'contract',
                url: '/documents/maersk/SC_Maersk_2025.pdf',
                uploadedDate: '2024-04-01',
                expiryDate: '2025-03-31',
                status: 'active',
                fileSize: '3.8 MB',
                uploadedBy: 'Henrik Andersen'
            },
            {
                id: 'maersk-tariff',
                name: 'Global Tariff Schedule',
                type: 'rate_card',
                url: '/documents/maersk/Tariff_Maersk_2025.pdf',
                uploadedDate: '2024-04-01',
                status: 'active',
                fileSize: '2.1 MB',
                uploadedBy: 'Henrik Andersen'
            },
            {
                id: 'maersk-iso-14001',
                name: 'ISO 14001 Environmental Certification',
                type: 'iso',
                url: '/documents/maersk/ISO_14001_Maersk.pdf',
                uploadedDate: '2024-01-15',
                expiryDate: '2026-01-15',
                status: 'active',
                fileSize: '312 KB',
                uploadedBy: 'Sustainability'
            }
        ],

        rates: [
            {
                origin: 'Shanghai',
                destination: 'Los Angeles',
                mode: 'Ocean FCL',
                baseRate: 2800,
                unit: 'container',
                fuelSurcharge: 25,
                tax: 0,
                additionalCharges: [
                    { name: 'Terminal Handling', amount: 350, unit: 'container' },
                    { name: 'Documentation', amount: 75, unit: 'shipment' }
                ]
            },
            {
                origin: 'Rotterdam',
                destination: 'New York',
                mode: 'Ocean FCL',
                baseRate: 1950,
                unit: 'container',
                fuelSurcharge: 22,
                tax: 0,
                additionalCharges: [
                    { name: 'Terminal Handling', amount: 285, unit: 'container' }
                ]
            }
        ],

        notifications: [],
        createdDate: '2021-05-10',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-03-31'
    },

    // 4. KUEHNE+NAGEL
    {
        id: 'kuehne-nagel',
        name: 'Kuehne+Nagel',
        fullName: 'Kuehne + Nagel International AG',
        logo: '🌐',
        type: 'multimodal',
        status: 'active',
        headquarters: 'Schindellegi, Switzerland',
        founded: 1890,
        website: 'https://www.kuehne-nagel.com',
        description: 'Global leader in sea freight, air freight, contract logistics and overland transportation.',
        stockListed: true,

        coverage: {
            regions: ['Europe', 'Americas', 'Asia-Pacific', 'Middle East', 'Africa'],
            strongIn: ['Switzerland', 'Germany', 'USA', 'Singapore', 'Netherlands'],
            countries: '100+',
            facilities: 1400,
            specialization: ['Pharma & Healthcare', 'Aerospace', 'High-Tech', 'Perishables', 'Project Logistics']
        },

        contacts: [
            {
                name: 'Stefan Mueller',
                title: 'VP Strategic Accounts - Americas',
                email: 'stefan.mueller@kuehne-nagel.com',
                phone: '+41-44-786-9511',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 30 days',
            creditLimit: 600000,
            vatNumber: 'CHE-107.956.209',
            taxId: 'CHE-107.956.209',
            dunsNumber: '41-594-6831',
            withholdingRate: 0,
            bankName: 'UBS, Zurich',
            accountType: 'Corporate Account',
            currency: 'USD'
        },

        performance: {
            onTimeDelivery: 94.8,
            firstAttemptSuccess: 96.5,
            damageRate: 0.3,
            avgTransitTime: '3-7 days',
            podReturnTime: '3 days',
            customerSatisfaction: 4.6
        },

        documents: [
            {
                id: 'kn-framework',
                name: 'Framework Agreement 2024',
                type: 'contract',
                url: '/documents/kn/Framework_KN_2024.pdf',
                uploadedDate: '2024-02-15',
                expiryDate: '2025-02-14',
                status: 'active',
                fileSize: '2.7 MB',
                uploadedBy: 'Stefan Mueller'
            },
            {
                id: 'kn-rates',
                name: 'Rate Card Q1 2025',
                type: 'rate_card',
                url: '/documents/kn/Rate_KN_Q1_2025.pdf',
                uploadedDate: '2024-12-10',
                status: 'active',
                fileSize: '1.1 MB',
                uploadedBy: 'Stefan Mueller'
            },
            {
                id: 'kn-gdp',
                name: 'GDP Certification (Pharma)',
                type: 'certificate',
                url: '/documents/kn/GDP_Certificate_KN.pdf',
                uploadedDate: '2024-06-01',
                expiryDate: '2026-06-01',
                status: 'active',
                fileSize: '420 KB',
                uploadedBy: 'Quality Assurance'
            }
        ],

        rates: [
            {
                origin: 'Frankfurt',
                destination: 'Chicago',
                mode: 'Air Express',
                baseRate: 4.80,
                unit: 'kg',
                fuelSurcharge: 19,
                tax: 0,
                additionalCharges: [{ name: 'Temperature Control', amount: 0.35, unit: 'kg' }]
            },
            {
                origin: 'Singapore',
                destination: 'Amsterdam',
                mode: 'Air Express',
                baseRate: 5.20,
                unit: 'kg',
                fuelSurcharge: 21,
                tax: 0,
                additionalCharges: []
            }
        ],

        notifications: [],
        createdDate: '2022-01-20',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-02-14'
    },

    // 5. UPS FREIGHT
    {
        id: 'ups-freight',
        name: 'UPS',
        fullName: 'United Parcel Service, Inc.',
        logo: '📬',
        type: 'multimodal',
        status: 'active',
        headquarters: 'Atlanta, Georgia, USA',
        founded: 1907,
        website: 'https://www.ups.com',
        description: 'Global leader in logistics offering package delivery, freight transportation, and supply chain management.',
        stockListed: true,

        coverage: {
            regions: ['Americas', 'Europe', 'Asia-Pacific'],
            strongIn: ['USA', 'Canada', 'Germany', 'UK', 'China'],
            countries: '220+',
            facilities: 2800,
            specialization: ['Package Delivery', 'LTL Freight', 'Healthcare Logistics', 'Retail', 'Manufacturing']
        },

        contacts: [
            {
                name: 'David Wilson',
                title: 'Director of Enterprise Accounts',
                email: 'david.wilson@ups.com',
                phone: '+1-404-828-6000',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 30 days',
            creditLimit: 800000,
            vatNumber: 'US58-2480149',
            taxId: '58-2480149',
            dunsNumber: '00-469-5200',
            withholdingRate: 0,
            bankName: 'SunTrust Bank, Atlanta',
            accountType: 'Corporate Account',
            currency: 'USD'
        },

        performance: {
            onTimeDelivery: 97.8,
            firstAttemptSuccess: 93.2,
            damageRate: 0.25,
            avgTransitTime: '24-72 hours',
            podReturnTime: '1 day',
            customerSatisfaction: 4.5
        },

        documents: [
            {
                id: 'ups-service-agreement',
                name: 'Service Agreement 2024',
                type: 'contract',
                url: '/documents/ups/SA_UPS_2024.pdf',
                uploadedDate: '2024-03-01',
                expiryDate: '2025-02-28',
                status: 'active',
                fileSize: '2.2 MB',
                uploadedBy: 'David Wilson'
            },
            {
                id: 'ups-tariff',
                name: 'Tariff Schedule 2025',
                type: 'rate_card',
                url: '/documents/ups/Tariff_UPS_2025.pdf',
                uploadedDate: '2024-12-01',
                status: 'active',
                fileSize: '980 KB',
                uploadedBy: 'David Wilson'
            }
        ],

        rates: [
            {
                origin: 'Atlanta',
                destination: 'Dallas',
                mode: 'Ground Express',
                baseRate: 2.85,
                unit: 'lb',
                fuelSurcharge: 12,
                tax: 0,
                additionalCharges: []
            },
            {
                origin: 'Chicago',
                destination: 'Miami',
                mode: 'LTL',
                baseRate: 1.95,
                unit: 'lb',
                fuelSurcharge: 13,
                tax: 0,
                additionalCharges: [{ name: 'Liftgate', amount: 85, unit: 'shipment' }]
            }
        ],

        notifications: [],
        createdDate: '2020-06-15',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-02-28'
    }
];

// Backward compatibility - alias for legacy code
export const INDIAN_SUPPLIERS = GLOBAL_SUPPLIERS;
export type IndianSupplier = GlobalSupplier;
export type IndianDocument = GlobalDocument;
export type IndianRateLine = GlobalRateLine;

// ==================== SERVICE FUNCTIONS ====================
// SAP-style: API is source of truth, fallback to static data for offline mode
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class GlobalSupplierService {
    private static vendors: any[] = [];
    private static loaded = false;

    // ===================================
    // ASYNC API METHODS (Primary - PostgreSQL via FastAPI)
    // ===================================

    static async loadFromAPI(): Promise<void> {
        try {
            const response = await fetch(`${API_BASE}/api/vendors`);
            if (response.ok) {
                const result = await response.json();
                // SAP-style response: { data: [...], meta: {...} }
                if (Array.isArray(result.data)) {
                    // Transform DB vendors to frontend format
                    this.vendors = result.data.map((v: any) => this.transformVendorToSupplier(v));
                    this.loaded = true;
                    console.log(`[SupplierService] Loaded ${this.vendors.length} vendors from PostgreSQL`);
                }
            }
        } catch (error) {
            console.error('[SupplierService] API error, using fallback:', error);
        }
    }

    /**
     * Transform database vendor format to GlobalSupplier format
     */
    static transformVendorToSupplier(vendor: any): GlobalSupplier {
        return {
            id: vendor.id,
            name: vendor.name,
            fullName: vendor.name,
            logo: this.getVendorLogo(vendor.type),
            type: this.mapVendorType(vendor.type),
            status: vendor.is_active ? 'active' : 'inactive',
            headquarters: `${vendor.city || ''}, ${vendor.state || ''}`.trim(),
            founded: 2000,
            website: `https://${vendor.name?.toLowerCase().replace(/\s+/g, '')}.com`,
            description: `${vendor.name} - ${vendor.type || 'Freight Provider'}`,
            stockListed: true,
            coverage: {
                regions: ['Americas', 'EMEA', 'APAC'],
                strongIn: [vendor.state || 'Global'],
                countries: 'Global',
                facilities: 100,
                specialization: [vendor.type || 'Freight']
            },
            contacts: vendor.contact_name ? [{
                name: vendor.contact_name,
                title: 'Account Manager',
                email: vendor.contact_email || '',
                phone: vendor.contact_phone || '',
                type: 'primary'
            }] : [],
            financial: {
                paymentTerms: 'Net 30',
                creditLimit: 500000,
                vatNumber: '',
                taxId: '',
                dunsNumber: '',
                withholdingRate: 0,
                bankName: '',
                accountType: 'Corporate',
                currency: 'USD'
            },
            performance: {
                onTimeDelivery: 95,
                firstAttemptSuccess: 92,
                damageRate: 0.5,
                avgTransitTime: '3-5 days',
                podReturnTime: '24 hours',
                customerSatisfaction: 4.5
            },
            documents: [],
            rates: [],
            notifications: [],
            createdDate: vendor.created_at || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            contractExpiry: '2026-12-31'
        };
    }

    static getVendorLogo(type: string): string {
        const logos: Record<string, string> = {
            'FREIGHT_FORWARDER': '🚢',
            'COURIER': '📦',
            'TRANSPORTER': '🚚',
            '3PL': '📋'
        };
        return logos[type] || '📦';
    }

    static mapVendorType(apiType: string): GlobalSupplier['type'] {
        const mapping: Record<string, GlobalSupplier['type']> = {
            'FREIGHT_FORWARDER': 'ocean',
            'COURIER': 'express',
            'TRANSPORTER': 'ground',
            '3PL': 'multimodal'
        };
        return mapping[apiType?.toUpperCase()] || 'multimodal';
    }

    static async fetchAllVendorsAsync(): Promise<any[]> {
        await this.loadFromAPI();
        // Merge API vendors with static data for comprehensive list
        if (this.vendors.length > 0) {
            return this.vendors;
        }
        return GLOBAL_SUPPLIERS;
    }

    static async fetchVendorByIdAsync(id: string): Promise<any | null> {
        try {
            const response = await fetch(`${API_BASE}/api/vendors/${id}`);
            if (response.ok) {
                const result = await response.json();
                // SAP-style response: { data: {...}, meta: {...}, contracts: [...] }
                if (result.data) {
                    return this.transformVendorToSupplier(result.data);
                }
            }
        } catch (error) {
            console.error('[SupplierService] Error fetching vendor:', error);
        }
        // Fallback to static data
        return GLOBAL_SUPPLIERS.find(s => s.id === id) || null;
    }

    static async createVendorAsync(vendorData: any): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/vendors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vendorData)
            });
            return response.ok;
        } catch (error) {
            console.error('[SupplierService] Error creating vendor:', error);
            return false;
        }
    }

    static async updateVendorAsync(id: string, updates: any): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/vendors/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            return response.ok;
        } catch (error) {
            console.error('[SupplierService] Error updating vendor:', error);
            return false;
        }
    }

    static async getVendorStatsAsync(): Promise<any> {
        try {
            const response = await fetch(`${API_BASE}/api/vendors/stats`);
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
        } catch (error) {
            console.error('[SupplierService] Error fetching stats:', error);
        }
        return {};
    }

    // ===================================
    // SYNC METHODS (Fallback - Local Data)
    // ===================================

    static getAllSuppliers(): GlobalSupplier[] {
        return GLOBAL_SUPPLIERS;
    }

    static getSupplierById(id: string): GlobalSupplier | undefined {
        return GLOBAL_SUPPLIERS.find(s => s.id === id);
    }

    static getSuppliersByType(type: GlobalSupplier['type']): GlobalSupplier[] {
        return GLOBAL_SUPPLIERS.filter(s => s.type === type);
    }

    static getActiveSuppliers(): GlobalSupplier[] {
        return GLOBAL_SUPPLIERS.filter(s => s.status === 'active');
    }

    static getSuppliersByRegion(region: string): GlobalSupplier[] {
        return GLOBAL_SUPPLIERS.filter(s =>
            s.coverage.regions.some(r => r.toLowerCase().includes(region.toLowerCase())) ||
            s.coverage.strongIn.some(c => c.toLowerCase().includes(region.toLowerCase()))
        );
    }

    static getSupplierDocuments(supplierId: string, type?: GlobalDocument['type']): GlobalDocument[] {
        const supplier = this.getSupplierById(supplierId);
        if (!supplier) return [];

        if (type) {
            return supplier.documents.filter(d => d.type === type);
        }
        return supplier.documents;
    }

    static getSupplierRates(supplierId: string, origin?: string, destination?: string, mode?: string): GlobalRateLine[] {
        const supplier = this.getSupplierById(supplierId);
        if (!supplier) return [];

        let rates = supplier.rates;

        if (origin) {
            rates = rates.filter(r => r.origin.toLowerCase().includes(origin.toLowerCase()));
        }

        if (destination) {
            rates = rates.filter(r => r.destination.toLowerCase().includes(destination.toLowerCase()));
        }

        if (mode) {
            rates = rates.filter(r => r.mode.toLowerCase().includes(mode.toLowerCase()));
        }

        return rates;
    }

    static getSupplierNotifications(supplierId: string, unreadOnly: boolean = false): SupplierNotification[] {
        const supplier = this.getSupplierById(supplierId);
        if (!supplier) return [];

        if (unreadOnly) {
            return supplier.notifications.filter(n => !n.read);
        }
        return supplier.notifications;
    }

    static getAllNotifications(unreadOnly: boolean = false): { supplier: GlobalSupplier, notification: SupplierNotification }[] {
        const allNotifications: { supplier: GlobalSupplier, notification: SupplierNotification }[] = [];

        GLOBAL_SUPPLIERS.forEach(supplier => {
            const notifications = unreadOnly
                ? supplier.notifications.filter(n => !n.read)
                : supplier.notifications;

            notifications.forEach(notif => {
                allNotifications.push({ supplier, notification: notif });
            });
        });

        return allNotifications.sort((a, b) =>
            new Date(b.notification.timestamp).getTime() - new Date(a.notification.timestamp).getTime()
        );
    }

    static markNotificationAsRead(supplierId: string, notificationId: string): boolean {
        const supplier = this.getSupplierById(supplierId);
        if (!supplier) return false;

        const notification = supplier.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            return true;
        }
        return false;
    }

    static sendNotification(
        supplierId: string,
        from: 'organization' | 'supplier',
        type: SupplierNotification['type'],
        subject: string,
        message: string,
        priority: SupplierNotification['priority'] = 'medium',
        attachments?: string[]
    ): SupplierNotification {
        const notification: SupplierNotification = {
            id: `notif-${Date.now()}`,
            from,
            to: from === 'organization' ? 'supplier' : 'organization',
            type,
            subject,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            priority,
            attachments
        };

        const supplier = this.getSupplierById(supplierId);
        if (supplier) {
            supplier.notifications.unshift(notification);
        }

        return notification;
    }

    static getExpiringDocuments(daysThreshold: number = 30): { supplier: GlobalSupplier, document: GlobalDocument }[] {
        const expiringDocs: { supplier: GlobalSupplier, document: GlobalDocument }[] = [];
        const today = new Date();
        const thresholdDate = new Date(today.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));

        GLOBAL_SUPPLIERS.forEach(supplier => {
            supplier.documents.forEach(doc => {
                if (doc.expiryDate) {
                    const expiryDate = new Date(doc.expiryDate);
                    if (expiryDate <= thresholdDate && expiryDate >= today) {
                        expiringDocs.push({ supplier, document: doc });
                    }
                }
            });
        });

        return expiringDocs;
    }

    static getSupplierPerformanceComparison(): {
        supplier: string;
        onTime: number;
        damage: number;
        satisfaction: number;
    }[] {
        return GLOBAL_SUPPLIERS.map(s => ({
            supplier: s.name,
            onTime: s.performance.onTimeDelivery,
            damage: s.performance.damageRate,
            satisfaction: s.performance.customerSatisfaction
        }));
    }

    static calculateTotalFreight(baseRate: number, fuelSurcharge: number, tax: number): {
        base: number;
        fuel: number;
        subtotal: number;
        tax: number;
        total: number;
    } {
        const fuel = (baseRate * fuelSurcharge) / 100;
        const subtotal = baseRate + fuel;
        const taxAmount = (subtotal * tax) / 100;
        const total = subtotal + taxAmount;

        return {
            base: Math.round(baseRate * 100) / 100,
            fuel: Math.round(fuel * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(taxAmount * 100) / 100,
            total: Math.round(total * 100) / 100
        };
    }
}

// Backward compatibility alias
export const IndianSupplierService = GlobalSupplierService;

// Export singleton instance as default
export default new GlobalSupplierService();
