/**
 * Geo-Intelligence Service
 * 
 * Integrates with open-source geocoding and mapping APIs:
 * - Nominatim (OpenStreetMap) for geocoding
 * - OSRM for routing
 * - GraphHopper for distance matrix
 * 
 * Features:
 * - Address to coordinates conversion
 * - Reverse geocoding
 * - Place ID resolution using OSM Node IDs
 * - Caching layer to minimize API calls
 * - Rate limiting compliance
 */

export interface GeocodingResult {
    osmNodeId: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    confidence: number;
}

export interface ReverseGeocodingResult {
    formattedAddress: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
}

export interface RouteResult {
    distance: number; // meters
    duration: number; // seconds
    geometry: any; // GeoJSON
}

export interface DistanceMatrixResult {
    origins: string[];
    destinations: string[];
    distances: number[][]; // meters
    durations: number[][]; // seconds
}

export class GeoIntelligenceService {
    private nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
    private osrmBaseUrl = 'https://router.project-osrm.org';
    private graphHopperBaseUrl = 'https://graphhopper.com/api/1';

    private cache: Map<string, any> = new Map();
    private lastRequestTime = 0;
    private minRequestInterval = 1000; // 1 second for Nominatim rate limiting

    /**
     * Geocode an address to coordinates
     * Uses Nominatim API with caching
     */
    async geocodeAddress(address: string, countryCode: string = 'IN'): Promise<GeocodingResult | null> {
        const cacheKey = `geocode_${address}_${countryCode}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Rate limiting
        await this.respectRateLimit();

        try {
            const params = new URLSearchParams({
                q: address,
                format: 'json',
                addressdetails: '1',
                countrycodes: countryCode,
                limit: '1'
            });

            const response = await fetch(`${this.nominatimBaseUrl}/search?${params}`, {
                headers: {
                    'User-Agent': 'MDM-Enterprise-System/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.length === 0) {
                return null;
            }

            const result: GeocodingResult = {
                osmNodeId: data[0].osm_id?.toString() || '',
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                formattedAddress: data[0].display_name,
                city: data[0].address?.city || data[0].address?.town || data[0].address?.village,
                state: data[0].address?.state,
                country: data[0].address?.country,
                pincode: data[0].address?.postcode,
                confidence: parseFloat(data[0].importance || '0.5')
            };

            // Cache the result
            this.cache.set(cacheKey, result);

            return result;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
        const cacheKey = `reverse_${latitude}_${longitude}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        await this.respectRateLimit();

        try {
            const params = new URLSearchParams({
                lat: latitude.toString(),
                lon: longitude.toString(),
                format: 'json',
                addressdetails: '1'
            });

            const response = await fetch(`${this.nominatimBaseUrl}/reverse?${params}`, {
                headers: {
                    'User-Agent': 'MDM-Enterprise-System/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.statusText}`);
            }

            const data = await response.json();

            const result: ReverseGeocodingResult = {
                formattedAddress: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village,
                state: data.address?.state,
                country: data.address?.country,
                pincode: data.address?.postcode
            };

            this.cache.set(cacheKey, result);

            return result;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    /**
     * Calculate route between two points using OSRM
     */
    async calculateRoute(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number
    ): Promise<RouteResult | null> {
        const cacheKey = `route_${originLat}_${originLng}_${destLat}_${destLng}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const coords = `${originLng},${originLat};${destLng},${destLat}`;
            const url = `${this.osrmBaseUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`OSRM API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                return null;
            }

            const route = data.routes[0];
            const result: RouteResult = {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry
            };

            this.cache.set(cacheKey, result);

            return result;
        } catch (error) {
            console.error('Route calculation error:', error);
            return null;
        }
    }

    /**
     * Calculate distance matrix for multiple origins and destinations
     * Fallback to simple distance calculation if API unavailable
     */
    async calculateDistanceMatrix(
        origins: Array<{ lat: number; lng: number }>,
        destinations: Array<{ lat: number; lng: number }>
    ): Promise<DistanceMatrixResult> {
        const distances: number[][] = [];
        const durations: number[][] = [];

        for (const origin of origins) {
            const distRow: number[] = [];
            const durRow: number[] = [];

            for (const dest of destinations) {
                const route = await this.calculateRoute(
                    origin.lat,
                    origin.lng,
                    dest.lat,
                    dest.lng
                );

                if (route) {
                    distRow.push(route.distance);
                    durRow.push(route.duration);
                } else {
                    // Fallback to Haversine distance
                    const dist = this.haversineDistance(
                        origin.lat,
                        origin.lng,
                        dest.lat,
                        dest.lng
                    );
                    distRow.push(dist);
                    durRow.push(dist / 50 * 3600); // Assume 50 km/h average speed
                }
            }

            distances.push(distRow);
            durations.push(durRow);
        }

        return {
            origins: origins.map(o => `${o.lat},${o.lng}`),
            destinations: destinations.map(d => `${d.lat},${d.lng}`),
            distances,
            durations
        };
    }

    /**
     * Calculate Haversine distance between two points (fallback)
     */
    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // Earth radius in meters
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

    /**
     * Respect Nominatim rate limiting (1 request per second)
     */
    private async respectRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve =>
                setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
            );
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

/**
 * Singleton instance
 */
let geoIntelligenceInstance: GeoIntelligenceService | null = null;

export function getGeoIntelligenceService(): GeoIntelligenceService {
    if (!geoIntelligenceInstance) {
        geoIntelligenceInstance = new GeoIntelligenceService();
    }
    return geoIntelligenceInstance;
}
