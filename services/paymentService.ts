/**
 * Payment Service - Frontend API Client
 * Connects to backend payment endpoints for batch management, reconciliation, etc.
 */

import {
    PaymentBatch,
    PaymentTransaction,
    BankReconciliation,
    EarlyPaymentDiscount,
    VendorPaymentSummary,
    PaymentMethod
} from '../types';

const API_BASE = 'http://localhost:5000/api';

// ============================================================================
// PAYMENT QUEUE
// ============================================================================

export async function getPaymentQueue(status: string = 'APPROVED'): Promise<{ invoices: any[]; count: number }> {
    const response = await fetch(`${API_BASE}/payments/queue?status=${status}`);
    return response.json();
}

// ============================================================================
// PAYMENT BATCHES
// ============================================================================

export async function getPaymentBatches(status?: string): Promise<{ batches: PaymentBatch[]; count: number }> {
    const url = status ? `${API_BASE}/payments/batches?status=${status}` : `${API_BASE}/payments/batches`;
    const response = await fetch(url);
    return response.json();
}

export async function createPaymentBatch(params: {
    invoiceIds: string[];
    paymentMethod?: PaymentMethod;
    scheduledDate?: string;
    createdBy?: string;
    notes?: string;
    applyEarlyDiscount?: boolean;
}): Promise<{
    success: boolean;
    batchId?: string;
    batchNumber?: string;
    totalAmount?: number;
    invoiceCount?: number;
    error?: string;
}> {
    const response = await fetch(`${API_BASE}/payments/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return response.json();
}

export async function getBatchDetail(batchId: string): Promise<PaymentBatch | null> {
    const response = await fetch(`${API_BASE}/payments/batches/${batchId}`);
    if (!response.ok) return null;
    return response.json();
}

export async function approveBatch(batchId: string, approverId: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/batches/${batchId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId })
    });
    return response.json();
}

export async function processBatch(batchId: string): Promise<{ success: boolean; bankReference?: string; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/batches/${batchId}/process`, {
        method: 'POST'
    });
    return response.json();
}

export async function markBatchPaid(batchId: string, bankReference: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/batches/${batchId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankReference })
    });
    return response.json();
}

// ============================================================================
// BANK RECONCILIATION
// ============================================================================

export async function importBankStatement(transactions: Array<{
    date: string;
    reference: string;
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
}>, statementId?: string): Promise<{ success: boolean; importedCount?: number; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/bank-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, statementId })
    });
    return response.json();
}

export async function getUnmatchedTransactions(): Promise<{ transactions: BankReconciliation[]; count: number }> {
    const response = await fetch(`${API_BASE}/payments/reconciliation`);
    return response.json();
}

export async function matchTransaction(reconId: string, batchId: string, matchedBy: string = 'manual'): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/reconciliation/${reconId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, matchedBy })
    });
    return response.json();
}

export async function autoReconcile(): Promise<{ success: boolean; matchedCount?: number; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/reconciliation/auto`, {
        method: 'POST'
    });
    return response.json();
}

// ============================================================================
// EARLY PAYMENT DISCOUNTS
// ============================================================================

export async function calculateEarlyDiscount(invoiceId: string): Promise<EarlyPaymentDiscount> {
    const response = await fetch(`${API_BASE}/payments/discount/${invoiceId}`);
    return response.json();
}

export async function setVendorDiscountTerms(params: {
    vendorId: string;
    vendorName?: string;
    discountPercent: number;
    daysEarly: number;
}): Promise<{ success: boolean; termId?: string; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/discount/terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return response.json();
}

// ============================================================================
// VENDOR PAYMENT PORTAL
// ============================================================================

export async function getVendorPayments(vendorId: string): Promise<{ payments: PaymentTransaction[]; count: number }> {
    const response = await fetch(`${API_BASE}/vendor/payments/${vendorId}`);
    return response.json();
}

export async function getVendorPaymentSummary(vendorId: string): Promise<VendorPaymentSummary> {
    const response = await fetch(`${API_BASE}/vendor/payments/${vendorId}/summary`);
    return response.json();
}

// ============================================================================
// MULTI-CURRENCY
// ============================================================================

export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<{ from: string; to: string; rate: number } | null> {
    const response = await fetch(`${API_BASE}/payments/exchange-rate?from=${fromCurrency}&to=${toCurrency}`);
    if (!response.ok) return null;
    return response.json();
}

export async function setExchangeRate(fromCurrency: string, toCurrency: string, rate: number): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_BASE}/payments/exchange-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromCurrency, to: toCurrency, rate })
    });
    return response.json();
}

// ============================================================================
// UTILITY: Parse CSV Bank Statement
// ============================================================================

export function parseBankStatementCSV(csvText: string): Array<{
    date: string;
    reference: string;
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
}> {
    const lines = csvText.trim().split('\n');
    const transactions = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 4) {
            const amount = parseFloat(cols[3]) || 0;
            transactions.push({
                date: cols[0] || new Date().toISOString().split('T')[0],
                reference: cols[1] || `TXN-${i}`,
                description: cols[2] || '',
                amount: Math.abs(amount),
                type: amount < 0 ? 'DEBIT' as const : 'CREDIT' as const
            });
        }
    }

    return transactions;
}
