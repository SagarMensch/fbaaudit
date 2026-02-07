
import { Invoice } from '../types';

export interface Claim {
    id: string;
    type: 'DAMAGE' | 'SHORTAGE' | 'LOSS' | 'DELAY';
    status: 'OPEN' | 'INVESTIGATING' | 'SETTLED' | 'REJECTED';
    amount: number;
    description: string;
    filedDate: string;
    evidence: string[]; // URLs to photos
}

export interface ClaimsStatus {
    hasActiveClaim: boolean;
    blockPayment: boolean; // True if claim amount > 0 and status is OPEN
    claims: Claim[];
}

const MOCK_CLAIMS: Record<string, Claim[]> = {
    // Demo: Invoice 003 has a damage claim
    'INV-2023-003': [
        {
            id: 'CLM-9901',
            type: 'DAMAGE',
            status: 'OPEN',
            amount: 4500.00,
            description: '3 Pallets water damaged due to hole in container roof.',
            filedDate: '2023-10-25',
            evidence: ['photo1.jpg']
        }
    ]
};

export const checkClaimsStatus = (invoice: Invoice): ClaimsStatus => {
    const claims = MOCK_CLAIMS[invoice.id] || [];

    // Logic: Block payment if there is an OPEN claim with significant value
    const activeClaims = claims.filter(c => c.status === 'OPEN' || c.status === 'INVESTIGATING');
    const hasActiveClaim = activeClaims.length > 0;

    return {
        hasActiveClaim,
        blockPayment: hasActiveClaim,
        claims
    };
};
