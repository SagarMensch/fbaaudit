
import { Invoice } from '../types';

export interface SKU {
    id: string;
    name: string;
    quantity: number;
    weight: number; // Total weight for line
    volume: number; // Total volume for line
    value: number; // Total FOB value
}

export interface LandedCostResult {
    skuId: string;
    name: string;
    quantity: number;
    freightCost: number;     // Total allocated freight
    perUnitFreight: number;  // Freight per unit
    totalLandedCost: number; // Value + Freight + Duty(simulated)
    perUnitTotal: number;
    allocationMethod: 'WEIGHT' | 'VOLUME' | 'VALUE';
}

/**
 * Allocates the total invoice amount (freight) across SKUs.
 * Default strategy: Weight-based for Air/Road, Volume-based for Ocean.
 */
export const calculateLandedCost = (invoiceAmount: number, skus: SKU[], mode: string = 'Ocean'): LandedCostResult[] => {
    const method = mode.toLowerCase().includes('air') ? 'WEIGHT' : 'VOLUME'; // Simplified rule

    const totalWeight = skus.reduce((sum, item) => sum + item.weight, 0);
    const totalVolume = skus.reduce((sum, item) => sum + item.volume, 0);

    // Guard against divide by zero
    if ((method === 'WEIGHT' && totalWeight === 0) || (method === 'VOLUME' && totalVolume === 0)) {
        // Fallback to Value based
        const totalValue = skus.reduce((sum, item) => sum + item.value, 0);
        return skus.map(sku => ({
            skuId: sku.id,
            name: sku.name,
            quantity: sku.quantity,
            freightCost: (sku.value / totalValue) * invoiceAmount,
            perUnitFreight: ((sku.value / totalValue) * invoiceAmount) / sku.quantity,
            totalLandedCost: sku.value + ((sku.value / totalValue) * invoiceAmount),
            perUnitTotal: (sku.value + ((sku.value / totalValue) * invoiceAmount)) / sku.quantity,
            allocationMethod: 'VALUE'
        }));
    }

    return skus.map(sku => {
        let ratio = 0;
        if (method === 'WEIGHT') ratio = sku.weight / totalWeight;
        else ratio = sku.volume / totalVolume;

        const allocatedFreight = ratio * invoiceAmount;
        const duty = sku.value * 0.05; // Simulate 5% Duty
        const totalLanded = sku.value + allocatedFreight + duty;

        return {
            skuId: sku.id,
            name: sku.name,
            quantity: sku.quantity,
            freightCost: allocatedFreight,
            perUnitFreight: allocatedFreight / sku.quantity,
            totalLandedCost: totalLanded,
            perUnitTotal: totalLanded / sku.quantity,
            allocationMethod: method
        };
    });
};
