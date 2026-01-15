/**
 * 工具调用模块
 * 定义 Agent 可调用的工具，集成 OpenAI Function Calling
 */

import OpenAI from 'openai';
import {
  getStockRealtime,
  getIndexRealtime,
  getStockNews,
  getStockDaily,
  getFundFlow,
  getMarginTrading,
  getEarningsCalendar
} from './db';

// OpenAI 客户端
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

// 类型定义
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler: (params: any, userId?: string) => Promise<any>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean';
  description?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
}

export interface ToolCallResult {
  tool: string;
  params: any;
  result: any;
  error?: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

// ==================== 工具定义 ====================

export const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'get_stock_price',
    description: '获取股票实时价格、涨跌幅等行情数据。适用于A股（6位数字代码）。',
    parameters: {
      symbol: {
        type: 'string',
        description: '股票代码，如 000001（平安银行）、600519（贵州茅台）',
        required: true
      }
    },
    handler: async (params) => {
      const data = getStockRealtime(params.symbol);
      if (!data || data.length === 0) {
        return { error: `未找到股票 ${params.symbol} 的数据` };
      }
      const stock = data[0];
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        changePct: stock.change_pct,
        volume: stock.volume,
        amount: stock.amount,
        high: stock.high,
        low: stock.low,
        open: stock.open,
        prevClose: stock.prev_close
      };
    }
  },

  {
    name: 'get_stock_kline',
    description: '获取股票历史K线数据，包括开高低收、成交量等。',
    parameters: {
      symbol: {
        type: 'string',
        description: '股票代码',
        required: true
      },
      days: {
        type: 'number',
        description: '获取最近多少天的数据，默认30天',
        default: 30
      }
    },
    handler: async (params) => {
      const days = params.days || 30;
      const data = getStockDaily(params.symbol, days);
      if (!data || data.length === 0) {
        return { error: `未找到股票 ${params.symbol} 的K线数据` };
      }
      return {
        symbol: params.symbol,
        count: data.length,
        data: data.slice(0, 10).map((d: any) => ({
          date: d.trade_date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          changePct: d.change_pct,
          volume: d.volume
        }))
      };
    }
  },

  {
    name: 'get_fund_flow',
    description: '获取股票资金流向数据，包括主力净流入、散户净流入等。',
    parameters: {
      symbol: {
        type: 'string',
        description: '股票代码',
        required: true
      }
    },
    handler: async (params) => {
      const data = getFundFlow(params.symbol, 5);
      if (!data || data.length === 0) {
        return { error: `未找到股票 ${params.symbol} 的资金流向数据` };
      }
      const latest = data[0];
      return {
        symbol: params.symbol,
        date: latest.trade_date,
        mainNetInflow: latest.main_net_inflow,
        smallNetInflow: latest.small_net_inflow,
        mediumNetInflow: latest.medium_net_inflow,
        largeNetInflow: latest.large_net_inflow,
        superLargeNetInflow: latest.super_large_net_inflow,
        recentDays: data.map((d: any) => ({
          date: d.trade_date,
          mainNetInflow: d.main_net_inflow
        }))
      };
    }
  },

  {
    name: 'get_stock_news',
    description: '获取股票相关新闻资讯。',
    parameters: {
      symbol: {
        type: 'string',
        description: '股票代码',
        required: true
      },
      limit: {
        type: 'number',
        description: '获取新闻条数，默认5条',
        default: 5
      }
    },
    handler: async (params) => {
      const limit = params.limit || 5;
      const data = getStockNews(params.symbol, limit);
      if (!data || data.length === 0) {
        return { error: `未找到股票 ${params.symbol} 的相关新闻` };
      }
      return {
        symbol: params.symbol,
        count: data.length,
        news: data.map((n: any) => ({
          title: n.title,
          source: n.source,
          time: n.publish_time
        }))
      };
    }
  },

  {
    name: 'get_market_overview',
    description: '获取市场整体行情概览，包括上证指数、深证成指、创业板指等主要指数。',
    parameters: {},
    handler: async () => {
      const data = getIndexRealtime();
      if (!data || data.length === 0) {
        return { error: '未找到市场指数数据' };
      }
      return {
        indices: data.slice(0, 5).map((idx: any) => ({
          symbol: idx.symbol,
          name: idx.name,
          price: idx.price,
          changePct: idx.change_pct
        }))
      };
    }
  },

  {
    name: 'get_margin_trading',
    description: '获取股票融资融券数据。',
    parameters: {
      symbol: {
        type: 'string',
        description: '股票代码',
        required: true
      }
    },
    handler: async (params) => {
      const data = getMarginTrading(params.symbol, 5);
      if (!data || data.length === 0) {
        return { error: `未找到股票 ${params.symbol} 的融资融券数据，可能该股票不在两融标的范围内` };
      }
      const latest = data[0];
      return {
        symbol: params.symbol,
        date: latest.trade_date,
        marginBalance: latest.margin_balance,
        marginBuy: latest.margin_buy,
        shortBalance: latest.short_balance
      };
    }
  },

  {
    name: 'get_earnings_calendar',
    description: '获取股票财报发布日历和业绩预告。',
    parameters: {
      symbol: {
        type: 'string',
        description: '股票代码（可选，不填则返回近期所有财报）',
        required: false
      }
    },
    handler: async (params) => {
      const data = getEarningsCalendar(params.symbol);
      if (!data || data.length === 0) {
        return { error: params.symbol
          ? `未找到股票 ${params.symbol} 的财报数据`
          : '未找到财报日历数据'
        };
      }
      return {
        count: data.length,
        earnings: data.slice(0, 10).map((e: any) => ({
          symbol: e.symbol,
          name: e.name,
          reportDate: e.report_date,
          reportType: e.report_type
        }))
      };
    }
  },

  {
    name: 'calculate_position_value',
    description: '计算持仓盈亏和当前市值。',
    parameters: {
      symbol: {
        type: 'string',
        description: '股票代码',
        required: true
      },
      shares: {
        type: 'number',
        description: '持有股数',
        required: true
      },
      costPrice: {
        type: 'number',
        description: '成本价',
        required: true
      }
    },
    handler: async (params) => {
      const stockData = getStockRealtime(params.symbol);
      if (!stockData || stockData.length === 0) {
        return { error: `未找到股票 ${params.symbol} 的实时数据` };
      }

      const stock = stockData[0];
      const currentPrice = stock.price || 0;
      const currentValue = currentPrice * params.shares;
      const costValue = params.costPrice * params.shares;
      const pnl = currentValue - costValue;
      const pnlPct = ((currentPrice - params.costPrice) / params.costPrice) * 100;

      return {
        symbol: params.symbol,
        name: stock.name,
        currentPrice,
        shares: params.shares,
        costPrice: params.costPrice,
        currentValue: currentValue.toFixed(2),
        costValue: costValue.toFixed(2),
        pnl: pnl.toFixed(2),
        pnlPct: pnlPct.toFixed(2) + '%',
        status: pnl >= 0 ? '盈利' : '亏损'
      };
    }
  }
];

// ==================== OpenAI Function Calling 集成 ====================

/**
 * 转换工具定义为 OpenAI 格式
 */
export function getOpenAITools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return AVAILABLE_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, param]) => [
            key,
            {
              type: param.type,
              description: param.description,
              ...(param.enum ? { enum: param.enum } : {})
            }
          ])
        ),
        required: Object.entries(tool.parameters)
          .filter(([_, param]) => param.required)
          .map(([key]) => key)
      }
    }
  }));
}

/**
 * 执行单个工具调用
 */
async function executeTool(
  toolName: string,
  params: any,
  userId?: string
): Promise<ToolCallResult> {
  const tool = AVAILABLE_TOOLS.find(t => t.name === toolName);

  if (!tool) {
    return {
      tool: toolName,
      params,
      result: null,
      error: `未知工具: ${toolName}`
    };
  }

  try {
    const result = await tool.handler(params, userId);
    return { tool: toolName, params, result };
  } catch (error) {
    return {
      tool: toolName,
      params,
      result: null,
      error: error instanceof Error ? error.message : '执行失败'
    };
  }
}

/**
 * 带工具调用的对话执行
 */
export async function executeWithTools(
  messages: Message[],
  userId?: string,
  options: {
    model?: string;
    maxIterations?: number;
    temperature?: number;
  } = {}
): Promise<{
  response: string;
  toolCalls: ToolCallResult[];
}> {
  const {
    model = 'gpt-4o',
    maxIterations = 5,
    temperature = 0.7
  } = options;

  const toolCalls: ToolCallResult[] = [];
  const conversationMessages = [...messages];
  let iterations = 0;

  while (iterations < maxIterations) {
    try {
      const completion = await getOpenAI()?.chat.completions.create({
        model,
        messages: conversationMessages as any,
        tools: getOpenAITools(),
        tool_choice: 'auto',
        temperature
      });

      const message = completion.choices[0].message;

      // 如果没有工具调用，返回最终回复
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return {
          response: message.content || '',
          toolCalls
        };
      }

      // 将 assistant 消息加入对话
      conversationMessages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls
      });

      // 执行所有工具调用
      for (const toolCall of message.tool_calls) {
        const params = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, params, userId);

        toolCalls.push(result);

        // 将工具结果加入对话
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result.result || { error: result.error })
        });
      }

      iterations++;
    } catch (error) {
      console.error('Tool execution error:', error);
      return {
        response: '抱歉，在处理您的请求时遇到了问题。',
        toolCalls
      };
    }
  }

  return {
    response: '抱歉，处理过程过于复杂，请尝试简化您的问题。',
    toolCalls
  };
}

/**
 * 获取工具描述文本（用于非 Function Calling 模式）
 */
export function getToolDescriptions(): string {
  return AVAILABLE_TOOLS.map(tool => {
    const params = Object.entries(tool.parameters)
      .map(([key, param]) => `  - ${key}: ${param.description || param.type}${param.required ? ' (必填)' : ''}`)
      .join('\n');

    return `**${tool.name}**: ${tool.description}\n参数:\n${params}`;
  }).join('\n\n');
}

/**
 * 判断用户消息是否需要工具调用
 */
export function shouldUseTool(message: string): boolean {
  const toolKeywords = [
    '价格', '股价', '行情', '涨跌',
    'K线', '历史', '走势',
    '资金', '流入', '流出', '主力',
    '新闻', '消息', '公告',
    '指数', '大盘', '市场',
    '融资', '融券', '两融',
    '财报', '业绩', '预告',
    '持仓', '盈亏', '市值', '成本'
  ];

  return toolKeywords.some(keyword => message.includes(keyword));
}
