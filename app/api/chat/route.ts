import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatResponse, Guru } from '@/lib/types';
import { memoryManager } from '@/lib/memory';
import { searchKnowledge, formatKnowledgeContext } from '@/lib/rag';
import { shouldUseTool, executeWithTools, Message } from '@/lib/tools';
import { classifyIntent, buildContextBundle, reflectOnResponse, formatContextPrompt } from '@/lib/reasoning';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 初始化表（仅在服务启动时执行一次）
let tablesInitialized = false;
function ensureTablesInitialized() {
  if (!tablesInitialized) {
    try {
      // Supabase tables are managed via migrations, no need to init here
      tablesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize tables:', error);
    }

    // Asynchronously seed knowledge (fire and forget)
    import('@/lib/rag').then(({ seedInitialKnowledge }) => {
      seedInitialKnowledge().catch(e => console.error('Background seeding failed:', e));
    });
  }
}

// 禁止的操作建议词语
const FORBIDDEN_ADVICE_WORDS = [
  '建议', '应该', '可以考虑', '不妨', '最好',
  '买入', '卖出', '持有', '观察', '等待', '暂不操作',
  '加仓', '减仓', '止损', '止盈', '清仓',
  '继续持有', '保持观察', '暂时观望'
];

/**
 * 过滤回复中的操作建议
 */
function filterAdvice(text: string): string {
  let filtered = text;

  // 检查是否包含禁止词语
  for (const word of FORBIDDEN_ADVICE_WORDS) {
    if (filtered.includes(word)) {
      // 如果包含建议性词语，尝试移除包含这些词语的句子
      const sentences = filtered.split(/[。！？]/);
      filtered = sentences
        .filter(sentence => !FORBIDDEN_ADVICE_WORDS.some(w => sentence.includes(w)))
        .join('。') + '。';
      break;
    }
  }

  return filtered.trim();
}

const GURU_SYSTEM_PROMPTS: Record<Guru, string> = {
  buffett: `你是沃伦·巴菲特，价值投资之父。你的投资哲学：
- 以合理价格买入优秀企业，长期持有
- 关注企业内在价值和基本面
- 耐心等待，避免市场时机选择
- 情绪控制是成功投资的关键
- "别人恐惧我贪婪，别人贪婪我恐惧"

说话风格：
- 使用简单易懂的比喻
- 经常引用自己的投资原则
- 鼓励长期思维
- 用幽默化解焦虑
- 永远不会给出具体买卖建议`,

  soros: `你是乔治·索罗斯，反身性理论创始人。你的投资哲学：
- 市场永远是错的，反身性是核心
- 顺势而为，但要警惕趋势反转
- 市场参与者的认知会影响基本面
- 控制风险比追求收益更重要
- 当发现错误时，勇于改正

说话风格：
- 思维深邃，善于分析市场心理
- 强调认知偏差和自我反思
- 关注宏观趋势和系统性风险
- 鼓励用户审视自己的投资逻辑
- 永远不会给出具体买卖建议`,

  munger: `你是查理·芒格，巴菲特的搭档。你的投资哲学：
- 多元思维模型，跨学科思考
- 反过来想，总是反过来想
- 只在能力圈内行动
- 避免愚蠢比追求聪明更重要
- 用清单对抗认知偏差

说话风格：
- 智慧幽默，善于使用反讽
- 经常引用跨学科的例子
- 直接指出问题所在
- 鼓励用户拓展思维边界
- 永远不会给出具体买卖建议`,

  dalio: `你是雷·达利欧，桥水基金创始人。你的投资哲学：
- 资产配置和风险平价
- 理解经济周期和市场规律
- 原则驱动的系统化投资
- 痛苦+反思=进步
- 全天候投资组合思维

说话风格：
- 系统化思维，条理清晰
- 强调原则和框架
- 鼓励记录和复盘
- 用数据和逻辑说话
- 永远不会给出具体买卖建议`,

  lynch: `你是彼得·林奇，传奇基金经理。你的投资哲学：
- 买你了解的公司
- 在日常生活中发现投资机会
- 寻找"十倍股"的潜力
- 做足功课，了解公司业务
- 分散投资，但不过度分散

说话风格：
- 务实接地气，贴近生活
- 用日常案例解释投资
- 鼓励用户观察身边的机会
- 强调基本面研究
- 永远不会给出具体买卖建议`,

  wood: `你是凯茜·伍德（木头姐），ARK基金创始人。你的投资哲学：
- 聚焦颠覆性创新
- 长期思维，5年投资视角
- 技术变革创造巨大机会
- 波动是机会，不是风险
- 相信指数级增长

说话风格：
- 充满热情和乐观
- 关注科技和创新趋势
- 用未来视角看待当前波动
- 鼓励用户理解技术变革
- 永远不会给出具体买卖建议`,

  coach: `你是一位投资心理教练。你的关注重点：
- 情绪管理和行为金融
- 理性决策框架
- 压力管理和情绪调节
- 从经验中学习（复盘反思）
- 建立健康的投资心态

说话风格：
- 温暖有同理心
- 先安抚情绪，再分析问题
- 帮助用户认识自己的情绪
- 提供可操作的建议
- 永远不会给出具体买卖建议`,
};

// 生成会话ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 生成用户ID（简化版，实际应该从认证系统获取）
function getUserId(request: NextRequest): string {
  // 尝试从 header 或 cookie 获取用户 ID
  const userId = request.headers.get('x-user-id') || 'anonymous';
  return userId;
}

export async function POST(request: NextRequest) {
  ensureTablesInitialized();

  try {
    const body = await request.json();
    const {
      userMessage,
      userGoal,
      selectedGuru,
      watchlistSummary,
      marketContext,
      conversation,
      sessionId: existingSessionId,
    } = body;

    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const guru = (selectedGuru as Guru) || 'coach';
    const userId = getUserId(request);
    const sessionId = existingSessionId || generateSessionId();

    // 如果没有 API Key，返回模拟响应
    if (!apiKey) {
      const mockResponses: Record<string, string> = {
        buffett: '记住，投资是一场马拉松，不是短跑。短期的波动就像天气，而长期的趋势才是气候。专注于企业的内在价值，而不是股价的起伏。',
        soros: '市场情绪往往过度反应。当你感到恐惧时，问问自己：这种恐惧是基于事实还是想象？反身性告诉我们，认知和现实相互影响。',
        munger: '反过来想，如果你现在卖出，五年后会后悔吗？避免做蠢事比追求聪明更重要。深呼吸，用清单检查你的决策。',
        dalio: '痛苦加反思等于进步。现在的不确定感是学习的机会。建立你的原则，让系统帮你做决定，而不是情绪。',
        lynch: '问问自己：你真的了解这家公司吗？如果它今天不上市，你还愿意持有吗？做足功课，答案就在细节里。',
        wood: '创新从来不是一帆风顺的。五年后回头看，今天的波动可能微不足道。聚焦长期趋势，相信技术变革的力量。',
        coach: '我能感受到你现在的焦虑。先深呼吸几次，让自己平静下来。记住，情绪是投资决策的最大敌人。我们一起理性分析这个情况。',
      };

      const response: ChatResponse = {
        emotion: 'calm',
        intent: 'seek_advice',
        safety_level: 'medium',
        reply: mockResponses[guru] || mockResponses.coach,
        suggested_actions: ['深呼吸几次，放松心情', '把当前的想法写下来', '暂时离开市场，明天再看'],
        review_prompt: '记录今天的情绪变化，以及触发情绪的原因',
        tags: ['情绪管理', '理性投资'],
        sessionId,
      };

      return NextResponse.json(response);
    }

    // ==================== 升级版 Agent 流程 ====================

    // 1. 意图分类
    const intent = await classifyIntent(userMessage);

    // 2. 获取相关知识（如果需要）
    let knowledgeContext = '';
    if (intent.needsKnowledge) {
      const knowledgeResults = await searchKnowledge(userMessage, { guru, topK: 3 });
      knowledgeContext = formatKnowledgeContext(knowledgeResults);
    }

    // 3. 构建上下文
    const contextInfo = `
用户投资目标: ${userGoal || '未设定'}
关注股票: ${watchlistSummary || '无'}
主要关注: ${marketContext?.company?.companyName || '无'} (${marketContext?.company?.symbol || 'N/A'})
近期新闻数量: ${marketContext?.news?.length || 0}
${knowledgeContext ? `\n${knowledgeContext}` : ''}
`;

    // 4. 处理对话历史
    const conversationHistory = conversation
      ?.slice(-6)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })) || [];

    // 5. 构建系统提示
    const systemPrompt = GURU_SYSTEM_PROMPTS[guru];
    const fullSystemPrompt = `${systemPrompt}

你的回复必须是一个有效的JSON对象，格式如下（不要使用markdown，不要使用代码块，只需纯JSON）：
{
  "emotion": "anxious" | "panic" | "angry" | "greedy" | "calm",
  "intent": "vent" | "ask_reason" | "seek_advice" | "review" | "other",
  "safety_level": "low" | "medium" | "high",
  "reply": "字符串（最多120字，中文，温暖且有教育意义，不提供具体买卖建议）",
  "suggested_actions": ["字符串", "字符串", "字符串"]（1-3条，5分钟内可完成的行动建议，中文）,
  "review_prompt": "字符串（建议的复盘写作提示，中文，可选）",
  "tags": ["字符串", "字符串"]（相关标签，中文）
}

规则：
1. 必须只返回有效的JSON格式
2. 严格禁止任何操作建议：不得使用"买入"、"卖出"、"持有"、"观察"、"等待"、"暂不操作"、"加仓"、"减仓"等任何暗示操作的词语
3. 如果用户询问买卖建议，转化为关于流程、风险和延迟决策的教育框架，帮助用户建立自己的决策体系
4. 先安抚情绪，然后提供分析框架，最后建议非操作性的行动（如记录、学习、复盘）
5. 回复必须富有同理心、支持性和教育意义
6. suggested_actions只能是非操作性的行动：记录想法、查看数据、复盘反思、学习知识等
7. 安全等级反映情绪状态：low=高度情绪困扰，high=平静理性`;

    // 6. 判断是否需要工具调用
    let reply = '';
    let toolCallInfo = '';

    if (intent.needsTools && shouldUseTool(userMessage)) {
      // 使用工具调用处理数据查询
      const messages: Message[] = [
        { role: 'system', content: `你是一个投资助手，可以查询股票数据。${systemPrompt}` },
        ...conversationHistory,
        { role: 'user', content: `${contextInfo}\n\n用户消息: ${userMessage}` }
      ];

      try {
        const { response, toolCalls } = await executeWithTools(messages, userId, {
          model: 'gpt-4o',
          maxIterations: 3
        });

        if (toolCalls.length > 0) {
          toolCallInfo = `\n\n[已查询数据: ${toolCalls.map(tc => tc.tool).join(', ')}]`;
        }

        // 如果工具调用返回了有效回复，使用它
        if (response) {
          reply = response;
        }
      } catch (error) {
        console.error('Tool execution error:', error);
      }
    }

    // 7. 如果没有工具调用结果，使用常规对话
    if (!reply) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...conversationHistory,
          { role: 'user', content: `${contextInfo}\n\n用户消息: ${userMessage}` },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // 解析 JSON 响应
      let parsed: ChatResponse;
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', content);
        parsed = {
          emotion: 'calm',
          intent: 'other',
          safety_level: 'medium',
          reply: '抱歉，我刚才的理解出现了问题。你能再详细描述一下你的情况吗？',
          suggested_actions: ['深呼吸几次，放松心情', '记录下当前的想法'],
          review_prompt: '',
          tags: [],
        };
      }

      // 8. 反思检查（可选，用于提高质量）
      if (parsed.reply) {
        const reflection = await reflectOnResponse(userMessage, parsed.reply, guru);
        if (!reflection.isValid && reflection.improvedResponse) {
          parsed.reply = reflection.improvedResponse;
        }
      }

      // 9. 过滤操作建议（强制执行）
      if (parsed.reply) {
        parsed.reply = filterAdvice(parsed.reply);
      }

      const response: ChatResponse = {
        emotion: parsed.emotion || 'calm',
        intent: parsed.intent || 'other',
        safety_level: parsed.safety_level || 'medium',
        reply: (parsed.reply || '') + toolCallInfo,
        suggested_actions: Array.isArray(parsed.suggested_actions)
          ? parsed.suggested_actions.slice(0, 3)
          : [],
        review_prompt: parsed.review_prompt || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
        sessionId,
      };

      // 9. 保存消息到记忆（异步，不阻塞响应）
      saveMessagesAsync(sessionId, userMessage, response, guru);

      return NextResponse.json(response);
    }

    // 工具调用模式的响应
    const response: ChatResponse = {
      emotion: intent.detectedEmotion || 'calm',
      intent: intent.type === 'data_request' ? 'ask_reason' : 'seek_advice',
      safety_level: 'medium',
      reply: reply + toolCallInfo,
      suggested_actions: ['查看更多相关数据', '记录分析结果', '持续关注变化'],
      review_prompt: '记录今天的市场观察和分析',
      tags: intent.detectedTopics || ['数据分析'],
      sessionId,
    };

    // 保存消息到记忆
    saveMessagesAsync(sessionId, userMessage, response, guru);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 异步保存消息（不阻塞主响应）
async function saveMessagesAsync(
  sessionId: string,
  userMessage: string,
  response: ChatResponse,
  guru: Guru
): Promise<void> {
  try {
    // 保存用户消息
    await memoryManager.saveMessage({
      sessionId,
      role: 'user',
      content: userMessage,
      emotion: response.emotion,
      intent: response.intent
    });

    // 保存助手回复
    await memoryManager.saveMessage({
      sessionId,
      role: 'assistant',
      content: response.reply
    });

    // 更新会话情绪轨迹
    await memoryManager.updateSessionEmotion(sessionId, response.emotion);

    // 更新会话主题
    if (response.tags && response.tags.length > 0) {
      await memoryManager.updateSessionTopics(sessionId, response.tags);
    }
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}
