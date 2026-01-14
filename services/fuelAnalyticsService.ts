// Phase 2: Advanced Fuel Analytics Service
// Price forecasting, historical trends, variance analysis, formula builder

import { fuelMasterService } from './fuelMasterService';
import { analyticsEngine } from './analyticsEngine';

export interface FuelPriceForecast {
    city: string;
    currentPrice: number;
    forecast: Array<{
        date: string;
        predictedPrice: number;
        confidence: number;
        range: { min: number; max: number };
    }>;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    factors: Array<{ factor: string; impact: 'HIGH' | 'MEDIUM' | 'LOW' }>;
}

export interface FuelPriceTrend {
    city: string;
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
    historical: Array<{ date: string; dieselPrice: number; petrolPrice: number }>;
    statistics: {
        avgDiesel: number;
        minDiesel: number;
        maxDiesel: number;
        stdDevDiesel: number;
        avgPetrol: number;
        minPetrol: number;
        maxPetrol: number;
        stdDevPetrol: number;
    };
    volatility: number; // 0-100
}

export interface FuelVarianceAnalysis {
    summary: {
        avgNationalPrice: number;
        highestCity: { city: string; price: number };
        lowestCity: { city: string; price: number };
        priceRange: number;
        standardDeviation: number;
    };
    cityComparison: Array<{
        city: string;
        price: number;
        variance: number; // % difference from national avg
        rank: number;
    }>;
    regionalAnalysis: Array<{
        region: string;
        avgPrice: number;
        cities: number;
        variance: number;
    }>;
}

export interface SurchargeFormula {
    id: string;
    name: string;
    description: string;
    formula: string; // Mathematical expression
    variables: Array<{ name: string; description: string; defaultValue?: number }>;
    conditions: Array<{ condition: string; action: string }>;
    examples: Array<{ input: Record<string, number>; output: number }>;
}

export interface SurchargeCalculation {
    baseFreight: number;
    fuelPrice: number;
    baselinePrice: number;
    surchargePercent: number;
    surchargeAmount: number;
    totalAmount: number;
    breakdown: Array<{ step: string; value: number; description: string }>;
}

class FuelAnalyticsService {
    /**
     * Forecast fuel prices for a city
     */
    public forecastPrice(city: string, periods: number = 30): FuelPriceForecast | null {
        const prices = fuelMasterService.getAllPrices().filter(p => p.city === city);
        if (prices.length === 0) return null;

        // Get historical diesel prices
        const historicalPrices = prices
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(p => p.dieselPrice);

        // Use exponential smoothing for forecast
        const forecastResult = analyticsEngine.exponentialSmoothing(historicalPrices, 0.3, periods);

        // Calculate confidence intervals
        const stdDev = analyticsEngine.calculateStdDev(historicalPrices);

        const forecast = forecastResult.forecast.map((price, idx) => {
            const date = new Date();
            date.setDate(date.getDate() + idx + 1);

            // Confidence decreases over time
            const confidence = Math.max(60, 95 - (idx * 1.5));

            // Confidence interval widens over time
            const intervalWidth = stdDev * (1 + idx * 0.1);

            return {
                date: date.toISOString().split('T')[0],
                predictedPrice: Math.round(price * 100) / 100,
                confidence: Math.round(confidence),
                range: {
                    min: Math.round((price - intervalWidth) * 100) / 100,
                    max: Math.round((price + intervalWidth) * 100) / 100
                }
            };
        });

        // Determine trend
        const recentPrices = historicalPrices.slice(-7);
        const avgRecent = analyticsEngine.calculateMean(recentPrices);
        const avgForecast = analyticsEngine.calculateMean(forecastResult.forecast.slice(0, 7));

        let trend: FuelPriceForecast['trend'];
        if (avgForecast > avgRecent * 1.02) trend = 'INCREASING';
        else if (avgForecast < avgRecent * 0.98) trend = 'DECREASING';
        else trend = 'STABLE';

        // Identify factors
        const factors: FuelPriceForecast['factors'] = [
            { factor: 'Crude Oil Prices', impact: 'HIGH' },
            { factor: 'Exchange Rate', impact: 'MEDIUM' },
            { factor: 'Seasonal Demand', impact: 'MEDIUM' },
            { factor: 'Government Taxes', impact: 'LOW' }
        ];

        return {
            city,
            currentPrice: historicalPrices[historicalPrices.length - 1],
            forecast,
            trend,
            factors
        };
    }

    /**
     * Analyze historical price trends
     */
    public analyzeTrend(city: string, period: FuelPriceTrend['period']): FuelPriceTrend | null {
        const allPrices = fuelMasterService.getAllPrices().filter(p => p.city === city);
        if (allPrices.length === 0) return null;

        // Filter by period
        const cutoffDate = new Date();
        if (period === 'WEEK') cutoffDate.setDate(cutoffDate.getDate() - 7);
        else if (period === 'MONTH') cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        else if (period === 'QUARTER') cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        else cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

        const prices = allPrices
            .filter(p => new Date(p.date) >= cutoffDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const historical = prices.map(p => ({
            date: p.date,
            dieselPrice: p.dieselPrice,
            petrolPrice: p.petrolPrice || p.dieselPrice * 1.15
        }));

        // Calculate statistics
        const dieselPrices = historical.map(h => h.dieselPrice);
        const petrolPrices = historical.map(h => h.petrolPrice);

        const statistics = {
            avgDiesel: analyticsEngine.calculateMean(dieselPrices),
            minDiesel: Math.min(...dieselPrices),
            maxDiesel: Math.max(...dieselPrices),
            stdDevDiesel: analyticsEngine.calculateStdDev(dieselPrices),
            avgPetrol: analyticsEngine.calculateMean(petrolPrices),
            minPetrol: Math.min(...petrolPrices),
            maxPetrol: Math.max(...petrolPrices),
            stdDevPetrol: analyticsEngine.calculateStdDev(petrolPrices)
        };

        // Calculate volatility (coefficient of variation)
        const volatility = (statistics.stdDevDiesel / statistics.avgDiesel) * 100;

        return {
            city,
            period,
            historical,
            statistics,
            volatility: Math.round(volatility * 10) / 10
        };
    }

    /**
     * Analyze price variance across cities
     */
    public analyzeVariance(): FuelVarianceAnalysis {
        const latestPrices = new Map<string, number>();

        // Get latest price for each city
        fuelMasterService.getAllPrices().forEach(p => {
            const existing = latestPrices.get(p.city);
            if (!existing || new Date(p.date) > new Date(existing.toString())) {
                latestPrices.set(p.city, p.dieselPrice);
            }
        });

        const prices = Array.from(latestPrices.values());
        const avgNationalPrice = analyticsEngine.calculateMean(prices);
        const stdDev = analyticsEngine.calculateStdDev(prices);

        // Find highest and lowest
        let highestCity = { city: '', price: 0 };
        let lowestCity = { city: '', price: Infinity };

        latestPrices.forEach((price, city) => {
            if (price > highestCity.price) {
                highestCity = { city, price };
            }
            if (price < lowestCity.price) {
                lowestCity = { city, price };
            }
        });

        // City comparison
        const cityComparison = Array.from(latestPrices.entries())
            .map(([city, price]) => ({
                city,
                price,
                variance: ((price - avgNationalPrice) / avgNationalPrice) * 100,
                rank: 0
            }))
            .sort((a, b) => a.price - b.price)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));

        // Regional analysis (simplified - group by first letter)
        const regions = new Map<string, { prices: number[]; cities: Set<string> }>();

        latestPrices.forEach((price, city) => {
            const region = city.charAt(0).toUpperCase();
            if (!regions.has(region)) {
                regions.set(region, { prices: [], cities: new Set() });
            }
            regions.get(region)!.prices.push(price);
            regions.get(region)!.cities.add(city);
        });

        const regionalAnalysis = Array.from(regions.entries()).map(([region, data]) => ({
            region: `Region ${region}`,
            avgPrice: analyticsEngine.calculateMean(data.prices),
            cities: data.cities.size,
            variance: ((analyticsEngine.calculateMean(data.prices) - avgNationalPrice) / avgNationalPrice) * 100
        }));

        return {
            summary: {
                avgNationalPrice: Math.round(avgNationalPrice * 100) / 100,
                highestCity,
                lowestCity,
                priceRange: highestCity.price - lowestCity.price,
                standardDeviation: Math.round(stdDev * 100) / 100
            },
            cityComparison,
            regionalAnalysis
        };
    }

    /**
     * Get predefined surcharge formulas
     */
    public getSurchargeFormulas(): SurchargeFormula[] {
        return [
            {
                id: 'SIMPLE_PERCENTAGE',
                name: 'Simple Percentage',
                description: 'Fixed percentage of base freight',
                formula: 'baseFreight * (surchargePercent / 100)',
                variables: [
                    { name: 'baseFreight', description: 'Base freight amount', defaultValue: 10000 },
                    { name: 'surchargePercent', description: 'Surcharge percentage', defaultValue: 15 }
                ],
                conditions: [],
                examples: [
                    { input: { baseFreight: 10000, surchargePercent: 15 }, output: 1500 },
                    { input: { baseFreight: 25000, surchargePercent: 12 }, output: 3000 }
                ]
            },
            {
                id: 'INDEXED_SURCHARGE',
                name: 'Indexed Surcharge',
                description: 'Based on fuel price vs baseline',
                formula: 'baseFreight * ((currentPrice - baselinePrice) / baselinePrice) * multiplier',
                variables: [
                    { name: 'baseFreight', description: 'Base freight amount', defaultValue: 10000 },
                    { name: 'currentPrice', description: 'Current fuel price per liter', defaultValue: 95 },
                    { name: 'baselinePrice', description: 'Baseline fuel price per liter', defaultValue: 85 },
                    { name: 'multiplier', description: 'Adjustment multiplier', defaultValue: 1.5 }
                ],
                conditions: [
                    { condition: 'currentPrice > baselinePrice', action: 'Apply surcharge' },
                    { condition: 'currentPrice <= baselinePrice', action: 'No surcharge' }
                ],
                examples: [
                    { input: { baseFreight: 10000, currentPrice: 95, baselinePrice: 85, multiplier: 1.5 }, output: 1765 },
                    { input: { baseFreight: 10000, currentPrice: 80, baselinePrice: 85, multiplier: 1.5 }, output: 0 }
                ]
            },
            {
                id: 'TIERED_SURCHARGE',
                name: 'Tiered Surcharge',
                description: 'Different rates for different price ranges',
                formula: 'if (variance < 5) then 0 else if (variance < 10) then baseFreight * 0.05 else baseFreight * 0.10',
                variables: [
                    { name: 'baseFreight', description: 'Base freight amount', defaultValue: 10000 },
                    { name: 'variance', description: 'Price variance percentage', defaultValue: 8 }
                ],
                conditions: [
                    { condition: 'variance < 5%', action: 'No surcharge' },
                    { condition: '5% <= variance < 10%', action: '5% surcharge' },
                    { condition: 'variance >= 10%', action: '10% surcharge' }
                ],
                examples: [
                    { input: { baseFreight: 10000, variance: 3 }, output: 0 },
                    { input: { baseFreight: 10000, variance: 8 }, output: 500 },
                    { input: { baseFreight: 10000, variance: 12 }, output: 1000 }
                ]
            }
        ];
    }

    /**
     * Calculate surcharge using a formula
     */
    public calculateSurcharge(
        formulaId: string,
        baseFreight: number,
        fuelPrice: number,
        baselinePrice: number = 85
    ): SurchargeCalculation {
        const formula = this.getSurchargeFormulas().find(f => f.id === formulaId);

        let surchargeAmount = 0;
        let surchargePercent = 0;
        const breakdown: SurchargeCalculation['breakdown'] = [];

        if (formulaId === 'SIMPLE_PERCENTAGE') {
            surchargePercent = 15; // Default
            surchargeAmount = baseFreight * (surchargePercent / 100);

            breakdown.push(
                { step: 'Base Freight', value: baseFreight, description: 'Original freight amount' },
                { step: 'Surcharge %', value: surchargePercent, description: 'Fixed surcharge percentage' },
                { step: 'Surcharge Amount', value: surchargeAmount, description: `${surchargePercent}% of base freight` }
            );
        } else if (formulaId === 'INDEXED_SURCHARGE') {
            const variance = ((fuelPrice - baselinePrice) / baselinePrice);
            const multiplier = 1.5;

            if (fuelPrice > baselinePrice) {
                surchargeAmount = baseFreight * variance * multiplier;
                surchargePercent = variance * multiplier * 100;

                breakdown.push(
                    { step: 'Base Freight', value: baseFreight, description: 'Original freight amount' },
                    { step: 'Current Fuel Price', value: fuelPrice, description: 'Per liter' },
                    { step: 'Baseline Price', value: baselinePrice, description: 'Reference price' },
                    { step: 'Variance', value: variance * 100, description: 'Percentage increase' },
                    { step: 'Multiplier', value: multiplier, description: 'Adjustment factor' },
                    { step: 'Surcharge Amount', value: surchargeAmount, description: 'Calculated surcharge' }
                );
            } else {
                breakdown.push(
                    { step: 'Current Fuel Price', value: fuelPrice, description: 'Below baseline' },
                    { step: 'No Surcharge', value: 0, description: 'Price below baseline threshold' }
                );
            }
        } else if (formulaId === 'TIERED_SURCHARGE') {
            const variance = ((fuelPrice - baselinePrice) / baselinePrice) * 100;

            if (variance < 5) {
                surchargePercent = 0;
            } else if (variance < 10) {
                surchargePercent = 5;
            } else {
                surchargePercent = 10;
            }

            surchargeAmount = baseFreight * (surchargePercent / 100);

            breakdown.push(
                { step: 'Base Freight', value: baseFreight, description: 'Original freight amount' },
                { step: 'Price Variance', value: variance, description: 'Percentage vs baseline' },
                { step: 'Tier', value: surchargePercent, description: `${surchargePercent}% tier applied` },
                { step: 'Surcharge Amount', value: surchargeAmount, description: 'Calculated surcharge' }
            );
        }

        return {
            baseFreight,
            fuelPrice,
            baselinePrice,
            surchargePercent: Math.round(surchargePercent * 100) / 100,
            surchargeAmount: Math.round(surchargeAmount * 100) / 100,
            totalAmount: Math.round((baseFreight + surchargeAmount) * 100) / 100,
            breakdown
        };
    }

    /**
     * Get comprehensive fuel analytics
     */
    public getComprehensiveAnalytics() {
        const allPrices = fuelMasterService.getAllPrices();
        const cities = Array.from(new Set(allPrices.map(p => p.city)));

        return {
            summary: {
                totalCities: cities.length,
                totalPriceRecords: allPrices.length,
                avgNationalPrice: this.analyzeVariance().summary.avgNationalPrice,
                priceRange: this.analyzeVariance().summary.priceRange
            },
            topCities: this.analyzeVariance().cityComparison.slice(0, 5),
            volatileCities: cities
                .map(city => {
                    const trend = this.analyzeTrend(city, 'MONTH');
                    return trend ? { city, volatility: trend.volatility } : null;
                })
                .filter(Boolean)
                .sort((a: any, b: any) => b.volatility - a.volatility)
                .slice(0, 5)
        };
    }
}

export const fuelAnalyticsService = new FuelAnalyticsService();
