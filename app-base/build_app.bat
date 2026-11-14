@echo off
setlocal
set "ROOT=%~dp0.."
set "PYTHON=%ROOT%\.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo The project virtual environment was not found.
    echo Create it with: python -m venv .venv
    exit /b 1
)

cd /d "%ROOT%"
echo Installing pinned dependencies...
"%PYTHON%" -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo Running Python tests...
"%PYTHON%" -m unittest discover -s tests -v
if errorlevel 1 exit /b 1

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js not found; skipping JavaScript checks.
    goto success
)

echo Running JavaScript tests...
node --test tests\test_appearance.cjs
if errorlevel 1 exit /b 1

echo Checking JavaScript syntax...
node --check src\static\app.js
if errorlevel 1 exit /b 1
node --check src\static\appearance.js
if errorlevel 1 exit /b 1

:success
echo Build and validation completed successfully.
endlocal
