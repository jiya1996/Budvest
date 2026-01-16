import { NextRequest, NextResponse } from 'next/server';

interface ParsedCommand {
  stockName: string;
  userIntent: '用户增持' | '用户减持' | '用户观望' | '用户删除' | '用户删除持有' | '用户删除观望' | '用户全部删除' | '用户更新';
  cost: number;
  time: string;
  price: number;
  shares: number;
  holdingDays: number;
  stockNames?: string[]; // 多个股票名称（用于批量删除）
}

export async function POST(request: NextRequest) {
  try {
    const { text, portfolio } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // 如果没有API Key，使用简单的规则匹配作为后备
      return NextResponse.json({ 
        command: parseCommandFallback(''),
        fallback: true 
      });
    }

    // 使用OpenAI API理解指令
    const systemPrompt = `你是一个投资组合管理助手。用户会用自然语言描述投资操作，你需要理解并转化为结构化指令，**尤其要对价格信息和股数信息高度敏感并精确解析**。

可用的股票列表：
${JSON.stringify(portfolio?.map((p: any) => ({ symbol: p.symbol, name: p.name })) || [], null, 2)}

请根据用户的输入，返回JSON格式的指令，包含以下字段：
- stockName: 股票名称（中文或英文，如"特斯拉"、"Tesla"、"TSLA"）
- userIntent: 用户诉求（"用户增持"、"用户减持"、"用户观望"、"用户删除"、"用户更新"等）
- cost: 成本金额（单位：元，总成本 = 每股买卖价格 × 股数。如果没有明确提到则返回0）
- time: 时间描述（"今日"、"昨天"、"30天前"等，如果没有则返回"未知"）
- price: 每股买卖价格（单位：元/股。如果用户说"成本400"、"每股成本400"、"买入价400"、"成交价400"、"均价400"或"400元买入"，这里的400都视为每股买卖价格；如果用户说"花了1000买了100股"，这里的1000是总价，需要计算每股价格=1000/100=10；如果没有明确提到则返回0）
- shares: 股数（如果没有明确提到则返回0）
- holdingDays: 持有天数（如果没有明确提到则返回0）

重要的「价格解析」和「股数解析」规则（务必严格遵守）：
1. **优先识别总价模式，如果识别到总价和股数，自动计算每股价格：**
   - 总价关键词：花了、用了、投入、总价、总成本、总共、一共、合计
   - 总价模式示例："花了1000买了100股" → 总价1000，股数100，每股价格=1000/100=10
   - 总价模式示例："用1000元买了100股" → 总价1000，股数100，每股价格=1000/100=10
   - 总价模式示例："投入1000元，买了100股" → 总价1000，股数100，每股价格=1000/100=10
   - 总价模式示例："总价1000，买了100股" → 总价1000，股数100，每股价格=1000/100=10
2. **如果识别到总价和股数，计算逻辑：**
   - price = 总价 / 股数
   - cost = 总价（直接使用用户说的总价）
   - shares = 股数
3. **如果识别到单价（每股价格）和股数，计算逻辑：**
   - price = 单价
   - cost = 单价 × 股数
   - shares = 股数
4. **以下关键词后出现的数字，都视为「每股买卖价格」（非总价模式）：**
   - 价格类：买入价、卖出价、成交价、买卖价格、价格、单价、均价、成本价、成本、每股成本、每股成本价
   - 表达示例："成本400"、"均价350"、"买入价120美元"、"成交价80港币"
5. **以下表达中紧跟「元 / 块 / 美元 / 港币 / HKD / USD / ¥ / $」的数字，需要根据上下文判断是单价还是总价：**
   - 如果是"X元买入Y股"或"X元买了Y股"且X明显大于Y（例如"400元买入100股"），通常是单价
   - 如果是"花了X买了Y股"或"用X元买了Y股"，通常是总价
   - "400元买入100股" → 单价400（因为400明显小于100股的总价）
   - "花了1000买了100股" → 总价1000（因为"花了"明确表示总价）
6. **股数 shares 的解析规则：**
   - 任何紧跟「股」的数字都应该尽量解析为股数：例如"买了300股"、"卖出50股"、"加仓100股"
   - 出现在「买入/购买/买了/加仓/增持」等动词后面的数字，如果后面跟着"股"，都视为本次买入/增持的股数
   - 出现在「卖出/出售/卖了/减仓/减持」等动词后面的数字，如果后面跟着"股"，都视为本次卖出的股数
   - 如果用户说"买了300股特斯拉"、"卖出200股苹果"，即使没有价格，也必须正确填充 shares（不要保持为0）
7. **总成本 cost 的计算规则：**
   - 如果识别到总价模式：cost = 总价（直接使用）
   - 如果识别到单价模式：cost = price × shares
   - 如果只说了股数没有价格：price=0，shares>0，cost=0（等待前端补充价格）
   - 如果只说了价格没有股数：price>0，shares=0，cost=0

用户诉求类型说明：
- "用户增持"：买入、购买、加仓、增持、添加股票、加入持仓等操作
- "用户减持"：卖出、出售、减仓等操作
- "用户观望"：加入观望、添加到自选等操作
- "用户删除"：删除、移除、去掉、删除股票等操作（通用删除，从持有或观望中移除）
- "用户删除持有"：删除持有中的股票（明确指定删除持有列表中的股票）
- "用户删除观望"：删除观望中的股票（明确指定删除观望列表中的股票）
- "用户全部删除"：删除所有股票（全部清空）
- "用户更新"：更新持有时间、成本等信息

删除指令说明：
- 如果用户说"删除特斯拉"，返回 userIntent="用户删除"，stockName="特斯拉"
- 如果用户说"删除持有中的特斯拉"或"删除持仓中的特斯拉"，返回 userIntent="用户删除持有"，stockName="特斯拉"
- 如果用户说"删除观望中的苹果"或"删除自选中的苹果"，返回 userIntent="用户删除观望"，stockName="苹果"
- 如果用户说"删除特斯拉和苹果"或"删除特斯拉、苹果"，返回 userIntent="用户删除"，stockNames=["特斯拉","苹果"]
- 如果用户说"全部删除"或"清空所有"或"删除全部"，返回 userIntent="用户全部删除"，stockName="全部"

重要提示：
1. 即使指令不完整（缺少价格、股数等信息），只要能够识别出股票名称和用户意图，就应该返回结果
2. 缺失的字段应该返回0（数字类型）或"未知"（字符串类型），而不是null
3. 如果完全无法识别股票名称，才返回null
4. 当用户同时给出「价格」和「总金额」时，以**价格 + 股数**为准重新计算 cost，不要同时使用两个不同来源的金额

示例：
用户："我今天400元买入100股特斯拉"
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":40000,"time":"今日","price":400,"shares":100,"holdingDays":0}

用户："昨天以350元的价格买了50股苹果"
返回：{"stockName":"苹果","userIntent":"用户增持","cost":17500,"time":"昨天","price":350,"shares":50,"holdingDays":0}

用户："买了300股特斯拉"（只有股数，没有价格）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":300,"holdingDays":0}

用户："买了300股特斯拉，成本400"（有股数和每股成本）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":120000,"time":"今日","price":400,"shares":300,"holdingDays":0}

用户："买入100股苹果，成本50元"（有股数和每股成本）
返回：{"stockName":"苹果","userIntent":"用户增持","cost":5000,"time":"今日","price":50,"shares":100,"holdingDays":0}

用户："买入100股苹果"（只有股数，没有价格）
返回：{"stockName":"苹果","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}

用户："以120的价格买入50股英伟达"
返回：{"stockName":"英伟达","userIntent":"用户增持","cost":6000,"time":"今日","price":120,"shares":50,"holdingDays":0}

用户："用80块钱买了20股小米"（这里的80是每股价格，而不是总金额）
返回：{"stockName":"小米","userIntent":"用户增持","cost":1600,"time":"今日","price":80,"shares":20,"holdingDays":0}

用户："花了1000买了100股特斯拉"（总价模式：总价1000，股数100，每股价格=1000/100=10）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":1000,"time":"今日","price":10,"shares":100,"holdingDays":0}

用户："用1000元买了100股苹果"（总价模式：总价1000，股数100，每股价格=1000/100=10）
返回：{"stockName":"苹果","userIntent":"用户增持","cost":1000,"time":"今日","price":10,"shares":100,"holdingDays":0}

用户："投入1000元，买了100股英伟达"（总价模式：总价1000，股数100，每股价格=1000/100=10）
返回：{"stockName":"英伟达","userIntent":"用户增持","cost":1000,"time":"今日","price":10,"shares":100,"holdingDays":0}

用户："我以350的均价加仓了30股特斯拉"
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":10500,"time":"今日","price":350,"shares":30,"holdingDays":0}

用户："把英伟达加入观望"
返回：{"stockName":"英伟达","userIntent":"用户观望","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："买入特斯拉"（不完整指令，缺少价格和股数）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："卖出苹果"（不完整指令，缺少股数）
返回：{"stockName":"苹果","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："删除特斯拉"（删除股票）
返回：{"stockName":"特斯拉","userIntent":"用户删除","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："移除苹果股票"
返回：{"stockName":"苹果","userIntent":"用户删除","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："删除持有中的特斯拉"
返回：{"stockName":"特斯拉","userIntent":"用户删除持有","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："删除观望中的苹果"
返回：{"stockName":"苹果","userIntent":"用户删除观望","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："删除特斯拉和苹果"
返回：{"stockName":"特斯拉","userIntent":"用户删除","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0,"stockNames":["特斯拉","苹果"]}

用户："全部删除"或"清空所有"
返回：{"stockName":"全部","userIntent":"用户全部删除","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："添加英伟达到持仓"
返回：{"stockName":"英伟达","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："我持有特斯拉30天了，成本是35000元"
返回：{"stockName":"特斯拉","userIntent":"用户更新","cost":35000,"time":"今日","price":0,"shares":0,"holdingDays":30}

用户："卖出100股微软"
返回：{"stockName":"微软","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}

只返回JSON，不要其他文字。`;

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
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      // 如果API失败，使用后备解析
      return NextResponse.json({ 
        command: parseCommandFallback(''),
        fallback: true 
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ 
        command: parseCommandFallback(''),
        fallback: true 
      });
    }

    try {
      const command = JSON.parse(content);
      return NextResponse.json({ command, fallback: false });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({ 
        command: parseCommandFallback(''),
        fallback: true 
      });
    }
  } catch (error) {
    console.error('Error parsing command:', error);
    // 即使发生错误，也尝试使用后备解析
    const fallbackCommand = parseCommandFallback('');
    return NextResponse.json(
      { 
        command: fallbackCommand,
        fallback: true,
        error: 'Failed to parse command with AI, using fallback'
      }
    );
  }
}

// 后备解析函数（规则匹配）
function parseCommandFallback(text: string): ParsedCommand | null {
  const lowerText = text.toLowerCase();
  
  // 股票名称映射
  const stockNameMap: Record<string, string> = {
    '特斯拉': '特斯拉',
    'tesla': '特斯拉',
    'tsla': '特斯拉',
    '苹果': '苹果',
    'apple': '苹果',
    'aapl': '苹果',
    '英伟达': '英伟达',
    'nvidia': '英伟达',
    'nvda': '英伟达',
    '微软': '微软',
    'microsoft': '微软',
    'msft': '微软',
    '阿里巴巴': '阿里巴巴',
    'alibaba': '阿里巴巴',
    'baba': '阿里巴巴',
    '谷歌': '谷歌',
    'google': '谷歌',
    'goog': '谷歌',
    '亚马逊': '亚马逊',
    'amazon': '亚马逊',
    'amzn': '亚马逊',
    'meta': 'Meta',
    '脸书': 'Meta',
  };

  // 提取股票名称
  let stockName = '';
  for (const [key, value] of Object.entries(stockNameMap)) {
    if (lowerText.includes(key)) {
      stockName = value;
      break;
    }
  }

  if (!stockName) return null;

  // 买入模式（完整或不完整）
  const buyKeywords = ['买入', '购买', '买了', '加仓', '增持', '买'];
  const hasBuyIntent = buyKeywords.some(keyword => lowerText.includes(keyword));
  
  if (hasBuyIntent) {
    // 模式1: "花了1000买了100股" 或 "用1000元买了100股" 或 "投入1000元，买了100股"（总价模式）
    // 总价关键词：花了、用了、投入、总价、总成本、总共、一共、合计
    const totalPricePattern = /(?:花了|用了|投入|总价|总成本|总共|一共|合计)(\d+(?:\.\d+)?)(?:元|块|美元|港币|HKD|USD|¥|\$)?.*?(?:买了|买入|购买|加仓|增持|买)(\d+)(?:股)/;
    const totalPriceMatch = lowerText.match(totalPricePattern);
    if (totalPriceMatch) {
      const totalCost = parseFloat(totalPriceMatch[1]); // 总价
      const shares = parseFloat(totalPriceMatch[2]); // 股数
      const pricePerShare = shares > 0 ? totalCost / shares : 0; // 每股价格 = 总价 / 股数
      return {
        stockName,
        userIntent: '用户增持' as const,
        cost: totalCost, // 使用总价
        time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
        price: pricePerShare, // 计算出的每股价格
        shares,
        holdingDays: 0,
      };
    }
    
    // 模式2: "买了300股，成本400" 或 "买入100股，成本50元"（有股数和每股成本）
    const sharesWithCostPattern = /(?:买了|买入|购买|加仓|增持|买)(\d+)(?:股).*?(?:成本|每股成本)(?:是|为)?(\d+(?:\.\d+)?)(?:元|块)?/;
    const sharesWithCostMatch = lowerText.match(sharesWithCostPattern);
    if (sharesWithCostMatch) {
      const shares = parseFloat(sharesWithCostMatch[1]);
      const pricePerShare = parseFloat(sharesWithCostMatch[2]); // 每股成本
      const totalCost = pricePerShare * shares; // 总成本 = 每股成本 × 股数
      return {
        stockName,
        userIntent: '用户增持' as const,
        cost: totalCost,
        time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
        price: pricePerShare, // 每股成本
        shares,
        holdingDays: 0,
      };
    }
    
    // 模式3: "买了300股" 或 "买入100股"（只有股数，没有价格和成本）
    const sharesOnlyPattern = /(?:买了|买入|购买|加仓|增持|买)(\d+)(?:股)/;
    const sharesOnlyMatch = lowerText.match(sharesOnlyPattern);
    if (sharesOnlyMatch) {
      const shares = parseFloat(sharesOnlyMatch[1]);
      return {
        stockName,
        userIntent: '用户增持' as const,
        cost: 0,
        time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
        price: 0,
        shares,
        holdingDays: 0,
      };
    }
    
    // 模式4: "400元买入100股" 或 "以350元的价格买了50股"（有单价和股数）
    // 注意：这个模式需要判断是单价还是总价，如果数字明显大于股数，可能是总价
    const buyPattern = /(?:我|今天|刚才)?(?:以|用)?(\d+(?:\.\d+)?)(?:元|块|美元|港币|HKD|USD|¥|\$)?(?:买入|购买|买了|加仓|增持|买)(\d+)?(?:股)?/;
    const buyMatch = lowerText.match(buyPattern);
    if (buyMatch) {
      const firstNumber = parseFloat(buyMatch[1]);
      const shares = buyMatch[2] ? parseFloat(buyMatch[2]) : 0;
      
      // 判断是总价还是单价：
      // 如果数字明显大于股数（例如1000 > 100），且没有单价关键词，可能是总价
      // 如果有"以X元的价格"这种明确表示单价的表达，则是单价
      const hasPriceKeyword = lowerText.includes('价格') || lowerText.includes('单价') || lowerText.includes('成本价');
      const isTotalPrice = !hasPriceKeyword && shares > 0 && firstNumber > shares * 10; // 如果总价明显大于股数的10倍，可能是总价
      
      if (isTotalPrice && shares > 0) {
        // 总价模式
        const pricePerShare = firstNumber / shares;
        return {
          stockName,
          userIntent: '用户增持' as const,
          cost: firstNumber, // 总价
          time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
          price: pricePerShare, // 计算出的每股价格
          shares,
          holdingDays: 0,
        };
      } else {
        // 单价模式
        const cost = shares > 0 ? firstNumber * shares : firstNumber;
        return {
          stockName,
          userIntent: '用户增持' as const,
          cost,
          time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
          price: firstNumber, // 单价
          shares,
          holdingDays: 0,
        };
      }
    }
    
    // 不完整的买入指令，只识别了股票和意图
    return {
      stockName,
      userIntent: '用户增持' as const,
      cost: 0,
      time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
      price: 0,
      shares: 0,
      holdingDays: 0,
    };
  }

  // 卖出模式（完整或不完整）
  const sellKeywords = ['卖出', '出售', '卖了', '减仓', '减持', '卖'];
  const hasSellIntent = sellKeywords.some(keyword => lowerText.includes(keyword));
  
  if (hasSellIntent) {
    const sellPattern = /(?:卖出|出售|卖了|减仓|减持|卖)(\d+)?(?:股)?/;
    const sellMatch = lowerText.match(sellPattern);
    if (sellMatch) {
      const shares = sellMatch[1] ? parseFloat(sellMatch[1]) : 0;
      return {
        stockName,
        userIntent: '用户减持',
        cost: 0,
        time: '今日',
        price: 0,
        shares,
        holdingDays: 0,
      };
    } else {
      // 不完整的卖出指令，只识别了股票和意图
      return {
        stockName,
        userIntent: '用户减持',
        cost: 0,
        time: '今日',
        price: 0,
        shares: 0,
        holdingDays: 0,
      };
    }
  }

  // 删除模式
  const deleteKeywords = ['删除', '移除', '去掉', '删除股票', '移除股票'];
  const hasDeleteIntent = deleteKeywords.some(keyword => lowerText.includes(keyword));
  
  if (hasDeleteIntent) {
    // 检查是否是全部删除
    if (lowerText.includes('全部') || lowerText.includes('所有') || lowerText.includes('清空')) {
      return {
        stockName: '全部',
        userIntent: '用户全部删除',
        cost: 0,
        time: '今日',
        price: 0,
        shares: 0,
        holdingDays: 0,
      };
    }
    
    // 检查是否是删除持有中的股票
    if (lowerText.includes('持有') || lowerText.includes('持仓')) {
      return {
        stockName,
        userIntent: '用户删除持有',
        cost: 0,
        time: '今日',
        price: 0,
        shares: 0,
        holdingDays: 0,
      };
    }
    
    // 检查是否是删除观望中的股票
    if (lowerText.includes('观望') || lowerText.includes('自选')) {
      return {
        stockName,
        userIntent: '用户删除观望',
        cost: 0,
        time: '今日',
        price: 0,
        shares: 0,
        holdingDays: 0,
      };
    }
    
    // 检查是否包含多个股票（用"和"、"、"、"、"分隔）
    const multipleStocksPattern = /(?:删除|移除|去掉)(.+?)(?:股票|股)?$/;
    const multipleMatch = lowerText.match(multipleStocksPattern);
    if (multipleMatch) {
      const stocksText = multipleMatch[1];
      // 尝试分割多个股票名称
      const separators = ['和', '、', ',', '，', '以及'];
      let stockNames: string[] = [stockName];
      
      for (const sep of separators) {
        if (stocksText.includes(sep)) {
          const parts = stocksText.split(sep).map(s => s.trim());
          stockNames = parts.filter(s => s.length > 0);
          break;
        }
      }
      
      // 如果只有一个股票，返回单个删除；如果有多个，返回批量删除
      if (stockNames.length > 1) {
        return {
          stockName: stockNames[0],
          userIntent: '用户删除',
          cost: 0,
          time: '今日',
          price: 0,
          shares: 0,
          holdingDays: 0,
          stockNames: stockNames,
        };
      }
    }
    
    // 普通删除
    return {
      stockName,
      userIntent: '用户删除',
      cost: 0,
      time: '今日',
      price: 0,
      shares: 0,
      holdingDays: 0,
    };
  }
  
  // 添加股票模式（明确说"添加"、"加入持仓"等）
  const addKeywords = ['添加', '加入持仓', '加入投资', '新增'];
  const hasAddIntent = addKeywords.some(keyword => lowerText.includes(keyword));
  if (hasAddIntent) {
    // 尝试提取股数和价格
    const sharesPattern = /(\d+)(?:股)/;
    const sharesMatch = lowerText.match(sharesPattern);
    const shares = sharesMatch ? parseFloat(sharesMatch[1]) : 0;
    
    const pricePattern = /(\d+)(?:元|块)/;
    const priceMatch = lowerText.match(pricePattern);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const cost = shares > 0 && price > 0 ? shares * price : 0;
    
    return {
      stockName,
      userIntent: '用户增持',
      cost,
      time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
      price,
      shares,
      holdingDays: 0,
    };
  }

  // 观望模式
  if (lowerText.includes('观望') || lowerText.includes('自选')) {
    return {
      stockName,
      userIntent: '用户观望',
      cost: 0,
      time: '今日',
      price: 0,
      shares: 0,
      holdingDays: 0,
    };
  }

  // 更新模式
  const updatePattern = /(?:持有|已经持有)(\d+)(?:天|日).*?(?:成本|投入)(?:是|为)?(\d+)(?:元|块)?/;
  const updateMatch = lowerText.match(updatePattern);
  if (updateMatch) {
    const holdingDays = parseFloat(updateMatch[1]);
    const cost = parseFloat(updateMatch[2]);
    return {
      stockName,
      userIntent: '用户更新',
      cost,
      time: '今日',
      price: 0,
      shares: 0,
      holdingDays,
    };
  }

  // 如果识别了股票但没有明确的意图，返回null
  return null;
}


