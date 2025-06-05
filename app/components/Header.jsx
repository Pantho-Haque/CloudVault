import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import FileUploader from './FileUploader';

export default function Header() {
  const pathname = usePathname();
  const [showUploader, setShowUploader] = useState(false);
  
  const handleFileUpload = () => {
    setShowUploader(false);
    // Additional logic after successful upload
  };
  
  const handleStatusChange = (status) => {
    // Handle status changes from the FileUploader
    if (status && status.type === 'success') {
      setTimeout(() => setShowUploader(false), 3000);
    }
  };
  
  return (
    <header className="bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md py-3 md:py-4 sticky top-0 z-20 border-b border-blue-100 animate-fade-in">
      <div className="px-6 md:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 group mb-3 sm:mb-0">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 md:p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 tracking-tight">CloudVault</h1>
              <p className="text-xs text-indigo-500 font-semibold tracking-wide hidden sm:block">Secure Cloud Storage Solution</p>
            </div>
          </Link>
          
          <button 
            className="w-full sm:w-auto px-4 md:px-5 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
            onClick={() => setShowUploader(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-medium text-sm md:text-base">Upload Files</span>
          </button>
        </div>
      </div>
      
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-0">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full mx-2 md:m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-black">Upload Files</h2>
              <button onClick={() => setShowUploader(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FileUploader onFileUpload={handleFileUpload} onStatusChange={handleStatusChange} />
          </div>
        </div>
      )}
    </header>
  );
}
