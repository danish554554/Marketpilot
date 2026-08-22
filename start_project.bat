@echo off
echo =========================================================
echo    MarketPilot AI — Starting Full Stack (Backend + Frontend)
echo =========================================================

:: 1. Start Backend in separate window
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "MarketPilot Backend (FastAPI)" cmd /k "cd /d "%~dp0marketpilot-auth-backend" && run_dev.bat"

:: 2. Wait 2 seconds
timeout /t 2 /nobreak > nul

:: 3. Start Frontend in separate window
echo [2/2] Starting React/Vite Frontend on http://localhost:3000 ...
start "MarketPilot Frontend (React/Vite)" cmd /k "cd /d "%~dp0marketpilot-frontend" && run_frontend.bat"

:: 4. Open default browser to the app
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo =========================================================
echo Both servers are launching!
echo Backend:  http://127.0.0.1:8000/docs
echo Frontend: http://localhost:3000
echo =========================================================
