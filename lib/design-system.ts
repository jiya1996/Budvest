// Grow风格设计系统 - 伴投专用
// 柔和、治愈、圆润、富有激励感

export const colors = {
  // 背景渐变色
  background: {
    gradient: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)',
    light: '#F5F8FC',
    card: 'rgba(255, 255, 255, 0.85)',
    cardHover: 'rgba(255, 255, 255, 0.95)',
  },

  // 主色调 - 友好的绿色（完成/积极状态）
  primary: {
    light: '#DCFCE7',
    main: '#4ADE80',
    dark: '#22C55E',
    gradient: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
  },

  // 辅助色系
  accent: {
    // 暖黄色 - 太阳徽章
    yellow: {
      light: '#FEF9C3',
      main: '#FACC15',
      dark: '#EAB308',
      gradient: 'linear-gradient(135deg, #FDE68A 0%, #FACC15 50%, #F59E0B 100%)',
    },
    // 柔和蓝色 - 水滴/平静
    blue: {
      light: '#DBEAFE',
      main: '#60A5FA',
      dark: '#3B82F6',
      gradient: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)',
    },
    // 淡紫色 - 睡眠/放松
    purple: {
      light: '#F3E8FF',
      main: '#A78BFA',
      dark: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)',
    },
    // 粉红色 - 爱心/关怀
    pink: {
      light: '#FCE7F3',
      main: '#F472B6',
      dark: '#EC4899',
      gradient: 'linear-gradient(135deg, #F9A8D4 0%, #F472B6 50%, #EC4899 100%)',
    },
    // 橙色 - 能量/活力
    orange: {
      light: '#FFEDD5',
      main: '#FB923C',
      dark: '#F97316',
      gradient: 'linear-gradient(135deg, #FDBA74 0%, #FB923C 50%, #F97316 100%)',
    },
  },

  // 文本颜色
  text: {
    primary: '#374151',    // 主要文字 - 深灰
    secondary: '#6B7280',  // 次要文字 - 中灰
    muted: '#9CA3AF',      // 辅助文字 - 浅灰
    inverse: '#FFFFFF',    // 反色文字
  },

  // 状态颜色
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // 投资相关颜色
  invest: {
    profit: '#22C55E',     // 盈利 - 绿色
    loss: '#F87171',       // 亏损 - 柔和红色
    neutral: '#9CA3AF',    // 中性
  },
};

// 圆角系统 - 极致圆润
export const borderRadius = {
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  full: '9999px',
  pill: '100px',
};

// 阴影系统 - 柔和扩散
export const shadows = {
  sm: '0 2px 8px rgba(148, 163, 184, 0.1)',
  md: '0 4px 16px rgba(148, 163, 184, 0.12)',
  lg: '0 8px 32px rgba(148, 163, 184, 0.15)',
  xl: '0 12px 48px rgba(148, 163, 184, 0.18)',
  glow: {
    green: '0 4px 20px rgba(74, 222, 128, 0.3)',
    yellow: '0 4px 20px rgba(250, 204, 21, 0.3)',
    blue: '0 4px 20px rgba(96, 165, 250, 0.3)',
    purple: '0 4px 20px rgba(167, 139, 250, 0.3)',
  },
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
};

// 间距系统
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
};

// 徽章类型 - 用于投资成就
export const badges = {
  // 完美一天 - 金太阳
  perfect: {
    icon: '☀️',
    name: '完美投资日',
    color: colors.accent.yellow,
    description: '达成所有投资目标',
  },
  // 美好一天 - 银太阳
  good: {
    icon: '🌤️',
    name: '美好投资日',
    color: colors.accent.orange,
    description: '达成80%投资目标',
  },
  // 坚持一天 - 云朵
  nice: {
    icon: '⛅',
    name: '坚持投资日',
    color: colors.accent.blue,
    description: '达成50%投资目标',
  },
  // 冷静徽章
  calm: {
    icon: '🧘',
    name: '冷静奖章',
    color: colors.accent.purple,
    description: '面对波动保持理性',
  },
  // 坚守计划
  disciplined: {
    icon: '🎯',
    name: '纪律奖章',
    color: colors.primary,
    description: '严格执行投资计划',
  },
  // 学习成长
  learner: {
    icon: '📚',
    name: '成长奖章',
    color: colors.accent.pink,
    description: '完成投资学习',
  },
};

// 大师配色 - 更柔和的版本
export const guruColors = {
  buffett: {
    bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    text: '#92400E',
    icon: '👴🏼',
  },
  soros: {
    bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    text: '#1E40AF',
    icon: '🦅',
  },
  munger: {
    bg: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
    text: '#9A3412',
    icon: '🧒🏼',
  },
  dalio: {
    bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
    text: '#065F46',
    icon: '🌍',
  },
  lynch: {
    bg: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
    text: '#5B21B6',
    icon: '📈',
  },
  wood: {
    bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
    text: '#9D174D',
    icon: '🚀',
  },
  coach: {
    bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
    text: '#991B1B',
    icon: '🧘🏻‍♀️',
  },
};
