import { NextRequest, NextResponse } from 'next/server';
import { getEarningsCalendar, isDatabaseAvailable } from '@/lib/market-data';

/**
 * 财报日历 API
 * GET /api/market/earnings?symbol=000001
 * GET /api/market/earnings (获取所有财报)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  try {
    // 检查数据库是否可用
    // Database check removed

      return NextResponse.json({
        error: '数据库不可用，请先启动数据采集服务',
        hint: 'cd data-service && python run.py'
      }, { status: 503 });
    }

    const data = getEarningsCalendar(symbol || undefined);


    if (!data || data.length === 0) {
      return NextResponse.json({
        error: symbol ? `股票 ${symbol} 财报数据未找到` : '暂无财报日历数据',
        hint: '请确保数据采集服务已运行'
      }, { status: 404 });
    }

    // 格式化返回数据
    const result = (data as any[]).map(item => ({
      symbol: item.symbol,
      name: item.name,
      reportDate: item.report_date,
      actualDate: item.actual_date,
      reportType: item.report_type,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result,
      source: 'akshare',
    });

  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings calendar' },
      { status: 500 }
    );
  }
}
