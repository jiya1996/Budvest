/**
 * Claude Agent 测试页面
 * 用于测试多智能体系统
 */

'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function ClaudeAgentTest() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState('coach');

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: input,
          selectedGuru,
          conversation: messages,
          userGoal: '长期价值投资',
          watchlistSummary: '贵州茅台、平安银行'
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Claude Agent 多智能体测试
          </h1>
          <p className="text-gray-600 mb-4">
            测试协调员、研究员、分析师、风控员、导师等多个 Agent 的协作能力
          </p>

          {/* Guru Selector */}
          <div className="flex gap-2 flex-wrap">
            {['coach', 'buffett', 'soros', 'dalio', 'munger', 'lynch', 'wood'].map(guru => (
              <button
                key={guru}
                onClick={() => setSelectedGuru(guru)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedGuru === guru
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {guru}
              </button>
            ))}
          </div>

          {/* Command Help */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">可用命令：</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><code className="bg-blue-100 px-2 py-1 rounded">/research 600519</code> - 调用研究员获取公告和新闻</li>
              <li><code className="bg-blue-100 px-2 py-1 rounded">/analyze 600519</code> - 调用分析师进行技术分析</li>
              <li><code className="bg-blue-100 px-2 py-1 rounded">/risk 600519</code> - 调用风控员评估风险</li>
              <li><code className="bg-blue-100 px-2 py-1 rounded">/mentor buffett</code> - 切换导师</li>
            </ul>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4 h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">开始对话</p>
                <p className="text-sm">试试问："帮我分析一下贵州茅台的投资价值"</p>
                <p className="text-sm">或使用命令："/research 600519"</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息或命令（如 /research 600519）..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
