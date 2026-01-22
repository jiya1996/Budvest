import { NextRequest, NextResponse } from 'next/server';
import { getMarginTrading, isDatabaseAvailable } from '@/lib/market-data';

/**
 * 融资融券 API
 * GET /api/market/margin?symbol=000001&limit=10
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  // 验证是否为 A 股代码
  if (!/^\d{6}$/.test(symbol)) {
    return NextResponse.json(
      { error: '融资融券仅支持 A 股（6位数字代码）' },
      { status: 400 }
    );
  }

  try {
    // 检查数据库是否可用
<<<<<<< HEAD
    // Database check removed
=======
    if (!isDatabaseAvailable()) {
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
      return NextResponse.json({
        error: '数据库不可用，请先启动数据采集服务',
        hint: 'cd data-service && python run.py'
      }, { status: 503 });
    }

<<<<<<< HEAD
    const data = getMarginTrading(symbol, limit);
=======
    const data = await getMarginTrading(symbol, limit);
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: `股票 ${symbol} 融资融券数据未找到`,
        hint: '该股票可能不在融资融券标的范围内，或数据尚未采集'
      }, { status: 404 });
    }

    // 格式化返回数据
    const result = data.map(item => ({
      symbol: item.symbol,
      name: item.name,
      tradeDate: item.trade_date,
      // 融资数据
      marginBalance: item.margin_balance,       // 融资余额
      marginBuy: item.margin_buy,               // 融资买入额
      // 融券数据
      shortBalance: item.short_balance,         // 融券余额
      // 融资融券总余额
      marginShortBalance: item.margin_short_balance,
    }));

    // 计算汇总数据（最近一天）
    const latest = result[0];
    const summary = {
      marginBalance: latest?.marginBalance || 0,
      shortBalance: latest?.shortBalance || 0,
      totalBalance: latest?.marginShortBalance || 0,
    };

    return NextResponse.json({
      success: true,
      summary,
      data: result,
      source: 'akshare',
    });

  } catch (error) {
    console.error('Error fetching margin trading:', error);
    return NextResponse.json(
      { error: 'Failed to fetch margin trading data' },
      { status: 500 }
    );
  }
}
