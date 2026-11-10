@echo off
setlocal
set "ROOT=%~dp0.."
set "PYTHON=%ROOT%\.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo The project virtual environment was not found.
    echo Follow the setup instructions in README.md, then try again.
    pause
    exit /b 1
)

cd /d "%ROOT%"
"%PYTHON%" "%~dp0start_app.py"
if errorlevel 1 (
    echo The app could not start. Check the error above.
    pause
    exit /b 1
)
endlocal
