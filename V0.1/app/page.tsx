'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { storage } from '@/lib/storage';
import { PortfolioItem, UserConfig } from '@/lib/types';
import Onboarding from '@/components/Onboarding';
import BottomNav from '@/components/BottomNav';
import MarketTab from '@/components/MarketTab';
import CompanionTab from '@/components/CompanionTab';
import PortfolioTab from '@/components/PortfolioTab';
import ProfileTab from '@/components/ProfileTab';

type TabType = 'market' | 'companion' | 'portfolio' | 'profile';

export default function Home() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [animateCoins, setAnimateCoins] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User Data
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    const config = storage.getUserConfig();
    if (config && config.hasOnboarded && config.portfolio && config.portfolio.length > 0) {
      setPortfolio(config.portfolio);
      setTotalPrincipal(config.totalPrincipal);
      // 计算总盈亏
      const profit = config.portfolio.reduce((acc, item) => acc + (item.profit || 0), 0);
      setTotalProfit(profit);
      setHasOnboarded(true);
      setTimeout(() => setAnimateCoins(true), 500);
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingFinish = (data: { portfolio: PortfolioItem[]; totalPrincipal: number }) => {
    const config: UserConfig = {
      userGoal: '',
      selectedGuru: 'coach',
      watchlist: data.portfolio.map((p) => p.symbol),
      mainSymbol: data.portfolio[0]?.symbol || '',
      portfolio: data.portfolio,
      totalPrincipal: data.totalPrincipal,
      hasOnboarded: true,
    };
    storage.saveUserConfig(config);

    setPortfolio(data.portfolio);
    setTotalPrincipal(data.totalPrincipal);
    const profit = data.portfolio.reduce((acc, item) => acc + (item.profit || 0), 0);
    setTotalProfit(profit);
    setHasOnboarded(true);
    setTimeout(() => setAnimateCoins(true), 500);
  };

  const handleResetOnboarding = () => {
    storage.clearAll();
    setHasOnboarded(false);
    setPortfolio([]);
    setTotalPrincipal(0);
    setTotalProfit(0);
    setAnimateCoins(false);
    setActiveTab('market');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'market':
        return (
          <MarketTab
            portfolio={portfolio}
            totalPrincipal={totalPrincipal}
            totalProfit={totalProfit}
            animateCoins={animateCoins}
          />
        );
      case 'companion':
        return <CompanionTab />;
      case 'portfolio':
        return <PortfolioTab portfolio={portfolio} />;
      case 'profile':
        return <ProfileTab onResetOnboarding={handleResetOnboarding} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-200">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-200 font-sans">
      <div className="w-full max-w-md h-[100dvh] md:h-[844px] bg-slate-50 shadow-2xl md:rounded-[40px] overflow-hidden md:border-[8px] md:border-slate-800 relative flex flex-col">
        {/* Status Bar (仅桌面模拟) */}
        <div className="hidden md:flex h-12 w-full justify-between items-center px-6 pt-2 z-50 bg-white/80 backdrop-blur-sm sticky top-0">
          <span className="text-sm font-semibold text-slate-900">9:41</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-4 rounded-full border border-slate-800 opacity-40"></div>
            <div className="w-6 h-4 rounded-[4px] border border-slate-800 bg-slate-800/80"></div>
          </div>
        </div>

        {/* Content */}
        {!hasOnboarded ? (
          <Onboarding onFinish={handleOnboardingFinish} />
        ) : (
          <>
            {/* Header */}
            <header className="px-6 py-3 bg-white/80 backdrop-blur-sm z-40 flex justify-between items-center border-b border-slate-50">
              <div>
                <h1 className="text-xl font-bold text-slate-800">伴投</h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  心理资本：¥{Math.round(totalPrincipal * 1.2).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <User size={16} className="text-slate-500" />
              </button>
            </header>

            <main className="flex-1 overflow-hidden relative bg-slate-50">{renderTab()}</main>

            {/* Nav Bar */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Home Indicator (仅桌面模拟) */}
            <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full opacity-20 z-50"></div>
          </>
        )}
      </div>
    </div>
  );
}
