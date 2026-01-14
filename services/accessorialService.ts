// Accessorial Charges Service
// Manages library of all accessorial charges (detention, ODA, tolls, etc.)

export interface Accessorial {
    id: string;
    code: string;
    description: string;
    category: 'Fuel' | 'Detention' | 'ODA' | 'Tolls' | 'Loading' | 'Documentation' | 'Security' | 'Seasonal' | 'Other';
    chargeType: 'Fixed' | 'Per Day' | 'Per KM' | '% of Freight' | 'Per Trip' | 'Per Ton';
    amount: number;
    currency: string;
    applicableFor: ('LTL' | 'FTL' | 'Express' | 'Air')[];
    logic: 'Fixed' | 'Pass-through' | '% of Freight' | 'Slab-based';
    slabs?: {
        minValue: number;
        maxValue: number;
        rate: number;
    }[];
    conditions?: string;
    status: 'active' | 'inactive';
    createdBy: string;
    createdDate: string;
    modifiedBy?: string;
    modifiedDate?: string;
}

class AccessorialService {
    private accessorials: Accessorial[] = [];

    constructor() {
        this.loadSeedData();
    }

    private loadSeedData() {
        // Load from localStorage or use seed data
        const stored = localStorage.getItem('accessorials');
        if (stored) {
            this.accessorials = JSON.parse(stored);
        } else {
            this.accessorials = SEED_ACCESSORIALS;
            this.save();
        }
    }

    private save() {
        localStorage.setItem('accessorials', JSON.stringify(this.accessorials));
    }

    // ==================== CRUD OPERATIONS ====================

    getAll(): Accessorial[] {
        return this.accessorials;
    }

    getById(id: string): Accessorial | undefined {
        return this.accessorials.find(a => a.id === id);
    }

    getByCode(code: string): Accessorial | undefined {
        return this.accessorials.find(a => a.code === code);
    }

    getByCategory(category: string): Accessorial[] {
        return this.accessorials.filter(a => a.category === category);
    }

    getActive(): Accessorial[] {
        return this.accessorials.filter(a => a.status === 'active');
    }

    create(accessorial: Omit<Accessorial, 'id' | 'createdDate'>): Accessorial {
        const newAccessorial: Accessorial = {
            ...accessorial,
            id: `ACC-${Date.now()}`,
            createdDate: new Date().toISOString()
        };

        this.accessorials.push(newAccessorial);
        this.save();

        return newAccessorial;
    }

    update(id: string, updates: Partial<Accessorial>): Accessorial | null {
        const index = this.accessorials.findIndex(a => a.id === id);
        if (index === -1) return null;

        this.accessorials[index] = {
            ...this.accessorials[index],
            ...updates,
            modifiedDate: new Date().toISOString()
        };

        this.save();
        return this.accessorials[index];
    }

    delete(id: string): boolean {
        const index = this.accessorials.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.accessorials.splice(index, 1);
        this.save();
        return true;
    }

    // ==================== BUSINESS LOGIC ====================

    calculateCharge(accessorialId: string, params: {
        freightAmount?: number;
        distance?: number;
        weight?: number;
        days?: number;
    }): number {
        const accessorial = this.getById(accessorialId);
        if (!accessorial) return 0;

        switch (accessorial.logic) {
            case 'Fixed':
                return accessorial.amount;

            case 'Pass-through':
                return accessorial.amount;

            case '% of Freight':
                if (!params.freightAmount) return 0;
                return (params.freightAmount * accessorial.amount) / 100;

            case 'Slab-based':
                if (!accessorial.slabs) return accessorial.amount;
                const value = params.weight || params.distance || 0;
                const slab = accessorial.slabs.find(s =>
                    value >= s.minValue && value <= s.maxValue
                );
                return slab ? slab.rate : accessorial.amount;

            default:
                return accessorial.amount;
        }
    }

    getApplicableAccessorials(deliveryType: string): Accessorial[] {
        return this.accessorials.filter(a =>
            a.status === 'active' &&
            a.applicableFor.includes(deliveryType as any)
        );
    }

    // ==================== STATISTICS ====================

    getStatistics() {
        const total = this.accessorials.length;
        const active = this.accessorials.filter(a => a.status === 'active').length;
        const byCategory: Record<string, number> = {};
        const byChargeType: Record<string, number> = {};

        this.accessorials.forEach(a => {
            byCategory[a.category] = (byCategory[a.category] || 0) + 1;
            byChargeType[a.chargeType] = (byChargeType[a.chargeType] || 0) + 1;
        });

        return {
            total,
            active,
            inactive: total - active,
            byCategory,
            byChargeType
        };
    }
}

// ==================== SEED DATA ====================

const SEED_ACCESSORIALS: Accessorial[] = [
    {
        id: 'ACC-001',
        code: 'FSC',
        description: 'Fuel Surcharge',
        category: 'Fuel',
        chargeType: 'Per Trip',
        amount: 2500,
        currency: 'INR',
        applicableFor: ['LTL', 'FTL', 'Express'],
        logic: 'Pass-through',
        conditions: 'Applied when diesel price exceeds ₹94.50/L',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-002',
        code: 'DET',
        description: 'Detention Charges',
        category: 'Detention',
        chargeType: 'Per Day',
        amount: 1500,
        currency: 'INR',
        applicableFor: ['FTL', 'LTL'],
        logic: 'Fixed',
        conditions: 'After 24 hours free time at loading/unloading',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-003',
        code: 'ODA',
        description: 'Out of Delivery Area Surcharge',
        category: 'ODA',
        chargeType: 'Per Trip',
        amount: 2000,
        currency: 'INR',
        applicableFor: ['LTL', 'Express'],
        logic: 'Fixed',
        conditions: 'For deliveries beyond 50 km from city center',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-004',
        code: 'TOLL',
        description: 'Toll Charges',
        category: 'Tolls',
        chargeType: 'Per Trip',
        amount: 3500,
        currency: 'INR',
        applicableFor: ['FTL', 'LTL'],
        logic: 'Pass-through',
        conditions: 'Actual toll charges as per route',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-005',
        code: 'LOAD',
        description: 'Loading/Unloading Charges',
        category: 'Loading',
        chargeType: 'Per Ton',
        amount: 150,
        currency: 'INR',
        applicableFor: ['FTL', 'LTL'],
        logic: 'Fixed',
        conditions: 'When loading/unloading is not included in base rate',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-006',
        code: 'DOC',
        description: 'Documentation Charges',
        category: 'Documentation',
        chargeType: 'Per Trip',
        amount: 500,
        currency: 'INR',
        applicableFor: ['LTL', 'FTL', 'Express', 'Air'],
        logic: 'Fixed',
        conditions: 'For LR, POD, and other documentation',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-007',
        code: 'SEC',
        description: 'Security Escort Charges',
        category: 'Security',
        chargeType: 'Per Trip',
        amount: 5000,
        currency: 'INR',
        applicableFor: ['FTL'],
        logic: 'Fixed',
        conditions: 'For high-value cargo requiring security escort',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-008',
        code: 'PEAK',
        description: 'Peak Season Surcharge',
        category: 'Seasonal',
        chargeType: '% of Freight',
        amount: 10,
        currency: 'INR',
        applicableFor: ['LTL', 'FTL', 'Express'],
        logic: '% of Freight',
        conditions: 'Applied during Diwali, New Year, and other peak seasons',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-009',
        code: 'OCTROI',
        description: 'Octroi/Entry Tax',
        category: 'Other',
        chargeType: '% of Freight',
        amount: 2,
        currency: 'INR',
        applicableFor: ['LTL', 'FTL'],
        logic: 'Pass-through',
        conditions: 'City-specific entry tax (where applicable)',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    },
    {
        id: 'ACC-010',
        code: 'REWEIGH',
        description: 'Reweighing Charges',
        category: 'Other',
        chargeType: 'Per Trip',
        amount: 300,
        currency: 'INR',
        applicableFor: ['LTL', 'FTL'],
        logic: 'Fixed',
        conditions: 'When cargo needs to be reweighed at destination',
        status: 'active',
        createdBy: 'System',
        createdDate: '2024-01-01'
    }
];

export const accessorialService = new AccessorialService();
