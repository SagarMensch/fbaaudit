# Detailed R Package Status Check
cat("========================================\n")
cat(" R PACKAGE INSTALLATION STATUS REPORT   \n")
cat("========================================\n\n")

# List of all required packages
req_pkgs <- c("jsonlite", "data.table", "forecast", "mgcv", "quantreg", 
              "lme4", "e1071", "psych", "bsts", "rugarch", "vars", 
              "copula", "prophet", "forecastHybrid", "quantregForest", 
              "isotree", "tsoutliers", "rrcov", "kernlab", "lavaan", "mirt")

# Check each one
installed_count <- 0
for (pkg in req_pkgs) {
  if (require(pkg, character.only = TRUE, quietly = TRUE)) {
    ver <- packageVersion(pkg)
    cat(sprintf("[OK]   %-15s %s\n", pkg, ver))
    installed_count <- installed_count + 1
  } else {
    cat(sprintf("[MISS] %-15s (Not found)\n", pkg))
  }
}

cat("\n========================================\n")
cat(sprintf("Total Installed: %d / %d\n", installed_count, length(req_pkgs)))
cat("========================================\n")
