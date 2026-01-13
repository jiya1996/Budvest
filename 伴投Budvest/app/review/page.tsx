'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { ReviewEntry } from '@/lib/types';
import Card from '@/components/Card';
import BottomNav from '@/components/BottomNav';

export default function ReviewPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

  useEffect(() => {
    const savedReviews = storage.getReviews();
    setReviews(savedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条复盘吗？')) {
      storage.deleteReview(id);
      const updatedReviews = storage.getReviews();
      setReviews(updatedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  return (
    <>
      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>复盘记录</h1>
          <Link
            href="/review/new"
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            + 新增
          </Link>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', padding: '40px 0' }}>
              暂无复盘记录
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((review) => (
              <Card key={review.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(review.createdAt).toLocaleString('zh-CN')}
                    </p>
                    {(review.emotion || review.guru || review.symbol) && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {review.emotion && (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            情绪: {review.emotion}
                          </span>
                        )}
                        {review.guru && (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            导师: {review.guru === 'buffett' ? '巴菲特' : review.guru === 'dalio' ? '达利欧' : '教练'}
                          </span>
                        )}
                        {review.symbol && (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            股票: {review.symbol}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(review.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    删除
                  </button>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                  {review.content}
                </p>
                {review.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {review.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#374151',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
