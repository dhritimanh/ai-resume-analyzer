import { NextRequest, NextResponse } from 'next/server';
import { runSectionAnalysis } from '@/lib/resume-analysis/section-analysis';

export async function POST(request: NextRequest) {
  try {
    const { resumeContent, inferredJobTarget } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    const analysis = await runSectionAnalysis(resumeContent, inferredJobTarget || 'Unknown');

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Section analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze resume sections' },
      { status: 500 }
    );
  }
}
