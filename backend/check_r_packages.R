# Quick R Package Check
cat("Checking installed R packages...\n")

required_packages <- c("jsonlite", "bsts", "rugarch", "forecast", "prophet", 
                       "isotree", "e1071", "lavaan", "psych", "mgcv", "quantreg", "lme4")

for (pkg in required_packages) {
  if (require(pkg, character.only = TRUE, quietly = TRUE)) {
    cat("✓", pkg, "\n")
  } else {
    cat("✗", pkg, "(not installed yet)\n")
  }
}

cat("\nDone!\n")
