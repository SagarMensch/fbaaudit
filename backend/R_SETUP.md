# R Analytics Setup Guide

## Overview
This guide will help you integrate R's advanced statistical capabilities into the application.

## Prerequisites
1. **Windows Environment** (already confirmed)
2. **Python Backend** (already running)
3. **R Statistical Computing Environment** (need to install)

---

## Installation Steps

### Step 1: Install R

1. Download R from: **https://cran.r-project.org/bin/windows/base/**
2. Run the installer (use default options)
3. Verify installation by opening Command Prompt and typing:
   ```bash
   R --version
   ```

### Step 2: Install Required R Packages

Open **R Console** (search for "R" in Windows Start menu) and run:

```r
# Core packages
install.packages(c("jsonlite", "forecast"))

# Benchmarking (BSTS + GARCH)
install.packages(c("bsts", "rugarch"))

# Forecasting (Prophet + Ensemble)
install.packages(c("prophet", "quantregForest"))

# Anomaly Detection (Isolation Forest + SVM)
install.packages(c("isotree", "tsoutliers", "e1071"))

# Carrier Scoring (SEM + Factor Analysis)
install.packages(c("lavaan", "psych"))

# Cost Analysis (GAM + Quantile Regression)
install.packages(c("mgcv", "quantreg", "lme4"))
```

**Note:** This may take 10-15 minutes. Say "yes" to install dependencies.

### Step 3: Install Python rpy2 Package

In your terminal (where Python backend runs):

```bash
pip install rpy2
```

### Step 4: Restart Backend

The backend will automatically detect R and load the analytics service.

```bash
python app.py
```

Look for these messages in the console:
```
✅ rpy2 loaded successfully - R analytics enabled
✅ R Analytics routes registered
```

---

## Verification

### Check R Health

Visit: http://localhost:5000/api/r/health

Expected response if R is working:
```json
{
  "r_available": true,
  "package_status": {
    "benchmarking": {"bsts": true, "rugarch": true, ...},
    ...
  },
  "message": "R analytics ready"
}
```

If R is not available, you'll see:
```json
{
  "r_available": false,
  "message": "R not available - using Python fallbacks"
}
```
**This is OK!** The system will use Python implementations instead.

---

## API Endpoints

Once R is set up, these endpoints become available:

### 1. Rate Benchmarking (BSTS + GARCH)
```
POST /api/r/benchmark
{
  "contract_rates": [3200, 3250, 3300, ...],
  "market_rates": [3100, 3150, 3200, ...],
  "horizon": 6
}
```

### 2. Capacity Forecasting (Prophet)
```
POST /api/r/forecast
{
  "data": [
    {"date": "2024-01-01", "volume": 1200},
    ...
  ],
  "horizon": 12
}
```

### 3. Anomaly Detection (Isolation Forest)
```
POST /api/r/anomaly
{
  "data": [
    {"id": "INV001", "amount": 5000, "weight": 120},
    ...
  ]
}
```

### 4. Carrier Scoring (SEM)
```
POST /api/r/score
{
  "data": [
    {"id": "CARR001", "otd_rate": 95, "cost_index": 85},
    ...
  ]
}
```

### 5. Cost Analysis (GAM)
```
POST /api/r/cost
{
  "data": [
    {"cost": 5000, "distance": 500, "weight": 1000},
    ...
  ]
}
```

---

## Troubleshooting

### "rpy2 not found"
- Run: `pip install rpy2`
- Restart backend

### "Required package not installed"
- Open **R Console**
- Run: `install.packages("package_name")`
- Restart backend

### R is installed but not detected
- Add R to PATH: `C:\Program Files\R\R-4.x.x\bin\x64`
- Restart computer
- Restart backend

---

## Fallback Mode

**Don't worry if R installation fails!**

The system is designed with **graceful degradation**:
- If R is unavailable, Python fallbacks are used automatically
- All endpoints still work, just with simpler statistical methods
- No features break, only statistical sophistication is reduced

---

## Performance Notes

- R analytics add **50-200ms latency** per request (worth it for accuracy)
- Results are cached in Redis (if configured) for repeat queries
- First request may be slower as R initializes packages

---

## Next Steps

After installation:
1. Verify health check
2. Test each endpoint with sample data
3. Frontend will automatically use R-powered analytics!
