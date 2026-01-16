import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, tags, date } = body;

    if (!id || !content || !date) {
      return NextResponse.json(
        { error: 'id, content, and date are required' },
        { status: 400 }
      );
    }

    // In MVP, we're using localStorage on client side
    // This API route exists for future backend integration
    // For now, return success - actual storage happens on client
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Review save error:', error);
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    );
  }
}
