
/**
 * FX Service
 * Handles currency conversion and exchange rate lookups.
 * In a real application, this would connect to a Bloomberg or Reuters API.
 */

// Mock Historical Rates (against USD)
const RATES_DB: Record<string, number> = {
    'EUR': 1.08,  // 1 EUR = 1.08 USD
    'GBP': 1.25,  // 1 GBP = 1.25 USD
    'JPY': 0.0067, // 1 JPY = 0.0067 USD
    'INR': 0.012, // 1 INR = 0.012 USD (approx 83 INR/USD)
    'CNY': 0.14,  // 1 CNY = 0.14 USD
    'AUD': 0.65,  // 1 AUD = 0.65 USD
    'CAD': 0.73,  // 1 CAD = 0.73 USD
};

// Simulate daily fluctuation
const getRateForDate = (currency: string, dateStr: string): number => {
    const baseRate = RATES_DB[currency] || 1;
    if (currency === 'USD') return 1;

    // Simple deterministic pseudo-random fluctuation based on date hash
    const dateHash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fluctuation = (dateHash % 20) / 1000; // up to +/- 1%
    return baseRate + (dateHash % 2 === 0 ? fluctuation : -fluctuation);
};

export const normalizeCurrency = (amount: number, currency: string, date: string): { baseAmount: number, rate: number, baseCurrency: 'USD' } => {
    if (currency === 'USD') {
        return { baseAmount: amount, rate: 1.0, baseCurrency: 'USD' };
    }

    const rate = getRateForDate(currency, date);
    const baseAmount = amount * rate;

    return {
        baseAmount: Number(baseAmount.toFixed(2)),
        rate: Number(rate.toFixed(4)),
        baseCurrency: 'USD'
    };
};

export const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};
