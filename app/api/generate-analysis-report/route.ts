import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { AnalysisReportTemplate } from '@/templates/AnalysisReportTemplate';
import * as React from 'react';

export async function POST(request: NextRequest) {
  try {
    const {
      quickAnalysis,
      sectionAnalysis,
      languageAnalysis,
      careerAnalysis,
      insightsAnalysis,
      resumeData,
    } = await request.json();

    if (!quickAnalysis) {
      return NextResponse.json(
        { error: 'Quick analysis data is required' },
        { status: 400 }
      );
    }

    // Generate PDF using React.createElement
    const element = React.createElement(AnalysisReportTemplate, {
      quickAnalysis,
      sectionAnalysis,
      languageAnalysis,
      careerAnalysis,
      insightsAnalysis,
      resumeData,
    });
    
    const pdfBuffer = await renderToBuffer(element as any);

    // Return PDF with download headers
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-analysis-report.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Analysis report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate analysis report' },
      { status: 500 }
    );
  }
}
