'use client';

import { useState, useEffect } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';
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

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [animateCoins, setAnimateCoins] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User Data
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const loadPortfolioData = () => {
    const config = storage.getUserConfig();
    if (config && config.hasOnboarded && config.portfolio && config.portfolio.length > 0) {
      setPortfolio(config.portfolio);
      
      // 如果还没有注册时间，设置为当前时间（兼容旧数据）
      if (!config.firstLoginTimestamp) {
        config.firstLoginTimestamp = Date.now();
        storage.saveUserConfig(config);
      }
      
      // 实时计算总投入本金，确保数据一致性
      const investingItems = config.portfolio.filter((item) => item.config.status === 'investing');
      const calculatedPrincipal = investingItems.reduce(
        (sum, item) => sum + (item.config.capital ? Number(item.config.capital) : 0),
        0
      );
      // 使用实时计算的值，如果为空则使用存储的值
      setTotalPrincipal(calculatedPrincipal > 0 ? calculatedPrincipal : config.totalPrincipal);
      
      // 计算总盈亏（只计算持有中的股票）
      const profit = investingItems.reduce((acc, item) => acc + (item.profit || 0), 0);
      setTotalProfit(profit);
      setHasOnboarded(true);
      setTimeout(() => setAnimateCoins(true), 500);
    } else if (config && config.hasOnboarded) {
      // 如果还没有注册时间，设置为当前时间（兼容旧数据）
      if (!config.firstLoginTimestamp) {
        config.firstLoginTimestamp = Date.now();
        storage.saveUserConfig(config);
      }
      setHasOnboarded(true);
    }
  };

  useEffect(() => {
    loadPortfolioData();
    setIsLoading(false);
  }, []);

  // 当从管理页面返回时，重新加载数据并切换到portfolio tab
  useEffect(() => {
    if (pathname === '/') {
      loadPortfolioData();
      // 检查URL参数，如果指定了tab，则切换到对应的tab
      const tabParam = searchParams.get('tab');
      if (tabParam && ['market', 'companion', 'portfolio', 'profile'].includes(tabParam)) {
        setActiveTab(tabParam as TabType);
      }
    }
  }, [pathname, searchParams]);

  const handleOnboardingFinish = async (data: { portfolio: PortfolioItem[]; totalPrincipal: number }) => {
    try {
      // 调用后端初始化API，在后端计算并保存数据
      const existingConfig = storage.getUserConfig();
      const firstLoginTimestamp = existingConfig?.firstLoginTimestamp || Date.now();

      const response = await fetch('/api/portfolio/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio: data.portfolio,
          firstLoginTimestamp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to initialize portfolio:', errorData);
        // 如果后端失败，仍然保存到 localStorage（降级处理）
        const config: UserConfig = {
          userGoal: '',
          selectedGuru: 'coach',
          watchlist: data.portfolio.map((p) => p.symbol),
          mainSymbol: data.portfolio[0]?.symbol || '',
          portfolio: data.portfolio,
          totalPrincipal: data.totalPrincipal,
          hasOnboarded: true,
          firstLoginTimestamp,
        };
        storage.saveUserConfig(config);
        setPortfolio(data.portfolio);
        setTotalPrincipal(data.totalPrincipal);
        const profit = data.portfolio.reduce((acc, item) => acc + (item.profit || 0), 0);
        setTotalProfit(profit);
        setHasOnboarded(true);
        setTimeout(() => setAnimateCoins(true), 500);
        return;
      }

      // 使用后端计算并返回的数据
      const backendData = await response.json();
      const processedPortfolio = backendData.portfolio || data.portfolio;
      const calculatedTotalPrincipal = backendData.totalPrincipal || data.totalPrincipal;
      const calculatedTotalProfit = backendData.totalProfit || 0;
      const finalFirstLoginTimestamp = backendData.firstLoginTimestamp || firstLoginTimestamp;

      // 保存到 localStorage（作为前端缓存）
      const config: UserConfig = {
        userGoal: '',
        selectedGuru: 'coach',
        watchlist: processedPortfolio.map((p: PortfolioItem) => p.symbol),
        mainSymbol: processedPortfolio[0]?.symbol || '',
        portfolio: processedPortfolio,
        totalPrincipal: calculatedTotalPrincipal,
        hasOnboarded: true,
        firstLoginTimestamp: finalFirstLoginTimestamp,
      };
      storage.saveUserConfig(config);

      // 更新前端状态
      setPortfolio(processedPortfolio);
      setTotalPrincipal(calculatedTotalPrincipal);
      setTotalProfit(calculatedTotalProfit);
      setHasOnboarded(true);
      setTimeout(() => setAnimateCoins(true), 500);
    } catch (error) {
      console.error('Error initializing portfolio:', error);
      // 如果出错，仍然保存到 localStorage（降级处理）
      const existingConfig = storage.getUserConfig();
      const config: UserConfig = {
        userGoal: '',
        selectedGuru: 'coach',
        watchlist: data.portfolio.map((p) => p.symbol),
        mainSymbol: data.portfolio[0]?.symbol || '',
        portfolio: data.portfolio,
        totalPrincipal: data.totalPrincipal,
        hasOnboarded: true,
        firstLoginTimestamp: existingConfig?.firstLoginTimestamp || Date.now(),
      };
      storage.saveUserConfig(config);
      setPortfolio(data.portfolio);
      setTotalPrincipal(data.totalPrincipal);
      const profit = data.portfolio.reduce((acc, item) => acc + (item.profit || 0), 0);
      setTotalProfit(profit);
      setHasOnboarded(true);
      setTimeout(() => setAnimateCoins(true), 500);
    }
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
        return (
          <PortfolioTab
            portfolio={portfolio}
            onPortfolioUpdate={(newPortfolio) => {
              setPortfolio(newPortfolio);
              // 更新总投入本金和总盈亏（只计算持有中的股票）
              const investingItems = newPortfolio.filter((item) => item.config.status === 'investing');
              const calculatedPrincipal = investingItems.reduce(
                (sum, item) => sum + (item.config.capital ? Number(item.config.capital) : 0),
                0
              );
              setTotalPrincipal(calculatedPrincipal);
              // 更新总盈亏
              const profit = investingItems.reduce((acc, item) => acc + (item.profit || 0), 0);
              setTotalProfit(profit);
            }}
          />
        );
            case 'profile':
              return (
                <ProfileTab 
                  onResetOnboarding={handleResetOnboarding} 
                  portfolio={portfolio}
                  totalPrincipal={totalPrincipal}
                  totalProfit={totalProfit}
                />
              );
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

