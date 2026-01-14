@echo off
echo ========================================
echo R Package Sequential Installer - ALL 21 Packages
echo ========================================
echo Installing packages ONE BY ONE...
echo.

echo [1/21] Installing jsonlite...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('jsonlite', repos='https://cran.r-project.org', quiet=FALSE)"

echo [2/21] Installing data.table...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('data.table', repos='https://cran.r-project.org', quiet=FALSE)"

echo [3/21] Installing forecast...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('forecast', repos='https://cran.r-project.org', quiet=FALSE)"

echo [4/21] Installing mgcv...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('mgcv', repos='https://cran.r-project.org', quiet=FALSE)"

echo [5/21] Installing quantreg...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('quantreg', repos='https://cran.r-project.org', quiet=FALSE)"

echo [6/21] Installing lme4...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('lme4', repos='https://cran.r-project.org', quiet=FALSE)"

echo [7/21] Installing e1071...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('e1071', repos='https://cran.r-project.org', quiet=FALSE)"

echo [8/21] Installing psych...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('psych', repos='https://cran.r-project.org', quiet=FALSE)"

echo [9/21] Installing bsts...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('bsts', repos='https://cran.r-project.org', quiet=FALSE)"

echo [10/21] Installing rugarch...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('rugarch', repos='https://cran.r-project.org', quiet=FALSE)"

echo [11/21] Installing vars...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('vars', repos='https://cran.r-project.org', quiet=FALSE)"

echo [12/21] Installing copula...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('copula', repos='https://cran.r-project.org', quiet=FALSE)"

echo [13/21] Installing prophet...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('prophet', repos='https://cran.r-project.org', quiet=FALSE)"

echo [14/21] Installing forecastHybrid...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('forecastHybrid', repos='https://cran.r-project.org', quiet=FALSE)"

echo [15/21] Installing quantregForest...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('quantregForest', repos='https://cran.r-project.org', quiet=FALSE)"

echo [16/21] Installing isotree...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('isotree', repos='https://cran.r-project.org', quiet=FALSE)"

echo [17/21] Installing tsoutliers...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('tsoutliers', repos='https://cran.r-project.org', quiet=FALSE)"

echo [18/21] Installing rrcov...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('rrcov', repos='https://cran.r-project.org', quiet=FALSE)"

echo [19/21] Installing kernlab...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('kernlab', repos='https://cran.r-project.org', quiet=FALSE)"

echo [20/21] Installing lavaan...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('lavaan', repos='https://cran.r-project.org', quiet=FALSE)"

echo [21/21] Installing mirt...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('mirt', repos='https://cran.r-project.org', quiet=FALSE)"

echo.
echo ========================================
echo All 21 packages installation complete!
echo ========================================
pause
