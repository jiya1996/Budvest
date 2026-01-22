'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { ReviewEntry, Guru } from '@/lib/types';

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    // Priority 1: Read from localStorage draft
    const draft = storage.getReviewDraft();
    if (draft) {
      setContent(draft);
    } else {
      // Priority 2: Read from URL draft parameter (if exists)
      const urlDraft = searchParams.get('draft');
      if (urlDraft) {
        setContent(urlDraft);
      } else {
        // Priority 3: Read from URL prompt parameter (for backward compatibility)
        const prompt = searchParams.get('prompt');
        if (prompt) {
          setContent(prompt);
        }
      }
    }

    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      setTags(tagsParam.split(',').filter(Boolean));
    }
  }, [searchParams]);

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!content.trim()) {
      alert('请输入复盘内容');
      return;
    }

    const config = storage.getUserConfig();
    const emotion = searchParams.get('emotion');
    const guru = searchParams.get('guru') as Guru | null;
    const symbol = searchParams.get('symbol') || config?.mainSymbol;

    const review: ReviewEntry = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      content: content.trim(),
      tags: tags,
      ...(emotion && { emotion }),
      ...(guru && { guru }),
      ...(symbol && { symbol }),
    };

    storage.saveReview(review);
    storage.clearReviewDraft();
    router.push('/review');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold' }}>
        写复盘
      </h1>

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          复盘内容
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录你的投资思考和情绪..."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          标签
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="添加标签"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleAddTag}
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
          {tags.map((tag) => (
            <div
              key={tag}
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
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
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
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#f3f4f6',
            color: '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          保存
        </button>
      </div>
    </div>
  );
}
