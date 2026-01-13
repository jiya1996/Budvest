'use client';

import { useState } from 'react';
import { Search, Check, ChevronRight, Target, Sparkles, Heart, TrendingUp, Shield } from 'lucide-react';
import { Stock, StockConfig, PortfolioItem } from '@/lib/types';
import { STOCK_DATABASE, INVESTMENT_GOALS } from '@/lib/data';

interface OnboardingProps {
  onFinish: (data: { portfolio: PortfolioItem[]; totalPrincipal: number }) => void;
}

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0); // 0: 欢迎页, 1: 选股, 2: 配置, 3: 加载
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [stockConfigs, setStockConfigs] = useState<Record<string, StockConfig>>({});
  const [loadingGuru, setLoadingGuru] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = STOCK_DATABASE.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStock = (stock: Stock) => {
    if (selectedStocks.find((s) => s.symbol === stock.symbol)) {
      setSelectedStocks(selectedStocks.filter((s) => s.symbol !== stock.symbol));
      const newConfigs = { ...stockConfigs };
      delete newConfigs[stock.symbol];
      setStockConfigs(newConfigs);
    } else {
      setSelectedStocks([...selectedStocks, stock]);
      setStockConfigs({
        ...stockConfigs,
        [stock.symbol]: { status: 'investing', capital: '', goal: '长期增值' },
      });
    }
  };

  const updateConfig = (symbol: string, field: keyof StockConfig, value: string) => {
    setStockConfigs({
      ...stockConfigs,
      [symbol]: { ...stockConfigs[symbol], [field]: value },
    });
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1 && selectedStocks.length > 0) {
      setStep(2);
    } else if (step === 2) {
      setLoadingGuru(true);
      setStep(3);
      setTimeout(() => {
        const portfolio: PortfolioItem[] = selectedStocks.map((s) => ({
          ...s,
          config: stockConfigs[s.symbol],
          holdingDays: Math.floor(Math.random() * 200),
          cost: stockConfigs[s.symbol].capital
            ? Number(stockConfigs[s.symbol].capital) * (1 - (Math.random() * 0.1 - 0.05))
            : 0,
          profit: stockConfigs[s.symbol].capital
            ? Number(stockConfigs[s.symbol].capital) * (Math.random() * 0.2 - 0.1)
            : 0,
        }));
        const totalPrincipal = portfolio.reduce(
          (acc, curr) => acc + (curr.config.capital ? Number(curr.config.capital) : 0),
          0
        );
        onFinish({ portfolio, totalPrincipal });
      }, 2500);
    }
  };

  // Step 0: 欢迎页
  if (step === 0) {
    return (
      <div
        className="h-full flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
      >
        {/* 装饰性背景 */}
        <div className="absolute top-10 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-yellow-100/60 to-amber-200/60 blur-3xl" />
        <div className="absolute bottom-40 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-100/50 to-emerald-200/50 blur-3xl" />
        <div className="absolute top-1/2 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-100/40 to-violet-200/40 blur-3xl" />

        {/* 主内容 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
          {/* Logo徽章 */}
          <div className="relative mb-8 animate-float">
            <div
              className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
                boxShadow: '0 12px 40px rgba(52, 211, 153, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.4)',
              }}
            >
              <span className="text-6xl">🌱</span>
            </div>
            {/* 装饰小徽章 */}
            <div
              className="absolute -top-2 -right-2 w-12 h-12 rounded-2xl flex items-center justify-center animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #FDE68A 0%, #FACC15 100%)',
                boxShadow: '0 4px 16px rgba(250, 204, 21, 0.4)',
                animationDelay: '0.3s',
              }}
            >
              <span className="text-2xl">☀️</span>
            </div>
            <div
              className="absolute -bottom-1 -left-3 w-10 h-10 rounded-xl flex items-center justify-center animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
                boxShadow: '0 4px 12px rgba(96, 165, 250, 0.4)',
                animationDelay: '0.5s',
              }}
            >
              <span className="text-xl">💧</span>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-700 mb-3 text-center">
            欢迎来到伴投
          </h1>
          <p className="text-gray-500 text-center mb-10 leading-relaxed">
            你的投资心理陪伴伙伴<br />
            让每一次投资决策都更加理性
          </p>

          {/* 特性卡片 */}
          <div className="w-full space-y-3 mb-10">
            {[
              { icon: Heart, text: '情绪陪伴', desc: '理解你的投资焦虑', color: 'from-pink-200 to-rose-300', shadow: 'rgba(244, 114, 182, 0.3)' },
              { icon: TrendingUp, text: '理性分析', desc: '大师视角深度解读', color: 'from-green-200 to-emerald-300', shadow: 'rgba(52, 211, 153, 0.3)' },
              { icon: Shield, text: '心理守护', desc: '避免冲动决策', color: 'from-blue-200 to-sky-300', shadow: 'rgba(96, 165, 250, 0.3)' },
            ].map((item, index) => (
              <div
                key={item.text}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 animate-fade-up"
                style={{
                  animationDelay: `${index * 100}ms`,
                  boxShadow: '0 4px 16px rgba(148, 163, 184, 0.1)',
                }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                  style={{ boxShadow: `0 4px 12px ${item.shadow}` }}
                >
                  <item.icon size={22} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-700">{item.text}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-10 safe-bottom relative z-10">
          <button
            onClick={handleNext}
            className="grow-btn w-full flex items-center justify-center gap-2"
          >
            开始设置
            <ChevronRight size={20} />
          </button>
          <p className="text-center text-xs text-gray-400 mt-4">
            只需1分钟，开启你的理性投资之旅
          </p>
        </div>
      </div>
    );
  }

  // Step 3: Loading Screen
  if (step === 3 || loadingGuru) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
      >
        {/* 装饰性圆圈 */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-green-200/40 to-emerald-300/40 blur-2xl" />
        <div className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-200/40 to-amber-300/40 blur-2xl" />
        <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full bg-gradient-to-br from-blue-200/40 to-sky-300/40 blur-2xl" />

        {/* 主要内容 */}
        <div className="relative z-10">
          {/* 动画徽章 */}
          <div className="relative mb-8">
            <div
              className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 flex items-center justify-center animate-float"
              style={{
                boxShadow: '0 8px 32px rgba(250, 204, 21, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.5)',
              }}
            >
              <span className="text-5xl">☀️</span>
            </div>
            {/* 小徽章环绕 */}
            <div
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-green-300 to-emerald-400 flex items-center justify-center animate-bounce"
              style={{ animationDelay: '0.2s', boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)' }}
            >
              <span className="text-lg">🌱</span>
            </div>
            <div
              className="absolute -bottom-1 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-sky-400 flex items-center justify-center animate-bounce"
              style={{ animationDelay: '0.4s', boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)' }}
            >
              <span className="text-sm">💧</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-700 mb-3">投资智囊团入驻中...</h2>
          <p className="text-gray-500 text-sm mb-10">正在为你匹配专属投资陪伴伙伴</p>

          {/* 进度条 - Grow风格 */}
          <div className="w-64 mx-auto">
            <div className="h-3 rounded-full bg-white/60 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
                  animation: 'width 2.5s ease-in-out forwards',
                  boxShadow: '0 0 12px rgba(74, 222, 128, 0.4)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
    >
      {/* 装饰性背景 */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-green-100/50 to-emerald-200/50 blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-yellow-100/50 to-amber-200/50 blur-3xl translate-y-1/2 -translate-x-1/4" />

      {/* Header */}
      <div className="px-6 pt-12 pb-6 relative z-10">
        {/* 进度指示器 - 3步 */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                step >= s ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-white/60'
              }`}
              style={{ boxShadow: step >= s ? '0 2px 8px rgba(74, 222, 128, 0.3)' : 'none' }}
            />
          ))}
        </div>

        {/* 标题区域 */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-700">
            {step === 1 ? '添加自选关注' : '确认投资初心'}
          </h1>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed pl-[52px]">
          {step === 1
            ? '选择你关注的标的，我们将陪伴你一起成长'
            : '为每个标的设定目标，这是你面对波动时的定海神针'}
        </p>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide relative z-10">
        {step === 1 && (
          <div className="space-y-4 animate-fade-up">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索股票代码或名称"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="grow-input pl-12"
              />
            </div>

            {/* 已选择计数 */}
            {selectedStocks.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
                    color: '#166534',
                  }}
                >
                  已选 {selectedStocks.length} 个
                </div>
              </div>
            )}

            {/* 股票列表 */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">热门推荐</p>
              {filteredStocks.map((stock, index) => {
                const isSelected = selectedStocks.find((s) => s.symbol === stock.symbol);
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => toggleStock(stock)}
                    className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all duration-300 animate-fade-up ${
                      isSelected
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400'
                        : 'bg-white/80 border-2 border-transparent hover:bg-white'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      boxShadow: isSelected
                        ? '0 4px 20px rgba(74, 222, 128, 0.2)'
                        : '0 2px 12px rgba(148, 163, 184, 0.1)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 p-2 flex items-center justify-center overflow-hidden"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                      >
                        <img src={stock.logo} alt={stock.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-700 text-base">{stock.symbol}</div>
                        <div className="text-xs text-gray-400">{stock.name}</div>
                      </div>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gray-100'
                      }`}
                      style={{ boxShadow: isSelected ? '0 2px 8px rgba(74, 222, 128, 0.3)' : 'none' }}
                    >
                      {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {selectedStocks.map((stock, index) => (
              <div
                key={stock.symbol}
                className="grow-card-solid p-5 animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* 股票头部 */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                  <div
                    className="w-10 h-10 rounded-xl bg-white border border-gray-100 p-1.5 flex items-center justify-center"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <img src={stock.logo} alt={stock.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="font-bold text-lg text-gray-700">{stock.symbol}</span>
                    <span className="text-xs text-gray-400 ml-2">{stock.name}</span>
                  </div>
                </div>

                {/* 状态选择 */}
                <div className="mb-5">
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-3 block tracking-wider">
                    当前状态
                  </label>
                  <div className="flex bg-gray-100 p-1.5 rounded-full">
                    {(['investing', 'watching'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateConfig(stock.symbol, 'status', status)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                          stockConfigs[stock.symbol]?.status === status
                            ? 'bg-white text-gray-700 shadow-md'
                            : 'text-gray-400'
                        }`}
                      >
                        {status === 'investing' ? '🎯 投资中' : '👀 观望中'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 配置项 */}
                {stockConfigs[stock.symbol]?.status === 'investing' ? (
                  <div className="space-y-4">
                    {/* 本金输入 */}
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block tracking-wider">
                        计划投入本金
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
                        <input
                          type="number"
                          value={stockConfigs[stock.symbol]?.capital || ''}
                          onChange={(e) => updateConfig(stock.symbol, 'capital', e.target.value)}
                          className="grow-input pl-9 font-mono"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* 投资目标 */}
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block tracking-wider">
                        投资目标
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {INVESTMENT_GOALS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => updateConfig(stock.symbol, 'goal', opt)}
                            className={`py-3 px-3 text-sm rounded-2xl transition-all duration-300 ${
                              stockConfigs[stock.symbol]?.goal === opt
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 text-green-700 font-semibold'
                                : 'bg-gray-50 border-2 border-transparent text-gray-500'
                            }`}
                            style={{
                              boxShadow:
                                stockConfigs[stock.symbol]?.goal === opt
                                  ? '0 2px 12px rgba(74, 222, 128, 0.15)'
                                  : 'none',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-start p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100">
                    <div
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center flex-shrink-0"
                      style={{ boxShadow: '0 2px 8px rgba(96, 165, 250, 0.3)' }}
                    >
                      <Target size={16} className="text-white" />
                    </div>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      观望模式下，我们重点分析该标的的情绪波动与市场热度，不计算盈亏，不占用心理本金。
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div
        className="absolute bottom-0 left-0 right-0 p-6 z-20 safe-bottom"
        style={{ background: 'linear-gradient(to top, rgba(248, 250, 252, 1) 60%, rgba(248, 250, 252, 0))' }}
      >
        <button
          onClick={handleNext}
          disabled={step === 1 && selectedStocks.length === 0}
          className="grow-btn w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none"
        >
          {step === 1 ? (
            <>
              下一步
              <ChevronRight size={20} />
            </>
          ) : (
            <>
              <Sparkles size={18} />
              开始投资之旅
            </>
          )}
        </button>
      </div>
    </div>
  );
}
