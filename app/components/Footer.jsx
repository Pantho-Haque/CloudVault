"use client";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start">
              <div className="bg-white p-2 rounded-lg shadow-md"></div>
              <span className="ml-2 font-semibold text-lg">File Manager</span>
            </div>
            <p className="text-sm text-gray-300 mt-2">
              Simple, fast, and secure file management.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-4 mb-2">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              ></a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              ></a>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} File Manager. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
