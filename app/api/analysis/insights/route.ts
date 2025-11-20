import { NextRequest, NextResponse } from 'next/server';
import { runDeepInsightsAnalysis } from '@/lib/resume-analysis/deep-insights';

export async function POST(request: NextRequest) {
  try {
    const { resumeContent, inferredJobTarget, skills, roles } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    const analysis = await runDeepInsightsAnalysis(
      resumeContent,
      inferredJobTarget || 'Unknown',
      skills || [],
      roles || []
    );

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Deep Insights analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze deep insights' },
      { status: 500 }
    );
  }
}
