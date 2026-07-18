"use client";

import { useState } from "react";

interface ShareLinkModalProps {
  filePath: string;
  onClose: () => void;
}

export default function ShareLinkModal({ filePath, onClose }: ShareLinkModalProps) {
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState("never");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ linkId: string; url: string } | null>(null);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = { filePath };
      if (usePassword && password) body.password = password;
      if (expiresIn !== "never") body.expiresInHours = parseInt(expiresIn);
      if (maxDownloads) body.maxDownloads = parseInt(maxDownloads);

      const res = await fetch("/api/files/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create link");
        return;
      }

      setResult({ linkId: data.linkId, url: `${window.location.origin}${data.url}` });
    } catch {
      setError("Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.url) {
      try {
        await navigator.clipboard.writeText(result.url);
      } catch {
        // Fallback for non-secure contexts (HTTP)
        const input = document.createElement("input");
        input.value = result.url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl max-w-md w-full p-6 border border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Share File</h3>
          <button onClick={onClose} className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="bg-[var(--color-success-subtle)] border border-[var(--color-success)] text-[var(--color-success-text)] px-4 py-3 rounded-lg text-sm">
              Share link created successfully!
            </div>
            <div className="flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(result.url)}&bgcolor=000000&color=ffffff`}
                alt="QR Code"
                className="rounded-xl border border-[var(--color-border)]"
                width={160}
                height={160}
              />
            </div>
            <p className="text-center text-[10px] text-[var(--color-text-muted)]">Scan to open on another device</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.url}
                className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-sunken)] text-[var(--color-text-primary)]"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-lg text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Copy
              </button>
            </div>
            <button onClick={onClose} className="w-full py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-sunken)] rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] text-[var(--color-danger-text)] px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="usePassword"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="h-4 w-4 text-[var(--color-primary)] rounded"
              />
              <label htmlFor="usePassword" className="text-sm text-[var(--color-text-primary)]">Password protect</label>
            </div>

            {usePassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                placeholder="Enter password"
              />
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Expires</label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              >
                <option value="never">Never</option>
                <option value="1">1 hour</option>
                <option value="24">24 hours</option>
                <option value="168">7 days</option>
                <option value="720">30 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Max downloads (0 = unlimited)</label>
              <input
                type="number"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none"
                placeholder="0"
                min="0"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-2.5 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Share Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
