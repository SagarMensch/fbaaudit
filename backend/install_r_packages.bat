@echo off
echo ========================================
echo Installing R Packages for Analytics
echo ========================================
echo.
echo This will take 10-15 minutes...
echo.

"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "packages <- c('jsonlite', 'data.table', 'bsts', 'rugarch', 'forecast', 'vars', 'copula', 'prophet', 'forecastHybrid', 'quantregForest', 'isotree', 'tsoutliers', 'e1071', 'rrcov', 'kernlab', 'lavaan', 'psych', 'mirt', 'mgcv', 'quantreg', 'lme4'); cat('Installing packages...\n'); for (pkg in packages) { if (!require(pkg, character.only = TRUE, quietly = TRUE)) { cat('Installing:', pkg, '\n'); install.packages(pkg, dependencies = TRUE, repos = 'https://cran.r-project.org', quiet = FALSE) } else { cat('OK:', pkg, '\n') } }; cat('\n=== Installation Complete! ===\n')"

echo.
echo ========================================
echo All R packages installed!
echo ========================================
pause
