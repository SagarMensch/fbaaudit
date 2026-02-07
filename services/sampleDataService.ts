// Sample Data Initialization Service
// Populates master data and invoices with realistic, linked sample data

import MasterDataService from './masterDataService';
import InvoiceStorageService from './invoiceStorageService';
import DuplicateDetectionService from './duplicateDetectionService';

class SampleDataService {
    private initialized = false;

    initializeSampleData(): void {
        if (this.initialized) {
            console.log('Sample data already initialized');
            return;
        }

        console.log('Initializing sample data...');

        // 1. Create Vendors
        this.createSampleVendors();

        // 2. Create Rates
        this.createSampleRates();

        // 3. Create Fuel Rates
        this.createSampleFuelRates();

        // 4. Create Sample Invoices
        this.createSampleInvoices();

        this.initialized = true;
        console.log('Sample data initialization complete!');
    }

    private createSampleVendors(): void {
        const vendors = [
            {
                vendorCode: 'TCI001',
                vendorName: 'TCI Express Limited',
                gstin: '27AABCT1234R1Z5',
                pan: 'AABCT1234R',
                contactPerson: 'Rajesh Kumar',
                contactEmail: 'rajesh.kumar@tciexpress.in',
                contactPhone: '+91 9876543210',
                address: 'TCI House, 69 Institutional Area, Sector 32',
                city: 'Gurugram',
                state: 'Haryana',
                pincode: '122001',
                status: 'active' as const,
                linkedContracts: ['CNT-2024-001', 'CNT-2024-002'],
                createdBy: 'System Admin'
            },
            {
                vendorCode: 'BDT001',
                vendorName: 'Blue Dart Express Limited',
                gstin: '27AABCB5678R1Z9',
                pan: 'AABCB5678R',
                contactPerson: 'Amit Sharma',
                contactEmail: 'amit.sharma@bluedart.com',
                contactPhone: '+91 9876543211',
                address: 'Blue Dart Centre, Sahar Airport Road, Andheri East',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400099',
                status: 'active' as const,
                linkedContracts: ['CNT-2024-003'],
                createdBy: 'System Admin'
            },
            {
                vendorCode: 'DEL001',
                vendorName: 'Delhivery Limited',
                gstin: '27AABCD9012R1Z3',
                pan: 'AABCD9012R',
                contactPerson: 'Priya Singh',
                contactEmail: 'priya.singh@delhivery.com',
                contactPhone: '+91 9876543212',
                address: 'Delhivery House, Plot No. 5, Sector 44',
                city: 'Gurugram',
                state: 'Haryana',
                pincode: '122003',
                status: 'active' as const,
                linkedContracts: ['CNT-2024-004'],
                createdBy: 'System Admin'
            },
            {
                vendorCode: 'VRL001',
                vendorName: 'VRL Logistics Limited',
                gstin: '29AABCV3456R1Z7',
                pan: 'AABCV3456R',
                contactPerson: 'Suresh Patil',
                contactEmail: 'suresh.patil@vrllogistics.com',
                contactPhone: '+91 9876543213',
                address: 'VRL House, Hosur Road',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560068',
                status: 'active' as const,
                linkedContracts: ['CNT-2024-005'],
                createdBy: 'System Admin'
            },
            {
                vendorCode: 'GATI001',
                vendorName: 'Gati Limited',
                gstin: '36AABCG7890R1Z1',
                pan: 'AABCG7890R',
                contactPerson: 'Venkat Reddy',
                contactEmail: 'venkat.reddy@gati.com',
                contactPhone: '+91 9876543214',
                address: 'Gati House, Plot No. 20, Kothaguda',
                city: 'Hyderabad',
                state: 'Telangana',
                pincode: '500084',
                status: 'active' as const,
                linkedContracts: ['CNT-2024-006'],
                createdBy: 'System Admin'
            }
        ];

        vendors.forEach(vendor => {
            MasterDataService.createVendor(vendor);
            // Auto-approve for demo
            const created = MasterDataService.getVendorByCode(vendor.vendorCode);
            if (created) {
                MasterDataService.approveVendor(created.id, 'System Admin');
            }
        });

        console.log(`Created ${vendors.length} sample vendors`);
    }

    private createSampleRates(): void {
        const today = new Date();
        const validFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]; // Jan 1
        const validTo = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0]; // Dec 31

        const rates = [
            // TCI Express Routes
            {
                contractId: 'CNT-2024-001',
                vendorCode: 'TCI001',
                deliveryType: 'Express' as const,
                source: 'Delhi',
                destination: 'Mumbai',
                rateType: 'per_kg' as const,
                baseRate: 14.50,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-001',
                vendorCode: 'TCI001',
                deliveryType: 'Express' as const,
                source: 'Delhi',
                destination: 'Bangalore',
                rateType: 'per_kg' as const,
                baseRate: 16.00,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-002',
                vendorCode: 'TCI001',
                deliveryType: 'FTL' as const,
                source: 'Mumbai',
                destination: 'Pune',
                rateType: 'per_km' as const,
                baseRate: 25.00,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            // Blue Dart Routes
            {
                contractId: 'CNT-2024-003',
                vendorCode: 'BDT001',
                deliveryType: 'Express' as const,
                source: 'Mumbai',
                destination: 'Delhi',
                rateType: 'per_kg' as const,
                baseRate: 15.00,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-003',
                vendorCode: 'BDT001',
                deliveryType: 'Express' as const,
                source: 'Mumbai',
                destination: 'Bangalore',
                rateType: 'per_kg' as const,
                baseRate: 13.50,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            // Delhivery Routes
            {
                contractId: 'CNT-2024-004',
                vendorCode: 'DEL001',
                deliveryType: 'LTL' as const,
                source: 'Delhi',
                destination: 'Kolkata',
                rateType: 'per_kg' as const,
                baseRate: 12.00,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-004',
                vendorCode: 'DEL001',
                deliveryType: 'LTL' as const,
                source: 'Bangalore',
                destination: 'Chennai',
                rateType: 'per_kg' as const,
                baseRate: 10.50,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            // VRL Logistics Routes
            {
                contractId: 'CNT-2024-005',
                vendorCode: 'VRL001',
                deliveryType: 'FTL' as const,
                source: 'Bangalore',
                destination: 'Hyderabad',
                rateType: 'per_km' as const,
                baseRate: 22.00,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            // Gati Routes
            {
                contractId: 'CNT-2024-006',
                vendorCode: 'GATI001',
                deliveryType: 'Express' as const,
                source: 'Hyderabad',
                destination: 'Mumbai',
                rateType: 'per_kg' as const,
                baseRate: 14.00,
                currency: 'INR' as const,
                validFrom,
                validTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            }
        ];

        rates.forEach(rate => {
            MasterDataService.createRate(rate);
        });

        console.log(`Created ${rates.length} sample rates`);
    }

    private createSampleFuelRates(): void {
        const today = new Date();
        const effectiveFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        const effectiveTo = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];

        const fuelRates = [
            {
                contractId: 'CNT-2024-001',
                fuelRate: 15.0,
                effectiveFrom,
                effectiveTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-002',
                fuelRate: 15.0,
                effectiveFrom,
                effectiveTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-003',
                fuelRate: 15.0,
                effectiveFrom,
                effectiveTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-004',
                fuelRate: 15.0,
                effectiveFrom,
                effectiveTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-005',
                fuelRate: 15.0,
                effectiveFrom,
                effectiveTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            },
            {
                contractId: 'CNT-2024-006',
                fuelRate: 15.0,
                effectiveFrom,
                effectiveTo,
                status: 'active' as const,
                createdBy: 'System Admin'
            }
        ];

        fuelRates.forEach(fuelRate => {
            MasterDataService.createFuelRate(fuelRate);
        });

        console.log(`Created ${fuelRates.length} sample fuel rates`);
    }

    private createSampleInvoices(): void {
        const vendors = MasterDataService.getAllVendors();
        const today = new Date();

        const invoices = [
            // TCI Express Invoices
            {
                invoiceNumber: 'TCI/2024/001',
                supplierId: vendors.find(v => v.vendorCode === 'TCI001')?.id || 'TCI001',
                supplierName: 'TCI Express Limited',
                lrNumber: 'LR-TCI-2024-001',
                origin: 'Delhi',
                destination: 'Mumbai',
                weight: 500,
                rate: 14.50,
                baseAmount: 7250,
                fuelSurcharge: 1087.50,
                gst: 1500.75,
                totalAmount: 9838.25,
                submittedDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'APPROVED' as const,
                podStatus: 'UPLOADED' as const
            },
            {
                invoiceNumber: 'TCI/2024/002',
                supplierId: vendors.find(v => v.vendorCode === 'TCI001')?.id || 'TCI001',
                supplierName: 'TCI Express Limited',
                lrNumber: 'LR-TCI-2024-002',
                origin: 'Delhi',
                destination: 'Bangalore',
                weight: 750,
                rate: 16.00,
                baseAmount: 12000,
                fuelSurcharge: 1800,
                gst: 2484,
                totalAmount: 16284,
                submittedDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'UNDER_REVIEW' as const,
                podStatus: 'PENDING' as const,
                dispute: {
                    id: 'TKT-9002',
                    status: 'OPEN',
                    messages: [
                        { id: '1', sender: 'SYSTEM', text: 'Shortage deduction of ₹1,200 applied due to weight discrepancy.', timestamp: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString() },
                        { id: '2', sender: 'VENDOR', text: 'We have dispatched the proof of delivery. Please verify.', timestamp: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString() }
                    ]
                }
            },
            // Blue Dart Invoices
            {
                invoiceNumber: 'BD/2024/001',
                supplierId: vendors.find(v => v.vendorCode === 'BDT001')?.id || 'BDT001',
                supplierName: 'Blue Dart Express Limited',
                lrNumber: 'LR-BD-2024-001',
                origin: 'Mumbai',
                destination: 'Delhi',
                weight: 300,
                rate: 15.00,
                baseAmount: 4500,
                fuelSurcharge: 675,
                gst: 931.50,
                totalAmount: 6106.50,
                submittedDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'APPROVED' as const,
                podStatus: 'UPLOADED' as const
            },
            {
                invoiceNumber: 'BD/2024/002',
                supplierId: vendors.find(v => v.vendorCode === 'BDT001')?.id || 'BDT001',
                supplierName: 'Blue Dart Express Limited',
                lrNumber: 'LR-BD-2024-002',
                origin: 'Mumbai',
                destination: 'Bangalore',
                weight: 600,
                rate: 13.50,
                baseAmount: 8100,
                fuelSurcharge: 1215,
                gst: 1676.70,
                totalAmount: 10991.70,
                submittedDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'SUBMITTED' as const,
                podStatus: 'PENDING' as const
            },
            // Delhivery Invoices
            {
                invoiceNumber: 'DEL/2024/001',
                supplierId: vendors.find(v => v.vendorCode === 'DEL001')?.id || 'DEL001',
                supplierName: 'Delhivery Limited',
                lrNumber: 'LR-DEL-2024-001',
                origin: 'Delhi',
                destination: 'Kolkata',
                weight: 1000,
                rate: 12.00,
                baseAmount: 12000,
                fuelSurcharge: 1800,
                gst: 2484,
                totalAmount: 16284,
                submittedDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'APPROVED' as const,
                podStatus: 'UPLOADED' as const
            },
            {
                invoiceNumber: 'DEL/2024/002',
                supplierId: vendors.find(v => v.vendorCode === 'DEL001')?.id || 'DEL001',
                supplierName: 'Delhivery Limited',
                lrNumber: 'LR-DEL-2024-002',
                origin: 'Bangalore',
                destination: 'Chennai',
                weight: 800,
                rate: 10.50,
                baseAmount: 8400,
                fuelSurcharge: 1260,
                gst: 1738.80,
                totalAmount: 11398.80,
                submittedDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'UNDER_REVIEW' as const,
                podStatus: 'PENDING' as const
            },
            // VRL Logistics Invoice
            {
                invoiceNumber: 'VRL/2024/001',
                supplierId: vendors.find(v => v.vendorCode === 'VRL001')?.id || 'VRL001',
                supplierName: 'VRL Logistics Limited',
                lrNumber: 'LR-VRL-2024-001',
                origin: 'Bangalore',
                destination: 'Hyderabad',
                weight: 2000,
                rate: 22.00,
                baseAmount: 44000,
                fuelSurcharge: 6600,
                gst: 9108,
                totalAmount: 59708,
                submittedDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'APPROVED' as const,
                podStatus: 'UPLOADED' as const
            },
            // Gati Invoice
            {
                invoiceNumber: 'GATI/2024/001',
                supplierId: vendors.find(v => v.vendorCode === 'GATI001')?.id || 'GATI001',
                supplierName: 'Gati Limited',
                lrNumber: 'LR-GATI-2024-001',
                origin: 'Hyderabad',
                destination: 'Mumbai',
                weight: 450,
                rate: 14.00,
                baseAmount: 6300,
                fuelSurcharge: 945,
                gst: 1304.10,
                totalAmount: 8549.10,
                submittedDate: today.toISOString().split('T')[0],
                status: 'SUBMITTED' as const,
                podStatus: 'PENDING' as const
            }
        ];

        invoices.forEach(invoice => {
            InvoiceStorageService.submitInvoice(invoice as any);
            // Add to duplicate detection history
            DuplicateDetectionService.addToHistory(invoice as any);
        });

        console.log(`Created ${invoices.length} sample invoices`);
    }

    resetData(): void {
        this.initialized = false;
        console.log('Sample data reset - ready for re-initialization');
    }
}

export default new SampleDataService();
