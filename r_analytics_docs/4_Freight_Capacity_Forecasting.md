# R Analytics Module 4: Freight Capacity Forecasting

## 1. Technical Significance
The **Capacity Forecast** module predicts future truck demand to prevent shortages. Simple Excel trends fail because they don't account for complex seasonality (e.g., Diwali spikes, End-of-Quarter pushes). We use an **Ensemble Model** in R that averages two powerful forecasting engines: **Prophet** (by Meta) and **ETS** (Exponential Smoothing).

## 2. The R Technique: Prophet + ETS Ensemble
Ensembling reduces error by cancelling out the biases of individual models.

### A. Facebook Prophet
*   **Purpose:** To handle complex seasonality and holidays.
*   **Algorithm:** `prophet` package in R.
*   **Mechanism:** It models time series as:
    *   *Growth:* A saturated growth trend.
    *   *Seasonality:* Fourier series for annual/weekly cycles.
    *   *Holidays:* Explicitly models Indian holidays (Diwali, Eid, Independence Day) which cause massive logistics spikes.

### B. ETS (Error, Trend, Seasonal)
*   **Purpose:** To capture short-term momentum.
*   **Algorithm:** `forecast::ets()` in R.
*   **Mechanism:** It weights recent observations more heavily than older ones (exponential decay). It is excellent for adapting quickly to recent trend changes.

### The Ensemble
*   **Final Forecast = (Prophet_Prediction + ETS_Prediction) / 2**
*   This approach is widely considered "State of the Art" for operational supply chain forecasting.

## 3. Workflow & Architecture
1.  **Data Ingestion:**
    *   System queries aggregate shipment volumes by week for the last 2 years.
2.  **R Execution (`forecast.R` - *internal logic*):**
    *   `backend/r_analytics_service.py` invokes R.
3.  **Statistical Processing:**
    *   **Prophet:** Fits the holiday-aware model.
    *   **ETS:** Fits the smoothing model.
    *   **Combination:** Averages the results.
    *   **Confidence:** Calculates 80% and 95% prediction intervals (The "Cone of Uncertainty").
4.  **Output:**
    *   R returns a 12-week forecast vector with upper/lower bounds.

## 4. Sample Data & Results

### Input Data (Weekly Volumes)
```json
[
  {"date": "2024-01-01", "trucks": 450},
  {"date": "2024-01-08", "trucks": 465},
  ...
  {"date": "2025-10-20", "trucks": 850} // Pre-Diwali spike
]
```

### R Processing Output
```json
{
  "forecast_dates": ["2025-11-01", "2025-11-08", ...],
  "predicted_volume": [900, 920, 880, ...],
  "lower_bound": [850, 870, ...],
  "upper_bound": [950, 970, ...],
  "holiday_effect": "+15%" // Flagged due to Diwali
}
```

### User Facing Result
*   **Forecast (Week 45):** 920 Trucks Needed.
*   **Alert:** "Demand exceeds Contracted Capacity (800)."
*   **Recommendation:** "Secure 120 spot trucks now before rates spike."
