
import { Invoice } from '../types';

export interface CarbonFootprint {
    totalEmissions: number; // Tonnes CO2e
    intensity: number; // gCO2/t-km
    distanceKm: number;
    mode: 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL';
    offsetCost: number; // Estimated cost to offset in USD
    rating: 'A' | 'B' | 'C' | 'D' | 'E';
}

// Emission Factors (gCO2 per tonne-km)
const EMISSION_FACTORS = {
    OCEAN: 8,
    RAIL: 20,
    ROAD: 62,
    AIR: 600 // Very high
};

// Mock Distances (in km)
const DISTANCES: Record<string, number> = {
    'Shanghai-Los Angeles': 10400,
    'Berlin-Chicago': 7000,
    'JFK Airport-Raleigh Hub': 850
};

export const calculateCarbon = (invoice: Invoice): CarbonFootprint => {
    // Infer mode from carrier or data
    let mode: 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL' = 'OCEAN';
    if (invoice.carrier.includes('Air') || invoice.carrier.includes('Express') || invoice.origin?.includes('Airport')) mode = 'AIR';
    else if (invoice.carrier.includes('Truck') || invoice.carrier.includes('Road')) mode = 'ROAD';

    // Construct lane key or default
    const laneKey = `${invoice.origin}-${invoice.destination}`;
    const distance = DISTANCES[laneKey] || (mode === 'AIR' ? 6000 : 12000); // Default approximations

    // Assume weight (Mock) - usually in POD or Line Items.
    // 1 Container ~ 10-20 Tonnes. Air Shipment ~ 0.5 - 5 Tonnes.
    const weightTonnes = mode === 'AIR' ? 2.5 : 18;

    const factor = EMISSION_FACTORS[mode];
    const totalEmissionsKg = weightTonnes * distance * factor / 1000; // factor is g/t-km -> kg
    const totalEmissionsTonnes = totalEmissionsKg / 1000;

    const offsetCost = totalEmissionsTonnes * 15; // ~₹15 per tonne for carbon credits

    let rating: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
    if (mode === 'OCEAN' || mode === 'RAIL') rating = 'A';
    if (mode === 'ROAD') rating = 'C';
    if (mode === 'AIR') rating = 'E';

    return {
        totalEmissions: totalEmissionsTonnes,
        intensity: factor,
        distanceKm: distance,
        mode,
        offsetCost,
        rating
    };
};
