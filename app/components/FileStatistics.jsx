import { useState, useEffect } from 'react';

export default function FileStatistics({ files }) {
  // Calculate total size of all files
  const calculateTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type counts
  const getFileTypeCounts = () => {
    const typeCounts = {};
    files.forEach(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      typeCounts[extension] = (typeCounts[extension] || 0) + 1;
    });
    return typeCounts;
  };

  // Get the most common file type
  const getMostCommonType = () => {
    const typeCounts = getFileTypeCounts();
    let mostCommonType = '';
    let highestCount = 0;
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > highestCount) {
        mostCommonType = type;
        highestCount = count;
      }
    });
    
    return { type: mostCommonType ? mostCommonType.toUpperCase() : 'N/A', count: highestCount };
  };

  // Get average file size
  const getAverageFileSize = () => {
    if (files.length === 0) return 0;
    return calculateTotalSize() / files.length;
  };

  const typeCounts = getFileTypeCounts();
  const fileTypes = Object.keys(typeCounts).length;
  const mostCommon = getMostCommonType();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all">
      <h2 className="text-xl font-semibold mb-5 text-gray-800 dark:text-white flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        File Statistics
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-blue-200 dark:bg-blue-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Files</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{files.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-green-200 dark:bg-green-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Size</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(calculateTotalSize())}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-purple-200 dark:bg-purple-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">File Types</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fileTypes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 p-4 rounded-lg border border-amber-200 dark:border-amber-700 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-amber-200 dark:bg-amber-700 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Average Size</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(getAverageFileSize())}</p>
            </div>
          </div>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300">Most common file type:</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 py-1 px-3 rounded-full">
                {mostCommon.type}
              </span>
              {mostCommon.count > 1 && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  ({mostCommon.count} files)
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
