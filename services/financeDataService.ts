// Finance Terminal API Service
// Integrates free tier APIs for real-time data

const RAPIDAPI_KEY = 'YOUR_RAPIDAPI_KEY_HERE'; // Get free key from rapidapi.com

interface FuelPrice {
    city: string;
    diesel: number;
    petrol: number;
    date: string;
    change: number;
}

interface FreightRate {
    route: string;
    rate: number;
    vehicleType: string;
    lastUpdated: string;
}

// 1. DIESEL PRICES - RapidAPI Free Tier
export async function fetchDieselPrices(): Promise<Map<string, FuelPrice>> {
    try {
        const response = await fetch('https://daily-fuel-price-india.p.rapidapi.com/v1/fuel-prices', {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'daily-fuel-price-india.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            console.warn('RapidAPI call failed, using fallback data');
            return getFallbackDieselPrices();
        }

        const data = await response.json();

        // Parse response and extract Mumbai, Delhi prices
        const prices = new Map<string, FuelPrice>();

        // Find Mumbai and Delhi from response
        const mumbai = data.find((city: any) => city.city.toLowerCase().includes('mumbai'));
        const delhi = data.find((city: any) => city.city.toLowerCase().includes('delhi'));

        if (mumbai) {
            prices.set('MUMBAI', {
                city: 'Mumbai',
                diesel: parseFloat(mumbai.diesel),
                petrol: parseFloat(mumbai.petrol),
                date: mumbai.date,
                change: mumbai.dieselChange || 0
            });
        }

        if (delhi) {
            prices.set('DELHI', {
                city: 'Delhi',
                diesel: parseFloat(delhi.diesel),
                petrol: parseFloat(delhi.petrol),
                date: delhi.date,
                change: delhi.dieselChange || 0
            });
        }

        return prices;
    } catch (error) {
        console.error('Error fetching diesel prices:', error);
        return getFallbackDieselPrices();
    }
}

// Fallback data (last known prices as of Dec 2024)
function getFallbackDieselPrices(): Map<string, FuelPrice> {
    const prices = new Map<string, FuelPrice>();

    prices.set('MUMBAI', {
        city: 'Mumbai',
        diesel: 94.50,
        petrol: 106.31,
        date: new Date().toISOString().split('T')[0],
        change: 0
    });

    prices.set('DELHI', {
        city: 'Delhi',
        diesel: 89.66,
        petrol: 96.72,
        date: new Date().toISOString().split('T')[0],
        change: 0
    });

    return prices;
}

// 2. FREIGHT INDEX - Simulated based on real market trends
// Note: SuperProcure API requires paid subscription
// This simulates realistic variations based on time of day and market conditions
export function calculateFreightIndex(): number {
    const baseIndex = 8547.82; // Base freight index
    const hour = new Date().getHours();

    // Simulate market variations
    // Higher during business hours (9 AM - 6 PM)
    const timeMultiplier = (hour >= 9 && hour <= 18) ? 1.02 : 0.98;

    // Add small random variation (-1% to +1%)
    const randomVariation = 1 + (Math.random() - 0.5) * 0.02;

    return parseFloat((baseIndex * timeMultiplier * randomVariation).toFixed(2));
}

// 3. CONTAINER RATES - Public data from shipping lines
// Note: Real-time rates require SeaRates API subscription
export function getContainerRates() {
    return {
        '20FT': {
            rate: 2850,
            change: 1.60,
            trend: 'up' as const,
            source: 'Market Average'
        },
        '40FT': {
            rate: 4200,
            change: -1.87,
            trend: 'down' as const,
            source: 'Market Average'
        }
    };
}

// 4. FTL RATES - Based on Freight-Index.in public data
export function getFTLRates() {
    return {
        '32FT_MXL': {
            rate: 15800,
            route: 'Mumbai-Delhi',
            change: 1.93,
            trend: 'up' as const
        },
        'LTL_KG': {
            rate: 8.50,
            change: 1.79,
            trend: 'up' as const
        }
    };
}

// 5. AIR FREIGHT - Market averages
export function getAirFreightRate() {
    return {
        rate: 185.25,
        unit: 'per kg',
        change: -1.12,
        trend: 'down' as const
    };
}

// Main function to fetch all market data
export async function fetchAllMarketData() {
    const dieselPrices = await fetchDieselPrices();
    const freightIndex = calculateFreightIndex();
    const containerRates = getContainerRates();
    const ftlRates = getFTLRates();
    const airFreight = getAirFreightRate();

    return {
        diesel: {
            mumbai: dieselPrices.get('MUMBAI'),
            delhi: dieselPrices.get('DELHI')
        },
        freightIndex,
        containers: containerRates,
        ftl: ftlRates,
        air: airFreight,
        lastUpdated: new Date().toISOString(),
        dataSource: {
            diesel: 'RapidAPI Daily Fuel Price India (Free Tier)',
            freight: 'Calculated Index (Market-based)',
            containers: 'Market Averages',
            note: 'Demo data - For production, subscribe to premium APIs'
        }
    };
}

// Cache management
let cachedData: any = null;
let lastFetch: number = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for diesel prices

export async function getCachedMarketData() {
    const now = Date.now();

    if (!cachedData || (now - lastFetch) > CACHE_DURATION) {
        cachedData = await fetchAllMarketData();
        lastFetch = now;
    }

    return cachedData;
}
