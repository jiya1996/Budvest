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
      return NextResponse.json({
        error: 'Text is required',
        message: '请输入有效的指令文本',
        fallback: true,
        command: null
      }, { status: 400 });
    }

    if (text.trim().length === 0) {
      return NextResponse.json({
        error: 'Empty text',
        message: '指令不能为空，请输入您的操作指令',
        fallback: true,
        command: null
      }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // 如果没有API Key，使用简单的规则匹配作为后备
      const fallbackCommand = parseCommandFallback(text);
      if (!fallbackCommand) {
        return NextResponse.json({
          error: 'Unable to parse command',
          message: '无法识别您的指令，请尝试更明确的表达，例如："买入100股特斯拉"',
          fallback: true,
          command: null
        });
      }
      return NextResponse.json({
        command: fallbackCommand,
        fallback: true,
        message: '使用基础解析模式'
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
   - 总价关键词：花了、用了、投入、总价、总成本、总共、一共、合计、花费
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
   - 价格类：买入价、卖出价、成交价、买卖价格、价格、单价、均价、成本价、成本、每股成本、每股成本价、每股价格
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
8. **股数的多种表达方式（高度敏感识别）：**
   - 标准表达：100股、50股、300股
   - 口语化：一百股、五十股、三百股
   - 简化表达：100、50、300（后面跟股票名称）
   - 单位变化：1手（=100股）、2手（=200股）
   - 批量表达：各100股、每只100股
   - 模糊表达：一些、一点、少量（默认为0，需要用户补充）

9. **单价的多种表达方式（高度敏感识别）：**
   - 标准表达：400元、350美元、120港币
   - 简化表达：400、350、120（需要根据上下文判断）
   - 专业表达：成本价400、买入价350、均价120、成交价80
   - 口语化：四百块、三百五、一百二
   - 相对表达：涨了10%、跌了5%（需要结合当前价格计算）

10. **总价的多种表达方式（高度敏感识别）：**
   - 明确表达：花了1000、用了5000、投入10000
   - 专业表达：总成本1000、总价5000、合计10000
   - 口语化：花了一千、用了五千、投了一万
   - 简化表达：1000块钱、5000元钱

11. **增持的多种表达方式（扩展识别）：**
   - 标准词汇：买入、购买、买、购入、增持、加仓
   - 专业词汇：建仓、补仓、抄底、追涨、做多、进场、入场、上车
   - 口语化：搞点、弄点、拿点、入手、买点、加点、补点
   - 隐含意图：看好、有潜力、可以买、值得买、准备买
   - 情绪化：FOMO了、追高了、抄底了、梭哈了

12. **减持的多种表达方式（扩展识别）：**
   - 标准词汇：卖出、出售、卖、减持、减仓
   - 专业词汇：清仓、平仓、止损、止盈、获利了结、离场、出场、下车
   - 口语化：出了、清了、走了、跑了、撤了、溜了
   - 隐含意图：不看好、有风险、可以出、该出了、准备出
   - 情绪化：落袋为安、见好就收、割肉了、跑路了、逃顶了

13. **复杂表达的理解（综合识别）：**
   - "我想加仓特斯拉" → 用户增持（隐含买入意图）
   - "特斯拉可以出了" → 用户减持（口语化卖出）
   - "把苹果清了吧" → 用户减持（口语化清仓）
   - "特斯拉不想要了" → 用户删除
   - "我觉得英伟达不错，先看看" → 用户观望
   - "特斯拉涨了不少，落袋为安" → 用户减持（专业词汇）
   - "苹果跌了，补点仓" → 用户增持（专业词汇）
   - "特斯拉FOMO了，搞点" → 用户增持（情绪化+口语化）
   - "英伟达割肉了" → 用户减持（情绪化）
   - "苹果抄底100股" → 用户增持（专业词汇+股数）
   - "特斯拉追高了50股" → 用户增持（专业词汇+股数）
   - "微软止盈，出了200股" → 用户减持（专业词汇+股数）
   - "谷歌梭哈了" → 用户增持（情绪化，全仓买入）
   - "亚马逊跑路了" → 用户减持（情绪化，全部卖出）

用户诉求类型说明：
- "用户增持"：
  * 标准词汇：买入、购买、买、购入、增持、加仓、添加股票、加入持仓
  * 专业词汇：建仓、补仓、抄底、追涨、做多、进场、入场、上车
  * 口语化：搞点、弄点、拿点、入手、买点、加点、补点
  * 隐含意图：看好、有潜力、可以买、值得买、准备买
  * 情绪化：FOMO了、追高了、抄底了、梭哈了

- "用户减持"：
  * 标准词汇：卖出、出售、卖、减持、减仓
  * 专业词汇：清仓、平仓、止损、止盈、获利了结、离场、出场、下车
  * 口语化：出了、清了、走了、跑了、撤了、溜了
  * 隐含意图：不看好、有风险、可以出、该出了、准备出
  * 情绪化：落袋为安、见好就收、割肉了、跑路了、逃顶了

- "用户观望"：加入观望、添加到自选、关注、先看看、观察、盯着等操作

- "用户删除"：删除、移除、去掉、删除股票、不想要了等操作（通用删除，从持有或观望中移除）

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
5. 理解口语化和隐含的意图，不要只匹配关键词

示例：
用户："我今天400元买入100股特斯拉"
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":40000,"time":"今日","price":400,"shares":100,"holdingDays":0}

用户："昨天以350元的价格买了50股苹果"
返回：{"stockName":"苹果","userIntent":"用户增持","cost":17500,"time":"昨天","price":350,"shares":50,"holdingDays":0}

用户："买了300股特斯拉"（只有股数，没有价格）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":300,"holdingDays":0}

用户："买了300股特斯拉，成本400"（有股数和每股成本）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":120000,"time":"今日","price":400,"shares":300,"holdingDays":0}

用户："花了1000买了100股特斯拉"（总价模式：总价1000，股数100，每股价格=1000/100=10）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":1000,"time":"今日","price":10,"shares":100,"holdingDays":0}

用户："特斯拉抄底100股"（专业词汇+股数）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}

用户："苹果追高了50股"（专业词汇+股数）
返回：{"stockName":"苹果","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":50,"holdingDays":0}

用户："微软止盈，出了200股"（专业词汇+股数）
返回：{"stockName":"微软","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":200,"holdingDays":0}

用户："特斯拉搞点，100股"（口语化+股数）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}

用户："苹果跑了"（口语化卖出）
返回：{"stockName":"苹果","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："英伟达割肉了"（情绪化卖出）
返回：{"stockName":"英伟达","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："谷歌梭哈了"（情绪化全仓买入）
返回：{"stockName":"谷歌","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

用户："特斯拉建仓，400块，100股"（专业词汇+口语化价格+股数）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":40000,"time":"今日","price":400,"shares":100,"holdingDays":0}

用户："苹果补仓50股，成本价350"（专业词汇+股数+专业价格）
返回：{"stockName":"苹果","userIntent":"用户增持","cost":17500,"time":"今日","price":350,"shares":50,"holdingDays":0}

用户："英伟达进场了，花了5000买了50股"（专业词汇+总价模式）
返回：{"stockName":"英伟达","userIntent":"用户增持","cost":5000,"time":"今日","price":100,"shares":50,"holdingDays":0}

用户："微软上车，买了1手"（专业词汇+手数，1手=100股）
返回：{"stockName":"微软","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}

用户："入100手特斯拉"（简洁表达+手数，1手=100股）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":10000,"holdingDays":0}

用户："特斯拉看好，准备买100股"（隐含意图+股数）
返回：{"stockName":"特斯拉","userIntent":"用户增持","cost":0,"time":"今日","price":0,"shares":100,"holdingDays":0}

用户："苹果不看好了，该出了"（隐含意图）
返回：{"stockName":"苹果","userIntent":"用户减持","cost":0,"time":"今日","price":0,"shares":0,"holdingDays":0}

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
      const fallbackCommand = parseCommandFallback(text);
      if (!fallbackCommand) {
        return NextResponse.json({
          error: 'API error and fallback failed',
          message: 'AI服务暂时不可用，且无法识别您的指令。请尝试更明确的表达，例如："买入100股特斯拉，成本400元"',
          fallback: true,
          command: null
        });
      }

      return NextResponse.json({
        command: fallbackCommand,
        fallback: true,
        message: 'AI服务暂时不可用，使用基础解析模式'
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      const fallbackCommand = parseCommandFallback(text);
      if (!fallbackCommand) {
        return NextResponse.json({
          error: 'No response from AI',
          message: 'AI未能理解您的指令，请尝试更明确的表达',
          fallback: true,
          command: null
        });
      }

      return NextResponse.json({
        command: fallbackCommand,
        fallback: true,
        message: 'AI响应为空，使用基础解析模式'
      });
    }

    try {
      const command = JSON.parse(content);

      // 验证解析结果
      if (!command.stockName || command.stockName === 'null') {
        return NextResponse.json({
          error: 'Stock name not recognized',
          message: '无法识别股票名称，请确认您输入的股票名称是否正确',
          fallback: false,
          command: null
        });
      }

      return NextResponse.json({
        command,
        fallback: false,
        message: '指令解析成功'
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);

      const fallbackCommand = parseCommandFallback(text);
      if (!fallbackCommand) {
        return NextResponse.json({
          error: 'Parse error',
          message: 'AI响应格式错误，且无法使用基础解析。请尝试更简单的表达',
          fallback: true,
          command: null
        });
      }

      return NextResponse.json({
        command: fallbackCommand,
        fallback: true,
        message: 'AI响应格式错误，使用基础解析模式'
      });
    }
  } catch (error) {
    console.error('Error parsing command:', error);

    // 即使发生错误，也尝试使用后备解析
    try {
      const { text } = await request.json().catch(() => ({ text: '' }));
      const fallbackCommand = parseCommandFallback(text);

      if (!fallbackCommand) {
        return NextResponse.json({
          error: 'System error',
          message: '系统错误，无法解析指令。请稍后重试或联系支持',
          fallback: true,
          command: null
        }, { status: 500 });
      }

      return NextResponse.json({
        command: fallbackCommand,
        fallback: true,
        error: 'System error, using fallback',
        message: '系统错误，使用基础解析模式'
      });
    } catch (fallbackError) {
      return NextResponse.json({
        error: 'Critical system error',
        message: '系统发生严重错误，请稍后重试',
        fallback: true,
        command: null
      }, { status: 500 });
    }
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
  const buyKeywords = [
    // 标准词汇
    '买入', '购买', '买了', '买', '购入', '增持', '加仓', '入',
    // 专业词汇
    '建仓', '补仓', '抄底', '追涨', '做多', '进场', '入场', '上车',
    // 口语化
    '搞点', '弄点', '拿点', '入手', '买点', '加点', '补点',
    // 隐含意图
    '看好', '有潜力', '可以买', '值得买', '准备买',
    // 情绪化
    'FOMO', 'fomo', '追高', '梭哈'
  ];
  const hasBuyIntent = buyKeywords.some(keyword => lowerText.includes(keyword));
  
  if (hasBuyIntent) {
    // 模式1: "花了1000买了100股" 或 "用1000元买了100股" 或 "投入1000元，买了100股"（总价模式）
    // 总价关键词：花了、用了、投入、总价、总成本、总共、一共、合计
    const totalPricePattern = /(?:花了|用了|投入|总价|总成本|总共|一共|合计)(\d+(?:\.\d+)?)(?:元|块|美元|港币|HKD|USD|¥|\$)?.*?(?:买了|买入|购买|加仓|增持|买|入)(\d+)(?:股)/;
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
    const sharesWithCostPattern = /(?:买了|买入|购买|加仓|增持|买|入)(\d+)(?:股).*?(?:成本|每股成本)(?:是|为)?(\d+(?:\.\d+)?)(?:元|块)?/;
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
    
    // 模式3: "买了300股" 或 "买入100股" 或 "买了1手" 或 "入100手"（只有股数，没有价格和成本）
    const sharesOnlyPattern = /(?:买了|买入|购买|加仓|增持|买|建仓|补仓|抄底|追涨|搞点|弄点|拿点|入手|入)(?:\s*)(\d+)(?:股|手)/;
    const sharesOnlyMatch = lowerText.match(sharesOnlyPattern);
    if (sharesOnlyMatch) {
      let shares = parseFloat(sharesOnlyMatch[1]);
      // 如果是"手"，转换为股数（1手=100股）
      if (lowerText.includes('手')) {
        shares = shares * 100;
      }
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
    const buyPattern = /(?:我|今天|刚才)?(?:以|用)?(\d+(?:\.\d+)?)(?:元|块|美元|港币|HKD|USD|¥|\$)?(?:买入|购买|买了|加仓|增持|买|入)(\d+)?(?:股)?/;
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
  const sellKeywords = [
    // 标准词汇
    '卖出', '出售', '卖了', '卖', '减持', '减仓',
    // 专业词汇
    '清仓', '平仓', '止损', '止盈', '获利了结', '离场', '出场', '下车',
    // 口语化
    '出了', '清了', '走了', '跑了', '撤了', '溜了',
    // 隐含意图
    '不看好', '有风险', '可以出', '该出了', '准备出',
    // 情绪化
    '落袋为安', '见好就收', '割肉', '跑路', '逃顶'
  ];
  const hasSellIntent = sellKeywords.some(keyword => lowerText.includes(keyword));
  
  if (hasSellIntent) {
    const sellPattern = /(?:卖出|出售|卖了|卖|减仓|减持|清仓|平仓|止损|止盈|出了|清了|走了|跑了|撤了|溜了|割肉|跑路)(?:\s*)(\d+)?(?:股|手)?/;
    const sellMatch = lowerText.match(sellPattern);
    if (sellMatch) {
      let shares = sellMatch[1] ? parseFloat(sellMatch[1]) : 0;
      // 如果是"手"，转换为股数（1手=100股）
      if (lowerText.includes('手') && shares > 0) {
        shares = shares * 100;
      }
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



