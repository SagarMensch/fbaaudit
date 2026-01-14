# R Package Installation Script
# Run this in R Console to install all required packages at once

cat("Installing R packages for analytics integration...\n")

# List of all required packages
packages <- c(
  # Core utilities
  "jsonlite",
  "data.table",
  
  # Benchmarking (BSTS + GARCH)
  "bsts",
  "rugarch",
  "forecast",
  "vars",
  "copula",
  
  # Forecasting (Prophet + Ensemble)
  "prophet",
  "forecastHybrid",
  "quantregForest",
  
  # Anomaly Detection
  "isotree",
  "tsoutliers",
  "e1071",
  "rrcov",
  "kernlab",
  
  # Carrier Scoring (SEM + Factor Analysis)
  "lavaan",
  "psych",
  "mirt",
  
  # Cost Analysis (GAM + Bayesian)
  "mgcv",
  "quantreg",
  "lme4"
)

# Function to install if not already installed
install_if_missing <- function(pkg) {
  if (!require(pkg, character.only = TRUE, quietly = TRUE)) {
    cat("Installing:", pkg, "\n")
    install.packages(pkg, dependencies = TRUE, repos = "https://cran.r-project.org")
  } else {
    cat("✓", pkg, "already installed\n")
  }
}

# Install all packages
cat("\nInstalling packages (this may take 10-15 minutes)...\n\n")
for (pkg in packages) {
  install_if_missing(pkg)
}

cat("\n✅ All R packages installed successfully!\n")
cat("You can now use advanced analytics in the application.\n")
