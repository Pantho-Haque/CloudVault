"use client";

import { useUploadProgress } from "./FileUploader";
import { useState, useEffect } from "react";

export default function UploadProgressPopover() {
  const progress = useUploadProgress();
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (progress.active) {
      setMinimized(false);
      setDismissed(false);
    }
  }, [progress.active]);

  useEffect(() => {
    if (!progress.active && progress.total > 0 && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [progress.active, progress.total, dismissed]);

  if (dismissed || (!progress.active && progress.total === 0)) return null;

  if (!progress.active && progress.total > 0) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-4 w-72">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-success-subtle)] flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Upload complete</p>
              <p className="text-xs text-[var(--color-text-muted)]">{progress.total} files uploaded</p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden w-80">
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--color-surface-raised)] transition-colors"
          onClick={() => setMinimized(!minimized)}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary)]">
              {percent}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Uploading files...
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {progress.current} / {progress.total} files
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-[var(--color-icon-muted)] transition-transform ${minimized ? "" : "rotate-180"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </div>

        {!minimized && (
          <div className="px-4 pb-4 space-y-2">
            <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            {progress.fileName && (
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                {progress.fileName} &mdash; {progress.progress}%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
