// Invoice Matching Service for Indian Logistics
// Validates supplier invoices against contracts and rates

import { IndianSupplier, IndianRateLine } from './supplierService';

export interface InvoiceLineItem {
    description: string;
    origin: string;
    destination: string;
    weight: number;
    unit: 'kg' | 'ton';
    rate: number;
    amount: number;
}

export interface SupplierInvoice {
    id: string;
    supplierId: string;
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    lrNumber: string;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    fuelSurcharge: number;
    fuelSurchargePercent: number;
    gst: number;
    gstPercent: number;
    totalAmount: number;
    podStatus: 'pending' | 'uploaded' | 'verified';
    podUploadDate?: string;
    status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
    submittedDate: string;
    reviewedDate?: string;
    reviewedBy?: string;
    comments?: string;
    dispute?: any; // Linked Dispute Ticket
}

export interface MatchingResult {
    matched: boolean;
    discrepancies: Discrepancy[];
    expectedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercent: number;
    recommendation: 'approve' | 'review' | 'reject';
}

export interface Discrepancy {
    type: 'rate_mismatch' | 'fuel_surcharge' | 'gst_calculation' | 'additional_charges' | 'pod_pending' | 'weight_dispute';
    severity: 'low' | 'medium' | 'high';
    description: string;
    expected: number | string;
    actual: number | string;
    impact: number; // Amount difference
}

export class InvoiceMatchingService {

    /**
     * Match invoice against supplier contract and rates
     */
    static matchInvoice(invoice: SupplierInvoice, supplier: IndianSupplier): MatchingResult {
        const discrepancies: Discrepancy[] = [];
        let expectedTotal = 0;

        // 1. Match each line item against contract rates
        invoice.lineItems.forEach(item => {
            const contractRate = this.findContractRate(
                supplier.rates,
                item.origin,
                item.destination,
                item.weight
            );

            if (!contractRate) {
                discrepancies.push({
                    type: 'rate_mismatch',
                    severity: 'high',
                    description: `No contract rate found for ${item.origin} → ${item.destination}`,
                    expected: 'Contract rate',
                    actual: `₹${item.rate}/kg`,
                    impact: item.amount
                });
            } else {
                // Check if rate matches
                if (Math.abs(item.rate - contractRate.baseRate) > 0.01) {
                    const expectedAmount = item.weight * contractRate.baseRate;
                    discrepancies.push({
                        type: 'rate_mismatch',
                        severity: 'high',
                        description: `Rate mismatch for ${item.origin} → ${item.destination}`,
                        expected: `₹${contractRate.baseRate}/kg`,
                        actual: `₹${item.rate}/kg`,
                        impact: item.amount - expectedAmount
                    });
                }
                expectedTotal += item.weight * contractRate.baseRate;
            }
        });

        // 2. Validate fuel surcharge
        const expectedFuelSurcharge = expectedTotal * (15 / 100); // Standard 15%
        if (Math.abs(invoice.fuelSurcharge - expectedFuelSurcharge) > 10) {
            discrepancies.push({
                type: 'fuel_surcharge',
                severity: 'medium',
                description: 'Fuel surcharge variance detected',
                expected: `₹${expectedFuelSurcharge.toFixed(2)} (15%)`,
                actual: `₹${invoice.fuelSurcharge} (${invoice.fuelSurchargePercent}%)`,
                impact: invoice.fuelSurcharge - expectedFuelSurcharge
            });
        }

        // 3. Validate GST (18% on freight)
        const taxableAmount = expectedTotal + expectedFuelSurcharge;
        const expectedGST = taxableAmount * 0.18;
        if (Math.abs(invoice.gst - expectedGST) > 10) {
            discrepancies.push({
                type: 'gst_calculation',
                severity: 'medium',
                description: 'GST calculation variance',
                expected: `₹${expectedGST.toFixed(2)} (18%)`,
                actual: `₹${invoice.gst} (${invoice.gstPercent}%)`,
                impact: invoice.gst - expectedGST
            });
        }

        // 4. Check POD status
        if (invoice.podStatus === 'pending') {
            discrepancies.push({
                type: 'pod_pending',
                severity: 'high',
                description: 'POD not uploaded - payment on hold',
                expected: 'POD uploaded',
                actual: 'Pending',
                impact: 0
            });
        }

        // Calculate expected total
        const calculatedExpectedTotal = expectedTotal + expectedFuelSurcharge + expectedGST;
        const variance = invoice.totalAmount - calculatedExpectedTotal;
        const variancePercent = (variance / calculatedExpectedTotal) * 100;

        // Determine recommendation
        let recommendation: 'approve' | 'review' | 'reject' = 'approve';
        if (discrepancies.some(d => d.severity === 'high')) {
            recommendation = 'reject';
        } else if (discrepancies.length > 0 || Math.abs(variancePercent) > 2) {
            recommendation = 'review';
        }

        return {
            matched: discrepancies.length === 0,
            discrepancies,
            expectedAmount: calculatedExpectedTotal,
            actualAmount: invoice.totalAmount,
            variance,
            variancePercent,
            recommendation
        };
    }

    /**
     * Find matching contract rate for a route
     */
    private static findContractRate(
        rates: IndianRateLine[],
        origin: string,
        destination: string,
        weight: number
    ): IndianRateLine | null {
        // Find exact route match
        const matchingRates = rates.filter(r =>
            r.origin.toLowerCase() === origin.toLowerCase() &&
            r.destination.toLowerCase() === destination.toLowerCase()
        );

        if (matchingRates.length === 0) return null;

        // If weight slabs exist, find matching slab
        const rateWithSlab = matchingRates.find(r => {
            if (!r.weightSlab) return true;

            // Parse weight slab (e.g., "100-500 kg")
            const match = r.weightSlab.match(/(\d+)-(\d+)/);
            if (match) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                return weight >= min && weight <= max;
            }
            return true;
        });

        return rateWithSlab || matchingRates[0];
    }

    /**
     * Calculate expected invoice amount
     */
    static calculateExpectedAmount(
        lineItems: InvoiceLineItem[],
        supplier: IndianSupplier
    ): number {
        let subtotal = 0;

        lineItems.forEach(item => {
            const contractRate = this.findContractRate(
                supplier.rates,
                item.origin,
                item.destination,
                item.weight
            );

            if (contractRate) {
                subtotal += item.weight * contractRate.baseRate;
            }
        });

        const fuelSurcharge = subtotal * 0.15; // 15%
        const gst = (subtotal + fuelSurcharge) * 0.18; // 18%

        return subtotal + fuelSurcharge + gst;
    }

    /**
     * Generate matching report summary
     */
    static generateMatchingReport(result: MatchingResult): string {
        let report = `Invoice Matching Report\n`;
        report += `========================\n\n`;
        report += `Status: ${result.matched ? '✅ MATCHED' : '⚠️ DISCREPANCIES FOUND'}\n`;
        report += `Expected Amount: ₹${result.expectedAmount.toLocaleString()}\n`;
        report += `Actual Amount: ₹${result.actualAmount.toLocaleString()}\n`;
        report += `Variance: ₹${result.variance.toLocaleString()} (${result.variancePercent.toFixed(2)}%)\n`;
        report += `Recommendation: ${result.recommendation.toUpperCase()}\n\n`;

        if (result.discrepancies.length > 0) {
            report += `Discrepancies:\n`;
            result.discrepancies.forEach((d, i) => {
                report += `\n${i + 1}. ${d.description}\n`;
                report += `   Severity: ${d.severity.toUpperCase()}\n`;
                report += `   Expected: ${d.expected}\n`;
                report += `   Actual: ${d.actual}\n`;
                report += `   Impact: ₹${d.impact.toLocaleString()}\n`;
            });
        }

        return report;
    }
}

export default InvoiceMatchingService;
