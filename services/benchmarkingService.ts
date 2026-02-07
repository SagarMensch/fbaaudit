
// Mock Market Data (Simulating Xeneta / Drewry / Freightos Index)

export interface MarketRate {
    origin: string;
    destination: string;
    mode: 'OCEAN' | 'AIR';
    period: string; // YYYY-MM
    avgRate: number; // Base rate
    highRate: number;
    lowRate: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface BenchmarkResult {
    lane: string;
    marketRate: number;
    variancePercent: number;
    status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'; // Performance vs Market
    savings: number; // Negative if overpaying
    marketTrend: 'UP' | 'DOWN' | 'STABLE';
}

const MARKET_INDICES: MarketRate[] = [
    { origin: 'Shanghai', destination: 'Los Angeles', mode: 'OCEAN', period: '2025-12', avgRate: 4200, highRate: 5500, lowRate: 3800, trend: 'UP' },
    { origin: 'Shanghai', destination: 'Rotterdam', mode: 'OCEAN', period: '2025-12', avgRate: 3100, highRate: 4000, lowRate: 2500, trend: 'STABLE' },
    { origin: 'Berlin', destination: 'Chicago', mode: 'AIR', period: '2025-12', avgRate: 4.50, highRate: 6.00, lowRate: 3.20, trend: 'UP' }, // Per Kg
    { origin: 'Berlin', destination: 'Chicago', mode: 'OCEAN', period: '2025-12', avgRate: 4800, highRate: 5200, lowRate: 4100, trend: 'DOWN' },
];

/**
 * Compares an invoice's effective rate against the market average.
 */
export const benchmarkRate = (origin: string, destination: string, mode: 'OCEAN' | 'AIR', amount: number, quantity: number = 1): BenchmarkResult => {
    // Normalize fuzzy city names for mock
    let cleanOrg = 'Shanghai';
    if (origin.includes('Berlin') || origin.includes('DE')) cleanOrg = 'Berlin';

    let cleanDest = 'Los Angeles';
    if (destination.includes('Chicago') || destination.includes('IL')) cleanDest = 'Chicago';

    const market = MARKET_INDICES.find(m => m.origin === cleanOrg && m.destination === cleanDest && m.mode === mode)
        || { origin: 'Global', destination: 'Avg', mode, period: '2025-12', avgRate: 4500, highRate: 5000, lowRate: 4000, trend: 'STABLE' }; // Fallback

    // For Air, amount is total, so we need rate per kg if quantity provided, else assume amount is the rate (unlikely)
    // For demo, assume 'amount' passed in is the total freight cost.
    // We need to compare Unit Cost ideally.
    // If quantity is 1 (e.g. 1 container), rate = amount.

    const userRate = amount / (quantity || 1);
    const comparisonRate = market.avgRate;

    const variance = userRate - comparisonRate;
    const variancePercent = (variance / comparisonRate) * 100;

    let status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'FAIR';
    if (variancePercent <= -10) status = 'EXCELLENT';
    else if (variancePercent <= 0) status = 'GOOD';
    else if (variancePercent <= 10) status = 'FAIR';
    else status = 'POOR';

    return {
        lane: `${market.origin} -> ${market.destination}`,
        marketRate: comparisonRate,
        variancePercent,
        status,
        savings: (comparisonRate - userRate) * (quantity || 1), // Visualization of total opportunity
        marketTrend: market.trend
    };
};
