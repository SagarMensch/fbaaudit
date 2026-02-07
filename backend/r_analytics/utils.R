# R Analytics Utilities
# Common functions used across all R analytics scripts

# JSON handling
library(jsonlite)

# Convert R list to JSON for Flask
to_json <- function(obj) {
  toJSON(obj, auto_unbox = TRUE, pretty = TRUE)
}

# Convert JSON string to R object
from_json <- function(json_str) {
  fromJSON(json_str)
}

# Safe package loading
require_package <- function(pkg_name) {
  if (!require(pkg_name, character.only = TRUE, quietly = TRUE)) {
    stop(paste("Required package not installed:", pkg_name, 
               "\nRun: install.packages('", pkg_name, "')", sep = ""))
  }
}

# Print helper for debugging
log_info <- function(...) {
  cat("[R]", format(Sys.time(), "%H:%M:%S"), "-", ..., "\n")
}

log_info("R analytics utilities loaded successfully")
