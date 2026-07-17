"use client";

import { getFileExtension, getFileTypeIcon } from "@/lib/fileIcons";
import { formatDate, formatFileSize } from "@/lib/operations";
import { useEffect, useRef } from "react";

interface FileDetailsModalProps {
  file: {
    name: string;
    path?: string;
    size: number;
    modified: string;
    isDirectory?: boolean;
  } | null;
  onClose: () => void;
}

export default function FileDetailsModal({ file, onClose }: FileDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-[var(--color-surface)] rounded-xl shadow-2xl p-6 max-w-lg w-full mx-auto border border-[var(--color-border)]"
      >
        <div className="flex justify-between items-start mb-5">
          <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">File Details</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-icon-muted)] bg-transparent hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)] rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-[var(--color-surface-sunken)] rounded-full mb-3">
            {getFileTypeIcon(file.name)}
          </div>
          <h4 className="text-xl font-semibold mt-2 text-center break-all text-[var(--color-text-primary)]">{file.name}</h4>
        </div>

        <div className="space-y-4 bg-[var(--color-surface-raised)] p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)] font-medium">Size:</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)] font-medium">Type:</span>
            <span className="font-semibold text-[var(--color-text-primary)] bg-[var(--color-border-subtle)] px-2 py-1 rounded text-sm">
              {getFileExtension(file.name).toUpperCase() || "FOLDER"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)] font-medium">Last Modified:</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{formatDate(file.modified)}</span>
          </div>
          {file.path && (
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] font-medium">Path:</span>
              <span className="font-semibold text-[var(--color-text-primary)] text-sm break-all">{file.path}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.open(`/api/files?fileName=${encodeURIComponent(file.name)}`, "_blank")}
            className="bg-[var(--color-primary)] text-[var(--color-text-on-primary)] py-3 px-4 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-opacity-50 flex items-center justify-center font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={onClose}
            className="bg-[var(--color-surface-sunken)] text-[var(--color-text-primary)] py-3 px-4 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-opacity-50 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
