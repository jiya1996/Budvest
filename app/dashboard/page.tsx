'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { storage } from '@/lib/storage';
import { CompanyProfile, NewsItem } from '@/lib/types';
import { MarketSentimentAnalysis } from '@/lib/market-sentiment-analyzer';
import Card from '@/components/Card';
import BottomNav from '@/components/BottomNav';

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainSymbol, setMainSymbol] = useState('');
  const [marketSentiment, setMarketSentiment] = useState<MarketSentimentAnalysis | null>(null);
  const [userConfig, setUserConfig] = useState<any>(null);

  useEffect(() => {
    const config = storage.getUserConfig();
    if (!config || !config.userGoal) {
      router.push('/onboarding');
      return;
    }
    setUserConfig(config);
    setMainSymbol(config.mainSymbol || config.watchlist[0] || '');
  }, [router]);

  useEffect(() => {
    if (!mainSymbol) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [companyRes, newsRes, sentimentRes] = await Promise.all([
          fetch(`/api/market/company?symbol=${mainSymbol}`),
          fetch(`/api/market/news?symbol=${mainSymbol}&limit=10`),
          fetch('/api/market/sentiment'),
        ]);

        if (companyRes.ok) {
          try {
            const companyData = await companyRes.json();
            if (companyData.error) {
              toast.error(companyData.error);
            } else {
              setCompany(companyData);
            }
          } catch (parseError) {
            toast.error('解析公司数据失败');
            console.error('Failed to parse company data:', parseError);
          }
        } else {
          const errorData = await companyRes.json().catch(() => ({}));
          toast.error(errorData.error || '获取公司信息失败');
        }

        if (newsRes.ok) {
          try {
            const newsData = await newsRes.json();
            if (newsData.error) {
              toast.error(newsData.error);
            } else {
              setNews(newsData.news || []);
            }
          } catch (parseError) {
            toast.error('解析新闻数据失败');
            console.error('Failed to parse news data:', parseError);
          }
        } else {
          const errorData = await newsRes.json().catch(() => ({}));
          toast.error(errorData.error || '获取新闻失败');
        }

        if (sentimentRes.ok) {
          try {
            const sentimentData = await sentimentRes.json();
            if (sentimentData.success && sentimentData.data) {
              setMarketSentiment(sentimentData.data);
            }
          } catch (parseError) {
            console.error('Failed to parse sentiment data:', parseError);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('网络请求失败，请检查网络连接');
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

        {/* 本金盈亏卡片（存钱罐） */}
        {userConfig && (
          <Card>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              💰 投资概览
            </h2>
            {(() => {
              const portfolio = userConfig.portfolio || [];
              const totalPrincipal = userConfig.totalPrincipal || 0;
              const totalValue = portfolio.reduce((sum: number, item: any) => {
                const shares = item.config?.shares || 0;
                const price = item.price || 0;
                return sum + (shares * price);
              }, 0);
              const totalProfit = totalValue - totalPrincipal;
              const profitRate = totalPrincipal > 0 ? (totalProfit / totalPrincipal) * 100 : 0;

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>总本金</p>
                      <p style={{ fontSize: '20px', fontWeight: '600' }}>¥{totalPrincipal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>总市值</p>
                      <p style={{ fontSize: '20px', fontWeight: '600' }}>¥{totalValue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: totalProfit >= 0 ? '#dcfce7' : '#fee2e2'
                  }}>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      {totalProfit >= 0 ? '累计收益' : '累计亏损'}
                    </p>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: totalProfit >= 0 ? '#16a34a' : '#dc2626'
                    }}>
                      {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toFixed(2)}
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: totalProfit >= 0 ? '#16a34a' : '#dc2626'
                    }}>
                      {totalProfit >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
                    </p>
                  </div>
                </>
              );
            })()}
          </Card>
        )}

        {marketSentiment && (
          <Card>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {marketSentiment.description.title}
            </h2>
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor:
                  marketSentiment.signal === 'bullish'
                    ? '#dcfce7'
                    : marketSentiment.signal === 'bearish'
                    ? '#fee2e2'
                    : '#f3f4f6',
                marginBottom: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color:
                    marketSentiment.signal === 'bullish'
                      ? '#16a34a'
                      : marketSentiment.signal === 'bearish'
                      ? '#dc2626'
                      : '#6b7280',
                }}
              >
                {marketSentiment.description.summary}
              </p>
            </div>
            {marketSentiment.description.keyFactors.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  关键因素：
                </p>
                <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
                  {marketSentiment.description.keyFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              信心度: {marketSentiment.confidence}%
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
