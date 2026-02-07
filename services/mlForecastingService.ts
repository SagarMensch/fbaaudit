
// Statistical Forecasting Library (Holt-Winters / Triple Exponential Smoothing)

export interface DataPoint {
    date: string; // YYYY-MM
    value: number;
    type: 'HISTORICAL' | 'FORECAST';
    lowerBound?: number;
    upperBound?: number;
}

/**
 * Holt-Winters Triple Exponential Smoothing
 * Matches seasonality and trend to predict future values.
 * 
 * @param data Historical time series data
 * @param alpha Level smoothing factor (0-1)
 * @param beta Trend smoothing factor (0-1)
 * @param gamma Seasonal smoothing factor (0-1)
 * @param seasonLength Length of valid season (e.g. 12 for monthly data)
 * @param forecastLength Number of periods to predict
 */
export const predictSpend = (
    history: number[],
    alpha: number = 0.4,
    beta: number = 0.1,
    gamma: number = 0.3,
    seasonLength: number = 12,
    forecastLength: number = 6
): { forecast: number[], confidence: { lower: number[], upper: number[] } } => {

    if (history.length < seasonLength * 2) {
        // Not enough data for full seasonal, fallback to simple linear regression simulation
        const last = history[history.length - 1];
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        return {
            forecast: Array(forecastLength).fill(0).map((_, i) => last * (1 + (i * 0.02))), // 2% growth fallback
            confidence: { lower: [], upper: [] }
        };
    }

    const levels: number[] = [];
    const trends: number[] = [];
    const seasonals: number[] = [];
    const forecast: number[] = [];

    // Initialize
    // Seasonal indices (simplified initial)
    let seasonParams = new Array(seasonLength).fill(0).map((_, i) => {
        // Compare each month to average
        return history[i] / (history.reduce((a, b) => a + b, 0) / history.length);
    });

    // Initial Level and Trend
    let level = history[0];
    let trend = (history[seasonLength] - history[0]) / seasonLength;

    levels.push(level);
    trends.push(trend);

    // Train on History
    for (let i = 0; i < history.length; i++) {
        const val = history[i];
        const lastLevel = i === 0 ? level : levels[i - 1];
        const lastTrend = i === 0 ? trend : trends[i - 1];
        const lastSeason = seasonParams[i % seasonLength];

        // Update Level
        const newLevel = alpha * (val / lastSeason) + (1 - alpha) * (lastLevel + lastTrend);

        // Update Trend
        const newTrend = beta * (newLevel - lastLevel) + (1 - beta) * lastTrend;

        // Update Seasonal
        const newSeason = gamma * (val / newLevel) + (1 - gamma) * lastSeason;

        levels.push(newLevel);
        trends.push(newTrend);
        seasonParams[i % seasonLength] = newSeason;
    }

    // Forecast
    const lastL = levels[levels.length - 1];
    const lastT = trends[trends.length - 1];
    const lower: number[] = [];
    const upper: number[] = [];

    for (let m = 1; m <= forecastLength; m++) {
        const seasonIdx = (history.length + m - 1) % seasonLength;
        const seasonalFactor = seasonParams[seasonIdx];

        const pred = (lastL + m * lastT) * seasonalFactor;
        forecast.push(pred);

        // Confidence Interval (Simulation based on residual variance of training)
        // Real implementation would calculate sigma residuals. We approximate.
        const volatility = 0.05 * m; // Uncertainty grows with time
        lower.push(pred * (1 - volatility));
        upper.push(pred * (1 + volatility));
    }

    return { forecast, confidence: { lower, upper } };
};

// Generate Mock Historical Data (2 Years) with Pattern
export const generateHistoricalData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    const today = new Date();
    // Start 24 months ago
    const start = new Date(today);
    start.setMonth(start.getMonth() - 24);

    // Base Trend: Growth
    // Seasonality: Spikes in Nov/Dec (Peak), Low in Feb
    for (let i = 0; i < 24; i++) {
        const d = new Date(start);
        d.setMonth(start.getMonth() + i);
        const month = d.getMonth(); // 0-11

        let base = 1200000 + (i * 15000); // Organic Growth
        let multiplier = 1.0;

        // Q4 Peak Season
        if (month === 10 || month === 11) multiplier = 1.4;
        // Q1 Slow Season
        if (month === 1) multiplier = 0.8;
        if (month === 6) multiplier = 1.1; // Summer rush

        const noise = (Math.random() - 0.5) * 50000;
        const val = (base * multiplier) + noise;

        data.push({
            date: `${d.getFullYear()}-${String(month + 1).padStart(2, '0')}`,
            value: Math.round(val),
            type: 'HISTORICAL'
        });
    }
    return data;
};

export const getForecastAnalytics = () => {
    const historyData = generateHistoricalData();
    const values = historyData.map(d => d.value);

    // Predict next 6 months
    const { forecast, confidence } = predictSpend(values, 0.4, 0.4, 0.5, 12, 6); // High Alpha/Beta for reactiveness

    const predictions: DataPoint[] = forecast.map((val, i) => {
        const lastDate = new Date(historyData[historyData.length - 1].date);
        lastDate.setMonth(lastDate.getMonth() + (i + 1));
        return {
            date: `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`,
            value: Math.round(val),
            type: 'FORECAST',
            lowerBound: Math.round(confidence.lower[i]),
            upperBound: Math.round(confidence.upper[i])
        };
    });

    return [...historyData, ...predictions];
};
