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
        // V0.3 Change: Use local SQLite DB for CN news (populated by Python service)
        // Dynamically import to avoid circular dependencies if any, though lib/db is safe
        const { getStockNews } = await import('@/lib/db');
        const dbNews = getStockNews(code, limit);

        // Convert DB News to API NewsItem format
        news = dbNews.map(item => ({
          title: item.title,
          source: item.source || 'SSE',
          publishedAt: item.publish_time || item.created_at, // Fallback to created_at
          url: item.url || '#'
        }));

        // If DB is empty (service not running yet), fall back to direct fetch?
        // For strict V0.3 architecture compliance, we should rely on DB, but for "3 days to launch" safety, 
        // we keep the fallback to fetchCNNews if DB returns empty.
        if (news.length === 0) {
          console.log('Local DB empty for CN news, falling back to direct fetch');
          news = await fetchCNNews(code);
        }
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

    // Map publishedAt to publishedDate to match frontend type definition
    const mappedNews = news.map(item => ({
      title: item.title,
      publishedDate: item.publishedAt,
      url: item.url,
    }));

    return NextResponse.json({ news: mappedNews });
  } catch (error) {
    console.error('Error inside market news API:', error);
    // Requirement 6: Return [] on exception, do not throw 500
    return NextResponse.json({ news: [] });
  }
}
