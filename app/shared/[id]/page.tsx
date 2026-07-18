"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function SharedPage() {
  const params = useParams();
  const linkId = params.id as string;
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);

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
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg inline-block mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Shared File</h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">
            {needsPassword ? "This file is password-protected" : "Click below to download"}
          </p>
        </div>

        {error && (
          <div className="bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] text-[var(--color-danger-text)] px-4 py-3 rounded-xl mb-4 text-sm">
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
              className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Download File"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => handleAccess()}
            disabled={loading}
            className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {loading ? "Downloading..." : "Download File"}
          </button>
        )}
      </div>
    </div>
  );
}
