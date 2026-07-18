# CloudVault

Self-hosted file storage and management — run it with one command, access it from any device on your network.

[![npm version](https://img.shields.io/npm/v/cloudvault.svg)](https://www.npmjs.com/package/cloudvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js requirement](https://img.shields.io/badge/node-%3E%3D24-brightgreen.svg)](https://nodejs.org)

## Features

- Folder-based file browser with drag-and-drop upload
- Real-time updates via Server-Sent Events (no page refresh)
- Server-side search across all files (name, type, size, date) with match highlighting
- File trash with configurable retention (auto-purge after 30 days) — folders go to trash too
- File versioning with configurable max versions per file
- Password-protected share links with QR codes, optional expiry and download limits
- Admin panel with user management, audit log viewer, and session management
- Forced password change on first login
- PWA installable with update notifications — add to home screen on phone or desktop
- Infinite scroll for large file collections
- Dynamic disk quota display (shows actual device storage, not hardcoded)
- Storage statistics panel with donut chart, category breakdown, and file type details
- Responsive design: bottom nav on mobile, full sidebar on desktop
- Rename files directly from the preview modal
- Upload conflict detection (overwrite / skip / retry on failure)
- Keyboard shortcuts: Ctrl+U (upload), Ctrl+K (search), N (new folder)

## Quick Start

```bash
npx cloudvault@latest
```

Open `http://localhost:3000` in your browser. On first run, admin credentials are printed to your terminal.

## Prerequisites

**Node.js 24 or later** is required — CloudVault uses `node:sqlite`, which ships in Node 24+. No other dependencies are needed (no database server, no build tools).

Check your version:

```bash
node --version
```

If you need to install or upgrade Node.js, see the platform instructions below.

## Installation by Platform

### Termux (Android)

> **Important:** Install Termux from [F-Droid](https://f-droid.org/packages/com.termux/) or the [GitHub releases page](https://github.com/termux/termux-app/releases). The Play Store version is outdated and unmaintained.

```bash
pkg update && pkg install nodejs
npx cloudvault@latest
```

The server will be reachable at `http://localhost:3000` from the phone's own browser. To access it from another device on the same network, the CLI prints your LAN IP address in the terminal (e.g. `http://192.168.1.42:3000`).

### Linux

Install Node.js 24+ via your package manager or [nvm](https://github.com/nvm-sh/nvm):

```bash
# Ubuntu/Debian (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 24
```

Then run:

```bash
npx cloudvault@latest
```

### macOS

Install Node.js via [Homebrew](https://brew.sh) or the [official installer](https://nodejs.org):

```bash
brew install node
```

Then run:

```bash
npx cloudvault@latest
```

### Windows

Install Node.js via the [official installer](https://nodejs.org) or [winget](https://learn.microsoft.com/windows/package-manager/winget/):

```bash
winget install OpenJS.NodeJS.LTS
```

Then run from PowerShell or Command Prompt:

```bash
npx cloudvault@latest
```

### Persistent Install (All Platforms)

If you prefer not to use `npx` each time:

```bash
npm install -g cloudvault
cloudvault
```

## First Run

When CloudVault starts on a machine with no existing data, it prints a boxed credential summary to the terminal:

```
╔══════════════════════════════════════════════════════╗
║            CloudVault — Server Started               ║
╠══════════════════════════════════════════════════════╣
║  Username : admin                                   ║
║  Password : xK9mP2qR7vL4nW8j                      ║
╠══════════════════════════════════════════════════════╣
║  Local    : http://localhost:3000                   ║
║  Network  : http://192.168.1.42:3000                ║
╠══════════════════════════════════════════════════════╣
║  Credentials saved to: ~/.cloudvault/.cloudvault-initial-credentials
║  Delete this file after noting the credentials.      ║
║  Use these credentials if you forget your password.  ║
╚══════════════════════════════════════════════════════╝
```

- A credentials file is written to `~/.cloudvault/.cloudvault-initial-credentials`. Delete it after noting the credentials.
- On your first login at `http://localhost:3000/login`, you will be forced to change the admin password before doing anything else.

## Configuration

All configuration is optional — defaults work out of the box. Data is stored in `~/.cloudvault/` by default.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `STORAGE_DIR` | `~/.cloudvault/uploads` | Directory where uploaded files are stored |
| `DB_PATH` | `~/.cloudvault/cloudvault.db` | SQLite database file path |
| `SESSION_SECRET` | *(auto-generated)* | Secret key for session cookies — set a stable value if you want sessions to survive restarts |
| `MAX_UPLOAD_SIZE_MB` | `100` | Maximum upload size in megabytes |
| `TRASH_RETENTION_DAYS` | `30` | Days before trashed files are auto-purged |
| `MAX_FILE_VERSIONS` | `5` | Maximum number of stored versions per file |
| `CLOUDVAULT_DATA_DIR` | `~/.cloudvault` | Base data directory (CLI only — overrides the default locations of `STORAGE_DIR` and `DB_PATH`) |

Set via environment variables:

```bash
PORT=8080 npx cloudvault@latest
```

Or create a `.env` file in `~/.cloudvault/`.

## Updating

`npx cloudvault@latest` always pulls the latest published version — no action needed.

For a persistent install:

```bash
npm update -g cloudvault
```

## Development

Requires [pnpm](https://pnpm.io).

```bash
git clone https://github.com/Pantho-Haque/CloudVault.git
cd CloudVault
pnpm install
pnpm run dev
```

Commands:

| Command | Description |
|---|---|
| `pnpm run dev` | Start dev server with Turbopack |
| `pnpm run build` | Production build (standalone output in `build/standalone/`) |
| `pnpm run start` | Start production server |
| `pnpm run lint` | Lint with ESLint |

For architecture details, see [CLAUDE.md](./CLAUDE.md).

## Tech Stack

- **Next.js 15** — App Router with Turbopack
- **React 19** with TypeScript (strict mode)
- **TailwindCSS v4** for styling
- **SQLite** via `node:sqlite` — zero configuration, no external database
- **Framer Motion** for animations

## License

MIT
