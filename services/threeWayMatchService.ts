
import { Invoice } from '../types';

export interface MatchDocument {
    id: string;
    type: 'INVOICE' | 'SHIPMENT_ORDER' | 'POD';
    reference: string;
    date: string;
    amount?: number;
    quantity?: number;
    status: 'MATCHED' | 'MISMATCH' | 'MISSING';
    details?: string;
    url?: string;
}

export interface ThreeWayMatchResult {
    isMatch: boolean;
    score: number; // 0-100 confidence
    documents: MatchDocument[];
    discrepancies: string[];
}

// Mock Database of linked documents
// Indexed by Invoice ID for demo simplicity
const LINKED_DOCS: Record<string, { po: any, pod: any }> = {
    'INV-2023-001': { // Maersk - Perfect Match
        po: { id: 'PO-9001', ref: 'SO-MAERSK-88', date: '2023-10-01', amount: 12450.00, quantity: 1, type: 'SHIPMENT_ORDER' },
        pod: { id: 'POD-112', ref: 'DEL-223', date: '2023-10-20', quantity: 1, signedBy: 'Warehouse Mgr', type: 'POD' }
    },
    'INV-2023-003': { // MSC - Mismatch (POD missing items?)
        po: { id: 'PO-9005', ref: 'SO-MSC-99', date: '2023-10-05', amount: 8900.00, quantity: 5, type: 'SHIPMENT_ORDER' },
        pod: { id: 'POD-115', ref: 'DEL-229', date: '2023-10-25', quantity: 4, signedBy: 'Dock Worker', type: 'POD' } // Quantity mismatch
    }
};

export const performThreeWayMatch = (invoice: Invoice): ThreeWayMatchResult => {
    // Default mocks if not in DB
    const links = LINKED_DOCS[invoice.id] || {
        po: { id: `PO-${invoice.id.slice(4)}`, ref: `SO-GENERIC`, date: invoice.date, amount: invoice.amount, quantity: 1, type: 'SHIPMENT_ORDER' },
        pod: { id: `POD-${invoice.id.slice(4)}`, ref: `DEL-GENERIC`, date: invoice.date, quantity: 1, signedBy: 'Receiver', type: 'POD' }
    };

    const invoiceDoc: MatchDocument = {
        id: invoice.id,
        type: 'INVOICE',
        reference: invoice.invoiceNumber,
        date: invoice.date,
        amount: invoice.amount,
        status: 'MATCHED'
    };

    const poDoc: MatchDocument = {
        ...links.po,
        status: Math.abs(links.po.amount - invoice.amount) < 1.0 ? 'MATCHED' : 'MISMATCH',
        details: Math.abs(links.po.amount - invoice.amount) < 1.0 ? 'Amount matches PO' : `PO Amount $${links.po.amount} differs`
    };

    // POD Logic: Usually checks quantity. For Freight, checks delivery completion.
    // We simulate a quantity check or plain existence.
    const podDoc: MatchDocument = {
        ...links.pod,
        status: links.pod.quantity === (links.po.quantity || 1) ? 'MATCHED' : 'MISMATCH',
        details: links.pod.quantity === (links.po.quantity || 1) ? 'Goods Received in Full' : `Short Shipment: Received ${links.pod.quantity}/${links.po.quantity}`
    };

    const discrepancies: string[] = [];
    if (poDoc.status === 'MISMATCH') discrepancies.push(poDoc.details || 'PO Mismatch');
    if (podDoc.status === 'MISMATCH') discrepancies.push(podDoc.details || 'POD Mismatch');

    return {
        isMatch: discrepancies.length === 0,
        score: discrepancies.length === 0 ? 100 : 50,
        documents: [invoiceDoc, poDoc, podDoc],
        discrepancies
    };
};
