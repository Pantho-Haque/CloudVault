"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FileUploader as ReactFileUploader } from "react-drag-drop-files";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface UploadItem {
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error" | "conflict";
  previewUrl: string | null;
  previewType: "image" | "video" | "pdf" | "doc" | "xls" | "audio" | "generic" | null;
  relativePath: string;
  overwrite?: boolean;
}

interface FileUploaderProps {
  onFileUpload: () => void;
  currentPath?: string;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/wav", "audio/ogg"]);

function classifyFile(file: File): { previewUrl: string | null; previewType: UploadItem["previewType"] } {
  if (IMAGE_TYPES.has(file.type)) {
    return { previewUrl: URL.createObjectURL(file), previewType: "image" };
  }
  if (VIDEO_TYPES.has(file.type)) {
    return { previewUrl: URL.createObjectURL(file), previewType: "video" };
  }
  if (AUDIO_TYPES.has(file.type)) {
    return { previewUrl: null, previewType: "audio" };
  }
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return { previewUrl: null, previewType: "pdf" };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["doc", "docx"].includes(ext)) return { previewUrl: null, previewType: "doc" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { previewUrl: null, previewType: "xls" };
  return { previewUrl: null, previewType: "generic" };
}

function PreviewThumb({ previewUrl, previewType }: { previewUrl: string | null; previewType: UploadItem["previewType"] }) {
  if (previewType === "image" && previewUrl) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-surface-sunken)] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (previewType === "video" && previewUrl) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-surface-sunken)] shrink-0">
        <video src={previewUrl} className="w-full h-full object-cover" muted preload="metadata" />
      </div>
    );
  }

  const badges: Record<string, { bg: string; text: string; label: string }> = {
    pdf: { bg: "bg-red-500/10", text: "text-red-400", label: "PDF" },
    doc: { bg: "bg-blue-500/10", text: "text-blue-400", label: "DOC" },
    xls: { bg: "bg-green-500/10", text: "text-green-400", label: "XLS" },
    audio: { bg: "bg-orange-500/10", text: "text-orange-400", label: "MP3" },
  };

  if (previewType && badges[previewType]) {
    const b = badges[previewType];
    return (
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${b.bg}`}>
        <span className={`text-[10px] font-bold ${b.text}`}>{b.label}</span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-sunken)] flex items-center justify-center shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

let globalUploadCallbacks: Array<(state: { active: boolean; current: number; total: number; fileName: string; progress: number }) => void> = [];

export function useUploadProgress() {
  const [state, setState] = useState({ active: false, current: 0, total: 0, fileName: "", progress: 0 });

  useEffect(() => {
    const cb = (s: typeof state) => setState(s);
    globalUploadCallbacks.push(cb);
    return () => { globalUploadCallbacks = globalUploadCallbacks.filter((c) => c !== cb); };
  }, []);

  return state;
}

function notifyUploadProgress(state: { active: boolean; current: number; total: number; fileName: string; progress: number }) {
  globalUploadCallbacks.forEach((cb) => cb(state));
}

export default function FileUploader({ onFileUpload, currentPath = "" }: FileUploaderProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  const onUploadRef = useRef(onFileUpload);
  onUploadRef.current = onFileUpload;
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((u) => {
        if (u.previewUrl) URL.revokeObjectURL(u.previewUrl);
      });
    };
  }, []);

  const updateUpload = (index: number, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  };

  const handleChange = (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    const newItems: UploadItem[] = fileList.map((file) => {
      const { previewUrl, previewType } = classifyFile(file);
      return { file, progress: 0, status: "queued" as const, previewUrl, previewType, relativePath: "" };
    });
    setUploads((prev) => [...prev, ...newItems]);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: UploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const webkitPath = (file as unknown as { webkitRelativePath: string }).webkitRelativePath || "";
      const pathParts = webkitPath.split("/");
      const relativePath = pathParts.length > 1 ? pathParts.slice(1, -1).join("/") : "";
      const { previewUrl, previewType } = classifyFile(file);
      newItems.push({ file, progress: 0, status: "queued" as const, previewUrl, previewType, relativePath });
    }

    setUploads((prev) => [...prev, ...newItems]);
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const processUploads = useCallback(async () => {
    const queued = uploadsRef.current
      .map((u, i) => ({ ...u, index: i }))
      .filter((u) => u.status === "queued");

    const totalFiles = queued.length;
    let completedFiles = 0;

    notifyUploadProgress({ active: true, current: 0, total: totalFiles, fileName: "", progress: 0 });

    for (const item of queued) {
      updateUpload(item.index, { status: "uploading", progress: 0 });
      notifyUploadProgress({ active: true, current: completedFiles, total: totalFiles, fileName: item.file.name, progress: 0 });

      const formData = new FormData();
      formData.append("file", item.file);
      const uploadPath = [currentPath, item.relativePath].filter(Boolean).join("/");
      if (uploadPath) formData.append("path", uploadPath);

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              updateUpload(item.index, { progress: pct });
              notifyUploadProgress({ active: true, current: completedFiles, total: totalFiles, fileName: item.file.name, progress: pct });
            }
          });
          xhr.onload = () => {
            if (xhr.status === 409) {
              const data = JSON.parse(xhr.responseText);
              if (data.conflict) {
                updateUpload(item.index, { status: "conflict" });
                reject(new Error("conflict"));
                return;
              }
            }
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error("Upload failed"));
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          const uploadUrl = item.overwrite ? "/api/files?conflict=overwrite" : "/api/files";
          xhr.open("POST", uploadUrl);
          xhr.send(formData);
        });
        updateUpload(item.index, { status: "done", progress: 100 });
      } catch {
        updateUpload(item.index, { status: "error" });
      }
      completedFiles++;
      notifyUploadProgress({ active: true, current: completedFiles, total: totalFiles, fileName: item.file.name, progress: 100 });
    }

    notifyUploadProgress({ active: false, current: totalFiles, total: totalFiles, fileName: "", progress: 100 });
    onUploadRef.current();
    setTimeout(() => {
      uploadsRef.current.forEach((u) => {
        if (u.previewUrl) URL.revokeObjectURL(u.previewUrl);
      });
      setUploads([]);
    }, 2000);
  }, [currentPath]);

  const removeUpload = (index: number) => {
    const item = uploads[index];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const resolveConflict = (index: number, resolution: "overwrite" | "skip") => {
    if (resolution === "skip") {
      removeUpload(index);
      return;
    }
    updateUpload(index, { status: "queued", progress: 0, overwrite: true });
  };

  const hasQueued = uploads.some((u) => u.status === "queued");
  const hasUploading = uploads.some((u) => u.status === "uploading");

  return (
    <div className="w-full">
      <div className="mb-4">
        <ReactFileUploader
          handleChange={handleChange}
          name="file"
          types={["JPG", "PNG", "PDF", "DOC", "DOCX", "XLS", "XLSX", "TXT", "ZIP", "MP4", "MP3"]}
          maxSize={100}
          onTypeError={(err: string) => console.log(err)}
          onSizeError={(err: string) => console.log(err)}
          classes="dropzone"
          onDraggingStateChange={(dragging: boolean) => setIsDragging(dragging)}
          dropMessageStyle={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
        >
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
          }`}>
            <div className="flex flex-col items-center justify-center py-4">
              <ArrowUpTrayIcon className="w-10 h-10 text-[var(--color-primary)] mb-3" />
              <p className="mb-1 font-semibold text-[var(--color-text-primary)] text-sm">Drop files here or click to browse</p>
              <p className="text-xs text-[var(--color-text-muted)]">Max 100MB per file</p>
            </div>
          </div>
        </ReactFileUploader>

        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is a non-standard attribute
          webkitdirectory=""
          multiple
          className="hidden"
          onChange={handleFolderChange}
        />
        <button
          onClick={() => folderInputRef.current?.click()}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          Upload Folder
        </button>
      </div>

      {uploads.length > 0 && (
        <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
          {uploads.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-[var(--color-surface-raised)] rounded-xl">
              <PreviewThumb previewUrl={item.previewUrl} previewType={item.previewType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.file.name}</p>
                {item.relativePath && (
                  <p className="text-[10px] text-[var(--color-text-muted)] truncate flex items-center gap-1 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    {item.relativePath}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[var(--color-text-muted)]">{formatSize(item.file.size)}</span>
                  {item.status === "uploading" && (
                    <div className="flex-1 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs">
                  {item.status === "queued" && <span className="text-[var(--color-text-muted)]">Queued</span>}
                  {item.status === "uploading" && <span className="text-[var(--color-primary)]">{item.progress}%</span>}
                  {item.status === "done" && (
                    <span className="text-[var(--color-success)]">
                      <svg className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {item.status === "error" && <span className="text-[var(--color-danger)]">Failed</span>}
                  {item.status === "conflict" && <span className="text-amber-500">File exists</span>}
                </span>
                {item.status === "error" && (
                  <button
                    onClick={() => updateUpload(i, { status: "queued", progress: 0 })}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-lg hover:bg-[var(--color-border)] transition-colors ml-1"
                  >
                    Retry
                  </button>
                )}
                {item.status === "conflict" && (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => resolveConflict(i, "overwrite")}
                      className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors"
                    >
                      Overwrite
                    </button>
                    <button
                      onClick={() => resolveConflict(i, "skip")}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                )}
                {item.status === "queued" && (
                  <button
                    onClick={() => removeUpload(i)}
                    className="p-1 text-[var(--color-icon-muted)] hover:text-[var(--color-danger)] rounded transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        {hasQueued ? (
          <button
            onClick={processUploads}
            className="px-4 py-2 rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors text-sm font-medium"
          >
            Upload {uploads.filter((u) => u.status === "queued").length} file(s)
          </button>
        ) : hasUploading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-primary)]" />
            Uploading...
          </div>
        ) : null}
      </div>
    </div>
  );
}
