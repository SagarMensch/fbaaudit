// Cross-Linking Service
// Manages relationships between all master data entities
// Provides real-time updates via EventBus

import { EventBus } from './eventBus';

export interface CrossLinkRelationship {
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    relationshipType: string;
    metadata?: any;
}

class CrossLinkService {
    private relationships: Map<string, CrossLinkRelationship[]> = new Map();

    constructor() {
        this.initializeEventListeners();
        this.loadRelationships();
    }

    private initializeEventListeners() {
        // Supplier events
        EventBus.on('supplier.created', (event) => {
            console.log('[CrossLink] Supplier created:', event.data.id);
            this.onSupplierCreated(event.data);
        });

        EventBus.on('supplier.updated', (event) => {
            console.log('[CrossLink] Supplier updated:', event.data.id);
            this.onSupplierUpdated(event.data);
        });

        // Contract events
        EventBus.on('contract.created', (event) => {
            console.log('[CrossLink] Contract created:', event.data.id);
            this.onContractCreated(event.data);
        });

        EventBus.on('contract.amended', (event) => {
            console.log('[CrossLink] Contract amended:', event.data.id);
            this.onContractAmended(event.data);
        });

        EventBus.on('contract.expired', (event) => {
            console.log('[CrossLink] Contract expired:', event.data.id);
            this.onContractExpired(event.data);
        });

        // Rate events
        EventBus.on('rate.created', (event) => {
            console.log('[CrossLink] Rate created:', event.data.id);
            this.onRateCreated(event.data);
        });

        EventBus.on('rate.updated', (event) => {
            console.log('[CrossLink] Rate updated:', event.data.id);
            this.onRateUpdated(event.data);
        });

        // Fuel events
        EventBus.on('fuel.price.updated', (event) => {
            console.log('[CrossLink] Fuel price updated:', event.data);
            this.onFuelPriceUpdated(event.data);
        });

        EventBus.on('fuel.rule.changed', (event) => {
            console.log('[CrossLink] Fuel rule changed:', event.data);
            this.onFuelRuleChanged(event.data);
        });

        // Lane events
        EventBus.on('lane.created', (event) => {
            console.log('[CrossLink] Lane created:', event.data.id);
            this.onLaneCreated(event.data);
        });

        EventBus.on('lane.optimized', (event) => {
            console.log('[CrossLink] Lane optimized:', event.data.id);
            this.onLaneOptimized(event.data);
        });

        // Location events
        EventBus.on('location.zone.changed', (event) => {
            console.log('[CrossLink] Location zone changed:', event.data);
            this.onLocationZoneChanged(event.data);
        });

        EventBus.on('location.cluster.generated', (event) => {
            console.log('[CrossLink] Location cluster generated:', event.data);
            this.onLocationClusterGenerated(event.data);
        });

        // Vehicle events
        EventBus.on('vehicle.created', (event) => {
            console.log('[CrossLink] Vehicle created:', event.data.id);
            this.onVehicleCreated(event.data);
        });

        // Accessorial events
        EventBus.on('accessorial.created', (event) => {
            console.log('[CrossLink] Accessorial created:', event.data.id);
            this.onAccessorialCreated(event.data);
        });

        EventBus.on('accessorial.updated', (event) => {
            console.log('[CrossLink] Accessorial updated:', event.data.id);
            this.onAccessorialUpdated(event.data);
        });
    }

    private loadRelationships() {
        const stored = localStorage.getItem('crosslink_relationships');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.relationships = new Map(Object.entries(data));
            } catch (e) {
                console.error('[CrossLink] Failed to load relationships:', e);
            }
        }
    }

    private saveRelationships() {
        const data = Object.fromEntries(this.relationships);
        localStorage.setItem('crosslink_relationships', JSON.stringify(data));
    }

    // ==================== RELATIONSHIP MANAGEMENT ====================

    addRelationship(relationship: CrossLinkRelationship) {
        const key = `${relationship.sourceType}:${relationship.sourceId}`;
        const existing = this.relationships.get(key) || [];
        existing.push(relationship);
        this.relationships.set(key, existing);
        this.saveRelationships();
    }

    getRelationships(sourceType: string, sourceId: string): CrossLinkRelationship[] {
        const key = `${sourceType}:${sourceId}`;
        return this.relationships.get(key) || [];
    }

    removeRelationship(sourceType: string, sourceId: string, targetType: string, targetId: string) {
        const key = `${sourceType}:${sourceId}`;
        const existing = this.relationships.get(key) || [];
        const filtered = existing.filter(r =>
            !(r.targetType === targetType && r.targetId === targetId)
        );
        this.relationships.set(key, filtered);
        this.saveRelationships();
    }

    // ==================== COUNT HELPERS ====================

    getSupplierContractCount(supplierId: string): number {
        return this.getRelationships('supplier', supplierId)
            .filter(r => r.targetType === 'contract').length;
    }

    getContractRateCount(contractId: string): number {
        return this.getRelationships('contract', contractId)
            .filter(r => r.targetType === 'rate').length;
    }

    getLaneRateCount(laneId: string): number {
        return this.getRelationships('lane', laneId)
            .filter(r => r.targetType === 'rate').length;
    }

    getFuelRuleContractCount(ruleId: string): number {
        return this.getRelationships('fuelRule', ruleId)
            .filter(r => r.targetType === 'contract').length;
    }

    getAccessorialRateCount(accessorialId: string): number {
        return this.getRelationships('accessorial', accessorialId)
            .filter(r => r.targetType === 'rate').length;
    }

    getLocationLaneCount(locationId: string): number {
        return this.getRelationships('location', locationId)
            .filter(r => r.targetType === 'lane').length;
    }

    getVehicleContractCount(vehicleId: string): number {
        return this.getRelationships('vehicle', vehicleId)
            .filter(r => r.targetType === 'contract').length;
    }

    // ==================== EVENT HANDLERS ====================

    private onSupplierCreated(supplier: any) {
        // Initialize empty relationship set
        this.relationships.set(`supplier:${supplier.id}`, []);
        this.saveRelationships();
    }

    private onSupplierUpdated(supplier: any) {
        // Update vendor name in all linked contracts
        const contractRels = this.getRelationships('supplier', supplier.id)
            .filter(r => r.targetType === 'contract');

        contractRels.forEach(rel => {
            EventBus.emit('contract.vendor.updated', {
                contractId: rel.targetId,
                vendorName: supplier.name
            });
        });
    }

    private onContractCreated(contract: any) {
        // Link contract to supplier
        if (contract.vendorId) {
            this.addRelationship({
                sourceType: 'supplier',
                sourceId: contract.vendorId,
                targetType: 'contract',
                targetId: contract.id,
                relationshipType: 'has_contract'
            });

            // Reverse link
            this.addRelationship({
                sourceType: 'contract',
                sourceId: contract.id,
                targetType: 'supplier',
                targetId: contract.vendorId,
                relationshipType: 'belongs_to_supplier'
            });
        }

        // Link contract to fuel rule if exists
        if (contract.pvcConfig?.ruleId) {
            this.addRelationship({
                sourceType: 'fuelRule',
                sourceId: contract.pvcConfig.ruleId,
                targetType: 'contract',
                targetId: contract.id,
                relationshipType: 'uses_fuel_rule'
            });
        }
    }

    private onContractAmended(contract: any) {
        // Flag all linked rates for review
        const rateRels = this.getRelationships('contract', contract.id)
            .filter(r => r.targetType === 'rate');

        rateRels.forEach(rel => {
            EventBus.emit('rate.review.required', {
                rateId: rel.targetId,
                reason: 'Contract amended',
                contractId: contract.id
            });
        });
    }

    private onContractExpired(contract: any) {
        // Deactivate all linked rates
        const rateRels = this.getRelationships('contract', contract.id)
            .filter(r => r.targetType === 'rate');

        rateRels.forEach(rel => {
            EventBus.emit('rate.deactivate', {
                rateId: rel.targetId,
                reason: 'Contract expired',
                contractId: contract.id
            });
        });
    }

    private onRateCreated(rate: any) {
        // Link rate to contract
        if (rate.contractId) {
            this.addRelationship({
                sourceType: 'contract',
                sourceId: rate.contractId,
                targetType: 'rate',
                targetId: rate.id,
                relationshipType: 'has_rate'
            });
        }

        // Link rate to lane (origin-destination)
        if (rate.source && rate.destination) {
            const laneId = `${rate.source}-${rate.destination}`;
            this.addRelationship({
                sourceType: 'lane',
                sourceId: laneId,
                targetType: 'rate',
                targetId: rate.id,
                relationshipType: 'has_rate'
            });
        }

        // Link rate to accessorials
        if (rate.accessorials && rate.accessorials.length > 0) {
            rate.accessorials.forEach((acc: any) => {
                this.addRelationship({
                    sourceType: 'accessorial',
                    sourceId: acc.id || acc.code,
                    targetType: 'rate',
                    targetId: rate.id,
                    relationshipType: 'used_in_rate'
                });
            });
        }
    }

    private onRateUpdated(rate: any) {
        // Update contract utilization
        if (rate.contractId) {
            EventBus.emit('contract.utilization.changed', {
                contractId: rate.contractId,
                rateId: rate.id
            });
        }
    }

    private onFuelPriceUpdated(data: any) {
        // Recalculate all rates using this fuel rule
        const contractRels = this.getRelationships('fuelRule', data.ruleId || 'default')
            .filter(r => r.targetType === 'contract');

        contractRels.forEach(rel => {
            const rateRels = this.getRelationships('contract', rel.targetId)
                .filter(r => r.targetType === 'rate');

            rateRels.forEach(rateRel => {
                EventBus.emit('rate.fuel.recalculate', {
                    rateId: rateRel.targetId,
                    newFuelPrice: data.price
                });
            });
        });
    }

    private onFuelRuleChanged(data: any) {
        // Alert all contracts using this rule
        const contractRels = this.getRelationships('fuelRule', data.ruleId)
            .filter(r => r.targetType === 'contract');

        contractRels.forEach(rel => {
            EventBus.emit('contract.fuel.rule.changed', {
                contractId: rel.targetId,
                ruleId: data.ruleId,
                changes: data.changes
            });
        });
    }

    private onLaneCreated(lane: any) {
        // Suggest rate creation for this lane
        EventBus.emit('rate.suggestion', {
            laneId: lane.id,
            origin: lane.origin,
            destination: lane.destination,
            message: 'New lane created - consider adding rates'
        });
    }

    private onLaneOptimized(lane: any) {
        // Recommend rate adjustments for this lane
        const rateRels = this.getRelationships('lane', lane.id)
            .filter(r => r.targetType === 'rate');

        rateRels.forEach(rel => {
            EventBus.emit('rate.optimization.suggestion', {
                rateId: rel.targetId,
                laneId: lane.id,
                suggestion: lane.optimizationSuggestion
            });
        });
    }

    private onLocationZoneChanged(data: any) {
        // Re-optimize all lanes involving this location
        const laneRels = this.getRelationships('location', data.locationId)
            .filter(r => r.targetType === 'lane');

        laneRels.forEach(rel => {
            EventBus.emit('lane.reoptimize', {
                laneId: rel.targetId,
                reason: 'Location zone changed',
                locationId: data.locationId
            });
        });
    }

    private onLocationClusterGenerated(data: any) {
        // Suggest new lanes based on cluster
        EventBus.emit('lane.cluster.suggestion', {
            clusterId: data.clusterId,
            suggestedLanes: data.suggestedLanes
        });
    }

    private onVehicleCreated(vehicle: any) {
        // Make vehicle available for contract linking
        EventBus.emit('vehicle.available', {
            vehicleId: vehicle.id,
            vehicleType: vehicle.vehicleTypeCode
        });
    }

    private onAccessorialCreated(accessorial: any) {
        // Make accessorial available for rate linking
        EventBus.emit('accessorial.available', {
            accessorialId: accessorial.id,
            code: accessorial.code,
            description: accessorial.description
        });
    }

    private onAccessorialUpdated(accessorial: any) {
        // Update all rates using this accessorial
        const rateRels = this.getRelationships('accessorial', accessorial.id)
            .filter(r => r.targetType === 'rate');

        rateRels.forEach(rel => {
            EventBus.emit('rate.accessorial.updated', {
                rateId: rel.targetId,
                accessorialId: accessorial.id,
                newAmount: accessorial.amount
            });
        });
    }

    // ==================== NAVIGATION HELPERS ====================

    navigateToRelated(sourceType: string, sourceId: string, targetType: string): string {
        const routes: Record<string, string> = {
            'supplier': '/suppliers',
            'contract': '/contracts',
            'rate': '/rates',
            'carrier': '/carrier-scorecard',
            'fuel': '/master-data?tab=fuel',
            'lane': '/master-data?tab=lanes',
            'location': '/master-data?tab=locations',
            'vehicle': '/master-data?tab=vehicles',
            'accessorial': '/master-data?tab=accessorials'
        };

        return routes[targetType] || '/';
    }

    // ==================== STATISTICS ====================

    getStatistics() {
        let totalRelationships = 0;
        const byType: Record<string, number> = {};

        this.relationships.forEach((rels, key) => {
            totalRelationships += rels.length;
            rels.forEach(rel => {
                const type = `${rel.sourceType} → ${rel.targetType}`;
                byType[type] = (byType[type] || 0) + 1;
            });
        });

        return {
            totalRelationships,
            byType,
            totalEntities: this.relationships.size
        };
    }
}

export const crossLinkService = new CrossLinkService();
