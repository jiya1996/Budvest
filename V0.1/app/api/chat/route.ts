import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatResponse, Guru } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userMessage,
      userGoal,
      selectedGuru,
      watchlistSummary,
      marketContext,
      conversation,
    } = body;

    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // 如果没有API Key，返回模拟响应
      const mockResponses: Record<string, string> = {
        buffett: '记住，投资是一场马拉松，不是短跑。短期的波动就像天气，而长期的趋势才是气候。专注于企业的内在价值，而不是股价的起伏。',
        soros: '市场情绪往往过度反应。当你感到恐惧时，问问自己：这种恐惧是基于事实还是想象？反身性告诉我们，认知和现实相互影响。',
        munger: '反过来想，如果你现在卖出，五年后会后悔吗？避免做蠢事比追求聪明更重要。深呼吸，用清单检查你的决策。',
        dalio: '痛苦加反思等于进步。现在的不确定感是学习的机会。建立你的原则，让系统帮你做决定，而不是情绪。',
        lynch: '问问自己：你真的了解这家公司吗？如果它今天不上市，你还愿意持有吗？做足功课，答案就在细节里。',
        wood: '创新从来不是一帆风顺的。五年后回头看，今天的波动可能微不足道。聚焦长期趋势，相信技术变革的力量。',
        coach: '我能感受到你现在的焦虑。先深呼吸几次，让自己平静下来。记住，情绪是投资决策的最大敌人。我们一起理性分析这个情况。',
      };

      const guru = (selectedGuru as Guru) || 'coach';
      const response: ChatResponse = {
        emotion: 'calm',
        intent: 'seek_advice',
        safety_level: 'medium',
        reply: mockResponses[guru] || mockResponses.coach,
        suggested_actions: ['深呼吸几次，放松心情', '把当前的想法写下来', '暂时离开市场，明天再看'],
        review_prompt: '记录今天的情绪变化，以及触发情绪的原因',
        tags: ['情绪管理', '理性投资'],
      };

      return NextResponse.json(response);
    }

    const systemPrompt = GURU_SYSTEM_PROMPTS[selectedGuru as Guru] || GURU_SYSTEM_PROMPTS.coach;

    const contextInfo = `
用户投资目标: ${userGoal || '未设定'}
关注股票: ${watchlistSummary || '无'}
主要关注: ${marketContext?.company?.companyName || '无'} (${marketContext?.company?.symbol || 'N/A'})
近期新闻数量: ${marketContext?.news?.length || 0}
`;

    const conversationHistory = conversation
      ?.slice(-6)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })) || [];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}

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
2. 如果用户询问买卖建议，转化为关于流程、风险和延迟决策的教育框架
3. 先安抚情绪，然后提供框架，最后建议行动
4. 回复必须富有同理心、支持性和教育意义
5. 建议的行动应该是具体的，5分钟内可完成的
6. 安全等级反映情绪状态：low=高度情绪困扰，high=平静理性`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: `${contextInfo}\n\n用户消息: ${userMessage}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
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

    const response: ChatResponse = {
      emotion: parsed.emotion || 'calm',
      intent: parsed.intent || 'other',
      safety_level: parsed.safety_level || 'medium',
      reply: parsed.reply || '',
      suggested_actions: Array.isArray(parsed.suggested_actions)
        ? parsed.suggested_actions.slice(0, 3)
        : [],
      review_prompt: parsed.review_prompt || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };

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
