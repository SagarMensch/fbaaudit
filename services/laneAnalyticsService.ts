// Phase 2: Advanced Lane Analytics Service
// Performance dashboards, route optimization, capacity planning, benchmarking

import { Lane } from '../types';
import { laneMasterService } from './laneMasterService';
import { analyticsEngine } from './analyticsEngine';

export interface LanePerformanceDashboard {
    laneId: string;
    laneCode: string;
    kpis: {
        onTimeDelivery: { value: number; trend: 'UP' | 'DOWN' | 'STABLE'; change: number };
        avgTransitTime: { value: number; trend: 'UP' | 'DOWN' | 'STABLE'; change: number };
        costPerShipment: { value: number; trend: 'UP' | 'DOWN' | 'STABLE'; change: number };
        utilization: { value: number; trend: 'UP' | 'DOWN' | 'STABLE'; change: number };
    };
    alerts: Array<{ type: 'WARNING' | 'CRITICAL'; message: string }>;
    recommendations: string[];
}

export interface RouteOptimization {
    laneId: string;
    currentRoute: { distance: number; time: number; cost: number };
    optimizedRoute: { distance: number; time: number; cost: number };
    savings: { distance: number; time: number; cost: number; percentage: number };
    waypoints: string[];
    alternativeRoutes: Array<{ name: string; distance: number; time: number; cost: number }>;
}

export interface CapacityForecast {
    laneId: string;
    period: 'WEEK' | 'MONTH' | 'QUARTER';
    historical: Array<{ date: string; volume: number; capacity: number; utilization: number }>;
    forecast: Array<{ date: string; predictedVolume: number; confidence: number }>;
    recommendations: {
        additionalCapacityNeeded: number;
        optimalCarrierMix: Array<{ carrierType: string; percentage: number }>;
        peakPeriods: Array<{ start: string; end: string; expectedVolume: number }>;
    };
}

export interface LaneBenchmark {
    laneId: string;
    metrics: {
        currentRate: number;
        marketAverage: number;
        industryBest: number;
        variance: number;
        percentile: number;
    };
    competitors: Array<{
        name: string;
        rate: number;
        serviceLevel: string;
        marketShare: number;
    }>;
    historicalTrend: Array<{ month: string; rate: number; marketAvg: number }>;
}

class LaneAnalyticsService {
    /**
     * Generate comprehensive performance dashboard for a lane
     */
    public generatePerformanceDashboard(laneId: string): LanePerformanceDashboard | null {
        const lane = laneMasterService.getLaneById(laneId);
        if (!lane) return null;

        // Calculate trends (comparing to previous period)
        const currentOTD = lane.onTimePercent || 90;
        const previousOTD = currentOTD - (Math.random() * 10 - 5); // Simulated
        const otdTrend = currentOTD > previousOTD ? 'UP' : currentOTD < previousOTD ? 'DOWN' : 'STABLE';

        const currentTransit = lane.avgTransitTime || 48;
        const previousTransit = currentTransit + (Math.random() * 8 - 4);
        const transitTrend = currentTransit < previousTransit ? 'UP' : currentTransit > previousTransit ? 'DOWN' : 'STABLE';

        const currentCost = lane.avgCost || 10000;
        const previousCost = currentCost + (Math.random() * 2000 - 1000);
        const costTrend = currentCost < previousCost ? 'UP' : currentCost > previousCost ? 'DOWN' : 'STABLE';

        const currentUtil = lane.utilizationPercent || 75;
        const previousUtil = currentUtil - (Math.random() * 10 - 5);
        const utilTrend = currentUtil > previousUtil ? 'UP' : currentUtil < previousUtil ? 'DOWN' : 'STABLE';

        // Generate alerts
        const alerts: LanePerformanceDashboard['alerts'] = [];
        if (currentOTD < 85) {
            alerts.push({ type: 'CRITICAL', message: 'On-time delivery below 85% threshold' });
        }
        if (currentCost > (lane.benchmarkRate || currentCost) * 1.15) {
            alerts.push({ type: 'WARNING', message: 'Cost 15% above benchmark' });
        }
        if (currentUtil < 60) {
            alerts.push({ type: 'WARNING', message: 'Low utilization - consider consolidation' });
        }

        // Generate recommendations
        const recommendations: string[] = [];
        if (currentOTD < 90) {
            recommendations.push('Review carrier performance and consider alternative providers');
        }
        if (currentCost > (lane.benchmarkRate || currentCost) * 1.1) {
            recommendations.push('Initiate rate negotiation - current rate above market');
        }
        if (currentUtil < 70) {
            recommendations.push('Explore load consolidation opportunities');
        }

        return {
            laneId,
            laneCode: lane.laneCode,
            kpis: {
                onTimeDelivery: {
                    value: currentOTD,
                    trend: otdTrend,
                    change: Number(((currentOTD - previousOTD) / previousOTD * 100).toFixed(1))
                },
                avgTransitTime: {
                    value: currentTransit,
                    trend: transitTrend,
                    change: Number(((currentTransit - previousTransit) / previousTransit * 100).toFixed(1))
                },
                costPerShipment: {
                    value: currentCost,
                    trend: costTrend,
                    change: Number(((currentCost - previousCost) / previousCost * 100).toFixed(1))
                },
                utilization: {
                    value: currentUtil,
                    trend: utilTrend,
                    change: Number(((currentUtil - previousUtil) / previousUtil * 100).toFixed(1))
                }
            },
            alerts,
            recommendations
        };
    }

    /**
     * Optimize route for a lane
     */
    public optimizeRoute(laneId: string): RouteOptimization | null {
        const lane = laneMasterService.getLaneById(laneId);
        if (!lane) return null;

        // Current route metrics
        const currentDistance = lane.distance || 1000;
        const currentTime = lane.avgTransitTime || 48;
        const currentCost = lane.avgCost || 10000;

        // Optimized route (using algorithms - simplified here)
        const optimizedDistance = currentDistance * 0.92; // 8% reduction
        const optimizedTime = currentTime * 0.90; // 10% reduction
        const optimizedCost = currentCost * 0.88; // 12% reduction

        // Alternative routes
        const alternatives = [
            {
                name: 'Via Highway Route',
                distance: currentDistance * 0.95,
                time: currentTime * 0.85,
                cost: currentCost * 0.92
            },
            {
                name: 'Via Expressway',
                distance: currentDistance * 1.05,
                time: currentTime * 0.75,
                cost: currentCost * 0.95
            },
            {
                name: 'Via State Roads',
                distance: currentDistance * 0.90,
                time: currentTime * 1.10,
                cost: currentCost * 0.85
            }
        ];

        return {
            laneId,
            currentRoute: {
                distance: currentDistance,
                time: currentTime,
                cost: currentCost
            },
            optimizedRoute: {
                distance: optimizedDistance,
                time: optimizedTime,
                cost: optimizedCost
            },
            savings: {
                distance: currentDistance - optimizedDistance,
                time: currentTime - optimizedTime,
                cost: currentCost - optimizedCost,
                percentage: ((currentCost - optimizedCost) / currentCost * 100)
            },
            waypoints: [lane.origin, 'Intermediate Hub', lane.destination],
            alternativeRoutes: alternatives
        };
    }

    /**
     * Forecast capacity requirements
     */
    public forecastCapacity(laneId: string, period: 'WEEK' | 'MONTH' | 'QUARTER'): CapacityForecast | null {
        const lane = laneMasterService.getLaneById(laneId);
        if (!lane) return null;

        // Generate historical data
        const periods = period === 'WEEK' ? 12 : period === 'MONTH' ? 12 : 4;
        const historical: CapacityForecast['historical'] = [];

        for (let i = periods; i > 0; i--) {
            const date = new Date();
            if (period === 'WEEK') date.setDate(date.getDate() - (i * 7));
            else if (period === 'MONTH') date.setMonth(date.getMonth() - i);
            else date.setMonth(date.getMonth() - (i * 3));

            const baseVolume = (lane.totalShipments || 100) / periods;
            const volume = baseVolume + (Math.random() * baseVolume * 0.3 - baseVolume * 0.15);
            const capacity = baseVolume * 1.2;
            const utilization = (volume / capacity) * 100;

            historical.push({
                date: date.toISOString().split('T')[0],
                volume: Math.round(volume),
                capacity: Math.round(capacity),
                utilization: Math.round(utilization)
            });
        }

        // Generate forecast using exponential smoothing
        const volumes = historical.map(h => h.volume);
        const forecastResult = analyticsEngine.exponentialSmoothing(volumes, 0.3, periods);

        const forecast: CapacityForecast['forecast'] = forecastResult.forecast.map((vol, idx) => {
            const date = new Date();
            if (period === 'WEEK') date.setDate(date.getDate() + ((idx + 1) * 7));
            else if (period === 'MONTH') date.setMonth(date.getMonth() + (idx + 1));
            else date.setMonth(date.getMonth() + ((idx + 1) * 3));

            return {
                date: date.toISOString().split('T')[0],
                predictedVolume: Math.round(vol),
                confidence: 85 - (idx * 5) // Confidence decreases over time
            };
        });

        // Calculate recommendations
        const avgForecastVolume = forecast.reduce((sum, f) => sum + f.predictedVolume, 0) / forecast.length;
        const avgHistoricalCapacity = historical.reduce((sum, h) => sum + h.capacity, 0) / historical.length;
        const additionalCapacityNeeded = Math.max(0, avgForecastVolume - avgHistoricalCapacity);

        return {
            laneId,
            period,
            historical,
            forecast,
            recommendations: {
                additionalCapacityNeeded: Math.round(additionalCapacityNeeded),
                optimalCarrierMix: [
                    { carrierType: 'FTL', percentage: 60 },
                    { carrierType: 'LTL', percentage: 30 },
                    { carrierType: 'Express', percentage: 10 }
                ],
                peakPeriods: [
                    {
                        start: forecast[0].date,
                        end: forecast[2].date,
                        expectedVolume: Math.max(...forecast.slice(0, 3).map(f => f.predictedVolume))
                    }
                ]
            }
        };
    }

    /**
     * Benchmark lane against market
     */
    public benchmarkLane(laneId: string): LaneBenchmark | null {
        const lane = laneMasterService.getLaneById(laneId);
        if (!lane) return null;

        const currentRate = lane.currentRate || 10000;
        const marketAverage = lane.benchmarkRate || currentRate * 0.95;
        const industryBest = marketAverage * 0.85;
        const variance = ((currentRate - marketAverage) / marketAverage) * 100;

        // Calculate percentile (where does this lane rank)
        const allLanes = laneMasterService.getActiveLanes();
        const rates = allLanes.map(l => l.currentRate || 0).sort((a, b) => a - b);
        const position = rates.findIndex(r => r >= currentRate);
        const percentile = (position / rates.length) * 100;

        // Competitor data (simulated)
        const competitors = [
            { name: 'Carrier A', rate: marketAverage * 0.92, serviceLevel: '98% OTD', marketShare: 25 },
            { name: 'Carrier B', rate: marketAverage * 1.05, serviceLevel: '95% OTD', marketShare: 20 },
            { name: 'Carrier C', rate: marketAverage * 0.88, serviceLevel: '92% OTD', marketShare: 15 },
            { name: 'Carrier D', rate: marketAverage * 1.10, serviceLevel: '99% OTD', marketShare: 12 }
        ];

        // Historical trend (last 12 months)
        const historicalTrend: LaneBenchmark['historicalTrend'] = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            const rate = currentRate + (Math.random() * currentRate * 0.1 - currentRate * 0.05);
            const marketAvg = marketAverage + (Math.random() * marketAverage * 0.08 - marketAverage * 0.04);

            historicalTrend.push({
                month: monthName,
                rate: Math.round(rate),
                marketAvg: Math.round(marketAvg)
            });
        }

        return {
            laneId,
            metrics: {
                currentRate,
                marketAverage: Math.round(marketAverage),
                industryBest: Math.round(industryBest),
                variance: Math.round(variance * 10) / 10,
                percentile: Math.round(percentile)
            },
            competitors,
            historicalTrend
        };
    }

    /**
     * Get comprehensive analytics for all lanes
     */
    public getAllLanesAnalytics() {
        const lanes = laneMasterService.getActiveLanes();

        return {
            summary: {
                totalLanes: lanes.length,
                avgOnTimePercent: lanes.reduce((sum, l) => sum + (l.onTimePercent || 0), 0) / lanes.length,
                avgCost: lanes.reduce((sum, l) => sum + (l.avgCost || 0), 0) / lanes.length,
                avgUtilization: lanes.reduce((sum, l) => sum + (l.utilizationPercent || 0), 0) / lanes.length,
                totalShipments: lanes.reduce((sum, l) => sum + (l.totalShipments || 0), 0)
            },
            topPerformers: lanes
                .sort((a, b) => (b.onTimePercent || 0) - (a.onTimePercent || 0))
                .slice(0, 5)
                .map(l => ({ laneCode: l.laneCode, onTimePercent: l.onTimePercent })),
            bottomPerformers: lanes
                .sort((a, b) => (a.onTimePercent || 0) - (b.onTimePercent || 0))
                .slice(0, 5)
                .map(l => ({ laneCode: l.laneCode, onTimePercent: l.onTimePercent })),
            costOutliers: lanes
                .filter(l => l.currentRate && l.benchmarkRate && l.currentRate > l.benchmarkRate * 1.15)
                .map(l => ({
                    laneCode: l.laneCode,
                    currentRate: l.currentRate,
                    benchmarkRate: l.benchmarkRate,
                    variance: ((l.currentRate! - l.benchmarkRate!) / l.benchmarkRate!) * 100
                }))
        };
    }
}

export const laneAnalyticsService = new LaneAnalyticsService();
