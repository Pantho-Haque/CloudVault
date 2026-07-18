"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components";

interface User {
  id: number;
  username: string;
  role: string;
}

interface StorageInfo {
  used: number;
  quota: number;
  available: number;
}

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  storageVersion?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const SHORTCUTS = [
  { key: "Ctrl+U", action: "Upload file" },
  { key: "Ctrl+K", action: "Search" },
  { key: "N", action: "New folder" },
  { key: "← →", action: "Navigate preview" },
  { key: "Esc", action: "Close modal" },
  { key: "?", action: "Toggle shortcuts" },
];

interface StorageBreakdown {
  ext: string;
  size: number;
}

const STORAGE_COLORS: Record<string, string> = {
  jpg: "#a855f7", jpeg: "#a855f7", png: "#a855f7", gif: "#eab308", webp: "#a855f7", svg: "#f97316", bmp: "#a855f7",
  mp4: "#ec4899", webm: "#ec4899", avi: "#ec4899", mov: "#ec4899",
  mp3: "#f97316", wav: "#f97316", flac: "#f97316", aac: "#f97316",
  pdf: "#ef4444",
  doc: "#3b82f6", docx: "#3b82f6",
  xls: "#22c55e", xlsx: "#22c55e", csv: "#22c55e",
  zip: "#eab308", rar: "#eab308", gz: "#eab308", "7z": "#eab308",
  txt: "#6b7280", md: "#6b7280",
  js: "#eab308", ts: "#3b82f6", json: "#eab308", html: "#f97316", css: "#3b82f6",
};

function getExtColor(ext: string): string {
  return STORAGE_COLORS[ext] || "#6b7280";
}

export default function Sidebar({ activeView, onViewChange, storageVersion = 0 }: SidebarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);
  const [collapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setShowShortcuts((s) => !s);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const fetchStorage = useCallback(() => {
    fetch("/api/files?resource=storage")
      .then((r) => r.json())
      .then((data) => {
        if (data.storageUsed !== undefined) {
          setStorage({ used: data.storageUsed || 0, quota: data.storageQuota || 0, available: data.storageAvailable || 0 });
        }
      })
      .catch(() => {});

    fetch("/api/files?resource=storage-breakdown")
      .then((r) => r.json())
      .then((data) => {
        if (data.breakdown) setBreakdown(data.breakdown);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch(() => {});

    fetchStorage();
  }, [fetchStorage]);

  useEffect(() => {
    if (storageVersion > 0) fetchStorage();
  }, [storageVersion, fetchStorage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navItems = [
    {
      id: "files",
      label: "My files",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
    },
    {
      id: "shared",
      label: "Shared links",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-6.364-6.364L4.757 8.25a4.5 4.5 0 006.364 6.364l4.5-4.5z" />
        </svg>
      ),
    },
    {
      id: "trash",
      label: "Trash",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
    },
    {
      id: "storage",
      label: "Storage",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      ),
    },
    {
      id: "admin",
      label: "Admin",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      adminOnly: true,
    },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  const storagePercent = storage && storage.quota > 0 ? Math.min((storage.used / storage.quota) * 100, 100) : 0;

  const initials = user?.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <>
      <aside
        className={`flex flex-col h-full bg-[var(--color-sidebar)] border-r border-[var(--color-border)] transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight">CloudVault</span>
          )}
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]"
                    : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text-active)]"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-blue-400" : ""}`}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {storage && !collapsed && (
          <div className="px-4 pb-3">
            <div className="rounded-xl bg-[var(--color-surface-raised)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {formatBytes(storage.used)} of {formatBytes(storage.quota)}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {storagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden flex">
                {breakdown.slice(0, 8).map((item) => {
                  const pct = storage.quota > 0 ? (item.size / storage.quota) * 100 : 0;
                  if (pct < 0.5) return null;
                  return (
                    <div
                      key={item.ext}
                      className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${pct}%`, backgroundColor: getExtColor(item.ext) }}
                      title={`${item.ext.toUpperCase()}: ${formatBytes(item.size)}`}
                    />
                  );
                })}
              </div>
              {breakdown.length > 0 && (
                <div className="mt-3 space-y-1">
                  {breakdown.slice(0, 5).map((item) => (
                    <div key={item.ext} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: getExtColor(item.ext) }}
                        />
                        <span className="text-[10px] text-[var(--color-text-secondary)] uppercase">
                          {item.ext}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {formatBytes(item.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="px-3 pb-3 space-y-1">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text-active)] transition-colors"
            >
              {resolvedTheme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
              <span>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            <button
              onClick={() => setShowShortcuts(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text-active)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span>Shortcuts</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text-active)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-[var(--color-sidebar-text-active)] truncate">{user?.username || "User"}</p>
                  <p className="text-[10px] text-[var(--color-sidebar-text)] capitalize">{user?.role || "user"}</p>
                </div>
              </button>
              {showUserMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowShortcuts(false)}>
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-[var(--color-text-secondary)]">{s.action}</span>
                  <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-[var(--color-text-muted)]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
