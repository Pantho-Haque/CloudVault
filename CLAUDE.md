# CloudVault

A file storage and management web application built with Next.js 15 App Router.

## Commands

- `pnpm install` — install dependencies
- `pnpm run dev` — start dev server (Turbopack)
- `pnpm run build` — production build (standalone output in `build/standalone/`)
- `pnpm run start` — start production server
- `pnpm run lint` — lint with ESLint (next/core-web-vitals + next/typescript)
- `npx cloudvault@latest` — run from npm (end-user install method)
- `npm publish --provenance --access public` — publish to npm (handled by CI)

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **React**: v19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 (via @tailwindcss/postcss)
- **Icons**: @heroicons/react
- **Drag & Drop**: react-drag-drop-files
- **Database**: SQLite via `node:sqlite` (requires Node 24+)

## Project Structure

```
bin/
  cloudvault.js                  — CLI entry point (Node check, config, standalone server launcher)
app/
  page.tsx                      — Redirects to /files
  layout.tsx                    — Root layout with Geist fonts, ThemeProvider
  globals.css                   — CSS variables for light/dark themes + Tailwind theme
  login/page.tsx                — Login form
  setup/page.tsx                — First-time admin setup
  change-password/page.tsx      — Mandatory password change
  files/[[...path]]/page.tsx    — Catch-all route for file browser
  admin/page.tsx                — Admin dashboard (users, sessions, stats)
  shared/[id]/page.tsx          — Public shared file download page
  api/
    files/route.ts              — File CRUD, SSE streaming, pagination, storage stats
    files/batch/route.ts        — Batch delete/move
    files/folders/route.ts      — Create/rename folders
    files/folder-stats/route.ts — Recursive folder size/count
    files/move/route.ts         — Move files/folders
    files/search/route.ts       — Server-side search (name, type, size, date)
    files/share/route.ts        — Share link CRUD (GET lists all user's links)
    files/thumbnail/route.ts    — File type thumbnails (SVG badges for non-images)
    files/preview/route.ts      — Full-resolution file preview for modal
    files/trash/route.ts        — Trash management (supports JSON body)
    files/versions/route.ts     — File versioning
    auth/login/route.ts         — Login
    auth/logout/route.ts        — Logout
    auth/me/route.ts            — Current user info
    auth/setup/route.ts         — First-time setup
    auth/admin/route.ts         — User/session management, storage breakdown
    auth/change-password/route.ts — Password change
    share/route.ts              — Public share link access (POST verify doesn't increment count)
    audit/route.ts              — Audit log
    health/route.ts             — Health check
  components/
    layout/
      Sidebar.tsx               — Sidebar (nav, storage breakdown, theme toggle, shortcuts, user profile)
      TopBar.tsx                — Breadcrumbs, server-side search, view toggle, upload, new folder
      Header.tsx                — Legacy header (still exported)
      Footer.tsx                — Legacy footer
      ServiceWorkerRegistration.tsx
    files/
      FileBrowser.tsx           — Main orchestrator (infinite scroll, SSE, keyboard shortcuts, search)
      FileList.tsx              — Sort, search results, selection, select-all, infinite scroll sentinel
      FileListTable.tsx         — Table view with canvas-resized thumbnails, CSS containment
      FileGridView.tsx          — Grid view with canvas-resized thumbnails
      FileDetailsModal.tsx      — Large preview modal (LRU cache of 4, circular arrow nav, Esc close)
      FileUploader.tsx          — File/folder upload with global progress callback
      FileStatistics.tsx        — Slide-in stats panel
      SearchBar.tsx             — Search input
      ShareLinkModal.tsx        — Share link creation form
      ShareLinksView.tsx        — Shared links management (file info, folder navigation)
      TrashView.tsx             — Trash management
      LazyThumbnail.tsx         — Canvas-resized thumbnails (32x32, JPEG 0.2, IntersectionObserver)
      UploadProgressPopover.tsx — Floating upload progress indicator (auto-dismiss, close button)
    admin/
      AdminDashboard.tsx        — Stats cards
      AdminUserTable.tsx        — User management table
      AdminSessionList.tsx      — Active sessions
      ConfirmDialog.tsx         — Confirmation dialogs
      Toast.tsx                 — Toast notifications
    providers/
      ThemeProvider.tsx          — Light/dark/system theme (dark is default)
    ui/
      StatusMessage.tsx         — Status message display
lib/
  config.ts                     — Environment config (storage, DB, secrets)
  db.ts                         — SQLite database (users, sessions, files, share_links, audit, storage breakdown)
  auth.ts                       — Password hashing, session management, RBAC, brute-force protection
  storage.ts                    — In-memory file manifest, system dir filtering (.trash, .thumbs, .versions)
  sse.ts                        — Server-Sent Events for real-time updates
  startup.ts                    — Initial setup, credential generation
  operations.ts                 — formatFileSize, formatDate, formatTimeAgo
  fileIcons.tsx                 — File extension to icon mapping
types/
  node-sqlite.d.ts              — Type declarations for node:sqlite
uploads/                        — Server-side file storage (auto-created, gitignored)
build/                          — Build output (gitignored)
```

## Architecture Notes

- **Database**: SQLite via `node:sqlite` (requires Node 24+). Tables: users, sessions, files, file_versions, audit_log, share_links. WAL mode.
- **Authentication**: scrypt password hashing (64-byte key), session cookies (7-day expiry), brute-force protection (5 attempts / 15-min lockout).
- **Roles**: admin, write, read. RBAC enforced via middleware and API handlers.
- **File storage**: Files saved to `uploads/` directory. In-memory manifest for fast listing. System dirs (`.trash`, `.thumbs`, `.versions`) filtered from listings.
- **Real-time updates**: SSE via `/api/files?stream=1`. Clients receive `file-change` events.
- **Infinite scroll**: API supports `?offset=N&limit=50` pagination. Client loads 50 files per page, IntersectionObserver triggers next page load. Resets properly when search closes.
- **Server-side search**: Debounced (300ms) API calls to `/api/files/search?q=...` which searches the full in-memory manifest, not just loaded files.
- **Memory optimization**: List thumbnails are canvas-resized to 32x32 at JPEG 0.2 quality (blob URL revoked immediately). Modal preview uses LRU cache of 4 blob URLs with auto-eviction. Preview API (`/api/files/preview`) serves full-resolution files on demand.
- **Keyboard shortcuts**: Ctrl+U (upload), Ctrl+K (search), N (new folder), ? (show shortcuts panel), Esc (close modals/search), Left/Right arrows (navigate modal preview with circular rotation).
- **Storage visualization**: Sidebar shows segmented colored bar by file type + legend. Uses in-memory manifest (not DB `files` table). Non-admin endpoint at `?resource=storage` and `?resource=storage-breakdown`.
- **PWA**: Service worker with cache-first strategy, web manifest for installability.
- **Build output**: Custom `distDir: "build"` in next.config.ts. Standalone output.
- **Path alias**: `@/*` maps to project root. `@components/*` also supported.
- **npm distribution**: CLI at `bin/cloudvault.js` wraps standalone build. Published via GitHub Actions on `v*.*.*` tags. Uses npm provenance (OIDC). Package ships standalone server + CLI only (no source, no dev deps). Data defaults to `~/.cloudvault/`.

## Code Conventions

- Components in `app/components/` — organized by domain (layout/, files/, admin/, providers/, ui/)
- Client components use `"use client"` directive
- API routes export named GET/POST/DELETE/PATCH handlers
- Filenames sanitized on upload: `file.name.replace(/[^\w\s.-]/gi, "")`
- Environment variables in `.env`: SESSION_SECRET, PORT, STORAGE_DIR, DB_PATH, MAX_UPLOAD_SIZE_MB
- ESLint uses flat config format (`eslint.config.mjs`)
- Dark theme is the default
- CSS variables for all colors (WCAG AA compliant)
- `uploads/` and `build/` are gitignored
