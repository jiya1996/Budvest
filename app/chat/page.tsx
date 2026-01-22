'use client';

<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
=======
import { useState, useEffect, useRef, Suspense } from 'react';
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { storage } from '@/lib/storage';
import { ChatMessage, ChatResponse, UserConfig, MarketContext } from '@/lib/types';
import Card from '@/components/Card';
import BottomNav from '@/components/BottomNav';

<<<<<<< HEAD
export default function ChatPage() {
=======
function ChatPageContent() {
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const insightTriggered = useRef(false);

  const emotionColors: Record<string, string> = {
    anxious: '#f59e0b',
    panic: '#ef4444',
    angry: '#dc2626',
    greedy: '#10b981',
    calm: '#3b82f6',
  };

  const handleSend = async (messageText?: string) => {
    const config = storage.getUserConfig();
    if (!config) return;

    const userMessage = messageText || input.trim();
    if (!userMessage) return;

    // Add user message immediately
    const newUserMessage: ChatMessage = { 
      role: 'user', 
      content: userMessage,
      timestamp: Date.now(),
    };
    
    // Save to storage first
    storage.saveChatMessage(newUserMessage);
    
    // Update state
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      // Fetch market context
      const mainSymbol = config.mainSymbol || config.watchlist[0] || '';
      const [companyRes, newsRes] = await Promise.all([
        fetch(`/api/market/company?symbol=${mainSymbol}`).catch((err) => {
          console.error('Failed to fetch company data:', err);
          return null;
        }),
        fetch(`/api/market/news?symbol=${mainSymbol}&limit=5`).catch((err) => {
          console.error('Failed to fetch news data:', err);
          return null;
        }),
      ]);

      // Check for errors in market context
      if (companyRes && !companyRes.ok) {
        const errorData = await companyRes.json().catch(() => ({}));
        toast.error(errorData.error || '获取公司信息失败');
      }
      if (newsRes && !newsRes.ok) {
        const errorData = await newsRes.json().catch(() => ({}));
        toast.error(errorData.error || '获取新闻失败');
      }

      const marketContext: MarketContext = {
        company: companyRes?.ok ? await companyRes.json().catch(() => null) : null,
        news: newsRes?.ok ? (await newsRes.json()).news || [] : [],
      };

      // Get conversation history from storage (includes the just-saved message)
      const allMessages = storage.getChatMessages();
      const conversationHistory = allMessages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          userGoal: config.userGoal,
          selectedGuru: config.selectedGuru,
          watchlistSummary: config.watchlist.join(', '),
          marketContext,
          conversation: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || '请求失败，请稍后重试';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data: ChatResponse = await response.json();
      
      // Validate response data
      if (!data.reply) {
        toast.error('服务器返回数据异常');
        throw new Error('Invalid response data');
      }

      // Add assistant message with response data
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        response: data,
      };

      setMessages((prev) => {
        const final = [...prev, assistantMessage];
        storage.saveChatMessage(assistantMessage);
        return final;
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error ? error.message : '网络或配置问题，请稍后重试';
      if (!errorMsg.includes('请求失败') && !errorMsg.includes('数据异常')) {
        toast.error(errorMsg);
      }
      // Add error message as assistant message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '网络或配置问题，请稍后重试。如果问题持续，请检查 API Key 配置。',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
    // Auto send the action as next message
    handleSend(action);
  };

  const handleWriteReview = (response: ChatResponse) => {
    const config = storage.getUserConfig();
    
    // Save draft to localStorage
    if (response.review_prompt) {
      storage.setReviewDraft(response.review_prompt);
    }

    const params = new URLSearchParams();
    if (response.tags.length > 0) {
      params.set('tags', response.tags.join(','));
    }
    if (response.emotion) {
      params.set('emotion', response.emotion);
    }
    if (config?.selectedGuru) {
      params.set('guru', config.selectedGuru);
    }
    if (config?.mainSymbol) {
      params.set('symbol', config.mainSymbol);
    }

    router.push(`/review/new?${params.toString()}`);
  };

  useEffect(() => {
    const config = storage.getUserConfig();
    if (!config || !config.userGoal) {
      router.push('/onboarding');
      return;
    }

    const savedMessages = storage.getChatMessages();
    setMessages(savedMessages);

    // Check if redirected from dashboard insight button
    if (searchParams.get('action') === 'insight' && !insightTriggered.current) {
      insightTriggered.current = true;
      const insightPrompt = '请分析当前市场情绪和我的持仓表现，只陈述客观事实和数据，帮助我理解当前状况。不要给出任何操作建议（如买入、卖出、持有、观察等）。';
      setInput(insightPrompt);
      handleSend(insightPrompt).catch(console.error);
    }
  }, [router, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <>
      <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold' }}>
          投资对话
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: msg.role === 'user' ? '#2563eb' : '#f3f4f6',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  {msg.content}
                </div>
              </div>

              {/* Show emotion, suggested actions, and review button for assistant messages with response */}
              {msg.role === 'assistant' && msg.response && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Emotion badge */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: emotionColors[msg.response.emotion] || '#6b7280',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      情绪: {msg.response.emotion}
                    </span>
                  </div>

                  {/* Suggested actions */}
                  {msg.response.suggested_actions.length > 0 && (
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '500', marginBottom: '6px', color: '#6b7280' }}>
                        建议行动
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msg.response.suggested_actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => handleSuggestedAction(action)}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#f3f4f6',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              color: '#333',
                            }}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Write review button */}
                  {msg.response.review_prompt && (
                    <button
                      onClick={() => handleWriteReview(msg.response!)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      写复盘
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#f3f4f6',
                  fontSize: '14px',
                  color: '#6b7280',
                }}
              >
                思考中...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            position: 'sticky',
            bottom: '90px',
            backgroundColor: '#fff',
            padding: '12px 0',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && input.trim()) {
                  handleSend();
                }
              }}
              placeholder="输入消息..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: loading || !input.trim() ? '#9ca3af' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              发送
            </button>
          </div>
        </div>
      </div>
      <BottomNav activeTab="companion" onTabChange={(tab) => { if (tab !== 'companion') { router.push(`/?tab=${tab}`); } }} />
    </>
  );
}
<<<<<<< HEAD
=======

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-slate-200">
        <div className="text-slate-500">加载中...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
