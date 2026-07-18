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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getCategory(ext: string): { name: string; icon: string } {
  const image = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "avif"];
  const video = ["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv"];
  const audio = ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"];
  const documents = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt", "md", "rtf"];
  const archives = ["zip", "rar", "gz", "7z", "tar", "bz2", "xz"];
  const code = ["js", "ts", "jsx", "tsx", "json", "html", "css", "py", "rb", "go", "rs", "java", "c", "cpp", "h"];

  if (image.includes(ext)) return { name: "Images", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" };
  if (video.includes(ext)) return { name: "Video", icon: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" };
  if (audio.includes(ext)) return { name: "Audio", icon: "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" };
  if (documents.includes(ext)) return { name: "Documents", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" };
  if (archives.includes(ext)) return { name: "Archives", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" };
  if (code.includes(ext)) return { name: "Code", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" };
  return { name: "Other", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" };
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

function getExtColor(ext: string): string {
  const STORAGE_COLORS: Record<string, string> = {
    jpg: "#a855f7", jpeg: "#a855f7", png: "#a855f7", gif: "#eab308", webp: "#a855f7",
    mp4: "#ec4899", webm: "#ec4899", avi: "#ec4899", mov: "#ec4899", mkv: "#ec4899",
    mp3: "#f97316", wav: "#f97316", flac: "#f97316", aac: "#f97316",
    pdf: "#ef4444", doc: "#3b82f6", docx: "#3b82f6",
    xls: "#22c55e", xlsx: "#22c55e", csv: "#22c55e",
    zip: "#eab308", rar: "#eab308", gz: "#eab308", "7z": "#eab308",
    txt: "#6b7280", md: "#6b7280",
    js: "#eab308", ts: "#3b82f6", json: "#eab308", html: "#f97316", css: "#3b82f6",
  };
  return STORAGE_COLORS[ext] || "#6b7280";
}

function DonutChart({ percent, color }: { percent: number; color: string }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export default function StoragePanel({ storageVersion = 0 }: { storageVersion?: number }) {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setLoading(true);
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
      .finally(() => { setLoading(false); setInitialLoad(false); });
  }, [storageVersion]);

  if (loading && initialLoad) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
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
  const donutColor = usedPercent > 90 ? "var(--color-danger, #ef4444)" : usedPercent > 70 ? "#eab308" : "#3b82f6";

  const categoryMap = new Map<string, number>();
  for (const item of breakdown) {
    const cat = getCategory(item.ext).name;
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.size);
  }
  const CATEGORY_ICONS: Record<string, string> = {
    Images: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
    Video: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z",
    Audio: "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z",
    Documents: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    Archives: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
    Code: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    Other: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  };

  const categories = Array.from(categoryMap.entries())
    .map(([name, size]) => ({ name, size, icon: CATEGORY_ICONS[name] || CATEGORY_ICONS.Other }))
    .sort((a, b) => b.size - a.size);

  const fileCountMap = new Map<string, number>();
  for (const item of breakdown) {
    const cat = getCategory(item.ext).name;
    fileCountMap.set(cat, (fileCountMap.get(cat) || 0) + 1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Storage</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Disk usage and file breakdown</p>
        </div>
        {loading && (
          <div className="w-4 h-4 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
        )}
      </div>

      {/* Hero card — donut + stats */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] p-6">
        <div className="flex items-center gap-8">
          <div className="relative shrink-0">
            <DonutChart percent={usedPercent} color={donutColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">{usedPercent.toFixed(1)}%</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">used</span>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">{formatBytes(storage.used)}</div>
              <div className="text-sm text-[var(--color-text-muted)]">of {formatBytes(storage.quota)} total</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-surface-raised)] rounded-xl px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium mb-1">Available</div>
                <div className="text-lg font-bold text-emerald-500">{formatBytes(storage.available)}</div>
              </div>
              <div className="bg-[var(--color-surface-raised)] rounded-xl px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium mb-1">Used by files</div>
                <div className="text-lg font-bold text-[var(--color-text-primary)]">{formatBytes(storage.used)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category cards */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">By category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const pct = storage.used > 0 ? (cat.size / storage.used) * 100 : 0;
              const count = fileCountMap.get(cat.name) || 0;
              const catColor = CATEGORY_COLORS[cat.name] || "#6b7280";
              return (
                <div
                  key={cat.name}
                  className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] p-4 hover:border-[var(--color-border)] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: catColor + "18" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={catColor} strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">{cat.name}</span>
                  </div>
                  <div className="text-lg font-bold text-[var(--color-text-primary)] mb-0.5">{formatBytes(cat.size)}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--color-text-muted)]">{count} file{count !== 1 ? "s" : ""}</span>
                    <span className="text-[10px] font-medium" style={{ color: catColor }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: catColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extension breakdown table */}
      {breakdown.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">By file type</h3>
          </div>
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {breakdown.slice(0, 20).map((item) => {
              const pct = storage.used > 0 ? (item.size / storage.used) * 100 : 0;
              const catColor = getExtColor(item.ext);
              return (
                <div key={item.ext} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-surface-raised)] transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase" style={{ backgroundColor: catColor + "18", color: catColor }}>
                    {item.ext}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">.{item.ext}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(item.size)}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: catColor }}
                      />
                    </div>
                  </div>
                  <span className="w-14 text-right text-xs font-medium text-[var(--color-text-muted)]">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
          {breakdown.length > 20 && (
            <div className="px-5 py-3 text-center text-[10px] text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)]">
              +{breakdown.length - 20} more types
            </div>
          )}
        </div>
      )}

      {breakdown.length === 0 && !loading && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          <div className="text-sm font-medium text-[var(--color-text-secondary)]">No files uploaded yet</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Upload files to see storage breakdown</div>
        </div>
      )}
    </div>
  );
}
