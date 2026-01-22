import { NextRequest, NextResponse } from 'next/server';
import { findStockByName, getStockNameList } from '@/lib/stock-utils';

interface ParsedCommand {
  stockName: string;
  userIntent: '用户增持' | '用户减持' | '用户观望' | '用户删除';
  cost: number;
  time: string;
  price: number;
  shares: number;
  holdingDays: number;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        command: parseCommandFallback(text),
        fallback: true
      });
    }

    const availableStocks = getStockNameList();
    const systemPrompt = `解析投资指令为JSON。可用股票：${availableStocks.join(', ')}

意图识别（理解语义）：
- 买入类：买入、购入、买、购买、入手、抄底、建仓、加仓、增持、补仓、追涨 → "用户增持"
- 卖出类：卖出、卖、出售、减仓、清仓、平仓、止损、止盈、获利了结、离场 → "用户减持"
- 观望类：观望、自选、关注 → "用户观望"
- 删除类：删除、移除 → "用户删除"

价格解析："花了X买Y股" → price=X/Y, cost=X；"X元买Y股" → price=X, cost=X×Y

示例：
"购入100股特斯拉" → {"stockName":"Tesla","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}
"抄底50股苹果" → {"stockName":"Apple","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":50,"holdingDays":0}

只返回JSON。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        command: parseCommandFallback(text),
        fallback: true
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({
        command: parseCommandFallback(text),
        fallback: true
      });
    }

    const command = JSON.parse(content);

    if (command.stockName) {
      const stock = findStockByName(command.stockName);
      if (!stock) {
        return NextResponse.json({
          command: null,
          error: `未找到股票：${command.stockName}`,
          fallback: false
        });
      }
      command.stockName = stock.name;
    }

    return NextResponse.json({ command, fallback: false });
  } catch (error) {
    console.error('Error parsing command:', error);
    const { text } = await request.json().catch(() => ({ text: '' }));
    return NextResponse.json({
      command: parseCommandFallback(text),
      fallback: true,
      error: 'Failed to parse'
    });
  }
}

function parseCommandFallback(text: string): ParsedCommand | null {
  const stockPattern = /(特斯拉|tesla|tsla|苹果|apple|aapl|英伟达|nvidia|nvda|微软|microsoft|msft|阿里|alibaba|baba|谷歌|google|goog|亚马逊|amazon|amzn|meta|facebook)/i;
  const stockMatch = text.match(stockPattern);
  if (!stockMatch) return null;

  const stock = findStockByName(stockMatch[1]);
  if (!stock) return null;

  const isBuy = /买入|购入|买|购买|入手|抄底|建仓|加仓|增持|补仓|追涨/.test(text);
  const isSell = /卖出|卖|出售|减仓|清仓|平仓|止损|止盈|获利了结|离场/.test(text);
  const sharesMatch = text.match(/(\d+)股/);
  const priceMatch = text.match(/(\d+)元/);

  return {
    stockName: stock.name,
    userIntent: isBuy ? '用户增持' : isSell ? '用户减持' : '用户观望',
    cost: 0,
    time: '今日',
    price: priceMatch ? parseFloat(priceMatch[1]) : 0,
    shares: sharesMatch ? parseFloat(sharesMatch[1]) : 0,
    holdingDays: 0,
  };
}
