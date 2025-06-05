'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StatusMessage from '../components/StatusMessage';
import FileUploader from '../components/FileUploader';

export default function UploadPage() {
  const [uploadStatus, setUploadStatus] = useState(null);
  const router = useRouter();

  // Handle status changes from child components
  const handleStatusChange = (status) => {
    setUploadStatus(status);
    
    // Auto-clear success messages after 5 seconds
    if (status && status.type === 'success') {
      setTimeout(() => {
        setUploadStatus(null);
        // Redirect to home page after successful upload
        router.push('/');
      }, 3000);
    }
  };

  // Handle successful file upload
  const handleFileUpload = () => {
    setUploadStatus({
      type: 'success',
      message: 'File uploaded successfully! Redirecting to home page...'
    });
    
    // Redirect happens in the timeout above
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="card p-8 mb-8 fade-in">
            <h1 className="text-2xl font-bold mb-2 text-center">Upload Files</h1>
            <p className="text-center text-gray-500 mb-8">Upload your files to the file manager</p>
            
            {/* Status message */}
            {uploadStatus && <StatusMessage status={uploadStatus} />}

            {/* File upload section */}
            <div className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-all">
              <FileUploader 
                onFileUpload={handleFileUpload} 
                onStatusChange={handleStatusChange} 
              />
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => router.push('/')}
                className="btn btn-secondary flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Files
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
