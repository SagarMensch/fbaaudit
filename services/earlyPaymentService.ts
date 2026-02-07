
import { Invoice } from '../types';

export interface EarlyPaymentOffer {
    available: boolean;
    daysEarly: number;
    discountRate: number; // e.g. 0.02 for 2%
    discountAmount: number;
    netAmount: number;
    offerExpires: string;
    apr: number;
}

const APR = 0.12; // 12% Annualized rate for calculation demo

export const calculateEarlyPaymentOffer = (invoice: Invoice): EarlyPaymentOffer => {
    if (invoice.status !== 'APPROVED' && invoice.status !== 'OPS_APPROVED' && invoice.status !== 'FINANCE_APPROVED') {
        return { available: false, daysEarly: 0, discountRate: 0, discountAmount: 0, netAmount: 0, offerExpires: '', apr: 0 };
    }

    // Parse/Validate Dates
    const due = new Date(invoice.dueDate || '');
    const today = new Date('2025-12-17'); // Using simulated 'today' matching context

    if (isNaN(due.getTime())) {
        return { available: false, daysEarly: 0, discountRate: 0, discountAmount: 0, netAmount: 0, offerExpires: '', apr: 0 };
    }

    // Calculate Days Early
    const diffTime = due.getTime() - today.getTime();
    const daysEarly = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysEarly < 5) {
        return { available: false, daysEarly, discountRate: 0, discountAmount: 0, netAmount: 0, offerExpires: '', apr: 0 };
    }

    // Dynamic Discounting Formula: (Days * (APR / 360))
    // Simplified: 2% / 30 * days? Or just standard 2% 10 Net 30 logic?
    // Let's use sliding scale.
    const discountRate = (daysEarly / 360) * APR;
    const discountAmount = invoice.amount * discountRate;

    return {
        available: true,
        daysEarly,
        discountRate,
        discountAmount,
        netAmount: invoice.amount - discountAmount,
        offerExpires: new Date(today.getTime() + 86400000 * 2).toISOString().split('T')[0], // Expires in 2 days
        apr: APR
    };
};
