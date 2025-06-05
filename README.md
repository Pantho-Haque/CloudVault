# CloudVault - File Management System

CloudVault is a modern file storage and management web application built with Next.js 15. The application provides an intuitive interface for uploading, downloading, and managing files.

## Features

- **File Upload**: Drag-and-drop or traditional file uploading
- **File Management**: View, download, and delete files
- **Search Functionality**: Filter files by name
- **File Statistics**: View total storage usage, file type distribution, and more
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, Next.js 15, TailwindCSS 4
- **UI Components**: Framer Motion for animations, HeroIcons for icons
- **File Handling**: React-Drag-Drop-Files for upload interface
- **Development Tools**: TypeScript, ESLint, Turbopack

## Project Structure

- `/app`: Next.js app directory structure
  - `/api`: Backend API routes for file operations
  - `/components`: Reusable UI components
  - `/page.tsx`: Main application page
- `/lib`: Utility functions for file operations and icons
- `/uploads`: Directory for storing uploaded files (server-side)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Build for production: `npm run build`
5. Start production server: `npm run start`

## License

This project is private and proprietary.
