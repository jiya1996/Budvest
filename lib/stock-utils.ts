import { STOCK_DATABASE } from './data';
import { Stock } from './types';

// Centralized stock name mapping
const STOCK_NAME_MAP: Record<string, string> = {
  // Tesla
  '特斯拉': 'TSLA',
  'tesla': 'TSLA',
  'tsla': 'TSLA',
  // Apple
  '苹果': 'AAPL',
  'apple': 'AAPL',
  'aapl': 'AAPL',
  // NVIDIA
  '英伟达': 'NVDA',
  'nvidia': 'NVDA',
  'nvda': 'NVDA',
  // Microsoft
  '微软': 'MSFT',
  'microsoft': 'MSFT',
  'msft': 'MSFT',
  // Alibaba
  '阿里巴巴': 'BABA',
  '阿里': 'BABA',
  'alibaba': 'BABA',
  'baba': 'BABA',
  // Google
  '谷歌': 'GOOG',
  'google': 'GOOG',
  'goog': 'GOOG',
  'googl': 'GOOG',
  // Amazon
  '亚马逊': 'AMZN',
  'amazon': 'AMZN',
  'amzn': 'AMZN',
  // Meta
  'meta': 'META',
  'facebook': 'META',
  '脸书': 'META',
  'fb': 'META',
};

export function findStockByName(name: string): Stock | null {
  if (!name) return null;

  const normalized = name.trim().toLowerCase();

  // Direct match by symbol
  const bySymbol = STOCK_DATABASE.find(
    (s) => s.symbol.toLowerCase() === normalized
  );
  if (bySymbol) return bySymbol;

  // Direct match by name
  const byName = STOCK_DATABASE.find(
    (s) => s.name.toLowerCase() === normalized
  );
  if (byName) return byName;

  // Map lookup
  const mappedSymbol = STOCK_NAME_MAP[normalized];
  if (mappedSymbol) {
    return STOCK_DATABASE.find((s) => s.symbol === mappedSymbol) || null;
  }

  return null;
}

export function getStockNameList(): string[] {
  return STOCK_DATABASE.map((s) => `${s.name} (${s.symbol})`);
}

export function getStockNameMapping(): Record<string, string> {
  return { ...STOCK_NAME_MAP };
}
