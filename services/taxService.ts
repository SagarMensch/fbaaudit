import { TaxBreakdown, VendorTaxProfile, Invoice } from '../types';

export const validateTaxCompliance = (invoice: Invoice) => {
    // Legacy support or new logic
    return { isValid: true, issues: [] };
};

// MOCK PROFILES for the Test Cases
const VENDOR_DB: VendorTaxProfile[] = [
    {
        id: 'V-SHARMA',
        name: 'Sharma Roadlines',
        gstin: '27ABCDE1234F1Z5',
        stateCode: '27', // Maharashtra
        constitution: 'Proprietorship',
        isGta: true,
        isRcmOpted: true, // Scenario 1: Unregistered/RCM
        defaultGstRate: 5
    },
    {
        id: 'V-TCI',
        name: 'TCI Express Ltd',
        gstin: '07AAACR5555K1Z2',
        stateCode: '07', // Delhi
        constitution: 'Company',
        isGta: true,
        isRcmOpted: false, // Scenario 2: FCM
        defaultGstRate: 12
    },
    {
        id: 'V-SPECIAL',
        name: 'Special Logistics Pvt Ltd',
        gstin: '27AAACS8888J1Z9',
        stateCode: '27', // Maharashtra
        constitution: 'Company',
        isGta: true,
        isRcmOpted: false,
        defaultGstRate: 12,
        lowerDeductionCert: {
            rate: 0.25, // Scenario 3: Lower Deduction
            validTo: '2026-03-31'
        }
    }
];

// CLIENT PROFILE (Atlas Mfg, Mumbai)
const CLIENT_STATE_CODE = '27'; // Maharashtra

class TaxService {

    getVendorByName(name: string): VendorTaxProfile | undefined {
        return VENDOR_DB.find(v => v.name === name);
    }

    calculateTax(amount: number, vendorName: string): TaxBreakdown {
        const vendor = this.getVendorByName(vendorName);

        // Default Logic if vendor unknown (Safe Fallback)
        if (!vendor) {
            return this.getDefaultBreakdown(amount);
        }

        const breakdown: TaxBreakdown = {
            taxableAmount: amount,
            gstRate: vendor.defaultGstRate,
            cgst: 0,
            sgst: 0,
            igst: 0,
            isRcm: false,
            gstPayableToVendor: 0,
            gstPayableToGovt: 0,
            tdsRate: 0,
            tdsAmount: 0,
            sectionCode: '194C',
            netPayableToVendor: 0
        };

        // --- 1. GST LOGIC ---
        const isInterstate = vendor.stateCode !== CLIENT_STATE_CODE;

        if (vendor.isGta && vendor.isRcmOpted) {
            // RCM CASE (Sharma)
            breakdown.isRcm = true;
            breakdown.gstRate = 5; // RCM is usually 5%
            breakdown.gstPayableToVendor = 0;
            breakdown.gstPayableToGovt = amount * 0.05;
        } else {
            // FCM CASE (TCI)
            breakdown.isRcm = false;
            breakdown.gstRate = vendor.defaultGstRate;
            const taxAmt = amount * (vendor.defaultGstRate / 100);
            breakdown.gstPayableToVendor = taxAmt;
            breakdown.gstPayableToGovt = 0;
        }

        // Split Components
        const totalTaxLiability = breakdown.gstPayableToVendor + breakdown.gstPayableToGovt;
        if (isInterstate) {
            breakdown.igst = totalTaxLiability;
        } else {
            breakdown.cgst = totalTaxLiability / 2;
            breakdown.sgst = totalTaxLiability / 2;
        }

        // --- 2. TDS LOGIC ---
        // Base for TDS is usually the TAXABLE AMOUNT (Freight), avoiding TDS on GST component if charged separately
        // Note: For FCM, invoice total includes GST, but TDS should typically be on base. 
        // We will assume 'amount' passed here is BASE freight.

        let tdsRate = 2.0; // Default Company

        if (vendor.lowerDeductionCert && new Date(vendor.lowerDeductionCert.validTo) > new Date()) {
            tdsRate = vendor.lowerDeductionCert.rate;
        } else {
            if (vendor.constitution === 'Proprietorship' || vendor.constitution === 'Partnership') {
                tdsRate = 1.0;
            }
        }

        breakdown.tdsRate = tdsRate;
        breakdown.tdsAmount = amount * (tdsRate / 100);

        // --- 3. NET PAYABLE ---
        // Formula: (Base + GST_Vendor) - TDS
        // Note: We don't deduct TDS from GST, we deduct it from the total payment.
        // But logic is: You pay Vendor (Base + GST_Vendor), but hold back TDS.

        const grossToVendor = amount + breakdown.gstPayableToVendor;
        breakdown.netPayableToVendor = grossToVendor - breakdown.tdsAmount;

        return breakdown;
    }

    private getDefaultBreakdown(amount: number): TaxBreakdown {
        return {
            taxableAmount: amount,
            gstRate: 0, cgst: 0, sgst: 0, igst: 0, isRcm: false,
            gstPayableToVendor: 0, gstPayableToGovt: 0,
            tdsRate: 0, tdsAmount: 0, sectionCode: '194C',
            netPayableToVendor: amount
        };
    }
}

export const taxService = new TaxService();
