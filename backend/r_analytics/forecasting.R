# Advanced Capacity Forecasting with Facebook Prophet + Ensemble Methods
# Provides probabilistic forecasts with multiple scenarios

library(jsonlite)

# Try to load required packages
tryCatch({
  library(prophet)        # Facebook's forecasting library
  library(forecast)       # Classical forecasting methods
  library(quantregForest) # Quantile regression forests
}, error = function(e) {
  stop("Required R packages not installed. Please run:\n",
       "install.packages(c('prophet', 'forecast', 'quantregForest'))")
})

#' Forecast Capacity using Prophet + Ensemble
#' 
#' @param data JSON string with historical data [{date, volume}, ...]
#' @param horizon Forecast horizon in months
#' @return List with forecast, quantiles, components
forecast_capacity <- function(data, horizon = 12) {
  
  cat("[R] Starting capacity forecast with Prophet\n")
  
  # Parse JSON data
  df <- fromJSON(data)
  
  # Ensure proper date format
  df$ds <- as.Date(df$date)
  df$y <- as.numeric(df$volume)
  
  # Remove date column, keep ds and y for prophet
  df <- df[, c("ds", "y")]
  
  # ========================================================================
  # METHOD 1: Facebook Prophet (Bayesian)
  # ========================================================================
  
  prophet_result <- NULL
  
  tryCatch({
    # Create and fit Prophet model
    m <- prophet(
      df,
      growth = "linear",
      yearly.seasonality = TRUE,
      weekly.seasonality = FALSE,
      daily.seasonality = FALSE,
      changepoint.prior.scale = 0.05  # Flexibility of trend changes
    )
    
    # Make future dataframe
    future <- make_future_dataframe(m, periods = horizon, freq = "month")
    
    # Forecast
    forecast_df <- predict(m, future)
    
    # Extract forecast (only future values)
    n_hist <- nrow(df)
    forecast_vals <- tail(forecast_df$yhat, horizon)
    lower_80 <- tail(forecast_df$yhat_lower, horizon)
    upper_80 <- tail(forecast_df$yhat_upper, horizon)
    
    # Get components (trend, seasonality)
    trend <- tail(forecast_df$trend, horizon)
    yearly <- if("yearly" %in% names(forecast_df)) tail(forecast_df$yearly, horizon) else rep(0, horizon)
    
    prophet_result <- list(
      forecast = as.numeric(forecast_vals),
      lower = as.numeric(lower_80),
      upper = as.numeric(upper_80),
      trend = as.numeric(trend),
      seasonality = as.numeric(yearly)
    )
    
    cat("[R] Prophet forecast completed\n")
    
  }, error = function(e) {
    cat("[R] Prophet failed:", e$message, "\n")
  })
  
  # ========================================================================
  # METHOD 2: ETS (Exponential Smoothing) as backup/ensemble
  # ========================================================================
  
  ets_result <- NULL
  
  tryCatch({
    # Convert to ts object
    ts_data <- ts(df$y, frequency = 12)
    
    # Fit ETS model
    ets_fit <- ets(ts_data)
    
    # Forecast
    ets_forecast <- forecast(ets_fit, h = horizon)
    
    ets_result <- list(
      forecast = as.numeric(ets_forecast$mean),
      lower = as.numeric(ets_forecast$lower[, 2]),  # 95% interval
      upper = as.numeric(ets_forecast$upper[, 2])
    )
    
    cat("[R] ETS forecast completed\n")
    
  }, error = function(e) {
    cat("[R] ETS failed:", e$message, "\n")
  })
  
  # ========================================================================
  # ENSEMBLE: Combine forecasts if both succeeded
  # ========================================================================
  
  if (!is.null(prophet_result) && !is.null(ets_result)) {
    # Weight Prophet more (0.7) as it's generally better for capacity planning
    final_forecast <- 0.7 * prophet_result$forecast + 0.3 * ets_result$forecast
    final_lower <- 0.7 * prophet_result$lower + 0.3 * ets_result$lower
    final_upper <- 0.7 * prophet_result$upper + 0.3 * ets_result$upper
    method <- "Prophet+ETS Ensemble"
    
  } else if (!is.null(prophet_result)) {
    final_forecast <- prophet_result$forecast
    final_lower <- prophet_result$lower
    final_upper <- prophet_result$upper
    method <- "Prophet Only"
    
  } else if (!is.null(ets_result)) {
    final_forecast <- ets_result$forecast
    final_lower <- ets_result$lower
    final_upper <- ets_result$upper
    method <- "ETS Only"
    
  } else {
    # Fallback: simple growth rate
    avg_growth <- mean(diff(df$y) / head(df$y, -1), na.rm = TRUE)
    last_val <- tail(df$y, 1)
    final_forecast <- last_val * (1 + avg_growth) ^ (1:horizon)
    final_lower <- final_forecast * 0.8
    final_upper <- final_forecast * 1.2
    method <- "Simple Growth Fallback"
  }
  
  # ========================================================================
  # SCENARIOS: Best/Base/Worst case
  # ========================================================================
  
  base_case <- final_forecast
  best_case <- final_upper
  worst_case <- final_lower
  
  # ========================================================================
  # RETURN RESULTS
  # ========================================================================
  
  result <- list(
    forecast = as.numeric(base_case),
    lower_80 = as.numeric(worst_case),
    upper_80 = as.numeric(best_case),
    
    # Scenarios
    scenarios = list(
      base = as.numeric(base_case),
      optimistic = as.numeric(best_case),
      pessimistic = as.numeric(worst_case)
    ),
    
    # Components (if Prophet succeeded)
    components = if(!is.null(prophet_result)) {
      list(
        trend = as.numeric(prophet_result$trend),
        seasonality = as.numeric(prophet_result$seasonality)
      )
    } else NULL,
    
    # Metadata
    method = method,
    data_points = nrow(df),
    forecast_horizon = horizon
  )
  
  cat("[R] Capacity forecast complete - method:", method, "\n")
  
  return(result)
}

cat("[R] forecasting.R loaded - Prophet + Ensemble ready\n")
