// Enhanced Invoice Matching Service with Date & Period Validation
// Extends existing service with contract validity and date logic checks

import { IndianSupplier } from './supplierService';
import MasterDataService from './masterDataService';

export interface EnhancedDiscrepancy {
    type: 'rate_mismatch' | 'fuel_surcharge' | 'gst_calculation' | 'additional_charges' | 'pod_pending' | 'weight_dispute' | 'contract_expired' | 'invalid_date' | 'docket_mismatch';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expected: number | string;
    actual: number | string;
    impact: number;
}

export interface DateValidationResult {
    valid: boolean;
    errors: {
        type: 'contract_expired' | 'invalid_invoice_date' | 'invalid_docket_date' | 'date_logic_error';
        message: string;
    }[];
}

class EnhancedInvoiceMatchingService {

    /**
     * Validate invoice dates and contract validity
     */
    validateDates(
        invoiceDate: string,
        docketDate: string,
        contractId: string
    ): DateValidationResult {
        const errors: DateValidationResult['errors'] = [];
        const today = new Date().toISOString().split('T')[0];

        // 1. Check if invoice date is in the future
        if (invoiceDate > today) {
            errors.push({
                type: 'invalid_invoice_date',
                message: 'Invoice date cannot be in the future'
            });
        }

        // 2. Check if docket date is in the future
        if (docketDate > today) {
            errors.push({
                type: 'invalid_docket_date',
                message: 'Docket date cannot be in the future'
            });
        }

        // 3. Check date logic: invoice date should be >= docket date
        if (invoiceDate < docketDate) {
            errors.push({
                type: 'date_logic_error',
                message: 'Invoice date must be on or after docket date'
            });
        }

        // 4. Check contract validity
        const rates = MasterDataService.getRatesByContract(contractId);
        if (rates.length > 0) {
            const validRates = rates.filter(r =>
                docketDate >= r.validFrom &&
                docketDate <= r.validTo &&
                r.status === 'active'
            );

            if (validRates.length === 0) {
                errors.push({
                    type: 'contract_expired',
                    message: `No active contract rates found for docket date ${docketDate}`
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if contract is valid for given date
     */
    isContractValid(contractId: string, date: string): boolean {
        const rates = MasterDataService.getRatesByContract(contractId);
        return rates.some(r =>
            date >= r.validFrom &&
            date <= r.validTo &&
            r.status === 'active'
        );
    }

    /**
     * Get contract validity period
     */
    getContractValidity(contractId: string): { validFrom: string; validTo: string } | null {
        const rates = MasterDataService.getRatesByContract(contractId);
        if (rates.length === 0) return null;

        const validFromDates = rates.map(r => r.validFrom);
        const validToDates = rates.map(r => r.validTo);

        return {
            validFrom: validFromDates.sort()[0],
            validTo: validToDates.sort().reverse()[0]
        };
    }

    /**
     * Calculate days until contract expiry
     */
    getDaysUntilExpiry(contractId: string): number | null {
        const validity = this.getContractValidity(contractId);
        if (!validity) return null;

        const today = new Date();
        const expiryDate = new Date(validity.validTo);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * Get applicable fuel rate for date
     */
    getApplicableFuelRate(contractId: string, date: string): number | null {
        const fuelRate = MasterDataService.getApplicableFuelRate(contractId, date);
        return fuelRate ? fuelRate.fuelRate : null;
    }
}

export default new EnhancedInvoiceMatchingService();
