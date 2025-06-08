"use client";
import { useState, useEffect } from "react"; 
import Header from "./components/Header"; 
import FileList from "./components/FileList";
import FileStatistics from "./components/FileStatistics"; 
import { XMarkIcon } from "@heroicons/react/16/solid";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  
  // Fetch the list of files when the component mounts
  useEffect(() => {
    fetchFiles();
  }, []);

  // Function to fetch the list of files from the server
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      setFiles(data.files);
      
      // Start long polling for file changes
      const pollForChanges = async (timestamp: number) => {
        try {
          const pollResponse = await fetch(`/api/files?poll=true&since=${timestamp}`);
          if (!pollResponse.ok) return;
          
          const pollData = await pollResponse.json();
          
          if (pollData.changes) {
            // If changes detected, refresh the file list
            const refreshResponse = await fetch("/api/files");
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setFiles(refreshData.files);
            }
          }
          
          // Continue polling with the new timestamp
          setTimeout(() => pollForChanges(pollData.timestamp), 2000);
        } catch (err) {
          console.error("Polling error:", err);
          // Retry polling after a delay
          setTimeout(() => pollForChanges(Date.now()), 5000);
        }
      };
      
      // Start the polling process
      pollForChanges(Date.now());
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto max-w-6xl">
        <div className="fixed right-0 bottom-10 z-50">
          <button 
            onClick={() => setShowStats(!showStats)} 
            className={`bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-l-lg shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <div 
            className={`fixed right-0 bottom-25 bg-white rounded-l-lg shadow-xl transition-all duration-500 ease-in-out ${showStats ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="relative">
              <button 
                onClick={() => setShowStats(false)} 
                className="absolute top-2 left-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300 transition-all duration-200"
              >
                <XMarkIcon className="h-4 w-4 text-gray-900" />
              </button>
              <FileStatistics files={files} />
            </div>
          </div>
        </div>
        
        {/* 
          QUICK STATS
        <div className="card p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Files:</span>
              <span className="text-xl font-bold">{files.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Size:</span>
              <span className="text-xl font-bold">
                {files.length > 0
                  ? formatFileSize(
                      files.reduce((acc, file) => acc + file.size, 0)
                    )
                  : "0 B"}
              </span>
            </div>
          </div>
        </div> */}

        {/* {!isLoading && files.length > 0 && (
            <div className="mb-8 slide-up">
              <FileStatistics files={files} />
            </div>
          )} */}

        <div className="slide-up">
            <FileList
              files={files}
              isLoading={isLoading}
              onDelete={fetchFiles} 
            />
          </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
