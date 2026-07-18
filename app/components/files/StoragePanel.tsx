"use client";

import { useState, useEffect } from "react";

interface StorageInfo {
  used: number;
  quota: number;
  available: number;
}

interface StorageBreakdown {
  ext: string;
  size: number;
}

const STORAGE_COLORS: Record<string, string> = {
  jpg: "#a855f7", jpeg: "#a855f7", png: "#a855f7", gif: "#eab308", webp: "#a855f7", svg: "#f97316", bmp: "#a855f7", ico: "#a855f7",
  mp4: "#ec4899", webm: "#ec4899", avi: "#ec4899", mov: "#ec4899", mkv: "#ec4899",
  mp3: "#f97316", wav: "#f97316", flac: "#f97316", aac: "#f97316", ogg: "#f97316",
  pdf: "#ef4444",
  doc: "#3b82f6", docx: "#3b82f6",
  xls: "#22c55e", xlsx: "#22c55e", csv: "#22c55e",
  zip: "#eab308", rar: "#eab308", gz: "#eab308", "7z": "#eab308", tar: "#eab308",
  txt: "#6b7280", md: "#6b7280",
  js: "#eab308", ts: "#3b82f6", json: "#eab308", html: "#f97316", css: "#3b82f6",
  exe: "#ef4444", dmg: "#ef4444", iso: "#ef4444",
  psd: "#a855f7", ai: "#f97316", sketch: "#eab308",
};

function getExtColor(ext: string): string {
  return STORAGE_COLORS[ext] || "#6b7280";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getCategory(ext: string): string {
  const image = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "avif"];
  const video = ["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv"];
  const audio = ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"];
  const documents = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt", "md", "rtf"];
  const archives = ["zip", "rar", "gz", "7z", "tar", "bz2", "xz"];
  const code = ["js", "ts", "jsx", "tsx", "json", "html", "css", "py", "rb", "go", "rs", "java", "c", "cpp", "h"];

  if (image.includes(ext)) return "Images";
  if (video.includes(ext)) return "Video";
  if (audio.includes(ext)) return "Audio";
  if (documents.includes(ext)) return "Documents";
  if (archives.includes(ext)) return "Archives";
  if (code.includes(ext)) return "Code";
  return "Other";
}

const CATEGORY_COLORS: Record<string, string> = {
  Images: "#a855f7",
  Video: "#ec4899",
  Audio: "#f97316",
  Documents: "#3b82f6",
  Archives: "#eab308",
  Code: "#22c55e",
  Other: "#6b7280",
};

export default function StoragePanel() {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/files?resource=storage").then((r) => r.json()),
      fetch("/api/files?resource=storage-breakdown").then((r) => r.json()),
    ])
      .then(([storageData, breakdownData]) => {
        setStorage({
          used: storageData.storageUsed || 0,
          quota: storageData.storageQuota || 0,
          available: storageData.storageAvailable || 0,
        });
        setBreakdown(breakdownData.breakdown || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[var(--color-text-muted)]">Loading storage info...</div>
      </div>
    );
  }

  if (!storage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[var(--color-text-muted)]">Failed to load storage info</div>
      </div>
    );
  }

  const usedPercent = storage.quota > 0 ? (storage.used / storage.quota) * 100 : 0;

  const categoryMap = new Map<string, number>();
  for (const item of breakdown) {
    const cat = getCategory(item.ext);
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.size);
  }
  const categories = Array.from(categoryMap.entries())
    .map(([name, size]) => ({ name, size }))
    .sort((a, b) => b.size - a.size);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Storage</h2>
        <p className="text-xs text-[var(--color-text-muted)]">Disk usage and file breakdown</p>
      </div>

      {/* Disk overview */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] p-5">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">{formatBytes(storage.used)}</span>
          <span className="text-sm text-[var(--color-text-muted)]">of {formatBytes(storage.quota)}</span>
        </div>
        <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${usedPercent}%`,
              background: usedPercent > 90 ? "var(--color-danger)" : usedPercent > 70 ? "#eab308" : "#3b82f6",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-secondary)]">
            {formatBytes(storage.available)} available
          </span>
          <span className="text-[var(--color-text-muted)]">
            {usedPercent.toFixed(1)}% used
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">By category</h3>
          <div className="space-y-3">
            {categories.map((cat) => {
              const pct = storage.used > 0 ? (cat.size / storage.used) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.name] || "#6b7280" }}
                      />
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">{cat.name}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(cat.size)}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat.name] || "#6b7280" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extension breakdown */}
      {breakdown.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">By file type</h3>
          <div className="space-y-2">
            {breakdown.slice(0, 15).map((item) => {
              const pct = storage.used > 0 ? (item.size / storage.used) * 100 : 0;
              return (
                <div key={item.ext} className="flex items-center gap-3">
                  <div className="w-16 text-right">
                    <span className="text-[10px] font-mono font-semibold text-[var(--color-text-secondary)] uppercase">
                      {item.ext}
                    </span>
                  </div>
                  <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: getExtColor(item.ext) }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-[10px] text-[var(--color-text-muted)]">{formatBytes(item.size)}</span>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-[10px] text-[var(--color-text-muted)]">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          {breakdown.length > 15 && (
            <div className="mt-2 text-[10px] text-[var(--color-text-muted)]">
              +{breakdown.length - 15} more types
            </div>
          )}
        </div>
      )}

      {breakdown.length === 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] p-8 text-center">
          <div className="text-sm text-[var(--color-text-muted)]">No files uploaded yet</div>
        </div>
      )}
    </div>
  );
}
