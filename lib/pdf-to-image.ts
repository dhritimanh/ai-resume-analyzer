/**
 * Convert PDF to image - CLIENT SIDE ONLY
 * This file provides utilities to convert PDF to images in the browser
 * before uploading to the server
 */

/**
 * Convert PDF file to PNG image (first page only)
 * This runs in the browser using pdfjs-dist
 */
export async function pdfToImage(file: File): Promise<Blob> {
  // Dynamically import pdfjs-dist (client-side only)
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  
  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  // Get first page
  const page = await pdf.getPage(1);
  
  // Set scale for good quality
  const scale = 2.0;
  const viewport = page.getViewport({ scale });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  // Render PDF page to canvas
  await page.render({
    canvasContext: context,
    viewport: viewport,
  } as any).promise;
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}

/**
 * Convert PDF file to base64 PNG image (first page only)
 */
export async function pdfToBase64Image(file: File): Promise<string> {
  const blob = await pdfToImage(file);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get number of pages in PDF
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    return pdf.numPages;
  } catch (error) {
    console.error('PDF page count error:', error);
    return 0;
  }
}

/**
 * Convert multiple PDF pages to images (up to maxPages)
 * Returns array of File objects, one per page
 */
export async function pdfToMultipleImages(file: File, maxPages: number = 5): Promise<File[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pageCount = Math.min(pdf.numPages, maxPages);
  const imageFiles: File[] = [];
  
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
    
    // Create File object
    const imageFile = new File(
      [blob],
      `${file.name.replace('.pdf', '')}-page${pageNum}.png`,
      { type: 'image/png' }
    );
    
    imageFiles.push(imageFile);
  }
  
  return imageFiles;
}
