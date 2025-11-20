import { NextRequest, NextResponse } from 'next/server';
import { runQuickAnalysisFree } from '@/lib/resume-analysis/quick-analysis-free';

export async function POST(request: NextRequest) {
  try {
    const { resumeContent } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    const analysis = await runQuickAnalysisFree(resumeContent);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Quick analysis free error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}
