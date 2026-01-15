import { NextRequest, NextResponse } from 'next/server';
import { getIndexRealtime, isDatabaseAvailable } from '@/lib/db';

/**
 * 指数实时行情 API
 * GET /api/market/index?symbol=000001
 * GET /api/market/index (获取所有指数)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  try {
    // 检查数据库是否可用
    if (!isDatabaseAvailable()) {
      return NextResponse.json({
        error: '数据库不可用，请先启动数据采集服务',
        hint: 'cd data-service && python run.py'
      }, { status: 503 });
    }

    const data = getIndexRealtime(symbol || undefined);

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: symbol ? `指数 ${symbol} 数据未找到` : '暂无指数数据',
        hint: '请确保数据采集服务已运行'
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
      source: 'akshare',
    });

  } catch (error) {
    console.error('Error fetching index data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch index data' },
      { status: 500 }
    );
  }
}
