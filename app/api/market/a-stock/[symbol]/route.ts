/**
 * A-Stock Market Data API
 * Replaces Python data service with Next.js API Route
 * Uses free Sina Finance API (no API key needed)
 */

import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

interface AStockData {
    symbol: string;
    name: string;
    price: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: number;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    try {
        // Call Sina Finance API (free, no API key required)
        // Format: sh600000 for Shanghai, sz000001 for Shenzhen
        const response = await fetch(`https://hq.sinajs.cn/list=${symbol}`, {
            next: { revalidate: 300 }, // Cache for 5 minutes
            headers: {
                'Referer': 'https://finance.sina.com.cn',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stock data');
        }

        const data = await response.text();

        // Parse Sina Finance data format
        // Example: var hq_str_sh600000="浦发银行,8.34,8.36,8.35,8.37,8.31,8.34,8.35,12345678,102345678.00,...";
        const match = data.match(/="(.+)"/);
        if (!match || !match[1]) {
            throw new Error('Invalid data format or market closed');
        }

        const parts = match[1].split(',');

        if (parts.length < 32) {
            throw new Error('Insufficient data fields');
        }

        const name = parts[0];
        const open = parseFloat(parts[1]);
        const previousClose = parseFloat(parts[2]);
        const price = parseFloat(parts[3]); // Current price
        const high = parseFloat(parts[4]);
        const low = parseFloat(parts[5]);
        const volume = parseInt(parts[8]);
        const change = price - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        const stockData: AStockData = {
            symbol,
            name,
            price,
            open,
            high,
            low,
            previousClose,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume,
            timestamp: Date.now(),
        };

        return NextResponse.json(stockData, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        console.error('Error fetching A-stock data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data', symbol },
            { status: 500 }
        );
    }
}
