import { NextRequest, NextResponse } from 'next/server';
import { PortfolioItem, Stock, StockConfig } from '@/lib/types';
import { STOCK_DATABASE } from '@/lib/data';

interface ParsedCommand {
  stockName: string;
  userIntent:
    | '用户增持'
    | '用户减持'
    | '用户观望'
    | '用户删除'
    | '用户删除持有'
    | '用户删除观望'
    | '用户全部删除'
    | '用户更新';
  cost: number;
  time: string;
  price: number;
  shares: number;
  holdingDays: number;
  stockNames?: string[];
}

function findStockByName(name: string): Stock | null {
  const upper = name.toUpperCase();

  const direct = STOCK_DATABASE.find(
    (s) =>
      s.symbol.toUpperCase() === upper ||
      s.name.toLowerCase() === name.toLowerCase()
  );
  if (direct) return direct;

  const nameMap: Record<string, string> = {
    特斯拉: 'TSLA',
    tesla: 'TSLA',
    TSLA: 'TSLA',
    苹果: 'AAPL',
    apple: 'AAPL',
    AAPL: 'AAPL',
    英伟达: 'NVDA',
    nvidia: 'NVDA',
    NVDA: 'NVDA',
    微软: 'MSFT',
    microsoft: 'MSFT',
    MSFT: 'MSFT',
    阿里巴巴: 'BABA',
    alibaba: 'BABA',
    BABA: 'BABA',
    谷歌: 'GOOG',
    google: 'GOOG',
    GOOG: 'GOOG',
    亚马逊: 'AMZN',
    amazon: 'AMZN',
    AMZN: 'AMZN',
    Meta: 'META',
    meta: 'META',
    脸书: 'META',
  };

  const mapped = nameMap[name] || nameMap[upper];
  if (mapped) {
    return STOCK_DATABASE.find((s) => s.symbol === mapped) || null;
  }

  return null;
}

async function getLatestPrice(symbol: string): Promise<number> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return 0;

  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return 0;
    return typeof data[0].price === 'number' ? data[0].price : 0;
  } catch {
    return 0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const portfolio: PortfolioItem[] = body.portfolio || [];
    const command: ParsedCommand | undefined = body.command;

    if (!command) {
      return NextResponse.json(
        { error: 'command is required' },
        { status: 400 }
      );
    }

    const {
      stockName,
      userIntent,
      cost,
      time,
      price,
      shares,
      holdingDays,
      stockNames,
    } = command;

    // 基本校验：增持/减持必须有价格和股数（这一步前端已校验，这里再兜底）
    if (
      (userIntent === '用户增持' || userIntent === '用户减持') &&
      (!price || price <= 0 || !shares || shares <= 0)
    ) {
      return NextResponse.json(
        { error: '无效的价格或股数', code: 'INVALID_PRICE_OR_SHARES' },
        { status: 400 }
      );
    }

    const stock = findStockByName(stockName);
    if (!stock && userIntent !== '用户全部删除') {
      return NextResponse.json(
        { error: `未找到股票：${stockName}` },
        { status: 400 }
      );
    }

    let updatedPortfolio: PortfolioItem[] = [...portfolio];

    // 全部删除
    if (userIntent === '用户全部删除') {
      updatedPortfolio = [];
    } else if (stock) {
      const symbol = stock.symbol;
      const investingIndex = updatedPortfolio.findIndex(
        (p) => p.symbol === symbol && p.config.status === 'investing'
      );
      const watchingIndex = updatedPortfolio.findIndex(
        (p) => p.symbol === symbol && p.config.status === 'watching'
      );

      const finalPricePerShare = price > 0 ? price : 0;
      const finalShares = shares > 0 ? shares : 0;
      const finalCost =
        finalPricePerShare > 0 && finalShares > 0
          ? finalPricePerShare * finalShares
          : cost > 0
          ? cost
          : 0;

      // 需要实时价格时调用
      const marketPrice =
        userIntent === '用户增持' || userIntent === '用户减持'
          ? await getLatestPrice(symbol)
          : 0;

      if (userIntent === '用户增持') {
        if (investingIndex >= 0) {
          const existing = updatedPortfolio[investingIndex];
          const existingShares = existing.config.shares || 0;
          const existingPricePerShare =
            existingShares > 0 ? existing.cost / existingShares : 0;
          const totalShares = existingShares + finalShares;
          const newPricePerShare =
            totalShares > 0
              ? (existingPricePerShare * existingShares +
                  finalPricePerShare * finalShares) /
                totalShares
              : finalPricePerShare;
          const newCost = newPricePerShare * totalShares;
          const effectivePrice = marketPrice || 0;
          const newProfit =
            newPricePerShare > 0
              ? (newPricePerShare - effectivePrice) * totalShares
              : 0;

          updatedPortfolio[investingIndex] = {
            ...existing,
            cost: newCost,
            profit: newProfit,
            // 保留原有的 firstBuyTimestamp（如果是首次买入，应该已经设置了）
            firstBuyTimestamp: existing.firstBuyTimestamp || Date.now(),
            config: {
              ...existing.config,
              shares: totalShares,
              capital: newCost.toString(),
              pricePerShare: newPricePerShare,
            } as StockConfig,
          };
        } else {
          const effectivePrice = marketPrice || 0;
          const newProfit =
            finalPricePerShare > 0
              ? (finalPricePerShare - effectivePrice) * finalShares
              : 0;
          const newTotalCost = finalPricePerShare * finalShares;

          const newItem: PortfolioItem = {
            ...stock,
            config: {
              status: 'investing',
              capital: newTotalCost.toString(),
              goal: '长期增值',
              shares: finalShares,
              pricePerShare: finalPricePerShare,
            },
            holdingDays: 1, // 初始为1天，后续通过 firstBuyTimestamp 动态计算
            firstBuyTimestamp: Date.now(), // 记录首次买入时间
            cost: newTotalCost,
            profit: newProfit,
          };
          updatedPortfolio.push(newItem);
        }

        // 从观望中移除
        if (watchingIndex >= 0) {
          updatedPortfolio = updatedPortfolio.filter(
            (_, idx) => idx !== watchingIndex
          );
        }
      } else if (userIntent === '用户减持') {
        if (investingIndex >= 0) {
          const existing = updatedPortfolio[investingIndex];
          const currentShares = existing.config.shares || 0;
          const currentCost = existing.cost || 0;

          let remainingShares = currentShares - finalShares;
          let remainingCost = currentCost;

          const sellPrice = marketPrice || 0;
          if (finalShares > 0 && sellPrice > 0) {
            const costPerShare =
              currentShares > 0 ? currentCost / currentShares : 0;
            const soldCost = costPerShare * finalShares;
            const soldAmount = sellPrice * finalShares;
            const sellProfit = soldAmount - soldCost;

            const remainingCostBeforeAdjust = costPerShare * remainingShares;
            remainingCost = remainingCostBeforeAdjust - sellProfit;
            if (remainingCost < 0) remainingCost = 0;
          } else if (finalShares > 0) {
            const costPerShare =
              currentShares > 0 ? currentCost / currentShares : 0;
            remainingCost = costPerShare * remainingShares;
          } else {
            remainingShares = 0;
            remainingCost = 0;
          }

          if (remainingShares <= 0 || remainingCost <= 0) {
            updatedPortfolio.splice(investingIndex, 1);
          } else {
            const newCostPerShare =
              remainingShares > 0 ? remainingCost / remainingShares : 0;
            const effectivePrice = marketPrice || 0;
            const newProfit =
              newCostPerShare > 0
                ? (newCostPerShare - effectivePrice) * remainingShares
                : 0;

            updatedPortfolio[investingIndex] = {
              ...existing,
              cost: remainingCost,
              profit: newProfit,
              // 保留原有的 firstBuyTimestamp（减持不重置持有天数）
              firstBuyTimestamp: existing.firstBuyTimestamp || Date.now(),
              config: {
                ...existing.config,
                capital: remainingCost.toString(),
                shares: remainingShares,
                pricePerShare: newCostPerShare,
              } as StockConfig,
            };
          }
        }
      } else if (userIntent === '用户删除持有') {
        if (investingIndex >= 0) {
          updatedPortfolio = updatedPortfolio.filter(
            (_, idx) => idx !== investingIndex
          );
        }
      } else if (userIntent === '用户删除观望') {
        if (watchingIndex >= 0) {
          updatedPortfolio = updatedPortfolio.filter(
            (_, idx) => idx !== watchingIndex
          );
        }
      } else if (userIntent === '用户删除') {
        const namesToDelete =
          stockNames && stockNames.length > 0 ? stockNames : [stockName];
        const symbolsToDelete = namesToDelete
          .map((n) => findStockByName(n))
          .filter(Boolean)
          .map((s) => (s as Stock).symbol);
        updatedPortfolio = updatedPortfolio.filter(
          (p) => !symbolsToDelete.includes(p.symbol)
        );
      } else if (userIntent === '用户观望') {
        if (watchingIndex >= 0) {
          // 已在观望，不变
        } else {
          const newItem: PortfolioItem = {
            ...stock,
            config: {
              status: 'watching',
              capital: '',
              goal: '长期增值',
              shares: finalShares || 0,
            },
            holdingDays: 0, // 观望中的股票不计算持有天数
            cost: 0,
            profit: 0,
          };
          updatedPortfolio.push(newItem);
        }
        if (investingIndex >= 0) {
          updatedPortfolio = updatedPortfolio.filter(
            (_, idx) => idx !== investingIndex
          );
        }
      } else if (userIntent === '用户更新') {
        if (investingIndex >= 0) {
          const existing = updatedPortfolio[investingIndex];
          const newCost = cost > 0 ? cost : existing.cost;
          const newHoldingDays =
            typeof holdingDays === 'number'
              ? holdingDays
              : existing.holdingDays;
          updatedPortfolio[investingIndex] = {
            ...existing,
            // 如果用户手动更新了持有天数，更新 firstBuyTimestamp 以反映新的持有天数
            // 计算：firstBuyTimestamp = 今天 - 持有天数
            firstBuyTimestamp: typeof holdingDays === 'number' && holdingDays > 0
              ? Date.now() - (holdingDays - 1) * 24 * 60 * 60 * 1000 // 减1因为从1开始
              : existing.firstBuyTimestamp || Date.now(),
            holdingDays: newHoldingDays,
            cost: newCost,
            config: {
              ...existing.config,
              capital: newCost.toString(),
            },
          };
        }
      }
    }

    return NextResponse.json({ portfolio: updatedPortfolio });
  } catch (e) {
    console.error('apply-command error', e);
    return NextResponse.json(
      { error: 'Failed to apply command' },
      { status: 500 }
    );
  }
}


