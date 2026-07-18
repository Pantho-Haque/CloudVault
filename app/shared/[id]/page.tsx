"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

function getFileIcon(ext: string): { color: string; label: string } {
  const image = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
  const video = ["mp4", "webm", "avi", "mov", "mkv"];
  const audio = ["mp3", "wav", "flac", "aac", "ogg"];
  const docs = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

  if (image.includes(ext)) return { color: "#a855f7", label: ext.toUpperCase() };
  if (video.includes(ext)) return { color: "#ec4899", label: "VID" };
  if (audio.includes(ext)) return { color: "#f97316", label: "AUD" };
  if (docs.includes(ext)) return { color: "#ef4444", label: ext.toUpperCase() };
  return { color: "#6b7280", label: ext.toUpperCase() || "FILE" };
}

export default function SharedPage() {
  const params = useParams();
  const linkId = params.id as string;
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [fileName, setFileName] = useState("");
  const [meta, setMeta] = useState<{ fileName: string } | null>(null);

  useEffect(() => {
    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.fileName) {
          setMeta(data);
          setFileName(data.fileName);
        } else if (data.message?.includes("Password")) {
          setNeedsPassword(true);
        } else if (data.message) {
          setError(data.message);
        }
      })
      .catch(() => {});
  }, [linkId]);

  const ext = fileName.split(".").pop() || "";
  const icon = getFileIcon(ext);

  const handleAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, password: password || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.message?.includes("Password")) {
          setNeedsPassword(true);
          setError("");
        } else {
          setError(data.message || "Access denied");
        }
        return;
      }

      if (data.fileName) setFileName(data.fileName);
      window.location.href = `/api/share?id=${linkId}${password ? `&password=${encodeURIComponent(password)}` : ""}`;
    } catch {
      setError("Failed to access file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl p-8 max-w-md w-full border border-[var(--color-border)]">
        <div className="text-center mb-6">
          {fileName ? (
            <div className="mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-3"
                style={{ backgroundColor: icon.color + "18", color: icon.color }}
              >
                {icon.label}
              </div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] break-all">{fileName}</h1>
              {meta && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1">has been shared with you</p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Shared File</h1>
            </div>
          )}
          <p className="text-[var(--color-text-muted)] text-sm">
            {error ? "" : needsPassword ? "This file is password-protected" : "Click below to download"}
          </p>
        </div>

        {error && (
          <div className="bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] text-[var(--color-danger-text)] px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {needsPassword ? (
          <form onSubmit={handleAccess} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-focus-ring)] outline-none transition-all"
                placeholder="Enter password"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
              {loading ? "Verifying..." : "Unlock & Download"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => handleAccess()}
            disabled={loading}
            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            {loading ? "Downloading..." : "Download File"}
          </button>
        )}

        <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] text-center">
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Shared via CloudVault
          </p>
        </div>
      </div>
    </div>
  );
}
