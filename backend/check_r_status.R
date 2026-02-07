
# Force load utils
library(utils)

cat("LibPaths:", paste(.libPaths(), collapse="; "), "\n")

required_packages <- c("jsonlite", "data.table", "forecast", "mgcv", "quantreg", 
                      "lme4", "e1071", "psych", "bsts", "rugarch", "vars", 
                      "copula", "prophet", "forecastHybrid", "quantregForest", 
                      "isotree", "tsoutliers", "rrcov", "kernlab", "lavaan", "mirt")

tryCatch({
    installed <- installed.packages()[, "Package"]
    missing <- required_packages[!required_packages %in% installed]

    if (length(missing) > 0) {
      cat("MISSING:", paste(missing, collapse=", "), "\n")
    } else {
      cat("ALL_INSTALLED\n")
    }

    cat("INSTALLED_COUNT:", length(installed[installed %in% required_packages]), "/", length(required_packages), "\n")
}, error = function(e) {
    cat("ERROR:", conditionMessage(e), "\n")
})
