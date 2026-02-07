import { Lane, LaneApprovalRequest, LanePerformanceMetrics, LaneOptimizationSuggestion, LaneRateHistory } from '../types';
import { contractService } from './contractService';

// Generate seed lanes from existing contracts
function generateSeedLanes(): Lane[] {
    const contracts = contractService.getAll();
    const lanes: Lane[] = [];
    let laneCounter = 1;

    contracts.forEach(contract => {
        contract.freightMatrix.forEach(rate => {
            const laneCode = `${rate.origin.substring(0, 3).toUpperCase()}-${rate.destination.substring(0, 3).toUpperCase()}-${String(laneCounter).padStart(3, '0')}`;

            lanes.push({
                id: `LANE-${Date.now()}-${laneCounter}`,
                laneCode,
                origin: rate.origin,
                destination: rate.destination,
                distance: 0, // Will be calculated
                status: 'ACTIVE',
                approvedBy: 'System',
                approvedDate: contract.validFrom,
                totalShipments: Math.floor(Math.random() * 500) + 50,
                avgTransitTime: rate.transitTimeHrs,
                onTimePercent: Math.floor(Math.random() * 20) + 80,
                avgCost: rate.baseRate * 1000,
                benchmarkRate: rate.baseRate * 1000,
                currentRate: rate.baseRate * 1000,
                lowestRate: rate.baseRate * 900,
                highestRate: rate.baseRate * 1100,
                rateHistory: [
                    {
                        id: `RH-${laneCounter}-1`,
                        effectiveDate: contract.validFrom,
                        rate: rate.baseRate * 1000,
                        contractId: contract.id,
                        vendorName: contract.vendorName,
                        changeReason: 'Initial contract rate'
                    }
                ],
                aiOptimizationScore: Math.floor(Math.random() * 40) + 60,
                utilizationPercent: Math.floor(Math.random() * 40) + 60,
                contractIds: [contract.id],
                vendorIds: [contract.vendorId],
                createdDate: contract.validFrom,
                lastModified: new Date().toISOString()
            });

            laneCounter++;
        });
    });

    return lanes;
}

class LaneMasterService {
    private LANES_KEY = 'lanes_master_v1';
    private REQUESTS_KEY = 'lane_approval_requests_v1';
    private SUGGESTIONS_KEY = 'lane_optimization_suggestions_v1';

    private lanes: Lane[] = [];
    private requests: LaneApprovalRequest[] = [];
    private suggestions: LaneOptimizationSuggestion[] = [];

    constructor() {
        this.load();
    }

    private load() {
        // Load lanes
        const storedLanes = localStorage.getItem(this.LANES_KEY);
        if (storedLanes) {
            this.lanes = JSON.parse(storedLanes);
        } else {
            this.lanes = generateSeedLanes();
            this.save();
        }

        // Load approval requests
        const storedRequests = localStorage.getItem(this.REQUESTS_KEY);
        if (storedRequests) {
            this.requests = JSON.parse(storedRequests);
        }

        // Load optimization suggestions
        const storedSuggestions = localStorage.getItem(this.SUGGESTIONS_KEY);
        if (storedSuggestions) {
            this.suggestions = JSON.parse(storedSuggestions);
        }
    }

    private save() {
        localStorage.setItem(this.LANES_KEY, JSON.stringify(this.lanes));
        localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(this.requests));
        localStorage.setItem(this.SUGGESTIONS_KEY, JSON.stringify(this.suggestions));
    }

    // --- LANE MANAGEMENT ---

    getAllLanes(): Lane[] {
        return this.lanes.filter(l => l.status !== 'INACTIVE');
    }

    getActiveLanes(): Lane[] {
        return this.lanes.filter(l => l.status === 'ACTIVE');
    }

    getLaneById(id: string): Lane | undefined {
        return this.lanes.find(l => l.id === id);
    }

    getLaneByCode(code: string): Lane | undefined {
        return this.lanes.find(l => l.laneCode === code);
    }

    findLane(origin: string, destination: string): Lane | undefined {
        return this.lanes.find(
            l =>
                l.origin.toLowerCase() === origin.toLowerCase() &&
                l.destination.toLowerCase() === destination.toLowerCase() &&
                l.status === 'ACTIVE'
        );
    }

    getLanesByOrigin(origin: string): Lane[] {
        return this.lanes.filter(
            l => l.origin.toLowerCase() === origin.toLowerCase() && l.status === 'ACTIVE'
        );
    }

    getLanesByDestination(destination: string): Lane[] {
        return this.lanes.filter(
            l => l.destination.toLowerCase() === destination.toLowerCase() && l.status === 'ACTIVE'
        );
    }

    createLane(lane: Omit<Lane, 'id' | 'laneCode' | 'createdDate'>): Lane {
        const laneCount = this.lanes.length + 1;
        const laneCode = `${lane.origin.substring(0, 3).toUpperCase()}-${lane.destination.substring(0, 3).toUpperCase()}-${String(laneCount).padStart(3, '0')}`;

        const newLane: Lane = {
            ...lane,
            id: `LANE-${Date.now()}`,
            laneCode,
            createdDate: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        this.lanes.push(newLane);
        this.save();
        return newLane;
    }

    updateLane(id: string, updates: Partial<Lane>): Lane | null {
        const index = this.lanes.findIndex(l => l.id === id);
        if (index === -1) return null;

        this.lanes[index] = {
            ...this.lanes[index],
            ...updates,
            lastModified: new Date().toISOString()
        };
        this.save();
        return this.lanes[index];
    }

    deactivateLane(id: string): boolean {
        return this.updateLane(id, { status: 'INACTIVE' }) !== null;
    }

    // --- LANE APPROVAL REQUESTS ---

    getAllRequests(): LaneApprovalRequest[] {
        return this.requests;
    }

    getPendingRequests(): LaneApprovalRequest[] {
        return this.requests.filter(r => r.status === 'PENDING');
    }

    getRequestById(id: string): LaneApprovalRequest | undefined {
        return this.requests.find(r => r.id === id);
    }

    createRequest(request: Omit<LaneApprovalRequest, 'id' | 'requestDate' | 'status'>): LaneApprovalRequest {
        const newRequest: LaneApprovalRequest = {
            ...request,
            id: `LAR-${Date.now()}`,
            requestDate: new Date().toISOString(),
            status: 'PENDING'
        };

        this.requests.push(newRequest);
        this.save();
        return newRequest;
    }

    approveRequest(
        requestId: string,
        approvedBy: string,
        comments?: string
    ): { success: boolean; lane?: Lane; message: string } {
        const request = this.getRequestById(requestId);
        if (!request) {
            return { success: false, message: 'Request not found' };
        }

        if (request.status !== 'PENDING') {
            return { success: false, message: 'Request already processed' };
        }

        // Update request status
        const requestIndex = this.requests.findIndex(r => r.id === requestId);
        this.requests[requestIndex] = {
            ...request,
            status: 'APPROVED',
            approvedBy,
            approvedDate: new Date().toISOString()
        };

        // Create or update lane based on request type
        let lane: Lane | null = null;

        if (request.requestType === 'NEW_LANE') {
            // Create new lane
            lane = this.createLane({
                origin: request.origin,
                destination: request.destination,
                distance: 0, // Will be calculated
                status: 'ACTIVE',
                requestedBy: request.requestedBy,
                requestedDate: request.requestDate,
                approvedBy,
                approvedDate: new Date().toISOString(),
                benchmarkRate: request.benchmarkComparison?.marketAvg,
                currentRate: request.proposedRate,
                rateHistory: request.proposedRate
                    ? [
                        {
                            id: `RH-${Date.now()}`,
                            effectiveDate: new Date().toISOString(),
                            rate: request.proposedRate,
                            contractId: 'PENDING',
                            vendorName: 'TBD',
                            changeReason: 'New lane approval',
                            approvedBy
                        }
                    ]
                    : undefined
            });
        } else if (request.requestType === 'RATE_CHANGE' && request.laneId) {
            // Update existing lane rate
            const existingLane = this.getLaneById(request.laneId);
            if (existingLane && request.proposedRate) {
                const newHistory: LaneRateHistory = {
                    id: `RH-${Date.now()}`,
                    effectiveDate: new Date().toISOString(),
                    rate: request.proposedRate,
                    contractId: 'PENDING',
                    vendorName: 'TBD',
                    changePercent: request.currentRate
                        ? ((request.proposedRate - request.currentRate) / request.currentRate) * 100
                        : 0,
                    changeReason: request.justification,
                    approvedBy
                };

                lane = this.updateLane(request.laneId, {
                    currentRate: request.proposedRate,
                    rateHistory: [...(existingLane.rateHistory || []), newHistory]
                });
            }
        } else if (request.requestType === 'REACTIVATION' && request.laneId) {
            lane = this.updateLane(request.laneId, {
                status: 'ACTIVE',
                approvedBy,
                approvedDate: new Date().toISOString()
            });
        }

        this.save();

        return {
            success: true,
            lane: lane || undefined,
            message: `Request ${requestId} approved successfully`
        };
    }

    rejectRequest(requestId: string, rejectionReason: string): boolean {
        const index = this.requests.findIndex(r => r.id === requestId);
        if (index === -1) return false;

        this.requests[index] = {
            ...this.requests[index],
            status: 'REJECTED',
            rejectionReason
        };
        this.save();
        return true;
    }

    // --- PERFORMANCE METRICS ---

    calculatePerformanceMetrics(
        laneId: string,
        period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
    ): LanePerformanceMetrics | null {
        const lane = this.getLaneById(laneId);
        if (!lane) return null;

        // For demo, generate realistic metrics
        const baseShipments = lane.totalShipments || 100;
        const periodMultiplier = { WEEK: 0.25, MONTH: 1, QUARTER: 3, YEAR: 12 }[period];
        const totalShipments = Math.floor(baseShipments * periodMultiplier);

        const onTimeDeliveries = Math.floor(totalShipments * ((lane.onTimePercent || 90) / 100));
        const delayedShipments = totalShipments - onTimeDeliveries;

        return {
            laneId,
            period,
            totalShipments,
            totalWeight: totalShipments * 5, // Assume 5 tons average
            totalCost: totalShipments * (lane.avgCost || 10000),
            avgTransitTime: lane.avgTransitTime || 48,
            onTimeDeliveries,
            onTimePercent: (onTimeDeliveries / totalShipments) * 100,
            delayedShipments,
            avgDelay: delayedShipments > 0 ? Math.floor(Math.random() * 12) + 4 : 0,
            damageIncidents: Math.floor(totalShipments * 0.005),
            damagePercent: 0.5,
            claimsCount: Math.floor(totalShipments * 0.01),
            claimsValue: Math.floor(totalShipments * 0.01) * 5000,
            avgCostPerShipment: lane.avgCost || 10000,
            avgCostPerKg: ((lane.avgCost || 10000) / 5000),
            costTrend: 'STABLE',
            costVariance: Math.floor(Math.random() * 20) - 10,
            primaryVendor: lane.vendorIds?.[0],
            vendorScore: Math.floor(Math.random() * 20) + 80
        };
    }

    // --- AI OPTIMIZATION ENGINE ---

    generateOptimizationSuggestions(): LaneOptimizationSuggestion[] {
        const newSuggestions: LaneOptimizationSuggestion[] = [];

        // Suggestion 1: Lane Consolidation
        const delhiMumbaiLanes = this.lanes.filter(
            l =>
                (l.origin === 'Delhi' && l.destination === 'Mumbai') ||
                (l.origin === 'Mumbai' && l.destination === 'Delhi')
        );

        if (delhiMumbaiLanes.length > 1) {
            newSuggestions.push({
                id: `OPT-${Date.now()}-1`,
                type: 'CONSOLIDATION',
                priority: 'HIGH',
                affectedLanes: delhiMumbaiLanes.map(l => l.id),
                title: 'Consolidate Delhi-Mumbai Lanes',
                description: 'Multiple vendors servicing Delhi-Mumbai route. Consolidation opportunity identified.',
                rationale: `Currently using ${delhiMumbaiLanes.length} vendors for Delhi-Mumbai lane. Consolidating to top 2 performers can reduce administrative overhead and improve negotiation leverage.`,
                estimatedSavings: 450000,
                savingsPercent: 12,
                implementationCost: 50000,
                roi: 9,
                paybackPeriod: 2,
                actionItems: [
                    'Analyze vendor performance for Delhi-Mumbai lane',
                    'Negotiate volume discounts with top 2 vendors',
                    'Phase out underperforming vendors',
                    'Update contract terms for consolidated volume'
                ],
                estimatedEffort: 'MEDIUM',
                riskLevel: 'LOW',
                aiConfidence: 92,
                basedOn: ['Historical shipment data', 'Vendor performance scores', 'Rate benchmarking'],
                generatedDate: new Date().toISOString(),
                status: 'PENDING_REVIEW'
            });
        }

        // Suggestion 2: Rate Negotiation
        const highCostLanes = this.lanes.filter(
            l => l.currentRate && l.benchmarkRate && l.currentRate > l.benchmarkRate * 1.15
        );

        if (highCostLanes.length > 0) {
            const lane = highCostLanes[0];
            const variance = lane.currentRate && lane.benchmarkRate
                ? ((lane.currentRate - lane.benchmarkRate) / lane.benchmarkRate) * 100
                : 0;

            newSuggestions.push({
                id: `OPT-${Date.now()}-2`,
                type: 'RATE_NEGOTIATION',
                priority: 'HIGH',
                affectedLanes: [lane.id],
                title: `Renegotiate ${lane.origin}-${lane.destination} Rate`,
                description: `Current rate is ${variance.toFixed(1)}% above market benchmark`,
                rationale: `Lane ${lane.laneCode} is priced significantly above market. Historical data shows stable volume, providing strong negotiation position.`,
                estimatedSavings: 280000,
                savingsPercent: 15,
                implementationCost: 10000,
                roi: 28,
                paybackPeriod: 1,
                actionItems: [
                    'Gather competitive quotes from 3 vendors',
                    'Prepare volume commitment proposal',
                    'Schedule negotiation meeting',
                    'Update contract with new rates'
                ],
                estimatedEffort: 'LOW',
                riskLevel: 'LOW',
                aiConfidence: 88,
                basedOn: ['Market rate benchmarking', 'Volume analysis', 'Vendor capacity data'],
                generatedDate: new Date().toISOString(),
                status: 'PENDING_REVIEW'
            });
        }

        // Suggestion 3: Mode Shift
        const shortDistanceLanes = this.lanes.filter(l => l.distance > 0 && l.distance < 500);
        if (shortDistanceLanes.length > 5) {
            newSuggestions.push({
                id: `OPT-${Date.now()}-3`,
                type: 'MODE_SHIFT',
                priority: 'MEDIUM',
                affectedLanes: shortDistanceLanes.slice(0, 5).map(l => l.id),
                title: 'Shift Short-Distance Lanes to LTL',
                description: 'Multiple short-distance lanes suitable for LTL consolidation',
                rationale: 'Lanes under 500 km with low utilization can be shifted to LTL service for cost savings without significant transit time impact.',
                estimatedSavings: 320000,
                savingsPercent: 18,
                implementationCost: 75000,
                roi: 4.3,
                paybackPeriod: 3,
                actionItems: [
                    'Identify LTL service providers',
                    'Pilot LTL service on 2-3 lanes',
                    'Monitor transit time and cost',
                    'Scale to remaining lanes if successful'
                ],
                estimatedEffort: 'HIGH',
                riskLevel: 'MEDIUM',
                aiConfidence: 78,
                basedOn: ['Distance analysis', 'Utilization patterns', 'LTL market rates'],
                generatedDate: new Date().toISOString(),
                status: 'PENDING_REVIEW'
            });
        }

        this.suggestions.push(...newSuggestions);
        this.save();
        return newSuggestions;
    }

    getAllSuggestions(): LaneOptimizationSuggestion[] {
        return this.suggestions;
    }

    getPendingSuggestions(): LaneOptimizationSuggestion[] {
        return this.suggestions.filter(s => s.status === 'PENDING_REVIEW');
    }

    updateSuggestionStatus(
        id: string,
        status: LaneOptimizationSuggestion['status']
    ): boolean {
        const index = this.suggestions.findIndex(s => s.id === id);
        if (index === -1) return false;

        this.suggestions[index].status = status;
        this.save();
        return true;
    }

    // --- BENCHMARKING ---

    benchmarkLane(laneId: string): {
        lane: Lane;
        marketAvg: number;
        variance: number;
        competitorRates: { vendor: string; rate: number; source: string }[];
    } | null {
        const lane = this.getLaneById(laneId);
        if (!lane || !lane.currentRate) return null;

        // Find similar lanes
        const similarLanes = this.lanes.filter(
            l =>
                l.id !== laneId &&
                l.origin === lane.origin &&
                l.destination === lane.destination &&
                l.currentRate
        );

        const rates = similarLanes.map(l => l.currentRate!);
        const marketAvg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : lane.benchmarkRate || lane.currentRate;
        const variance = ((lane.currentRate - marketAvg) / marketAvg) * 100;

        const competitorRates = similarLanes.map(l => ({
            vendor: l.vendorIds?.[0] || 'Unknown',
            rate: l.currentRate!,
            source: 'Internal data'
        }));

        return {
            lane,
            marketAvg: Math.round(marketAvg),
            variance: Math.round(variance * 10) / 10,
            competitorRates
        };
    }

    // --- STATISTICS ---

    getStatistics() {
        const activeLanes = this.getActiveLanes();

        return {
            totalLanes: this.lanes.length,
            activeLanes: activeLanes.length,
            pendingApproval: this.lanes.filter(l => l.status === 'PENDING_APPROVAL').length,
            totalRequests: this.requests.length,
            pendingRequests: this.getPendingRequests().length,
            approvedRequests: this.requests.filter(r => r.status === 'APPROVED').length,
            rejectedRequests: this.requests.filter(r => r.status === 'REJECTED').length,
            totalSuggestions: this.suggestions.length,
            pendingSuggestions: this.getPendingSuggestions().length,
            avgOnTimePercent: activeLanes.length > 0
                ? Math.round((activeLanes.reduce((sum, l) => sum + (l.onTimePercent || 0), 0) / activeLanes.length) * 10) / 10
                : 0,
            avgUtilization: activeLanes.length > 0
                ? Math.round((activeLanes.reduce((sum, l) => sum + (l.utilizationPercent || 0), 0) / activeLanes.length) * 10) / 10
                : 0,
            totalEstimatedSavings: this.suggestions
                .filter(s => s.status === 'PENDING_REVIEW')
                .reduce((sum, s) => sum + s.estimatedSavings, 0)
        };
    }

    searchLanes(query: string): Lane[] {
        const lowerQuery = query.toLowerCase();
        return this.lanes.filter(
            l =>
                l.laneCode.toLowerCase().includes(lowerQuery) ||
                l.origin.toLowerCase().includes(lowerQuery) ||
                l.destination.toLowerCase().includes(lowerQuery)
        );
    }

    reset() {
        this.lanes = generateSeedLanes();
        this.requests = [];
        this.suggestions = [];
        this.save();
    }
}

export const laneMasterService = new LaneMasterService();
