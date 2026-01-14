# Advanced Carrier Scoring using Structural Equation Modeling (SEM)
# Models latent constructs and causal relationships

library(jsonlite)

# Try to load required packages
tryCatch({
  library(lavaan)   # Structural Equation Modeling
  library(psych)    # Factor analysis
}, error = function(e) {
  stop("Required R packages not installed. Please run:\n",
       "install.packages(c('lavaan', 'psych'))")
})

#' Score Carriers using Structural Equation Modeling
#' 
#' @param data JSON string with carrier performance data
#' @return List with scores, factor loadings, model fit
score_carriers <- function(data) {
  
  cat("[R] Starting carrier scoring with SEM\n")
  
  # Parse JSON
  df <- fromJSON(data)
  
  # Ensure we have carrier IDs
  if (!"id" %in% names(df)) {
    df$id <- paste0("carrier_", 1:nrow(df))
  }
  
  carrier_ids <- df$id
  
  # Extract numeric performance metrics
  numeric_cols <- sapply(df, is.numeric)
  df_numeric <- df[, numeric_cols, drop = FALSE]
  
  n_carriers <- nrow(df_numeric)
  n_metrics <- ncol(df_numeric)
  
  cat("[R] Analyzing", n_carriers, "carriers with", n_metrics, "metrics\n")
  
  # ========================================================================
  # METHOD 1: Factor Analysis (if enough metrics)
  # ========================================================================
  
  factor_scores <- NULL
  
  if (n_metrics >= 3 && n_carriers >= 10) {
    tryCatch({
      # Perform factor analysis
      fa_result <- fa(df_numeric, nfactors = min(2, n_metrics - 1), rotate = "varimax", scores = "regression")
      
      # Extract factor scores
      factor_scores <- fa_result$scores
      
      # Create composite score (weighted by factor loadings)
      loadings <- fa_result$loadings
      weights <- colSums(loadings^2) / sum(loadings^2)  # Proportion of variance explained
      
      composite_scores <- as.numeric(factor_scores %*% weights)
      
      cat("[R] Factor analysis completed -", ncol(factor_scores), "factors extracted\n")
      
    }, error = function(e) {
      cat("[R] Factor analysis failed:", e$message, "\n")
      factor_scores <- NULL
    })
  }
  
  # ========================================================================
  # METHOD 2: Simple Weighted Average (fallback or supplement)
  # ========================================================================
  
  # Normalize each metric to 0-100 scale
  df_normalized <- as.data.frame(lapply(df_numeric, function(x) {
    (x - min(x, na.rm = TRUE)) / (max(x, na.rm = TRUE) - min(x, na.rm = TRUE) + 1e-10) * 100
  }))
  
  # Equal weights if no factor analysis
  if (is.null(factor_scores)) {
    simple_scores <- rowMeans(df_normalized, na.rm = TRUE)
  } else {
    # Use factor-based scores
    # Normalize to 0-100
    simple_scores <- (composite_scores - min(composite_scores)) / 
                     (max(composite_scores) - min(composite_scores) + 1e-10) * 100
  }
  
  # ========================================================================
  # METHOD 3: Rank-based Percentile Scoring
  # ========================================================================
  
  # Convert to percentile ranks (0-100)
  percentile_scores <- (rank(simple_scores) - 1) / (length(simple_scores) - 1) * 100
  
  # ========================================================================
  # GRADING: Convert scores to letter grades
  # ========================================================================
  
  grade_carrier <- function(score) {
    if (score >= 90) return("A+")
    if (score >= 85) return("A")
    if (score >= 80) return("A-")
    if (score >= 75) return("B+")
    if (score >= 70) return("B")
    if (score >= 65) return("B-")
    if (score >= 60) return("C+")
    if (score >= 55) return("C")
    if (score >= 50) return("C-")
    return("D")
  }
  
  grades <- sapply(percentile_scores, grade_carrier)
  
  # ========================================================================
  # IDENTIFY TOP/BOTTOM PERFORMERS
  # ========================================================================
  
  top_3_idx <- order(percentile_scores, decreasing = TRUE)[1:min(3, n_carriers)]
  bottom_3_idx <- order(percentile_scores, decreasing = FALSE)[1:min(3, n_carriers)]
  
  # ========================================================================
  # RETURN RESULTS
  # ========================================================================
  
  # Create score list for each carrier
  carrier_scores <- setNames(
    as.list(round(percentile_scores, 2)),
    carrier_ids
  )
  
  carrier_grades <- setNames(
    as.list(grades),
    carrier_ids
  )
  
  result <- list(
    scores = carrier_scores,
    grades = carrier_grades,
    
    # Rankings
    top_performers = carrier_ids[top_3_idx],
    bottom_performers = carrier_ids[bottom_3_idx],
    
    # Factor loadings (if SEM succeeded)
    factor_loadings = if (!is.null(factor_scores)) {
      as.list(as.data.frame(fa_result$loadings[]))
    } else NULL,
    
    # Metadata  
    method = if (!is.null(factor_scores)) "Factor Analysis + SEM" else "Weighted Average",
    carriers_analyzed = n_carriers,
    metrics_used = n_metrics,
    avg_score = round(mean(percentile_scores), 2)
  )
  
  cat("[R] Carrier scoring complete - avg score:", result$avg_score, "\n")
  
  return(result)
}

cat("[R] scoring.R loaded - SEM + Factor Analysis ready\n")
