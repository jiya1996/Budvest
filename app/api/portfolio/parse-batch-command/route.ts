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
      ? `你是一个投资组合管理助手。解析批量投资指令为JSON数组。可用股票：${availableStocks.join(', ')}

**批量指令识别规则：**
1. 支持用逗号、分号、"和"、"与"、"还有"等分隔多个操作
2. 支持统一操作多只股票（如"买入特斯拉、苹果、英伟达各100股"）
3. 支持不同操作混合（如"买入100股特斯拉，卖出50股苹果"）
4. 支持批量相同操作（如"买入特斯拉100股、苹果50股、英伟达30股"）

**意图识别（理解语义，不限于关键词）：**
- 买入类：买入、购入、买、购买、入手、抄底、建仓、加仓、增持、补仓、追涨、建仓
- 卖出类：卖出、卖、出售、减仓、清仓、平仓、止损、止盈、获利了结、离场、减持
- 观望类：观望、自选、关注、加入自选、添加关注、关注列表
- 删除类：删除、移除、去掉、清除

**价格和股数解析规则：**
1. 识别每股价格：如"400元买入"、"成本350"、"均价120美元"
2. 识别总价：如"花了1000买了100股"（总价1000，股数100，每股=10）
3. 识别股数：如"买了300股"、"卖出50股"
4. 支持"各X股"表达：如"买入特斯拉、苹果各100股"

**示例：**
输入："购入100股特斯拉"
输出：[{"stockName":"Tesla","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}]

输入："清仓特斯拉，抄底100股苹果"
输出：[{"stockName":"Tesla","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0},{"stockName":"Apple","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}]

输入："买入特斯拉、苹果、英伟达各100股"
输出：[{"stockName":"Tesla","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0},{"stockName":"Apple","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0},{"stockName":"NVIDIA","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}]

输入："以400元买入特斯拉100股，以350元买入苹果50股"
输出：[{"stockName":"Tesla","userIntent":"用户增持","cost":40000,"time":"今日","price":400,"shares":100,"holdingDays":0},{"stockName":"Apple","userIntent":"用户增持","cost":17500,"time":"今日","price":350,"shares":50,"holdingDays":0}]

输入："删除特斯拉和苹果"
输出：[{"stockName":"Tesla","userIntent":"用户删除","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0},{"stockName":"Apple","userIntent":"用户删除","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}]

**重要：**
1. 即使信息不完整（缺价格/股数），也要返回结果，缺失字段填0
2. 必须返回JSON数组格式，即使只有一个操作
3. 股票名称使用英文标准名称（Tesla, Apple, NVIDIA等）

只返回JSON数组，不要其他文字。`
      : `你是一个投资组合管理助手。解析投资指令为JSON。可用股票：${availableStocks.join(', ')}

**意图识别（理解语义）：**
- 买入类：买入、购入、买、购买、入手、抄底、建仓、加仓、增持、补仓、追涨
- 卖出类：卖出、卖、出售、减仓、清仓、平仓、止损、止盈、获利了结、离场
- 观望类：观望、自选、关注
- 删除类：删除、移除、去掉

**示例：**
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

  // 检测"各X股"模式：如"买入特斯拉、苹果各100股"
  const eachSharesPattern = /(.+?)各\s*(\d+)\s*股/;
  const eachMatch = text.match(eachSharesPattern);

  if (eachMatch) {
    const stocksPart = eachMatch[1];
    const shares = parseFloat(eachMatch[2]);
    const isBuy = /买入|购买|买|加仓|建仓|增持/.test(stocksPart);
    const isSell = /卖出|出售|卖|减仓|清仓|平仓|止损|止盈/.test(stocksPart);
    const isDelete = /删除|移除|去掉|清除/.test(stocksPart);

    // 提取所有股票名称
    const stockPattern = /(特斯拉|tesla|tsla|苹果|apple|aapl|英伟达|nvidia|nvda|微软|microsoft|msft|阿里|alibaba|baba|谷歌|google|goog|亚马逊|amazon|amzn|meta|facebook)/gi;
    const stockMatches = stocksPart.matchAll(stockPattern);

    for (const match of stockMatches) {
      const stock = findStockByName(match[1]);
      if (!stock) continue;

      commands.push({
        stockName: stock.name,
        userIntent: isBuy ? '用户增持' : isSell ? '用户减持' : isDelete ? '用户删除' : '用户观望',
        cost: 0,
        time: '今日',
        price: 0,
        shares: isBuy || isSell ? shares : 0,
        holdingDays: 0,
      });
    }

    if (commands.length > 0) return commands;
  }

  // 标准分段解析
  const segments = text.split(/[，,；;和与还有]/).map(s => s.trim()).filter(s => s.length > 0);

  for (const segment of segments) {
    const stockPattern = /(特斯拉|tesla|tsla|苹果|apple|aapl|英伟达|nvidia|nvda|微软|microsoft|msft|阿里|alibaba|baba|谷歌|google|goog|亚马逊|amazon|amzn|meta|facebook)/i;
    const stockMatch = segment.match(stockPattern);
    if (!stockMatch) continue;

    const stock = findStockByName(stockMatch[1]);
    if (!stock) continue;

    // 意图识别
    const isBuy = /买入|购买|买|加仓|建仓|增持|补仓|追涨|抄底/.test(segment);
    const isSell = /卖出|出售|卖|减仓|清仓|平仓|止损|止盈|获利了结|离场/.test(segment);
    const isWatch = /观望|自选|关注/.test(segment);
    const isDelete = /删除|移除|去掉|清除/.test(segment);

    // 提取股数和价格
    const sharesMatch = segment.match(/(\d+)\s*股/);
    const priceMatch = segment.match(/(\d+(?:\.\d+)?)\s*(?:元|块|美元|USD|¥|\$)/);

    const shares = sharesMatch ? parseFloat(sharesMatch[1]) : 0;
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const cost = shares > 0 && price > 0 ? shares * price : 0;

    commands.push({
      stockName: stock.name,
      userIntent: isBuy ? '用户增持' : isSell ? '用户减持' : isDelete ? '用户删除' : isWatch ? '用户观望' : '用户增持',
      cost,
      time: '今日',
      price,
      shares,
      holdingDays: 0,
    });
  }

  return commands;
}

