# Advanced Cost-to-Serve Analysis using GAM + Bayesian Methods
# Models non-linear cost relationships and uncertainty

library(jsonlite)

# Try to load required packages
tryCatch({
  library(mgcv)         # Generalized Additive Models
  library(quantreg)     # Quantile regression
  library(lme4)         # Mixed effects models
}, error = function(e) {
  stop("Required R packages not installed. Please run:\n",
       "install.packages(c('mgcv', 'quantreg', 'lme4'))")
})

#' Analyze Cost-to-Serve using GAM + Quantile Regression
#' 
#' @param data JSON string with shipment cost data
#' @return List with cost drivers, elasticities, predictions
analyze_costs <- function(data) {
  
  cat("[R] Starting cost analysis with GAM\n")
  
  # Parse JSON
  df <- fromJSON(data)
  
  # Ensure we have a cost column
  if (!"cost" %in% names(df)) {
    stop("Data must contain 'cost' column")
  }
  
  n <- nrow(df)
  
  # ========================================================================
  # METHOD 1: Generalized Additive Model (GAM)
  # Allows non-linear smooth effects
  # ========================================================================
  
  gam_result <- NULL
  
  tryCatch({
    # Identify continuous predictors
    numeric_preds <- setdiff(names(df)[sapply(df, is.numeric)], "cost")
    
    if (length(numeric_preds) == 0) {
      stop("No numeric predictors found")
    }
    
    # Build GAM formula with smooth terms
    # s() = smooth spline
    formula_str <- paste("cost ~", paste(paste0("s(", numeric_preds, ")"), collapse = " + "))
    gam_formula <- as.formula(formula_str)
    
    # Fit GAM
    gam_model <- gam(gam_formula, data = df, method = "REML")
    
    # Get summary
    gam_summary <- summary(gam_model)
    
    # Extract deviance explained (R-squared equivalent)
    r_squared <- gam_summary$r.sq
    
    # Get predictions
    gam_predictions <- predict(gam_model, newdata = df)
    
    cat("[R] GAM fitted - R²:", round(r_squared, 3), "\n")
    
    gam_result <- list(
      r_squared = r_squared,
      predictions = as.numeric(gam_predictions),
      residuals = as.numeric(residuals(gam_model))
    )
    
  }, error = function(e) {
    cat("[R] GAM failed:", e$message, "\n")
  })
  
  # ========================================================================
  # METHOD 2: Quantile Regression (model entire distribution)
  # ========================================================================
  
  quantile_result <- NULL
  
  tryCatch({
    # Fit quantile regression for median (0.5) and tails (0.1, 0.9)
    numeric_preds <- setdiff(names(df)[sapply(df, is.numeric)], "cost")
    
    if (length(numeric_preds) > 0) {
      formula_str <- paste("cost ~", paste(numeric_preds, collapse = " + "))
      qr_formula <- as.formula(formula_str)
      
      # Fit for 10th, 50th, 90th percentiles
      qr_10 <- rq(qr_formula, data = df, tau = 0.1)
      qr_50 <- rq(qr_formula, data = df, tau = 0.5)
      qr_90 <- rq(qr_formula, data = df, tau = 0.9)
      
      # Get predictions
      pred_10 <- predict(qr_10, newdata = df)
      pred_50 <- predict(qr_50, newdata = df)
      pred_90 <- predict(qr_90, newdata = df)
      
      cat("[R] Quantile regression completed\n")
      
      quantile_result <- list(
        p10 = as.numeric(pred_10),
        median = as.numeric(pred_50),
        p90 = as.numeric(pred_90)
      )
    }
    
  }, error = function(e) {
    cat("[R] Quantile regression failed:", e$message, "\n")
  })
  
  # ========================================================================
  # COST DRIVERS: Identify most important variables
  # ========================================================================
  
  drivers <- list()
  
  if (!is.null(gam_result)) {
    # From GAM: extract significance of smooth terms
    smooth_terms <- gam_summary$s.table
    
    if (!is.null(smooth_terms) && nrow(smooth_terms) > 0) {
      for (i in 1:nrow(smooth_terms)) {
        var_name <- rownames(smooth_terms)[i]
        var_name_clean <- gsub("s\\(|\\)", "", var_name)  # Remove s()
        
        drivers[[var_name_clean]] <- list(
          significance = smooth_terms[i, "p-value"],
          edf = smooth_terms[i, "edf"]  # Effective degrees of freedom (non-linearity measure)
        )
      }
    }
  }
  
  # ========================================================================
  # COST ELASTICITY: How cost changes with variables
  # ========================================================================
  
  elasticities <- list()
  
  if (!is.null(gam_result) && length(numeric_preds) > 0) {
    for (pred in numeric_preds) {
      # Calculate elasticity: % change in cost / % change in predictor
      pred_mean <- mean(df[[pred]], na.rm = TRUE)
      cost_mean <- mean(df$cost, na.rm = TRUE)
      
      # Finite difference approximation
      if (pred_mean > 0 && cost_mean > 0) {
        delta <- pred_mean * 0.01  # 1% change
        df_plus <- df
        df_plus[[pred]] <- df_plus[[pred]] + delta
        
        pred_base <- predict(gam_model, newdata = df)
        pred_plus <- predict(gam_model, newdata = df_plus)
        
        cost_change_pct <- mean((pred_plus - pred_base) / pred_base * 100, na.rm = TRUE)
        
        elasticities[[pred]] <- round(cost_change_pct, 3)
      }
    }
  }
  
  # ========================================================================
  # RETURN RESULTS
  # ========================================================================
  
  result <- list(
    # Model performance
    r_squared = if (!is.null(gam_result)) round(gam_result$r_squared, 3) else NULL,
    
    # Predictions
    predictions = if (!is.null(gam_result)) gam_result$predictions else NULL,
    
    # Quantiles (if available)
    quantiles = quantile_result,
    
    # Cost drivers
    drivers = drivers,
    
    # Elasticities
    elasticities = elasticities,
    
    # Summary statistics
    avg_cost = round(mean(df$cost, na.rm = TRUE), 2),
    median_cost = round(median(df$cost, na.rm = TRUE), 2),
    cost_std = round(sd(df$cost, na.rm = TRUE), 2),
    
    # Metadata
    method = if (!is.null(gam_result)) "GAM + Quantile Regression" else "Simple Statistics",
    observations = n
  )
  
  cat("[R] Cost analysis complete\n")
  
  return(result)
}

cat("[R] cost.R loaded - GAM + Quantile Regression ready\n")
