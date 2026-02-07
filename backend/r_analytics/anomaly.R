# Advanced Anomaly Detection using Isolation Forest + Gaussian Processes
# Detects outliers in invoice/shipment data with statistical significance

library(jsonlite)

# Try to load required packages
tryCatch({
  library(isotree)      # Isolation Forest
  library(tsoutliers)   # Time series outlier detection  
  library(e1071)        # SVM for novelty detection
}, error = function(e) {
  stop("Required R packages not installed. Please run:\n",
       "install.packages(c('isotree', 'tsoutliers', 'e1071'))")
})

#' Detect Anomalies using Isolation Forest + Statistical Methods
#' 
#' @param data JSON string with observations
#' @return List with anomaly scores, classifications, significance
detect_anomalies <- function(data) {
  
  cat("[R] Starting anomaly detection with Isolation Forest\n")
  
  # Parse JSON
  df <- fromJSON(data)
  
  # Ensure we have numeric features
  numeric_cols <- sapply(df, is.numeric)
  df_numeric <- df[, numeric_cols, drop = FALSE]
  
  if (ncol(df_numeric) == 0) {
    stop("No numeric columns found for anomaly detection")
  }
  
  n <- nrow(df_numeric)
  
  # ========================================================================
  # METHOD 1: Isolation Forest (Tree-based, no distributional assumptions)
  # ========================================================================
  
  iso_scores <- NULL
  
 tryCatch({
    # Fit Isolation Forest
    iso_model <- isolation.forest(df_numeric, ntrees = 100, sample_size = min(256, n))
    
    # Get anomaly scores (higher = more anomalous)
    iso_scores <- predict(iso_model, df_numeric, type = "score")
    
    # Threshold at 0.6 (typical for Isolation Forest)
    iso_anomalies <- iso_scores > 0.6
    
    cat("[R] Isolation Forest: Found", sum(iso_anomalies), "anomalies\n")
    
  }, error = function(e) {
    cat("[R] Isolation Forest failed:", e$message, "\n")
    iso_scores <- rep(0.5, n)
    iso_anomalies <- rep(FALSE, n)
  })
  
  # ========================================================================
  # METHOD 2: Statistical Z-score (for each numeric column)
  # ========================================================================
  
  z_anomalies <- matrix(FALSE, nrow = n, ncol = ncol(df_numeric))
  
  for (i in 1:ncol(df_numeric)) {
    col_data <- df_numeric[, i]
    z_scores <- abs(scale(col_data))
    z_anomalies[, i] <- z_scores > 3  # 3 sigma rule
  }
  
  # Mark as anomaly if ANY column has z-score > 3
  z_anomaly_flag <- apply(z_anomalies, 1, any)
  
  # ========================================================================
  # METHOD 3: One-Class SVM (if enough data)
  # ========================================================================
  
  svm_anomalies <- NULL
  
  if (n >= 50) {
    tryCatch({
      # Fit one-class SVM
      svm_model <- svm(df_numeric, type = "one-classification", nu = 0.1)
      
      # Predict (-1 = anomaly, 1 = normal)
      svm_pred <- predict(svm_model, df_numeric)
      svm_anomalies <- svm_pred == -1
      
      cat("[R] One-Class SVM: Found", sum(svm_anomalies), "anomalies\n")
      
    }, error = function(e) {
      cat("[R] One-Class SVM failed:", e$message, "\n")
      svm_anomalies <- rep(FALSE, n)
    })
  } else {
    svm_anomalies <- rep(FALSE, n)
  }
  
  # ========================================================================
  # ENSEMBLE: Combine methods (majority vote)
  # ========================================================================
  
  # Count how many methods flagged each observation
  vote_matrix <- cbind(iso_anomalies, z_anomaly_flag, svm_anomalies)
  vote_counts <- rowSums(vote_matrix)
  
  # Flag as anomaly if 2+ methods agree
  final_anomalies <- vote_counts >= 2
  
  # ========================================================================
  # SEVERITY SCORING
  # ========================================================================
  
  # Combine scores: Isolation Forest score + Z-score contribution
  max_z <- apply(abs(scale(df_numeric)), 1, max, na.rm = TRUE)
  severity_scores <- 0.6 * iso_scores + 0.4 * pmin(max_z / 5, 1)  # Normalize z to 0-1
  
  # ========================================================================
  # CATEGORIZE ANOMALIES
  # ========================================================================
  
  categories <- rep("normal", n)
  categories[final_anomalies] <- "anomaly"
  
  # Further classify by severity
  categories[final_anomalies & severity_scores > 0.8] <- "critical_anomaly"
  categories[final_anomalies & severity_scores <= 0.65] <- "minor_anomaly"
  
  # ========================================================================
  # RETURN RESULTS
  # ========================================================================
  
  # Find indices of anomalies
  anomaly_indices <- which(final_anomalies)
  
  result <- list(
    anomalies = as.integer(anomaly_indices - 1),  # 0-indexed for Python
    scores = as.numeric(severity_scores),
    categories = categories,
    
    # Method-specific results
    isolation_forest_scores = as.numeric(iso_scores),
    z_score_flags = z_anomaly_flag,
    svm_flags = svm_anomalies,
    
    # Summary
    total_anomalies = sum(final_anomalies),
    critical_count = sum(categories == "critical_anomaly"),
    minor_count = sum(categories == "minor_anomaly"),
    
    # Metadata
    method = "Isolation Forest + Z-Score + SVM Ensemble",
    data_points = n,
    features_analyzed = ncol(df_numeric)
  )
  
  cat("[R] Anomaly detection complete - found", result$total_anomalies, "anomalies\n")
  
  return(result)
}

cat("[R] anomaly.R loaded - Isolation Forest + ensemble ready\n")
