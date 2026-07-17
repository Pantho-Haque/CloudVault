// ═══════════════════════════════════════════
// @/components — single entry point
// ═══════════════════════════════════════════

// ── Providers ──────────────────────────────
export { ThemeProvider, useTheme } from "./providers/ThemeProvider";

// ── Layout ─────────────────────────────────
export { default as Header } from "./layout/Header";
export { default as Footer } from "./layout/Footer";
export { default as ServiceWorkerRegistration } from "./layout/ServiceWorkerRegistration";

// ── Files ──────────────────────────────────
export { default as FileBrowser } from "./files/FileBrowser";
export { default as FileList } from "./files/FileList";
export { default as FileListTable } from "./files/FileListTable";
export { default as FileGridView } from "./files/FileGridView";
export { default as FileDetailsModal } from "./files/FileDetailsModal";
export { default as FileUploader } from "./files/FileUploader";
export { default as FileStatistics } from "./files/FileStatistics";
export { default as SearchBar } from "./files/SearchBar";
export { default as ShareLinkModal } from "./files/ShareLinkModal";

// ── Admin ──────────────────────────────────
export { default as AdminDashboard } from "./admin/AdminDashboard";
export { default as AdminUserTable } from "./admin/AdminUserTable";
export { default as AdminSessionList } from "./admin/AdminSessionList";
export { default as ConfirmDialog } from "./admin/ConfirmDialog";
export { default as ToastContainer } from "./admin/Toast";

// ── UI ─────────────────────────────────────
export { default as StatusMessage } from "./ui/StatusMessage";
