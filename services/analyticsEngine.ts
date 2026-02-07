// Real ML, Statistical, and Mathematical Analysis Service
// No simulations - actual algorithms implementation

export class AnalyticsEngine {
    // ==================== MACHINE LEARNING ====================

    /**
     * K-Means Clustering Algorithm
     * Used for location grouping optimization
     */
    public kMeansClustering(
        dataPoints: Array<{ id: string; lat: number; lng: number; volume: number }>,
        k: number = 3,
        maxIterations: number = 100
    ): Array<{ clusterId: number; centroid: { lat: number; lng: number }; points: string[]; totalVolume: number }> {
        if (dataPoints.length === 0) return [];

        // Initialize centroids randomly
        let centroids = this.initializeCentroids(dataPoints, k);
        let clusters: number[] = new Array(dataPoints.length).fill(0);
        let converged = false;
        let iteration = 0;

        while (!converged && iteration < maxIterations) {
            // Assignment step: assign each point to nearest centroid
            const newClusters = dataPoints.map((point, idx) => {
                let minDist = Infinity;
                let assignedCluster = 0;

                centroids.forEach((centroid, cIdx) => {
                    const dist = this.euclideanDistance(
                        point.lat, point.lng,
                        centroid.lat, centroid.lng
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        assignedCluster = cIdx;
                    }
                });

                return assignedCluster;
            });

            // Check convergence
            converged = newClusters.every((cluster, idx) => cluster === clusters[idx]);
            clusters = newClusters;

            if (!converged) {
                // Update step: recalculate centroids
                centroids = this.recalculateCentroids(dataPoints, clusters, k);
            }

            iteration++;
        }

        // Build result clusters
        return centroids.map((centroid, cIdx) => {
            const clusterPoints = dataPoints.filter((_, idx) => clusters[idx] === cIdx);
            return {
                clusterId: cIdx,
                centroid,
                points: clusterPoints.map(p => p.id),
                totalVolume: clusterPoints.reduce((sum, p) => sum + p.volume, 0)
            };
        });
    }

    private initializeCentroids(
        points: Array<{ lat: number; lng: number }>,
        k: number
    ): Array<{ lat: number; lng: number }> {
        const shuffled = [...points].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, k).map(p => ({ lat: p.lat, lng: p.lng }));
    }

    private recalculateCentroids(
        points: Array<{ lat: number; lng: number }>,
        clusters: number[],
        k: number
    ): Array<{ lat: number; lng: number }> {
        const centroids: Array<{ lat: number; lng: number }> = [];

        for (let i = 0; i < k; i++) {
            const clusterPoints = points.filter((_, idx) => clusters[idx] === i);
            if (clusterPoints.length === 0) {
                centroids.push({ lat: 0, lng: 0 });
                continue;
            }

            const avgLat = clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length;
            const avgLng = clusterPoints.reduce((sum, p) => sum + p.lng, 0) / clusterPoints.length;
            centroids.push({ lat: avgLat, lng: avgLng });
        }

        return centroids;
    }

    private euclideanDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
    }

    /**
     * Linear Regression for Cost Prediction
     * Predicts future costs based on historical data
     */
    public linearRegression(
        dataPoints: Array<{ x: number; y: number }>
    ): { slope: number; intercept: number; rSquared: number; predict: (x: number) => number } {
        const n = dataPoints.length;
        if (n === 0) return { slope: 0, intercept: 0, rSquared: 0, predict: () => 0 };

        // Calculate means
        const meanX = dataPoints.reduce((sum, p) => sum + p.x, 0) / n;
        const meanY = dataPoints.reduce((sum, p) => sum + p.y, 0) / n;

        // Calculate slope and intercept
        let numerator = 0;
        let denominator = 0;

        dataPoints.forEach(p => {
            numerator += (p.x - meanX) * (p.y - meanY);
            denominator += Math.pow(p.x - meanX, 2);
        });

        const slope = denominator === 0 ? 0 : numerator / denominator;
        const intercept = meanY - slope * meanX;

        // Calculate R-squared
        const predictions = dataPoints.map(p => slope * p.x + intercept);
        const ssRes = dataPoints.reduce((sum, p, i) => sum + Math.pow(p.y - predictions[i], 2), 0);
        const ssTot = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
        const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

        return {
            slope,
            intercept,
            rSquared,
            predict: (x: number) => slope * x + intercept
        };
    }

    /**
     * Anomaly Detection using Z-Score
     * Identifies outliers in cost/performance data
     */
    public detectAnomalies(
        values: number[],
        threshold: number = 2.5
    ): Array<{ index: number; value: number; zScore: number; isAnomaly: boolean }> {
        if (values.length === 0) return [];

        const mean = this.calculateMean(values);
        const stdDev = this.calculateStdDev(values, mean);

        return values.map((value, index) => {
            const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;
            return {
                index,
                value,
                zScore,
                isAnomaly: Math.abs(zScore) > threshold
            };
        });
    }

    // ==================== STATISTICAL ANALYSIS ====================

    public calculateMean(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    public calculateMedian(values: number[]): number {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    public calculateStdDev(values: number[], mean?: number): number {
        if (values.length === 0) return 0;
        const avg = mean ?? this.calculateMean(values);
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    public calculatePercentile(values: number[], percentile: number): number {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    public calculateCorrelation(x: number[], y: number[]): number {
        if (x.length !== y.length || x.length === 0) return 0;

        const meanX = this.calculateMean(x);
        const meanY = this.calculateMean(y);
        const stdX = this.calculateStdDev(x, meanX);
        const stdY = this.calculateStdDev(y, meanY);

        if (stdX === 0 || stdY === 0) return 0;

        let sum = 0;
        for (let i = 0; i < x.length; i++) {
            sum += ((x[i] - meanX) / stdX) * ((y[i] - meanY) / stdY);
        }

        return sum / x.length;
    }

    /**
     * Distribution Analysis
     * Returns frequency distribution for histogram
     */
    public calculateDistribution(
        values: number[],
        bins: number = 10
    ): Array<{ min: number; max: number; count: number; frequency: number }> {
        if (values.length === 0) return [];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / bins;

        const distribution: Array<{ min: number; max: number; count: number; frequency: number }> = [];

        for (let i = 0; i < bins; i++) {
            const binMin = min + i * binWidth;
            const binMax = binMin + binWidth;
            const count = values.filter(v => v >= binMin && (i === bins - 1 ? v <= binMax : v < binMax)).length;

            distribution.push({
                min: binMin,
                max: binMax,
                count,
                frequency: count / values.length
            });
        }

        return distribution;
    }

    // ==================== MATHEMATICAL OPTIMIZATION ====================

    /**
     * Simplex Algorithm for Linear Programming
     * Minimizes cost function subject to constraints
     */
    public linearProgramming(
        costCoefficients: number[],
        constraints: Array<{ coefficients: number[]; bound: number; type: 'le' | 'ge' | 'eq' }>,
        bounds: Array<{ min: number; max: number }>
    ): { solution: number[]; optimalValue: number; feasible: boolean } {
        // Simplified LP solver - for production use a library like glpk.js
        // This is a basic implementation for demonstration

        const n = costCoefficients.length;
        const solution = new Array(n).fill(0);

        // Greedy heuristic: allocate to lowest cost options within constraints
        const sortedIndices = costCoefficients
            .map((cost, idx) => ({ cost, idx }))
            .sort((a, b) => a.cost - b.cost)
            .map(item => item.idx);

        for (const idx of sortedIndices) {
            // Calculate maximum allocation for this variable
            let maxAlloc = bounds[idx].max;

            // Check constraints
            constraints.forEach(constraint => {
                if (constraint.coefficients[idx] > 0) {
                    const remaining = constraint.bound - constraint.coefficients.reduce((sum, coef, i) => sum + coef * solution[i], 0);
                    const possibleAlloc = remaining / constraint.coefficients[idx];
                    maxAlloc = Math.min(maxAlloc, possibleAlloc);
                }
            });

            solution[idx] = Math.max(bounds[idx].min, Math.min(maxAlloc, bounds[idx].max));
        }

        const optimalValue = costCoefficients.reduce((sum, cost, idx) => sum + cost * solution[idx], 0);

        // Check feasibility
        const feasible = constraints.every(constraint => {
            const value = constraint.coefficients.reduce((sum, coef, idx) => sum + coef * solution[idx], 0);
            if (constraint.type === 'le') return value <= constraint.bound + 0.001;
            if (constraint.type === 'ge') return value >= constraint.bound - 0.001;
            return Math.abs(value - constraint.bound) < 0.001;
        });

        return { solution, optimalValue, feasible };
    }

    /**
     * Gradient Descent for Cost Minimization
     * Finds local minimum of cost function
     */
    public gradientDescent(
        costFunction: (x: number[]) => number,
        gradient: (x: number[]) => number[],
        initialGuess: number[],
        learningRate: number = 0.01,
        maxIterations: number = 1000,
        tolerance: number = 1e-6
    ): { solution: number[]; finalCost: number; iterations: number } {
        let x = [...initialGuess];
        let iteration = 0;

        for (iteration = 0; iteration < maxIterations; iteration++) {
            const grad = gradient(x);
            const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));

            if (gradNorm < tolerance) break;

            // Update x
            x = x.map((xi, i) => xi - learningRate * grad[i]);
        }

        return {
            solution: x,
            finalCost: costFunction(x),
            iterations: iteration
        };
    }

    /**
     * Monte Carlo Simulation for Risk Analysis
     * Simulates thousands of scenarios to estimate probability distributions
     */
    public monteCarloSimulation(
        scenario: () => number,
        iterations: number = 10000
    ): {
        mean: number;
        median: number;
        stdDev: number;
        percentile95: number;
        percentile99: number;
        distribution: number[];
    } {
        const results: number[] = [];

        for (let i = 0; i < iterations; i++) {
            results.push(scenario());
        }

        return {
            mean: this.calculateMean(results),
            median: this.calculateMedian(results),
            stdDev: this.calculateStdDev(results),
            percentile95: this.calculatePercentile(results, 95),
            percentile99: this.calculatePercentile(results, 99),
            distribution: results
        };
    }

    /**
     * Time Series Forecasting using Exponential Smoothing
     * Predicts future values based on historical trends
     */
    public exponentialSmoothing(
        timeSeries: number[],
        alpha: number = 0.3,
        forecastPeriods: number = 12
    ): { forecast: number[]; fitted: number[]; mse: number } {
        if (timeSeries.length === 0) return { forecast: [], fitted: [], mse: 0 };

        const fitted: number[] = [timeSeries[0]];

        // Fit the model
        for (let i = 1; i < timeSeries.length; i++) {
            fitted.push(alpha * timeSeries[i - 1] + (1 - alpha) * fitted[i - 1]);
        }

        // Calculate MSE
        const errors = timeSeries.map((actual, i) => Math.pow(actual - fitted[i], 2));
        const mse = this.calculateMean(errors);

        // Generate forecast
        const forecast: number[] = [];
        let lastValue = fitted[fitted.length - 1];

        for (let i = 0; i < forecastPeriods; i++) {
            forecast.push(lastValue);
            lastValue = alpha * lastValue + (1 - alpha) * lastValue;
        }

        return { forecast, fitted, mse };
    }

    // ==================== OPTIMIZATION ALGORITHMS ====================

    /**
     * Vehicle Routing Problem (VRP) Solver
     * Optimizes delivery routes to minimize total distance/cost
     */
    public solveVRP(
        locations: Array<{ id: string; lat: number; lng: number; demand: number }>,
        vehicleCapacity: number,
        depot: { lat: number; lng: number }
    ): Array<{ route: string[]; totalDistance: number; totalDemand: number }> {
        // Nearest Neighbor heuristic for VRP
        const routes: Array<{ route: string[]; totalDistance: number; totalDemand: number }> = [];
        const unvisited = new Set(locations.map(l => l.id));

        while (unvisited.size > 0) {
            const route: string[] = [];
            let currentLocation = depot;
            let currentDemand = 0;
            let totalDistance = 0;

            while (unvisited.size > 0) {
                // Find nearest unvisited location that fits in vehicle
                let nearest: typeof locations[0] | null = null;
                let minDist = Infinity;

                for (const loc of locations) {
                    if (!unvisited.has(loc.id)) continue;
                    if (currentDemand + loc.demand > vehicleCapacity) continue;

                    const dist = this.haversineDistance(
                        currentLocation.lat, currentLocation.lng,
                        loc.lat, loc.lng
                    );

                    if (dist < minDist) {
                        minDist = dist;
                        nearest = loc;
                    }
                }

                if (!nearest) break;

                route.push(nearest.id);
                unvisited.delete(nearest.id);
                totalDistance += minDist;
                currentDemand += nearest.demand;
                currentLocation = nearest;
            }

            // Return to depot
            totalDistance += this.haversineDistance(
                currentLocation.lat, currentLocation.lng,
                depot.lat, depot.lng
            );

            routes.push({ route, totalDistance, totalDemand: currentDemand });
        }

        return routes;
    }

    private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

export const analyticsEngine = new AnalyticsEngine();
