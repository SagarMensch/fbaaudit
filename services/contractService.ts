import { Contract, VehicleType, FreightRate } from '../types';

// --- COMPREHENSIVE INDIAN LOGISTICS CONTRACTS (15 Contracts) ---
const SEED_CONTRACTS: Contract[] = [
    // 1. TCI Express - Express Service (COMPREHENSIVE CONTRACT)
    {
        id: 'CNT-2024-001',
        vendorId: 'TCI001',
        vendorName: 'TCI Express Limited',
        serviceType: 'Express',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-001', origin: 'Delhi', destination: 'Mumbai', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Kg', baseRate: 12.50, transitTimeHrs: 36, baseFreight: 12.50 },
            { id: 'fr-002', origin: 'Mumbai', destination: 'Bangalore', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Kg', baseRate: 14.00, transitTimeHrs: 24, baseFreight: 14.00 },
            { id: 'fr-003', origin: 'Delhi', destination: 'Bangalore', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Kg', baseRate: 13.50, transitTimeHrs: 36, baseFreight: 13.50 },
            { id: 'fr-004', origin: 'Delhi', destination: 'Kolkata', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Kg', baseRate: 14.50, transitTimeHrs: 48, baseFreight: 14.50 }
        ],
        pvcConfig: { baseDieselPrice: 94.50, mileageBenchmark: 4.0, referenceCity: 'Delhi' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 1500, excludeHolidays: true },
            oda: { distanceThreshold: 50, surcharge: 2000 },
            tolls: { isInclusive: false }
        },

        // DEEP CONTRACT DETAILS
        contractVersion: 'v2.1',
        parties: {
            shipper: {
                name: 'Hitachi Energy India Limited',
                legalEntity: 'Hitachi Energy India Limited',
                address: 'Plot No. 5A, MIDC Industrial Area, Ranjangaon, Pune - 412220, Maharashtra, India',
                gstin: '27AABCH1234F1Z5',
                pan: 'AABCH1234F'
            },
            carrier: {
                name: 'TCI Express Limited',
                legalEntity: 'Transport Corporation of India Express Limited',
                address: 'TCI House, 69 Institutional Area, Sector 32, Gurugram - 122001, Haryana, India',
                gstin: '06AAACT1234M1Z2',
                pan: 'AAACT1234M'
            }
        },
        governingLaw: 'Indian Contract Act, 1872; Carriage of Goods by Road Act, 2007; Motor Vehicles Act, 1988. Jurisdiction: Delhi High Court',
        sla: {
            onTimeDeliveryTarget: 95,
            podSubmissionDays: 7,
            damageLimitPercent: 0.5,
            claimRatioTarget: 1.0,
            responseTimeHours: 4,
            penalties: [
                {
                    metric: 'On-Time Delivery',
                    threshold: '< 90%',
                    penalty: '₹5,000 per delayed shipment or 2% of freight value, whichever is higher'
                },
                {
                    metric: 'POD Submission',
                    threshold: '> 10 days',
                    penalty: '₹1,000 per day of delay beyond 10 days'
                },
                {
                    metric: 'Damage/Loss',
                    threshold: '> 1% of shipments',
                    penalty: 'Full invoice value + ₹10,000 processing fee per incident'
                },
                {
                    metric: 'Response Time',
                    threshold: '> 8 hours',
                    penalty: '₹2,000 per incident for delayed response to critical issues'
                }
            ],
            incentives: [
                {
                    metric: 'On-Time Delivery',
                    threshold: '> 98%',
                    reward: '2% bonus on monthly freight charges'
                },
                {
                    metric: 'Zero Damage Month',
                    threshold: '0 damage claims',
                    reward: '₹50,000 monthly bonus'
                }
            ]
        },
        insurance: {
            cargoInsuranceCoverage: 500000,
            liabilityLimitPerShipment: 100000,
            claimsProcess: 'Claims must be filed within 7 days of delivery with POD, damage report, and photographs. Carrier to respond within 15 days. Settlement within 30 days of claim approval.',
            forceMajeure: 'Carrier not liable for delays/damages due to: natural disasters (floods, earthquakes), strikes, riots, government actions, war, pandemic, or any event beyond reasonable control. Notice to be provided within 24 hours of such event.'
        },
        termsAndConditions: {
            terminationNotice: '90 days written notice required by either party. Notice period can be waived by mutual written consent.',
            terminationPenalty: 'Early termination without cause: Party terminating to pay 3 months average monthly freight as penalty. Termination for breach: No penalty if 30 days cure period not utilized.',
            disputeResolution: 'All disputes to be resolved through arbitration in Delhi under Arbitration and Conciliation Act, 1996. Single arbitrator to be appointed by mutual consent. Arbitration in English language. Courts in Delhi to have exclusive jurisdiction.',
            confidentiality: 'Both parties agree to maintain strict confidentiality of: (a) Rate cards and pricing, (b) Volume commitments, (c) Performance data, (d) Business strategies. Breach may result in immediate termination and legal action.',
            compliance: 'Carrier must comply with: (a) Motor Vehicles Act, 1988, (b) GST Act, 2017, (c) E-way bill regulations, (d) Labor laws, (e) Environmental regulations, (f) All applicable central and state laws. Carrier to maintain valid permits, licenses, and insurance.',
            amendment: 'Contract amendments require written approval from authorized signatories of both parties. Email approvals acceptable if from registered email IDs. Rate revisions allowed quarterly based on diesel price index (±10% threshold).'
        },
        gstDetails: {
            rcmApplicable: true,
            gstRate: 5,
            rcmSplitRatio: '50:50 (Shipper pays 2.5% CGST + 2.5% SGST under RCM)',
            placeOfSupply: 'As per delivery location. Interstate: IGST applicable. Intrastate: CGST + SGST applicable.',
            invoicingRequirements: 'E-way bill mandatory for consignments > ₹50,000. Invoice must contain: GSTIN, HSN code, place of supply, vehicle number. Submit within 24 hours of dispatch.'
        },
        relatedInvoiceIds: ['INV-2024-1234', 'INV-2024-1567', 'INV-2024-1890'],
        relatedShipmentIds: ['SHP-2024-5001', 'SHP-2024-5002', 'SHP-2024-5003'],
        performanceGrade: 'A',
        lastAmendmentDate: '2024-05-15',
        nextReviewDate: '2024-12-31',
        spendMTD: 425000,
        utilizationPercent: 48.5
    },

    // 2. Blue Dart - Air Express
    {
        id: 'CNT-2024-002',
        vendorId: 'BD001',
        vendorName: 'Blue Dart Express Limited',
        serviceType: 'Express',
        validFrom: '2024-01-01',
        validTo: '2025-06-30',
        paymentTerms: 'Net 30',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-005', origin: 'Mumbai', destination: 'Delhi', vehicleType: 'Air', capacityTon: 2, rateBasis: 'Per Kg', baseRate: 18.00, transitTimeHrs: 12, baseFreight: 18.00 },
            { id: 'fr-006', origin: 'Bangalore', destination: 'Chennai', vehicleType: 'Air', capacityTon: 2, rateBasis: 'Per Kg', baseRate: 15.00, transitTimeHrs: 8, baseFreight: 15.00 },
            { id: 'fr-007', origin: 'Delhi', destination: 'Bangalore', vehicleType: 'Air', capacityTon: 2, rateBasis: 'Per Kg', baseRate: 19.00, transitTimeHrs: 10, baseFreight: 19.00 }
        ],
        pvcConfig: { baseDieselPrice: 102.80, mileageBenchmark: 5.0, referenceCity: 'Mumbai' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 12, freeTimeUnloading: 12, ratePerDay: 2000, excludeHolidays: true },
            oda: { distanceThreshold: 30, surcharge: 1500 },
            tolls: { isInclusive: true }
        }
    },

    // 3. Delhivery - Surface Logistics
    {
        id: 'CNT-2024-003',
        vendorId: 'DEL001',
        vendorName: 'Delhivery Limited',
        serviceType: 'LTL',
        validFrom: '2024-01-01',
        validTo: '2026-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-008', origin: 'Delhi', destination: 'Mumbai', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 8.50, minCharge: 1000, transitTimeHrs: 72, baseFreight: 8.50 },
            { id: 'fr-009', origin: 'Mumbai', destination: 'Bangalore', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 9.00, minCharge: 1000, transitTimeHrs: 48, baseFreight: 9.00 },
            { id: 'fr-010', origin: 'Delhi', destination: 'Bangalore', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 8.50, minCharge: 1000, transitTimeHrs: 84, baseFreight: 8.50 }
        ],
        pvcConfig: { baseDieselPrice: 94.50, mileageBenchmark: 6.5, referenceCity: 'Gurugram' },
        accessorials: {
            loadingUnloading: { isIncluded: false, ratePerTon: 200 },
            detention: { freeTimeLoading: 12, freeTimeUnloading: 12, ratePerDay: 1000, excludeHolidays: false },
            oda: { distanceThreshold: 25, surcharge: 500 },
            tolls: { isInclusive: true }
        }
    },

    // 4. VRL Logistics - Surface Transport
    {
        id: 'CNT-2024-004',
        vendorId: 'VRL001',
        vendorName: 'VRL Logistics Limited',
        serviceType: 'LTL',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 30',
        isRCMApplicable: false,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-011', origin: 'Chennai', destination: 'Kolkata', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 10.00, minCharge: 1500, transitTimeHrs: 96, baseFreight: 10.00 },
            { id: 'fr-012', origin: 'Pune', destination: 'Ahmedabad', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 7.50, minCharge: 1000, transitTimeHrs: 48, baseFreight: 7.50 }
        ],
        pvcConfig: { baseDieselPrice: 98.20, mileageBenchmark: 6.0, referenceCity: 'Bangalore' },
        accessorials: {
            loadingUnloading: { isIncluded: false, ratePerTon: 150 },
            detention: { freeTimeLoading: 12, freeTimeUnloading: 12, ratePerDay: 800, excludeHolidays: false },
            oda: { distanceThreshold: 30, surcharge: 600 },
            tolls: { isInclusive: true }
        }
    },

    // 5. Gati - Multi-modal
    {
        id: 'CNT-2024-005',
        vendorId: 'GATI001',
        vendorName: 'Gati Limited',
        serviceType: 'LTL',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-013', origin: 'Mumbai', destination: 'Chennai', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 8.00, minCharge: 1200, transitTimeHrs: 60, baseFreight: 8.00 },
            { id: 'fr-014', origin: 'Hyderabad', destination: 'Mumbai', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 12.00, minCharge: 1500, transitTimeHrs: 48, baseFreight: 12.00 }
        ],
        pvcConfig: { baseDieselPrice: 97.30, mileageBenchmark: 6.0, referenceCity: 'Hyderabad' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 1200, excludeHolidays: true },
            oda: { distanceThreshold: 40, surcharge: 1000 },
            tolls: { isInclusive: false }
        }
    },

    // 6. Safexpress - Express Cargo
    {
        id: 'CNT-2024-006',
        vendorId: 'SFEX001',
        vendorName: 'Safexpress Private Limited',
        serviceType: 'Express',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-015', origin: 'Pune', destination: 'Ahmedabad', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 11.00, transitTimeHrs: 36, baseFreight: 11.00 },
            { id: 'fr-016', origin: 'Jaipur', destination: 'Lucknow', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 11.50, transitTimeHrs: 24, baseFreight: 11.50 }
        ],
        pvcConfig: { baseDieselPrice: 94.50, mileageBenchmark: 5.5, referenceCity: 'Delhi' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 1500, excludeHolidays: true },
            oda: { distanceThreshold: 50, surcharge: 1800 },
            tolls: { isInclusive: false }
        }
    },

    // 7. Rivigo - FTL Tech-enabled
    {
        id: 'CNT-2024-007',
        vendorId: 'RVGO001',
        vendorName: 'Rivigo Services Private Limited',
        serviceType: 'FTL',
        validFrom: '2024-01-01',
        validTo: '2026-12-31',
        paymentTerms: 'Net 60',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-017', origin: 'Delhi', destination: 'Mumbai', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Trip', baseRate: 45000, transitTimeHrs: 48, baseFreight: 45000 },
            { id: 'fr-018', origin: 'Mumbai', destination: 'Bangalore', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Trip', baseRate: 38000, transitTimeHrs: 36, baseFreight: 38000 }
        ],
        pvcConfig: { baseDieselPrice: 94.50, mileageBenchmark: 4.0, referenceCity: 'Gurugram' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 2500, excludeHolidays: true },
            oda: { distanceThreshold: 50, surcharge: 3000 },
            tolls: { isInclusive: false }
        }
    },

    // 8. DTDC - Courier & Cargo
    {
        id: 'CNT-2024-008',
        vendorId: 'DTDC001',
        vendorName: 'DTDC Express Limited',
        serviceType: 'Express',
        validFrom: '2024-06-01',
        validTo: '2025-05-31',
        paymentTerms: 'Net 30',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-019', origin: 'Bangalore', destination: 'Chennai', vehicleType: '10-Tyre', capacityTon: 9, rateBasis: 'Per Kg', baseRate: 10.00, transitTimeHrs: 18, baseFreight: 10.00 }
        ],
        pvcConfig: { baseDieselPrice: 98.20, mileageBenchmark: 5.0, referenceCity: 'Bangalore' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 12, freeTimeUnloading: 12, ratePerDay: 1000, excludeHolidays: true },
            oda: { distanceThreshold: 25, surcharge: 800 },
            tolls: { isInclusive: true }
        }
    },

    // 9. Professional Couriers - Document & Parcel
    {
        id: 'CNT-2024-009',
        vendorId: 'PROF001',
        vendorName: 'Professional Couriers',
        serviceType: 'Express',
        validFrom: '2024-01-01',
        validTo: '2025-03-31',
        paymentTerms: 'Net 30',
        isRCMApplicable: false,
        status: 'EXPIRING',
        freightMatrix: [
            { id: 'fr-020', origin: 'Mumbai', destination: 'Pune', vehicleType: 'Van', capacityTon: 1, rateBasis: 'Per Kg', baseRate: 6.00, minCharge: 300, transitTimeHrs: 6, baseFreight: 6.00 }
        ],
        pvcConfig: { baseDieselPrice: 102.80, mileageBenchmark: 8.0, referenceCity: 'Mumbai' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 6, freeTimeUnloading: 6, ratePerDay: 500, excludeHolidays: false },
            oda: { distanceThreshold: 20, surcharge: 300 },
            tolls: { isInclusive: true }
        }
    },

    // 10. Ecom Express - E-commerce Focused
    {
        id: 'CNT-2024-010',
        vendorId: 'ECOM001',
        vendorName: 'Ecom Express Private Limited',
        serviceType: 'Express',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-021', origin: 'Delhi', destination: 'Mumbai', vehicleType: '19ft', capacityTon: 7, rateBasis: 'Per Kg', baseRate: 11.00, transitTimeHrs: 48, baseFreight: 11.00 }
        ],
        pvcConfig: { baseDieselPrice: 94.50, mileageBenchmark: 6.0, referenceCity: 'Gurugram' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 12, freeTimeUnloading: 12, ratePerDay: 1200, excludeHolidays: true },
            oda: { distanceThreshold: 30, surcharge: 1000 },
            tolls: { isInclusive: true }
        }
    },

    // 11. XpressBees - Last Mile
    {
        id: 'CNT-2024-011',
        vendorId: 'XPRS001',
        vendorName: 'XpressBees Logistics Solutions',
        serviceType: 'Express',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 30',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-022', origin: 'Pune', destination: 'Mumbai', vehicleType: 'Van', capacityTon: 1, rateBasis: 'Per Kg', baseRate: 5.50, minCharge: 250, transitTimeHrs: 6, baseFreight: 5.50 }
        ],
        pvcConfig: { baseDieselPrice: 99.50, mileageBenchmark: 8.0, referenceCity: 'Pune' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 6, freeTimeUnloading: 6, ratePerDay: 400, excludeHolidays: false },
            oda: { distanceThreshold: 15, surcharge: 200 },
            tolls: { isInclusive: true }
        }
    },

    // 12. Shadowfax - Hyperlocal
    {
        id: 'CNT-2024-012',
        vendorId: 'SHDW001',
        vendorName: 'Shadowfax Technologies',
        serviceType: 'Express',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 30',
        isRCMApplicable: false,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-023', origin: 'Bangalore', destination: 'Bangalore', vehicleType: 'Bike', capacityTon: 0.05, rateBasis: 'Per Kg', baseRate: 3.00, minCharge: 50, transitTimeHrs: 2, baseFreight: 3.00 }
        ],
        pvcConfig: { baseDieselPrice: 98.20, mileageBenchmark: 40.0, referenceCity: 'Bangalore' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 1, freeTimeUnloading: 1, ratePerDay: 100, excludeHolidays: false },
            oda: { distanceThreshold: 10, surcharge: 50 },
            tolls: { isInclusive: true }
        }
    },

    // 13. Mahindra Logistics - 3PL
    {
        id: 'CNT-2024-013',
        vendorId: 'MLOG001',
        vendorName: 'Mahindra Logistics Limited',
        serviceType: 'FTL',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 60',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-024', origin: 'Mumbai', destination: 'Delhi', vehicleType: '32ft SXL', capacityTon: 20, rateBasis: 'Per Trip', baseRate: 48000, transitTimeHrs: 48, baseFreight: 48000 }
        ],
        pvcConfig: { baseDieselPrice: 102.80, mileageBenchmark: 3.5, referenceCity: 'Mumbai' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 3000, excludeHolidays: true },
            oda: { distanceThreshold: 50, surcharge: 3500 },
            tolls: { isInclusive: false }
        }
    },

    // 14. Allcargo - Integrated Logistics
    {
        id: 'CNT-2024-014',
        vendorId: 'ALCG001',
        vendorName: 'Allcargo Logistics Limited',
        serviceType: 'FTL',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'ACTIVE',
        freightMatrix: [
            { id: 'fr-025', origin: 'Chennai', destination: 'Mumbai', vehicleType: '32ft MXL', capacityTon: 15, rateBasis: 'Per Trip', baseRate: 42000, transitTimeHrs: 60, baseFreight: 42000 }
        ],
        pvcConfig: { baseDieselPrice: 96.50, mileageBenchmark: 4.0, referenceCity: 'Chennai' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 2500, excludeHolidays: true },
            oda: { distanceThreshold: 50, surcharge: 2800 },
            tolls: { isInclusive: false }
        }
    },

    // 15. Transport Corporation of India - Multi-modal
    {
        id: 'CNT-2024-015',
        vendorId: 'TCIL001',
        vendorName: 'Transport Corporation of India',
        serviceType: 'FTL',
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        paymentTerms: 'Net 45',
        isRCMApplicable: true,
        status: 'PENDING_APPROVAL',
        freightMatrix: [],
        pvcConfig: { baseDieselPrice: 94.50, mileageBenchmark: 4.0, referenceCity: 'Gurugram' },
        accessorials: {
            loadingUnloading: { isIncluded: true },
            detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 2000, excludeHolidays: true },
            oda: { distanceThreshold: 50, surcharge: 2500 },
            tolls: { isInclusive: false }
        }
    }
];

// --- SERVICE CLASS (NOW USES MYSQL API!) ---
const API_BASE = 'http://localhost:5000';

class ContractService {
    private contracts: Contract[] = [];
    private loaded: boolean = false;
    private loading: Promise<void> | null = null;

    constructor() {
        // Auto-load on construction
        this.loadFromAPI();
    }

    // ===================================
    // ASYNC API METHODS (Primary)
    // ===================================

    async loadFromAPI(): Promise<void> {
        if (this.loading) return this.loading;

        this.loading = (async () => {
            try {
                const response = await fetch(`${API_BASE}/api/contracts`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && Array.isArray(result.data)) {
                        this.contracts = result.data.map(this.mapApiContract);
                        this.loaded = true;
                        console.log(`[ContractService] ✅ Loaded ${this.contracts.length} contracts from MySQL`);
                    }
                }
            } catch (error) {
                console.error('[ContractService] API error, using fallback:', error);
                // Fallback to localStorage if API fails
                this.loadFromLocalStorage();
            }
            this.loading = null;
        })();

        return this.loading;
    }

    private loadFromLocalStorage(): void {
        const stored = localStorage.getItem('contracts_indian_v4');
        if (stored) {
            this.contracts = JSON.parse(stored);
            this.loaded = true;
            console.log('[ContractService] Loaded from localStorage fallback');
        } else {
            this.contracts = SEED_CONTRACTS;
            this.loaded = true;
        }
    }

    private mapApiContract(apiContract: any): Contract {
        // Map API response format to frontend Contract type
        return {
            id: apiContract.id,
            vendorId: apiContract.vendor_id,
            vendorName: apiContract.vendor_name,
            serviceType: apiContract.service_type,
            validFrom: apiContract.valid_from,
            validTo: apiContract.valid_to,
            paymentTerms: apiContract.payment_terms,
            isRCMApplicable: apiContract.is_rcm_applicable,
            status: apiContract.status,
            freightMatrix: (apiContract.freightMatrix || apiContract.freight_rates || []).map((r: any) => ({
                id: r.id,
                origin: r.origin,
                destination: r.destination,
                vehicleType: r.vehicle_type || r.vehicleType,
                capacityTon: r.capacity_ton || r.capacityTon,
                rateBasis: r.rate_basis || r.rateBasis,
                baseRate: parseFloat(r.base_rate || r.baseRate || 0),
                minCharge: r.min_charge || r.minCharge,
                transitTimeHrs: r.transit_time_hrs || r.transitTimeHrs,
                baseFreight: parseFloat(r.base_rate || r.baseRate || 0)
            })),
            pvcConfig: {
                baseDieselPrice: parseFloat(apiContract.pvc_base_diesel_price || 94.50),
                mileageBenchmark: parseFloat(apiContract.pvc_mileage_benchmark || 4.0),
                referenceCity: apiContract.pvc_reference_city || 'Delhi'
            },
            accessorials: apiContract.accessorials || {
                loadingUnloading: { isIncluded: true },
                detention: { freeTimeLoading: 24, freeTimeUnloading: 24, ratePerDay: 1500, excludeHolidays: true },
                oda: { distanceThreshold: 50, surcharge: 2000 },
                tolls: { isInclusive: false }
            }
        };
    }

    async fetchAllAsync(): Promise<Contract[]> {
        await this.loadFromAPI();
        return this.contracts;
    }

    async fetchByIdAsync(id: string): Promise<Contract | null> {
        try {
            const response = await fetch(`${API_BASE}/api/contracts/${id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    return this.mapApiContract(result.data);
                }
            }
        } catch (error) {
            console.error('[ContractService] Error fetching contract:', error);
        }
        // Fallback to local cache
        return this.contracts.find(c => c.id === id) || null;
    }

    async createAsync(contract: Contract): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/contracts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: contract.id,
                    vendor_id: contract.vendorId,
                    vendor_name: contract.vendorName,
                    service_type: contract.serviceType,
                    valid_from: contract.validFrom,
                    valid_to: contract.validTo,
                    payment_terms: contract.paymentTerms,
                    is_rcm_applicable: contract.isRCMApplicable,
                    status: contract.status,
                    pvc_base_diesel_price: contract.pvcConfig?.baseDieselPrice,
                    pvc_mileage_benchmark: contract.pvcConfig?.mileageBenchmark,
                    pvc_reference_city: contract.pvcConfig?.referenceCity,
                    freightMatrix: contract.freightMatrix
                })
            });

            if (response.ok) {
                // Refresh local cache
                await this.loadFromAPI();
                return true;
            }
        } catch (error) {
            console.error('[ContractService] Error creating contract:', error);
        }

        // Fallback: add to local cache
        this.contracts.unshift(contract);
        return true;
    }

    async updateAsync(contract: Contract): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/contracts/${contract.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendor_name: contract.vendorName,
                    service_type: contract.serviceType,
                    valid_from: contract.validFrom,
                    valid_to: contract.validTo,
                    payment_terms: contract.paymentTerms,
                    is_rcm_applicable: contract.isRCMApplicable,
                    status: contract.status
                })
            });

            if (response.ok) {
                await this.loadFromAPI();
                return true;
            }
        } catch (error) {
            console.error('[ContractService] Error updating contract:', error);
        }

        // Fallback: update local cache
        const idx = this.contracts.findIndex(c => c.id === contract.id);
        if (idx !== -1) {
            this.contracts[idx] = contract;
        }
        return true;
    }

    async deleteAsync(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/contracts/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadFromAPI();
                return true;
            }
        } catch (error) {
            console.error('[ContractService] Error deleting contract:', error);
        }

        // Fallback: remove from local cache
        this.contracts = this.contracts.filter(c => c.id !== id);
        return true;
    }

    // ===================================
    // SYNC METHODS (Backward Compatibility)
    // ===================================

    getAll(): Contract[] {
        if (!this.loaded) {
            this.loadFromLocalStorage();
        }
        return this.contracts;
    }

    getById(id: string): Contract | undefined {
        return this.contracts.find(c => c.id === id);
    }

    add(contract: Contract) {
        this.contracts.unshift(contract);
        // Fire and forget API call
        this.createAsync(contract).catch(console.error);
    }

    update(contract: Contract) {
        const idx = this.contracts.findIndex(c => c.id === contract.id);
        if (idx !== -1) {
            this.contracts[idx] = contract;
            // Fire and forget API call
            this.updateAsync(contract).catch(console.error);
        }
    }

    reset() {
        this.contracts = SEED_CONTRACTS;
        this.loadFromAPI();
    }

    // ===================================
    // LOGIC ENGINE (unchanged)
    // ===================================

    calculateFreight(params: any): any {
        const contract = this.getById(params.contractId);
        if (!contract) {
            return { totalCost: 0, baseFreight: 0, fuelSurcharge: 0, breakdown: [], isError: true, errorMessage: 'Contract not found' };
        }

        const rateEntry = contract.freightMatrix.find(
            r => r.origin.toLowerCase() === params.origin.toLowerCase() &&
                r.destination.toLowerCase() === params.destination.toLowerCase() &&
                r.vehicleType === params.vehicleType
        );

        if (!rateEntry) {
            return { totalCost: 0, baseFreight: 0, fuelSurcharge: 0, breakdown: [], isError: true, errorMessage: `No rate found for ${params.origin} to ${params.destination} (${params.vehicleType})` };
        }

        let baseFreight = 0;
        if (rateEntry.rateBasis === 'Per Trip') {
            baseFreight = rateEntry.baseRate;
        } else if (rateEntry.rateBasis === 'Per Kg') {
            baseFreight = rateEntry.baseRate * (params.weight || 1000);
            if (rateEntry.minCharge && baseFreight < rateEntry.minCharge) {
                baseFreight = rateEntry.minCharge;
            }
        }

        const { baseDieselPrice, mileageBenchmark } = contract.pvcConfig;
        const priceDiff = params.currentDieselPrice - baseDieselPrice;

        let fuelSurcharge = 0;
        if (priceDiff > 0) {
            fuelSurcharge = (priceDiff / mileageBenchmark) * params.distanceKm;
        }

        const totalCost = baseFreight + fuelSurcharge;

        return {
            totalCost,
            baseFreight,
            fuelSurcharge,
            breakdown: [
                `Base Freight (${rateEntry.rateBasis}): ₹${baseFreight.toLocaleString()}`,
                `PVC Surcharge: ₹${fuelSurcharge.toLocaleString(undefined, { maximumFractionDigits: 0 })} ((${params.currentDieselPrice} - ${baseDieselPrice}) / ${mileageBenchmark} * ${params.distanceKm}km)`,
                `Total Estimated: ₹${totalCost.toLocaleString()}`
            ],
            isError: false
        };
    }
}

export const contractService = new ContractService();
