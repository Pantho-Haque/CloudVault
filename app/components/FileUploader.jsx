'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUploader as ReactFileUploader } from 'react-drag-drop-files';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function FileUploader({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  
  const fileTypes = ["JPG", "PNG", "PDF", "DOC", "DOCX", "XLS", "XLSX", "TXT"];
  
  const handleChange = (file) => {
    setFile(file);
  };
  
  const handleUpload = async (event) => {
    if (event) event.preventDefault();
    
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const result = await response.json();
      
      // Notify parent component to refresh the file list
      onFileUpload();
      
      // Reset the file input
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-6">
        <ReactFileUploader
          handleChange={handleChange}
          name="file"
          types={fileTypes}
          maxSize={10}
          onTypeError={(err) => console.log(err)}
          onSizeError={(err) => console.log(err)}
          classes="dropzone"
          onDraggingStateChange={(dragging) => setIsDragging(dragging)}
          dropMessageStyle={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
        >
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}>
            <div className="flex flex-col items-center justify-center py-6">
              <ArrowUpTrayIcon className="w-12 h-12 text-blue-500 mb-4" />
              <p className="mb-2 font-semibold text-gray-700">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500">Supported formats: JPG, PNG, PDF, DOC, etc.</p>
              {file && (
                <div className="mt-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {file.name}
                </div>
              )}
            </div>
          </div>
        </ReactFileUploader>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file}
          className={`px-4 py-2 rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'
          }`}
        >
          Upload File
        </button>
      </div>
    </div>
  );
}
