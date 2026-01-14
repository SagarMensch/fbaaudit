// Indian Logistics Partner Service
// Complete data service for Indian domestic freight partners

export interface IndianLogisticsPartner {
    id: string;
    name: string;
    fullName: string;
    logo: string;
    tier: 'STRATEGIC' | 'CORE' | 'TRANSACTIONAL';
    modes: ('surface' | 'express' | 'air' | 'ptl' | 'ftl')[];
    region: 'pan-india' | 'north' | 'south' | 'east' | 'west';

    // Indian Compliance
    gstNumber: string;
    panNumber: string;
    tanNumber: string;
    tdsRate: number;

    // Company Details
    headquarters: string;
    founded: string;
    website: string;

    // Network Coverage
    coverage: {
        pinCodes: number;
        branches: number;
        vehicles: number;
        warehouses: number;
        states: number;
    };

    // Performance Metrics
    performance: {
        networkOTD: number; // Overall on-time delivery %
        onTimeDelivery: number;
        firstAttemptSuccess: number;
        damageRate: number;
        podReturnTime: number; // days
        customerSatisfaction: number; // out of 5
    };

    // Connectivity
    connectivity: {
        type: 'API' | 'Portal' | 'Manual';
        status: 'active' | 'inactive' | 'error';
        lastSync: string;
    };

    // Risk Profile
    riskProfile: {
        level: 'low' | 'medium' | 'high';
        issues: string[];
        compliance: 'compliant' | 'non-compliant' | 'pending';
    };

    // Pain Points
    painPoints: {
        type: 'detention' | 'pod_delay' | 'lr_discrepancy' | 'eway_bill' | 'border_delay' | 'weight_dispute' | 'damage_claim';
        severity: 'low' | 'medium' | 'high';
        count: number;
        avgAmount?: number; // for detention
        avgDays?: number; // for POD delay
    }[];

    // Major Routes
    majorRoutes: {
        from: string;
        to: string;
        distance: number; // km
        transitTime: string;
        baseRate: number; // per kg
        fuelSurcharge: number; // %
        gst: number; // %
    }[];

    // Financial
    financial: {
        creditLimit: number; // INR
        paymentTerms: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
    };

    // Contacts
    contacts: {
        name: string;
        title: string;
        email: string;
        phone: string;
        department: string;
    }[];
}

// Indian Logistics Partners Data
const INDIAN_LOGISTICS_PARTNERS: IndianLogisticsPartner[] = [
    // 1. TCI EXPRESS (Rajesh Sharma) - The Reference Profile
    {
        id: 'tci-express',
        name: 'TCI Express',
        fullName: 'Transport Corporation of India Express Limited',
        logo: '🚛',
        tier: 'STRATEGIC',
        modes: ['surface', 'express'],
        region: 'pan-india',

        gstNumber: '07AABCT1234F1Z5',
        panNumber: 'AABCT1234F',
        tanNumber: 'DELT12345E',
        tdsRate: 2,

        headquarters: 'Gurugram, Haryana',
        founded: '1958',
        website: 'www.tciexpress.in',

        coverage: {
            pinCodes: 40000,
            branches: 800,
            vehicles: 5000,
            warehouses: 50,
            states: 28
        },

        performance: {
            networkOTD: 96.5,
            onTimeDelivery: 96.5,
            firstAttemptSuccess: 92.0,
            damageRate: 0.3,
            podReturnTime: 7,
            customerSatisfaction: 4.5
        },

        connectivity: {
            type: 'API',
            status: 'active',
            lastSync: '10 min ago'
        },

        riskProfile: {
            level: 'low',
            issues: [],
            compliance: 'compliant'
        },

        painPoints: [
            { type: 'detention', severity: 'medium', count: 12, avgAmount: 6500 },
            { type: 'pod_delay', severity: 'low', count: 5, avgDays: 8 }
        ],

        majorRoutes: [
            { from: 'Delhi', to: 'Mumbai', distance: 1400, transitTime: '48-72h', baseRate: 14, fuelSurcharge: 15, gst: 18 },
            { from: 'Mumbai', to: 'Bangalore', distance: 980, transitTime: '36-48h', baseRate: 16, fuelSurcharge: 15, gst: 18 },
            { from: 'Delhi', to: 'Kolkata', distance: 1450, transitTime: '60-72h', baseRate: 15, fuelSurcharge: 15, gst: 18 }
        ],

        financial: {
            creditLimit: 5000000,
            paymentTerms: 'Net 30 days',
            bankName: 'HDFC Bank',
            accountNumber: '50200012345678',
            ifscCode: 'HDFC0001234'
        },

        contacts: [
            {
                name: 'Rajesh Sharma',
                title: 'Key Account Manager - North',
                email: 'rajesh.sharma@tciexpress.in',
                phone: '+91-124-238-5555',
                department: 'Corporate Sales'
            }
        ]
    },

    // 2. BLUE DART (Amit Agarwal) - Express & Aviation
    {
        id: 'bluedart-express',
        name: 'Blue Dart',
        fullName: 'Blue Dart Express Limited',
        logo: '✈️',
        tier: 'STRATEGIC',
        modes: ['air', 'express'],
        region: 'pan-india',

        gstNumber: '27AABCB1234F1Z5',
        panNumber: 'AABCB1234F',
        tanNumber: 'MUMB12345E',
        tdsRate: 2,

        headquarters: 'Mumbai, Maharashtra',
        founded: '1983',
        website: 'www.bluedart.com',

        coverage: {
            pinCodes: 35000,
            branches: 500,
            vehicles: 12000,
            warehouses: 85,
            states: 29
        },

        performance: {
            networkOTD: 99.1,
            onTimeDelivery: 98.5,
            firstAttemptSuccess: 96.0,
            damageRate: 0.1,
            podReturnTime: 1, // Digital POD
            customerSatisfaction: 4.9
        },

        connectivity: {
            type: 'API',
            status: 'active',
            lastSync: '2 min ago'
        },

        riskProfile: {
            level: 'low',
            issues: [],
            compliance: 'compliant'
        },

        painPoints: [
            { type: 'weight_dispute', severity: 'medium', count: 8, avgAmount: 1200 }
        ],

        majorRoutes: [
            { from: 'Mumbai', to: 'Delhi', distance: 1400, transitTime: '24h', baseRate: 55, fuelSurcharge: 18, gst: 18 },
            { from: 'Bangalore', to: 'Mumbai', distance: 980, transitTime: '24h', baseRate: 52, fuelSurcharge: 18, gst: 18 },
            { from: 'Chennai', to: 'Delhi', distance: 2180, transitTime: '36h', baseRate: 60, fuelSurcharge: 18, gst: 18 }
        ],

        financial: {
            creditLimit: 7500000,
            paymentTerms: 'Net 15 days',
            bankName: 'ICICI Bank',
            accountNumber: '60200098765432',
            ifscCode: 'ICIC0001234'
        },

        contacts: [
            {
                name: 'Amit Agarwal',
                title: 'National Head - Key Accounts',
                email: 'amit.agarwal@bluedart.com',
                phone: '+91-22-6799-1234',
                department: 'Enterprise Solutions'
            }
        ]
    },

    // 3. VRL LOGISTICS (Anand Sankeshwar) - Surface Heavy
    {
        id: 'vrl-logistics',
        name: 'VRL Logistics',
        fullName: 'VRL Logistics Limited',
        logo: '🚌',
        tier: 'CORE',
        modes: ['surface', 'ptl'],
        region: 'south',

        gstNumber: '29AABCV1234F1Z5',
        panNumber: 'AABCV1234F',
        tanNumber: 'HUBL12345E',
        tdsRate: 1,

        headquarters: 'Hubballi, Karnataka',
        founded: '1976',
        website: 'www.vrlgroup.in',

        coverage: {
            pinCodes: 12000,
            branches: 900,
            vehicles: 4500,
            warehouses: 40,
            states: 22
        },

        performance: {
            networkOTD: 88.5,
            onTimeDelivery: 85.0,
            firstAttemptSuccess: 88.0,
            damageRate: 1.2,
            podReturnTime: 12,
            customerSatisfaction: 3.8
        },

        connectivity: {
            type: 'Portal',
            status: 'inactive',
            lastSync: '2 days ago'
        },

        riskProfile: {
            level: 'medium',
            issues: ['POD Return Delays', 'Vehicle Availability'],
            compliance: 'pending'
        },

        painPoints: [
            { type: 'pod_delay', severity: 'high', count: 45, avgDays: 15 },
            { type: 'damage_claim', severity: 'medium', count: 12 }
        ],

        majorRoutes: [
            { from: 'Hubballi', to: 'Bangalore', distance: 410, transitTime: '12-18h', baseRate: 8, fuelSurcharge: 12, gst: 12 },
            { from: 'Belgaum', to: 'Mumbai', distance: 480, transitTime: '18-24h', baseRate: 9, fuelSurcharge: 12, gst: 12 },
            { from: 'Bangalore', to: 'Hyderabad', distance: 570, transitTime: '24-36h', baseRate: 10, fuelSurcharge: 12, gst: 12 }
        ],

        financial: {
            creditLimit: 3000000,
            paymentTerms: 'Net 45 days',
            bankName: 'SBI',
            accountNumber: '30200011223344',
            ifscCode: 'SBIN0001234'
        },

        contacts: [
            {
                name: 'Anand Sankeshwar',
                title: 'Managing Director',
                email: 'anand.s@vrlgroup.in',
                phone: '+91-836-223-7555',
                department: 'Operations'
            }
        ]
    },

    // 4. GHATGE PATIL (Suresh Patil) - Regional Specialist
    {
        id: 'ghatge-patil',
        name: 'Ghatge Patil',
        fullName: 'Ghatge Patil Transports Pvt Ltd',
        logo: '⛰️',
        tier: 'TRANSACTIONAL',
        modes: ['surface', 'ftl'],
        region: 'west',

        gstNumber: '27AABCG1234F1Z5',
        panNumber: 'AABCG1234F',
        tanNumber: 'KOLH12345E',
        tdsRate: 1,

        headquarters: 'Kolhapur, Maharashtra',
        founded: '1949',
        website: 'www.ghatgepatil.com',

        coverage: {
            pinCodes: 5000,
            branches: 200,
            vehicles: 800,
            warehouses: 15,
            states: 4
        },

        performance: {
            networkOTD: 94.0,
            onTimeDelivery: 92.5,
            firstAttemptSuccess: 98.0,
            damageRate: 0.5,
            podReturnTime: 5,
            customerSatisfaction: 4.2
        },

        connectivity: {
            type: 'Manual',
            status: 'active',
            lastSync: '1 day ago'
        },

        riskProfile: {
            level: 'low',
            issues: [],
            compliance: 'compliant'
        },

        painPoints: [
            { type: 'lr_discrepancy', severity: 'low', count: 2 },
            { type: 'eway_bill', severity: 'medium', count: 4 }
        ],

        majorRoutes: [
            { from: 'Kolhapur', to: 'Pune', distance: 230, transitTime: '6-8h', baseRate: 12, fuelSurcharge: 10, gst: 12 },
            { from: 'Pune', to: 'Mumbai', distance: 150, transitTime: '4-6h', baseRate: 15, fuelSurcharge: 10, gst: 12 },
            { from: 'Kolhapur', to: 'Belgaum', distance: 110, transitTime: '3-4h', baseRate: 10, fuelSurcharge: 10, gst: 12 }
        ],

        financial: {
            creditLimit: 1500000,
            paymentTerms: 'Net 30 days',
            bankName: 'Axis Bank',
            accountNumber: '912010012345678',
            ifscCode: 'UTIB0001234'
        },

        contacts: [
            {
                name: 'Suresh Patil',
                title: 'Director of Operations',
                email: 'suresh.patil@ghatgepatil.com',
                phone: '+91-231-266-4444',
                department: 'Management'
            }
        ]
    },

    // 5. GATI-KWE (Optional, keeping for completeness but can be ignored)
    {
        id: 'gati-kwe',
        name: 'Gati-KWE',
        fullName: 'Gati-Kintetsu Express Private Limited',
        logo: '🚛',
        tier: 'CORE',
        modes: ['surface', 'express'],
        region: 'pan-india',

        gstNumber: '36AABCG1234F1Z5',
        panNumber: 'AABCG1234F',
        tanNumber: 'HYDE12345E',
        tdsRate: 2,

        headquarters: 'Hyderabad, Telangana',
        founded: '1989',
        website: 'www.gati.com',

        coverage: {
            pinCodes: 16000,
            branches: 600,
            vehicles: 3500,
            warehouses: 40,
            states: 26
        },

        performance: {
            networkOTD: 93.5,
            onTimeDelivery: 93.5,
            firstAttemptSuccess: 88.0,
            damageRate: 0.4,
            podReturnTime: 8,
            customerSatisfaction: 4.2
        },

        connectivity: {
            type: 'API',
            status: 'active',
            lastSync: '15 min ago'
        },

        riskProfile: {
            level: 'medium',
            issues: ['Occasional detention disputes'],
            compliance: 'compliant'
        },

        painPoints: [
            { type: 'detention', severity: 'medium', count: 15, avgAmount: 5800 },
            { type: 'pod_delay', severity: 'low', count: 7, avgDays: 9 }
        ],

        majorRoutes: [
            { from: 'Hyderabad', to: 'Bangalore', distance: 570, transitTime: '24-36h', baseRate: 15, fuelSurcharge: 15, gst: 18 },
            { from: 'Delhi', to: 'Hyderabad', distance: 1570, transitTime: '60-72h', baseRate: 14, fuelSurcharge: 15, gst: 18 }
        ],

        financial: {
            creditLimit: 4000000,
            paymentTerms: 'Net 30 days',
            bankName: 'ICICI Bank',
            accountNumber: '90200012345678',
            ifscCode: 'ICIC0002345'
        },

        contacts: [{
            name: 'Karthik Rao',
            title: 'Regional Manager - South',
            email: 'karthik.rao@gati.com',
            phone: '+91-40-6666-7777',
            department: 'Operations'
        }]
    },

    // 6. DTDC
    {
        id: 'dtdc',
        name: 'DTDC',
        fullName: 'DTDC Express Limited',
        logo: '📮',
        tier: 'CORE',
        modes: ['express', 'air'],
        region: 'pan-india',

        gstNumber: '29AABCD1234F1Z5',
        panNumber: 'AABCD1234F',
        tanNumber: 'BANG12345E',
        tdsRate: 2,

        headquarters: 'Bangalore, Karnataka',
        founded: '1990',
        website: 'www.dtdc.com',

        coverage: {
            pinCodes: 12000,
            branches: 1500,
            vehicles: 2000,
            warehouses: 25,
            states: 29
        },

        performance: {
            networkOTD: 97.0,
            onTimeDelivery: 96.0,
            firstAttemptSuccess: 93.0,
            damageRate: 0.2,
            podReturnTime: 4,
            customerSatisfaction: 4.4
        },

        connectivity: {
            type: 'Portal',
            status: 'active',
            lastSync: '20 min ago'
        },

        riskProfile: {
            level: 'low',
            issues: [],
            compliance: 'compliant'
        },

        painPoints: [
            { type: 'lr_discrepancy', severity: 'low', count: 3 }
        ],

        majorRoutes: [
            { from: 'Bangalore', to: 'Mumbai', distance: 980, transitTime: '24-36h', baseRate: 18, fuelSurcharge: 16, gst: 18 },
            { from: 'Delhi', to: 'Bangalore', distance: 2100, transitTime: '48-60h', baseRate: 20, fuelSurcharge: 16, gst: 18 }
        ],

        financial: {
            creditLimit: 3500000,
            paymentTerms: 'Net 15 days',
            bankName: 'HDFC Bank',
            accountNumber: '10200012345678',
            ifscCode: 'HDFC0001234'
        },

        contacts: [{
            name: 'Sameer Gupta',
            title: 'Sales Head',
            email: 'sameer.gupta@dtdc.com',
            phone: '+91-80-6666-8888',
            department: 'Sales'
        }]
    }
];

export class IndianLogisticsService {
    getPartners(): IndianLogisticsPartner[] {
        return INDIAN_LOGISTICS_PARTNERS;
    }

    getPartnerById(id: string): IndianLogisticsPartner | undefined {
        return INDIAN_LOGISTICS_PARTNERS.find(p => p.id === id);
    }

    getPartnerByReference(ref: string): IndianLogisticsPartner | undefined {
        // Mock matching logic - in real app, would search GST/PAN/Name
        const normalizedRef = ref.toLowerCase().replace(/[^a-z0-9]/g, '');
        return INDIAN_LOGISTICS_PARTNERS.find(p =>
            p.id.includes(normalizedRef) ||
            p.name.toLowerCase().includes(normalizedRef) ||
            p.gstNumber.toLowerCase().includes(normalizedRef)
        );
    }
}

export const indianLogisticsService = new IndianLogisticsService();
