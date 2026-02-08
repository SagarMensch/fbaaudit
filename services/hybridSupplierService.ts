/**
 * Hybrid Supplier Service
 * SAP-style: Uses API when available, falls back to local data for offline/dev mode
 * 
 * This service wraps the API calls and provides typed responses compatible with existing code.
 */

import { VendorsAPI, VendorFromAPI, VendorContractFromAPI, VendorRateFromAPI, ConfigAPI } from './apiClient';
import { GlobalSupplier, GlobalRateLine, GlobalDocument, GLOBAL_SUPPLIERS } from './supplierService';

// Configuration
let USE_API = true; // Set to false for offline mode

export function setUseAPI(value: boolean): void {
    USE_API = value;
}

/**
 * Transform API vendor to GlobalSupplier format for backward compatibility
 */
function transformVendorToGlobalSupplier(vendor: VendorFromAPI, contracts?: VendorContractFromAPI[], rates?: VendorRateFromAPI[]): GlobalSupplier {
    return {
        id: vendor.id,
        name: vendor.name,
        fullName: vendor.name,
        logo: getVendorLogo(vendor.type),
        type: mapVendorType(vendor.type),
        status: vendor.is_active ? 'active' : 'inactive',
        headquarters: `${vendor.city || ''}, ${vendor.state || ''}`,
        founded: 2000, // Default, would come from extended vendor data
        website: `https://${vendor.name.toLowerCase().replace(/\s+/g, '')}.com`,
        description: `${vendor.name} - ${vendor.type}`,
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
        rates: (rates || []).map(transformRateToGlobalRateLine),
        notifications: [],
        createdDate: vendor.created_at || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        contractExpiry: contracts?.[0]?.valid_to || '2026-12-31'
    };
}

function getVendorLogo(type: string): string {
    const logos: Record<string, string> = {
        'FREIGHT_FORWARDER': '🚢',
        'COURIER': '📦',
        'TRANSPORTER': '🚚',
        '3PL': '📋',
        'express': '✈️',
        'ground': '🚛',
        'ocean': '🚢',
        'air': '✈️',
        'multimodal': '🌐'
    };
    return logos[type] || '📦';
}

function mapVendorType(apiType: string): GlobalSupplier['type'] {
    const mapping: Record<string, GlobalSupplier['type']> = {
        'FREIGHT_FORWARDER': 'ocean',
        'COURIER': 'express',
        'TRANSPORTER': 'ground',
        '3PL': 'multimodal',
        'EXPRESS': 'express',
        'AIR': 'air',
        'OCEAN': 'ocean',
        'GROUND': 'ground'
    };
    return mapping[apiType?.toUpperCase()] || 'multimodal';
}

function transformRateToGlobalRateLine(rate: VendorRateFromAPI): GlobalRateLine {
    return {
        origin: rate.origin,
        destination: rate.destination,
        mode: mapRateMode(rate.vehicle_type),
        baseRate: rate.base_rate,
        unit: rate.rate_basis === 'Per Kg' ? 'kg' : rate.rate_basis === 'Per Trip' ? 'shipment' : 'lb',
        fuelSurcharge: 10, // Default, could be from config
        tax: 0,
        additionalCharges: []
    };
}

function mapRateMode(vehicleType: string): GlobalRateLine['mode'] {
    const mapping: Record<string, GlobalRateLine['mode']> = {
        'Air Express': 'Air Express',
        'Air Priority': 'Air Express',
        'Air Economy': 'Air Express',
        'Ground Express': 'Ground Express',
        'Ground': 'Ground Express',
        '40ft Container': 'Ocean FCL',
        '20ft Container': 'Ocean FCL',
        '53ft Trailer': 'FTL',
        'LTL Standard': 'LTL'
    };
    return mapping[vehicleType] || 'Ground Express';
}

/**
 * Hybrid Supplier Service - uses API with fallback
 */
export class HybridSupplierService {

    /**
     * Get all suppliers - API first, fallback to local
     */
    static async getAllSuppliers(): Promise<GlobalSupplier[]> {
        if (!USE_API) {
            return GLOBAL_SUPPLIERS;
        }

        try {
            const response = await VendorsAPI.getAll({ is_active: true });
            const vendors = response.data;

            // Get rates for each vendor in parallel
            const suppliersWithRates = await Promise.all(
                vendors.map(async (vendor) => {
                    try {
                        const ratesResponse = await VendorsAPI.getRates(vendor.id);
                        return transformVendorToGlobalSupplier(vendor, [], ratesResponse.data);
                    } catch {
                        return transformVendorToGlobalSupplier(vendor, [], []);
                    }
                })
            );

            return suppliersWithRates;
        } catch (error) {
            console.warn('API call failed, falling back to local data:', error);
            return GLOBAL_SUPPLIERS;
        }
    }

    /**
     * Get supplier by ID - API first, fallback to local
     */
    static async getSupplierById(id: string): Promise<GlobalSupplier | undefined> {
        if (!USE_API) {
            return GLOBAL_SUPPLIERS.find(s => s.id === id);
        }

        try {
            const response = await VendorsAPI.getById(id);
            const ratesResponse = await VendorsAPI.getRates(id);
            return transformVendorToGlobalSupplier(
                response.data,
                response.contracts,
                ratesResponse.data
            );
        } catch (error) {
            console.warn(`API call for vendor ${id} failed, falling back to local:`, error);
            return GLOBAL_SUPPLIERS.find(s => s.id === id);
        }
    }

    /**
     * Get suppliers by type - API first, fallback to local
     */
    static async getSuppliersByType(type: GlobalSupplier['type']): Promise<GlobalSupplier[]> {
        if (!USE_API) {
            return GLOBAL_SUPPLIERS.filter(s => s.type === type);
        }

        try {
            const apiType = type.toUpperCase();
            const response = await VendorsAPI.getAll({ type: apiType, is_active: true });
            return response.data.map(v => transformVendorToGlobalSupplier(v));
        } catch (error) {
            console.warn('API call failed, falling back to local data:', error);
            return GLOBAL_SUPPLIERS.filter(s => s.type === type);
        }
    }

    /**
     * Get active suppliers - API first, fallback to local
     */
    static async getActiveSuppliers(): Promise<GlobalSupplier[]> {
        if (!USE_API) {
            return GLOBAL_SUPPLIERS.filter(s => s.status === 'active');
        }

        try {
            const response = await VendorsAPI.getAll({ is_active: true });
            return response.data.map(v => transformVendorToGlobalSupplier(v));
        } catch (error) {
            console.warn('API call failed, falling back to local data:', error);
            return GLOBAL_SUPPLIERS.filter(s => s.status === 'active');
        }
    }

    /**
     * Search suppliers by name
     */
    static async searchSuppliers(query: string): Promise<GlobalSupplier[]> {
        if (!USE_API) {
            return GLOBAL_SUPPLIERS.filter(s =>
                s.name.toLowerCase().includes(query.toLowerCase()) ||
                s.fullName.toLowerCase().includes(query.toLowerCase())
            );
        }

        try {
            const response = await VendorsAPI.getAll({ search: query, is_active: true });
            return response.data.map(v => transformVendorToGlobalSupplier(v));
        } catch (error) {
            console.warn('API search failed, falling back to local:', error);
            return GLOBAL_SUPPLIERS.filter(s =>
                s.name.toLowerCase().includes(query.toLowerCase())
            );
        }
    }

    /**
     * Get vendor rates from API
     */
    static async getSupplierRates(supplierId: string): Promise<GlobalRateLine[]> {
        if (!USE_API) {
            const supplier = GLOBAL_SUPPLIERS.find(s => s.id === supplierId);
            return supplier?.rates || [];
        }

        try {
            const response = await VendorsAPI.getRates(supplierId);
            return response.data.map(transformRateToGlobalRateLine);
        } catch (error) {
            console.warn('API rates call failed, falling back to local:', error);
            const supplier = GLOBAL_SUPPLIERS.find(s => s.id === supplierId);
            return supplier?.rates || [];
        }
    }
}

/**
 * Currency helper - gets currency from API config
 */
let cachedCurrency: { symbol: string; code: string } | null = null;

export async function getCurrencyConfig(): Promise<{ symbol: string; code: string }> {
    if (cachedCurrency) {
        return cachedCurrency;
    }

    if (!USE_API) {
        return { symbol: '$', code: 'USD' };
    }

    try {
        const config = await ConfigAPI.getCurrency();
        cachedCurrency = {
            symbol: config.currency_symbol,
            code: config.currency_code
        };
        return cachedCurrency;
    } catch (error) {
        console.warn('Failed to get currency config, using default USD:', error);
        return { symbol: '$', code: 'USD' };
    }
}

/**
 * Format amount with currency from config
 */
export async function formatCurrency(amount: number): Promise<string> {
    const { symbol } = await getCurrencyConfig();
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default HybridSupplierService;
