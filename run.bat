@echo off
title KLYRO Launcher
echo ===================================================
echo             STARTING KLYRO SERVICES
echo ===================================================

echo [1/3] Starting AI Service on port 8000...
start "Klyro AI Service [8000]" cmd /k "cd /d %~dp0ai-service && call .venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"

echo [2/3] Starting Backend API on port 5000...
start "Klyro Backend API [5000]" cmd /k "cd /d %~dp0Backend && npm run dev"

echo [3/3] Starting Frontend on port 5173...
start "Klyro Frontend [5173]" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ===================================================
echo All services launched!
echo - Frontend:   http://localhost:5173
echo - Backend:    http://localhost:5000 (Health: http://localhost:5000/health)
echo - AI Service: http://localhost:8000 (Docs:   http://localhost:8000/docs)
echo ===================================================
