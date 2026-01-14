/**
 * Enhanced Fuel Master Service
 * 
 * Dynamic Escalation Engine with:
 * - Multi-source fuel indexing (IOCL, BPCL, HPCL, Custom)
 * - Temporal price lookup for backdated invoices
 * - Regional fuel corridor mapping
 * - Threshold-based escalation triggers
 * - Escalation formula builder
 */

import { TemporalDataService, TemporalEntity } from './temporalDataService';
import { getMDMDatabase } from './indexedDBService';

export type FuelType = 'DIESEL' | 'PETROL' | 'CNG' | 'ELECTRIC';
export type FuelSource = 'IOCL' | 'BPCL' | 'HPCL' | 'CUSTOM';

export interface FuelCorridor {
    id: string;
    name: string;
    states: string[];
    cities: string[];
    description: string;
}

export interface EscalationFormula {
    id: string;
    name: string;
    formula: string; // e.g., "(currentPrice - basePrice) / basePrice * freightRate"
    description: string;
    variables: string[]; // e.g., ["currentPrice", "basePrice", "freightRate"]
}

export interface EnhancedFuelPrice extends TemporalEntity {
    // Geographic
    city: string;
    state: string;
    country: string;
    fuelCorridorId?: string;

    // Fuel Details
    fuelType: FuelType;
    price: number; // Price per liter
    source: FuelSource;

    // Escalation Parameters
    basePrice?: number; // Price at contract inception
    thresholdPercent: number; // Minimum change to trigger escalation (default: 2%)
    escalationFormulaId?: string;

    // Metadata
    verifiedBy?: string;
    verificationDate?: Date;
    notes?: string;
}

export interface FuelEscalationResult {
    shouldEscalate: boolean;
    currentPrice: number;
    basePrice: number;
    priceChange: number;
    priceChangePercent: number;
    escalationAmount: number;
    formula: string;
}

export class EnhancedFuelService extends TemporalDataService<EnhancedFuelPrice> {
    private db: any = null;
    private corridors: Map<string, FuelCorridor> = new Map();
    private formulas: Map<string, EscalationFormula> = new Map();

    constructor() {
        super('FUEL_PRICE', 'fuel_prices');
        this.initializeDB();
        this.initializeDefaultFormulas();
    }

    private async initializeDB() {
        this.db = await getMDMDatabase();
    }

    private initializeDefaultFormulas() {
        // Simple percentage-based escalation
        this.formulas.set('SIMPLE_PERCENT', {
            id: 'SIMPLE_PERCENT',
            name: 'Simple Percentage Escalation',
            formula: '((currentPrice - basePrice) / basePrice) * freightRate',
            description: 'Direct percentage change applied to freight rate',
            variables: ['currentPrice', 'basePrice', 'freightRate']
        });

        // Indexed escalation with cap
        this.formulas.set('INDEXED_CAPPED', {
            id: 'INDEXED_CAPPED',
            name: 'Indexed Escalation with Cap',
            formula: 'Math.min(((currentPrice - basePrice) / basePrice) * freightRate, maxEscalation)',
            description: 'Percentage change with maximum escalation limit',
            variables: ['currentPrice', 'basePrice', 'freightRate', 'maxEscalation']
        });

        // Tiered escalation
        this.formulas.set('TIERED', {
            id: 'TIERED',
            name: 'Tiered Escalation',
            formula: 'priceChange <= tier1Limit ? tier1Rate : (priceChange <= tier2Limit ? tier2Rate : tier3Rate)',
            description: 'Different escalation rates for different price change tiers',
            variables: ['priceChange', 'tier1Limit', 'tier1Rate', 'tier2Limit', 'tier2Rate', 'tier3Rate']
        });
    }

    /**
     * Add fuel price with automatic base price tracking
     */
    async addFuelPrice(
        priceData: Omit<EnhancedFuelPrice, keyof TemporalEntity>,
        userId: string = 'SYSTEM',
        isBasePrice: boolean = false
    ): Promise<EnhancedFuelPrice> {
        // If this is marked as base price or no previous price exists, set as base
        if (isBasePrice || !priceData.basePrice) {
            const previousPrices = await this.getPriceHistory(
                priceData.city,
                priceData.fuelType
            );

            if (previousPrices.length === 0 || isBasePrice) {
                priceData.basePrice = priceData.price;
            } else {
                // Inherit base price from most recent entry
                priceData.basePrice = previousPrices[0].basePrice || priceData.price;
            }
        }

        return await this.createVersion(
            priceData,
            new Date(),
            userId,
            'Fuel price added'
        );
    }

    /**
     * Get fuel price effective at a specific date (for backdated invoices)
     */
    async getPriceAt(
        city: string,
        fuelType: FuelType,
        effectiveDate: Date
    ): Promise<EnhancedFuelPrice | null> {
        const allPrices = await this.getAllFromStorage();

        const matchingPrices = allPrices.filter(p =>
            p.city === city &&
            p.fuelType === fuelType &&
            p.effectiveFrom <= effectiveDate &&
            (p.effectiveTo === null || p.effectiveTo > effectiveDate)
        );

        return matchingPrices.length > 0 ? matchingPrices[0] : null;
    }

    /**
     * Get price history for a city and fuel type
     */
    async getPriceHistory(
        city: string,
        fuelType: FuelType,
        fromDate?: Date,
        toDate?: Date
    ): Promise<EnhancedFuelPrice[]> {
        const allPrices = await this.getAllFromStorage();

        let filtered = allPrices.filter(p =>
            p.city === city && p.fuelType === fuelType
        );

        if (fromDate) {
            filtered = filtered.filter(p => p.effectiveFrom >= fromDate);
        }

        if (toDate) {
            filtered = filtered.filter(p =>
                p.effectiveFrom <= toDate ||
                (p.effectiveTo && p.effectiveTo <= toDate)
            );
        }

        return filtered.sort((a, b) =>
            b.effectiveFrom.getTime() - a.effectiveFrom.getTime()
        );
    }

    /**
     * Calculate escalation for a given freight rate
     */
    calculateEscalation(
        currentPrice: EnhancedFuelPrice,
        freightRate: number,
        formulaId: string = 'SIMPLE_PERCENT',
        additionalParams: Record<string, number> = {}
    ): FuelEscalationResult {
        const basePrice = currentPrice.basePrice || currentPrice.price;
        const priceChange = currentPrice.price - basePrice;
        const priceChangePercent = (priceChange / basePrice) * 100;

        const shouldEscalate = Math.abs(priceChangePercent) >= currentPrice.thresholdPercent;

        let escalationAmount = 0;

        if (shouldEscalate) {
            const formula = this.formulas.get(formulaId);
            if (formula) {
                // Build evaluation context
                const context = {
                    currentPrice: currentPrice.price,
                    basePrice,
                    freightRate,
                    priceChange,
                    priceChangePercent,
                    ...additionalParams
                };

                // Evaluate formula (in production, use a safe expression evaluator)
                try {
                    escalationAmount = this.evaluateFormula(formula.formula, context);
                } catch (error) {
                    console.error('Formula evaluation error:', error);
                    // Fallback to simple calculation
                    escalationAmount = (priceChangePercent / 100) * freightRate;
                }
            } else {
                // Default simple escalation
                escalationAmount = (priceChangePercent / 100) * freightRate;
            }
        }

        return {
            shouldEscalate,
            currentPrice: currentPrice.price,
            basePrice,
            priceChange,
            priceChangePercent,
            escalationAmount,
            formula: this.formulas.get(formulaId)?.formula || 'default'
        };
    }

    /**
     * Get fuel corridor by ID
     */
    getFuelCorridor(corridorId: string): FuelCorridor | undefined {
        return this.corridors.get(corridorId);
    }

    /**
     * Create fuel corridor
     */
    createFuelCorridor(corridor: FuelCorridor): void {
        this.corridors.set(corridor.id, corridor);
    }

    /**
     * Get corridor for a city
     */
    getCorridorForCity(city: string, state: string): FuelCorridor | undefined {
        for (const corridor of this.corridors.values()) {
            if (corridor.cities.includes(city) || corridor.states.includes(state)) {
                return corridor;
            }
        }
        return undefined;
    }

    /**
     * Get all prices in a corridor
     */
    async getPricesInCorridor(
        corridorId: string,
        fuelType: FuelType
    ): Promise<EnhancedFuelPrice[]> {
        const corridor = this.corridors.get(corridorId);
        if (!corridor) return [];

        const allPrices = await this.getAllActiveAt();

        return allPrices.filter(p =>
            p.fuelType === fuelType &&
            (corridor.cities.includes(p.city) || corridor.states.includes(p.state))
        );
    }

    /**
     * Get average price in corridor
     */
    async getAveragePriceInCorridor(
        corridorId: string,
        fuelType: FuelType
    ): Promise<number> {
        const prices = await this.getPricesInCorridor(corridorId, fuelType);

        if (prices.length === 0) return 0;

        const sum = prices.reduce((acc, p) => acc + p.price, 0);
        return sum / prices.length;
    }

    /**
     * Get price variance analysis
     */
    async getPriceVarianceAnalysis(
        city: string,
        fuelType: FuelType,
        days: number = 30
    ): Promise<{
        current: number;
        average: number;
        min: number;
        max: number;
        stdDev: number;
        trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    }> {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const history = await this.getPriceHistory(city, fuelType, fromDate);

        if (history.length === 0) {
            return {
                current: 0,
                average: 0,
                min: 0,
                max: 0,
                stdDev: 0,
                trend: 'STABLE'
            };
        }

        const prices = history.map(h => h.price);
        const current = prices[0];
        const average = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        // Calculate standard deviation
        const squareDiffs = prices.map(p => Math.pow(p - average, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / prices.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        // Determine trend
        let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
        if (prices.length >= 2) {
            const recentAvg = prices.slice(0, Math.floor(prices.length / 2))
                .reduce((a, b) => a + b, 0) / Math.floor(prices.length / 2);
            const olderAvg = prices.slice(Math.floor(prices.length / 2))
                .reduce((a, b) => a + b, 0) / Math.ceil(prices.length / 2);

            const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

            if (changePercent > 2) trend = 'INCREASING';
            else if (changePercent < -2) trend = 'DECREASING';
        }

        return {
            current,
            average,
            min,
            max,
            stdDev,
            trend
        };
    }

    /**
     * Create custom escalation formula
     */
    createEscalationFormula(formula: EscalationFormula): void {
        this.formulas.set(formula.id, formula);
    }

    /**
     * Get all escalation formulas
     */
    getAllFormulas(): EscalationFormula[] {
        return Array.from(this.formulas.values());
    }

    // Helper methods

    private evaluateFormula(formula: string, context: Record<string, number>): number {
        // Create a safe evaluation function
        // In production, use a proper expression parser/evaluator
        try {
            const func = new Function(...Object.keys(context), `return ${formula}`);
            return func(...Object.values(context));
        } catch (error) {
            throw new Error(`Formula evaluation failed: ${error}`);
        }
    }
}

/**
 * Fuel Price Scraper Service (for IOCL, BPCL, HPCL)
 */
export class FuelPriceScraperService {
    private fuelService: EnhancedFuelService;

    constructor(fuelService: EnhancedFuelService) {
        this.fuelService = fuelService;
    }

    /**
     * Fetch latest prices from IOCL (placeholder - implement actual API/scraper)
     */
    async fetchIOCLPrices(): Promise<void> {
        // TODO: Implement actual IOCL API integration
        console.log('Fetching IOCL prices...');

        // Placeholder implementation
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'];

        for (const city of cities) {
            // Simulate API call
            const dieselPrice = 90 + Math.random() * 10;
            const petrolPrice = 100 + Math.random() * 10;

            await this.fuelService.addFuelPrice({
                id: `IOCL_${city}_DIESEL_${Date.now()}`,
                city,
                state: this.getCityState(city),
                country: 'India',
                fuelType: 'DIESEL',
                price: dieselPrice,
                source: 'IOCL',
                thresholdPercent: 2,
                createdBy: 'SCRAPER',
                modifiedBy: 'SCRAPER'
            }, 'SCRAPER');

            await this.fuelService.addFuelPrice({
                id: `IOCL_${city}_PETROL_${Date.now()}`,
                city,
                state: this.getCityState(city),
                country: 'India',
                fuelType: 'PETROL',
                price: petrolPrice,
                source: 'IOCL',
                thresholdPercent: 2,
                createdBy: 'SCRAPER',
                modifiedBy: 'SCRAPER'
            }, 'SCRAPER');
        }

        console.log('IOCL prices updated');
    }

    /**
     * Scheduled daily price update
     */
    async scheduledDailyUpdate(): Promise<void> {
        console.log('Running scheduled fuel price update...');

        try {
            await this.fetchIOCLPrices();
            // Add other sources as needed
            console.log('Scheduled update completed successfully');
        } catch (error) {
            console.error('Scheduled update failed:', error);
        }
    }

    private getCityState(city: string): string {
        const cityStateMap: Record<string, string> = {
            'Mumbai': 'Maharashtra',
            'Delhi': 'Delhi',
            'Bangalore': 'Karnataka',
            'Chennai': 'Tamil Nadu',
            'Kolkata': 'West Bengal'
        };
        return cityStateMap[city] || 'Unknown';
    }
}

/**
 * Singleton instance
 */
let enhancedFuelServiceInstance: EnhancedFuelService | null = null;

export function getEnhancedFuelService(): EnhancedFuelService {
    if (!enhancedFuelServiceInstance) {
        enhancedFuelServiceInstance = new EnhancedFuelService();
    }
    return enhancedFuelServiceInstance;
}

/**
 * Initialize default fuel corridors
 */
export function initializeDefaultCorridors(service: EnhancedFuelService): void {
    // North India Corridor
    service.createFuelCorridor({
        id: 'CORRIDOR_NORTH',
        name: 'North India Corridor',
        states: ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh'],
        cities: ['Delhi', 'Chandigarh', 'Lucknow', 'Kanpur'],
        description: 'Northern region fuel pricing corridor'
    });

    // West India Corridor
    service.createFuelCorridor({
        id: 'CORRIDOR_WEST',
        name: 'West India Corridor',
        states: ['Maharashtra', 'Gujarat', 'Rajasthan'],
        cities: ['Mumbai', 'Pune', 'Ahmedabad', 'Jaipur'],
        description: 'Western region fuel pricing corridor'
    });

    // South India Corridor
    service.createFuelCorridor({
        id: 'CORRIDOR_SOUTH',
        name: 'South India Corridor',
        states: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh'],
        cities: ['Bangalore', 'Chennai', 'Hyderabad', 'Kochi'],
        description: 'Southern region fuel pricing corridor'
    });

    // East India Corridor
    service.createFuelCorridor({
        id: 'CORRIDOR_EAST',
        name: 'East India Corridor',
        states: ['West Bengal', 'Odisha', 'Bihar'],
        cities: ['Kolkata', 'Bhubaneswar', 'Patna'],
        description: 'Eastern region fuel pricing corridor'
    });

    console.log('Default fuel corridors initialized');
}
