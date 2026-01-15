import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In MVP, we're using localStorage on client side
    // This API route exists for future backend integration
    // For now, return empty array - actual data comes from client localStorage
    return NextResponse.json({ reviews: [] });
  } catch (error) {
    console.error('Review list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
