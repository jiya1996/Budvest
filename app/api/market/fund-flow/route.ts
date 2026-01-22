import { NextRequest, NextResponse } from 'next/server';
import { getFundFlow, isDatabaseAvailable } from '@/lib/market-data';

/**
 * 资金流向 API
 * GET /api/market/fund-flow?symbol=000001&limit=10
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
      { error: '资金流向仅支持 A 股（6位数字代码）' },
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
    const data = getFundFlow(symbol, limit);
=======
    const data = await getFundFlow(symbol, limit);
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: `股票 ${symbol} 资金流向数据未找到`,
        hint: '请确保数据采集服务已运行'
      }, { status: 404 });
    }

    // 格式化返回数据
    const result = data.map(item => ({
      symbol: item.symbol,
      name: item.name,
      tradeDate: item.trade_date,
      closePrice: item.close_price,
      changePct: item.change_pct,
      // 主力资金
      mainNetInflow: item.main_net_inflow,
      mainNetInflowPct: item.main_net_inflow_pct,
      // 超大单
      superLargeNetInflow: item.super_large_net_inflow,
      // 大单
      largeNetInflow: item.large_net_inflow,
      // 中单
      mediumNetInflow: item.medium_net_inflow,
      // 小单
      smallNetInflow: item.small_net_inflow,
    }));

    // 计算汇总数据（最近一天）
    const latest = result[0];
    const summary = {
      mainFlow: latest?.mainNetInflow || 0,
      mainFlowPct: latest?.mainNetInflowPct || 0,
      // 判断资金流向趋势
      trend: (latest?.mainNetInflow || 0) > 0 ? '流入' : '流出',
    };

    return NextResponse.json({
      success: true,
      summary,
      data: result,
      source: 'akshare',
    });

  } catch (error) {
    console.error('Error fetching fund flow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fund flow data' },
      { status: 500 }
    );
  }
}
