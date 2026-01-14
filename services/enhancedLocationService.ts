/**
 * Enhanced Location Master Service
 * 
 * Enterprise-grade location management with:
 * - 9-level hierarchy: Country → Zone → Region → State → Cluster → City → Pincode → Warehouse → Gate
 * - Temporal versioning
 * - Geo-intelligence integration
 * - Operational constraints
 * - Distance intelligence (Commercial vs GPS)
 * - Terrain and congestion factors
 */

import { TemporalDataService, TemporalEntity } from './temporalDataService';
import { getGeoIntelligenceService } from './geoIntelligenceService';
import { getMDMDatabase } from './indexedDBService';

export type LocationLevel =
    | 'COUNTRY'
    | 'ZONE'
    | 'REGION'
    | 'STATE'
    | 'CLUSTER'
    | 'CITY'
    | 'PINCODE'
    | 'WAREHOUSE'
    | 'GATE';

export interface AccessRestriction {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string;
    restrictionType: 'NO_ENTRY' | 'NO_EXIT' | 'WEIGHT_LIMIT' | 'HEIGHT_LIMIT';
    description: string;
}

export interface VehicleConstraints {
    maxHeight: number; // meters
    maxWeight: number; // tons
    maxLength: number; // meters
    allowedVehicleTypes: string[];
}

export interface LaborAvailability {
    loading: boolean;
    unloading: boolean;
    operatingHours: string; // e.g., "06:00-22:00"
    laborCount?: number;
    equipmentAvailable: string[]; // e.g., ["forklift", "crane"]
}

export interface DistanceIntelligence {
    commercialDistance: number; // Contractual distance in km
    gpsDistance: number; // Actual GPS distance in km
    terrainFactor: number; // 1.0-2.0 multiplier for hilly terrain
    congestionIndex: number; // 1.0-3.0 multiplier for traffic
    lastUpdated: Date;
}

export interface EnhancedLocation extends TemporalEntity {
    // Basic Information
    name: string;
    code: string;
    level: LocationLevel;
    parentId: string | null;

    // Geographic Intelligence
    osmNodeId?: string;
    latitude?: number;
    longitude?: number;
    geoHash?: string;
    formattedAddress?: string;

    // Administrative
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;

    // Operational Constraints
    accessRestrictions: AccessRestriction[];
    vehicleConstraints?: VehicleConstraints;
    laborAvailability?: LaborAvailability;

    // Distance Intelligence (for warehouses/gates)
    distanceIntelligence?: Map<string, DistanceIntelligence>; // key: destination location ID

    // Metadata
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
    tags: string[];
    customAttributes: Record<string, any>;
}

export class EnhancedLocationService extends TemporalDataService<EnhancedLocation> {
    private geoService = getGeoIntelligenceService();
    private db: any = null;

    constructor() {
        super('LOCATION', 'locations');
        this.initializeDB();
    }

    private async initializeDB() {
        this.db = await getMDMDatabase();
    }

    /**
     * Create a new location with automatic geocoding
     */
    async createLocation(
        locationData: Omit<EnhancedLocation, 'versionId' | 'effectiveFrom' | 'effectiveTo' | 'createdAt' | 'modifiedAt' | 'isActive' | 'createdBy' | 'modifiedBy' | 'changeReason'>,
        userId: string = 'SYSTEM',
        autoGeocode: boolean = true
    ): Promise<EnhancedLocation> {
        let enrichedData = { ...locationData };

        // Auto-geocode if address provided and coordinates missing
        if (autoGeocode && locationData.formattedAddress && !locationData.latitude) {
            const geocodeResult = await this.geoService.geocodeAddress(
                locationData.formattedAddress,
                locationData.country || 'IN'
            );

            if (geocodeResult) {
                enrichedData = {
                    ...enrichedData,
                    osmNodeId: geocodeResult.osmNodeId,
                    latitude: geocodeResult.latitude,
                    longitude: geocodeResult.longitude,
                    city: geocodeResult.city || enrichedData.city,
                    state: geocodeResult.state || enrichedData.state,
                    pincode: geocodeResult.pincode || enrichedData.pincode
                };
            }
        }

        // Generate geohash if coordinates available
        if (enrichedData.latitude && enrichedData.longitude) {
            enrichedData.geoHash = this.generateGeoHash(
                enrichedData.latitude,
                enrichedData.longitude
            );
        }

        return await this.createVersion(enrichedData, new Date(), userId, 'Location created');
    }

    /**
     * Get complete hierarchy path for a location
     */
    async getHierarchyPath(locationId: string): Promise<EnhancedLocation[]> {
        const path: EnhancedLocation[] = [];
        let currentLocation = await this.getCurrentVersion(locationId);

        while (currentLocation) {
            path.unshift(currentLocation);
            if (currentLocation.parentId) {
                currentLocation = await this.getCurrentVersion(currentLocation.parentId);
            } else {
                break;
            }
        }

        return path;
    }

    /**
     * Get all children of a location
     */
    async getChildren(parentId: string, level?: LocationLevel): Promise<EnhancedLocation[]> {
        const allLocations = await this.getAllActiveAt();

        return allLocations.filter(loc =>
            loc.parentId === parentId &&
            (!level || loc.level === level)
        );
    }

    /**
     * Get all descendants (recursive)
     */
    async getDescendants(parentId: string): Promise<EnhancedLocation[]> {
        const descendants: EnhancedLocation[] = [];
        const children = await this.getChildren(parentId);

        for (const child of children) {
            descendants.push(child);
            const childDescendants = await this.getDescendants(child.id);
            descendants.push(...childDescendants);
        }

        return descendants;
    }

    /**
     * Calculate and store distance intelligence between two locations
     */
    async calculateDistanceIntelligence(
        originId: string,
        destinationId: string,
        commercialDistance: number,
        terrainFactor: number = 1.0,
        congestionIndex: number = 1.0
    ): Promise<DistanceIntelligence> {
        const origin = await this.getCurrentVersion(originId);
        const destination = await this.getCurrentVersion(destinationId);

        if (!origin || !destination) {
            throw new Error('Origin or destination location not found');
        }

        if (!origin.latitude || !destination.latitude) {
            throw new Error('Locations must have coordinates for distance calculation');
        }

        // Calculate GPS distance using routing API
        const route = await this.geoService.calculateRoute(
            origin.latitude,
            origin.longitude,
            destination.latitude,
            destination.longitude
        );

        const gpsDistance = route ? route.distance / 1000 : 0; // Convert to km

        const distanceIntel: DistanceIntelligence = {
            commercialDistance,
            gpsDistance,
            terrainFactor,
            congestionIndex,
            lastUpdated: new Date()
        };

        // Store in origin location's distance intelligence map
        if (!origin.distanceIntelligence) {
            origin.distanceIntelligence = new Map();
        }
        origin.distanceIntelligence.set(destinationId, distanceIntel);

        // Update the location version
        await this.createVersion(origin, new Date(), 'SYSTEM', 'Distance intelligence updated');

        return distanceIntel;
    }

    /**
     * Get distance variance analysis
     */
    getDistanceVariance(distanceIntel: DistanceIntelligence): {
        variance: number;
        variancePercent: number;
        adjustedDistance: number;
    } {
        const variance = distanceIntel.gpsDistance - distanceIntel.commercialDistance;
        const variancePercent = (variance / distanceIntel.commercialDistance) * 100;
        const adjustedDistance = distanceIntel.gpsDistance *
            distanceIntel.terrainFactor *
            distanceIntel.congestionIndex;

        return {
            variance,
            variancePercent,
            adjustedDistance
        };
    }

    /**
     * Check if location is accessible at given time
     */
    isAccessibleAt(location: EnhancedLocation, dateTime: Date): {
        accessible: boolean;
        restrictions: AccessRestriction[];
    } {
        const dayOfWeek = dateTime.getDay();
        const timeStr = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;

        const activeRestrictions = location.accessRestrictions.filter(restriction => {
            if (restriction.dayOfWeek !== dayOfWeek) return false;
            return timeStr >= restriction.startTime && timeStr <= restriction.endTime;
        });

        return {
            accessible: activeRestrictions.length === 0,
            restrictions: activeRestrictions
        };
    }

    /**
     * Find locations within radius
     */
    async findLocationsWithinRadius(
        centerLat: number,
        centerLng: number,
        radiusKm: number
    ): Promise<EnhancedLocation[]> {
        const allLocations = await this.getAllActiveAt();

        return allLocations.filter(loc => {
            if (!loc.latitude || !loc.longitude) return false;

            const distance = this.calculateHaversineDistance(
                centerLat,
                centerLng,
                loc.latitude,
                loc.longitude
            );

            return distance <= radiusKm;
        });
    }

    /**
     * Get locations by level
     */
    async getLocationsByLevel(level: LocationLevel): Promise<EnhancedLocation[]> {
        const allLocations = await this.getAllActiveAt();
        return allLocations.filter(loc => loc.level === level);
    }

    /**
     * Validate hierarchy integrity
     */
    async validateHierarchy(locationId: string): Promise<{
        valid: boolean;
        errors: string[];
    }> {
        const errors: string[] = [];
        const location = await this.getCurrentVersion(locationId);

        if (!location) {
            return { valid: false, errors: ['Location not found'] };
        }

        // Check parent exists if parentId is set
        if (location.parentId) {
            const parent = await this.getCurrentVersion(location.parentId);
            if (!parent) {
                errors.push(`Parent location ${location.parentId} not found`);
            } else {
                // Validate level hierarchy
                const levelOrder: LocationLevel[] = [
                    'COUNTRY', 'ZONE', 'REGION', 'STATE', 'CLUSTER',
                    'CITY', 'PINCODE', 'WAREHOUSE', 'GATE'
                ];

                const parentLevelIndex = levelOrder.indexOf(parent.level);
                const currentLevelIndex = levelOrder.indexOf(location.level);

                if (currentLevelIndex <= parentLevelIndex) {
                    errors.push(`Invalid hierarchy: ${location.level} cannot be child of ${parent.level}`);
                }
            }
        }

        // Check for circular references
        const path = await this.getHierarchyPath(locationId);
        const ids = path.map(l => l.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            errors.push('Circular reference detected in hierarchy');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Bulk geocode locations
     */
    async bulkGeocode(locationIds: string[]): Promise<{
        success: number;
        failed: number;
        results: Array<{ id: string; success: boolean; error?: string }>;
    }> {
        const results: Array<{ id: string; success: boolean; error?: string }> = [];
        let success = 0;
        let failed = 0;

        for (const id of locationIds) {
            try {
                const location = await this.getCurrentVersion(id);
                if (!location || !location.formattedAddress) {
                    results.push({ id, success: false, error: 'No address found' });
                    failed++;
                    continue;
                }

                const geocodeResult = await this.geoService.geocodeAddress(
                    location.formattedAddress,
                    location.country || 'IN'
                );

                if (geocodeResult) {
                    await this.createVersion({
                        ...location,
                        osmNodeId: geocodeResult.osmNodeId,
                        latitude: geocodeResult.latitude,
                        longitude: geocodeResult.longitude,
                        geoHash: this.generateGeoHash(geocodeResult.latitude, geocodeResult.longitude)
                    }, new Date(), 'SYSTEM', 'Bulk geocoding');

                    results.push({ id, success: true });
                    success++;
                } else {
                    results.push({ id, success: false, error: 'Geocoding failed' });
                    failed++;
                }
            } catch (error) {
                results.push({ id, success: false, error: (error as Error).message });
                failed++;
            }
        }

        return { success, failed, results };
    }

    // Helper methods

    private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private generateGeoHash(lat: number, lng: number, precision: number = 8): string {
        // Simplified geohash implementation
        // In production, use a proper geohash library
        const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
        let hash = '';
        let latRange = [-90, 90];
        let lngRange = [-180, 180];
        let isEven = true;
        let bit = 0;
        let ch = 0;

        while (hash.length < precision) {
            if (isEven) {
                const mid = (lngRange[0] + lngRange[1]) / 2;
                if (lng > mid) {
                    ch |= (1 << (4 - bit));
                    lngRange[0] = mid;
                } else {
                    lngRange[1] = mid;
                }
            } else {
                const mid = (latRange[0] + latRange[1]) / 2;
                if (lat > mid) {
                    ch |= (1 << (4 - bit));
                    latRange[0] = mid;
                } else {
                    latRange[1] = mid;
                }
            }

            isEven = !isEven;

            if (bit < 4) {
                bit++;
            } else {
                hash += base32[ch];
                bit = 0;
                ch = 0;
            }
        }

        return hash;
    }
}

/**
 * Singleton instance
 */
let enhancedLocationServiceInstance: EnhancedLocationService | null = null;

export function getEnhancedLocationService(): EnhancedLocationService {
    if (!enhancedLocationServiceInstance) {
        enhancedLocationServiceInstance = new EnhancedLocationService();
    }
    return enhancedLocationServiceInstance;
}

/**
 * Initialize with Indian geography hierarchy
 */
export async function initializeIndianGeography(): Promise<void> {
    const service = getEnhancedLocationService();

    // Create India country node
    const india = await service.createLocation({
        id: 'LOC_INDIA',
        name: 'India',
        code: 'IN',
        level: 'COUNTRY',
        parentId: null,
        country: 'India',
        accessRestrictions: [],
        status: 'ACTIVE',
        tags: ['country'],
        customAttributes: {}
    }, 'SYSTEM', false);

    console.log('Indian geography hierarchy initialized');
}
