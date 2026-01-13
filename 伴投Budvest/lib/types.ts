export type Guru = 'buffett' | 'soros' | 'dalio' | 'munger' | 'lynch' | 'wood' | 'coach';

export type Emotion = 'anxious' | 'panic' | 'angry' | 'greedy' | 'calm';
export type Intent = 'vent' | 'ask_reason' | 'seek_advice' | 'review' | 'other';
export type SafetyLevel = 'low' | 'medium' | 'high';
export type StockStatus = 'investing' | 'watching';

export interface GuruInfo {
  id: Guru;
  name: string;
  nameEn: string;
  role: string;
  style: string;
  icon: string;
  quote: string;
  focus: string;
  philosophy: string;
}

export interface Stock {
  symbol: string;
  name: string;
  logo: string;
  price: number;
  dayChg: number;
}

export interface StockConfig {
  status: StockStatus;
  capital: string;
  goal: string;
}

export interface PortfolioItem extends Stock {
  config: StockConfig;
  holdingDays: number;
  cost: number;
  profit: number;
}

export interface UserConfig {
  userGoal: string;
  selectedGuru: Guru;
  watchlist: string[];
  mainSymbol: string;
  portfolio: PortfolioItem[];
  totalPrincipal: number;
  hasOnboarded: boolean;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  industry: string;
  marketCap: number;
  description: string;
}

export interface NewsItem {
  title: string;
  publishedDate: string;
  url?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  response?: ChatResponse;
  guruId?: Guru;
}

export interface ChatResponse {
  emotion: Emotion;
  intent: Intent;
  safety_level: SafetyLevel;
  reply: string;
  suggested_actions: string[];
  review_prompt: string;
  tags: string[];
}

export type ReviewEntry = {
  id: string;
  createdAt: string;
  content: string;
  tags: string[];
  emotion?: string;
  guru?: Guru;
  symbol?: string;
};

export interface MarketContext {
  company: CompanyProfile | null;
  news: NewsItem[];
}

export interface DailyInsight {
  summary: string;
  advice: string;
  volatility: 'low' | 'medium' | 'high';
}

export interface UserTag {
  id: number;
  text: string;
  count: number;
  color: string;
}

export interface GrowthFootprint {
  id: number;
  date: string;
  title: string;
  desc: string;
  type: 'shield' | 'check' | 'brain';
}
