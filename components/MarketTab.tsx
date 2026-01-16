'use client';

import { useState, useEffect } from 'react';
import { Send, Brain, Shield, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { PortfolioItem } from '@/lib/types';
import { GURUS, DAILY_INSIGHT } from '@/lib/data';
import { getCurrencySymbol } from '@/lib/currency';

interface MarketTabProps {
  portfolio: PortfolioItem[];
  totalPrincipal: number;
  totalProfit: number;
  animateCoins: boolean;
}

// Grow风格纯金币组件 - 不带logo
const GoldCoin = ({
  delay,
  style,
  size = 'md',
  animate,
}: {
  delay: number;
  style: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  animate: boolean;
}) => {
  const sizes = {
    sm: { width: 24, height: 8 },
    md: { width: 32, height: 10 },
    lg: { width: 40, height: 12 },
  };
  const s = sizes[size];

  return (
    <div
      className="absolute z-10"
      style={{
        animation: animate ? `dropIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms forwards` : 'none',
        opacity: animate ? 0 : 1,
        transform: animate ? 'translateY(-100px)' : 'none',
        ...style,
      }}
    >
      {/* 金币主体 */}
      <div
        style={{
          width: s.width,
          height: s.height,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 30%, #FACC15 60%, #F59E0B 100%)',
          boxShadow: '0 2px 4px rgba(217, 119, 6, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
          position: 'relative',
        }}
      >
        {/* 金币厚度 */}
        <div
          style={{
            position: 'absolute',
            bottom: -3,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #D97706 0%, #B45309 100%)',
          }}
        />
        {/* 金币高光 */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: '20%',
            width: '30%',
            height: '40%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
          }}
        />
      </div>
    </div>
  );
};

// Grow风格玻璃储蓄罐组件
const SavingsJar = ({
  children,
  fillPercent,
  animate,
  label,
  amount,
  isProfit,
  profitPercent,
  loading,
}: {
  children: React.ReactNode;
  fillPercent: number;
  animate: boolean;
  label: string;
  amount: number;
  isProfit?: boolean;
  profitPercent?: string;
  loading?: boolean;
}) => (
  <div className="flex flex-col items-center">
    <div className="relative w-28 h-36">
      {/* 罐盖 - 木质纹理 */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-[75%] h-6 rounded-full z-30"
        style={{
          background: 'linear-gradient(180deg, #D4A574 0%, #C4956A 30%, #A67C52 70%, #8B6914 100%)',
          boxShadow: '0 3px 8px rgba(139, 105, 20, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* 盖子高光 */}
        <div
          className="absolute top-1 left-[15%] w-[40%] h-2 rounded-full"
          style={{ background: 'rgba(255, 255, 255, 0.3)' }}
        />
      </div>

      {/* 罐身 */}
      <div
        className="absolute inset-0 mt-2 rounded-t-xl rounded-b-[2.5rem] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.88) 100%)',
          border: '2px solid rgba(180, 180, 180, 0.3)',
          boxShadow: '0 8px 32px rgba(148, 163, 184, 0.25), inset 0 4px 20px rgba(255, 255, 255, 0.9), inset -6px 0 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* 左侧高光 */}
        <div
          className="absolute top-6 left-[8%] w-[25%] h-[55%] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%)',
            borderRadius: '50%',
          }}
        />

        {/* 填充背景 - 金色渐变 */}
        <div
          className="absolute bottom-0 w-full transition-all duration-1000 ease-out"
          style={{
            height: animate ? `${Math.min(fillPercent, 85)}%` : '0%',
            background: 'linear-gradient(180deg, rgba(254, 243, 199, 0.7) 0%, rgba(253, 230, 138, 0.5) 50%, rgba(252, 211, 77, 0.4) 100%)',
          }}
        />

        {/* 金币容器 */}
        <div className="absolute inset-0">{children}</div>
      </div>

      {/* 盈亏标签 */}
      {!loading && isProfit !== undefined && profitPercent && (
        <div
          className="absolute -right-2 top-8 px-2 py-1 rounded-lg flex items-center gap-0.5 animate-pulse-soft z-40"
          style={{
            background: isProfit
              ? 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)'
              : 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            boxShadow: isProfit
              ? '0 2px 8px rgba(74, 222, 128, 0.3)'
              : '0 2px 8px rgba(248, 113, 113, 0.3)',
          }}
        >
          {isProfit ? <TrendingUp size={10} className="text-green-600" /> : <TrendingDown size={10} className="text-red-500" />}
          <span className={`text-[10px] font-bold ${isProfit ? 'text-green-700' : 'text-red-600'}`}>
            {isProfit ? '+' : ''}{profitPercent}%
          </span>
        </div>
      )}
    </div>

    {/* 标签和金额 */}
    <div className="mt-3 text-center">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div
        className={`text-lg font-bold font-mono px-3 py-1 rounded-full ${
          loading
            ? 'text-gray-400'
            : isProfit !== undefined
            ? isProfit
              ? 'text-green-600'
              : 'text-red-500'
            : 'text-gray-700'
        }`}
        style={{ background: 'rgba(255, 255, 255, 0.8)' }}
      >
        {loading
          ? '¥--'
          : `${isProfit !== undefined && amount >= 0 ? '+' : ''}¥${Math.abs(amount).toLocaleString(
              'zh-CN',
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`}
      </div>
    </div>
  </div>
);

export default function MarketTab({ portfolio, totalPrincipal, totalProfit, animateCoins }: MarketTabProps) {
  const [marketInput, setMarketInput] = useState('');
  const [showPortfolioDetail, setShowPortfolioDetail] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{ USDCNY: number; HKDCNY: number; CNYCNY: number } | null>(null);

  const investingStocks = portfolio.filter((s) => s.config.status === 'investing');

  // 获取汇率（与 PortfolioTab 保持一致）
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('/api/exchange-rate');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates);
        } else {
          setExchangeRates({ USDCNY: 7.2, HKDCNY: 0.92, CNYCNY: 1 });
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates in MarketTab:', error);
        setExchangeRates({ USDCNY: 7.2, HKDCNY: 0.92, CNYCNY: 1 });
      }
    };
    fetchExchangeRates();
  }, []);

  // 将金额转换为人民币（与 PortfolioTab 逻辑一致）
  const convertToCNY = (amount: number, symbol: string): number => {
    if (!exchangeRates) return amount;

    const currency = getCurrencySymbol(symbol);
    if (currency === '¥') {
      return amount;
    } else if (currency === 'HK$') {
      return amount * exchangeRates.HKDCNY;
    } else if (currency === '$') {
      return amount * exchangeRates.USDCNY;
    }
    return amount;
  };

  // 使用与 PortfolioTab 一致的规则：优先基于持仓+汇率计算人民币口径的总本金/总盈亏
  const hasExchangeRates = !!exchangeRates;
  const hasInvesting = investingStocks.length > 0;
  const isLoadingJar = hasInvesting && !hasExchangeRates;

  const totalInvestedCNY =
    hasInvesting && hasExchangeRates
      ? investingStocks.reduce(
          (sum, item) => sum + convertToCNY(item.cost || 0, item.symbol),
          0
        )
      : 0;

  const totalProfitCNY =
    hasInvesting && hasExchangeRates
      ? investingStocks.reduce(
          (sum, item) => sum + convertToCNY(item.profit || 0, item.symbol),
          0
        )
      : 0;

  const profitPercentage =
    totalInvestedCNY > 0 ? ((totalProfitCNY / totalInvestedCNY) * 100).toFixed(1) : '0';

  // 生成随机金币位置
  const generateCoinPositions = (count: number, startBottom: number) => {
    return Array.from({ length: count }, (_, i) => ({
      bottom: startBottom + i * 8 + Math.random() * 4,
      left: 15 + (i % 3) * 12 + Math.random() * 8,
    }));
  };

  const principalCoins = generateCoinPositions(8, 8);
  const profitCoins = generateCoinPositions(5, 8);

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
    >
      {/* 装饰性背景 */}
      <div className="absolute top-20 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-yellow-100/60 to-amber-200/60 blur-3xl" />
      <div className="absolute top-60 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-100/50 to-emerald-200/50 blur-3xl" />
      <div className="absolute bottom-40 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-100/40 to-sky-200/40 blur-3xl" />

      <div className="flex-1 overflow-y-auto pb-48 scrollbar-hide relative z-10">
        {/* A. 资产可视化区 (双罐子) */}
        <div
          className="pt-12 pb-8 px-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(254, 252, 232, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
          }}
        >
          {/* 标题 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 shadow-sm">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FDE68A 0%, #FACC15 50%, #F59E0B 100%)',
                  boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)',
                }}
              >
                <span className="text-sm">💰</span>
              </div>
              <span className="text-sm font-semibold text-gray-600">我的投资储蓄罐</span>
            </div>
          </div>

          {/* 双罐子 */}
          <div className="flex justify-center items-end gap-6">
            {/* 本金罐 */}
            <SavingsJar
              fillPercent={75}
              animate={animateCoins}
              label="本金罐"
              amount={totalInvestedCNY}
              loading={isLoadingJar}
            >
              {principalCoins.map((pos, i) => (
                <GoldCoin
                  key={`p-${i}`}
                  delay={100 + i * 60}
                  size={i % 3 === 0 ? 'lg' : i % 2 === 0 ? 'md' : 'sm'}
                  style={{ bottom: pos.bottom, left: `${pos.left}%` }}
                  animate={animateCoins}
                />
              ))}
            </SavingsJar>

            {/* 盈亏罐 */}
            <SavingsJar
              fillPercent={Math.min(Math.abs(Number(profitPercentage)) * 3 + 20, 60)}
              animate={animateCoins}
              label="盈亏罐"
              amount={totalProfitCNY}
              isProfit={totalProfitCNY >= 0}
              profitPercent={profitPercentage}
              loading={isLoadingJar}
            >
              {profitCoins.map((pos, i) => (
                <GoldCoin
                  key={`pr-${i}`}
                  delay={400 + i * 80}
                  size={i % 2 === 0 ? 'md' : 'sm'}
                  style={{ bottom: pos.bottom, left: `${pos.left}%` }}
                  animate={animateCoins}
                />
              ))}
            </SavingsJar>
          </div>

          {/* 查看组合详情按钮 */}
          <button
            onClick={() => setShowPortfolioDetail(!showPortfolioDetail)}
            className="mx-auto mt-4 flex items-center gap-1 px-4 py-2 rounded-full bg-white/80 text-sm text-gray-500 hover:bg-white transition-all"
            style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.1)' }}
          >
            {showPortfolioDetail ? '收起详情' : '查看组合详情'}
            {showPortfolioDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* 投资组合详情 */}
          {showPortfolioDetail && (
            <div className="mt-4 space-y-2 animate-fade-up">
              {investingStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/90"
                  style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden"
                      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
                    >
                      <img src={stock.logo} alt={stock.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-700 text-sm">{stock.symbol}</div>
                      <div className="text-xs text-gray-400">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-gray-700">
                      {getCurrencySymbol(stock.symbol)}{stock.config.capital ? Number(stock.config.capital).toLocaleString() : 0}
                    </div>
                    <div
                      className={`text-xs font-bold ${stock.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {stock.profit >= 0 ? '+' : ''}{getCurrencySymbol(stock.symbol)}{Math.round(stock.profit).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* B. 总体洞察区 */}
        <div className="px-5 mt-2">
          <div
            className="grow-card-solid p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            }}
          >
            {/* 装饰光斑 */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-200/30 to-amber-300/30 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-300/30 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)',
                    boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
                  }}
                >
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-700 text-lg">今日市场洞察</h3>
                  <p className="text-xs text-gray-400">基于你的投资组合分析</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-4">{DAILY_INSIGHT.summary}</p>

              <div
                className="flex gap-3 items-start p-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #DCFCE7 0%, #D1FAE5 100%)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
                    boxShadow: '0 2px 8px rgba(52, 211, 153, 0.3)',
                  }}
                >
                  <Shield size={14} className="text-white" />
                </div>
                <p className="text-xs text-green-700 leading-relaxed">{DAILY_INSIGHT.advice}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 今日心情徽章 */}
        <div className="px-5 mt-4">
          <div className="grow-card-solid p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-600">今日投资心情</span>
              <span className="text-xs text-gray-400">点击记录</span>
            </div>
            <div className="flex gap-3 justify-center">
              {[
                { emoji: '😊', label: '平静', color: 'from-green-200 to-emerald-300' },
                { emoji: '😰', label: '焦虑', color: 'from-yellow-200 to-amber-300' },
                { emoji: '🤔', label: '犹豫', color: 'from-blue-200 to-sky-300' },
                { emoji: '😤', label: '冲动', color: 'from-orange-200 to-red-300' },
                { emoji: '😌', label: '自信', color: 'from-purple-200 to-violet-300' },
              ].map((mood) => (
                <button key={mood.label} className="flex flex-col items-center gap-1 group">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mood.color} flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110 group-active:scale-95`}
                    style={{
                      boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2), inset 0 2px 4px rgba(255,255,255,0.5)',
                    }}
                  >
                    {mood.emoji}
                  </div>
                  <span className="text-xs text-gray-500">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* C. 底部对话区 */}
      <div
        className="absolute bottom-0 w-full p-5 pb-6 z-30 safe-bottom"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
        }}
      >
        {/* Quick Ask Chips */}
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(52, 211, 153, 0.3)',
            }}
          >
            <span className="text-sm">🤖</span> 默认伙伴
          </button>
          {GURUS.slice(0, 3).map((guru) => (
            <button
              key={guru.id}
              onClick={() => setMarketInput(`@${guru.name} 怎么看市场波动？`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/90 border-2 border-gray-100 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap hover:border-green-300 hover:bg-green-50/50 transition-all"
              style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.1)' }}
            >
              <span>{guru.icon}</span> 问{guru.name}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="问问伙伴怎么看市场波动..."
            value={marketInput}
            onChange={(e) => setMarketInput(e.target.value)}
            className="grow-input flex-1"
          />
          <button
            className="p-3.5 rounded-2xl transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
              boxShadow: '0 4px 12px rgba(52, 211, 153, 0.4)',
            }}
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
