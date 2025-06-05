'use client';

import { getFileExtension, getFileTypeIcon } from '@/lib/fileIcons';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function FileDetailsModal({ file, onClose }) {
  const modalRef = useRef(null);
  
  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-auto border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-start mb-5">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">File Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
            {getFileTypeIcon(file.name)}
          </div>
          <h4 className="text-xl font-semibold mt-2 text-center break-all text-gray-800 dark:text-gray-200">{file.name}</h4>
        </div>
        
        <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300 font-medium">Size:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300 font-medium">Type:</span>
            <span className="font-semibold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-sm">
              {getFileExtension(file.name).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300 font-medium">Last Modified:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatDate(file.modified)}</span>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.open(`/api/files?fileName=${encodeURIComponent(file.name)}`, '_blank')}
            className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
