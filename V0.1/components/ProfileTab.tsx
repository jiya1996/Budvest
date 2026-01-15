'use client';

import { User, Award, Brain, Shield, Check, ChevronRight, Settings, HelpCircle, Info, Sparkles, RotateCcw } from 'lucide-react';
import { USER_TAGS, GROWTH_FOOTPRINTS } from '@/lib/data';

interface ProfileTabProps {
  onResetOnboarding?: () => void;
}

export default function ProfileTab({ onResetOnboarding }: ProfileTabProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'shield':
        return <Shield size={14} className="text-white" />;
      case 'check':
        return <Check size={14} className="text-white" />;
      case 'brain':
        return <Brain size={14} className="text-white" />;
      default:
        return <Check size={14} className="text-white" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'shield':
        return 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)';
      case 'check':
        return 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)';
      case 'brain':
        return 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)';
      default:
        return 'linear-gradient(135deg, #FDE68A 0%, #FACC15 100%)';
    }
  };

  // 成就徽章数据
  const achievementBadges = [
    { emoji: '☀️', name: '完美投资日', count: 3, color: 'from-yellow-200 to-amber-300', shadow: 'rgba(250, 204, 21, 0.3)' },
    { emoji: '🧘', name: '冷静奖章', count: 5, color: 'from-purple-200 to-violet-300', shadow: 'rgba(167, 139, 250, 0.3)' },
    { emoji: '🎯', name: '纪律奖章', count: 2, color: 'from-green-200 to-emerald-300', shadow: 'rgba(52, 211, 153, 0.3)' },
    { emoji: '📚', name: '成长奖章', count: 4, color: 'from-pink-200 to-rose-300', shadow: 'rgba(244, 114, 182, 0.3)' },
  ];

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
    >
      {/* 装饰性背景 */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-yellow-100/50 to-amber-200/50 blur-3xl" />
      <div className="absolute bottom-40 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-purple-100/50 to-violet-200/50 blur-3xl" />

      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide relative z-10">
        {/* Header Card */}
        <div
          className="mx-5 mt-12 p-6 rounded-3xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            boxShadow: '0 8px 32px rgba(148, 163, 184, 0.15)',
          }}
        >
          {/* 装饰光斑 */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200/30 to-amber-300/30 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              {/* 头像 - 半拟物风格 */}
              <div
                className="w-18 h-18 rounded-3xl flex items-center justify-center relative"
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)',
                  boxShadow: '0 8px 24px rgba(96, 165, 250, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)',
                }}
              >
                <User size={36} className="text-white" />
                {/* 小徽章 */}
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FDE68A 0%, #FACC15 100%)',
                    boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)',
                  }}
                >
                  <Award size={14} className="text-amber-700" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">投资新手</h2>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                      color: '#92400E',
                    }}
                  >
                    <Sparkles size={12} /> 成长会员
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                      color: '#64748B',
                    }}
                  >
                    已陪伴 7 天
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-3 gap-4 p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}
            >
              <div className="text-center">
                <div className="text-xl font-bold text-gray-700">3</div>
                <div className="text-xs text-gray-400">持仓股票</div>
              </div>
              <div className="text-center border-x border-gray-200">
                <div className="text-xl font-bold text-green-600">+12%</div>
                <div className="text-xs text-gray-400">总收益率</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-700">15</div>
                <div className="text-xs text-gray-400">对话次数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 成就徽章 */}
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FDE68A 0%, #FACC15 50%, #F59E0B 100%)',
                boxShadow: '0 4px 12px rgba(250, 204, 21, 0.3)',
              }}
            >
              <Award size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-600">成就徽章</h3>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {achievementBadges.map((badge) => (
              <div key={badge.name} className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl mb-2 relative`}
                  style={{
                    boxShadow: `0 4px 12px ${badge.shadow}, inset 0 2px 4px rgba(255,255,255,0.5)`,
                  }}
                >
                  {badge.emoji}
                  {/* 数量徽章 */}
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-600"
                    style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                  >
                    {badge.count}
                  </div>
                </div>
                <span className="text-xs text-gray-500 text-center">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 心理标签墙 */}
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)',
                boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
              }}
            >
              <Brain size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-600">心理成长标签</h3>
          </div>

          <div
            className="grow-card-solid p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            }}
          >
            <div className="flex flex-wrap gap-2">
              {USER_TAGS.map((tag) => {
                // 将旧的颜色映射到新的Grow风格
                const tagColors: Record<string, { bg: string; text: string }> = {
                  'bg-emerald-100 text-emerald-700': {
                    bg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
                    text: '#166534',
                  },
                  'bg-blue-100 text-blue-700': {
                    bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                    text: '#1D4ED8',
                  },
                  'bg-purple-100 text-purple-700': {
                    bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
                    text: '#7C3AED',
                  },
                  'bg-amber-100 text-amber-700': {
                    bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                    text: '#B45309',
                  },
                };

                const colors = tagColors[tag.color] || {
                  bg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                  text: '#64748B',
                };

                return (
                  <div
                    key={tag.id}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {tag.text}
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[10px]"
                      style={{ background: 'rgba(255,255,255,0.6)' }}
                    >
                      {tag.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 成长足迹 */}
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
                boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
              }}
            >
              <span className="text-sm">👣</span>
            </div>
            <h3 className="text-sm font-bold text-gray-600">陪伴成长足迹</h3>
          </div>

          <div className="space-y-4 relative">
            {/* Timeline Line */}
            <div
              className="absolute left-4 top-6 bottom-6 w-0.5 rounded-full"
              style={{ background: 'linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%)' }}
            />

            {GROWTH_FOOTPRINTS.map((item, index) => (
              <div
                key={item.id}
                className="relative pl-12 animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Dot - 半拟物风格 */}
                <div
                  className="absolute left-1 top-4 w-7 h-7 rounded-xl flex items-center justify-center z-10"
                  style={{
                    background: getIconBg(item.type),
                    boxShadow: '0 2px 8px rgba(148, 163, 184, 0.3), inset 0 1px 2px rgba(255,255,255,0.4)',
                  }}
                >
                  {getIcon(item.type)}
                </div>

                {/* Card */}
                <div
                  className="grow-card-solid p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-700 text-sm">{item.title}</h4>
                    <span className="text-xs text-gray-400 font-mono">{item.date}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="px-5 mt-6 mb-6">
          <div className="grow-card-solid overflow-hidden">
            {[
              { icon: Settings, label: '设置', color: 'from-gray-300 to-gray-400' },
              { icon: HelpCircle, label: '帮助与反馈', color: 'from-blue-300 to-sky-400' },
              { icon: Info, label: '关于伴投', color: 'from-green-300 to-emerald-400' },
            ].map((item, index) => (
              <button
                key={item.label}
                className={`w-full p-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors ${
                  index < 2 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                    style={{ boxShadow: '0 2px 6px rgba(148, 163, 184, 0.2)' }}
                  >
                    <item.icon size={16} className="text-white" />
                  </div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>

          {/* 重新体验引导按钮 */}
          {onResetOnboarding && (
            <button
              onClick={onResetOnboarding}
              className="w-full mt-4 p-4 flex justify-between items-center text-left hover:bg-amber-50 transition-colors grow-card-solid"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center"
                  style={{ boxShadow: '0 2px 6px rgba(251, 191, 36, 0.3)' }}
                >
                  <RotateCcw size={16} className="text-white" />
                </div>
                <div>
                  <span className="text-sm text-gray-700 block">重新体验引导</span>
                  <span className="text-xs text-gray-400">重置数据，体验首次登录流程</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
