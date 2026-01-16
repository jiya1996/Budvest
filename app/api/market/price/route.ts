import { NextRequest, NextResponse } from 'next/server';
import { getStockRealtime, isDatabaseAvailable } from '@/lib/db';

/**
 * 判断是否为 A 股代码
 * A 股代码为 6 位纯数字
 */
function isAShareSymbol(symbol: string): boolean {
  return /^\d{6}$/.test(symbol);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  // A 股：优先从本地数据库读取
  if (isAShareSymbol(symbol)) {
    try {
      // 检查数据库是否可用
      if (isDatabaseAvailable()) {
        const data = getStockRealtime(symbol);
        if (data && data.length > 0) {
          const stock = data[0];
          return NextResponse.json({
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price || 0,
            dayChg: stock.change_pct || 0,
            // 额外的 A 股数据
            volume: stock.volume,
            amount: stock.amount,
            high: stock.high,
            low: stock.low,
            open: stock.open,
            prevClose: stock.prev_close,
            amplitude: stock.amplitude,
            volumeRatio: stock.volume_ratio,
            turnoverRate: stock.turnover_rate,
            peRatio: stock.pe_ratio,
            pbRatio: stock.pb_ratio,
            totalMarketCap: stock.total_market_cap,
            circulatingMarketCap: stock.circulating_market_cap,
            updatedAt: stock.updated_at,
            source: 'akshare',
          });
        }
      }
    } catch (error) {
      console.error('Error reading from database:', error);
      // 数据库读取失败，继续尝试 FMP API
    }
  }

  // 美股/港股：使用 FMP API
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    // 如果是 A 股且数据库无数据，返回错误
    if (isAShareSymbol(symbol)) {
      return NextResponse.json({
        error: 'A股数据暂未采集，请先启动数据采集服务',
        hint: 'cd data-service && python run.py'
      }, { status: 404 });
    }
    return NextResponse.json({ error: 'FMP_API_KEY not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Price data not found' }, { status: 404 });
    }

    const quote = data[0];

    // Return price and day change
    return NextResponse.json({
      symbol: quote.symbol,
      price: quote.price || 0,
      dayChg: quote.changesPercentage || 0,
      source: 'fmp',
    });
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock price' },
      { status: 500 }
    );
  }
}
