import { NextRequest, NextResponse } from 'next/server';
import { runStrategicRoadmap } from '@/lib/resume-analysis/strategic-roadmap';

export async function POST(request: NextRequest) {
  try {
    const { resumeContent, inferredJobTarget, jobDescription } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    const analysis = await runStrategicRoadmap(resumeContent, inferredJobTarget, jobDescription);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Strategic roadmap error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run strategic roadmap' },
      { status: 500 }
    );
  }
}
