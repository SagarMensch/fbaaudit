import { LocationZone, DistanceMatrix, LocationCluster } from '../types';

// Haversine formula for distance calculation
function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Major Indian cities with coordinates
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'Delhi': { lat: 28.7041, lng: 77.1025 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Kanpur': { lat: 26.4499, lng: 80.3319 },
    'Nagpur': { lat: 21.1458, lng: 79.0882 },
    'Indore': { lat: 22.7196, lng: 75.8577 },
    'Thane': { lat: 19.2183, lng: 72.9781 },
    'Bhopal': { lat: 23.2599, lng: 77.4126 },
    'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'Pimpri-Chinchwad': { lat: 18.6298, lng: 73.7997 },
    'Patna': { lat: 25.5941, lng: 85.1376 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Ghaziabad': { lat: 28.6692, lng: 77.4538 },
    'Ludhiana': { lat: 30.9010, lng: 75.8573 },
    'Agra': { lat: 27.1767, lng: 78.0081 },
    'Nashik': { lat: 19.9975, lng: 73.7898 },
    'Faridabad': { lat: 28.4089, lng: 77.3178 },
    'Meerut': { lat: 28.9845, lng: 77.7064 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
    'Kalyan-Dombivali': { lat: 19.2403, lng: 73.1305 },
    'Vasai-Virar': { lat: 19.4612, lng: 72.7985 },
    'Varanasi': { lat: 25.3176, lng: 82.9739 },
    'Gurugram': { lat: 28.4595, lng: 77.0266 },
    'Noida': { lat: 28.5355, lng: 77.3910 },
    'Chandigarh': { lat: 30.7333, lng: 76.7794 },
    'Coimbatore': { lat: 11.0168, lng: 76.9558 },
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Guwahati': { lat: 26.1445, lng: 91.7362 },
    'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
    'Raipur': { lat: 21.2514, lng: 81.6296 },
    'Dehradun': { lat: 30.3165, lng: 78.0322 },
    'Ranchi': { lat: 23.3441, lng: 85.3096 }
};

// Seed data for zones
const SEED_ZONES: LocationZone[] = [
    {
        id: 'ZONE-001',
        code: 'NORTH-INDIA',
        name: 'North India',
        type: 'REGION',
        locations: ['Delhi', 'Chandigarh', 'Jaipur', 'Lucknow', 'Agra'],
        coordinates: { lat: 28.7041, lng: 77.1025 },
        status: 'ACTIVE',
        createdDate: new Date().toISOString()
    },
    {
        id: 'ZONE-002',
        code: 'WEST-INDIA',
        name: 'West India',
        type: 'REGION',
        locations: ['Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Nashik'],
        coordinates: { lat: 19.0760, lng: 72.8777 },
        status: 'ACTIVE',
        createdDate: new Date().toISOString()
    },
    {
        id: 'ZONE-003',
        code: 'SOUTH-INDIA',
        name: 'South India',
        type: 'REGION',
        locations: ['Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Coimbatore'],
        coordinates: { lat: 12.9716, lng: 77.5946 },
        status: 'ACTIVE',
        createdDate: new Date().toISOString()
    },
    {
        id: 'ZONE-004',
        code: 'EAST-INDIA',
        name: 'East India',
        type: 'REGION',
        locations: ['Kolkata', 'Bhubaneswar', 'Guwahati', 'Patna', 'Ranchi'],
        coordinates: { lat: 22.5726, lng: 88.3639 },
        status: 'ACTIVE',
        createdDate: new Date().toISOString()
    },
    {
        id: 'ZONE-005',
        code: 'DL-NCR',
        name: 'Delhi NCR',
        type: 'STATE',
        parentZoneId: 'ZONE-001',
        locations: ['Delhi', 'Gurugram', 'Noida', 'Ghaziabad', 'Faridabad'],
        coordinates: { lat: 28.7041, lng: 77.1025 },
        metadata: { tier: '1', economicZone: 'NCR' },
        status: 'ACTIVE',
        createdDate: new Date().toISOString()
    },
    {
        id: 'ZONE-006',
        code: 'MH-MUMBAI',
        name: 'Mumbai Metropolitan',
        type: 'STATE',
        parentZoneId: 'ZONE-002',
        locations: ['Mumbai', 'Thane', 'Navi Mumbai', 'Kalyan-Dombivali'],
        coordinates: { lat: 19.0760, lng: 72.8777 },
        metadata: { tier: '1', economicZone: 'MMR' },
        status: 'ACTIVE',
        createdDate: new Date().toISOString()
    }
];

class LocationGroupingService {
    private STORAGE_KEY = 'location_zones_v1';
    private DISTANCE_MATRIX_KEY = 'distance_matrix_v1';
    private CLUSTERS_KEY = 'location_clusters_v1';

    private zones: LocationZone[] = [];
    private distanceMatrix: DistanceMatrix[] = [];
    private clusters: LocationCluster[] = [];

    constructor() {
        this.load();
    }

    private load() {
        // Load zones
        const storedZones = localStorage.getItem(this.STORAGE_KEY);
        if (storedZones) {
            this.zones = JSON.parse(storedZones);
        } else {
            this.zones = SEED_ZONES;
            this.save();
        }

        // Load distance matrix
        const storedMatrix = localStorage.getItem(this.DISTANCE_MATRIX_KEY);
        if (storedMatrix) {
            this.distanceMatrix = JSON.parse(storedMatrix);
        }

        // Load clusters
        const storedClusters = localStorage.getItem(this.CLUSTERS_KEY);
        if (storedClusters) {
            this.clusters = JSON.parse(storedClusters);
        }
    }

    private save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.zones));
        localStorage.setItem(this.DISTANCE_MATRIX_KEY, JSON.stringify(this.distanceMatrix));
        localStorage.setItem(this.CLUSTERS_KEY, JSON.stringify(this.clusters));
    }

    // --- ZONE MANAGEMENT ---

    getAllZones(): LocationZone[] {
        return this.zones.filter(z => z.status === 'ACTIVE');
    }

    getZoneById(id: string): LocationZone | undefined {
        return this.zones.find(z => z.id === id);
    }

    getZonesByType(type: LocationZone['type']): LocationZone[] {
        return this.zones.filter(z => z.type === type && z.status === 'ACTIVE');
    }

    getChildZones(parentId: string): LocationZone[] {
        return this.zones.filter(z => z.parentZoneId === parentId && z.status === 'ACTIVE');
    }

    getZoneHierarchy(): LocationZone[] {
        // Return zones organized by hierarchy
        const regions = this.zones.filter(z => z.type === 'REGION' && z.status === 'ACTIVE');
        return regions;
    }

    createZone(zone: Omit<LocationZone, 'id' | 'createdDate'>): LocationZone {
        const newZone: LocationZone = {
            ...zone,
            id: `ZONE-${Date.now()}`,
            createdDate: new Date().toISOString()
        };
        this.zones.push(newZone);
        this.save();
        return newZone;
    }

    updateZone(id: string, updates: Partial<LocationZone>): LocationZone | null {
        const index = this.zones.findIndex(z => z.id === id);
        if (index === -1) return null;

        this.zones[index] = { ...this.zones[index], ...updates };
        this.save();
        return this.zones[index];
    }

    deleteZone(id: string): boolean {
        const index = this.zones.findIndex(z => z.id === id);
        if (index === -1) return false;

        // Soft delete
        this.zones[index].status = 'INACTIVE';
        this.save();
        return true;
    }

    findZoneByLocation(location: string): LocationZone | undefined {
        return this.zones.find(z =>
            z.locations.some(loc => loc.toLowerCase() === location.toLowerCase()) &&
            z.status === 'ACTIVE'
        );
    }

    // --- DISTANCE MATRIX ---

    calculateDistance(from: string, to: string): DistanceMatrix | null {
        // Check if already calculated
        const existing = this.distanceMatrix.find(
            d => (d.fromZone === from && d.toZone === to) || (d.fromZone === to && d.toZone === from)
        );
        if (existing) return existing;

        // Get coordinates
        const fromCoords = CITY_COORDINATES[from];
        const toCoords = CITY_COORDINATES[to];

        if (!fromCoords || !toCoords) return null;

        // Calculate using Haversine
        const distanceKm = calculateHaversineDistance(
            fromCoords.lat,
            fromCoords.lng,
            toCoords.lat,
            toCoords.lng
        );

        // Estimate transit time (assuming 50 km/hr average)
        const estimatedTransitHrs = Math.ceil(distanceKm / 50);

        const newDistance: DistanceMatrix = {
            id: `DIST-${Date.now()}`,
            fromZone: from,
            toZone: to,
            distanceKm: Math.round(distanceKm),
            estimatedTransitHrs,
            calculationMethod: 'HAVERSINE',
            lastUpdated: new Date().toISOString(),
            confidence: 85
        };

        this.distanceMatrix.push(newDistance);
        this.save();
        return newDistance;
    }

    getDistance(from: string, to: string): DistanceMatrix | null {
        const existing = this.distanceMatrix.find(
            d => (d.fromZone === from && d.toZone === to) || (d.fromZone === to && d.toZone === from)
        );
        return existing || this.calculateDistance(from, to);
    }

    getAllDistances(): DistanceMatrix[] {
        return this.distanceMatrix;
    }

    updateDistance(id: string, updates: Partial<DistanceMatrix>): DistanceMatrix | null {
        const index = this.distanceMatrix.findIndex(d => d.id === id);
        if (index === -1) return null;

        this.distanceMatrix[index] = {
            ...this.distanceMatrix[index],
            ...updates,
            lastUpdated: new Date().toISOString()
        };
        this.save();
        return this.distanceMatrix[index];
    }

    // --- AI CLUSTERING ---

    generateAIClusters(invoices?: any[]): LocationCluster[] {
        // AI-powered clustering based on shipment patterns
        // For demo, create sample clusters

        const newClusters: LocationCluster[] = [
            {
                id: `CLUSTER-${Date.now()}-1`,
                name: 'Western Hub Cluster',
                zoneIds: ['ZONE-002', 'ZONE-006'],
                centroid: { lat: 19.0760, lng: 72.8777 },
                aiSuggested: true,
                confidence: 92,
                rationale: 'High shipment volume between Mumbai, Pune, and Ahmedabad. Consolidation opportunity identified.',
                shipmentVolume: 1250,
                avgCost: 12500
            },
            {
                id: `CLUSTER-${Date.now()}-2`,
                name: 'NCR Distribution Cluster',
                zoneIds: ['ZONE-005'],
                centroid: { lat: 28.7041, lng: 77.1025 },
                aiSuggested: true,
                confidence: 88,
                rationale: 'Delhi NCR cities show similar delivery patterns. Single hub recommended.',
                shipmentVolume: 980,
                avgCost: 8500
            },
            {
                id: `CLUSTER-${Date.now()}-3`,
                name: 'South India Tech Corridor',
                zoneIds: ['ZONE-003'],
                centroid: { lat: 12.9716, lng: 77.5946 },
                aiSuggested: true,
                confidence: 85,
                rationale: 'Bangalore-Chennai-Hyderabad triangle shows high tech product movement.',
                shipmentVolume: 750,
                avgCost: 15000
            }
        ];

        this.clusters.push(...newClusters);
        this.save();
        return newClusters;
    }

    getAllClusters(): LocationCluster[] {
        return this.clusters;
    }

    acceptCluster(clusterId: string): boolean {
        const cluster = this.clusters.find(c => c.id === clusterId);
        if (!cluster) return false;

        // Create a new zone from the cluster
        const newZone: LocationZone = {
            id: `ZONE-AI-${Date.now()}`,
            code: cluster.name.toUpperCase().replace(/\s+/g, '-'),
            name: cluster.name,
            type: 'CITY',
            locations: cluster.zoneIds.flatMap(zId => {
                const zone = this.getZoneById(zId);
                return zone?.locations || [];
            }),
            coordinates: cluster.centroid,
            status: 'ACTIVE',
            createdDate: new Date().toISOString(),
            createdBy: 'AI Clustering Engine'
        };

        this.zones.push(newZone);
        this.save();
        return true;
    }

    // --- UTILITY FUNCTIONS ---

    getCityCoordinates(city: string): { lat: number; lng: number } | null {
        return CITY_COORDINATES[city] || null;
    }

    searchZones(query: string): LocationZone[] {
        const lowerQuery = query.toLowerCase();
        return this.zones.filter(z =>
            (z.name.toLowerCase().includes(lowerQuery) ||
                z.code.toLowerCase().includes(lowerQuery) ||
                z.locations.some(loc => loc.toLowerCase().includes(lowerQuery))) &&
            z.status === 'ACTIVE'
        );
    }

    getZoneStatistics() {
        return {
            totalZones: this.zones.filter(z => z.status === 'ACTIVE').length,
            byType: {
                region: this.zones.filter(z => z.type === 'REGION' && z.status === 'ACTIVE').length,
                state: this.zones.filter(z => z.type === 'STATE' && z.status === 'ACTIVE').length,
                city: this.zones.filter(z => z.type === 'CITY' && z.status === 'ACTIVE').length,
                pincodeCluster: this.zones.filter(z => z.type === 'PINCODE_CLUSTER' && z.status === 'ACTIVE').length
            },
            totalDistances: this.distanceMatrix.length,
            totalClusters: this.clusters.length,
            aiSuggestedClusters: this.clusters.filter(c => c.aiSuggested).length
        };
    }

    exportZones(): string {
        // Export as CSV
        const headers = ['ID', 'Code', 'Name', 'Type', 'Locations', 'Parent Zone', 'Status'];
        const rows = this.zones.map(z => [
            z.id,
            z.code,
            z.name,
            z.type,
            z.locations.join('; '),
            z.parentZoneId || '',
            z.status
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    importZones(csvData: string): number {
        // Parse CSV and import zones
        const lines = csvData.split('\n').slice(1); // Skip header
        let imported = 0;

        lines.forEach(line => {
            const [id, code, name, type, locations, parentZoneId, status] = line.split(',');
            if (code && name) {
                this.createZone({
                    code,
                    name,
                    type: type as LocationZone['type'],
                    locations: locations.split(';').map(l => l.trim()),
                    parentZoneId: parentZoneId || undefined,
                    status: (status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
                });
                imported++;
            }
        });

        return imported;
    }

    reset() {
        this.zones = SEED_ZONES;
        this.distanceMatrix = [];
        this.clusters = [];
        this.save();
    }
}

export const locationGroupingService = new LocationGroupingService();
