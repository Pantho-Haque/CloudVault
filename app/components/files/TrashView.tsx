"use client";

import { useState, useEffect } from "react";

interface TrashFile {
  trashName: string;
  name: string;
  size: number;
  modified: string;
  deletedAt: string;
}

interface TrashViewProps {
  onRestore: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Just now";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

export default function TrashView({ onRestore }: TrashViewProps) {
  const [trashFiles, setTrashFiles] = useState<TrashFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const res = await fetch("/api/files/trash");
      const data = await res.json();
      setTrashFiles(data.files || []);
    } catch (error) {
      console.error("Error loading trash:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromTrash = async (trashName: string) => {
    await fetch("/api/files/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashName }),
    });
    fetchTrash();
    onRestore();
  };

  const deletePermanently = async (trashName: string) => {
    if (!confirm("Permanently delete this item?")) return;
    await fetch("/api/files/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashName }),
    });
    fetchTrash();
  };

  const emptyTrash = async () => {
    if (!confirm("Permanently delete all items in trash?")) return;
    await fetch("/api/files/trash", { method: "DELETE" });
    setTrashFiles([]);
    onRestore();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Trash</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {trashFiles.length} {trashFiles.length === 1 ? "item" : "items"} in trash
          </p>
        </div>
        {trashFiles.length > 0 && (
          <button
            onClick={emptyTrash}
            className="px-4 py-2 text-sm font-medium text-[var(--color-danger)] bg-[var(--color-danger-subtle)] hover:bg-[var(--color-danger-subtle)] rounded-xl transition-colors"
          >
            Empty trash
          </button>
        )}
      </div>

      {trashFiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-surface-raised)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">Trash is empty</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Deleted files will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trashFiles.map((file) => (
            <div
              key={file.trashName}
              className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-border-strong)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-surface-raised)] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{timeAgo(file.deletedAt)} &middot; {formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => restoreFromTrash(file.trashName)}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary-subtle)] hover:bg-[var(--color-primary-subtle)] rounded-lg transition-colors"
                >
                  Restore
                </button>
                <button
                  onClick={() => deletePermanently(file.trashName)}
                  className="p-2 text-[var(--color-icon-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] rounded-lg transition-colors"
                  title="Delete permanently"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
