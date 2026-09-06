"use client";

import { useState, useRef, useEffect } from "react";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);

function getFileExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export default function LazyThumbnail({ filename, filePath, className = "" }: { filename: string; filePath: string; className?: string }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || error || !IMAGE_EXTS.has(getFileExt(filename))) return;

    let cancelled = false;

    fetch(`/api/files/thumbnail?path=${encodeURIComponent(filePath)}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) { URL.revokeObjectURL(URL.createObjectURL(blob)); return; }
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const img = new Image();
        img.onload = () => {
          if (cancelled) { URL.revokeObjectURL(url); return; }
          const canvas = document.createElement("canvas");
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, 32, 32);
            setThumb(canvas.toDataURL("image/jpeg", 0.2));
          }
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
        };
        img.onerror = () => { URL.revokeObjectURL(url); blobUrlRef.current = null; if (!cancelled) setError(true); };
        img.src = url;
      })
      .catch(() => { if (!cancelled) setError(true); });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    };
  }, [inView, filename, filePath, error]);

  const ext = getFileExt(filename);

  if (!IMAGE_EXTS.has(ext) || error) {
    const badgeMap: Record<string, { bg: string; text: string; label: string }> = {
      pdf: { bg: "bg-red-500/15", text: "text-red-400", label: "PDF" },
      doc: { bg: "bg-blue-500/15", text: "text-blue-400", label: "DOC" },
      docx: { bg: "bg-blue-500/15", text: "text-blue-400", label: "DOC" },
      xls: { bg: "bg-green-500/15", text: "text-green-400", label: "XLS" },
      xlsx: { bg: "bg-green-500/15", text: "text-green-400", label: "XLS" },
      csv: { bg: "bg-green-500/15", text: "text-green-400", label: "CSV" },
      mp4: { bg: "bg-pink-500/15", text: "text-pink-400", label: "VID" },
      webm: { bg: "bg-pink-500/15", text: "text-pink-400", label: "VID" },
      mp3: { bg: "bg-orange-500/15", text: "text-orange-400", label: "MP3" },
      wav: { bg: "bg-orange-500/15", text: "text-orange-400", label: "WAV" },
      zip: { bg: "bg-amber-500/15", text: "text-amber-400", label: "ZIP" },
      rar: { bg: "bg-amber-500/15", text: "text-amber-400", label: "RAR" },
      txt: { bg: "bg-gray-500/15", text: "text-gray-400", label: "TXT" },
      md: { bg: "bg-gray-500/15", text: "text-gray-400", label: "MD" },
      json: { bg: "bg-yellow-300/15", text: "text-yellow-300", label: "JSON" },
      js: { bg: "bg-yellow-400/15", text: "text-yellow-400", label: "JS" },
      ts: { bg: "bg-blue-400/15", text: "text-blue-400", label: "TS" },
      html: { bg: "bg-orange-400/15", text: "text-orange-400", label: "HTML" },
      css: { bg: "bg-blue-400/15", text: "text-blue-400", label: "CSS" },
    };
    const b = badgeMap[ext] || { bg: "bg-gray-500/15", text: "text-gray-400", label: ext.toUpperCase() || "FILE" };
    return (
      <div ref={ref} className={`rounded-lg flex items-center justify-center font-bold ${b.bg} ${b.text} ${className}`}>
        <span className="leading-none">{b.label.slice(0, 4)}</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`rounded-lg overflow-hidden bg-[var(--color-surface-sunken)] ${className}`}>
      {thumb ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={thumb} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-purple-500/10 animate-pulse" />
      )}
    </div>
  );
}
