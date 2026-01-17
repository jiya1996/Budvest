import { NextRequest, NextResponse } from 'next/server';
import { getIndexRealtime } from '@/lib/market-data';

/**
 * 指数实时行情 API
 * GET /api/market/index?symbol=sh000001
 * GET /api/market/index (获取所有指数)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  try {
    const data = await getIndexRealtime(symbol || undefined);

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: symbol ? `指数 ${symbol} 数据未找到` : '暂无指数数据',
        hint: '数据正在更新中，请稍后再试'
      }, { status: 404 });
    }

    // 格式化返回数据
    const result = data.map(item => ({
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      changePct: item.change_pct,
      changeAmount: item.change_amount,
      volume: item.volume,
      amount: item.amount,
      high: item.high,
      low: item.low,
      open: item.open,
      prevClose: item.prev_close,
      amplitude: item.amplitude,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: symbol ? result[0] : result,
      source: 'hybrid',
    });

  } catch (error) {
    console.error('Error fetching index data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch index data' },
      { status: 500 }
    );
  }
}
