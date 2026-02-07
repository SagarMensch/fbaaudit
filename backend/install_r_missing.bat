@echo off
echo ========================================
echo Installing MISSING R Packages (8 Total)
echo ========================================
echo.

echo [1/8] Installing quantreg...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('quantreg', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo [2/8] Installing psych...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('psych', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo [3/8] Installing bsts (Bayesian Structural Time Series)...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('bsts', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo [4/8] Installing copula...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('copula', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo [5/8] Installing forecastHybrid...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('forecastHybrid', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo [6/8] Installing isotree (Isolation Forest)...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('isotree', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo [7/8] Installing lavaan (SEM)...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('lavaan', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo [8/8] Installing mirt...
"C:\Program Files\R\R-4.2.2\bin\x64\R.exe" --vanilla --quiet -e "install.packages('mirt', repos='https://cran.r-project.org', quiet=FALSE)"
echo.

echo.
echo ========================================
echo Missing Packages Installation Complete!
echo ========================================
pause
