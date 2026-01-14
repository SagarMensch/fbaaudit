/**
 * Enhanced Lane Master Service
 * 
 * Logistics Graph Theory implementation with:
 * - Virtual cluster management
 * - Multi-modal support (Road, Rail, Air, Coastal)
 * - Directionality (Head-haul vs Back-haul)
 * - Profitability analytics
 * - Market benchmarking
 * - Inheritance rules for new lanes
 */

import { TemporalDataService, TemporalEntity } from './temporalDataService';
import { getMDMDatabase } from './indexedDBService';

export type ModalType = 'ROAD' | 'RAIL' | 'AIR' | 'COASTAL' | 'MULTIMODAL';
export type ServiceLevel = 'STANDARD' | 'EXPRESS' | 'ECONOMY' | 'PREMIUM';
export type Directionality = 'HEAD_HAUL' | 'BACK_HAUL' | 'BIDIRECTIONAL';

export interface EnhancedLane extends TemporalEntity {
    // Identification
    laneCode: string;
    name: string;

    // Geographic (using cluster IDs instead of city names)
    originClusterId: string;
    destinationClusterId: string;
    routeWaypoints: string[]; // Intermediate mandatory stops

    // Operational
    standardTransitTime: number; // hours
    serviceLevel: ServiceLevel;
    allowedVehicleTypes: string[];
    modalType: ModalType;
    directionality: Directionality;

    // Financial
    contractualRate: number;
    marketBenchmarkRate?: number;
    costPerKm?: number;
    minimumCharge?: number;

    // Performance Metrics
    utilizationPercent: number; // Historical load factor
    profitabilityIndex: number; // (Revenue - Cost) / Revenue
    onTimePercent: number;
    averageLoadFactor: number;

    // Capacity
    dailyCapacity?: number; // trips per day
    weeklyVolume?: number; // tons per week

    // Status
    status: 'ACTIVE' | 'INACTIVE' | 'SEASONAL' | 'PENDING_APPROVAL';
    seasonalPeriods?: Array<{ start: string; end: string }>; // MM-DD format

    // Metadata
    tags: string[];
    customAttributes: Record<string, any>;
}

export interface LaneProfitabilityAnalysis {
    laneCode: string;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
    utilizationRate: number;
    recommendation: 'OPTIMIZE' | 'MAINTAIN' | 'REVIEW' | 'DISCONTINUE';
    reasons: string[];
}

export interface MarketBenchmark {
    laneCode: string;
    ourRate: number;
    marketAverage: number;
    marketMin: number;
    marketMax: number;
    competitivePosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
    variance: number;
    variancePercent: number;
}

export class EnhancedLaneService extends TemporalDataService<EnhancedLane> {
    private db: any = null;

    constructor() {
        super('LANE', 'lanes');
        this.initializeDB();
    }

    private async initializeDB() {
        this.db = await getMDMDatabase();
    }

    /**
     * Create lane with automatic inheritance from similar lanes
     */
    async createLane(
        laneData: Omit<EnhancedLane, keyof TemporalEntity>,
        userId: string = 'SYSTEM',
        inheritFromSimilar: boolean = true
    ): Promise<EnhancedLane> {
        let enrichedData = { ...laneData };

        // If no contractual rate provided, inherit from similar lanes
        if (inheritFromSimilar && !laneData.contractualRate) {
            const similarLane = await this.findSimilarLane(
                laneData.originClusterId,
                laneData.destinationClusterId,
                laneData.serviceLevel
            );

            if (similarLane) {
                enrichedData = {
                    ...enrichedData,
                    contractualRate: similarLane.contractualRate,
                    marketBenchmarkRate: similarLane.marketBenchmarkRate,
                    standardTransitTime: similarLane.standardTransitTime,
                    allowedVehicleTypes: similarLane.allowedVehicleTypes
                };
            }
        }

        // Initialize performance metrics if not provided
        if (!enrichedData.utilizationPercent) enrichedData.utilizationPercent = 0;
        if (!enrichedData.profitabilityIndex) enrichedData.profitabilityIndex = 0;
        if (!enrichedData.onTimePercent) enrichedData.onTimePercent = 100;
        if (!enrichedData.averageLoadFactor) enrichedData.averageLoadFactor = 0;

        return await this.createVersion(enrichedData, new Date(), userId, 'Lane created');
    }

    /**
     * Find similar lane for inheritance
     */
    async findSimilarLane(
        originClusterId: string,
        destinationClusterId: string,
        serviceLevel: ServiceLevel
    ): Promise<EnhancedLane | null> {
        const allLanes = await this.getAllActiveAt();

        // Exact match
        let similar = allLanes.find(l =>
            l.originClusterId === originClusterId &&
            l.destinationClusterId === destinationClusterId &&
            l.serviceLevel === serviceLevel
        );

        if (similar) return similar;

        // Same origin/destination, different service level
        similar = allLanes.find(l =>
            l.originClusterId === originClusterId &&
            l.destinationClusterId === destinationClusterId
        );

        if (similar) return similar;

        // Reverse direction
        similar = allLanes.find(l =>
            l.originClusterId === destinationClusterId &&
            l.destinationClusterId === originClusterId
        );

        return similar || null;
    }

    /**
     * Calculate profitability analysis for a lane
     */
    async calculateProfitability(
        laneId: string,
        actualCost: number,
        actualRevenue: number
    ): Promise<LaneProfitabilityAnalysis> {
        const lane = await this.getCurrentVersion(laneId);

        if (!lane) {
            throw new Error(`Lane ${laneId} not found`);
        }

        const profit = actualRevenue - actualCost;
        const profitMargin = (profit / actualRevenue) * 100;

        const reasons: string[] = [];
        let recommendation: 'OPTIMIZE' | 'MAINTAIN' | 'REVIEW' | 'DISCONTINUE' = 'MAINTAIN';

        // Determine recommendation
        if (profitMargin < 5) {
            recommendation = 'DISCONTINUE';
            reasons.push('Profit margin below 5% threshold');
        } else if (profitMargin < 10) {
            recommendation = 'REVIEW';
            reasons.push('Profit margin below target 10%');
        } else if (lane.utilizationPercent < 60) {
            recommendation = 'OPTIMIZE';
            reasons.push('Utilization below 60%');
        } else if (profitMargin >= 15 && lane.utilizationPercent >= 80) {
            recommendation = 'MAINTAIN';
            reasons.push('Healthy profit margin and utilization');
        }

        // Check market competitiveness
        if (lane.marketBenchmarkRate && lane.contractualRate > lane.marketBenchmarkRate * 1.1) {
            recommendation = 'REVIEW';
            reasons.push('Rate 10% above market benchmark');
        }

        return {
            laneCode: lane.laneCode,
            revenue: actualRevenue,
            cost: actualCost,
            profit,
            profitMargin,
            utilizationRate: lane.utilizationPercent,
            recommendation,
            reasons
        };
    }

    /**
     * Get market benchmark comparison
     */
    async getMarketBenchmark(laneId: string): Promise<MarketBenchmark> {
        const lane = await this.getCurrentVersion(laneId);

        if (!lane) {
            throw new Error(`Lane ${laneId} not found`);
        }

        // Get similar lanes for benchmarking
        const similarLanes = await this.getSimilarLanes(
            lane.originClusterId,
            lane.destinationClusterId,
            lane.serviceLevel
        );

        const rates = similarLanes
            .filter(l => l.contractualRate > 0)
            .map(l => l.contractualRate);

        const marketAverage = rates.length > 0
            ? rates.reduce((a, b) => a + b, 0) / rates.length
            : lane.contractualRate;

        const marketMin = rates.length > 0 ? Math.min(...rates) : lane.contractualRate;
        const marketMax = rates.length > 0 ? Math.max(...rates) : lane.contractualRate;

        const variance = lane.contractualRate - marketAverage;
        const variancePercent = (variance / marketAverage) * 100;

        let competitivePosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET' = 'AT_MARKET';
        if (variancePercent < -5) competitivePosition = 'BELOW_MARKET';
        else if (variancePercent > 5) competitivePosition = 'ABOVE_MARKET';

        return {
            laneCode: lane.laneCode,
            ourRate: lane.contractualRate,
            marketAverage,
            marketMin,
            marketMax,
            competitivePosition,
            variance,
            variancePercent
        };
    }

    /**
     * Get similar lanes for benchmarking
     */
    async getSimilarLanes(
        originClusterId: string,
        destinationClusterId: string,
        serviceLevel?: ServiceLevel
    ): Promise<EnhancedLane[]> {
        const allLanes = await this.getAllActiveAt();

        return allLanes.filter(l =>
            (l.originClusterId === originClusterId && l.destinationClusterId === destinationClusterId) ||
            (l.originClusterId === destinationClusterId && l.destinationClusterId === originClusterId)
        ).filter(l => !serviceLevel || l.serviceLevel === serviceLevel);
    }

    /**
     * Update lane performance metrics
     */
    async updatePerformanceMetrics(
        laneId: string,
        metrics: {
            utilizationPercent?: number;
            profitabilityIndex?: number;
            onTimePercent?: number;
            averageLoadFactor?: number;
        },
        userId: string = 'SYSTEM'
    ): Promise<EnhancedLane> {
        const lane = await this.getCurrentVersion(laneId);

        if (!lane) {
            throw new Error(`Lane ${laneId} not found`);
        }

        return await this.createVersion(
            {
                ...lane,
                ...metrics
            },
            new Date(),
            userId,
            'Performance metrics updated'
        );
    }

    /**
     * Get lanes by origin cluster
     */
    async getLanesByOrigin(originClusterId: string): Promise<EnhancedLane[]> {
        const allLanes = await this.getAllActiveAt();
        return allLanes.filter(l => l.originClusterId === originClusterId);
    }

    /**
     * Get lanes by destination cluster
     */
    async getLanesByDestination(destinationClusterId: string): Promise<EnhancedLane[]> {
        const allLanes = await this.getAllActiveAt();
        return allLanes.filter(l => l.destinationClusterId === destinationClusterId);
    }

    /**
     * Get lanes by service level
     */
    async getLanesByServiceLevel(serviceLevel: ServiceLevel): Promise<EnhancedLane[]> {
        const allLanes = await this.getAllActiveAt();
        return allLanes.filter(l => l.serviceLevel === serviceLevel);
    }

    /**
     * Get underperforming lanes
     */
    async getUnderperformingLanes(
        profitabilityThreshold: number = 10,
        utilizationThreshold: number = 60
    ): Promise<EnhancedLane[]> {
        const allLanes = await this.getAllActiveAt();

        return allLanes.filter(l =>
            l.profitabilityIndex < profitabilityThreshold ||
            l.utilizationPercent < utilizationThreshold
        );
    }

    /**
     * Get top performing lanes
     */
    async getTopPerformingLanes(limit: number = 10): Promise<EnhancedLane[]> {
        const allLanes = await this.getAllActiveAt();

        return allLanes
            .sort((a, b) => b.profitabilityIndex - a.profitabilityIndex)
            .slice(0, limit);
    }

    /**
     * Check if lane is seasonal and currently active
     */
    isSeasonallyActive(lane: EnhancedLane, date: Date = new Date()): boolean {
        if (lane.status !== 'SEASONAL' || !lane.seasonalPeriods) {
            return lane.status === 'ACTIVE';
        }

        const month = date.getMonth() + 1;
        const day = date.getDate();
        const currentDate = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        return lane.seasonalPeriods.some(period =>
            currentDate >= period.start && currentDate <= period.end
        );
    }
}

/**
 * Singleton instance
 */
let enhancedLaneServiceInstance: EnhancedLaneService | null = null;

export function getEnhancedLaneService(): EnhancedLaneService {
    if (!enhancedLaneServiceInstance) {
        enhancedLaneServiceInstance = new EnhancedLaneService();
    }
    return enhancedLaneServiceInstance;
}
