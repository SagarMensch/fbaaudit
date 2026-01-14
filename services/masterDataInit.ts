// Comprehensive Indian Logistics Master Data
// This file contains all master data for the freight audit platform

import MasterDataService from './masterDataService';

// Initialize all master data
export const initializeMasterData = () => {
    console.log('Initializing comprehensive master data...');

    // ==================== VENDOR MASTER (15 vendors) ====================

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
            linkedContracts: ['CNT-2024-001', 'CNT-2024-005'],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'BD001',
            vendorName: 'Blue Dart Express Limited',
            gstin: '27AABCB5678R1Z6',
            pan: 'AABCB5678R',
            contactPerson: 'Amit Sharma',
            contactEmail: 'amit.sharma@bluedart.com',
            contactPhone: '+91 9876543211',
            address: 'Blue Dart Centre, Sahar Airport Road, Andheri East',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400099',
            status: 'active' as const,
            linkedContracts: ['CNT-2024-002'],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'DEL001',
            vendorName: 'Delhivery Limited',
            gstin: '27AABCD9012R1Z7',
            pan: 'AABCD9012R',
            contactPerson: 'Priya Singh',
            contactEmail: 'priya.singh@delhivery.com',
            contactPhone: '+91 9876543212',
            address: 'Delhivery House, Plot No. 5, Sector 44',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122003',
            status: 'active' as const,
            linkedContracts: ['CNT-2024-003'],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'VRL001',
            vendorName: 'VRL Logistics Limited',
            gstin: '29AABCV3456R1Z8',
            pan: 'AABCV3456R',
            contactPerson: 'Suresh Patil',
            contactEmail: 'suresh.patil@vrllogistics.com',
            contactPhone: '+91 9876543213',
            address: 'VRL House, Hubballi-Dharwad Road',
            city: 'Hubballi',
            state: 'Karnataka',
            pincode: '580030',
            status: 'active' as const,
            linkedContracts: ['CNT-2024-004'],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'GATI001',
            vendorName: 'Gati Limited',
            gstin: '36AABCG7890R1Z9',
            pan: 'AABCG7890R',
            contactPerson: 'Venkat Reddy',
            contactEmail: 'venkat.reddy@gati.com',
            contactPhone: '+91 9876543214',
            address: 'Gati House, Plot No. 20, Kothaguda',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500084',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'SFEX001',
            vendorName: 'Safexpress Private Limited',
            gstin: '07AABCS1234F1Z5',
            pan: 'AABCS1234F',
            contactPerson: 'Anil Gupta',
            contactEmail: 'anil.gupta@safexpress.com',
            contactPhone: '+91 9876543215',
            address: 'Plot No. 98, Sector 27',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110044',
            status: 'active' as const,
            linkedContracts: ['CNT-2024-006'],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'DTDC001',
            vendorName: 'DTDC Express Limited',
            gstin: '29AABCD5678G1Z6',
            pan: 'AABCD5678G',
            contactPerson: 'Karthik Iyer',
            contactEmail: 'karthik.iyer@dtdc.com',
            contactPhone: '+91 9876543216',
            address: 'DTDC House, No. 3, Victoria Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560047',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'PROF001',
            vendorName: 'Professional Couriers',
            gstin: '27AABCP9012H1Z7',
            pan: 'AABCP9012H',
            contactPerson: 'Deepak Mehta',
            contactEmail: 'deepak.mehta@professionalcouriers.com',
            contactPhone: '+91 9876543217',
            address: 'Professional House, Andheri Kurla Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400059',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'ECOM001',
            vendorName: 'Ecom Express Private Limited',
            gstin: '09AABCE3456I1Z8',
            pan: 'AABCE3456I',
            contactPerson: 'Neha Kapoor',
            contactEmail: 'neha.kapoor@ecomexpress.in',
            contactPhone: '+91 9876543218',
            address: 'Plot No. 15, Udyog Vihar Phase 4',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122015',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'XPRS001',
            vendorName: 'XpressBees Logistics Solutions',
            gstin: '29AABCX7890J1Z9',
            pan: 'AABCX7890J',
            contactPerson: 'Rohit Desai',
            contactEmail: 'rohit.desai@xpressbees.com',
            contactPhone: '+91 9876543219',
            address: 'Xpressbees House, Hinjewadi Phase 1',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411057',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'SHDW001',
            vendorName: 'Shadowfax Technologies',
            gstin: '29AABCS4567K1Z0',
            pan: 'AABCS4567K',
            contactPerson: 'Vikram Rao',
            contactEmail: 'vikram.rao@shadowfax.in',
            contactPhone: '+91 9876543220',
            address: 'Shadowfax House, Outer Ring Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560103',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'RVGO001',
            vendorName: 'Rivigo Services Private Limited',
            gstin: '09AABCR2345L1Z1',
            pan: 'AABCR2345L',
            contactPerson: 'Sanjay Verma',
            contactEmail: 'sanjay.verma@rivigo.com',
            contactPhone: '+91 9876543221',
            address: 'Rivigo House, Sector 18',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122015',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'MLOG001',
            vendorName: 'Mahindra Logistics Limited',
            gstin: '27AABCM6789M1Z2',
            pan: 'AABCM6789M',
            contactPerson: 'Ravi Krishnan',
            contactEmail: 'ravi.krishnan@mahindralogistics.com',
            contactPhone: '+91 9876543222',
            address: 'Mahindra Towers, Worli',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400018',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'ALCG001',
            vendorName: 'Allcargo Logistics Limited',
            gstin: '27AABCA1234N1Z3',
            pan: 'AABCA1234N',
            contactPerson: 'Manish Jain',
            contactEmail: 'manish.jain@allcargologistics.com',
            contactPhone: '+91 9876543223',
            address: 'Allcargo House, CST Road, Kalina',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400098',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        },
        {
            vendorCode: 'TCIL001',
            vendorName: 'Transport Corporation of India',
            gstin: '09AABCT5678O1Z4',
            pan: 'AABCT5678O',
            contactPerson: 'Ashok Malhotra',
            contactEmail: 'ashok.malhotra@tcil.com',
            contactPhone: '+91 9876543224',
            address: 'TCI House, Sector 32',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122001',
            status: 'active' as const,
            linkedContracts: [],
            createdBy: 'System Admin'
        }
    ];

    vendors.forEach(v => MasterDataService.createVendor(v));
    vendors.forEach(v => {
        const vendor = MasterDataService.getVendorByCode(v.vendorCode);
        if (vendor) {
            MasterDataService.approveVendor(vendor.id, 'System Admin');
        }
    });

    console.log(`✅ Created ${vendors.length} vendors`);

    // ==================== RATE MASTER (50+ rates) ====================

    const rates = [
        // Metro to Metro - Express
        { contractId: 'CNT-2024-001', vendorCode: 'TCI001', deliveryType: 'Express' as const, source: 'Delhi', destination: 'Mumbai', rateType: 'per_kg' as const, baseRate: 12.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-002', vendorCode: 'BD001', deliveryType: 'Express' as const, source: 'Mumbai', destination: 'Bangalore', rateType: 'per_kg' as const, baseRate: 14.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-003', vendorCode: 'DEL001', deliveryType: 'Express' as const, source: 'Delhi', destination: 'Bangalore', rateType: 'per_kg' as const, baseRate: 13.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-004', vendorCode: 'VRL001', deliveryType: 'Express' as const, source: 'Chennai', destination: 'Kolkata', rateType: 'per_kg' as const, baseRate: 15.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-005', vendorCode: 'TCI001', deliveryType: 'Express' as const, source: 'Mumbai', destination: 'Chennai', rateType: 'per_kg' as const, baseRate: 13.00, validFrom: '2024-01-01', validTo: '2024-12-31' },

        // Metro to Metro - Surface
        { contractId: 'CNT-2024-001', vendorCode: 'TCI001', deliveryType: 'LTL' as const, source: 'Delhi', destination: 'Mumbai', rateType: 'per_kg' as const, baseRate: 8.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-002', vendorCode: 'BD001', deliveryType: 'LTL' as const, source: 'Mumbai', destination: 'Bangalore', rateType: 'per_kg' as const, baseRate: 9.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-003', vendorCode: 'DEL001', deliveryType: 'LTL' as const, source: 'Delhi', destination: 'Bangalore', rateType: 'per_kg' as const, baseRate: 8.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-004', vendorCode: 'GATI001', deliveryType: 'LTL' as const, source: 'Chennai', destination: 'Kolkata', rateType: 'per_kg' as const, baseRate: 10.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-005', vendorCode: 'TCI001', deliveryType: 'LTL' as const, source: 'Mumbai', destination: 'Chennai', rateType: 'per_kg' as const, baseRate: 8.00, validFrom: '2024-01-01', validTo: '2024-12-31' },

        // Tier 2 Cities
        { contractId: 'CNT-2024-006', vendorCode: 'SFEX001', deliveryType: 'Express' as const, source: 'Pune', destination: 'Ahmedabad', rateType: 'per_kg' as const, baseRate: 11.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-006', vendorCode: 'SFEX001', deliveryType: 'Express' as const, source: 'Jaipur', destination: 'Lucknow', rateType: 'per_kg' as const, baseRate: 11.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-004', vendorCode: 'VRL001', deliveryType: 'LTL' as const, source: 'Pune', destination: 'Ahmedabad', rateType: 'per_kg' as const, baseRate: 7.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-004', vendorCode: 'VRL001', deliveryType: 'LTL' as const, source: 'Surat', destination: 'Indore', rateType: 'per_kg' as const, baseRate: 7.00, validFrom: '2024-01-01', validTo: '2024-12-31' },

        // FTL Rates
        { contractId: 'CNT-2024-001', vendorCode: 'TCI001', deliveryType: 'FTL' as const, source: 'Delhi', destination: 'Mumbai', rateType: 'per_km' as const, baseRate: 35.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-002', vendorCode: 'BD001', deliveryType: 'FTL' as const, source: 'Mumbai', destination: 'Bangalore', rateType: 'per_km' as const, baseRate: 32.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-003', vendorCode: 'DEL001', deliveryType: 'FTL' as const, source: 'Delhi', destination: 'Bangalore', rateType: 'per_km' as const, baseRate: 33.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-004', vendorCode: 'GATI001', deliveryType: 'FTL' as const, source: 'Chennai', destination: 'Kolkata', rateType: 'per_km' as const, baseRate: 34.00, validFrom: '2024-01-01', validTo: '2024-12-31' },

        // Additional lanes
        { contractId: 'CNT-2024-001', vendorCode: 'TCI001', deliveryType: 'Express' as const, source: 'Delhi', destination: 'Kolkata', rateType: 'per_kg' as const, baseRate: 14.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-002', vendorCode: 'BD001', deliveryType: 'Express' as const, source: 'Mumbai', destination: 'Kolkata', rateType: 'per_kg' as const, baseRate: 15.50, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-003', vendorCode: 'DEL001', deliveryType: 'Express' as const, source: 'Bangalore', destination: 'Chennai', rateType: 'per_kg' as const, baseRate: 10.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
        { contractId: 'CNT-2024-004', vendorCode: 'VRL001', deliveryType: 'Express' as const, source: 'Hyderabad', destination: 'Mumbai', rateType: 'per_kg' as const, baseRate: 12.00, validFrom: '2024-01-01', validTo: '2024-12-31' },
    ];

    rates.forEach(r => {
        const rate = MasterDataService.createRate({
            ...r,
            currency: 'INR',
            status: 'active',
            createdBy: 'System Admin'
        });
        // Auto-approve
        if (rate) {
            MasterDataService.updateRate(rate.id, { approvalStatus: 'approved' });
        }
    });

    console.log(`✅ Created ${rates.length} rate cards`);

    // ==================== FUEL MASTER (8 cities) ====================

    const fuelRates = [
        { contractId: 'FUEL-DELHI', fuelRate: 94.50, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { contractId: 'FUEL-MUMBAI', fuelRate: 102.80, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { contractId: 'FUEL-BANGALORE', fuelRate: 98.20, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { contractId: 'FUEL-CHENNAI', fuelRate: 96.50, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { contractId: 'FUEL-KOLKATA', fuelRate: 95.00, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { contractId: 'FUEL-HYDERABAD', fuelRate: 97.30, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { contractId: 'FUEL-PUNE', fuelRate: 99.50, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
        { contractId: 'FUEL-AHMEDABAD', fuelRate: 93.80, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' },
    ];

    fuelRates.forEach(f => {
        MasterDataService.createFuelRate({
            ...f,
            status: 'active',
            createdBy: 'System Admin'
        });
    });

    console.log(`✅ Created ${fuelRates.length} fuel rates`);

    // ==================== LOCATION GROUPS (4 zones) ====================

    const locationGroups = [
        {
            groupCode: 'ZONE-NORTH',
            groupName: 'North India Zone',
            locations: ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', 'Chandigarh', 'Jaipur', 'Lucknow', 'Kanpur', 'Agra', 'Ludhiana', 'Amritsar', 'Dehradun'],
            vendorMapping: ['TCI001', 'SFEX001', 'DEL001'],
            contractMapping: ['CNT-2024-001', 'CNT-2024-006'],
            status: 'active' as const,
            createdBy: 'System Admin'
        },
        {
            groupCode: 'ZONE-WEST',
            groupName: 'West India Zone',
            locations: ['Mumbai', 'Navi Mumbai', 'Thane', 'Pune', 'Ahmedabad', 'Surat', 'Vadodara', 'Nashik', 'Nagpur', 'Rajkot', 'Indore'],
            vendorMapping: ['BD001', 'VRL001', 'PROF001'],
            contractMapping: ['CNT-2024-002', 'CNT-2024-004'],
            status: 'active' as const,
            createdBy: 'System Admin'
        },
        {
            groupCode: 'ZONE-SOUTH',
            groupName: 'South India Zone',
            locations: ['Bangalore', 'Chennai', 'Hyderabad', 'Coimbatore', 'Kochi', 'Thiruvananthapuram', 'Mysore', 'Mangalore', 'Visakhapatnam'],
            vendorMapping: ['GATI001', 'DTDC001', 'SHDW001'],
            contractMapping: ['CNT-2024-003', 'CNT-2024-005'],
            status: 'active' as const,
            createdBy: 'System Admin'
        },
        {
            groupCode: 'ZONE-EAST',
            groupName: 'East India Zone',
            locations: ['Kolkata', 'Bhubaneswar', 'Patna', 'Ranchi', 'Guwahati', 'Siliguri'],
            vendorMapping: ['TCI001', 'DEL001'],
            contractMapping: ['CNT-2024-001'],
            status: 'active' as const,
            createdBy: 'System Admin'
        }
    ];

    locationGroups.forEach(lg => MasterDataService.createLocationGroup(lg));

    console.log(`✅ Created ${locationGroups.length} location zones`);

    // ==================== VEHICLE MASTER (12 types) ====================

    const vehicleTypes = [
        { vehicleTypeCode: 'LCV-ACE', description: 'Tata Ace / Mahindra Maxximo (750 kg)', capacity: 750, capacityUnit: 'kg' as const, applicableDeliveryTypes: ['LTL' as const, 'Express' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'LCV-407', description: 'Tata 407 / Mahindra Bolero Pickup (2 tons)', capacity: 2, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['LTL' as const, 'Express' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'MCV-1109', description: 'Tata 1109 / Eicher 1095 (5 tons)', capacity: 5, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['LTL' as const, 'FTL' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'MCV-1412', description: 'Tata 1412 / Ashok Leyland 1616 (9 tons)', capacity: 9, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['FTL' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'HCV-1918', description: 'Tata 1918 / Ashok Leyland 1918 (15 tons)', capacity: 15, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['FTL' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'HCV-2518', description: 'Tata Prima / Ashok Leyland 2518 (20 tons)', capacity: 20, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['FTL' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'REEFER-5T', description: 'Refrigerated Van (5 tons, -25°C to +25°C)', capacity: 5, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['LTL' as const, 'Express' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'CONT-20FT', description: 'Container Truck 20 FT (10 tons)', capacity: 10, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['FTL' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'CONT-40FT', description: 'Container Truck 40 FT (20 tons)', capacity: 20, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['FTL' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'TRAILER-MA', description: 'Multi-Axle Trailer (40 tons)', capacity: 40, capacityUnit: 'ton' as const, applicableDeliveryTypes: ['FTL' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'BIKE-2W', description: 'Two Wheeler / Bike (50 kg)', capacity: 50, capacityUnit: 'kg' as const, applicableDeliveryTypes: ['Express' as const], status: 'active' as const, createdBy: 'System Admin' },
        { vehicleTypeCode: 'VAN-CARGO', description: 'Cargo Van (1.5 tons)', capacity: 1500, capacityUnit: 'kg' as const, applicableDeliveryTypes: ['LTL' as const, 'Express' as const], status: 'active' as const, createdBy: 'System Admin' },
    ];

    vehicleTypes.forEach(vt => MasterDataService.createVehicleType(vt));

    console.log(`✅ Created ${vehicleTypes.length} vehicle types`);

    console.log('🎉 Master data initialization complete!');
    console.log(`Total: ${vendors.length} vendors, ${rates.length} rates, ${fuelRates.length} fuel rates, ${locationGroups.length} zones, ${vehicleTypes.length} vehicles`);
};

// Auto-initialize on import
initializeMasterData();
