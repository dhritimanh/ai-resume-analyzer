import { NextRequest, NextResponse } from 'next/server';
import { extractResumeWithVision } from '@/lib/kimi-vision';
import { ResumeData } from '@/types/resume';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileCount = parseInt(formData.get('fileCount') as string || '1');
    
    // Handle multiple files (for multi-page PDFs)
    const imageUrls: string[] = [];
    
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file${i}`) as File;
      
      if (!file) {
        continue;
      }

      // Accept image files (PDFs are converted to images on client side)
      if (!file.name.match(/\.(png|jpg|jpeg|pdf)$/i)) {
        return NextResponse.json({ 
          error: 'Please upload a PDF or image file (PDF, PNG, or JPG).' 
        }, { status: 400 });
      }

      // Convert file to base64
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      
      // Determine mime type
      let mimeType = 'image/png';
      if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      }

      const imageUrl = `data:${mimeType};base64,${base64}`;
      imageUrls.push(imageUrl);
    }

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'No valid files provided' }, { status: 400 });
    }

    console.log(`Processing ${imageUrls.length} page(s) from resume`);

    // Use Kimi Vision to extract all resume data from all pages
    const resumeData = await extractResumeWithVision(imageUrls);

    return NextResponse.json(resumeData);
  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to parse resume' 
    }, { status: 500 });
  }
}


