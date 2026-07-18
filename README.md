# CloudVault

A self-hosted file storage and management web application built with Next.js 15.

## Quick Start

```bash
npx cloudvault@latest
```

That's it. Requires only [Node.js 24+](https://nodejs.org) — no database, no build tools, no configuration needed.

On first run, admin credentials are printed to the terminal. Open `http://localhost:3000` in your browser.

## Install Globally

```bash
npm install -g cloudvault
cloudvault
```

## Configuration

All settings are optional — sensible defaults work out of the box.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `STORAGE_DIR` | `~/.cloudvault/uploads` | Where uploaded files are stored |
| `DB_PATH` | `~/.cloudvault/cloudvault.db` | SQLite database path |
| `SESSION_SECRET` | *(auto-generated)* | Session encryption key |
| `CLOUDVAULT_DATA_DIR` | `~/.cloudvault` | Base directory for data |

Set via environment variables or a `.env` file in the data directory.

## From Source

```bash
git clone https://github.com/Pantho-Haque/CloudVault.git
cd CloudVault
pnpm install
pnpm run dev
```

## Features

- Drag-and-drop file upload with progress tracking
- Folder creation and file organization
- Server-side search across all files
- File sharing with password-protected links
- File versioning and trash with retention
- Dark/light theme support
- Infinite scroll for large file collections
- Admin dashboard with user management
- Keyboard shortcuts (Ctrl+U upload, Ctrl+K search, N new folder)

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Runtime**: Node.js 24+ (uses `node:sqlite`)
- **Database**: SQLite (zero configuration)
- **Styling**: TailwindCSS v4
- **Language**: TypeScript (strict mode)

## License

MIT
