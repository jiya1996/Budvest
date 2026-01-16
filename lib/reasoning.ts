/**
 * 推理与反思模块
 * 实现 ReAct 推理模式、意图分类和回复反思优化
 */

import OpenAI from 'openai';
import { Guru } from './types';
import { searchKnowledge, formatKnowledgeContext } from './rag';
import { AVAILABLE_TOOLS, getToolDescriptions, executeWithTools, Message as ToolMessage } from './tools';
import { memoryManager, UserProfile, EmotionTrend } from './memory';

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

// ==================== 类型定义 ====================

export interface Intent {
  type: 'emotional_support' | 'knowledge_query' | 'data_request' | 'general_chat' | 'review';
  confidence: number;
  needsTools: boolean;
  needsKnowledge: boolean;
  isComplex: boolean;
  detectedEmotion?: string;
  detectedTopics?: string[];
}

export interface ContextBundle {
  userId: string;
  sessionId: string;
  guru: Guru;
  userProfile: UserProfile | null;
  emotionalTrend: EmotionTrend;
  recentMessages: ToolMessage[];
  relevantKnowledge: string;
}

export interface ReflectionResult {
  isValid: boolean;
  issues: string[];
  improvedResponse?: string;
  suggestions?: string[];
}

// ==================== 意图分类 ====================

const INTENT_CLASSIFICATION_PROMPT = `分析用户消息的意图，返回 JSON 格式：

用户消息：{message}

分析以下几个维度：
1. 主要意图类型：
   - emotional_support: 用户在表达情绪（焦虑、恐惧、沮丧等）或寻求情绪安抚
   - knowledge_query: 用户在询问投资知识、原则、方法论等
   - data_request: 用户在查询具体的股票数据、行情、新闻等
   - review: 用户在做投资复盘或反思
   - general_chat: 一般性聊天或问候

2. 是否需要调用数据工具（查股价、资金流向等）
3. 是否需要检索知识库（大师语录、投资原则等）
4. 是否是复杂问题（需要多步推理）
5. 检测到的情绪（如果有）
6. 讨论的主题标签

返回格式（只返回 JSON，不要其他内容）：
{
  "type": "emotional_support|knowledge_query|data_request|review|general_chat",
  "confidence": 0.0-1.0,
  "needsTools": true|false,
  "needsKnowledge": true|false,
  "isComplex": true|false,
  "detectedEmotion": "anxious|panic|angry|greedy|calm|null",
  "detectedTopics": ["topic1", "topic2"]
}`;

/**
 * 分类用户意图
 */
export async function classifyIntent(message: string): Promise<Intent> {
  // 快速规则检测
  const quickIntent = quickIntentCheck(message);
  if (quickIntent) return quickIntent;

  // 使用 LLM 分类
  try {
    const completion = await getOpenAI()?.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: INTENT_CLASSIFICATION_PROMPT.replace('{message}', message)
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const content = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return {
      type: parsed.type || 'general_chat',
      confidence: parsed.confidence || 0.5,
      needsTools: parsed.needsTools || false,
      needsKnowledge: parsed.needsKnowledge || false,
      isComplex: parsed.isComplex || false,
      detectedEmotion: parsed.detectedEmotion,
      detectedTopics: parsed.detectedTopics || []
    };
  } catch (error) {
    console.error('Intent classification error:', error);
    return {
      type: 'general_chat',
      confidence: 0.5,
      needsTools: false,
      needsKnowledge: false,
      isComplex: false
    };
  }
}

/**
 * 快速规则检测意图
 */
function quickIntentCheck(message: string): Intent | null {
  // 情绪关键词
  const emotionKeywords = ['焦虑', '恐慌', '害怕', '担心', '纠结', '后悔', '亏了', '跌惨', '绿了', '心态崩'];
  const hasEmotion = emotionKeywords.some(k => message.includes(k));

  if (hasEmotion) {
    return {
      type: 'emotional_support',
      confidence: 0.9,
      needsTools: false,
      needsKnowledge: true,
      isComplex: false,
      detectedEmotion: 'anxious'
    };
  }

  // 数据查询关键词
  const dataKeywords = ['股价', '价格', '涨跌', '行情', 'K线', '资金流', '新闻', '公告', '持仓', '盈亏'];
  const needsData = dataKeywords.some(k => message.includes(k));

  if (needsData) {
    return {
      type: 'data_request',
      confidence: 0.85,
      needsTools: true,
      needsKnowledge: false,
      isComplex: false
    };
  }

  // 知识查询关键词
  const knowledgeKeywords = ['怎么', '如何', '什么是', '为什么', '应该', '原则', '方法', '策略'];
  const needsKnowledge = knowledgeKeywords.some(k => message.includes(k));

  if (needsKnowledge) {
    return {
      type: 'knowledge_query',
      confidence: 0.8,
      needsTools: false,
      needsKnowledge: true,
      isComplex: message.length > 50
    };
  }

  return null;
}

// ==================== 上下文构建 ====================

/**
 * 构建完整的对话上下文
 */
export async function buildContextBundle(
  userId: string,
  sessionId: string,
  message: string,
  guru: Guru
): Promise<ContextBundle> {
  // 并行获取各种上下文
  const [userProfile, emotionalTrend, recentMessages, knowledgeResults] = await Promise.all([
    memoryManager.getUserProfile(userId),
    memoryManager.getEmotionalTrend(userId, 7),
    memoryManager.getRecentMessages(sessionId, 6),
    searchKnowledge(message, { guru, topK: 3 })
  ]);

  return {
    userId,
    sessionId,
    guru,
    userProfile,
    emotionalTrend,
    recentMessages: recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    relevantKnowledge: formatKnowledgeContext(knowledgeResults)
  };
}

/**
 * 格式化上下文为 Prompt
 */
export function formatContextPrompt(context: ContextBundle): string {
  const parts: string[] = [];

  // 用户画像
  if (context.userProfile) {
    const profile = context.userProfile;
    if (profile.investmentStyle?.riskTolerance) {
      parts.push(`用户风险偏好: ${profile.investmentStyle.riskTolerance}`);
    }
    if (profile.emotionPatterns?.commonEmotions) {
      const emotions = Object.entries(profile.emotionPatterns.commonEmotions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([e]) => e);
      if (emotions.length > 0) {
        parts.push(`用户常见情绪: ${emotions.join(', ')}`);
      }
    }
  }

  // 情绪趋势
  if (context.emotionalTrend) {
    const trend = context.emotionalTrend;
    parts.push(`近期情绪趋势: ${trend.trend}, 主导情绪: ${trend.dominantEmotion}`);
  }

  // 相关知识
  if (context.relevantKnowledge) {
    parts.push(`\n${context.relevantKnowledge}`);
  }

  return parts.join('\n');
}

// ==================== 反思优化 ====================

const REFLECTION_PROMPT = `作为质量检查员，评估以下 AI 回复的质量。

用户问题：{query}
AI 回复：{response}
大师身份：{guru}

检查标准：
1. 是否符合该大师的说话风格和投资哲学？
2. 是否回答了用户的核心问题？
3. 是否包含具体的买卖建议（这是禁止的！）？
4. 是否有同理心和教育意义？
5. 建议的行动是否可执行？
6. 回复长度是否合适（不超过150字）？

如果发现问题，提供改进后的回复。

返回 JSON 格式：
{
  "isValid": true|false,
  "issues": ["问题1", "问题2"],
  "improvedResponse": "改进后的回复（如果需要）",
  "suggestions": ["改进建议1", "改进建议2"]
}`;

/**
 * 对回复进行反思和优化
 */
export async function reflectOnResponse(
  query: string,
  response: string,
  guru: Guru
): Promise<ReflectionResult> {
  // 快速规则检查
  const quickCheck = quickReflectionCheck(response);
  if (quickCheck && !quickCheck.isValid) {
    return quickCheck;
  }

  try {
    const completion = await getOpenAI()?.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: REFLECTION_PROMPT
            .replace('{query}', query)
            .replace('{response}', response)
            .replace('{guru}', guru)
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    });

    const content = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return {
      isValid: parsed.isValid !== false,
      issues: parsed.issues || [],
      improvedResponse: parsed.improvedResponse,
      suggestions: parsed.suggestions || []
    };
  } catch (error) {
    console.error('Reflection error:', error);
    return { isValid: true, issues: [] };
  }
}

/**
 * 快速规则检查回复质量
 */
function quickReflectionCheck(response: string): ReflectionResult | null {
  const issues: string[] = [];

  // 检查是否包含买卖建议
  const buyKeywords = ['应该买', '建议买入', '可以买', '推荐买', '值得买'];
  const sellKeywords = ['应该卖', '建议卖出', '可以卖', '推荐卖'];

  if (buyKeywords.some(k => response.includes(k))) {
    issues.push('包含具体买入建议');
  }
  if (sellKeywords.some(k => response.includes(k))) {
    issues.push('包含具体卖出建议');
  }

  // 检查长度
  if (response.length > 200) {
    issues.push('回复过长');
  }

  if (issues.length > 0) {
    return { isValid: false, issues };
  }

  return null;
}

// ==================== ReAct 推理 ====================

const REACT_SYSTEM_PROMPT = `你是一个投资导师助手。在回答复杂问题时，你需要：

1. **思考 (Thought)**: 分析用户的问题，确定需要什么信息
2. **行动 (Action)**: 如果需要数据，说明需要调用什么工具
3. **观察 (Observation)**: 分析获得的数据
4. **回答 (Answer)**: 综合所有信息，给出最终回答

可用工具：
{tools}

规则：
- 回答要简洁（不超过120字）
- 不提供具体买卖建议
- 要有同理心和教育意义
- 符合投资大师的风格

{guru_prompt}`;

/**
 * ReAct 推理模式处理复杂问题
 */
export async function reactReasoning(
  query: string,
  context: ContextBundle,
  guruPrompt: string
): Promise<{
  response: string;
  reasoning: string[];
  toolCalls: any[];
}> {
  const systemPrompt = REACT_SYSTEM_PROMPT
    .replace('{tools}', getToolDescriptions())
    .replace('{guru_prompt}', guruPrompt);

  const contextPrompt = formatContextPrompt(context);

  const messages: ToolMessage[] = [
    { role: 'system', content: systemPrompt },
    ...context.recentMessages,
    {
      role: 'user',
      content: contextPrompt ? `${contextPrompt}\n\n用户问题: ${query}` : `用户问题: ${query}`
    }
  ];

  // 使用工具执行
  const { response, toolCalls } = await executeWithTools(messages, context.userId, {
    model: 'gpt-4o',
    maxIterations: 3,
    temperature: 0.5
  });

  // 提取推理过程
  const reasoning = toolCalls.map(tc => `调用 ${tc.tool}: ${JSON.stringify(tc.params)}`);

  return { response, reasoning, toolCalls };
}

// ==================== 一致性检查 ====================

/**
 * 检查多轮对话一致性
 */
export async function checkConsistency(
  recentMessages: ToolMessage[],
  newResponse: string
): Promise<{
  isConsistent: boolean;
  issues: string[];
}> {
  if (recentMessages.length < 2) {
    return { isConsistent: true, issues: [] };
  }

  // 简单的一致性检查：检查是否自相矛盾
  const previousResponses = recentMessages
    .filter(m => m.role === 'assistant')
    .map(m => m.content);

  // 使用简单规则检查
  // 更复杂的一致性检查可以使用 LLM
  const issues: string[] = [];

  // 检查是否在短时间内给出相反的建议
  // 这里可以扩展更多检查逻辑

  return { isConsistent: issues.length === 0, issues };
}

// ==================== 主处理流程 ====================

export interface ProcessingResult {
  response: string;
  emotion: string;
  intent: string;
  reasoning?: string[];
  toolCalls?: any[];
  reflection?: ReflectionResult;
}

/**
 * 处理用户消息的主入口
 */
export async function processUserMessage(
  message: string,
  context: ContextBundle,
  guruPrompt: string
): Promise<ProcessingResult> {
  // 1. 分类意图
  const intent = await classifyIntent(message);

  // 2. 根据意图选择处理路径
  let response: string;
  let reasoning: string[] = [];
  let toolCalls: any[] = [];

  if (intent.needsTools || intent.isComplex) {
    // 复杂问题：使用 ReAct 推理
    const result = await reactReasoning(message, context, guruPrompt);
    response = result.response;
    reasoning = result.reasoning;
    toolCalls = result.toolCalls;
  } else {
    // 简单问题：直接对话
    const contextPrompt = formatContextPrompt(context);
    const messages: ToolMessage[] = [
      { role: 'system', content: guruPrompt },
      ...context.recentMessages,
      {
        role: 'user',
        content: contextPrompt ? `${contextPrompt}\n\n${message}` : message
      }
    ];

    const completion = await getOpenAI()?.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 300
    });

    response = completion.choices[0]?.message?.content || '';
  }

  // 3. 反思优化
  const reflection = await reflectOnResponse(message, response, context.guru);

  if (!reflection.isValid && reflection.improvedResponse) {
    response = reflection.improvedResponse;
  }

  return {
    response,
    emotion: intent.detectedEmotion || 'calm',
    intent: intent.type,
    reasoning,
    toolCalls,
    reflection
  };
}
