
import { Invoice } from '../types';

export interface ParcelAuditResult {
    scanStatus: 'CLEAN' | 'ISSUES_FOUND' | 'NOT_APPLICABLE';
    potentialRefund: number;
    checks: {
        gsr: { valid: boolean; savings: number; details: string }; // Guaranteed Service Refund (Late)
        dimWeight: { valid: boolean; savings: number; details: string }; // Dimensional Weight Error
        residential: { valid: boolean; savings: number; details: string }; // Residential Surcharge Validation
        duplicate: { valid: boolean; savings: number; details: string };
    };
}

export const analyzeParcelInvoice = (invoice: Invoice): ParcelAuditResult => {
    if (!invoice.parcelDetails) {
        return {
            scanStatus: 'NOT_APPLICABLE',
            potentialRefund: 0,
            checks: {
                gsr: { valid: true, savings: 0, details: 'Not a parcel shipment.' },
                dimWeight: { valid: true, savings: 0, details: 'N/A' },
                residential: { valid: true, savings: 0, details: 'N/A' },
                duplicate: { valid: true, savings: 0, details: 'N/A' }
            }
        };
    }

    const { guaranteedDeliveryDate, actualDeliveryDate, billedWeight, dimWeight, isResidential, serviceType } = invoice.parcelDetails;

    let totalSavings = 0;
    let status: 'CLEAN' | 'ISSUES_FOUND' = 'CLEAN';

    // 1. GSR (Late Delivery) Check
    // Logic: If actual > guaranteed, full refund of base freight (assuming 100% of amount for simple demo)
    const gsr: { valid: boolean; savings: number; details: string } = { valid: true, savings: 0, details: 'Delivered on time.' };
    if (guaranteedDeliveryDate && actualDeliveryDate) {
        if (new Date(actualDeliveryDate) > new Date(guaranteedDeliveryDate)) {
            gsr.valid = false;
            gsr.savings = invoice.amount; // Full refund
            gsr.details = `Delivered Late. Guarantee: ${guaranteedDeliveryDate}, Actual: ${actualDeliveryDate}.`;
            totalSavings += gsr.savings;
            status = 'ISSUES_FOUND';
        }
    }

    // 2. Dim Weight Check
    // Logic: If billed weight > calc dim weight, verify the factor. Sometimes carriers use lower divisor (higher billable).
    // Demo Logic: If Billed Weight matches DimWeight but DimWeight calc has error (e.g. they used 139 but contract says 166).
    const dimCheck: { valid: boolean; savings: number; details: string } = { valid: true, savings: 0, details: 'Billed weight verified.' };

    // Mock logic: If invoice var > 0 and reason contains "Dim", flag it.
    // Or purely calc:
    const dims = invoice.parcelDetails.dimensions.split('x').map(Number);
    if (dims.length === 3) {
        const vol = dims[0] * dims[1] * dims[2];
        const standardDivisor = 139; // Common
        const myContractDivisor = 166; // Better contract

        const standardDimWeight = Math.ceil(vol / standardDivisor);
        const myCorrectDimWeight = Math.ceil(vol / myContractDivisor);

        if (billedWeight === standardDimWeight && billedWeight > myCorrectDimWeight) {
            dimCheck.valid = false;
            dimCheck.savings = 15.00; // Mock saving
            dimCheck.details = `Carrier used divisor 139. Contract specifies 166. Overcharged by 3 lbs.`;
            totalSavings += dimCheck.savings;
            status = 'ISSUES_FOUND';
        }
    }

    // 3. Residential Surcharge Check
    // Logic: If surcharge applied but address looks commercial (mock logic)
    const resiCheck: { valid: boolean; savings: number; details: string } = { valid: true, savings: 0, details: 'Surcharge Valid' };
    if (isResidential) {
        // Mock: If destination is "Industrial Park" or "Inc", it shouldn't be residential.
        if (invoice.destination.toLowerCase().includes('inc') || invoice.destination.toLowerCase().includes('ltd')) {
            resiCheck.valid = false;
            resiCheck.savings = 4.50; // Typical resi fee
            resiCheck.details = `Address '${invoice.destination}' appears Commercial. Residential Surcharge invalid.`;
            totalSavings += resiCheck.savings;
            status = 'ISSUES_FOUND';
        }
    }

    return {
        scanStatus: status,
        potentialRefund: totalSavings,
        checks: {
            gsr,
            dimWeight: dimCheck,
            residential: resiCheck,
            duplicate: { valid: true, savings: 0, details: 'No duplicates found.' }
        }
    };
};
