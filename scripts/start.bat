@echo off
REM CloudVault Start Script for Windows

cd /d "%~dp0"

REM Load .env if present
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)

REM Set defaults
if "%PORT%"=="" set PORT=3000
if "%STORAGE_DIR%"=="" set STORAGE_DIR=./uploads
if "%DB_PATH%"=="" set DB_PATH=./cloudvault.db

echo Starting CloudVault on http://localhost:%PORT%
node server.js
pause
