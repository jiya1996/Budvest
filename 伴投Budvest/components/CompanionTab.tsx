'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, X, Send, Sparkles } from 'lucide-react';
import { GuruInfo, ChatMessage, ChatResponse } from '@/lib/types';
import { GURUS } from '@/lib/data';
import { storage } from '@/lib/storage';

export default function CompanionTab() {
  const [selectedGuru, setSelectedGuru] = useState<GuruInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedGuru) {
      const savedMessages = storage.getGuruChatMessages(selectedGuru.id);
      setMessages(savedMessages);
    }
  }, [selectedGuru]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedGuru || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    storage.saveGuruChatMessage(selectedGuru.id, userMessage);
    setInput('');
    setLoading(true);

    try {
      const config = storage.getUserConfig();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessage.content,
          userGoal: config?.userGoal || '',
          selectedGuru: selectedGuru.id,
          watchlistSummary: config?.watchlist?.join(', ') || '',
          marketContext: null,
          conversation: messages.slice(-6).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (response.ok) {
        const data: ChatResponse = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
          guruId: selectedGuru.id,
          response: data,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        storage.saveGuruChatMessage(selectedGuru.id, assistantMessage);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to mock response
      const mockResponses: Record<string, string> = {
        buffett: '记住，投资是一场马拉松，不是短跑。短期的波动就像天气，而长期的趋势才是气候。',
        soros: '市场情绪往往过度反应。反身性告诉我们，认知和现实相互影响。',
        munger: '反过来想，如果你现在卖出，五年后会后悔吗？避免做蠢事比追求聪明更重要。',
        dalio: '痛苦加反思等于进步。建立你的原则，让系统帮你做决定。',
        lynch: '问问自己：你真的了解这家公司吗？做足功课，答案就在细节里。',
        wood: '创新从来不是一帆风顺的。聚焦长期趋势，相信技术变革的力量。',
        coach: '我能感受到你的情绪。先深呼吸几次，让自己平静下来。',
      };

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: mockResponses[selectedGuru.id] || mockResponses.coach,
        timestamp: Date.now(),
        guruId: selectedGuru.id,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      storage.saveGuruChatMessage(selectedGuru.id, assistantMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedGuru(null);
    setMessages([]);
    setInput('');
  };

  // 大师配色映射 - Grow风格
  const guruStyles: Record<string, { bg: string; iconBg: string; shadow: string }> = {
    buffett: {
      bg: 'from-yellow-50 to-amber-50',
      iconBg: 'linear-gradient(135deg, #FDE68A 0%, #FACC15 50%, #F59E0B 100%)',
      shadow: '0 4px 12px rgba(250, 204, 21, 0.3)',
    },
    soros: {
      bg: 'from-blue-50 to-sky-50',
      iconBg: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)',
      shadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
    },
    munger: {
      bg: 'from-orange-50 to-amber-50',
      iconBg: 'linear-gradient(135deg, #FDBA74 0%, #FB923C 50%, #F97316 100%)',
      shadow: '0 4px 12px rgba(251, 146, 60, 0.3)',
    },
    dalio: {
      bg: 'from-green-50 to-emerald-50',
      iconBg: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
      shadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
    },
    lynch: {
      bg: 'from-purple-50 to-violet-50',
      iconBg: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)',
      shadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
    },
    wood: {
      bg: 'from-pink-50 to-rose-50',
      iconBg: 'linear-gradient(135deg, #F9A8D4 0%, #F472B6 50%, #EC4899 100%)',
      shadow: '0 4px 12px rgba(244, 114, 182, 0.3)',
    },
    coach: {
      bg: 'from-teal-50 to-cyan-50',
      iconBg: 'linear-gradient(135deg, #5EEAD4 0%, #2DD4BF 50%, #14B8A6 100%)',
      shadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    },
  };

  if (!selectedGuru) {
    return (
      <div
        className="flex flex-col h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
      >
        {/* 装饰性背景 */}
        <div className="absolute top-10 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-purple-100/50 to-violet-200/50 blur-3xl" />
        <div className="absolute bottom-40 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-yellow-100/50 to-amber-200/50 blur-3xl" />

        {/* Header */}
        <div className="px-6 pt-12 pb-4 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)',
                boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-700">投资智囊团</h2>
              <p className="text-xs text-gray-400">不做推荐，只做深度理性分析</p>
            </div>
          </div>
        </div>

        {/* 大师列表 */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide relative z-10">
          <div className="space-y-4">
            {GURUS.map((guru, index) => {
              const style = guruStyles[guru.id] || guruStyles.coach;
              return (
                <button
                  key={guru.id}
                  onClick={() => setSelectedGuru(guru)}
                  className={`w-full p-5 rounded-3xl bg-gradient-to-br ${style.bg} border-2 border-transparent hover:border-white/80 transition-all duration-300 animate-fade-up group`}
                  style={{
                    animationDelay: `${index * 80}ms`,
                    boxShadow: '0 4px 20px rgba(148, 163, 184, 0.15)',
                  }}
                >
                  <div className="flex gap-4 items-center">
                    {/* 大师头像 - 半拟物风格 */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: style.iconBg,
                        boxShadow: `${style.shadow}, inset 0 2px 4px rgba(255,255,255,0.4)`,
                      }}
                    >
                      {guru.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-gray-700 text-lg">{guru.name}</h3>
                        <ChevronRight
                          className="text-gray-300 group-hover:text-gray-500 transition-all group-hover:translate-x-1"
                          size={20}
                        />
                      </div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{guru.role}</div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{guru.quote}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentStyle = guruStyles[selectedGuru.id] || guruStyles.coach;

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
    >
      {/* 装饰性背景 */}
      <div className="absolute top-20 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-purple-100/40 to-violet-200/40 blur-3xl" />
      <div className="absolute bottom-60 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-100/40 to-emerald-200/40 blur-3xl" />

      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(148, 163, 184, 0.1)',
        }}
      >
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{
            background: currentStyle.iconBg,
            boxShadow: currentStyle.shadow,
          }}
        >
          {selectedGuru.icon}
        </div>
        <div>
          <span className="font-bold text-gray-700">{selectedGuru.name}</span>
          <span className="text-xs text-gray-400 ml-2">{selectedGuru.role}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto pb-36 scrollbar-hide relative z-10">
        {/* Initial greeting */}
        <div className="flex gap-3 mb-4 animate-fade-up">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: currentStyle.iconBg,
              boxShadow: currentStyle.shadow,
            }}
          >
            {selectedGuru.icon}
          </div>
          <div
            className="p-4 rounded-3xl rounded-tl-lg text-sm text-gray-700 max-w-[85%] leading-relaxed"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 12px rgba(148, 163, 184, 0.1)',
            }}
          >
            你好！我是{selectedGuru.name}。{selectedGuru.quote} 关于现在的市场，你有什么想深度探讨的吗？
          </div>
        </div>

        {/* Quick question suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4 ml-13 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {['最近市场波动很大，我很焦虑', '我想买入，但不确定时机', '如何控制投资情绪？'].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="px-4 py-2 bg-white/80 border-2 border-gray-100 rounded-full text-xs text-gray-600 hover:bg-white hover:border-green-200 transition-all"
                style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.1)' }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-up`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  background: currentStyle.iconBg,
                  boxShadow: currentStyle.shadow,
                }}
              >
                {selectedGuru.icon}
              </div>
            )}
            <div
              className={`p-4 rounded-3xl text-sm max-w-[85%] leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-tr-lg text-white'
                  : 'rounded-tl-lg text-gray-700'
              }`}
              style={{
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)'
                    : 'rgba(255, 255, 255, 0.9)',
                boxShadow:
                  msg.role === 'user'
                    ? '0 4px 12px rgba(52, 211, 153, 0.3)'
                    : '0 2px 12px rgba(148, 163, 184, 0.1)',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: currentStyle.iconBg,
                boxShadow: currentStyle.shadow,
              }}
            >
              {selectedGuru.icon}
            </div>
            <div
              className="p-4 rounded-3xl rounded-tl-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 2px 12px rgba(148, 163, 184, 0.1)',
              }}
            >
              <span className="inline-flex gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: currentStyle.iconBg, animationDelay: '0ms' }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: currentStyle.iconBg, animationDelay: '150ms' }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: currentStyle.iconBg, animationDelay: '300ms' }}
                />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="absolute bottom-0 w-full p-5 pb-6 safe-bottom z-20"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
        }}
      >
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={`与${selectedGuru.name}对话...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="grow-input flex-1"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3.5 rounded-2xl disabled:opacity-50 active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
              boxShadow: '0 4px 12px rgba(52, 211, 153, 0.4)',
            }}
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
