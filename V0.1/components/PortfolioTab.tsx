'use client';

import { PortfolioItem } from '@/lib/types';
import { TrendingUp, TrendingDown, Target, Eye, Wallet } from 'lucide-react';

interface PortfolioTabProps {
  portfolio: PortfolioItem[];
}

export default function PortfolioTab({ portfolio }: PortfolioTabProps) {
  const investingItems = portfolio.filter((item) => item.config.status === 'investing');
  const watchingItems = portfolio.filter((item) => item.config.status === 'watching');

  const totalInvested = investingItems.reduce(
    (sum, item) => sum + (item.config.capital ? Number(item.config.capital) : 0),
    0
  );
  const totalProfit = investingItems.reduce((sum, item) => sum + (item.profit || 0), 0);

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
    >
      {/* 装饰性背景 */}
      <div className="absolute top-10 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-100/50 to-emerald-200/50 blur-3xl" />
      <div className="absolute bottom-60 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-blue-100/50 to-sky-200/50 blur-3xl" />

      {/* Header */}
      <div className="px-6 pt-12 pb-4 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
              boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
            }}
          >
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-700">资产明细</h2>
            <p className="text-xs text-gray-400">你的投资组合与自选股</p>
          </div>
        </div>

        {/* 汇总卡片 */}
        {portfolio.length > 0 && (
          <div
            className="grow-card-solid p-4 flex justify-between items-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            }}
          >
            <div>
              <div className="text-xs text-gray-400 mb-1">总投入本金</div>
              <div className="text-xl font-bold text-gray-700 font-mono">¥{totalInvested.toLocaleString()}</div>
            </div>
            <div className="h-10 w-px bg-gray-100" />
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">总盈亏</div>
              <div className={`text-xl font-bold font-mono ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {totalProfit >= 0 ? '+' : ''}¥{Math.abs(totalProfit).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide relative z-10">
        {portfolio.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
                boxShadow: '0 4px 20px rgba(148, 163, 184, 0.2)',
              }}
            >
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-gray-500 text-sm mb-1">暂无持仓数据</p>
            <p className="text-gray-400 text-xs">完成引导后即可查看</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 投资中 */}
            {investingItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)',
                      boxShadow: '0 2px 6px rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    <Target size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    投资中 ({investingItems.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {investingItems.map((item, index) => (
                    <div
                      key={item.symbol}
                      className="grow-card-solid p-5 animate-fade-up"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* 头部信息 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white p-2 overflow-hidden"
                            style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.15)' }}
                          >
                            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-700 text-base">{item.symbol}</div>
                            <div className="text-xs text-gray-400">
                              {item.name} · 持有 {item.holdingDays || 0} 天
                            </div>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{
                            background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                            color: '#1D4ED8',
                          }}
                        >
                          {item.config.goal}
                        </div>
                      </div>

                      {/* 价格与盈亏 */}
                      <div
                        className="grid grid-cols-2 gap-4 p-4 rounded-2xl mb-3"
                        style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}
                      >
                        <div>
                          <div className="text-xs text-gray-400 mb-1">最新价</div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-lg font-bold text-gray-700">
                              ${item.price.toFixed(2)}
                            </span>
                            <span
                              className={`text-xs font-bold flex items-center gap-0.5 ${
                                item.dayChg >= 0 ? 'text-green-600' : 'text-red-500'
                              }`}
                            >
                              {item.dayChg >= 0 ? (
                                <TrendingUp size={12} />
                              ) : (
                                <TrendingDown size={12} />
                              )}
                              {item.dayChg >= 0 ? '+' : ''}
                              {item.dayChg}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right border-l border-gray-200 pl-4">
                          <div className="text-xs text-gray-400 mb-1">总盈亏</div>
                          <div
                            className={`text-lg font-bold font-mono ${
                              item.profit >= 0 ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {item.profit >= 0 ? '+' : ''}¥{Math.abs(Math.round(item.profit)).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* 本金进度 */}
                      {item.config.capital && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">计划本金</span>
                          <span className="font-mono font-bold text-gray-600">
                            ¥{Number(item.config.capital).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 观望中 */}
            {watchingItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
                      boxShadow: '0 2px 6px rgba(96, 165, 250, 0.3)',
                    }}
                  >
                    <Eye size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    观望中 ({watchingItems.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {watchingItems.map((item, index) => (
                    <div
                      key={item.symbol}
                      className="grow-card-solid p-4 animate-fade-up"
                      style={{ animationDelay: `${(investingItems.length + index) * 80}ms` }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white p-1.5 overflow-hidden"
                            style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.15)' }}
                          >
                            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-700 text-sm">{item.symbol}</div>
                            <div className="text-xs text-gray-400">{item.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-bold text-gray-700">
                            ${item.price.toFixed(2)}
                          </div>
                          <div
                            className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                              item.dayChg >= 0 ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {item.dayChg >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {item.dayChg >= 0 ? '+' : ''}
                            {item.dayChg}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
