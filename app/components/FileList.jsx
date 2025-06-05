import { useState } from 'react';
import SearchBar from './SearchBar';
import FileDetailsModal from './FileDetailsModal';
import { motion } from 'framer-motion';
import { getFileTypeIcon } from '@/lib/fileIcons';
import FileListTable from './FileListTable';

export default function FileList({ files, isLoading, onDelete, onStatusChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  

  // Function to handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Function to handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter files based on search term  
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files based on sortConfig
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortConfig.key === 'size') {
      return sortConfig.direction === 'ascending' ? a.size - b.size : b.size - a.size;
    } else if (sortConfig.key === 'modified') {
      return sortConfig.direction === 'ascending' 
        ? new Date(a.modified) - new Date(b.modified) 
        : new Date(b.modified) - new Date(a.modified);
    } else {
      // Default sort by name
      return sortConfig.direction === 'ascending' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
  });

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  // Function to handle file click
  const handleFileClick = (file) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  return (
    <section className="border rounded-lg p-6 bg-white shadow-md relative">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Files</h2>
      
      {/* Search bar */}
      {!isLoading && files.length > 0 && (
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} />
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading files...</span>
        </div>
      ) : files.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gray-50 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-600 font-medium">No files available</p>
          <p className="text-gray-500 text-sm mt-1">Upload files to get started</p>
        </motion.div>
      ) : filteredFiles.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gray-50 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-4 text-gray-600 font-medium">No files match your search</p>
          <p className="text-gray-500 text-sm mt-1">Try different keywords</p>
        </motion.div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <FileListTable
            requestSort={requestSort}
            getSortIndicator={getSortIndicator}
            handleFileClick={handleFileClick} 
            sortedFiles={sortedFiles}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />  
        </div>
      )}
    </section>
  );
}
