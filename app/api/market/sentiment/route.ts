
import { NextRequest, NextResponse } from 'next/server';
import { analyzeMarketSentiment } from '@/lib/market-sentiment-analyzer';

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch market data for analysis
    const [indexRes, fundFlowRes, newsRes] = await Promise.all([
      fetch(new URL('/api/market/index?symbol=000001', request.url)),
      fetch(new URL('/api/market/fund-flow?symbol=000001', request.url)),
      fetch(new URL('/api/market/news?symbol=CN:000001&limit=20', request.url))
    ]);

    const indexData = indexRes.ok ? (await indexRes.json()).data : undefined;
    const fundFlowData = fundFlowRes.ok ? await fundFlowRes.json() : undefined;
    const newsData = newsRes.ok ? await newsRes.json() : undefined;

    // 2. Perform sentiment analysis
    // For GET request we don't have user portfolio, passing empty array
    // This endpoint provides generic market sentiment analysis
    const analysis = await analyzeMarketSentiment([], {
      indexData,
      fundFlowData,
      newsData
    });

    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Market sentiment analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market sentiment' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { portfolio } = await request.json();

    // 1. Fetch market data for analysis
    const [indexRes, fundFlowRes, newsRes] = await Promise.all([
      fetch(new URL('/api/market/index?symbol=000001', request.url)),
      fetch(new URL('/api/market/fund-flow?symbol=000001', request.url)),
      fetch(new URL('/api/market/news?symbol=CN:000001&limit=20', request.url))
    ]);

    const indexData = indexRes.ok ? (await indexRes.json()).data : undefined;
    const fundFlowData = fundFlowRes.ok ? await fundFlowRes.json() : undefined;
    const newsData = newsRes.ok ? await newsRes.json() : undefined;

    // 2. Perform sentiment analysis with user portfolio
    const analysis = await analyzeMarketSentiment(portfolio || [], {
      indexData,
      fundFlowData,
      newsData
    });

    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Market sentiment analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market sentiment' },
      { status: 500 }
    );
  }
}
