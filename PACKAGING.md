# CloudVault Packaging Guide

## Building for Distribution

### Option 1: Standalone Build (Recommended)

```bash
pnpm run package
```

This creates `dist/cloudvault.tar.gz` containing everything needed to run.

### Option 2: Development Build

```bash
pnpm run build
```

Produces output in `build/` directory.

## Running the Package

### Termux (Android)

```bash
pkg install nodejs
tar -xzf cloudvault.tar.gz
cd cloudvault
./start.sh
```

### Linux / macOS

```bash
tar -xzf cloudvault.tar.gz
cd cloudvault
./start.sh
```

### Windows

```cmd
tar -xzf cloudvault.tar.gz
cd cloudvault
start.bat
```

## Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | (random) | Required. Session cookie signing key |
| `PORT` | 3000 | Server port |
| `STORAGE_DIR` | ./uploads | Where files are stored |
| `DB_PATH` | ./cloudvault.db | SQLite database location |
| `MAX_UPLOAD_SIZE_MB` | 100 | Max upload size |
| `TRASH_RETENTION_DAYS` | 30 | Auto-purge trash after N days |
| `MAX_FILE_VERSIONS` | 5 | Versions kept per file |

## One-Shot Install

```bash
curl -sSL <repo-url>/scripts/install.sh | bash
```

Or for Windows (PowerShell):

```powershell
irm <repo-url>/scripts/install.ps1 | iex
```

## Docker (Optional)

```dockerfile
FROM node:24-slim
WORKDIR /app
COPY dist/cloudvault .
EXPOSE 3000
CMD ["node", "server.js"]
```
