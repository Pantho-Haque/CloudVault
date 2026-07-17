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
  page.tsx              — Main page (client component, file list + stats)
  layout.tsx            — Root layout with Geist fonts
  globals.css           — Global styles
  api/files/route.ts    — API routes (GET/POST/DELETE for files)
  components/           — UI components
    Header.jsx
    FileList.jsx
    FileListTable.tsx
    FileUploader.jsx
    FileDetailsModal.jsx
    FileStatistics.jsx
    SearchBar.jsx
    StatusMessage.jsx
    Footer.jsx
lib/
  operations.ts         — File utilities (formatSize, formatDate, download, delete)
  fileIcons.tsx         — File type icon mapping
uploads/                — Server-side file storage (created at runtime)
```

## Architecture Notes

- **File storage**: Uploaded files are saved to `uploads/` directory on the server filesystem. No database.
- **API**: Single route at `/api/files` handling GET (list/download), POST (upload), DELETE.
- **Real-time updates**: Client polls `/api/files?poll=true&since=<timestamp>` for long-polling change detection.
- **Build output**: Custom `distDir: "build"` in next.config.ts (not default `.next`).
- **Path alias**: `@/*` maps to project root.

## Code Conventions

- Components in `app/components/` — mix of `.jsx` and `.tsx` files
- Client components use `"use client"` directive
- API routes export named GET/POST/DELETE handlers
- Filenames sanitized on upload: `file.name.replace(/[^\w\s.-]/gi, "")`
- No environment variables currently in use
- ESLint uses flat config format (`eslint.config.mjs`)
