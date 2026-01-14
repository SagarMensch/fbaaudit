/**
 * Enhanced Vehicle Master Service
 * 
 * Volumetric & Carbon Intelligence with:
 * - Dimensional logic and capacity calculations
 * - Body type taxonomy
 * - Compliance and emission tracking
 * - Dynamic substitution engine
 * - Carbon footprint calculation
 */

import { TemporalDataService, TemporalEntity } from './temporalDataService';
import { getMDMDatabase } from './indexedDBService';

export type BodyType =
    | 'OPEN'
    | 'CONTAINER_20FT'
    | 'CONTAINER_32FT'
    | 'CONTAINER_40FT'
    | 'REFRIGERATED_SINGLE'
    | 'REFRIGERATED_MULTI'
    | 'FLATBED'
    | 'SIDE_CURTAIN'
    | 'TANKER';

export type EmissionNorm = 'BS_IV' | 'BS_VI' | 'EURO_6' | 'NONE';
export type FuelType = 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';

export interface EnhancedVehicle extends TemporalEntity {
    // Identification
    code: string;
    description: string;

    // Dimensional Specifications
    internalLength: number; // meters
    internalWidth: number; // meters
    internalHeight: number; // meters
    volumetricCapacity: number; // cubic meters (calculated)
    payloadCapacity: number; // metric tons
    palletPositions: number; // standard pallet count

    // Body Type
    bodyType: BodyType;

    // Compliance & Emissions
    emissionNorm: EmissionNorm;
    fuelType: FuelType;
    carbonFootprint: number; // gCO2/km
    insuranceExpiry?: Date;
    fitnessExpiry?: Date;

    // Operational
    applicableFor: string[]; // e.g., ['FTL', 'LTL', 'EXPRESS']
    minimumLoadWeight?: number; // tons
    maximumLoadWeight?: number; // tons

    // Cost
    operatingCostPerKm?: number;
    dailyRentalCost?: number;

    // Status
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';

    // Metadata
    tags: string[];
    customAttributes: Record<string, any>;
}

export interface SubstitutionResult {
    allowed: boolean;
    orderedVehicle: EnhancedVehicle;
    deliveredVehicle: EnhancedVehicle;
    rateToApply: number;
    reason: string;
}

export interface CarbonFootprintAnalysis {
    vehicleCode: string;
    distance: number; // km
    totalEmissions: number; // kg CO2
    emissionsPerTon: number; // kg CO2 per ton
    greenScore: number; // 0-100
    recommendation: string;
}

export class EnhancedVehicleService extends TemporalDataService<EnhancedVehicle> {
    private db: any = null;

    constructor() {
        super('VEHICLE', 'vehicles');
        this.initializeDB();
    }

    private async initializeDB() {
        this.db = await getMDMDatabase();
    }

    /**
     * Create vehicle with automatic volumetric calculation
     */
    async createVehicle(
        vehicleData: Omit<EnhancedVehicle, keyof TemporalEntity | 'volumetricCapacity'>,
        userId: string = 'SYSTEM'
    ): Promise<EnhancedVehicle> {
        // Calculate volumetric capacity
        const volumetricCapacity = this.calculateVolumetricCapacity(
            vehicleData.internalLength,
            vehicleData.internalWidth,
            vehicleData.internalHeight
        );

        // Calculate carbon footprint if not provided
        let carbonFootprint = vehicleData.carbonFootprint;
        if (!carbonFootprint) {
            carbonFootprint = this.estimateCarbonFootprint(
                vehicleData.fuelType,
                vehicleData.emissionNorm,
                vehicleData.payloadCapacity
            );
        }

        return await this.createVersion(
            {
                ...vehicleData,
                volumetricCapacity,
                carbonFootprint
            },
            new Date(),
            userId,
            'Vehicle created'
        );
    }

    /**
     * Calculate volumetric capacity
     */
    private calculateVolumetricCapacity(
        length: number,
        width: number,
        height: number
    ): number {
        return length * width * height;
    }

    /**
     * Estimate carbon footprint based on vehicle specifications
     */
    private estimateCarbonFootprint(
        fuelType: FuelType,
        emissionNorm: EmissionNorm,
        payloadCapacity: number
    ): number {
        // Base emissions (gCO2/km)
        const baseEmissions: Record<FuelType, number> = {
            'DIESEL': 800,
            'CNG': 600,
            'ELECTRIC': 0,
            'HYBRID': 400
        };

        // Emission norm multipliers
        const normMultipliers: Record<EmissionNorm, number> = {
            'BS_IV': 1.2,
            'BS_VI': 1.0,
            'EURO_6': 0.9,
            'NONE': 1.5
        };

        // Payload factor (larger vehicles emit more)
        const payloadFactor = 1 + (payloadCapacity / 20);

        return baseEmissions[fuelType] * normMultipliers[emissionNorm] * payloadFactor;
    }

    /**
     * Dynamic substitution logic
     * Determines rate when a different vehicle is delivered than ordered
     */
    async calculateSubstitutionRate(
        orderedVehicleId: string,
        deliveredVehicleId: string,
        orderedRate: number,
        deliveredRate: number
    ): Promise<SubstitutionResult> {
        const ordered = await this.getCurrentVersion(orderedVehicleId);
        const delivered = await this.getCurrentVersion(deliveredVehicleId);

        if (!ordered || !delivered) {
            throw new Error('Vehicle not found');
        }

        // Fairness rule: If delivered vehicle has higher capacity, charge lower rate
        const isUpgrade = delivered.payloadCapacity > ordered.payloadCapacity;

        let rateToApply: number;
        let reason: string;
        let allowed = true;

        if (isUpgrade) {
            rateToApply = Math.min(orderedRate, deliveredRate);
            reason = 'Vendor upgraded vehicle - applying lower rate per fairness rules';
        } else {
            // Downgrade - charge ordered rate but flag for review
            rateToApply = orderedRate;
            reason = 'Vendor downgraded vehicle - charging ordered rate, flagged for review';
            allowed = false; // Requires manual approval
        }

        return {
            allowed,
            orderedVehicle: ordered,
            deliveredVehicle: delivered,
            rateToApply,
            reason
        };
    }

    /**
     * Calculate carbon footprint for a shipment
     */
    async calculateCarbonFootprint(
        vehicleId: string,
        distance: number,
        weight: number
    ): Promise<CarbonFootprintAnalysis> {
        const vehicle = await this.getCurrentVersion(vehicleId);

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        // Total emissions in kg CO2
        const totalEmissions = (vehicle.carbonFootprint * distance) / 1000;

        // Emissions per ton
        const emissionsPerTon = weight > 0 ? totalEmissions / weight : totalEmissions;

        // Green score (0-100, lower emissions = higher score)
        const maxEmissions = 1000; // gCO2/km for worst case
        const greenScore = Math.max(0, Math.min(100,
            100 - (vehicle.carbonFootprint / maxEmissions * 100)
        ));

        // Recommendation
        let recommendation = '';
        if (greenScore >= 80) {
            recommendation = 'Excellent green choice - continue using this vehicle type';
        } else if (greenScore >= 60) {
            recommendation = 'Good environmental performance - consider for green logistics';
        } else if (greenScore >= 40) {
            recommendation = 'Moderate emissions - explore cleaner alternatives when possible';
        } else {
            recommendation = 'High emissions - prioritize transition to BS-VI or CNG/Electric vehicles';
        }

        return {
            vehicleCode: vehicle.code,
            distance,
            totalEmissions,
            emissionsPerTon,
            greenScore,
            recommendation
        };
    }

    /**
     * Get vehicles by body type
     */
    async getVehiclesByBodyType(bodyType: BodyType): Promise<EnhancedVehicle[]> {
        const allVehicles = await this.getAllActiveAt();
        return allVehicles.filter(v => v.bodyType === bodyType);
    }

    /**
     * Get vehicles by emission norm
     */
    async getVehiclesByEmissionNorm(emissionNorm: EmissionNorm): Promise<EnhancedVehicle[]> {
        const allVehicles = await this.getAllActiveAt();
        return allVehicles.filter(v => v.emissionNorm === emissionNorm);
    }

    /**
     * Get vehicles by fuel type
     */
    async getVehiclesByFuelType(fuelType: FuelType): Promise<EnhancedVehicle[]> {
        const allVehicles = await this.getAllActiveAt();
        return allVehicles.filter(v => v.fuelType === fuelType);
    }

    /**
     * Get vehicles with expiring compliance
     */
    async getVehiclesWithExpiringCompliance(daysThreshold: number = 30): Promise<EnhancedVehicle[]> {
        const allVehicles = await this.getAllActiveAt();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

        return allVehicles.filter(v =>
            (v.insuranceExpiry && v.insuranceExpiry <= thresholdDate) ||
            (v.fitnessExpiry && v.fitnessExpiry <= thresholdDate)
        );
    }

    /**
     * Get green vehicles (low carbon footprint)
     */
    async getGreenVehicles(maxCarbonFootprint: number = 500): Promise<EnhancedVehicle[]> {
        const allVehicles = await this.getAllActiveAt();
        return allVehicles.filter(v => v.carbonFootprint <= maxCarbonFootprint);
    }

    /**
     * Calculate pallet efficiency
     */
    calculatePalletEfficiency(vehicle: EnhancedVehicle): {
        palletPositions: number;
        volumePerPallet: number;
        efficiency: number;
    } {
        const standardPalletVolume = 1.2 * 1.0 * 0.15; // Standard pallet: 1.2m x 1.0m x 0.15m
        const volumePerPallet = vehicle.volumetricCapacity / vehicle.palletPositions;
        const efficiency = (standardPalletVolume / volumePerPallet) * 100;

        return {
            palletPositions: vehicle.palletPositions,
            volumePerPallet,
            efficiency
        };
    }
}

/**
 * Singleton instance
 */
let enhancedVehicleServiceInstance: EnhancedVehicleService | null = null;

export function getEnhancedVehicleService(): EnhancedVehicleService {
    if (!enhancedVehicleServiceInstance) {
        enhancedVehicleServiceInstance = new EnhancedVehicleService();
    }
    return enhancedVehicleServiceInstance;
}
