/**
 * Enhanced Accessorial Master Service
 * 
 * Conditional Logic Vault with:
 * - Algorithmic validation engine
 * - GPS timestamp verification
 * - Document proof requirements
 * - Fraud detection
 * - Stacking rules enforcement
 * - Multi-method calculation engine
 */

import { TemporalDataService, TemporalEntity } from './temporalDataService';
import { getMDMDatabase } from './indexedDBService';

export type AccessorialCategory = 'EVENT' | 'RESOURCE' | 'FINANCIAL';
export type CalculationMethod = 'FLAT' | 'PERCENT_FREIGHT' | 'PER_KM' | 'PER_HOUR' | 'PER_UNIT';

export interface EnhancedAccessorial extends TemporalEntity {
    // Identification
    code: string;
    description: string;

    // Categorization
    category: AccessorialCategory;
    subCategory: string; // e.g., 'Detention', 'Multi-point delivery', 'Tolls'

    // Calculation
    calculationMethod: CalculationMethod;
    amount: number;
    currency: string;

    // Validation Requirements
    requiresGPSProof: boolean;
    requiresDocumentProof: boolean;
    requiresApproval: boolean;
    approvalThreshold?: number; // Amount above which approval is required

    // Stacking Rules
    mutuallyExclusiveWith: string[]; // Accessorial codes that cannot be charged together
    mandatoryCombinationWith: string[]; // Accessorial codes that must be charged together

    // Grace Periods (for time-based charges like detention)
    gracePeriodMinutes?: number;

    // Status
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';

    // Metadata
    tags: string[];
    customAttributes: Record<string, any>;
}

export interface AccessorialValidationRequest {
    accessorialCode: string;
    amount: number;
    quantity?: number;
    gpsInTime?: Date;
    gpsOutTime?: Date;
    lrStampTime?: Date;
    documentProof?: string[]; // Document IDs or URLs
    otherAccessorials?: string[]; // Other accessorials being charged
}

export interface AccessorialValidationResult {
    valid: boolean;
    approved: boolean;
    calculatedAmount: number;
    errors: string[];
    warnings: string[];
    requiresManualReview: boolean;
    fraudScore: number; // 0-100, higher = more suspicious
}

export interface AccessorialCalculationRequest {
    accessorialCode: string;
    freightRate?: number;
    distance?: number;
    duration?: number;
    quantity?: number;
    additionalParams?: Record<string, number>;
}

export class EnhancedAccessorialService extends TemporalDataService<EnhancedAccessorial> {
    private db: any = null;

    constructor() {
        super('ACCESSORIAL', 'accessorials');
        this.initializeDB();
    }

    private async initializeDB() {
        this.db = await getMDMDatabase();
    }

    /**
     * Validate accessorial charge with comprehensive checks
     */
    async validateAccessorial(
        request: AccessorialValidationRequest
    ): Promise<AccessorialValidationResult> {
        const accessorial = await this.getByCode(request.accessorialCode);

        if (!accessorial) {
            return {
                valid: false,
                approved: false,
                calculatedAmount: 0,
                errors: ['Accessorial code not found'],
                warnings: [],
                requiresManualReview: false,
                fraudScore: 0
            };
        }

        const errors: string[] = [];
        const warnings: string[] = [];
        let fraudScore = 0;
        let requiresManualReview = false;

        // GPS Proof Validation
        if (accessorial.requiresGPSProof) {
            if (!request.gpsInTime || !request.gpsOutTime) {
                errors.push('GPS timestamps required but not provided');
                fraudScore += 30;
            } else {
                // Validate GPS timestamps against LR stamp time
                if (request.lrStampTime) {
                    const gpsVariance = this.calculateTimeVariance(
                        request.gpsInTime,
                        request.gpsOutTime,
                        request.lrStampTime
                    );

                    if (gpsVariance > 30) { // More than 30 minutes variance
                        warnings.push(`GPS time variance of ${gpsVariance} minutes detected`);
                        requiresManualReview = true;
                        fraudScore += 20;
                    }
                }

                // Check for unrealistic durations (e.g., detention > 48 hours)
                const durationHours = (request.gpsOutTime.getTime() - request.gpsInTime.getTime()) / (1000 * 60 * 60);
                if (durationHours > 48) {
                    warnings.push(`Unusually long duration: ${durationHours.toFixed(1)} hours`);
                    requiresManualReview = true;
                    fraudScore += 15;
                }
            }
        }

        // Document Proof Validation
        if (accessorial.requiresDocumentProof) {
            if (!request.documentProof || request.documentProof.length === 0) {
                errors.push('Document proof required but not provided');
                fraudScore += 25;
            }
        }

        // Stacking Rules Validation
        if (request.otherAccessorials && request.otherAccessorials.length > 0) {
            // Check mutual exclusivity
            const conflicts = request.otherAccessorials.filter(code =>
                accessorial.mutuallyExclusiveWith.includes(code)
            );

            if (conflicts.length > 0) {
                errors.push(`Cannot charge ${accessorial.code} with ${conflicts.join(', ')}`);
            }

            // Check mandatory combinations
            const missing = accessorial.mandatoryCombinationWith.filter(code =>
                !request.otherAccessorials.includes(code)
            );

            if (missing.length > 0) {
                errors.push(`${accessorial.code} requires ${missing.join(', ')} to be charged`);
            }
        }

        // Amount Validation
        const calculatedAmount = await this.calculateAccessorial({
            accessorialCode: request.accessorialCode,
            quantity: request.quantity,
            duration: request.gpsInTime && request.gpsOutTime
                ? (request.gpsOutTime.getTime() - request.gpsInTime.getTime()) / (1000 * 60 * 60)
                : undefined
        });

        if (Math.abs(request.amount - calculatedAmount.amount) > calculatedAmount.amount * 0.1) {
            warnings.push(`Claimed amount (${request.amount}) differs from calculated amount (${calculatedAmount.amount}) by more than 10%`);
            requiresManualReview = true;
            fraudScore += 20;
        }

        // Approval Threshold Check
        let approved = true;
        if (accessorial.requiresApproval ||
            (accessorial.approvalThreshold && request.amount > accessorial.approvalThreshold)) {
            approved = false;
            requiresManualReview = true;
        }

        return {
            valid: errors.length === 0,
            approved,
            calculatedAmount: calculatedAmount.amount,
            errors,
            warnings,
            requiresManualReview,
            fraudScore
        };
    }

    /**
     * Calculate accessorial amount based on method
     */
    async calculateAccessorial(
        request: AccessorialCalculationRequest
    ): Promise<{ amount: number; breakdown: string }> {
        const accessorial = await this.getByCode(request.accessorialCode);

        if (!accessorial) {
            throw new Error('Accessorial code not found');
        }

        let amount = 0;
        let breakdown = '';

        switch (accessorial.calculationMethod) {
            case 'FLAT':
                amount = accessorial.amount;
                breakdown = `Flat charge: ${accessorial.currency} ${amount}`;
                break;

            case 'PERCENT_FREIGHT':
                if (!request.freightRate) {
                    throw new Error('Freight rate required for percentage calculation');
                }
                amount = (accessorial.amount / 100) * request.freightRate;
                breakdown = `${accessorial.amount}% of freight (${request.freightRate}) = ${amount}`;
                break;

            case 'PER_KM':
                if (!request.distance) {
                    throw new Error('Distance required for per-km calculation');
                }
                amount = accessorial.amount * request.distance;
                breakdown = `${accessorial.amount} per km × ${request.distance} km = ${amount}`;
                break;

            case 'PER_HOUR':
                if (!request.duration) {
                    throw new Error('Duration required for per-hour calculation');
                }
                // Apply grace period if applicable
                let chargeableHours = request.duration;
                if (accessorial.gracePeriodMinutes) {
                    const gracePeriodHours = accessorial.gracePeriodMinutes / 60;
                    chargeableHours = Math.max(0, request.duration - gracePeriodHours);
                }
                amount = accessorial.amount * chargeableHours;
                breakdown = `${accessorial.amount} per hour × ${chargeableHours.toFixed(2)} hours = ${amount}`;
                break;

            case 'PER_UNIT':
                if (!request.quantity) {
                    throw new Error('Quantity required for per-unit calculation');
                }
                amount = accessorial.amount * request.quantity;
                breakdown = `${accessorial.amount} per unit × ${request.quantity} units = ${amount}`;
                break;

            default:
                throw new Error(`Unknown calculation method: ${accessorial.calculationMethod}`);
        }

        return { amount, breakdown };
    }

    /**
     * Get accessorial by code
     */
    async getByCode(code: string): Promise<EnhancedAccessorial | null> {
        const allAccessorials = await this.getAllActiveAt();
        return allAccessorials.find(a => a.code === code) || null;
    }

    /**
     * Get accessorials by category
     */
    async getByCategory(category: AccessorialCategory): Promise<EnhancedAccessorial[]> {
        const allAccessorials = await this.getAllActiveAt();
        return allAccessorials.filter(a => a.category === category);
    }

    /**
     * Get accessorials requiring approval
     */
    async getRequiringApproval(): Promise<EnhancedAccessorial[]> {
        const allAccessorials = await this.getAllActiveAt();
        return allAccessorials.filter(a => a.requiresApproval);
    }

    /**
     * Detect potential fraud patterns
     */
    async detectFraudPatterns(
        accessorialCode: string,
        recentClaims: Array<{ amount: number; timestamp: Date }>
    ): Promise<{
        suspicious: boolean;
        reasons: string[];
        riskScore: number;
    }> {
        const reasons: string[] = [];
        let riskScore = 0;

        // Check for unusual frequency
        const last24Hours = recentClaims.filter(claim =>
            (Date.now() - claim.timestamp.getTime()) < 24 * 60 * 60 * 1000
        );

        if (last24Hours.length > 10) {
            reasons.push(`Unusually high frequency: ${last24Hours.length} claims in 24 hours`);
            riskScore += 30;
        }

        // Check for amount consistency
        if (recentClaims.length >= 5) {
            const amounts = recentClaims.map(c => c.amount);
            const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(
                amounts.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / amounts.length
            );

            // If all amounts are exactly the same (stdDev = 0), it's suspicious
            if (stdDev === 0) {
                reasons.push('All claim amounts are identical - possible template fraud');
                riskScore += 40;
            }
        }

        // Check for round numbers (often indicates estimation rather than actual measurement)
        const roundNumbers = recentClaims.filter(c => c.amount % 100 === 0);
        if (roundNumbers.length / recentClaims.length > 0.8) {
            reasons.push('Majority of claims are round numbers');
            riskScore += 15;
        }

        return {
            suspicious: riskScore >= 50,
            reasons,
            riskScore
        };
    }

    // Helper methods

    private calculateTimeVariance(
        gpsInTime: Date,
        gpsOutTime: Date,
        lrStampTime: Date
    ): number {
        const gpsInVariance = Math.abs(gpsInTime.getTime() - lrStampTime.getTime()) / (1000 * 60);
        const gpsOutVariance = Math.abs(gpsOutTime.getTime() - lrStampTime.getTime()) / (1000 * 60);
        return Math.min(gpsInVariance, gpsOutVariance);
    }
}

/**
 * Singleton instance
 */
let enhancedAccessorialServiceInstance: EnhancedAccessorialService | null = null;

export function getEnhancedAccessorialService(): EnhancedAccessorialService {
    if (!enhancedAccessorialServiceInstance) {
        enhancedAccessorialServiceInstance = new EnhancedAccessorialService();
    }
    return enhancedAccessorialServiceInstance;
}

/**
 * Initialize default accessorials
 */
export async function initializeDefaultAccessorials(service: EnhancedAccessorialService): Promise<void> {
    // Detention
    await service.createVersion({
        id: 'ACC_DETENTION',
        code: 'DETENTION',
        description: 'Detention Charges',
        category: 'EVENT',
        subCategory: 'Waiting Time',
        calculationMethod: 'PER_HOUR',
        amount: 500,
        currency: 'INR',
        requiresGPSProof: true,
        requiresDocumentProof: false,
        requiresApproval: false,
        approvalThreshold: 5000,
        mutuallyExclusiveWith: [],
        mandatoryCombinationWith: [],
        gracePeriodMinutes: 120,
        status: 'ACTIVE',
        tags: ['time-based'],
        customAttributes: {},
        createdBy: 'SYSTEM',
        modifiedBy: 'SYSTEM'
    }, new Date(), 'SYSTEM', 'Default accessorial');

    // Multi-point delivery
    await service.createVersion({
        id: 'ACC_MULTIPOINT',
        code: 'MULTIPOINT',
        description: 'Multi-point Delivery',
        category: 'EVENT',
        subCategory: 'Additional Stops',
        calculationMethod: 'PER_UNIT',
        amount: 1000,
        currency: 'INR',
        requiresGPSProof: true,
        requiresDocumentProof: true,
        requiresApproval: false,
        mutuallyExclusiveWith: [],
        mandatoryCombinationWith: [],
        status: 'ACTIVE',
        tags: ['delivery'],
        customAttributes: {},
        createdBy: 'SYSTEM',
        modifiedBy: 'SYSTEM'
    }, new Date(), 'SYSTEM', 'Default accessorial');

    console.log('Default accessorials initialized');
}
