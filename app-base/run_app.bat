@echo off
setlocal
set "ROOT=%~dp0.."
set "PYTHON=%ROOT%\.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo The project virtual environment was not found.
    echo Run app-base\build_app.bat after creating .venv.
    pause
    exit /b 1
)

cd /d "%ROOT%"
call "%ROOT%\launcher\start_app.bat"
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
