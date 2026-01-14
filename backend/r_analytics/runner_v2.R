
# Validates arguments and executes target R function
# Usage: Rscript runner_v2.R <script_path> <function_name> <json_data_path>

cat("DEBUG: Runner v2 Starting\n", file=stderr())

args <- commandArgs(trailingOnly = TRUE)

if (length(args) != 3) {
  stop("Usage: runner.R <script_path> <function_name> <json_data_path>")
}

script_path <- args[1]
func_name <- args[2]
json_path <- args[3]

# Force vanilla safe mode implicit in Rscript call, but good to be safe
options(warn = -1)

# Load jsonlite quietly
cat("DEBUG: Loading jsonlite\n", file=stderr())
suppressPackageStartupMessages(library(jsonlite))

tryCatch({
  # Load the script
  cat(paste("DEBUG: Sourcing", script_path, "\n"), file=stderr())
  source(script_path)
  
  # Read JSON args
  cat("DEBUG: Reading JSON\n", file=stderr())
  input_data <- fromJSON(json_path)
  
  # Execute function
  cat("DEBUG: Calling function\n", file=stderr())
  # No capture for now, just let logs go to stdout/stderr.
  # We will assume result is returned.
  result <- do.call(func_name, input_data)
  
  # Output Result as Clean JSON
  cat("JSON_START\n")
  cat(toJSON(result, auto_unbox = TRUE))
  cat("\nJSON_END\n")
  
}, error = function(e) {
  # Return error as JSON
  cat("DEBUG: Error\n", file=stderr())
  cat(toJSON(list(error = conditionMessage(e)), auto_unbox = TRUE))
})
