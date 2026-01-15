'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { UserConfig, Guru } from '@/lib/types';
import Card from '@/components/Card';

export default function OnboardingPage() {
  const router = useRouter();
  const [userGoal, setUserGoal] = useState('长期持有');
  const [customGoal, setCustomGoal] = useState('');
  const [selectedGuru, setSelectedGuru] = useState<Guru>('coach');
  const [watchlist, setWatchlist] = useState<string[]>(['TSLA', 'AAPL']);
  const [newTicker, setNewTicker] = useState('');

  const goalOptions = [
    '长期持有',
    '短期套利',
    '价值投资',
    '成长投资',
    '稳健收益',
    '其他'
  ];

  useEffect(() => {
    const config = storage.getUserConfig();
    if (config) {
      if (config.userGoal) {
        // 检查是否是预设选项
        if (goalOptions.slice(0, 5).includes(config.userGoal)) {
          setUserGoal(config.userGoal);
        } else {
          setUserGoal('其他');
          setCustomGoal(config.userGoal);
        }
      }
      setSelectedGuru(config.selectedGuru || 'coach');
      setWatchlist(config.watchlist || []);
    }
  }, []);

  const handleAddTicker = () => {
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker]);
      setNewTicker('');
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    setWatchlist(watchlist.filter((t) => t !== ticker));
  };

  const handleSubmit = () => {
    const finalGoal = userGoal === '其他' ? customGoal.trim() : userGoal;

    if (!finalGoal || watchlist.length === 0) {
      alert('请选择投资目标并添加至少一支股票');
      return;
    }

    const config: UserConfig = {
      userGoal: finalGoal,
      selectedGuru: selectedGuru,
      watchlist: watchlist,
      mainSymbol: watchlist[0] || '',
      portfolio: [],
      totalPrincipal: 0,
      hasOnboarded: true,
    };

    storage.saveUserConfig(config);
    router.push('/dashboard');
  };

  const gurus: { value: Guru; label: string; desc: string }[] = [
    { value: 'buffett', label: '巴菲特', desc: '价值投资，长期持有' },
    { value: 'dalio', label: '达利欧', desc: '资产配置，风险分散' },
    { value: 'coach', label: '教练', desc: '理性分析，情绪管理' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold' }}>
        欢迎使用 Investbuddy
      </h1>

      <Card>
        <label
          style={{
            display: 'block',
            marginBottom: '16px',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          你的投资目标
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {goalOptions.map((goal) => (
            <label
              key={goal}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: userGoal === goal ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="goal"
                value={goal}
                checked={userGoal === goal}
                onChange={(e) => setUserGoal(e.target.value)}
                style={{ marginRight: '12px' }}
              />
              <div style={{ fontWeight: '500' }}>{goal}</div>
            </label>
          ))}
        </div>
        {userGoal === '其他' && (
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="请输入您的投资目标"
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        )}
      </Card>

      <Card>
        <label
          style={{
            display: 'block',
            marginBottom: '16px',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          选择你的投资导师
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {gurus.map((guru) => (
            <label
              key={guru.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: selectedGuru === guru.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="guru"
                value={guru.value}
                checked={selectedGuru === guru.value}
                onChange={(e) => setSelectedGuru(e.target.value as Guru)}
                style={{ marginRight: '12px' }}
              />
              <div>
                <div style={{ fontWeight: '500' }}>{guru.label}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{guru.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          自选股列表
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            placeholder="输入股票代码，如 TSLA"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTicker()}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {watchlist.map((ticker) => (
            <div
              key={ticker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '20px',
                fontSize: '14px',
              }}
            >
              <span>{ticker}</span>
              <button
                onClick={() => handleRemoveTicker(ticker)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: 0,
                  width: '20px',
                  height: '20px',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </Card>

      <button
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          marginTop: '24px',
        }}
      >
        开始使用
      </button>
    </div>
  );
}
