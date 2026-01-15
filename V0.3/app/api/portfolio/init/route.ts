import { NextRequest, NextResponse } from 'next/server';
import { PortfolioItem, Stock, StockConfig } from '@/lib/types';
import { STOCK_DATABASE } from '@/lib/data';

// 获取最新价格（从FMP API）。获取不到时返回 0，由前端用 0 参与盈亏计算。
async function getLatestPrice(symbol: string): Promise<number> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/market/price?symbol=${symbol}`);
    if (response.ok) {
      const data = await response.json();
      return data.price || 0;
    }
  } catch (error) {
    console.error(`Failed to fetch latest price for ${symbol}:`, error);
  }
  // 接口失败或无数据时，明确返回 0，表示当前价格未知
  return 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolio, firstLoginTimestamp } = body;

    if (!portfolio || !Array.isArray(portfolio)) {
      return NextResponse.json(
        { error: 'portfolio is required and must be an array' },
        { status: 400 }
      );
    }

    // 处理每个持仓项，计算成本、盈亏等
    const processedPortfolio: PortfolioItem[] = await Promise.all(
      portfolio.map(async (item: PortfolioItem) => {
        const { config } = item;
        const shares = config.shares || 0;
        const pricePerShare = config.pricePerShare || 0;

        // 计算总成本
        const totalCost = shares > 0 && pricePerShare > 0 ? shares * pricePerShare : 0;

        // 如果是持有中，获取最新价格并计算盈亏
        // 盈亏规则与前端保持一致：profit = (每股持有成本 - 当前价格) × 股数
        // 如果实时价格获取失败，当前价格记为 0，则 profit = pricePerShare × shares（全部视为“浮盈”）
        let profit = 0;
        if (config.status === 'investing' && shares > 0 && pricePerShare > 0) {
          const marketPrice = await getLatestPrice(item.symbol); // 失败时返回 0
          profit = (pricePerShare - marketPrice) * shares;
        }

        return {
          ...item,
          config: {
            ...config,
            capital: totalCost.toString(),
            shares: shares,
            pricePerShare: pricePerShare,
          } as StockConfig,
          holdingDays: config.status === 'investing' ? 1 : 0, // 持有中从1开始
          firstBuyTimestamp: config.status === 'investing' ? Date.now() : undefined,
          cost: totalCost,
          profit: profit,
        };
      })
    );

    // 计算总投入本金（只计算持有中的股票）
    const investingItems = processedPortfolio.filter(
      (item) => item.config.status === 'investing'
    );
    const totalPrincipal = investingItems.reduce((sum, item) => sum + (item.cost || 0), 0);

    // 计算总盈亏（只计算持有中的股票）
    const totalProfit = investingItems.reduce((sum, item) => sum + (item.profit || 0), 0);

    return NextResponse.json({
      portfolio: processedPortfolio,
      totalPrincipal,
      totalProfit,
      firstLoginTimestamp: firstLoginTimestamp || Date.now(),
    });
  } catch (error) {
    console.error('Init portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize portfolio' },
      { status: 500 }
    );
  }
}

