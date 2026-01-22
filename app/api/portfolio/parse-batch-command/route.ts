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
        commands: parseBatchCommandFallback(text),
        fallback: true
      });
    }

    // 检测是否为批量指令
    const isBatch = /[，,；;]|和|与/.test(text);
    const availableStocks = getStockNameList();

    const systemPrompt = isBatch
      ? `解析批量投资指令为JSON数组。可用股票：${availableStocks.join(', ')}

意图识别（理解语义，不限于关键词）：
- 买入类：买入、购入、买、购买、入手、抄底、建仓、加仓、增持、补仓、追涨
- 卖出类：卖出、卖、出售、减仓、清仓、平仓、止损、止盈、获利了结、离场
- 观望类：观望、自选、关注、加入自选、添加关注

示例：
"购入100股特斯拉" → [{"stockName":"Tesla","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}]
"清仓特斯拉，抄底100股苹果" → [{"stockName":"Tesla","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0},{"stockName":"Apple","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}]

只返回JSON数组。`
      : `解析投资指令为JSON。可用股票：${availableStocks.join(', ')}

意图识别（理解语义）：
- 买入类：买入、购入、买、购买、入手、抄底、建仓、加仓、增持、补仓、追涨
- 卖出类：卖出、卖、出售、减仓、清仓、平仓、止损、止盈、获利了结、离场
- 观望类：观望、自选、关注

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
        commands: parseBatchCommandFallback(text),
        fallback: true
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({
        commands: parseBatchCommandFallback(text),
        fallback: true
      });
    }

    const parsed = JSON.parse(content);
    const commands = Array.isArray(parsed) ? parsed : [parsed];

    // 验证所有股票名称
    const validatedCommands = commands.map((cmd: ParsedCommand) => {
      if (cmd.stockName) {
        const stock = findStockByName(cmd.stockName);
        if (stock) {
          cmd.stockName = stock.name;
        }
      }
      return cmd;
    }).filter((cmd: ParsedCommand) => cmd.stockName);

    return NextResponse.json({ commands: validatedCommands, fallback: false });
  } catch (error) {
    console.error('Error parsing batch command:', error);
    const { text } = await request.json().catch(() => ({ text: '' }));
    return NextResponse.json({
      commands: parseBatchCommandFallback(text),
      fallback: true,
      error: 'Failed to parse'
    });
  }
}

function parseBatchCommandFallback(text: string): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  const segments = text.split(/[，,；;]/).map(s => s.trim());

  for (const segment of segments) {
    const stockPattern = /(特斯拉|tesla|tsla|苹果|apple|aapl|英伟达|nvidia|nvda|微软|microsoft|msft|阿里|alibaba|baba|谷歌|google|goog|亚马逊|amazon|amzn|meta|facebook)/i;
    const stockMatch = segment.match(stockPattern);
    if (!stockMatch) continue;

    const stock = findStockByName(stockMatch[1]);
    if (!stock) continue;

    // 专业词汇识别
    const isBuy = /买入|购买|买|加仓|建仓/.test(segment);
    const isSell = /卖出|出售|卖|减仓|清仓|平仓|止损|止盈/.test(segment);
    const sharesMatch = segment.match(/(\d+)股/);
    const priceMatch = segment.match(/(\d+)元/);

    commands.push({
      stockName: stock.name,
      userIntent: isBuy ? '用户增持' : isSell ? '用户减持' : '用户观望',
      cost: 0,
      time: '今日',
      price: priceMatch ? parseFloat(priceMatch[1]) : 0,
      shares: sharesMatch ? parseFloat(sharesMatch[1]) : 0,
      holdingDays: 0,
    });
  }

  return commands;
}

