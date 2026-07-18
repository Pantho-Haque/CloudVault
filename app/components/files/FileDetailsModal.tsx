"use client";

import { getFileExtension } from "@/lib/fileIcons";
import { formatDate, formatFileSize } from "@/lib/operations";
import { useEffect, useRef, useState, useCallback } from "react";

interface FileEntry {
  name: string;
  path: string;
  size: number;
  modified: string;
  isDirectory: boolean;
}

interface FileDetailsModalProps {
  file: FileEntry | null;
  files?: FileEntry[];
  onNavigate?: (index: number) => void;
  onClose: () => void;
  onDelete?: () => void;
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "ogg"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg"]);
const PDF_EXTS = new Set(["pdf"]);
const LRU_LIMIT = 4;

class PreviewLRU {
  private cache = new Map<string, string>();
  private order: string[] = [];

  get(path: string): string | undefined {
    const url = this.cache.get(path);
    if (url) {
      this.order = this.order.filter((p) => p !== path);
      this.order.push(path);
    }
    return url;
  }

  set(path: string, url: string): void {
    if (this.cache.has(path)) {
      this.order = this.order.filter((p) => p !== path);
    }
    while (this.order.length >= LRU_LIMIT) {
      const evict = this.order.shift()!;
      const evicted = this.cache.get(evict);
      if (evicted) {
        URL.revokeObjectURL(evicted);
        this.cache.delete(evict);
      }
    }
    this.cache.set(path, url);
    this.order.push(path);
  }

  evict(path: string): void {
    const url = this.cache.get(path);
    if (url) {
      URL.revokeObjectURL(url);
      this.cache.delete(path);
      this.order = this.order.filter((p) => p !== path);
    }
  }

  clear(): void {
    for (const url of this.cache.values()) URL.revokeObjectURL(url);
    this.cache.clear();
    this.order = [];
  }
}

const lruRef = { current: new PreviewLRU() };

function usePreviewImage(file: FileEntry | null) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file?.path || !IMAGE_EXTS.has(getFileExtension(file.name).toLowerCase())) {
      setSrc(null);
      return;
    }

    const cached = lruRef.current.get(file.path);
    if (cached) {
      setSrc(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/files/preview?path=${encodeURIComponent(file.path)}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        lruRef.current.set(file.path, url);
        setSrc(url);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setSrc(null); setLoading(false); }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.path]);

  return { src, loading };
}

function ImagePreview({ file }: { file: FileEntry | null }) {
  const { src, loading } = usePreviewImage(file);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[var(--color-surface-sunken)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[var(--color-surface-sunken)]">
        <p className="text-sm text-[var(--color-text-muted)]">Preview not available</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-[var(--color-surface-sunken)] p-4">
      <img
        src={src}
        alt={file?.name || ""}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  );
}

function VideoPreview({ file }: { file: FileEntry }) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-black p-4">
      <video
        src={`/api/files/preview?path=${encodeURIComponent(file.path)}`}
        controls
        className="max-w-full max-h-full rounded-lg"
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}

function AudioPreview({ file }: { file: FileEntry }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[var(--color-surface-sunken)] gap-6">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
        </svg>
      </div>
      <audio src={`/api/files/preview?path=${encodeURIComponent(file.path)}`} controls className="w-80" />
    </div>
  );
}

function PdfPreview({ file }: { file: FileEntry }) {
  return (
    <div className="w-full h-full bg-[var(--color-surface-sunken)]">
      <iframe
        src={`/api/files/preview?path=${encodeURIComponent(file.path)}`}
        className="w-full h-full border-0 rounded-lg"
        title={file.name}
      />
    </div>
  );
}

function TextPreview({ file }: { file: FileEntry }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/files/preview?path=${encodeURIComponent(file.path)}`)
      .then((r) => r.text())
      .then((text) => { if (!cancelled) setContent(text.slice(0, 50000)); })
      .catch(() => { if (!cancelled) setContent("Unable to load preview"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [file.path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[var(--color-surface-sunken)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[var(--color-surface-sunken)] p-4 overflow-auto">
      <pre className="text-sm text-[var(--color-text-primary)] font-mono whitespace-pre-wrap break-words">{content}</pre>
    </div>
  );
}

function GenericPreview({ file }: { file: FileEntry | null }) {
  const ext = file ? getFileExtension(file.name).toLowerCase() : "";
  const badgeMap: Record<string, { bg: string; text: string; label: string }> = {
    pdf: { bg: "from-red-500 to-red-600", text: "text-red-400", label: "PDF" },
    doc: { bg: "from-blue-500 to-blue-600", text: "text-blue-400", label: "DOC" },
    docx: { bg: "from-blue-500 to-blue-600", text: "text-blue-400", label: "DOC" },
    xls: { bg: "from-green-500 to-green-600", text: "text-green-400", label: "XLS" },
    xlsx: { bg: "from-green-500 to-green-600", text: "text-green-400", label: "XLS" },
    zip: { bg: "from-amber-500 to-amber-600", text: "text-amber-400", label: "ZIP" },
    rar: { bg: "from-amber-500 to-amber-600", text: "text-amber-400", label: "RAR" },
    mp4: { bg: "from-pink-500 to-pink-600", text: "text-pink-400", label: "VID" },
    mp3: { bg: "from-orange-500 to-orange-600", text: "text-orange-400", label: "MP3" },
  };
  const badge = badgeMap[ext] || { bg: "from-gray-500 to-gray-600", text: "text-gray-400", label: ext.toUpperCase() || "FILE" };

  return (
    <div className="flex items-center justify-center w-full h-full bg-[var(--color-surface-sunken)]">
      <div className="flex flex-col items-center gap-4">
        <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${badge.bg} flex items-center justify-center shadow-2xl`}>
          <span className="text-4xl font-bold text-white/90">{badge.label}</span>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] max-w-xs text-center truncate">{file?.name}</p>
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: FileEntry | null }) {
  if (!file?.path) return <GenericPreview file={file} />;

  const ext = getFileExtension(file.name).toLowerCase();

  if (IMAGE_EXTS.has(ext)) return <ImagePreview file={file} />;
  if (VIDEO_EXTS.has(ext)) return <VideoPreview file={file} />;
  if (AUDIO_EXTS.has(ext)) return <AudioPreview file={file} />;
  if (PDF_EXTS.has(ext)) return <PdfPreview file={file} />;
  if (["txt", "md", "json", "js", "ts", "html", "css", "csv", "xml"].includes(ext)) return <TextPreview file={file} />;
  return <GenericPreview file={file} />;
}

export default function FileDetailsModal({ file, files = [], onNavigate, onClose, onDelete }: FileDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showShareForm, setShowShareForm] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [shareUsePassword, setShareUsePassword] = useState(false);
  const [shareExpiry, setShareExpiry] = useState("never");
  const [shareMaxDownloads, setShareMaxDownloads] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<{ linkId: string; url: string } | null>(null);
  const [shareError, setShareError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const nonDirFiles = files.filter((f) => !f.isDirectory);

  const navigate = useCallback((direction: "prev" | "next") => {
    if (!onNavigate || nonDirFiles.length === 0) return;
    const fileIdx = nonDirFiles.findIndex((f) => f.path === file?.path);
    if (fileIdx === -1) return;
    let targetIdx: number;
    if (direction === "next") {
      targetIdx = (fileIdx + 1) % nonDirFiles.length;
    } else {
      targetIdx = (fileIdx - 1 + nonDirFiles.length) % nonDirFiles.length;
    }
    const target = nonDirFiles[targetIdx];
    const targetFileIdx = files.findIndex((f) => f.path === target.path);
    onNavigate(targetFileIdx);
    resetShare();
  }, [file?.path, files, nonDirFiles, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); navigate("prev"); }
      else if (e.key === "ArrowRight") { e.preventDefault(); navigate("next"); }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose, navigate]);

  useEffect(() => {
    return () => { lruRef.current.clear(); };
  }, []);

  const handleDownload = () => {
    if (!file?.path) return;
    window.open(`/api/files?fileName=${encodeURIComponent(file.name)}`, "_blank");
  };

  const handleDelete = async () => {
    if (!file?.path || !onDelete) return;
    if (!confirm(`Delete "${file.name}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/files?fileName=${encodeURIComponent(file.name)}`, { method: "DELETE" });
      lruRef.current.evict(file.path);
      onDelete();
      onClose();
    } catch { setDeleting(false); }
  };

  const handleShare = async () => {
    if (!file?.path) return;
    setShareLoading(true);
    setShareError("");
    try {
      const body: Record<string, unknown> = { filePath: file.path };
      if (shareUsePassword && sharePassword) body.password = sharePassword;
      if (shareExpiry !== "never") body.expiresInHours = parseInt(shareExpiry);
      if (shareMaxDownloads) body.maxDownloads = parseInt(shareMaxDownloads);
      const res = await fetch("/api/files/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setShareError(data.message || "Failed to create link"); return; }
      setShareResult({ linkId: data.linkId, url: `${window.location.origin}${data.url}` });
    } catch { setShareError("Failed to create share link"); }
    finally { setShareLoading(false); }
  };

  const copyShareLink = () => {
    if (!shareResult?.url) return;
    navigator.clipboard.writeText(shareResult.url).catch(() => {
      const input = document.createElement("input");
      input.value = shareResult.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    });
  };

  const resetShare = () => {
    setShowShareForm(false);
    setShareResult(null);
    setShareError("");
    setSharePassword("");
    setShareUsePassword(false);
    setShareExpiry("never");
    setShareMaxDownloads("");
  };

  if (!file) return null;

  const ext = getFileExtension(file.name).toLowerCase();
  const extLabel = ext.toUpperCase() || "FILE";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div
        ref={modalRef}
        className="bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col overflow-hidden"
        style={{ width: "min(85vw, 1400px)", height: "min(95vh, 900px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {extLabel}
            </span>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{file.name}</h2>
            <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
              {nonDirFiles.findIndex((f) => f.path === file?.path) + 1} / {nonDirFiles.length}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {nonDirFiles.length > 1 && (
              <>
                <button onClick={() => navigate("prev")} className="p-1.5 rounded-lg text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors" title="Previous (Left arrow)">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <button onClick={() => navigate("next")} className="p-1.5 rounded-lg text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors" title="Next (Right arrow)">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <FilePreview file={file} />
          </div>

          <div className="w-80 shrink-0 border-l border-[var(--color-border)] flex flex-col overflow-y-auto">
            {!showShareForm ? (
              <>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">File Info</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Name</span>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] break-all mt-0.5">{file.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Size</span>
                          <p className="text-sm font-medium text-[var(--color-text-primary)] mt-0.5">{formatFileSize(file.size)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Type</span>
                          <p className="text-sm font-medium text-[var(--color-text-primary)] mt-0.5">{extLabel}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Modified</span>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] mt-0.5">{formatDate(file.modified)}</p>
                      </div>
                      {file.path && (
                        <div>
                          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Path</span>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-all font-mono">{file.path}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-auto p-5 border-t border-[var(--color-border)] space-y-2">
                  <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Download
                  </button>
                  <button onClick={() => { resetShare(); setShowShareForm(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-border-subtle)] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                    Share
                  </button>
                  {onDelete && (
                    <button onClick={handleDelete} disabled={deleting} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[var(--color-danger)] bg-[var(--color-danger-subtle)] rounded-xl text-sm font-medium hover:opacity-80 transition-colors disabled:opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Share File</h3>
                  <button onClick={resetShare} className="text-[var(--color-icon-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {shareResult ? (
                  <div className="space-y-3">
                    <div className="bg-[var(--color-success-subtle)] text-[var(--color-success-text)] px-3 py-2 rounded-xl text-xs">Link created!</div>
                    <div className="flex items-center gap-1.5">
                      <input type="text" readOnly value={shareResult.url} className="flex-1 px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-sunken)] text-[var(--color-text-primary)]" />
                      <button onClick={copyShareLink} className="px-2.5 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs hover:bg-[var(--color-primary-hover)] transition-colors">Copy</button>
                    </div>
                    <button onClick={resetShare} className="w-full py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] rounded-xl hover:bg-[var(--color-border-subtle)] transition-colors">Create another</button>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    {shareError && <div className="bg-[var(--color-danger-subtle)] text-[var(--color-danger-text)] px-3 py-2 rounded-xl text-xs">{shareError}</div>}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={shareUsePassword} onChange={(e) => setShareUsePassword(e.target.checked)} className="h-3.5 w-3.5 rounded text-[var(--color-primary)]" />
                      <span className="text-xs text-[var(--color-text-primary)]">Password protect</span>
                    </label>
                    {shareUsePassword && <input type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none" placeholder="Enter password" />}
                    <div>
                      <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Expires</label>
                      <select value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                        <option value="never">Never</option>
                        <option value="1">1 hour</option>
                        <option value="24">24 hours</option>
                        <option value="168">7 days</option>
                        <option value="720">30 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Max downloads</label>
                      <input type="number" value={shareMaxDownloads} onChange={(e) => setShareMaxDownloads(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-focus-ring)] outline-none" placeholder="Unlimited" min="0" />
                    </div>
                    <button onClick={handleShare} disabled={shareLoading} className="w-full py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50">
                      {shareLoading ? "Creating..." : "Create Share Link"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
