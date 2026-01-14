import { Invoice, InvoiceStatus, MatchStatus } from '../types';

interface ShipmentData {
    shipmentId: string;
    carrier: string;
    origin: string;
    destination: string;
    weight: number;
    activityDate: string;
    rateCardId: string;
    contractedRate: number;
}

// Mock Shipment Data (Pending Billing)
export const MOCK_UNBILLED_SHIPMENTS: ShipmentData[] = [
    {
        shipmentId: 'SH-2025-0016',
        carrier: 'Maersk',
        origin: 'Shanghai, CN',
        destination: 'Long Beach, CA',
        weight: 12000,
        activityDate: '2025-12-10',
        rateCardId: 'RC-2025-GLOBAL-01',
        contractedRate: 4500.00
    },
    {
        shipmentId: 'SH-2025-0017',
        carrier: 'CH Robinson',
        origin: 'Chicago, IL',
        destination: 'Dallas, TX',
        weight: 45000,
        activityDate: '2025-12-12',
        rateCardId: 'RC-2025-DOM-04',
        contractedRate: 1250.00
    }
];

export const generateSelfBillingAdvice = (shipment: ShipmentData): Invoice => {
    // In a real system, this would fetch rates, calculate fuel, taxes, etc.
    const calculatedAmount = shipment.contractedRate * 1.05; // Adding 5% mock fuel surcharge

    return {
        id: `ERS-${shipment.shipmentId}`,
        invoiceNumber: `SB-${shipment.shipmentId.replace('SH-', '')}`,
        carrier: shipment.carrier,
        origin: shipment.origin,
        destination: shipment.destination,
        amount: calculatedAmount,
        baseAmount: calculatedAmount,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        status: InvoiceStatus.APPROVED, // ERS invoices are pre-approved by nature
        variance: 0,
        reason: 'Evaluated Receipt Settlement (Auto-Generated)',
        extractionConfidence: 1.0,
        source: 'ERS',
        lineItems: [
            { description: 'Freight Charge (Contract Rate)', amount: shipment.contractedRate, expectedAmount: shipment.contractedRate },
            { description: 'Fuel Surcharge (5%)', amount: shipment.contractedRate * 0.05, expectedAmount: shipment.contractedRate * 0.05 }
        ],
        matchResults: {
            rate: MatchStatus.MATCH,
            delivery: MatchStatus.MATCH,
            unit: MatchStatus.MATCH
        }
    };
};
