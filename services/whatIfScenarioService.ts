
export interface SimulationResult {
    sourceCarrier: string;
    targetCarrier: string;
    shiftPercentage: number;
    originalSpend: number;
    newSpend: number;
    savings: number;
    transitTimeImpact: number; // Days (positive = slower)
    riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
    details: string[];
}

// Mock Average Cost per Unit (Container/Kg) and Transit Time
const CARRIER_PROFILES: Record<string, { avgCost: number, avgDays: number, reliability: number }> = {
    'Maersk Logistics': { avgCost: 3200, avgDays: 45, reliability: 0.92 },
    'MSC': { avgCost: 2950, avgDays: 52, reliability: 0.88 }, // Cheaper, Slower
    'Kuehne+Nagel': { avgCost: 3450, avgDays: 42, reliability: 0.96 }, // Premium
    'DHL Express': { avgCost: 8500, avgDays: 5, reliability: 0.99 }, // Air (Expensive)
    'Expeditors': { avgCost: 3300, avgDays: 44, reliability: 0.94 }
};

export const runSimulation = (source: string, target: string, percent: number, totalVolume: number = 1000): SimulationResult => {
    const sourceProfile = CARRIER_PROFILES[source] || { avgCost: 3000, avgDays: 45, reliability: 0.9 };
    const targetProfile = CARRIER_PROFILES[target] || { avgCost: 3000, avgDays: 45, reliability: 0.9 };

    // Calculate Original State
    // Assume we are shifting from Source -> Target
    // Wait, usually we shift FROM a carrier TO another.
    // Let's assume 'totalVolume' is the volume currently with 'source'.

    const volumeToShift = totalVolume * (percent / 100);
    const retainedVolume = totalVolume - volumeToShift;

    const originalCost = totalVolume * sourceProfile.avgCost;

    const newCost = (retainedVolume * sourceProfile.avgCost) + (volumeToShift * targetProfile.avgCost);
    const savings = originalCost - newCost;

    // Transit Time Impact (Weighted Average change? Or just the shift impact?)
    // Let's report the impact on the *shifted* volume, or overall?
    // Let's show overall average change.
    const originalAvgDays = sourceProfile.avgDays;
    const newAvgDays = ((retainedVolume * sourceProfile.avgDays) + (volumeToShift * targetProfile.avgDays)) / totalVolume;
    const transitTimeImpact = newAvgDays - originalAvgDays;

    // Risk Calc
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (targetProfile.reliability < 0.9) risk = 'MEDIUM';
    if (targetProfile.reliability < 0.85) risk = 'HIGH';
    if (percent > 50 && targetProfile.reliability < sourceProfile.reliability) risk = 'HIGH'; // Big shift to worse carrier

    return {
        sourceCarrier: source,
        targetCarrier: target,
        shiftPercentage: percent,
        originalSpend: originalCost,
        newSpend: newCost,
        savings,
        transitTimeImpact,
        riskAssessment: risk,
        details: [
            `Moving ${Math.round(volumeToShift)} units from ${source} to ${target}.`,
            `Rate Difference: $${sourceProfile.avgCost} -> $${targetProfile.avgCost} per unit.`,
            targetProfile.reliability < 0.9 ? 'Warning: Target carrier has lower reliability score.' : 'Target carrier reliability is stable.'
        ]
    };
};
