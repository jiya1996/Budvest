import { NextRequest, NextResponse } from 'next/server';
import { getStockDaily } from '@/lib/market-data';

/**
 * 日K线数据 API
 * GET /api/market/kline?symbol=000001&limit=30
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 30;

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  // 验证是否为 A 股代码
  if (!/^\d{6}$/.test(symbol)) {
    return NextResponse.json(
      { error: '日K线数据仅支持 A 股（6位数字代码）' },
      { status: 400 }
    );
  }

  try {
    const data = await getStockDaily(symbol, limit);

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: `股票 ${symbol} 日K线数据未找到`,
        hint: '数据正在采集中，请稍后再试'
      }, { status: 404 });
    }

    // 格式化返回数据（按日期正序，方便绘制 K 线图）
    const result = data.map(item => ({
      date: item.trade_date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      changePct: item.change_pct,
    })).reverse();  // 反转为正序（从早到晚）

    return NextResponse.json({
      success: true,
      symbol,
      count: result.length,
      data: result,
      source: 'hybrid',
    });

  } catch (error) {
    console.error('Error fetching kline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kline data' },
      { status: 500 }
    );
  }
}
