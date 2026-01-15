import { NextRequest, NextResponse } from 'next/server';

interface ExchangeRates {
  USDCNY: number; // 美元对人民币
  HKDCNY: number; // 港币对人民币
  CNYCNY: number; // 人民币对人民币（始终为1）
}

// 汇率缓存（1小时更新一次）
let cachedRates: ExchangeRates | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    // 使用免费的汇率API（例如 exchangerate-api.com 或 fixer.io）
    // 这里使用 exchangerate-api.com 的免费版本
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Failed to fetch USD rates');
    }
    
    const data = await response.json();
    const usdToCny = data.rates?.CNY || 7.2; // 默认汇率
    
    // 获取港币汇率
    const hkdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/HKD');
    let hkdToCny = 0.92; // 默认汇率
    if (hkdResponse.ok) {
      const hkdData = await hkdResponse.json();
      hkdToCny = hkdData.rates?.CNY || 0.92;
    }
    
    return {
      USDCNY: usdToCny,
      HKDCNY: hkdToCny,
      CNYCNY: 1,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // 返回默认汇率（如果API失败）
    return {
      USDCNY: 7.2, // 默认美元汇率
      HKDCNY: 0.92, // 默认港币汇率
      CNYCNY: 1,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    
    // 如果缓存有效，直接返回
    if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({ rates: cachedRates });
    }
    
    // 获取新汇率
    const rates = await fetchExchangeRates();
    cachedRates = rates;
    cacheTimestamp = now;
    
    return NextResponse.json({ rates });
  } catch (error) {
    console.error('Exchange rate API error:', error);
    // 返回默认汇率
    return NextResponse.json({
      rates: {
        USDCNY: 7.2,
        HKDCNY: 0.92,
        CNYCNY: 1,
      },
    });
  }
}

