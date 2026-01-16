/**
 * SQLite 数据库连接工具
 * 用于 Next.js API 从本地数据库读取数据
 */

import path from 'path';

// 数据库路径
const DB_PATH = path.join(process.cwd(), 'data', 'investbuddy.db');

// 动态加载 better-sqlite3（可能在某些环境不可用）
let DatabaseConstructor: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DatabaseConstructor = require('better-sqlite3');
} catch {
  console.warn('better-sqlite3 not available, database features will be disabled');
}

let db: any = null;

/**
 * 获取数据库连接
 */
export function getDatabase(): any | null {
  if (!DatabaseConstructor) return null;
  if (!db) {
    try {
      db = new DatabaseConstructor(DB_PATH, { readonly: true });
      db.pragma('journal_mode = WAL');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      return null;
    }
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ==================== 类型定义 ====================

export interface StockRealtime {
  symbol: string;
  name: string;
  price: number | null;
  change_pct: number | null;
  change_amount: number | null;
  volume: number | null;
  amount: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  prev_close: number | null;
  amplitude: number | null;
  volume_ratio: number | null;
  turnover_rate: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  total_market_cap: number | null;
  circulating_market_cap: number | null;
  updated_at: string;
}

export interface IndexRealtime {
  symbol: string;
  name: string;
  price: number | null;
  change_pct: number | null;
  change_amount: number | null;
  volume: number | null;
  amount: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  prev_close: number | null;
  amplitude: number | null;
  updated_at: string;
}

export interface StockNews {
  id: number;
  symbol: string | null;
  title: string;
  content: string | null;
  source: string | null;
  publish_time: string | null;
  url: string | null;
  created_at: string;
}

export interface FundFlow {
  symbol: string;
  name: string | null;
  trade_date: string;
  close_price: number | null;
  change_pct: number | null;
  main_net_inflow: number | null;
  main_net_inflow_pct: number | null;
  super_large_net_inflow: number | null;
  large_net_inflow: number | null;
  medium_net_inflow: number | null;
  small_net_inflow: number | null;
}

export interface MarginTrading {
  symbol: string;
  name: string | null;
  trade_date: string;
  margin_balance: number | null;
  margin_buy: number | null;
  short_balance: number | null;
  margin_short_balance: number | null;
}

// ==================== 查询函数 ====================

export function getStockRealtime(symbol?: string): StockRealtime[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    if (symbol) {
      return db.prepare('SELECT * FROM stock_realtime WHERE symbol = ?').all(symbol) as StockRealtime[];
    } else {
      return db.prepare('SELECT * FROM stock_realtime ORDER BY symbol').all() as StockRealtime[];
    }
  } catch (error) {
    console.error('Query stock_realtime failed:', error);
    return [];
  }
}

export function getIndexRealtime(symbol?: string): IndexRealtime[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    if (symbol) {
      return db.prepare('SELECT * FROM index_realtime WHERE symbol = ?').all(symbol) as IndexRealtime[];
    } else {
      return db.prepare('SELECT * FROM index_realtime ORDER BY symbol').all() as IndexRealtime[];
    }
  } catch (error) {
    console.error('Query index_realtime failed:', error);
    return [];
  }
}

export function getStockNews(symbol?: string, limit: number = 20): StockNews[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    if (symbol) {
      return db.prepare('SELECT * FROM stock_news WHERE symbol = ? ORDER BY publish_time DESC LIMIT ?').all(symbol, limit) as StockNews[];
    } else {
      return db.prepare('SELECT * FROM stock_news ORDER BY publish_time DESC LIMIT ?').all(limit) as StockNews[];
    }
  } catch (error) {
    console.error('Query stock_news failed:', error);
    return [];
  }
}

export function getPolicyNews(limit: number = 20): StockNews[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    return db.prepare('SELECT * FROM policy_news ORDER BY publish_time DESC LIMIT ?').all(limit) as StockNews[];
  } catch (error) {
    console.error('Query policy_news failed:', error);
    return [];
  }
}

export function getFundFlow(symbol: string, limit: number = 10): FundFlow[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    return db.prepare('SELECT * FROM fund_flow WHERE symbol = ? ORDER BY trade_date DESC LIMIT ?').all(symbol, limit) as FundFlow[];
  } catch (error) {
    console.error('Query fund_flow failed:', error);
    return [];
  }
}

export function getMarginTrading(symbol: string, limit: number = 10): MarginTrading[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    return db.prepare('SELECT * FROM margin_trading WHERE symbol = ? ORDER BY trade_date DESC LIMIT ?').all(symbol, limit) as MarginTrading[];
  } catch (error) {
    console.error('Query margin_trading failed:', error);
    return [];
  }
}

export function getStockDaily(symbol: string, limit: number = 30) {
  const db = getDatabase();
  if (!db) return [];
  try {
    return db.prepare('SELECT * FROM stock_daily WHERE symbol = ? ORDER BY trade_date DESC LIMIT ?').all(symbol, limit);
  } catch (error) {
    console.error('Query stock_daily failed:', error);
    return [];
  }
}

export function getEarningsCalendar(symbol?: string) {
  const db = getDatabase();
  if (!db) return [];
  try {
    if (symbol) {
      return db.prepare('SELECT * FROM earnings_calendar WHERE symbol = ? ORDER BY report_date DESC').all(symbol);
    } else {
      return db.prepare('SELECT * FROM earnings_calendar ORDER BY report_date DESC LIMIT 100').all();
    }
  } catch (error) {
    console.error('Query earnings_calendar failed:', error);
    return [];
  }
}

export function isDatabaseAvailable(): boolean {
  try {
    const db = getDatabase();
    if (!db) return false;
    const result = db.prepare('SELECT 1').get();
    return result !== undefined;
  } catch {
    return false;
  }
}
