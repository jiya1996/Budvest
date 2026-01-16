import { GuruInfo, Stock, DailyInsight, UserTag, GrowthFootprint } from './types';

// 投资大师数据
export const GURUS: GuruInfo[] = [
  {
    id: 'buffett',
    name: '巴菲特',
    nameEn: 'Warren Buffett',
    role: '价值投资',
    style: 'bg-slate-800 text-amber-100',
    icon: '👴🏼',
    quote: '"短期波动往往会放大情绪，但并不一定改变长期判断。"',
    focus: '噪音 vs 本质',
    philosophy: '价值投资，长期持有，以合理价格买入优秀企业'
  },
  {
    id: 'soros',
    name: '索罗斯',
    nameEn: 'George Soros',
    role: '反身性/趋势',
    style: 'bg-blue-100 text-blue-800',
    icon: '🦅',
    quote: '"这种行情下，最大的风险不是方向，而是忍不住频繁行动。"',
    focus: '冲动控制',
    philosophy: '反身性理论，宏观投机，顺势而为'
  },
  {
    id: 'munger',
    name: '芒格',
    nameEn: 'Charlie Munger',
    role: '多元思维',
    style: 'bg-amber-100 text-amber-800',
    icon: '🧓🏼',
    quote: '"反过来想，总是反过来想。"',
    focus: '逆向思维',
    philosophy: '多元思维模型，只以公允价格买入优秀企业'
  },
  {
    id: 'dalio',
    name: '达利欧',
    nameEn: 'Ray Dalio',
    role: '全天候配置',
    style: 'bg-emerald-100 text-emerald-800',
    icon: '🌍',
    quote: '"痛苦+反思=进步。"',
    focus: '资产配置',
    philosophy: '宏观投资，全天候策略，风险平价'
  },
  {
    id: 'lynch',
    name: '彼得·林奇',
    nameEn: 'Peter Lynch',
    role: '成长投资',
    style: 'bg-purple-100 text-purple-800',
    icon: '📈',
    quote: '"买你了解的公司。"',
    focus: '十倍股',
    philosophy: '在日常企业中寻找十倍股，务实成长投资'
  },
  {
    id: 'wood',
    name: '木头姐',
    nameEn: 'Cathie Wood',
    role: '颠覆创新',
    style: 'bg-pink-100 text-pink-800',
    icon: '🚀',
    quote: '"未来五年的创新，比过去一百年还要多。"',
    focus: '破坏性创新',
    philosophy: '成长与颠覆性创新，积极管理'
  },
  {
    id: 'coach',
    name: '心理教练',
    nameEn: 'Coach',
    role: '情绪管理',
    style: 'bg-rose-100 text-rose-800',
    icon: '🧘🏻‍♀️',
    quote: '"不论市场如何，先照顾好你的心情，再照顾账户。"',
    focus: '情绪识别',
    philosophy: '理性分析，情绪管理，心理陪伴'
  },
];

// 股票数据库
export const STOCK_DATABASE: Stock[] = [
  { symbol: 'NVDA', name: 'NVIDIA', logo: 'https://logo.clearbit.com/nvidia.com', price: 920.5, dayChg: 4.2 },
  { symbol: 'AAPL', name: 'Apple', logo: 'https://logo.clearbit.com/apple.com', price: 178.2, dayChg: 0.5 },
  { symbol: 'TSLA', name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com', price: 172.5, dayChg: -2.1 },
  { symbol: 'MSFT', name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com', price: 420.0, dayChg: 1.2 },
  { symbol: 'BABA', name: 'Alibaba', logo: 'https://logo.clearbit.com/alibaba.com', price: 75.0, dayChg: -0.8 },
  { symbol: 'GOOG', name: 'Google', logo: 'https://logo.clearbit.com/google.com', price: 175.5, dayChg: 1.8 },
  { symbol: 'AMZN', name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com', price: 185.2, dayChg: 0.9 },
  { symbol: 'META', name: 'Meta', logo: 'https://logo.clearbit.com/meta.com', price: 505.8, dayChg: 2.3 },
];

// 每日洞察
export const DAILY_INSIGHT: DailyInsight = {
  summary: '今日市场呈现"情绪修复"特征。虽然科技板块波动较大，但资金承接力较强。',
  advice: '你的组合整体抗跌性优于大盘，建议继续保持观察，暂不操作。',
  volatility: 'medium'
};

// 用户心理标签
export const USER_TAGS: UserTag[] = [
  { id: 1, text: '克服恐慌', count: 3, color: 'bg-indigo-100 text-indigo-700' },
  { id: 2, text: '坚守计划', count: 5, color: 'bg-emerald-100 text-emerald-700' },
  { id: 3, text: '理性复盘', count: 2, color: 'bg-blue-100 text-blue-700' },
  { id: 4, text: '风险意识', count: 4, color: 'bg-orange-100 text-orange-700' },
];

// 成长足迹
export const GROWTH_FOOTPRINTS: GrowthFootprint[] = [
  {
    id: 1,
    date: '1月10日',
    title: '战胜了恐慌情绪',
    desc: '在大盘下跌 3% 时，通过与心理教练对话，放弃了清仓念头。',
    type: 'shield'
  },
  {
    id: 2,
    date: '1月8日',
    title: '执行了预定计划',
    desc: 'NVDA 财报前按计划减仓，知行合一。',
    type: 'check'
  },
  {
    id: 3,
    date: '1月5日',
    title: '深刻的认知升级',
    desc: '在复盘中意识到"波动不等于风险"，心态更稳了。',
    type: 'brain'
  },
];

// 投资目标选项
export const INVESTMENT_GOALS = ['长期增值', '短期套利', '养老储备', '体验观察'];
