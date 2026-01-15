'use client';

import { useRouter } from 'next/navigation';
import { Home, MessageCircle, Briefcase, User } from 'lucide-react';

type TabType = 'market' | 'companion' | 'portfolio' | 'profile';

export interface BottomNavProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

const navItems: { id: TabType; icon: typeof Home; label: string; activeColor: string; activeShadow: string }[] = [
  {
    id: 'market',
    icon: Home,
    label: '市',
    activeColor: 'linear-gradient(135deg, #FDE68A 0%, #FACC15 50%, #F59E0B 100%)',
    activeShadow: '0 4px 12px rgba(250, 204, 21, 0.4)',
  },
  {
    id: 'companion',
    icon: MessageCircle,
    label: '伴',
    activeColor: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)',
    activeShadow: '0 4px 12px rgba(167, 139, 250, 0.4)',
  },
  {
    id: 'portfolio',
    icon: Briefcase,
    label: '投',
    activeColor: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
    activeShadow: '0 4px 12px rgba(52, 211, 153, 0.4)',
  },
  {
    id: 'profile',
    icon: User,
    label: '我',
    activeColor: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)',
    activeShadow: '0 4px 12px rgba(96, 165, 250, 0.4)',
  },
];

export default function BottomNav({ activeTab = 'market', onTabChange }: BottomNavProps) {
  const router = useRouter();

  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      // Default behavior: navigate to main page with tab parameter
      router.push(`/?tab=${tab}`);
    }
  };

  return (
    <nav
      className="h-[84px] flex justify-around items-start pt-3 px-4 z-40 safe-bottom"
      style={{
        background: 'linear-gradient(to top, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 20px rgba(148, 163, 184, 0.08)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className="flex flex-col items-center gap-1.5 w-16 transition-all duration-300"
          >
            <div
              className={`p-2.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'scale-105' : 'hover:bg-gray-100'
              }`}
              style={{
                background: isActive ? item.activeColor : 'transparent',
                boxShadow: isActive ? `${item.activeShadow}, inset 0 1px 2px rgba(255,255,255,0.4)` : 'none',
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-white' : 'text-gray-400'}
              />
            </div>
            <span
              className={`text-[10px] font-semibold transition-colors duration-300 ${
                isActive ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
