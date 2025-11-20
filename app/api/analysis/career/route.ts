import { NextRequest, NextResponse } from 'next/server';
import { runCareerTailoringAnalysis } from '@/lib/resume-analysis/career-tailoring';

export async function POST(request: NextRequest) {
  try {
    const { resumeContent, inferredJobTarget, jobDescription } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    const analysis = await runCareerTailoringAnalysis(
      resumeContent,
      inferredJobTarget || 'Unknown',
      jobDescription
    );

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Career & Tailoring analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze career and tailoring' },
      { status: 500 }
    );
  }
}
