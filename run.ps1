# KLYRO All-in-One Startup Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "             STARTING KLYRO SERVICES              " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "[1/3] Launching AI Service on port 8000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$root\ai-service`" && call .venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"

Write-Host "[2/3] Launching Backend API on port 5000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$root\Backend`" && npm run dev"

Write-Host "[3/3] Launching Frontend on port 5173..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$root\frontend`" && npm run dev"

Write-Host "===================================================" -ForegroundColor Green
Write-Host "All services are running in separate terminal windows!" -ForegroundColor Green
Write-Host " - Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host " - Backend:    http://localhost:5000" -ForegroundColor White
Write-Host " - AI Service: http://localhost:8000" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Green
