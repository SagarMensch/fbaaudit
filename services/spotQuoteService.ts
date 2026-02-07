
import { Invoice, LineItem } from '../types';

export interface SpotQuote {
    id: string;
    quoteNumber: string;
    carrier: string;
    amount: number;
    currency: string;
    validUntil: string;
    origin: string;
    destination: string;
    items: { description: string; price: number }[];
    sourceFile: string; // e.g., "quote_email_kuehne.pdf"
}

export interface SpotMatchResult {
    isMatch: boolean;
    score: number; // 0-100
    variance: number;
    quoteSource: string;
    details: string[];
}

// Mock Database of Spot Quotes (embedded in service for demo)
const MOCK_QUOTES: SpotQuote[] = [
    {
        id: 'SQ-2025-001',
        quoteNumber: 'SQ-KN-9921',
        carrier: 'Kuehne+Nagel',
        amount: 5150.00,
        currency: 'USD',
        validUntil: '2025-12-31',
        origin: 'Berlin, DE',
        destination: 'Chicago, IL',
        items: [
            { description: 'Ocean Rate 40HC', price: 4500.00 },
            { description: 'Peak Surchage', price: 650.00 }
        ],
        sourceFile: 'email_attachment_kn_urgent.msg'
    },
    {
        id: 'SQ-2025-002',
        quoteNumber: 'EXP-SPOT-55',
        carrier: 'Expeditors',
        amount: 12500.00,
        currency: 'USD',
        validUntil: '2025-11-30',
        origin: 'JFK Airport',
        destination: 'Raleigh Hub',
        items: [{ description: 'Urgent Charter', price: 12500.00 }],
        sourceFile: 'urgent_charter_quote.pdf'
    }
];

export const findSpotQuote = (reference: string): SpotQuote | undefined => {
    return MOCK_QUOTES.find(q => q.quoteNumber === reference || q.id === reference);
};

export const verifySpotMatch = (invoice: Invoice, quoteRef: string): SpotMatchResult => {
    const quote = findSpotQuote(quoteRef);
    if (!quote) {
        return { isMatch: false, score: 0, variance: invoice.amount, quoteSource: 'Not Found', details: ['Linked Spot Quote ID invalid.'] };
    }

    const variance = invoice.amount - quote.amount;
    const isMatch = Math.abs(variance) < 1.00; // Match exact for now

    // Detailed analysis
    const notes = [];
    if (isMatch) notes.push(`Perfect Match with Quote #${quote.quoteNumber}.`);
    else notes.push(`Variance detected: Billed ${invoice.amount} vs Quoted ${quote.amount}.`);

    // Check line items fuzzy match
    // (Simplified for demo)

    return {
        isMatch,
        score: isMatch ? 100 : 50,
        variance,
        quoteSource: quote.sourceFile,
        details: notes
    };
};
