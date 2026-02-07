
import { Invoice, InvoiceStatus } from '../types';

export interface CarrierScorecard {
    carrierName: string;
    overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
    billingAccuracy: number; // Percentage (0-100)
    disputeResolutionTime: number; // Days
    priceCompetitiveness: number; // 0-100 Score
    totalInvoices: number;
    totalSpend: number;
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

// Mock database of carrier performance to ensure consistency
const CARRIER_STATS: Record<string, CarrierScorecard> = {
    'Kuehne+Nagel': {
        carrierName: 'Kuehne+Nagel',
        overallGrade: 'A',
        billingAccuracy: 98.5,
        disputeResolutionTime: 2.5,
        priceCompetitiveness: 85,
        totalInvoices: 1250,
        totalSpend: 15400000,
        trend: 'STABLE'
    },
    'Maersk Logistics': {
        carrierName: 'Maersk Logistics',
        overallGrade: 'B',
        billingAccuracy: 92.0,
        disputeResolutionTime: 5.0,
        priceCompetitiveness: 90,
        totalInvoices: 3400,
        totalSpend: 42000000,
        trend: 'DECLINING'
    },
    'DHL Express': {
        carrierName: 'DHL Express',
        overallGrade: 'A+',
        billingAccuracy: 99.2,
        disputeResolutionTime: 1.2,
        priceCompetitiveness: 75, // More expensive but better service
        totalInvoices: 850,
        totalSpend: 5400000,
        trend: 'IMPROVING'
    },
    'Expeditors': {
        carrierName: 'Expeditors',
        overallGrade: 'B',
        billingAccuracy: 94.5,
        disputeResolutionTime: 3.8,
        priceCompetitiveness: 88,
        totalInvoices: 1100,
        totalSpend: 9800000,
        trend: 'STABLE'
    }
};

export const getCarrierScorecard = (carrierName: string): CarrierScorecard => {
    // Normalize checking
    const key = Object.keys(CARRIER_STATS).find(k => carrierName.includes(k) || k.includes(carrierName));

    if (key) return CARRIER_STATS[key];

    // Default for unknown carriers
    return {
        carrierName: carrierName,
        overallGrade: 'C',
        billingAccuracy: 85.0,
        disputeResolutionTime: 7.5,
        priceCompetitiveness: 80,
        totalInvoices: 50,
        totalSpend: 120000,
        trend: 'STABLE'
    };
};

export const getScoreColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
};
