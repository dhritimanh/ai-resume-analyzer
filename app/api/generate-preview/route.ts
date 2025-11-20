import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeData, TemplateType } from '@/types/resume';
import { ModernTemplate } from '@/templates/ModernTemplate';
import { ClassicTemplate } from '@/templates/ClassicTemplate';
import { MinimalTemplate } from '@/templates/MinimalTemplate';
import React from 'react';

export async function POST(request: NextRequest) {
  try {
    const { resumeData, template } = await request.json() as {
      resumeData: ResumeData;
      template: TemplateType;
    };

    if (!resumeData || !template) {
      return NextResponse.json(
        { error: 'Resume data and template are required' },
        { status: 400 }
      );
    }

    let document;
    switch (template) {
      case 'modern':
        document = React.createElement(ModernTemplate, { data: resumeData });
        break;
      case 'classic':
        document = React.createElement(ClassicTemplate, { data: resumeData });
        break;
      case 'minimal':
        document = React.createElement(MinimalTemplate, { data: resumeData });
        break;
      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    // @ts-ignore - renderToBuffer accepts React elements
    const pdfBuffer = await renderToBuffer(document);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
