"use client";

import { useState, useEffect, useCallback } from "react";

interface ShareLink {
  id: string;
  file_path: string;
  has_password: number;
  expires_at: string | null;
  download_count: number;
  max_downloads: number | null;
  created_at: string;
}

export default function ShareLinksView() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/files/share");
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error fetching share links:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const deleteLink = async (linkId: string) => {
    try {
      await fetch("/api/files/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (error) {
      console.error("Error deleting share link:", error);
    }
  };

  const copyLink = (linkId: string) => {
    const url = `${window.location.origin}/shared/${linkId}`;
    navigator.clipboard.writeText(url).catch(() => {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    });
  };

  const getFolderPath = (filePath: string) => {
    const parts = filePath.split("/");
    parts.pop();
    return parts.join("/");
  };

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        {/* Skeleton loading state */}
        <div className="mb-6">
          <div className="h-6 w-32 bg-[var(--color-surface-raised)] rounded mb-2" />
          <div className="h-4 w-48 bg-[var(--color-surface-raised)] rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-[var(--color-surface-raised)] rounded" />
                  <div className="h-3 w-32 bg-[var(--color-surface-raised)] rounded" />
                </div>
                <div className="flex gap-1">
                  <div className="h-8 w-8 bg-[var(--color-surface-raised)] rounded-lg" />
                  <div className="h-8 w-8 bg-[var(--color-surface-raised)] rounded-lg" />
                  <div className="h-8 w-8 bg-[var(--color-surface-raised)] rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Shared links</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage your shared file links</p>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-surface-raised)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-6.364-6.364L4.757 8.25a4.5 4.5 0 006.364 6.364l4.5-4.5z" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">No shared links yet</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Share a file to create your first link</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const folderPath = getFolderPath(link.file_path);
            const fileName = getFileName(link.file_path);
            const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
            const isAtLimit = link.max_downloads != null && link.download_count >= link.max_downloads;

            return (
              <div
                key={link.id}
                className={`p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl transition-colors ${
                  isExpired || isAtLimit ? "opacity-60" : "hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {fileName}
                      </p>
                      {isExpired && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-warning-subtle)] text-[var(--color-warning)]">
                          Expired
                        </span>
                      )}
                      {isAtLimit && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-danger-subtle)] text-[var(--color-danger)]">
                          Limit reached
                        </span>
                      )}
                      {link.has_password === 1 && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-muted)]">
                      {folderPath && (
                        <button
                          onClick={() => { window.location.href = `/files/${folderPath}`; }}
                          className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                          title={`Go to ${folderPath}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                          </svg>
                          {folderPath}
                        </button>
                      )}
                      <span>{link.download_count}{link.max_downloads != null ? `/${link.max_downloads}` : ""} downloads</span>
                      {link.expires_at && (
                        <span>Expires {new Date(link.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/shared/${link.id}`;
                        const w = window.open("", "_blank", "width=300,height=350");
                        if (w) {
                          w.document.write(`<!DOCTYPE html><html><head><title>QR Code</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:#0a0e17;color:#fff}img{border-radius:12px}p{font-size:11px;color:#888;margin-top:8px}</style></head><body><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=000000&color=ffffff" width="200" height="200"><p>Scan to open on phone</p></body></html>`);
                          w.document.close();
                        }
                      }}
                      className="p-2 text-[var(--color-icon-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Show QR code"
                      aria-label="Show QR code for this link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => copyLink(link.id)}
                      className="p-2 text-[var(--color-icon-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Copy link"
                      aria-label="Copy share link to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="p-2 text-[var(--color-icon-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Delete link"
                      aria-label="Delete this share link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
