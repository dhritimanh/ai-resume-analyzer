import { NextRequest, NextResponse } from 'next/server';
import { runTacticalAudit } from '@/lib/resume-analysis/tactical-audit';

export async function POST(request: NextRequest) {
  try {
    const { resumeContent, inferredJobTarget } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    const analysis = await runTacticalAudit(resumeContent, inferredJobTarget);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Tactical audit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run tactical audit' },
      { status: 500 }
    );
  }
}
