import { NextRequest, NextResponse } from 'next/server';
import { rewriteWithKimi } from '@/lib/kimi-api';

export async function POST(request: NextRequest) {
  try {
    const { content, sectionType } = await request.json();

    if (!content || !sectionType) {
      return NextResponse.json(
        { error: 'Content and sectionType are required' },
        { status: 400 }
      );
    }

    const rewrittenContent = await rewriteWithKimi(content, sectionType);

    return NextResponse.json({ rewrittenContent });
  } catch (error: any) {
    console.error('Rewrite error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to rewrite content' },
      { status: 500 }
    );
  }
}
