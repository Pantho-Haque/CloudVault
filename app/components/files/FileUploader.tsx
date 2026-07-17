"use client";

import { useState, useRef } from "react";
import { FileUploader as ReactFileUploader } from "react-drag-drop-files";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface UploadItem {
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
}

interface FileUploaderProps {
  onFileUpload: () => void;
  currentPath?: string;
}

export default function FileUploader({ onFileUpload, currentPath = "" }: FileUploaderProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  const onUploadRef = useRef(onFileUpload);
  onUploadRef.current = onFileUpload;

  const updateUpload = (index: number, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  };

  const handleChange = (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    const newItems: UploadItem[] = fileList.map((file) => ({
      file,
      progress: 0,
      status: "queued" as const,
    }));
    setUploads((prev) => [...prev, ...newItems]);
  };

  const processUploads = async () => {
    const queued = uploadsRef.current
      .map((u, i) => ({ ...u, index: i }))
      .filter((u) => u.status === "queued");

    for (const item of queued) {
      updateUpload(item.index, { status: "uploading", progress: 0 });

      const formData = new FormData();
      formData.append("file", item.file);
      if (currentPath) formData.append("path", currentPath);

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              updateUpload(item.index, { progress: Math.round((e.loaded / e.total) * 100) });
            }
          });
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error("Upload failed"));
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.open("POST", "/api/files");
          xhr.send(formData);
        });
        updateUpload(item.index, { status: "done", progress: 100 });
      } catch {
        updateUpload(item.index, { status: "error" });
      }
    }

    onUploadRef.current();
    setTimeout(() => setUploads([]), 2000);
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
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
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
      </div>

      {uploads.length > 0 && (
        <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
          {uploads.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-[var(--color-surface-raised)] rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.file.name}</p>
                {item.status === "uploading" && (
                  <div className="mt-1 h-1.5 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs shrink-0">
                {item.status === "queued" && <span className="text-[var(--color-text-muted)]">Queued</span>}
                {item.status === "uploading" && <span className="text-[var(--color-primary)]">{item.progress}%</span>}
                {item.status === "done" && (
                  <span className="text-[var(--color-success)]">
                    <svg className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                {item.status === "error" && <span className="text-[var(--color-danger)]">Failed</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        {hasQueued ? (
          <button
            onClick={processUploads}
            className="px-4 py-2 rounded-lg text-[var(--color-text-on-primary)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] text-sm font-medium"
          >
            Upload {uploads.filter((u) => u.status === "queued").length} file(s)
          </button>
        ) : hasUploading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-primary)]"></div>
            Uploading...
          </div>
        ) : null}
      </div>
    </div>
  );
}
