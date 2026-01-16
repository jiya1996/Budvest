'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { CompanyProfile, NewsItem } from '@/lib/types';
import Card from '@/components/Card';
import BottomNav from '@/components/BottomNav';

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainSymbol, setMainSymbol] = useState('');

  useEffect(() => {
    const config = storage.getUserConfig();
    if (!config || !config.userGoal) {
      router.push('/onboarding');
      return;
    }
    setMainSymbol(config.mainSymbol || config.watchlist[0] || '');
  }, [router]);

  useEffect(() => {
    if (!mainSymbol) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [companyRes, newsRes] = await Promise.all([
          fetch(`/api/market/company?symbol=${mainSymbol}`),
          fetch(`/api/market/news?symbol=${mainSymbol}&limit=10`),
        ]);

        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompany(companyData);
        }

        if (newsRes.ok) {
          const newsData = await newsRes.json();
          setNews(newsData.news || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mainSymbol]);

  const handleGenerateInsight = () => {
    router.push('/chat?action=insight');
  };

  if (loading) {
    return (
      <>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p>加载中...</p>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold' }}>
          仪表板
        </h1>

        {company && (
          <Card>
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                {company.companyName} ({company.symbol})
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>{company.industry}</p>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                市值
              </p>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>
                ${(company.marketCap / 1e9).toFixed(2)}B
              </p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                简介
              </p>
              <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {company.description.substring(0, 200)}
                {company.description.length > 200 ? '...' : ''}
              </p>
            </div>
          </Card>
        )}

        <Card>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            最近新闻
          </h2>
          {news.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>暂无新闻</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {news.map((item, index) => (
                <div
                  key={index}
                  style={{
                    paddingBottom: index < news.length - 1 ? '12px' : '0',
                    borderBottom: index < news.length - 1 ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{item.title}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    {new Date(item.publishedDate).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <button
          onClick={handleGenerateInsight}
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
            marginTop: '16px',
          }}
        >
          生成今日洞察
        </button>
      </div>
      <BottomNav />
    </>
  );
}
