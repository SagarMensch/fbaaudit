# Advanced Rate Benchmarking with Bayesian Structural Time Series (BSTS) and GARCH
# Provides volatility forecasts and confidence intervals for rate analysis

library(jsonlite)

# Try to load required packages, provide helpful error if missing
tryCatch({
  library(bsts)        # Bayesian Structural Time Series
  library(rugarch)     # GARCH volatility modeling
  library(forecast)    # Time series utilities
}, error = function(e) {
  stop("Required R packages not installed. Please run:\n",
       "install.packages(c('bsts', 'rugarch', 'forecast'))")
})

#' Benchmark Analysis using BSTS + GARCH
#' 
#' @param contract_rates Numeric vector of historical contract rates
#' @param market_rates Numeric vector of historical market rates  
#' @param horizon Forecast horizon (default 6 months)
#' @return List with forecast, intervals, volatility
benchmark_analysis <- function(contract_rates, market_rates, horizon = 6) {
  
  cat("[R] Starting benchmark analysis with BSTS + GARCH\n")
  
  # Convert to numeric if needed
  contract_rates <- as.numeric(contract_rates)
  market_rates <- as.numeric(market_rates)
  
  # Ensure we have enough data
  if (length(contract_rates) < 12) {
    warning("Insufficient data for robust analysis (need 12+ points)")
    return(list(
      method = "insufficient_data",
      forecast = rep(mean(contract_rates, na.rm = TRUE), horizon),
      lower_80 = rep(mean(contract_rates, na.rm = TRUE) * 0.9, horizon),
      upper_80 = rep(mean(contract_rates, na.rm = TRUE) * 1.1, horizon)
    ))
  }
  
  # ========================================================================
  # PART 1: Bayesian Structural Time Series (BSTS)
  # ========================================================================
  
  tryCatch({
    # Create time series object
    ts_contract <- ts(contract_rates, frequency = 12)
    
    # Build BSTS model components
    ss <- AddLocalLinearTrend(list(), ts_contract)  # Trend
    ss <- AddSeasonal(ss, ts_contract, nseasons = 12)  # Seasonality
    
    # Fit BSTS model (500 MCMC iterations for balance of speed/accuracy)
    bsts_model <- bsts(ts_contract, state.specification = ss, niter = 500, ping = 0)
    
    # Generate forecast
    bsts_pred <- predict(bsts_model, horizon = horizon, burn = 100)
    
    # Extract forecast and credible intervals
    forecast_mean <- colMeans(bsts_pred$distribution)
    lower_80 <- apply(bsts_pred$distribution, 2, quantile, probs = 0.10)
    upper_80 <- apply(bsts_pred$distribution, 2, quantile, probs = 0.90)
    lower_95 <- apply(bsts_pred$distribution, 2, quantile, probs = 0.025)
    upper_95 <- apply(bsts_pred$distribution, 2, quantile, probs = 0.975)
    
    cat("[R] BSTS forecast completed\n")
    
  }, error = function(e) {
    cat("[R] BSTS failed, using simpler ETS fallback:", e$message, "\n")
    # Fallback to Exponential Smoothing State Space
    ets_model <- ets(ts_contract)
    ets_pred <- forecast(ets_model, h = horizon)
    forecast_mean <- as.numeric(ets_pred$mean)
    lower_80 <- as.numeric(ets_pred$lower[, 1])
    upper_80 <- as.numeric(ets_pred$upper[, 1])
    lower_95 <- as.numeric(ets_pred$lower[, 2])
    upper_95 <- as.numeric(ets_pred$upper[, 2])
  })
  
  # ========================================================================
  # PART 2: GARCH Volatility Modeling
  # ========================================================================
  
  volatility_forecast <- NULL
  garch_success <- FALSE
  
  tryCatch({
    # Calculate returns for GARCH
    returns <- diff(log(contract_rates))
    
    # Specify GARCH(1,1) model
    spec <- ugarchspec(
      variance.model = list(model = "sGARCH", garchOrder = c(1, 1)),
      mean.model = list(armaOrder = c(0, 0), include.mean = TRUE)
    )
    
    # Fit GARCH model
    garch_fit <- ugarchfit(spec, returns, solver = "hybrid")
    
    # Forecast volatility
    garch_pred <- ugarchforecast(garch_fit, n.ahead = horizon)
    volatility_forecast <- as.numeric(sigma(garch_pred))
    
    cat("[R] GARCH volatility forecast completed\n")
    garch_success <- TRUE
    
  }, error = function(e) {
    cat("[R] GARCH failed, using standard deviation:", e$message, "\n")
    volatility_forecast <- rep(sd(contract_rates, na.rm = TRUE), horizon)
  })
  
  # ========================================================================
  # PART 3: Market Comparison & Insights
  # ========================================================================
  
  # Calculate percentage difference from market
  recent_contract <- tail(contract_rates, 1)
  recent_market <- tail(market_rates, 1)
  market_diff_pct <- ((recent_contract - recent_market) / recent_market) * 100
  
  # Determine if contract is favorable
  is_favorable <- recent_contract < recent_market
  
  # ========================================================================
  # RETURN RESULTS
  # ========================================================================
  
  result <- list(
    # Forecast values
    forecast = as.numeric(forecast_mean),
    lower_80 = as.numeric(lower_80),
    upper_80 = as.numeric(upper_80),
    lower_95 = as.numeric(lower_95),
    upper_95 = as.numeric(upper_95),
    
    # Volatility
    volatility = as.numeric(volatility_forecast),
    
    # Market comparison
    market_diff_percent = round(market_diff_pct, 2),
    is_favorable = is_favorable,
    
    # Metadata
    method = if(garch_success) "BSTS+GARCH" else "BSTS+SD",
    data_points = length(contract_rates),
    forecast_horizon = horizon
  )
  
  cat("[R] Benchmark analysis complete - method:", result$method, "\n")
  
  return(result)
}

# Test function (for development)
test_benchmark <- function() {
  # Simulate data
  contract <- c(3200, 3250, 3300, 3250, 3200, 3350, 3400, 3450, 3500, 3550, 3600, 3650)
  market <- c(3100, 3150, 3200, 3250, 3300, 3350, 3400, 3450, 3500, 3550, 3600, 3650)
  
  result <- benchmark_analysis(contract, market, horizon = 6)
  print(toJSON(result, pretty = TRUE, auto_unbox = TRUE))
}

cat("[R] benchmarking.R loaded - BSTS + GARCH ready\n")
