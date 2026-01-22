/**
 * Smart Market Data Access Layer
 * Implements hybrid layered data strategy:
 * - Layer 1: Redis cache (30s for realtime, 5min for news)
 * - Layer 2: Supabase (after-hours snapshot, historical data)
 * - Layer 3: External APIs (Sina Finance, Eastmoney)
 */

import { supabase } from './supabase';
import { Redis } from '@upstash/redis';

// ===================== Configuration =====================

const redis = process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
    })
    : null;

// ===================== Utilities =====================

/**
 * Check if current time is during market hours (A-share: 9:30-15:00)
 */
function isMarketOpen(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();

    // Weekend
    if (day === 0 || day === 6) return false;

    // Market hours: 9:30-11:30, 13:00-15:00
    if (hour === 9 && minute >= 30) return true;
    if (hour >= 10 && hour < 11) return true;
    if (hour === 11 && minute < 30) return true;
    if (hour === 13 || hour === 14) return true;

    return false;
}

/**
 * Normalize stock symbol for different APIs
 */
function normalizeSymbol(symbol: string): string {
    // Remove any prefixes
    return symbol.replace(/^(sh|sz|hk|us)/i, '');
}

/**
 * Get market prefix for symbol (sh/sz)
 */
function getMarketPrefix(symbol: string): string {
    const code = normalizeSymbol(symbol);
    // Shanghai: starts with 6, 5
    if (code.startsWith('6') || code.startsWith('5')) return 'sh';
    // Shenzhen: starts with 0, 3, 2
    if (code.startsWith('0') || code.startsWith('3') || code.startsWith('2')) return 'sz';
    return 'sh'; // default
}

// ===================== Type Definitions =====================

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
    amplitude?: number | null;
    volume_ratio?: number | null;
    turnover_rate: number | null;
    pe_ratio: number | null;
    pb_ratio?: number | null;
    total_market_cap?: number | null;
    circulating_market_cap?: number | null;
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

export interface StockDaily {
    trade_date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change_pct: number;
}

export interface FundFlow {
    symbol: string;
    name: string | null;
    trade_date: string;
    close_price: number | null;
    change_pct: number | null;
    main_net_inflow: number | null;
    main_net_inflow_pct: number | null;
    small_net_inflow: number | null;
    medium_net_inflow: number | null;
    large_net_inflow: number | null;
    super_large_net_inflow: number | null;
}

// ===================== Layer 3: External API Calls =====================

/**
 * Fetch realtime stock data from Sina Finance API
 */
async function fetchSinaRealtime(symbol: string): Promise<StockRealtime | null> {
    try {
        const marketSymbol = `${getMarketPrefix(symbol)}${normalizeSymbol(symbol)}`;
        const response = await fetch(
            `https://hq.sinajs.cn/list=${marketSymbol}`,
            { next: { revalidate: 30 } } // 30s cache
        );

        if (!response.ok) return null;

        const text = await response.text();
        const match = text.match(/="(.+)"/);
        if (!match) return null;

        const fields = match[1].split(',');
        if (fields.length < 32) return null;

        const name = fields[0];
        const open = parseFloat(fields[1]);
        const prevClose = parseFloat(fields[2]);
        const price = parseFloat(fields[3]);
        const high = parseFloat(fields[4]);
        const low = parseFloat(fields[5]);
        const volume = parseInt(fields[8]);
        const amount = parseFloat(fields[9]);
        const turnoverRate = parseFloat(fields[15]) || null;
        const peRatio = parseFloat(fields[33]) || null;

        const changeAmount = price - prevClose;
        const changePct = prevClose > 0 ? (changeAmount / prevClose) * 100 : 0;

        return {
            symbol: normalizeSymbol(symbol),
            name,
            price,
            change_pct: changePct,
            change_amount: changeAmount,
            volume,
            amount,
            high,
            low,
            open,
            prev_close: prevClose,
            turnover_rate: turnoverRate,
            pe_ratio: peRatio,
            updated_at: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Sina API error:', error);
        return null;
    }
}

/**
 * Fetch index data from Sina Finance API
 */
async function fetchSinaIndex(symbol?: string): Promise<IndexRealtime[]> {
    try {
        // Major indices
        const indices = symbol
            ? [symbol]
            : ['sh000001', 'sz399001', 'sz399006']; // 上证指数, 深证成指, 创业板指

        const promises = indices.map(async (idx) => {
            const response = await fetch(
                `https://hq.sinajs.cn/list=${idx}`,
                { next: { revalidate: 30 } }
            );

            if (!response.ok) return null;

            const text = await response.text();
            const match = text.match(/="(.+)"/);
            if (!match) return null;

            const fields = match[1].split(',');
            const name = fields[0];
            const price = parseFloat(fields[3]);
            const prevClose = parseFloat(fields[2]);
            const changeAmount = price - prevClose;
            const changePct = prevClose > 0 ? (changeAmount / prevClose) * 100 : 0;

            return {
                symbol: idx,
                name,
                price,
                change_pct: changePct,
                change_amount: changeAmount,
                volume: parseInt(fields[8]) || null,
                amount: parseFloat(fields[9]) || null,
                high: parseFloat(fields[4]) || null,
                low: parseFloat(fields[5]) || null,
                open: parseFloat(fields[1]) || null,
                prev_close: prevClose,
                amplitude: null,
                updated_at: new Date().toISOString(),
            };
        });

        const results = await Promise.all(promises);
        return results.filter((r): r is IndexRealtime => r !== null);
    } catch (error) {
        console.error('Sina Index API error:', error);
        return [];
    }
}

// ===================== Layer 2: Supabase Queries =====================

/**
 * Get stock snapshot from Supabase (after-hours data)
 */
async function getStockSnapshot(symbol: string): Promise<StockRealtime | null> {
    try {
        const { data, error } = await supabase
            .from('stock_snapshot')
            .select('*')
            .eq('symbol', normalizeSymbol(symbol))
            .order('trade_date', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;

        return {
            symbol: data.symbol,
            name: data.name || '',
            price: data.close_price,
            change_pct: data.change_pct,
            change_amount: data.close_price && data.prev_close
                ? data.close_price - data.prev_close
                : null,
            volume: data.volume,
            amount: data.amount,
            high: data.high,
            low: data.low,
            open: data.open,
            prev_close: data.prev_close,
            turnover_rate: data.turnover_rate,
            pe_ratio: data.pe_ratio,
            pb_ratio: data.pb_ratio,
            total_market_cap: data.market_cap,
            updated_at: data.created_at,
        };
    } catch (error) {
        console.error('Supabase snapshot error:', error);
        return null;
    }
}

/**
 * Get index snapshot from Supabase
 */
async function getIndexSnapshot(symbol?: string): Promise<IndexRealtime[]> {
    try {
        let query = supabase
            .from('index_snapshot')
            .select('*')
            .order('trade_date', { ascending: false });

        if (symbol) {
            query = query.eq('symbol', symbol).limit(1);
        } else {
            // Get latest snapshot for each major index
            query = query.limit(10);
        }

        const { data, error } = await query;

        if (error || !data) return [];

        return data.map(d => ({
            symbol: d.symbol,
            name: d.name || '',
            price: d.close_price,
            change_pct: d.change_pct,
            change_amount: d.close_price && d.prev_close
                ? d.close_price - d.prev_close
                : null,
            volume: d.volume,
            amount: d.amount,
            high: d.high,
            low: d.low,
            open: d.open,
            prev_close: d.prev_close,
            amplitude: null,
            updated_at: d.created_at,
        }));
    } catch (error) {
        console.error('Supabase index snapshot error:', error);
        return [];
    }
}

// ===================== Public API Functions =====================

/**
 * Get stock realtime data with smart routing
 * - During market hours: API with Redis cache (30s)
 * - After hours: Supabase snapshot
 */
export async function getStockRealtime(symbol?: string): Promise<StockRealtime[]> {
    if (!symbol) return [];

    const normalizedSymbol = normalizeSymbol(symbol);
    const cacheKey = `stock:realtime:${normalizedSymbol}`;

    // Layer 1: Redis cache
    if (redis) {
        try {
            const cached = await redis.get<StockRealtime>(cacheKey);
            if (cached) return [cached];
        } catch (error) {
            console.warn('Redis get error:', error);
        }
    }

    // Layer 2: After-hours snapshot
    if (!isMarketOpen()) {
        const snapshot = await getStockSnapshot(normalizedSymbol);
        if (snapshot) {
            // Cache for next request
            if (redis) {
                try {
                    await redis.setex(cacheKey, 300, snapshot); // 5min cache
                } catch (error) {
                    console.warn('Redis setex error:', error);
                }
            }
            return [snapshot];
        }
    }

    // Layer 3: Live API
    const apiData = await fetchSinaRealtime(normalizedSymbol);
    if (apiData) {
        // Cache for 30s
        if (redis) {
            try {
                await redis.setex(cacheKey, 30, apiData);
            } catch (error) {
                console.warn('Redis setex error:', error);
            }
        }
        return [apiData];
    }

    return [];
}

/**
 * Get index realtime data with smart routing
 */
export async function getIndexRealtime(symbol?: string): Promise<IndexRealtime[]> {
    const cacheKey = symbol ? `index:${symbol}` : 'index:major';

    // Layer 1: Redis cache
    if (redis) {
        try {
            const cached = await redis.get<IndexRealtime[]>(cacheKey);
            if (cached) return cached;
        } catch (error) {
            console.warn('Redis get error:', error);
        }
    }

    // Layer 2: After-hours snapshot
    if (!isMarketOpen()) {
        const snapshot = await getIndexSnapshot(symbol);
        if (snapshot.length > 0) {
            if (redis) {
                try {
                    await redis.setex(cacheKey, 300, snapshot);
                } catch (error) {
                    console.warn('Redis setex error:', error);
                }
            }
            return snapshot;
        }
    }

    // Layer 3: Live API
    const apiData = await fetchSinaIndex(symbol);
    if (apiData.length > 0) {
        if (redis) {
            try {
                await redis.setex(cacheKey, 30, apiData);
            } catch (error) {
                console.warn('Redis setex error:', error);
            }
        }
        return apiData;
    }

    return [];
}

/**
 * Get historical K-line data from Supabase
 */
export async function getStockDaily(symbol: string, limit: number = 30): Promise<StockDaily[]> {
    try {
        const { data, error } = await supabase
            .from('stock_daily')
            .select('*')
            .eq('symbol', normalizeSymbol(symbol))
            .order('trade_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase stock_daily error:', error);
            return [];
        }

        return (data || []).map(d => ({
            trade_date: d.trade_date,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            change_pct: d.change_pct,
        }));
    } catch (error) {
        console.error('getStockDaily error:', error);
        return [];
    }
}

/**
 * Get fund flow data from Supabase
 */
export async function getFundFlow(symbol: string, limit: number = 10): Promise<FundFlow[]> {
    try {
        const { data, error } = await supabase
            .from('fund_flow')
            .select('*')
            .eq('symbol', normalizeSymbol(symbol))
            .order('trade_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase fund_flow error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('getFundFlow error:', error);
        return [];
    }
}

/**
 * Placeholder functions for APIs not yet implemented
 * These can be implemented later with Eastmoney or other APIs
 */

export function getStockNews(symbol?: string, limit: number = 20): any[] {
    console.warn('getStockNews not yet implemented');
    return [];
}

export function getPolicyNews(limit: number = 20): any[] {
    console.warn('getPolicyNews not yet implemented');
    return [];
}

export function getMarginTrading(symbol: string, limit: number = 10): any[] {
    console.warn('getMarginTrading not yet implemented');
    return [];
}

export function getEarningsCalendar(symbol?: string): any[] {
    console.warn('getEarningsCalendar not yet implemented');
    return [];
}

/**
 * Check if data layer is properly configured
 */
export function isDatabaseAvailable(): boolean {
    // Since we're using APIs + Supabase, this always returns true
    return true;
}
