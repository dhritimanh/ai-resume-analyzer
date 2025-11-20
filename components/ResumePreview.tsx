'use client';

import { useEffect, useState } from 'react';
import { ResumeData, TemplateType } from '@/types/resume';

interface ResumePreviewProps {
  resumeData: ResumeData;
  template: TemplateType;
}

export default function ResumePreview({ resumeData, template }: ResumePreviewProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generatePreview();
  }, [resumeData, template]);

  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          template,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate preview');

      const blob = await response.blob();
      
      // Convert PDF to image using canvas
      const arrayBuffer = await blob.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      
      // Use pdfjs to render PDF as image
      const pdfjsLib = await import('pdfjs-dist');
      // Use unpkg CDN which works better with Next.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;
        
        const imageUrl = canvas.toDataURL('image/png');
        setPreviewImage(imageUrl);
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-xs text-gray-600 font-medium">
            Resume Preview - {template.charAt(0).toUpperCase() + template.slice(1)} Template
          </span>
        </div>
      </div>

      <div 
        className="relative bg-gray-50 overflow-auto" 
        style={{ height: '600px' }}
        onContextMenu={handleContextMenu}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Generating preview...</p>
            </div>
          </div>
        ) : previewImage ? (
          <div className="flex items-start justify-center p-4">
            <img
              src={previewImage}
              alt="Resume Preview"
              className="max-w-full h-auto shadow-lg"
              style={{ 
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              onContextMenu={handleContextMenu}
              draggable={false}
            />
            {/* Watermark overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div 
                className="text-gray-300 text-6xl font-bold opacity-10 rotate-[-45deg] select-none"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
              >
                PREVIEW
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-500">Preview not available</p>
          </div>
        )}
      </div>

      <div className="bg-gray-100 px-4 py-3 border-t border-gray-300 text-center">
        <p className="text-xs text-gray-600">
          🔒 This is a protected preview. Pay to download the full PDF.
        </p>
      </div>
    </div>
  );
}
