/**
 * 市场情绪综合分析模块
 * 基于ai-hedge-fund的核心逻辑，改造为适合A股市场的版本
 *
 * 核心功能：
 * 1. 多维度市场数据分析（指数、资金流向、新闻、个股、成交量）
 * 2. 加权计算综合情绪评分
 * 3. 判断市场情绪状态（利好/利空）
 * 4. 不提供投资建议，仅分析市场情绪
 */

import { PortfolioItem } from './types';

// ==================== 类型定义 ====================

/**
 * 单个维度的信号分析结果
 */
export interface DimensionSignal {
  bullish: number;      // 利好信号数量
  bearish: number;      // 利空信号数量
  neutral: number;      // 中性信号数量
  confidence: number;   // 信心度 0-100
  weight: number;       // 权重
  weightedBullish: number;  // 加权利好
  weightedBearish: number;  // 加权利空
  metrics: Record<string, any>;  // 详细指标
}

/**
 * 市场情绪分析结果
 */
export interface MarketSentimentAnalysis {
  // 综合信号
  signal: 'bullish' | 'bearish' | 'neutral';  // 利好/利空/中性
  confidence: number;  // 信心度 0-100

  // 各维度详细分析
  reasoning: {
    marketIndex: DimensionSignal;   // 大盘情绪
    fundFlow: DimensionSignal;      // 资金情绪
    news: DimensionSignal;          // 舆情情绪
    portfolio: DimensionSignal;     // 个股情绪
    activity: DimensionSignal;      // 市场活跃度
    combined: {
      totalWeightedBullish: number;
      totalWeightedBearish: number;
      determination: string;
    };
  };

  // 市场状态描述（不含投资建议）
  description: {
    title: string;
    summary: string;
    keyFactors: string[];
  };
}

// ==================== 权重配置 ====================

const DIMENSION_WEIGHTS = {
  marketIndex: 0.30,   // 大盘情绪 30%
  fundFlow: 0.25,      // 资金情绪 25%
  news: 0.20,          // 舆情情绪 20%
  portfolio: 0.15,     // 个股情绪 15%
  activity: 0.10,      // 市场活跃度 10%
};

// ==================== 主分析函数 ====================

/**
 * 分析市场情绪
 * @param portfolio 用户持仓
 * @param marketData 市场数据（可选，如果不提供则返回简化分析）
 * @returns 市场情绪分析结果
 */
export async function analyzeMarketSentiment(
  portfolio: PortfolioItem[],
  marketData?: {
    indexData?: any;
    fundFlowData?: any;
    newsData?: any;
  }
): Promise<MarketSentimentAnalysis> {
  try {
    // 如果没有提供市场数据，返回基于持仓的简化分析
    if (!marketData) {
      return getSimplifiedAnalysis(portfolio);
    }

    const { indexData, fundFlowData, newsData } = marketData;

    // 2. 分析各维度信号（安全访问数据）
    const dimensions = {
      marketIndex: analyzeMarketIndexSignals(indexData?.data),
      fundFlow: analyzeFundFlowSignals(fundFlowData?.summary, fundFlowData?.data),
      news: analyzeNewsSignals(newsData?.news),
      portfolio: analyzePortfolioSignals(portfolio),
      activity: analyzeMarketActivitySignals(indexData?.data),
    };

    // 3. 加权计算综合评分（借鉴ai-hedge-fund的加权逻辑）
    const bullishScore =
      dimensions.marketIndex.weightedBullish +
      dimensions.fundFlow.weightedBullish +
      dimensions.news.weightedBullish +
      dimensions.portfolio.weightedBullish +
      dimensions.activity.weightedBullish;

    const bearishScore =
      dimensions.marketIndex.weightedBearish +
      dimensions.fundFlow.weightedBearish +
      dimensions.news.weightedBearish +
      dimensions.portfolio.weightedBearish +
      dimensions.activity.weightedBearish;

    // 4. 判断综合信号（借鉴ai-hedge-fund的判断逻辑）
    let signal: 'bullish' | 'bearish' | 'neutral';
    if (bullishScore > bearishScore * 1.2) {
      signal = 'bullish';
    } else if (bearishScore > bullishScore * 1.2) {
      signal = 'bearish';
    } else {
      signal = 'neutral';
    }

    // 5. 计算信心度（借鉴ai-hedge-fund的信心度公式）
    const totalSignals = bullishScore + bearishScore;
    const confidence = totalSignals > 0
      ? Math.round((Math.max(bullishScore, bearishScore) / totalSignals) * 100)
      : 50;

    // 6. 生成市场状态描述（不含投资建议）
    const description = generateMarketDescription(signal, confidence, dimensions);

    // 7. 返回结构化结果
    return {
      signal,
      confidence,
      reasoning: {
        marketIndex: dimensions.marketIndex,
        fundFlow: dimensions.fundFlow,
        news: dimensions.news,
        portfolio: dimensions.portfolio,
        activity: dimensions.activity,
        combined: {
          totalWeightedBullish: Math.round(bullishScore * 10) / 10,
          totalWeightedBearish: Math.round(bearishScore * 10) / 10,
          determination: `${signal === 'bullish' ? '利好' : signal === 'bearish' ? '利空' : '中性'} (基于加权信号对比)`,
        },
      },
      description,
    };
  } catch (error) {
    console.error('Market sentiment analysis error:', error);
    // 返回默认中性结果
    return getDefaultNeutralResult();
  }
}

// ==================== 辅助函数 ====================

/**
 * 创建空信号对象
 */
function createEmptySignal(weight: number): DimensionSignal {
  return {
    bullish: 0,
    bearish: 0,
    neutral: 0,
    confidence: 0,
    weight,
    weightedBullish: 0,
    weightedBearish: 0,
    metrics: {},
  };
}

// ==================== 信号生成函数 ====================

/**
 * 分析大盘情绪（基于指数数据）
 * 分析维度：涨跌幅、振幅
 */
function analyzeMarketIndexSignals(indexData: any): DimensionSignal {
  const weight = DIMENSION_WEIGHTS.marketIndex;
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;

  if (!indexData || !indexData.changePct) {
    return createEmptySignal(weight);
  }

  const changePct = indexData.changePct;
  const amplitude = indexData.amplitude || 0;

  // 1. 根据涨跌幅判断信号
  if (changePct > 2) {
    bullish += 3; // 大涨
  } else if (changePct > 0.5) {
    bullish += 2; // 上涨
  } else if (changePct > 0) {
    bullish += 1; // 微涨
  } else if (changePct < -2) {
    bearish += 3; // 大跌
  } else if (changePct < -0.5) {
    bearish += 2; // 下跌
  } else if (changePct < 0) {
    bearish += 1; // 微跌
  } else {
    neutral += 1; // 平盘
  }

  // 2. 根据振幅判断市场稳定性
  if (amplitude > 3) {
    bearish += 1; // 高波动，增加利空信号
  } else if (amplitude < 1) {
    bullish += 1; // 低波动，增加利好信号
  }

  // 3. 计算加权信号
  const totalSignals = bullish + bearish + neutral;
  const confidence = totalSignals > 0
    ? Math.round((Math.max(bullish, bearish) / totalSignals) * 100)
    : 0;

  const weightedBullish = bullish * weight;
  const weightedBearish = bearish * weight;

  return {
    bullish,
    bearish,
    neutral,
    confidence,
    weight,
    weightedBullish,
    weightedBearish,
    metrics: {
      changePct: changePct.toFixed(2) + '%',
      amplitude: amplitude.toFixed(2) + '%',
      indexName: indexData.name || '上证指数',
      price: indexData.price,
    },
  };
}

/**
 * 分析资金流向情绪（基于主力资金数据）
 * 分析维度：主力资金净流入、流入流出趋势
 */
function analyzeFundFlowSignals(summary: any, data: any[]): DimensionSignal {
  const weight = DIMENSION_WEIGHTS.fundFlow;
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;

  if (!summary || summary.mainFlow === undefined) {
    return createEmptySignal(weight);
  }

  const mainFlow = summary.mainFlow;
  const mainFlowPct = summary.mainFlowPct || 0;

  // 1. 根据主力资金净流入判断信号
  if (mainFlowPct > 5) {
    bullish += 3; // 主力大幅流入
  } else if (mainFlowPct > 2) {
    bullish += 2; // 主力流入
  } else if (mainFlowPct > 0) {
    bullish += 1; // 主力小幅流入
  } else if (mainFlowPct < -5) {
    bearish += 3; // 主力大幅流出
  } else if (mainFlowPct < -2) {
    bearish += 2; // 主力流出
  } else if (mainFlowPct < 0) {
    bearish += 1; // 主力小幅流出
  } else {
    neutral += 1; // 资金平衡
  }

  // 2. 分析近期趋势（如果有历史数据）
  if (data && data.length >= 3) {
    const recentFlows = data.slice(0, 3).map(d => d.mainNetInflow);
    const positiveCount = recentFlows.filter(f => f > 0).length;
    const negativeCount = recentFlows.filter(f => f < 0).length;

    if (positiveCount >= 2) {
      bullish += 1; // 连续流入趋势
    } else if (negativeCount >= 2) {
      bearish += 1; // 连续流出趋势
    }
  }

  // 3. 计算加权信号
  const totalSignals = bullish + bearish + neutral;
  const confidence = totalSignals > 0
    ? Math.round((Math.max(bullish, bearish) / totalSignals) * 100)
    : 0;

  const weightedBullish = bullish * weight;
  const weightedBearish = bearish * weight;

  return {
    bullish,
    bearish,
    neutral,
    confidence,
    weight,
    weightedBullish,
    weightedBearish,
    metrics: {
      mainFlow: (mainFlow / 100000000).toFixed(2) + '亿',
      mainFlowPct: mainFlowPct.toFixed(2) + '%',
      trend: summary.trend || '未知',
    },
  };
}

/**
 * 分析新闻舆情情绪（基于新闻标题关键词）
 * 分析维度：新闻标题中的利好/利空关键词
 */
function analyzeNewsSignals(news: any[]): DimensionSignal {
  const weight = DIMENSION_WEIGHTS.news;
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;

  if (!news || news.length === 0) {
    return createEmptySignal(weight);
  }

  // 利好关键词
  const bullishKeywords = ['上涨', '突破', '利好', '增长', '创新高', '大涨', '飙升', '强势', '看好', '乐观'];
  // 利空关键词
  const bearishKeywords = ['下跌', '暴跌', '利空', '风险', '警告', '危机', '下滑', '亏损', '跌破', '悲观'];

  // 分析每条新闻标题
  news.forEach(item => {
    const title = (item.title || '').toLowerCase();
    let hasBullish = false;
    let hasBearish = false;

    // 检查利好关键词
    for (const keyword of bullishKeywords) {
      if (title.includes(keyword)) {
        hasBullish = true;
        break;
      }
    }

    // 检查利空关键词
    for (const keyword of bearishKeywords) {
      if (title.includes(keyword)) {
        hasBearish = true;
        break;
      }
    }

    // 统计信号
    if (hasBullish && !hasBearish) {
      bullish += 1;
    } else if (hasBearish && !hasBullish) {
      bearish += 1;
    } else {
      neutral += 1;
    }
  });

  // 计算加权信号
  const totalSignals = bullish + bearish + neutral;
  const confidence = totalSignals > 0
    ? Math.round((Math.max(bullish, bearish) / totalSignals) * 100)
    : 0;

  const weightedBullish = bullish * weight;
  const weightedBearish = bearish * weight;

  return {
    bullish,
    bearish,
    neutral,
    confidence,
    weight,
    weightedBullish,
    weightedBearish,
    metrics: {
      totalNews: news.length,
      bullishNews: bullish,
      bearishNews: bearish,
      neutralNews: neutral,
    },
  };
}

/**
 * 分析个股情绪（基于用户持仓表现）
 * 分析维度：持仓股票的涨跌情况
 */
function analyzePortfolioSignals(portfolio: PortfolioItem[]): DimensionSignal {
  const weight = DIMENSION_WEIGHTS.portfolio;
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;

  if (!portfolio || portfolio.length === 0) {
    return createEmptySignal(weight);
  }

  // 分析每只持仓股票
  portfolio.forEach(item => {
    const profitPct = ((item.currentPrice - item.costPrice) / item.costPrice) * 100;

    if (profitPct > 5) {
      bullish += 2; // 大幅盈利
    } else if (profitPct > 0) {
      bullish += 1; // 盈利
    } else if (profitPct < -5) {
      bearish += 2; // 大幅亏损
    } else if (profitPct < 0) {
      bearish += 1; // 亏损
    } else {
      neutral += 1; // 持平
    }
  });

  // 计算加权信号
  const totalSignals = bullish + bearish + neutral;
  const confidence = totalSignals > 0
    ? Math.round((Math.max(bullish, bearish) / totalSignals) * 100)
    : 0;

  const weightedBullish = bullish * weight;
  const weightedBearish = bearish * weight;

  // 计算平均盈亏
  const avgProfitPct = portfolio.reduce((sum, item) => {
    return sum + ((item.currentPrice - item.costPrice) / item.costPrice) * 100;
  }, 0) / portfolio.length;

  return {
    bullish,
    bearish,
    neutral,
    confidence,
    weight,
    weightedBullish,
    weightedBearish,
    metrics: {
      totalStocks: portfolio.length,
      avgProfitPct: avgProfitPct.toFixed(2) + '%',
      profitableStocks: portfolio.filter(p => p.currentPrice > p.costPrice).length,
      losingStocks: portfolio.filter(p => p.currentPrice < p.costPrice).length,
    },
  };
}

/**
 * 分析市场活跃度（基于成交量）
 * 分析维度：成交量变化
 */
function analyzeMarketActivitySignals(indexData: any): DimensionSignal {
  const weight = DIMENSION_WEIGHTS.activity;
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;

  if (!indexData || !indexData.volume) {
    return createEmptySignal(weight);
  }

  const volume = indexData.volume;
  const amount = indexData.amount || 0;

  // 简化处理：根据成交量判断市场活跃度
  // 实际应该与历史平均值对比，这里简化为根据成交金额判断
  const amountInBillion = amount / 100000000; // 转换为亿

  if (amountInBillion > 5000) {
    bullish += 2; // 成交活跃，市场热度高
  } else if (amountInBillion > 3000) {
    bullish += 1; // 成交正常
  } else if (amountInBillion < 2000) {
    bearish += 1; // 成交低迷
  } else {
    neutral += 1;
  }

  // 计算加权信号
  const totalSignals = bullish + bearish + neutral;
  const confidence = totalSignals > 0
    ? Math.round((Math.max(bullish, bearish) / totalSignals) * 100)
    : 0;

  const weightedBullish = bullish * weight;
  const weightedBearish = bearish * weight;

  return {
    bullish,
    bearish,
    neutral,
    confidence,
    weight,
    weightedBullish,
    weightedBearish,
    metrics: {
      volume: (volume / 100000000).toFixed(2) + '亿股',
      amount: amountInBillion.toFixed(2) + '亿元',
    },
  };
}

/**
 * 生成市场状态描述（不含投资建议）
 */
function generateMarketDescription(
  signal: string,
  confidence: number,
  dimensions: any
): MarketSentimentAnalysis['description'] {
  const signalText = signal === 'bullish' ? '利好' : signal === 'bearish' ? '利空' : '中性';

  // 收集关键因素
  const keyFactors: string[] = [];

  // 大盘因素
  const indexMetrics = dimensions.marketIndex.metrics;
  if (indexMetrics.changePct) {
    const changePct = parseFloat(indexMetrics.changePct);
    if (changePct > 1) {
      keyFactors.push(`大盘上涨${indexMetrics.changePct}`);
    } else if (changePct < -1) {
      keyFactors.push(`大盘下跌${indexMetrics.changePct}`);
    }
  }

  // 资金因素
  const fundMetrics = dimensions.fundFlow.metrics;
  if (fundMetrics.trend) {
    keyFactors.push(`主力资金${fundMetrics.trend}${fundMetrics.mainFlow}`);
  }

  // 新闻因素
  const newsMetrics = dimensions.news.metrics;
  if (newsMetrics.bullishNews > newsMetrics.bearishNews) {
    keyFactors.push(`新闻偏利好（${newsMetrics.bullishNews}条利好 vs ${newsMetrics.bearishNews}条利空）`);
  } else if (newsMetrics.bearishNews > newsMetrics.bullishNews) {
    keyFactors.push(`新闻偏利空（${newsMetrics.bearishNews}条利空 vs ${newsMetrics.bullishNews}条利好）`);
  }

  // 个股因素
  const portfolioMetrics = dimensions.portfolio.metrics;
  if (portfolioMetrics.totalStocks > 0) {
    keyFactors.push(`持仓平均${portfolioMetrics.avgProfitPct}`);
  }

  // 生成摘要
  let summary = '';
  if (signal === 'bullish') {
    summary = `当前市场情绪偏向利好（信心度${confidence}%）。多项指标显示市场氛围较为积极。`;
  } else if (signal === 'bearish') {
    summary = `当前市场情绪偏向利空（信心度${confidence}%）。多项指标显示市场氛围较为谨慎。`;
  } else {
    summary = `当前市场情绪中性（信心度${confidence}%）。市场处于观望状态，利好利空因素相对平衡。`;
  }

  return {
    title: `市场情绪：${signalText}`,
    summary,
    keyFactors,
  };
}

function getDefaultNeutralResult(): MarketSentimentAnalysis {
  const emptySignal = createEmptySignal(0);
  return {
    signal: 'neutral',
    confidence: 50,
    reasoning: {
      marketIndex: { ...emptySignal, weight: DIMENSION_WEIGHTS.marketIndex },
      fundFlow: { ...emptySignal, weight: DIMENSION_WEIGHTS.fundFlow },
      news: { ...emptySignal, weight: DIMENSION_WEIGHTS.news },
      portfolio: { ...emptySignal, weight: DIMENSION_WEIGHTS.portfolio },
      activity: { ...emptySignal, weight: DIMENSION_WEIGHTS.activity },
      combined: {
        totalWeightedBullish: 0,
        totalWeightedBearish: 0,
        determination: '数据不足，无法判断',
      },
    },
    description: {
      title: '市场情绪：中性',
      summary: '当前数据不足，无法准确判断市场情绪',
      keyFactors: [],
    },
  };
}

/**
 * 简化分析（仅基于持仓，不需要市场数据）
 */
function getSimplifiedAnalysis(portfolio: PortfolioItem[]): MarketSentimentAnalysis {
  const portfolioSignal = analyzePortfolioSignals(portfolio);
  const emptySignal = createEmptySignal(0);

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (portfolioSignal.bullish > portfolioSignal.bearish * 1.5) {
    signal = 'bullish';
  } else if (portfolioSignal.bearish > portfolioSignal.bullish * 1.5) {
    signal = 'bearish';
  }

  return {
    signal,
    confidence: portfolioSignal.confidence,
    reasoning: {
      marketIndex: { ...emptySignal, weight: DIMENSION_WEIGHTS.marketIndex },
      fundFlow: { ...emptySignal, weight: DIMENSION_WEIGHTS.fundFlow },
      news: { ...emptySignal, weight: DIMENSION_WEIGHTS.news },
      portfolio: portfolioSignal,
      activity: { ...emptySignal, weight: DIMENSION_WEIGHTS.activity },
      combined: {
        totalWeightedBullish: portfolioSignal.weightedBullish,
        totalWeightedBearish: portfolioSignal.weightedBearish,
        determination: `${signal === 'bullish' ? '利好' : signal === 'bearish' ? '利空' : '中性'} (仅基于持仓分析)`,
      },
    },
    description: {
      title: `市场情绪：${signal === 'bullish' ? '利好' : signal === 'bearish' ? '利空' : '中性'}`,
      summary: portfolio.length > 0
        ? `基于您的持仓分析，当前组合表现${signal === 'bullish' ? '较好' : signal === 'bearish' ? '较弱' : '平稳'}。`
        : '暂无持仓数据，无法分析。',
      keyFactors: portfolio.length > 0 ? [`持仓平均${portfolioSignal.metrics.avgProfitPct}`] : [],
    },
  };
}

