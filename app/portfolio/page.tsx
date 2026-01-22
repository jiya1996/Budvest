'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { UserConfig } from '@/lib/types';
import Card from '@/components/Card';
import BottomNav from '@/components/BottomNav';

export default function PortfolioPage() {
  const router = useRouter();
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [newTicker, setNewTicker] = useState('');

  useEffect(() => {
    const userConfig = storage.getUserConfig();
    if (!userConfig || !userConfig.userGoal) {
      router.push('/onboarding');
      return;
    }
    setConfig(userConfig);
  }, [router]);

  const handleAddTicker = () => {
    if (!config) return;
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !config.watchlist.includes(ticker)) {
      const updatedConfig = { ...config, watchlist: [...config.watchlist, ticker] };
      storage.saveUserConfig(updatedConfig);
      setConfig(updatedConfig);
      setNewTicker('');
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    if (!config) return;
    const updatedConfig = {
      ...config,
      watchlist: config.watchlist.filter((t) => t !== ticker),
      mainSymbol: config.mainSymbol === ticker ? config.watchlist[1] || '' : config.mainSymbol,
    };
    storage.saveUserConfig(updatedConfig);
    setConfig(updatedConfig);
  };

  const handleSetMainSymbol = (ticker: string) => {
    if (!config) return;
    const updatedConfig = { ...config, mainSymbol: ticker };
    storage.saveUserConfig(updatedConfig);
    setConfig(updatedConfig);
  };

  if (!config) {
    return (
      <>
<<<<<<< HEAD
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p>加载中...</p>
        </div>
        <BottomNav />
=======
        {/* 外层容器：限制宽度为手机屏幕宽度 */}
        <div className="flex justify-center items-center min-h-screen bg-slate-200 font-sans">
          <div className="w-full max-w-md h-[100dvh] md:h-[844px] bg-slate-50 shadow-2xl md:rounded-[40px] overflow-hidden md:border-[8px] md:border-slate-800 relative flex flex-col">
            <div style={{ padding: '40px 20px', textAlign: 'center', flex: 1, overflowY: 'auto' }}>
              <p>加载中...</p>
            </div>
            <BottomNav />
          </div>
        </div>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
      </>
    );
  }

  return (
    <>
<<<<<<< HEAD
      <div style={{ padding: '20px', paddingBottom: '100px' }}>
=======
      {/* 外层容器：限制宽度为手机屏幕宽度 */}
      <div className="flex justify-center items-center min-h-screen bg-slate-200 font-sans">
        <div className="w-full max-w-md h-[100dvh] md:h-[844px] bg-slate-50 shadow-2xl md:rounded-[40px] overflow-hidden md:border-[8px] md:border-slate-800 relative flex flex-col">
          {/* 内容区域 */}
          <div style={{ padding: '20px', paddingBottom: '100px', flex: 1, overflowY: 'auto' }}>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
        <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold' }}>
          投资组合
        </h1>

        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            自选股列表
          </h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTicker()}
              placeholder="输入股票代码，如 TSLA"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleAddTicker}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              添加
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {config.watchlist.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
                暂无自选股
              </p>
            ) : (
              config.watchlist.map((ticker) => (
                <div
                  key={ticker}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: config.mainSymbol === ticker ? '#eff6ff' : '#f9fafb',
                    borderRadius: '8px',
                    border: config.mainSymbol === ticker ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>{ticker}</span>
                    {config.mainSymbol === ticker && (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        主股票
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {config.mainSymbol !== ticker && (
                      <button
                        onClick={() => handleSetMainSymbol(ticker)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#333',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        设为主股票
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveTicker(ticker)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            用户设置
          </h2>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              投资目标
            </p>
            <p style={{ fontSize: '14px' }}>{config.userGoal}</p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              投资导师
            </p>
            <p style={{ fontSize: '14px' }}>
              {config.selectedGuru === 'buffett' ? '巴菲特' : config.selectedGuru === 'dalio' ? '达利欧' : '教练'}
            </p>
          </div>
        </Card>
<<<<<<< HEAD
      </div>
      <BottomNav />
=======
          </div>
          
          {/* Bottom Navigation */}
          <BottomNav />
        </div>
      </div>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
    </>
  );
}
