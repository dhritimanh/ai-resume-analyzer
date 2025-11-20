'use client';

import { useRef, useState } from 'react';
import { pdfToImage, pdfToMultipleImages, getPdfPageCount } from '@/lib/pdf-to-image';

interface FileUploadProps {
  onUpload: (file: File | File[]) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onUpload, isProcessing }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [convertingPdf, setConvertingPdf] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const isValidFile = (file: File) => {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const processFile = async (file: File) => {
    // If it's a PDF, convert pages to images (up to 5 pages)
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setConvertingPdf(true);
      try {
        // Get page count first
        const pageCount = await getPdfPageCount(file);
        
        if (pageCount > 5) {
          const proceed = confirm(
            `Your PDF has ${pageCount} pages. We'll extract the first 5 pages.\n\n` +
            'Click OK to continue, or Cancel to upload a different file.'
          );
          if (!proceed) {
            setConvertingPdf(false);
            return;
          }
        }
        
        // Convert up to 5 pages to images
        const imageFiles = await pdfToMultipleImages(file, 5);
        console.log(`Converted ${imageFiles.length} pages from PDF`);
        
        // Upload all pages
        onUpload(imageFiles);
      } catch (error) {
        console.error('PDF conversion error:', error);
        alert('Failed to convert PDF. Please try uploading an image instead.');
      } finally {
        setConvertingPdf(false);
      }
    } else {
      // It's already an image, upload directly
      onUpload(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      await processFile(file);
    } else {
      alert('Please upload a PDF or image file (PDF, PNG, or JPG).');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-300 blur-xl"></div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isProcessing && !convertingPdf && fileInputRef.current?.click()}
        className="relative bg-[#1a1a1a] rounded-2xl border-2 border-[#2a2a2a] hover:border-purple-500/50 transition-all p-8 md:p-10 text-center cursor-pointer backdrop-blur-sm"
      >
      <div className="mb-6 pointer-events-none">
        <svg
          className="mx-auto h-12 w-12 md:h-16 md:w-16 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <h3 className="text-xl md:text-2xl font-semibold text-white mb-2 pointer-events-none">
        Upload for Free Scan
      </h3>
      <p className="text-gray-500 mb-6 text-xs pointer-events-none">
        No phone number • No credit card • No sign-up
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing || convertingPdf}
      />
      <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-8 rounded-lg font-semibold pointer-events-none text-sm md:text-base">
        {convertingPdf ? 'Converting PDF...' : isProcessing ? 'Extracting with AI...' : 'Select File'}
      </div>
      <p className="text-sm text-gray-500 mt-4 pointer-events-none">
        Supported (Max 10MB): PDF (max 5 pages), PNG, JPG
      </p>
      </div>
    </div>
  );
}
