// Master Data Management Service
// Complete CRUD operations for all master data tables

export interface VendorMaster {
    id: string;
    vendorCode: string;
    vendorName: string;
    gstin: string;
    pan: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    status: 'active' | 'inactive';
    linkedContracts: string[];
    createdBy: string;
    createdDate: string;
    modifiedBy?: string;
    modifiedDate?: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedDate?: string;
}

export interface RateMaster {
    id: string;
    contractId: string;
    vendorCode: string;
    deliveryType: 'LTL' | 'FTL' | 'MIL' | 'Express' | 'Air';
    source: string;
    destination: string;
    rateType: 'per_km' | 'per_ton' | 'per_kg' | 'slab_based';
    baseRate: number;
    currency: 'INR';
    validFrom: string;
    validTo: string;
    specialCharges?: {
        name: string;
        amount: number;
        type: 'fixed' | 'percentage';
    }[];
    weightSlabs?: {
        minWeight: number;
        maxWeight: number;
        rate: number;
    }[];
    status: 'active' | 'inactive';
    createdBy: string;
    createdDate: string;
    modifiedBy?: string;
    modifiedDate?: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
}

export interface FuelMaster {
    id: string;
    contractId: string;
    fuelRate: number;
    effectiveFrom: string;
    effectiveTo: string;
    escalationRule?: {
        type: 'percentage' | 'fixed';
        value: number;
        triggerCondition: string;
    };
    revisionHistory: {
        date: string;
        oldRate: number;
        newRate: number;
        reason: string;
        approvedBy: string;
    }[];
    status: 'active' | 'inactive';
    createdBy: string;
    createdDate: string;
}

export interface LocationGrouping {
    id: string;
    groupCode: string;
    groupName: string;
    locations: string[];
    vendorMapping: string[];
    contractMapping: string[];
    status: 'active' | 'inactive';
    createdBy: string;
    createdDate: string;
}

export interface VehicleType {
    id: string;
    vehicleTypeCode: string;
    description: string;
    capacity: number;
    capacityUnit: 'kg' | 'ton';
    applicableDeliveryTypes: ('LTL' | 'FTL' | 'MIL' | 'Express')[];
    status: 'active' | 'inactive';
    createdBy: string;
    createdDate: string;
}

const API_BASE = 'http://localhost:5000';

class MasterDataService {
    private vendors: VendorMaster[] = [];
    private rates: RateMaster[] = [];
    private fuelRates: FuelMaster[] = [];
    private locationGroups: LocationGrouping[] = [];
    private vehicleTypes: VehicleType[] = [];
    private locations: any[] = [];
    private locationsLoaded = false;

    // ==================== ASYNC API METHODS (MySQL) ====================

    async loadLocationsFromAPI(): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE}/api/locations`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    this.locations = result.data;
                    this.locationsLoaded = true;
                    console.log(`[MasterDataService] Loaded ${this.locations.length} locations from MySQL`);
                }
            }
        } catch (error) {
            console.error('[MasterDataService] API error:', error);
        }
        return this.locations;
    }

    async fetchLocationsAsync(): Promise<any[]> {
        return this.loadLocationsFromAPI();
    }

    async fetchLocationByIdAsync(id: string): Promise<any | null> {
        try {
            const response = await fetch(`${API_BASE}/api/locations/${id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    return result.data;
                }
            }
        } catch (error) {
            console.error('[MasterDataService] Error fetching location:', error);
        }
        return null;
    }

    async fetchCitiesAsync(): Promise<string[]> {
        try {
            const response = await fetch(`${API_BASE}/api/locations/cities`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return result.data;
                }
            }
        } catch (error) {
            console.error('[MasterDataService] Error fetching cities:', error);
        }
        return [];
    }

    async createLocationAsync(locationData: any): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationData)
            });
            return response.ok;
        } catch (error) {
            console.error('[MasterDataService] Error creating location:', error);
            return false;
        }
    }

    async updateLocationAsync(id: string, updates: any): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/locations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            return response.ok;
        } catch (error) {
            console.error('[MasterDataService] Error updating location:', error);
            return false;
        }
    }

    getLocations(): any[] {
        if (!this.locationsLoaded) {
            this.loadLocationsFromAPI();
        }
        return this.locations;
    }


    // ==================== VENDOR MASTER ====================

    createVendor(vendor: Omit<VendorMaster, 'id' | 'createdDate' | 'approvalStatus'>): VendorMaster {
        const newVendor: VendorMaster = {
            ...vendor,
            id: `VEN-${Date.now()}`,
            createdDate: new Date().toISOString().split('T')[0],
            approvalStatus: 'pending'
        };
        this.vendors.push(newVendor);
        return newVendor;
    }

    getAllVendors(): VendorMaster[] {
        return this.vendors;
    }

    getVendorById(id: string): VendorMaster | undefined {
        return this.vendors.find(v => v.id === id);
    }

    getVendorByCode(code: string): VendorMaster | undefined {
        return this.vendors.find(v => v.vendorCode === code);
    }

    updateVendor(id: string, updates: Partial<VendorMaster>): VendorMaster | null {
        const index = this.vendors.findIndex(v => v.id === id);
        if (index === -1) return null;

        this.vendors[index] = {
            ...this.vendors[index],
            ...updates,
            modifiedDate: new Date().toISOString().split('T')[0],
            approvalStatus: 'pending' // Reset approval on modification
        };
        return this.vendors[index];
    }

    deleteVendor(id: string): boolean {
        const index = this.vendors.findIndex(v => v.id === id);
        if (index === -1) return false;

        this.vendors.splice(index, 1);
        return true;
    }

    approveVendor(id: string, approvedBy: string): VendorMaster | null {
        const vendor = this.getVendorById(id);
        if (!vendor) return null;

        vendor.approvalStatus = 'approved';
        vendor.approvedBy = approvedBy;
        vendor.approvedDate = new Date().toISOString().split('T')[0];
        return vendor;
    }

    // ==================== RATE MASTER ====================

    createRate(rate: Omit<RateMaster, 'id' | 'createdDate' | 'approvalStatus'>): RateMaster {
        const newRate: RateMaster = {
            ...rate,
            id: `RATE-${Date.now()}`,
            createdDate: new Date().toISOString().split('T')[0],
            approvalStatus: 'pending'
        };
        this.rates.push(newRate);
        return newRate;
    }

    getAllRates(): RateMaster[] {
        return this.rates;
    }

    getRateById(id: string): RateMaster | undefined {
        return this.rates.find(r => r.id === id);
    }

    getRatesByVendor(vendorCode: string): RateMaster[] {
        return this.rates.filter(r => r.vendorCode === vendorCode);
    }

    getRatesByContract(contractId: string): RateMaster[] {
        return this.rates.filter(r => r.contractId === contractId);
    }

    findApplicableRate(
        vendorCode: string,
        source: string,
        destination: string,
        deliveryType: string,
        date: string,
        weight?: number
    ): RateMaster | null {
        const applicableRates = this.rates.filter(r =>
            r.vendorCode === vendorCode &&
            r.source.toLowerCase() === source.toLowerCase() &&
            r.destination.toLowerCase() === destination.toLowerCase() &&
            r.deliveryType === deliveryType &&
            r.status === 'active' &&
            r.approvalStatus === 'approved' &&
            date >= r.validFrom &&
            date <= r.validTo
        );

        if (applicableRates.length === 0) return null;

        // If weight provided and slab-based, find matching slab
        if (weight && applicableRates[0].weightSlabs) {
            const rateWithSlab = applicableRates.find(r => {
                if (!r.weightSlabs) return false;
                return r.weightSlabs.some(slab =>
                    weight >= slab.minWeight && weight <= slab.maxWeight
                );
            });
            return rateWithSlab || applicableRates[0];
        }

        return applicableRates[0];
    }

    updateRate(id: string, updates: Partial<RateMaster>): RateMaster | null {
        const index = this.rates.findIndex(r => r.id === id);
        if (index === -1) return null;

        this.rates[index] = {
            ...this.rates[index],
            ...updates,
            modifiedDate: new Date().toISOString().split('T')[0],
            approvalStatus: 'pending'
        };
        return this.rates[index];
    }

    deleteRate(id: string): boolean {
        const index = this.rates.findIndex(r => r.id === id);
        if (index === -1) return false;

        this.rates.splice(index, 1);
        return true;
    }

    // ==================== FUEL MASTER ====================

    createFuelRate(fuelRate: Omit<FuelMaster, 'id' | 'createdDate' | 'revisionHistory'>): FuelMaster {
        const newFuelRate: FuelMaster = {
            ...fuelRate,
            id: `FUEL-${Date.now()}`,
            createdDate: new Date().toISOString().split('T')[0],
            revisionHistory: []
        };
        this.fuelRates.push(newFuelRate);
        return newFuelRate;
    }

    getAllFuelRates(): FuelMaster[] {
        return this.fuelRates;
    }

    getFuelRateById(id: string): FuelMaster | undefined {
        return this.fuelRates.find(f => f.id === id);
    }

    getApplicableFuelRate(contractId: string, date: string): FuelMaster | null {
        const applicableRates = this.fuelRates.filter(f =>
            f.contractId === contractId &&
            f.status === 'active' &&
            date >= f.effectiveFrom &&
            date <= f.effectiveTo
        );

        return applicableRates[0] || null;
    }

    updateFuelRate(id: string, newRate: number, reason: string, approvedBy: string): FuelMaster | null {
        const fuelRate = this.getFuelRateById(id);
        if (!fuelRate) return null;

        fuelRate.revisionHistory.push({
            date: new Date().toISOString().split('T')[0],
            oldRate: fuelRate.fuelRate,
            newRate: newRate,
            reason: reason,
            approvedBy: approvedBy
        });

        fuelRate.fuelRate = newRate;
        return fuelRate;
    }

    deleteFuelRate(id: string): boolean {
        const index = this.fuelRates.findIndex(f => f.id === id);
        if (index === -1) return false;

        this.fuelRates.splice(index, 1);
        return true;
    }

    // ==================== LOCATION GROUPING ====================

    createLocationGroup(group: Omit<LocationGrouping, 'id' | 'createdDate'>): LocationGrouping {
        const newGroup: LocationGrouping = {
            ...group,
            id: `LOC-${Date.now()}`,
            createdDate: new Date().toISOString().split('T')[0]
        };
        this.locationGroups.push(newGroup);
        return newGroup;
    }

    getAllLocationGroups(): LocationGrouping[] {
        return this.locationGroups;
    }

    getLocationGroupById(id: string): LocationGrouping | undefined {
        return this.locationGroups.find(g => g.id === id);
    }

    updateLocationGroup(id: string, updates: Partial<LocationGrouping>): LocationGrouping | null {
        const index = this.locationGroups.findIndex(g => g.id === id);
        if (index === -1) return null;

        this.locationGroups[index] = {
            ...this.locationGroups[index],
            ...updates
        };
        return this.locationGroups[index];
    }

    deleteLocationGroup(id: string): boolean {
        const index = this.locationGroups.findIndex(g => g.id === id);
        if (index === -1) return false;

        this.locationGroups.splice(index, 1);
        return true;
    }

    // ==================== VEHICLE TYPE ====================

    createVehicleType(vehicle: Omit<VehicleType, 'id' | 'createdDate'>): VehicleType {
        const newVehicle: VehicleType = {
            ...vehicle,
            id: `VEH-${Date.now()}`,
            createdDate: new Date().toISOString().split('T')[0]
        };
        this.vehicleTypes.push(newVehicle);
        return newVehicle;
    }

    getAllVehicleTypes(): VehicleType[] {
        return this.vehicleTypes;
    }

    getVehicleTypeById(id: string): VehicleType | undefined {
        return this.vehicleTypes.find(v => v.id === id);
    }

    updateVehicleType(id: string, updates: Partial<VehicleType>): VehicleType | null {
        const index = this.vehicleTypes.findIndex(v => v.id === id);
        if (index === -1) return null;

        this.vehicleTypes[index] = {
            ...this.vehicleTypes[index],
            ...updates
        };
        return this.vehicleTypes[index];
    }

    deleteVehicleType(id: string): boolean {
        const index = this.vehicleTypes.findIndex(v => v.id === id);
        if (index === -1) return false;

        this.vehicleTypes.splice(index, 1);
        return true;
    }

    // ==================== VALIDATION ====================

    validateVendor(vendor: Partial<VendorMaster>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!vendor.vendorCode) errors.push('Vendor code is required');
        if (!vendor.vendorName) errors.push('Vendor name is required');
        if (!vendor.gstin || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(vendor.gstin)) {
            errors.push('Valid GSTIN is required');
        }
        if (!vendor.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(vendor.pan)) {
            errors.push('Valid PAN is required');
        }
        if (!vendor.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.contactEmail)) {
            errors.push('Valid email is required');
        }

        // Check for duplicate vendor code
        if (vendor.vendorCode && this.vendors.some(v => v.vendorCode === vendor.vendorCode && v.id !== vendor.id)) {
            errors.push('Vendor code already exists');
        }

        return { valid: errors.length === 0, errors };
    }

    validateRate(rate: Partial<RateMaster>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!rate.contractId) errors.push('Contract ID is required');
        if (!rate.vendorCode) errors.push('Vendor code is required');
        if (!rate.source) errors.push('Source is required');
        if (!rate.destination) errors.push('Destination is required');
        if (!rate.baseRate || rate.baseRate <= 0) errors.push('Valid base rate is required');
        if (!rate.validFrom) errors.push('Valid from date is required');
        if (!rate.validTo) errors.push('Valid to date is required');

        if (rate.validFrom && rate.validTo && rate.validFrom > rate.validTo) {
            errors.push('Valid from date must be before valid to date');
        }

        return { valid: errors.length === 0, errors };
    }
}

export default new MasterDataService();
