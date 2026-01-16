import { NextRequest, NextResponse } from 'next/server';
import { fetchUSNews, fetchHKNews, fetchCNNews, NewsItem } from '@/lib/market/providers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbolParam = searchParams.get('symbol'); // e.g. US:AAPL
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // If no symbol provided, return empty as per "Exception returns []" rule usually implying graceful failure
  if (!symbolParam) {
    return NextResponse.json({ news: [] });
  }

  // Parse market and symbol code: "MARKET:CODE"
  const parts = symbolParam.split(':');

  // If format is not MARKET:CODE, return empty or handle error
  if (parts.length !== 2) {
    return NextResponse.json({ news: [] });
  }

  const market = parts[0].toUpperCase();
  const code = parts[1];

  try {
    let news: NewsItem[] = [];

    switch (market) {
      case 'US':
        news = await fetchUSNews(code);
        break;
      case 'HK':
        news = await fetchHKNews(code);
        break;
      case 'CN':
        news = await fetchCNNews(code);
        break;
      default:
        // Unknown market
        news = [];
    }

    // Sort by date descending
    news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Limit
    if (limit > 0) {
      news = news.slice(0, limit);
    }

    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error inside market news API:', error);
    // Requirement 6: Return [] on exception, do not throw 500
    return NextResponse.json({ news: [] });
  }
}
