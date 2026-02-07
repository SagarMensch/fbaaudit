# Simple Status Check
cat("Starting Check...\n")
pkgs <- c("jsonlite", "data.table", "forecast", "mgcv", "quantreg", 
          "lme4", "e1071", "psych", "bsts", "rugarch", "vars", 
          "copula", "prophet", "forecastHybrid", "quantregForest", 
          "isotree", "tsoutliers", "rrcov", "kernlab", "lavaan", "mirt")

for (p in pkgs) {
  available <- require(p, character.only = TRUE, quietly = TRUE)
  if (available) {
    cat("[YES] ", p, "\n", sep="")
  } else {
    cat("[NO ] ", p, "\n", sep="")
  }
}
cat("Check Complete.\n")
