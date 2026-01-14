// Location Master Data Quality Service
// Enterprise-grade address validation, geocoding, duplicate detection

export interface AddressValidationResult {
    isValid: boolean;
    standardizedAddress: string;
    confidence: number;
    suggestions: string[];
    components: {
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
    };
}

export interface GeocodingResult {
    lat: number;
    lng: number;
    accuracy: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
    formattedAddress: string;
}

export interface DuplicateMatch {
    id: string;
    name: string;
    matchScore: number;
    matchReasons: string[];
    suggestedAction: 'MERGE' | 'REVIEW' | 'IGNORE';
}

export interface DataQualityScore {
    overall: number; // 0-100
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    issues: Array<{ field: string; issue: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }>;
}

class LocationDataQualityService {
    // Indian cities database for validation
    private readonly INDIAN_CITIES = [
        'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
        'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
        'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
        'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
        'Varanasi', 'Gurugram', 'Noida', 'Chandigarh', 'Coimbatore', 'Kochi', 'Guwahati',
        'Bhubaneswar', 'Raipur', 'Dehradun', 'Ranchi'
    ];

    private readonly INDIAN_STATES = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
        'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
        'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
        'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
    ];

    /**
     * Validates and standardizes an address
     */
    public validateAddress(address: string): AddressValidationResult {
        const components = this.parseAddress(address);
        const isValid = this.checkAddressValidity(components);
        const confidence = this.calculateConfidence(components);
        const standardized = this.standardizeAddress(components);
        const suggestions = this.generateSuggestions(components);

        return {
            isValid,
            standardizedAddress: standardized,
            confidence,
            suggestions,
            components
        };
    }

    private parseAddress(address: string): AddressValidationResult['components'] {
        const parts = address.split(',').map(p => p.trim());
        const components: AddressValidationResult['components'] = {};

        // Simple parsing logic - in production, use NLP
        parts.forEach(part => {
            // Check if it's a pincode (6 digits)
            if (/^\d{6}$/.test(part)) {
                components.pincode = part;
            }
            // Check if it's a known city
            else if (this.INDIAN_CITIES.some(city => part.toLowerCase().includes(city.toLowerCase()))) {
                components.city = this.INDIAN_CITIES.find(city => part.toLowerCase().includes(city.toLowerCase()));
            }
            // Check if it's a known state
            else if (this.INDIAN_STATES.some(state => part.toLowerCase().includes(state.toLowerCase()))) {
                components.state = this.INDIAN_STATES.find(state => part.toLowerCase().includes(state.toLowerCase()));
            }
            // Otherwise, assume it's street
            else if (!components.street) {
                components.street = part;
            }
        });

        components.country = 'India';
        return components;
    }

    private checkAddressValidity(components: AddressValidationResult['components']): boolean {
        // Address is valid if it has at least city and pincode
        return !!(components.city && components.pincode);
    }

    private calculateConfidence(components: AddressValidationResult['components']): number {
        let score = 0;
        if (components.street) score += 20;
        if (components.city) score += 30;
        if (components.state) score += 20;
        if (components.pincode) score += 30;
        return score;
    }

    private standardizeAddress(components: AddressValidationResult['components']): string {
        const parts = [
            components.street,
            components.city,
            components.state,
            components.pincode,
            components.country
        ].filter(Boolean);
        return parts.join(', ');
    }

    private generateSuggestions(components: AddressValidationResult['components']): string[] {
        const suggestions: string[] = [];

        if (!components.pincode) {
            suggestions.push('Add pincode for better accuracy');
        }
        if (!components.state && components.city) {
            // Try to infer state from city
            const stateMap: Record<string, string> = {
                'Mumbai': 'Maharashtra',
                'Delhi': 'Delhi',
                'Bangalore': 'Karnataka',
                'Chennai': 'Tamil Nadu',
                'Kolkata': 'West Bengal'
            };
            if (stateMap[components.city]) {
                suggestions.push(`Consider adding state: ${stateMap[components.city]}`);
            }
        }

        return suggestions;
    }

    /**
     * Geocodes an address to lat/lng coordinates
     */
    public geocodeAddress(address: string): GeocodingResult | null {
        // In production, integrate with Google Maps API or similar
        // For now, use approximate coordinates for known cities

        const cityCoordinates: Record<string, { lat: number; lng: number }> = {
            'Delhi': { lat: 28.7041, lng: 77.1025 },
            'Mumbai': { lat: 19.0760, lng: 72.8777 },
            'Bangalore': { lat: 12.9716, lng: 77.5946 },
            'Chennai': { lat: 13.0827, lng: 80.2707 },
            'Kolkata': { lat: 22.5726, lng: 88.3639 },
            'Hyderabad': { lat: 17.3850, lng: 78.4867 },
            'Pune': { lat: 18.5204, lng: 73.8567 },
            'Ahmedabad': { lat: 23.0225, lng: 72.5714 }
        };

        const validation = this.validateAddress(address);
        if (!validation.components.city) return null;

        const coords = cityCoordinates[validation.components.city];
        if (!coords) return null;

        return {
            lat: coords.lat,
            lng: coords.lng,
            accuracy: 'GEOMETRIC_CENTER',
            formattedAddress: validation.standardizedAddress
        };
    }

    /**
     * Detects duplicate locations using fuzzy matching
     */
    public findDuplicates(
        newLocation: { name: string; address?: string; city?: string },
        existingLocations: Array<{ id: string; name: string; address?: string; city?: string }>
    ): DuplicateMatch[] {
        const matches: DuplicateMatch[] = [];

        existingLocations.forEach(existing => {
            const score = this.calculateMatchScore(newLocation, existing);
            if (score > 70) { // 70% threshold
                const reasons = this.getMatchReasons(newLocation, existing, score);
                matches.push({
                    id: existing.id,
                    name: existing.name,
                    matchScore: score,
                    matchReasons: reasons,
                    suggestedAction: score > 90 ? 'MERGE' : score > 80 ? 'REVIEW' : 'IGNORE'
                });
            }
        });

        return matches.sort((a, b) => b.matchScore - a.matchScore);
    }

    private calculateMatchScore(
        loc1: { name: string; address?: string; city?: string },
        loc2: { name: string; address?: string; city?: string }
    ): number {
        let score = 0;
        let weights = 0;

        // Name similarity (weight: 50)
        const nameSimilarity = this.levenshteinSimilarity(
            loc1.name.toLowerCase(),
            loc2.name.toLowerCase()
        );
        score += nameSimilarity * 50;
        weights += 50;

        // City match (weight: 30)
        if (loc1.city && loc2.city) {
            if (loc1.city.toLowerCase() === loc2.city.toLowerCase()) {
                score += 30;
            }
            weights += 30;
        }

        // Address similarity (weight: 20)
        if (loc1.address && loc2.address) {
            const addressSimilarity = this.levenshteinSimilarity(
                loc1.address.toLowerCase(),
                loc2.address.toLowerCase()
            );
            score += addressSimilarity * 20;
            weights += 20;
        }

        return weights > 0 ? (score / weights) * 100 : 0;
    }

    private levenshteinSimilarity(str1: string, str2: string): number {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 1 : 1 - distance / maxLength;
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    private getMatchReasons(
        loc1: { name: string; address?: string; city?: string },
        loc2: { name: string; address?: string; city?: string },
        score: number
    ): string[] {
        const reasons: string[] = [];

        const nameSimilarity = this.levenshteinSimilarity(
            loc1.name.toLowerCase(),
            loc2.name.toLowerCase()
        );

        if (nameSimilarity > 0.9) {
            reasons.push('Very similar names');
        } else if (nameSimilarity > 0.7) {
            reasons.push('Similar names');
        }

        if (loc1.city && loc2.city && loc1.city.toLowerCase() === loc2.city.toLowerCase()) {
            reasons.push('Same city');
        }

        if (loc1.address && loc2.address) {
            const addressSimilarity = this.levenshteinSimilarity(
                loc1.address.toLowerCase(),
                loc2.address.toLowerCase()
            );
            if (addressSimilarity > 0.8) {
                reasons.push('Very similar addresses');
            }
        }

        return reasons;
    }

    /**
     * Calculates data quality score for a location
     */
    public calculateDataQuality(location: {
        name?: string;
        code?: string;
        type?: string;
        locations?: string[];
        coordinates?: { lat: number; lng: number };
        status?: string;
        createdDate?: string;
        lastModified?: string;
    }): DataQualityScore {
        const issues: DataQualityScore['issues'] = [];
        let completeness = 0;
        let accuracy = 0;
        let consistency = 100;
        let timeliness = 100;

        // Completeness check (40% weight)
        const requiredFields = ['name', 'code', 'type', 'locations', 'status'];
        const filledFields = requiredFields.filter(field => location[field as keyof typeof location]);
        completeness = (filledFields.length / requiredFields.length) * 100;

        if (!location.name) issues.push({ field: 'name', issue: 'Missing name', severity: 'HIGH' });
        if (!location.code) issues.push({ field: 'code', issue: 'Missing code', severity: 'HIGH' });
        if (!location.coordinates) issues.push({ field: 'coordinates', issue: 'Missing coordinates', severity: 'MEDIUM' });

        // Accuracy check (30% weight)
        accuracy = 100;
        if (location.coordinates) {
            if (location.coordinates.lat < -90 || location.coordinates.lat > 90) {
                accuracy -= 50;
                issues.push({ field: 'coordinates.lat', issue: 'Invalid latitude', severity: 'HIGH' });
            }
            if (location.coordinates.lng < -180 || location.coordinates.lng > 180) {
                accuracy -= 50;
                issues.push({ field: 'coordinates.lng', issue: 'Invalid longitude', severity: 'HIGH' });
            }
        }

        // Consistency check (20% weight)
        if (location.code && location.name) {
            const codePrefix = location.code.substring(0, 3).toUpperCase();
            const namePrefix = location.name.substring(0, 3).toUpperCase();
            if (codePrefix !== namePrefix) {
                consistency -= 30;
                issues.push({ field: 'code', issue: 'Code doesn\'t match name', severity: 'LOW' });
            }
        }

        // Timeliness check (10% weight)
        if (location.lastModified) {
            const lastModified = new Date(location.lastModified);
            const daysSinceUpdate = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate > 180) { // 6 months
                timeliness = 60;
                issues.push({ field: 'lastModified', issue: 'Data not updated in 6+ months', severity: 'MEDIUM' });
            } else if (daysSinceUpdate > 90) { // 3 months
                timeliness = 80;
                issues.push({ field: 'lastModified', issue: 'Data not updated in 3+ months', severity: 'LOW' });
            }
        }

        const overall = (completeness * 0.4) + (accuracy * 0.3) + (consistency * 0.2) + (timeliness * 0.1);

        return {
            overall: Math.round(overall),
            completeness: Math.round(completeness),
            accuracy: Math.round(accuracy),
            consistency: Math.round(consistency),
            timeliness: Math.round(timeliness),
            issues
        };
    }
}

export const locationDataQualityService = new LocationDataQualityService();
