# CloudVault

A file storage and management web application built with Next.js 15 App Router.

## Commands

- `pnpm install` — install dependencies
- `pnpm run dev` — start dev server (Turbopack)
- `pnpm run build` — production build
- `pnpm run start` — start production server
- `pnpm run lint` — lint with ESLint (next/core-web-vitals + next/typescript)

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **React**: v19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 (via @tailwindcss/postcss)
- **Animation**: Framer Motion
- **Icons**: @heroicons/react
- **Drag & Drop**: react-drag-drop-files

## Project Structure

```
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
    files/route.ts              — File CRUD, SSE streaming, pagination
    files/batch/route.ts        — Batch delete/move
    files/folders/route.ts      — Create/rename folders
    files/folder-stats/route.ts — Recursive folder size/count
    files/move/route.ts         — Move files/folders
    files/search/route.ts       — Advanced search (type, size, date)
    files/share/route.ts        — Share link CRUD
    files/thumbnail/route.ts    — File type thumbnails (SVG badges)
    files/preview/route.ts      — Full-resolution file preview
    files/trash/route.ts        — Trash management
    files/versions/route.ts     — File versioning
    auth/login/route.ts         — Login
    auth/logout/route.ts        — Logout
    auth/me/route.ts            — Current user info
    auth/setup/route.ts         — First-time setup
    auth/admin/route.ts         — User/session management
    auth/change-password/route.ts — Password change
    share/route.ts              — Public share link access
    audit/route.ts              — Audit log
    health/route.ts             — Health check
  components/
    layout/
      Sidebar.tsx               — Sidebar navigation (nav, storage, theme, shortcuts, user)
      TopBar.tsx                — Breadcrumbs, search, view toggle, upload button, avatar
      Header.tsx                — Legacy header (still exported)
      Footer.tsx                — Legacy footer
      ServiceWorkerRegistration.tsx
    files/
      FileBrowser.tsx           — Main orchestrator (infinite scroll, SSE, navigation)
      FileList.tsx              — Sort, search, selection, select-all, infinite scroll sentinel
      FileListTable.tsx         — Table view with lazy thumbnails
      FileGridView.tsx          — Grid view with lazy thumbnails
      FileDetailsModal.tsx      — Large preview modal (LRU cache of 4, arrow navigation)
      FileUploader.tsx          — File/folder upload with progress popover
      FileStatistics.tsx        — Slide-in stats panel
      SearchBar.tsx             — Search input
      ShareLinkModal.tsx        — Share link creation form
      ShareLinksView.tsx        — Shared links management
      TrashView.tsx             — Trash management
      LazyThumbnail.tsx         — Canvas-resized thumbnails (32x32, JPEG 0.2)
      UploadProgressPopover.tsx — Floating upload progress indicator
    admin/
      AdminDashboard.tsx        — Stats cards
      AdminUserTable.tsx        — User management table
      AdminSessionList.tsx      — Active sessions
      ConfirmDialog.tsx         — Confirmation dialogs
      Toast.tsx                 — Toast notifications
    providers/
      ThemeProvider.tsx          — Light/dark/system theme with localStorage
    ui/
      StatusMessage.tsx         — Status message display
lib/
  config.ts                     — Environment config (storage, DB, secrets)
  db.ts                         — SQLite database (users, sessions, files, share_links, audit)
  auth.ts                       — Password hashing, session management, RBAC, brute-force protection
  storage.ts                    — In-memory file manifest, directory walking
  sse.ts                        — Server-Sent Events for real-time updates
  startup.ts                    — Initial setup, credential generation
  operations.ts                 — formatFileSize, formatDate, formatTimeAgo
  fileIcons.tsx                 — File extension to icon mapping
types/
  node-sqlite.d.ts              — Type declarations for node:sqlite
uploads/                        — Server-side file storage (auto-created, gitignored)
```

## Architecture Notes

- **Database**: SQLite via `node:sqlite` (requires Node 24+). Tables: users, sessions, files, file_versions, audit_log, share_links. WAL mode.
- **Authentication**: scrypt password hashing (64-byte key), session cookies (7-day expiry), brute-force protection (5 attempts / 15-min lockout).
- **Roles**: admin, write, read. RBAC enforced via middleware and API handlers.
- **File storage**: Files saved to `uploads/` directory. In-memory manifest for fast listing. Folder sizes computed recursively.
- **Real-time updates**: SSE via `/api/files?stream=1`. Clients receive `file-change` events.
- **Infinite scroll**: API supports `?offset=N&limit=50` pagination. Client loads 50 files per page, IntersectionObserver triggers next page load.
- **Memory optimization**: List thumbnails are canvas-resized to 32x32 at JPEG 0.2 quality. Modal preview uses LRU cache of 4 blob URLs. Preview API serves full-resolution files on demand.
- **PWA**: Service worker with cache-first strategy, web manifest for installability.
- **Build output**: Custom `distDir: "build"` in next.config.ts. Standalone output.
- **Path alias**: `@/*` maps to project root. `@components/*` also supported.

## Code Conventions

- Components in `app/components/` — organized by domain (layout/, files/, admin/, providers/, ui/)
- Client components use `"use client"` directive
- API routes export named GET/POST/DELETE/PATCH handlers
- Filenames sanitized on upload: `file.name.replace(/[^\w\s.-]/gi, "")`
- Environment variables in `.env`: SESSION_SECRET, PORT, STORAGE_DIR, DB_PATH, MAX_UPLOAD_SIZE_MB
- ESLint uses flat config format (`eslint.config.mjs`)
- Dark theme is the default
- CSS variables for all colors (WCAG AA compliant)
