# CloudVault Installer for Windows (PowerShell)
# Usage: irm <repo-url>/scripts/install.ps1 | iex

$ErrorActionPreference = "Stop"
$InstallDir = "$env:USERPROFILE\cloudvault"
$RepoUrl = $env:CLOUDVAULT_REPO ?? "https://github.com/your-username/CloudVault.git"
$MinNodeMajor = 24

function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Ok { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Err { Write-Host "[ERROR] $args" -ForegroundColor Red; exit 1 }

function Test-Node {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $version = (node --version).TrimStart('v')
        $major = [int]($version.Split('.')[0])
        if ($major -ge $MinNodeMajor) {
            Write-Ok "Node.js v$version found"
            return $true
        }
        Write-Warn "Node.js v$version is too old (need >= $MinNodeMajor)"
    }
    
    Write-Info "Please install Node.js $MinNodeMajor+ from https://nodejs.org"
    Write-Err "Node.js not found"
}

function Test-Pnpm {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Ok "pnpm found"
        return
    }
    Write-Info "Installing pnpm..."
    npm install -g pnpm
    Write-Ok "pnpm installed"
}

function Install-Git {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Ok "Git found"
        return
    }
    Write-Err "Git not found. Install from https://git-scm.com"
}

function Setup-Repo {
    if (Test-Path "$InstallDir\.git") {
        Write-Info "Updating existing installation..."
        Set-Location $InstallDir
        git pull --ff-only 2>$null
    } else {
        Write-Info "Cloning CloudVault..."
        git clone $RepoUrl $InstallDir
        Set-Location $InstallDir
    }
    Write-Ok "Repository ready at $InstallDir"
}

function Build {
    Write-Info "Installing dependencies..."
    pnpm install --frozen-lockfile 2>$null; if ($LASTEXITCODE -ne 0) { pnpm install }
    
    Write-Info "Building for production..."
    pnpm run build
    Write-Ok "Build complete"
}

function Setup-Env {
    if (Test-Path .env) {
        Write-Info ".env already exists, skipping"
        return
    }
    
    Write-Info "Generating .env configuration..."
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $secret = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ''
    
    @"
SESSION_SECRET=$secret
PORT=3000
STORAGE_DIR=./uploads
DB_PATH=./cloudvault.db
MAX_UPLOAD_SIZE_MB=100
TRASH_RETENTION_DAYS=30
MAX_FILE_VERSIONS=5
"@ | Out-File -FilePath .env -Encoding utf8

    Write-Ok ".env created"
}

function Create-Command {
    $startBat = @"
@echo off
cd /d "$InstallDir"
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"
)
if "%PORT%"=="" set PORT=3000
echo CloudVault running at http://localhost:%PORT%
node server.js
pause
"@
    
    $batPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\cloudvault.bat"
    $startBat | Out-File -FilePath $batPath -Encoding ascii
    Write-Ok "Created 'cloudvault' command at $batPath"
}

function Show-Summary {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   CloudVault installed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Start:  cloudvault"
    Write-Host "  URL:    http://localhost:3000"
    Write-Host "  Dir:    $InstallDir"
    Write-Host ""
    Write-Host "  First run will prompt you to create an admin account."
    Write-Host ""
}

# Main
Write-Host "CloudVault Installer" -ForegroundColor Cyan
Write-Host ""
Install-Git
Test-Node
Test-Pnpm
Setup-Repo
Build
Setup-Env
Create-Command
Show-Summary
