import { FuelPriceRecord, FuelSurchargeRule, FuelSurchargeCalculation, FuelPriceTrend } from '../types';

// Seed data for fuel prices
const SEED_FUEL_PRICES: FuelPriceRecord[] = [
    {
        id: 'FP-001',
        date: new Date().toISOString().split('T')[0],
        city: 'Delhi',
        dieselPrice: 94.50,
        petrolPrice: 105.40,
        source: 'GOVERNMENT',
        verified: true
    },
    {
        id: 'FP-002',
        date: new Date().toISOString().split('T')[0],
        city: 'Mumbai',
        dieselPrice: 102.80,
        petrolPrice: 111.35,
        source: 'GOVERNMENT',
        verified: true
    },
    {
        id: 'FP-003',
        date: new Date().toISOString().split('T')[0],
        city: 'Bangalore',
        dieselPrice: 98.20,
        petrolPrice: 107.85,
        source: 'GOVERNMENT',
        verified: true
    },
    {
        id: 'FP-004',
        date: new Date().toISOString().split('T')[0],
        city: 'Chennai',
        dieselPrice: 96.50,
        petrolPrice: 106.20,
        source: 'GOVERNMENT',
        verified: true
    },
    {
        id: 'FP-005',
        date: new Date().toISOString().split('T')[0],
        city: 'Kolkata',
        dieselPrice: 95.30,
        petrolPrice: 104.95,
        source: 'GOVERNMENT',
        verified: true
    }
];

// Seed data for surcharge rules
const SEED_SURCHARGE_RULES: FuelSurchargeRule[] = [
    {
        id: 'FSR-001',
        name: 'TCI Express PVC Rule',
        contractId: 'CNT-2024-001',
        vendorId: 'TCI001',
        formula: 'PVC',
        baseDieselPrice: 94.50,
        mileageBenchmark: 4.0,
        referenceCity: 'Delhi',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        status: 'ACTIVE',
        autoUpdate: false,
        createdDate: new Date().toISOString()
    },
    {
        id: 'FSR-002',
        name: 'Blue Dart Slab-based Surcharge',
        contractId: 'CNT-2024-002',
        vendorId: 'BD001',
        formula: 'SLAB',
        baseDieselPrice: 102.80,
        mileageBenchmark: 5.0,
        referenceCity: 'Mumbai',
        slabs: [
            { min: 0, max: 95, surcharge: 0 },
            { min: 95, max: 100, surcharge: 500 },
            { min: 100, max: 105, surcharge: 1000 },
            { min: 105, max: 999, surcharge: 1500 }
        ],
        validFrom: '2024-01-01',
        validTo: '2025-06-30',
        status: 'ACTIVE',
        autoUpdate: false,
        createdDate: new Date().toISOString()
    },
    {
        id: 'FSR-003',
        name: 'Delhivery Percentage Surcharge',
        contractId: 'CNT-2024-003',
        vendorId: 'DEL001',
        formula: 'PERCENTAGE',
        baseDieselPrice: 94.50,
        mileageBenchmark: 6.5,
        referenceCity: 'Gurugram',
        percentageRate: 5, // 5% of base freight
        validFrom: '2024-01-01',
        validTo: '2026-12-31',
        status: 'ACTIVE',
        autoUpdate: false,
        createdDate: new Date().toISOString()
    }
];

class FuelMasterService {
    private PRICES_KEY = 'fuel_prices_v1';
    private RULES_KEY = 'fuel_surcharge_rules_v1';

    private prices: FuelPriceRecord[] = [];
    private rules: FuelSurchargeRule[] = [];

    constructor() {
        this.load();
    }

    private load() {
        // Load fuel prices
        const storedPrices = localStorage.getItem(this.PRICES_KEY);
        if (storedPrices) {
            this.prices = JSON.parse(storedPrices);
        } else {
            this.prices = SEED_FUEL_PRICES;
            this.save();
        }

        // Load surcharge rules
        const storedRules = localStorage.getItem(this.RULES_KEY);
        if (storedRules) {
            this.rules = JSON.parse(storedRules);
        } else {
            this.rules = SEED_SURCHARGE_RULES;
            this.save();
        }
    }

    private save() {
        localStorage.setItem(this.PRICES_KEY, JSON.stringify(this.prices));
        localStorage.setItem(this.RULES_KEY, JSON.stringify(this.rules));
    }

    // --- FUEL PRICE MANAGEMENT ---

    getAllPrices(): FuelPriceRecord[] {
        return this.prices;
    }

    getCurrentPrice(city: string): FuelPriceRecord | undefined {
        // Get latest price for a city
        const cityPrices = this.prices
            .filter(p => p.city === city)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return cityPrices[0];
    }

    addPrice(price: Omit<FuelPriceRecord, 'id'>): FuelPriceRecord {
        const newPrice: FuelPriceRecord = {
            ...price,
            id: `FP-${Date.now()}`
        };
        this.prices.push(newPrice);
        this.save();
        return newPrice;
    }

    updatePrice(id: string, updates: Partial<FuelPriceRecord>): FuelPriceRecord | null {
        const index = this.prices.findIndex(p => p.id === id);
        if (index === -1) return null;

        this.prices[index] = { ...this.prices[index], ...updates };
        this.save();
        return this.prices[index];
    }

    getPriceHistory(city: string, days: number = 30): FuelPriceRecord[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.prices
            .filter(p => p.city === city && new Date(p.date) >= cutoffDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    getPriceTrend(city: string, period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'): FuelPriceTrend {
        const days = {
            WEEK: 7,
            MONTH: 30,
            QUARTER: 90,
            YEAR: 365
        }[period];

        const history = this.getPriceHistory(city, days);
        const dataPoints = history.map(h => ({ date: h.date, price: h.dieselPrice }));

        const prices = dataPoints.map(d => d.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length || 0;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Calculate trend
        let trend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
        if (prices.length >= 2) {
            const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
            const secondHalf = prices.slice(Math.floor(prices.length / 2));
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

            if (secondAvg > firstAvg * 1.02) trend = 'RISING';
            else if (secondAvg < firstAvg * 0.98) trend = 'FALLING';
        }

        const changePercent = prices.length >= 2
            ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
            : 0;

        return {
            city,
            period,
            dataPoints,
            avgPrice: Math.round(avgPrice * 100) / 100,
            minPrice,
            maxPrice,
            trend,
            changePercent: Math.round(changePercent * 100) / 100
        };
    }

    // --- SURCHARGE RULE MANAGEMENT ---

    getAllRules(): FuelSurchargeRule[] {
        return this.rules;
    }

    getActiveRules(): FuelSurchargeRule[] {
        const today = new Date().toISOString().split('T')[0];
        return this.rules.filter(r =>
            r.status === 'ACTIVE' &&
            r.validFrom <= today &&
            r.validTo >= today
        );
    }

    getRuleById(id: string): FuelSurchargeRule | undefined {
        return this.rules.find(r => r.id === id);
    }

    getRuleByContract(contractId: string): FuelSurchargeRule | undefined {
        return this.rules.find(r => r.contractId === contractId && r.status === 'ACTIVE');
    }

    getRuleByVendor(vendorId: string): FuelSurchargeRule | undefined {
        return this.rules.find(r => r.vendorId === vendorId && r.status === 'ACTIVE');
    }

    createRule(rule: Omit<FuelSurchargeRule, 'id' | 'createdDate'>): FuelSurchargeRule {
        const newRule: FuelSurchargeRule = {
            ...rule,
            id: `FSR-${Date.now()}`,
            createdDate: new Date().toISOString()
        };
        this.rules.push(newRule);
        this.save();
        return newRule;
    }

    updateRule(id: string, updates: Partial<FuelSurchargeRule>): FuelSurchargeRule | null {
        const index = this.rules.findIndex(r => r.id === id);
        if (index === -1) return null;

        this.rules[index] = {
            ...this.rules[index],
            ...updates,
            lastModified: new Date().toISOString()
        };
        this.save();
        return this.rules[index];
    }

    deleteRule(id: string): boolean {
        const index = this.rules.findIndex(r => r.id === id);
        if (index === -1) return false;

        this.rules[index].status = 'EXPIRED';
        this.save();
        return true;
    }

    // --- SURCHARGE CALCULATION ---

    calculateSurcharge(
        ruleId: string,
        params: {
            currentPrice?: number;
            city?: string;
            distanceKm?: number;
            baseFreight?: number;
        }
    ): FuelSurchargeCalculation | null {
        const rule = this.getRuleById(ruleId);
        if (!rule) return null;

        // Get current price
        let currentPrice = params.currentPrice;
        if (!currentPrice && params.city) {
            const priceRecord = this.getCurrentPrice(params.city);
            currentPrice = priceRecord?.dieselPrice;
        }
        if (!currentPrice) currentPrice = rule.baseDieselPrice;

        const priceDiff = currentPrice - rule.baseDieselPrice;
        let surchargeAmount = 0;
        const breakdown: string[] = [];

        // Calculate based on formula
        switch (rule.formula) {
            case 'PVC': {
                // PVC Formula: (Current Price - Base Price) / Mileage * Distance
                if (params.distanceKm) {
                    surchargeAmount = (priceDiff / rule.mileageBenchmark) * params.distanceKm;
                    breakdown.push(`Formula: PVC (Price Variance Charge)`);
                    breakdown.push(`Current Price: ₹${currentPrice}/L`);
                    breakdown.push(`Base Price: ₹${rule.baseDieselPrice}/L`);
                    breakdown.push(`Price Difference: ₹${priceDiff.toFixed(2)}/L`);
                    breakdown.push(`Mileage Benchmark: ${rule.mileageBenchmark} KMPL`);
                    breakdown.push(`Distance: ${params.distanceKm} km`);
                    breakdown.push(`Calculation: (${priceDiff.toFixed(2)} / ${rule.mileageBenchmark}) × ${params.distanceKm}`);
                    breakdown.push(`Surcharge: ₹${surchargeAmount.toFixed(2)}`);
                } else {
                    breakdown.push(`Error: Distance required for PVC calculation`);
                }
                break;
            }

            case 'SLAB': {
                // Slab-based: Find applicable slab
                if (rule.slabs) {
                    const applicableSlab = rule.slabs.find(s => currentPrice >= s.min && currentPrice < s.max);
                    if (applicableSlab) {
                        surchargeAmount = applicableSlab.surcharge;
                        breakdown.push(`Formula: Slab-based Surcharge`);
                        breakdown.push(`Current Price: ₹${currentPrice}/L`);
                        breakdown.push(`Applicable Slab: ₹${applicableSlab.min} - ₹${applicableSlab.max}`);
                        breakdown.push(`Surcharge: ₹${surchargeAmount}`);
                    } else {
                        breakdown.push(`No applicable slab found for price ₹${currentPrice}`);
                    }
                }
                break;
            }

            case 'PERCENTAGE': {
                // Percentage of base freight
                if (params.baseFreight && rule.percentageRate) {
                    surchargeAmount = (params.baseFreight * rule.percentageRate) / 100;
                    breakdown.push(`Formula: Percentage-based Surcharge`);
                    breakdown.push(`Base Freight: ₹${params.baseFreight.toLocaleString()}`);
                    breakdown.push(`Surcharge Rate: ${rule.percentageRate}%`);
                    breakdown.push(`Calculation: ${params.baseFreight} × ${rule.percentageRate}%`);
                    breakdown.push(`Surcharge: ₹${surchargeAmount.toFixed(2)}`);
                } else {
                    breakdown.push(`Error: Base freight required for percentage calculation`);
                }
                break;
            }

            case 'CUSTOM': {
                // Custom formula (would need eval or formula parser)
                breakdown.push(`Custom formula: ${rule.customFormula}`);
                breakdown.push(`Note: Custom formula evaluation not implemented in demo`);
                break;
            }
        }

        return {
            ruleId: rule.id,
            ruleName: rule.name,
            currentPrice,
            basePrice: rule.baseDieselPrice,
            priceDiff,
            distanceKm: params.distanceKm,
            baseFreight: params.baseFreight,
            surchargeAmount: Math.round(surchargeAmount * 100) / 100,
            breakdown,
            calculatedAt: new Date().toISOString()
        };
    }

    // --- IMPACT SIMULATOR ---

    simulatePriceImpact(
        priceChangePercent: number,
        contractIds?: string[]
    ): {
        totalImpact: number;
        impactByContract: { contractId: string; currentSurcharge: number; newSurcharge: number; impact: number }[];
    } {
        // Simulate impact of fuel price change on contracts
        const impactByContract: any[] = [];
        let totalImpact = 0;

        const rulesToSimulate = contractIds
            ? this.rules.filter(r => contractIds.includes(r.contractId || ''))
            : this.getActiveRules();

        rulesToSimulate.forEach(rule => {
            const currentPrice = rule.baseDieselPrice;
            const newPrice = currentPrice * (1 + priceChangePercent / 100);

            // Calculate current surcharge (assuming 1000 km distance)
            const currentCalc = this.calculateSurcharge(rule.id, {
                currentPrice,
                distanceKm: 1000
            });

            const newCalc = this.calculateSurcharge(rule.id, {
                currentPrice: newPrice,
                distanceKm: 1000
            });

            if (currentCalc && newCalc) {
                const impact = newCalc.surchargeAmount - currentCalc.surchargeAmount;
                impactByContract.push({
                    contractId: rule.contractId || rule.vendorId || 'Unknown',
                    currentSurcharge: currentCalc.surchargeAmount,
                    newSurcharge: newCalc.surchargeAmount,
                    impact
                });
                totalImpact += impact;
            }
        });

        return {
            totalImpact: Math.round(totalImpact * 100) / 100,
            impactByContract
        };
    }

    // --- AUTO-UPDATE (API Integration Placeholder) ---

    async fetchLatestPrices(): Promise<{ success: boolean; updated: number; message: string }> {
        // Placeholder for external API integration
        // In production, this would call Indian Oil Corporation API or similar

        // For demo, simulate price updates
        const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];
        let updated = 0;

        cities.forEach(city => {
            const currentPrice = this.getCurrentPrice(city);
            if (currentPrice) {
                // Simulate small price change
                const newPrice = currentPrice.dieselPrice + (Math.random() - 0.5) * 2;
                this.addPrice({
                    date: new Date().toISOString().split('T')[0],
                    city,
                    dieselPrice: Math.round(newPrice * 100) / 100,
                    petrolPrice: currentPrice.petrolPrice,
                    source: 'API',
                    verified: false,
                    apiProvider: 'Indian Oil Corporation (Simulated)'
                });
                updated++;
            }
        });

        return {
            success: true,
            updated,
            message: `Successfully fetched prices for ${updated} cities`
        };
    }

    // --- STATISTICS ---

    getStatistics() {
        return {
            totalPriceRecords: this.prices.length,
            totalRules: this.rules.length,
            activeRules: this.getActiveRules().length,
            rulesByFormula: {
                pvc: this.rules.filter(r => r.formula === 'PVC').length,
                slab: this.rules.filter(r => r.formula === 'SLAB').length,
                percentage: this.rules.filter(r => r.formula === 'PERCENTAGE').length,
                custom: this.rules.filter(r => r.formula === 'CUSTOM').length
            },
            citiesTracked: [...new Set(this.prices.map(p => p.city))].length,
            avgDieselPrice: this.prices.length > 0
                ? Math.round((this.prices.reduce((sum, p) => sum + p.dieselPrice, 0) / this.prices.length) * 100) / 100
                : 0
        };
    }

    reset() {
        this.prices = SEED_FUEL_PRICES;
        this.rules = SEED_SURCHARGE_RULES;
        this.save();
    }
}

export const fuelMasterService = new FuelMasterService();
