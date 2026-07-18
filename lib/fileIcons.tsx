import React from "react";

export const getFileExtension = (filename: string) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

export const getFileTypeIcon = (filename: string, size: "sm" | "md" | "lg" = "md") => {
  const extension = getFileExtension(filename).toLowerCase();
  const sizeClass = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-12 w-12" : "h-8 w-8";

  const iconMap: Record<string, React.ReactNode> = {
    pdf: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-red-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
    doc: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-blue-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
    docx: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-blue-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
    xls: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-green-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm6 7a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd" />
      </svg>
    ),
    xlsx: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-green-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm6 7a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd" />
      </svg>
    ),
    jpg: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-purple-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    jpeg: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-purple-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    png: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-purple-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    gif: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-yellow-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    mp4: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-pink-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
    ),
    mp3: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-orange-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
      </svg>
    ),
    txt: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-gray-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
    zip: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-amber-600`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4a1 1 0 011-1h8a1 1 0 011 1v4H5V4zm4 7a1 1 0 00-1 1v1h2v-1a1 1 0 00-1-1zm3 0a1 1 0 00-1 1v1h2v-1a1 1 0 00-1-1zM4 4a2 2 0 012-2h8a2 2 0 012 2v4.586l1.707 1.707A1 1 0 0118 11v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 01.293-.707L4 8.586V4z" clipRule="evenodd" />
      </svg>
    ),
    rar: (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-amber-600`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4a1 1 0 011-1h8a1 1 0 011 1v4H5V4zm4 7a1 1 0 00-1 1v1h2v-1a1 1 0 00-1-1zm3 0a1 1 0 00-1 1v1h2v-1a1 1 0 00-1-1zM4 4a2 2 0 012-2h8a2 2 0 012 2v4.586l1.707 1.707A1 1 0 0118 11v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 01.293-.707L4 8.586V4z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    iconMap[extension] || (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${sizeClass} text-gray-500`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
  );
};
