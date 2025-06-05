import { getFileTypeIcon } from "@/lib/fileIcons";
import { formatDate, formatFileSize, handleDelete, handleDownload } from "@/lib/operations";
import React, { useState } from "react";
import FileDetailsModal from "./FileDetailsModal";

export default function FileListTable({
  requestSort,
  getSortIndicator,
  sortedFiles,
  onStatusChange
}: any) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<any>(null);

  const toggleFileSelection = (
    fileName: string,
    e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    setSelectedFiles((prev) =>
      prev.includes(fileName)
        ? prev.filter((name) => name !== fileName)
        : [...prev, fileName]
    );
  };

  const handleBatchDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    selectedFiles.forEach((fileName, index) => {
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.location.href = `/api/files?fileName=${encodeURIComponent(
            fileName
          )}`;
        }
      }, index * 500); 
    });

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, selectedFiles.length * 500 + 1000);
  };

  const handleBatchDelete = (e: React.MouseEvent) => {
    e && e.stopPropagation();
    selectedFiles.forEach((fileName) => {
      handleDelete(fileName, e,onStatusChange);
    });
    setSelectedFiles([]);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  return (
    <div className="overflow-x-auto">
      <FileDetailsModal file={showDetails} onClose={() => setShowDetails(null)} />
      {selectedFiles.length > 0 && (
        <div className="flex justify-end mb-4 space-x-2 md:space-x-3 absolute top-4 right-0 mr-6">
          <button
            onClick={handleBatchDownload}
            className="px-2 py-1 md:px-3 md:py-1 bg-blue-600 text-white text-xs md:text-sm rounded hover:bg-blue-700 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 md:h-4 md:w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Batch Download</span>
            <span>({selectedFiles.length})</span>
          </button>
          <button
            onClick={handleBatchDelete}
            className="px-2 py-1 md:px-3 md:py-1 bg-red-600 text-white text-xs md:text-sm rounded hover:bg-red-700 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 md:h-4 md:w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span className="hidden sm:inline">Batch Delete</span>
            <span>({selectedFiles.length})</span>
          </button>
        </div>
      )}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 md:py-3 px-1 md:px-2 w-8 md:w-10 text-center">
                <span className="sr-only">Select</span>
              </th>
              <th
                className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {getSortIndicator("name") && (
                    <span className="text-blue-600 font-bold">
                      {getSortIndicator("name")}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="hidden sm:table-cell py-2 md:py-3 px-2 md:px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("size")}
              >
                <div className="flex items-center space-x-1">
                  <span>Size</span>
                  {getSortIndicator("size") && (
                    <span className="text-blue-600 font-bold">
                      {getSortIndicator("size")}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="hidden md:table-cell py-2 md:py-3 px-2 md:px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort("modified")}
              >
                <div className="flex items-center space-x-1">
                  <span>Modified</span>
                  {getSortIndicator("modified") && (
                    <span className="text-blue-600 font-bold">
                      {getSortIndicator("modified")}
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedFiles.map((file: any) => (
              <tr
                key={file.name}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={(e) => {
                  toggleFileSelection(file.name, e);
                }}
              >
                <td className="py-2 md:py-4 px-1 md:px-2 text-center">
                  <input
                    type="checkbox"
                    className="h-3 w-3 md:h-4 md:w-4 text-blue-600 rounded focus:ring-blue-500"
                    checked={selectedFiles.includes(file.name)}
                    onChange={(e) => toggleFileSelection(file.name, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="py-2 md:py-4 px-2 md:px-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <div className="flex-shrink-0">
                      {getFileTypeIcon(file.name)}
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="hidden sm:table-cell py-2 md:py-4 px-2 md:px-4 whitespace-nowrap">
                  <span className="text-xs md:text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                </td>
                <td className="hidden md:table-cell py-2 md:py-4 px-2 md:px-4 whitespace-nowrap">
                  <span className="text-xs md:text-sm text-gray-500">
                    {formatDate(file.modified)}
                  </span>
                </td>
                <td className="py-2 md:py-4 px-2 md:px-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1 md:space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetails(file);
                      }}
                      className="p-1 md:p-1.5 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 transform hover:scale-110 cursor-pointer"
                      title="View details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 md:h-4 md:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.name, e);
                      }}
                      className="p-1 md:p-1.5 bg-green-50 rounded-full text-green-600 hover:bg-green-100 hover:text-green-800 transition-all duration-200 transform hover:scale-110 cursor-pointer"
                      title="Download"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 md:h-4 md:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        handleDelete(file.name, e, onStatusChange);
                      }}
                      className="p-1 md:p-1.5 bg-red-50 rounded-full text-red-600 hover:bg-red-100 hover:text-red-800 transition-all duration-200 transform hover:scale-110 cursor-pointer"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 md:h-4 md:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};