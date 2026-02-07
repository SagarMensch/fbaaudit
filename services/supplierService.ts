// Indian Supplier Management Service
// Complete Indian freight logistics context with domestic suppliers

export interface IndianDocument {
    id: string;
    name: string;
    type: 'contract' | 'rate_card' | 'gst' | 'pan_tan' | 'insurance' | 'permit' | 'iso' | 'lr_format' | 'pod_format' | 'bank_details' | 'other';
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

export interface IndianRateLine {
    origin: string;
    destination: string;
    mode: 'Surface Express' | 'FTL' | 'PTL' | 'Air Express';
    baseRate: number;
    unit: 'kg' | 'trip' | 'ton';
    weightSlab?: string; // e.g., "0-50 kg", "100-500 kg"
    fuelSurcharge: number; // percentage
    gst: number; // percentage
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
    type: 'rate_negotiation' | 'pod_pending' | 'detention_dispute' | 'urgent_booking' | 'damage_claim' | 'lr_tracking' | 'delay_alert' | 'pod_scanned' | 'invoice' | 'rate_revision';
    subject: string;
    message: string;
    timestamp: string;
    read: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    attachments?: string[];
}

export interface IndianSupplier {
    id: string;
    name: string;
    fullName: string;
    logo: string;
    type: 'surface' | 'express' | 'air' | 'multimodal';
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
        pinCodes: string;
        branches: number;
        specialization: string[];
    };

    // Contacts
    contacts: SupplierContact[];

    // Financial (Indian Context)
    financial: {
        paymentTerms: string;
        creditLimit: number;
        gstNumber: string;
        panNumber: string;
        tanNumber: string;
        tdsRate: number; // percentage
        bankName: string;
        accountType: string;
    };

    // Performance
    performance: SupplierPerformance;

    // Documents
    documents: IndianDocument[];

    // Rate Master (Indian Routes)
    rates: IndianRateLine[];

    // Notifications
    notifications: SupplierNotification[];

    // Metadata
    createdDate: string;
    lastUpdated: string;
    contractExpiry: string;
}

// ==================== INDIAN SUPPLIER DATA ====================

export const INDIAN_SUPPLIERS: IndianSupplier[] = [
    // 1. TCI EXPRESS
    {
        id: 'tci-express',
        name: 'TCI Express',
        fullName: 'Transport Corporation of India Express Limited',
        logo: '🚛',
        type: 'surface',
        status: 'active',
        headquarters: 'Gurugram, Haryana',
        founded: 1996,
        website: 'https://www.tciexpress.in',
        description: 'India\'s leading integrated logistics company with pan-India network. Part of TCI Group (est. 1958).',
        stockListed: true,

        coverage: {
            regions: ['North India', 'South India', 'East India', 'West India', 'Central India', 'North-East'],
            strongIn: ['Delhi NCR', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'],
            pinCodes: '19,000+',
            branches: 700,
            specialization: ['B2B Cargo', 'E-commerce', 'Automotive Parts', 'FMCG', 'Industrial Goods']
        },

        contacts: [
            {
                name: 'Rajesh Sharma',
                title: 'Key Account Manager - North',
                email: 'rajesh.sharma@tciexpress.in',
                phone: '+91-124-238-5555',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 30 days',
            creditLimit: 5000000,
            gstNumber: '07AABCT1234F1Z5',
            panNumber: 'AABCT1234F',
            tanNumber: 'DELT12345E',
            tdsRate: 2,
            bankName: 'HDFC Bank, Gurugram',
            accountType: 'Current Account'
        },

        performance: {
            onTimeDelivery: 96.5,
            firstAttemptSuccess: 92.0,
            damageRate: 0.3,
            avgTransitTime: '48-72 hours',
            podReturnTime: '7 days',
            customerSatisfaction: 4.5
        },

        documents: [
            {
                id: 'tci-freight-agreement',
                name: 'Master Service Agreement 2024',
                type: 'contract',
                url: '/documents/tci/PSA_TCI_2024.pdf', // Mapped to Invoice Data context
                uploadedDate: '2024-03-01',
                expiryDate: '2025-02-28',
                status: 'active',
                fileSize: '2.1 MB',
                uploadedBy: 'Rajesh Sharma'
            },
            {
                id: 'tci-rate-card',
                name: 'Rate Card 2024-2025',
                type: 'rate_card',
                url: '/documents/tci/Rate_TCI_2025.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-03-01',
                status: 'active',
                fileSize: '187 KB',
                uploadedBy: 'Rajesh Sharma'
            },
            {
                id: 'tci-po',
                name: 'Purchase Order TCI-001',
                type: 'other',
                url: '/documents/tci/PO_TCI_001.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-12-15',
                status: 'active',
                fileSize: '150 KB',
                uploadedBy: 'ERP System'
            }
        ],

        rates: [
            {
                origin: 'Delhi',
                destination: 'Mumbai',
                mode: 'Surface Express',
                baseRate: 14,
                unit: 'kg',
                fuelSurcharge: 15,
                gst: 18,
                additionalCharges: []
            }
        ],

        notifications: [],
        createdDate: '2019-11-05',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-02-28'
    },

    // 2. BLUE DART EXPRESS
    {
        id: 'bluedart-express',
        name: 'Blue Dart',
        fullName: 'Blue Dart Express Limited',
        logo: '✈️',
        type: 'express',
        status: 'active',
        headquarters: 'Mumbai, Maharashtra',
        founded: 1983,
        website: 'https://www.bluedart.com',
        description: 'India\'s premier express courier with air fleet.',
        stockListed: true,

        coverage: {
            regions: ['All India'],
            strongIn: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'],
            pinCodes: '35,000+',
            branches: 500,
            specialization: ['Time-Definite Delivery', 'Air Express']
        },

        contacts: [
            {
                name: 'Amit Agarwal',
                title: 'National Head - Key Accounts',
                email: 'amit.agarwal@bluedart.com',
                phone: '+91-22-6799-1234',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 15 days',
            creditLimit: 7500000,
            gstNumber: '27AABCB1234F1Z5',
            panNumber: 'AABCB1234F',
            tanNumber: 'MUMB12345E',
            tdsRate: 2,
            bankName: 'ICICI Bank',
            accountType: 'Current Account'
        },

        performance: {
            onTimeDelivery: 98.5,
            firstAttemptSuccess: 96.0,
            damageRate: 0.1,
            avgTransitTime: '24 hours',
            podReturnTime: '1 day',
            customerSatisfaction: 4.9
        },

        documents: [
            {
                id: 'bd-agreement',
                name: 'Corporate Service Agreement 2024',
                type: 'contract',
                url: '/documents/bluedart/Corporate_Agreement_2024.pdf', // IMPLIED MATCH
                uploadedDate: '2024-02-01',
                expiryDate: '2025-01-31',
                status: 'active',
                fileSize: '1.8 MB',
                uploadedBy: 'Amit Agarwal'
            },
            {
                id: 'bd-rate-conf',
                name: 'Rate Confirmation 2025',
                type: 'rate_card',
                url: '/documents/bluedart/Rate_BD_2025.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-12-01',
                status: 'active',
                fileSize: '1.2 MB',
                uploadedBy: 'Amit Agarwal'
            },
            {
                id: 'bd-po',
                name: 'Purchase Order BD-001',
                type: 'other',
                url: '/documents/bluedart/PO_BD_001.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-12-18',
                status: 'active',
                fileSize: '150 KB',
                uploadedBy: 'ERP System'
            }
        ],

        rates: [
            {
                origin: 'Mumbai',
                destination: 'Delhi',
                mode: 'Air Express',
                baseRate: 55,
                unit: 'kg',
                fuelSurcharge: 18,
                gst: 18,
                additionalCharges: []
            }
        ],

        notifications: [],
        createdDate: '2021-02-10',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-01-31'
    },

    // 3. VRL LOGISTICS
    {
        id: 'vrl-logistics',
        name: 'VRL Logistics',
        fullName: 'VRL Logistics Limited',
        logo: '🚌',
        type: 'surface',
        status: 'active',
        headquarters: 'Hubballi, Karnataka',
        founded: 1976,
        website: 'https://www.vrllogistics.com',
        description: 'South India\'s largest surface transport company.',
        stockListed: true,

        coverage: {
            regions: ['South India', 'West India'],
            strongIn: ['Bangalore', 'Hubli', 'Belgaum', 'Mumbai'],
            pinCodes: '12,000+',
            branches: 900,
            specialization: ['Surface Transport', 'Parcel Service']
        },

        contacts: [
            {
                name: 'Anand Sankeshwar',
                title: 'Managing Director',
                email: 'anand.s@vrlgroup.in',
                phone: '+91-836-223-7555',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 45 days',
            creditLimit: 3000000,
            gstNumber: '29AABCV1234F1Z5',
            panNumber: 'AABCV1234F',
            tanNumber: 'HUBL12345E',
            tdsRate: 1,
            bankName: 'SBI',
            accountType: 'Current Account'
        },

        performance: {
            onTimeDelivery: 85.0,
            firstAttemptSuccess: 88.0,
            damageRate: 1.2,
            avgTransitTime: '36-48 hours',
            podReturnTime: '12 days',
            customerSatisfaction: 3.8
        },

        documents: [
            {
                id: 'vrl-contract',
                name: 'Service Contract 2025',
                type: 'contract',
                url: '/documents/vrl/Contract_VRL_2025.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-11-15',
                expiryDate: '2025-11-14',
                status: 'active',
                fileSize: '3.1 MB',
                uploadedBy: 'Anand Sankeshwar'
            },
            {
                id: 'vrl-po',
                name: 'Purchase Order VRL-005',
                type: 'other',
                url: '/documents/vrl/PO_VRL_005.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-12-20',
                status: 'active',
                fileSize: '140 KB',
                uploadedBy: 'ERP System'
            }
        ],

        rates: [
            {
                origin: 'Hubballi',
                destination: 'Bangalore',
                mode: 'Surface Express',
                baseRate: 8,
                unit: 'kg',
                fuelSurcharge: 12,
                gst: 12,
                additionalCharges: []
            }
        ],

        notifications: [],
        createdDate: '2020-08-20',
        lastUpdated: '2024-12-19',
        contractExpiry: '2025-11-14'
    },

    // 4. GHATGE PATIL
    {
        id: 'ghatge-patil',
        name: 'Ghatge Patil',
        fullName: 'Ghatge Patil Transports Pvt Ltd',
        logo: '⛰️',
        type: 'surface',
        status: 'active',
        headquarters: 'Kolhapur, Maharashtra',
        founded: 1949,
        website: 'https://www.ghatgepatil.com',
        description: 'Trusted regional specialist for Maharashtra and Karnataka.',
        stockListed: false,

        coverage: {
            regions: ['West India'],
            strongIn: ['Kolhapur', 'Pune', 'Mumbai', 'Belgaum'],
            pinCodes: '5,000',
            branches: 200,
            specialization: ['FTL', 'Regional Parcel']
        },

        contacts: [
            {
                name: 'Suresh Patil',
                title: 'Director of Operations',
                email: 'suresh.patil@ghatgepatil.com',
                phone: '+91-231-266-4444',
                type: 'primary'
            }
        ],

        financial: {
            paymentTerms: 'Net 30 days',
            creditLimit: 1500000,
            gstNumber: '27AABCG1234F1Z5',
            panNumber: 'AABCG1234F',
            tanNumber: 'KOLH12345E',
            tdsRate: 1,
            bankName: 'Axis Bank',
            accountType: 'Current Account'
        },

        performance: {
            onTimeDelivery: 92.5,
            firstAttemptSuccess: 98.0,
            damageRate: 0.5,
            avgTransitTime: '24 hours',
            podReturnTime: '5 days',
            customerSatisfaction: 4.2
        },

        documents: [
            {
                id: 'gpt-contract',
                name: 'Transport Agreement',
                type: 'contract',
                url: '/documents/gpt/Contract_GPT.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-06-01',
                expiryDate: '2025-05-31',
                status: 'active',
                fileSize: '1.5 MB',
                uploadedBy: 'Suresh Patil'
            },
            {
                id: 'gpt-po',
                name: 'Purchase Order GPT-001',
                type: 'other',
                url: '/documents/gpt/PO_GPT_001.pdf', // EXACT MATCH: mock_invoices_clean.ts
                uploadedDate: '2024-12-22',
                status: 'active',
                fileSize: '120 KB',
                uploadedBy: 'ERP System'
            }
        ],

        rates: [
            {
                origin: 'Kolhapur',
                destination: 'Pune',
                mode: 'FTL',
                baseRate: 12000,
                unit: 'trip',
                fuelSurcharge: 10,
                gst: 12,
                additionalCharges: []
            }
        ],

        notifications: [],
        createdDate: '2023-01-15',
        lastUpdated: '2024-12-23',
        contractExpiry: '2025-05-31'
    }
];

// ==================== SERVICE FUNCTIONS ====================
const API_BASE = 'http://localhost:5000';

export class IndianSupplierService {
    private static vendors: any[] = [];
    private static loaded = false;

    // ===================================
    // ASYNC API METHODS (Primary - MySQL)
    // ===================================

    static async loadFromAPI(): Promise<void> {
        try {
            const response = await fetch(`${API_BASE}/api/vendors`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    this.vendors = result.data;
                    this.loaded = true;
                    console.log(`[SupplierService] Loaded ${this.vendors.length} vendors from MySQL`);
                }
            }
        } catch (error) {
            console.error('[SupplierService] API error, using fallback:', error);
        }
    }

    static async fetchAllVendorsAsync(): Promise<any[]> {
        await this.loadFromAPI();
        return this.vendors;
    }

    static async fetchVendorByIdAsync(id: string): Promise<any | null> {
        try {
            const response = await fetch(`${API_BASE}/api/vendors/${id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    return result.data;
                }
            }
        } catch (error) {
            console.error('[SupplierService] Error fetching vendor:', error);
        }
        return null;
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

    static getAllSuppliers(): IndianSupplier[] {
        return INDIAN_SUPPLIERS;
    }

    static getSupplierById(id: string): IndianSupplier | undefined {
        return INDIAN_SUPPLIERS.find(s => s.id === id);
    }

    static getSuppliersByType(type: IndianSupplier['type']): IndianSupplier[] {
        return INDIAN_SUPPLIERS.filter(s => s.type === type);
    }

    static getActiveSuppliers(): IndianSupplier[] {
        return INDIAN_SUPPLIERS.filter(s => s.status === 'active');
    }

    static getSuppliersByRegion(region: string): IndianSupplier[] {
        return INDIAN_SUPPLIERS.filter(s =>
            s.coverage.regions.some(r => r.toLowerCase().includes(region.toLowerCase())) ||
            s.coverage.strongIn.some(c => c.toLowerCase().includes(region.toLowerCase()))
        );
    }

    static getSupplierDocuments(supplierId: string, type?: IndianDocument['type']): IndianDocument[] {
        const supplier = this.getSupplierById(supplierId);
        if (!supplier) return [];

        if (type) {
            return supplier.documents.filter(d => d.type === type);
        }
        return supplier.documents;
    }

    static getSupplierRates(supplierId: string, origin?: string, destination?: string, mode?: string): IndianRateLine[] {
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

    static getAllNotifications(unreadOnly: boolean = false): { supplier: IndianSupplier, notification: SupplierNotification }[] {
        const allNotifications: { supplier: IndianSupplier, notification: SupplierNotification }[] = [];

        INDIAN_SUPPLIERS.forEach(supplier => {
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

    static getExpiringDocuments(daysThreshold: number = 30): { supplier: IndianSupplier, document: IndianDocument }[] {
        const expiringDocs: { supplier: IndianSupplier, document: IndianDocument }[] = [];
        const today = new Date();
        const thresholdDate = new Date(today.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));

        INDIAN_SUPPLIERS.forEach(supplier => {
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
        return INDIAN_SUPPLIERS.map(s => ({
            supplier: s.name,
            onTime: s.performance.onTimeDelivery,
            damage: s.performance.damageRate,
            satisfaction: s.performance.customerSatisfaction
        }));
    }

    static calculateTotalFreight(baseRate: number, fuelSurcharge: number, gst: number): {
        base: number;
        fuel: number;
        subtotal: number;
        gst: number;
        total: number;
    } {
        const fuel = (baseRate * fuelSurcharge) / 100;
        const subtotal = baseRate + fuel;
        const gstAmount = (subtotal * gst) / 100;
        const total = subtotal + gstAmount;

        return {
            base: Math.round(baseRate),
            fuel: Math.round(fuel),
            subtotal: Math.round(subtotal),
            gst: Math.round(gstAmount),
            total: Math.round(total)
        };
    }
}

// Export singleton instance as default
export default new IndianSupplierService();

