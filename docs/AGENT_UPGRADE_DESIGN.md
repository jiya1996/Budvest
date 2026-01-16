# 投资大牛对话 Agent 升级方案

## 当前状态分析

### 现有实现 (`app/api/chat/route.ts`)

```
用户输入 → 简单 Prompt → GPT-4o-mini → JSON 输出
```

**当前能力**：
- 7 个大师人设的 System Prompt
- 简单记忆：仅保留最近 6 条对话
- 上下文注入：用户目标、关注股票、市场信息

**缺失能力**：
- 无 RAG 知识库检索
- 无长期记忆
- 无工具调用能力
- 无规划/推理链
- 无反思机制

---

## 升级架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Agent 升级架构                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   用户输入                                                               │
│      │                                                                  │
│      ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                    意图识别 & 路由                           │      │
│   │         (快速分类：情绪倾诉/知识问答/数据查询)                  │      │
│   └─────────────────────────────────────────────────────────────┘      │
│      │                                                                  │
│      ├─────────────┬─────────────┬─────────────┐                       │
│      ▼             ▼             ▼             ▼                       │
│   ┌─────┐     ┌─────────┐   ┌─────────┐   ┌─────────┐                 │
│   │情绪 │     │ RAG     │   │ 工具    │   │ 规划    │                 │
│   │安抚 │     │ 检索    │   │ 调用    │   │ 推理    │                 │
│   └─────┘     └─────────┘   └─────────┘   └─────────┘                 │
│      │             │             │             │                       │
│      └─────────────┴─────────────┴─────────────┘                       │
│                          │                                              │
│                          ▼                                              │
│                   ┌─────────────┐                                       │
│                   │   记忆系统   │                                       │
│                   │ (短期/长期)  │                                       │
│                   └─────────────┘                                       │
│                          │                                              │
│                          ▼                                              │
│                   ┌─────────────┐                                       │
│                   │ 回复生成 &  │                                       │
│                   │ 反思优化    │                                       │
│                   └─────────────┘                                       │
│                          │                                              │
│                          ▼                                              │
│                      最终输出                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 模块详细设计

### 1. RAG 知识库模块

#### 1.1 知识库内容

| 知识类型 | 数据来源 | 向量化方式 | 检索场景 |
|---------|---------|----------|---------|
| 大师语录 | 书籍/演讲整理 | 按语录分块 | 用户提问时引用 |
| 投资案例 | 经典案例库 | 按案例分块 | 分析类似情况 |
| 投资原则 | 各大师理论 | 按原则分块 | 决策建议 |
| 常见问题 | FAQ 整理 | 问答对 | 快速回答 |
| 用户历史 | 用户复盘记录 | 按条目分块 | 个性化建议 |

#### 1.2 技术选型

```typescript
// 向量数据库选项
interface VectorDBOptions {
  // 选项 1: 本地轻量方案 (MVP 推荐)
  local: {
    db: 'SQLite + sqlite-vss',  // SQLite 向量搜索扩展
    embedding: 'text-embedding-3-small',
    pros: '零部署成本，与现有 SQLite 整合',
    cons: '性能有限，最多百万级向量'
  };

  // 选项 2: 云端托管方案
  cloud: {
    db: 'Pinecone | Supabase pgvector',
    embedding: 'text-embedding-3-small',
    pros: '高性能，易扩展',
    cons: '额外成本'
  };
}
```

#### 1.3 数据库表设计

```sql
-- 知识库向量表
CREATE TABLE knowledge_vectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category VARCHAR(50) NOT NULL,      -- guru_quotes, cases, principles, faq
    guru VARCHAR(20),                    -- buffett, soros, munger, etc.
    content TEXT NOT NULL,               -- 原始文本
    embedding BLOB NOT NULL,             -- 向量 (1536维 float32)
    metadata JSON,                       -- 来源、标签等
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建向量索引 (使用 sqlite-vss)
CREATE VIRTUAL TABLE knowledge_vss USING vss0(embedding(1536));
```

#### 1.4 检索流程

```typescript
// lib/rag.ts
async function retrieveRelevantKnowledge(
  query: string,
  guru: Guru,
  topK: number = 5
): Promise<KnowledgeChunk[]> {
  // 1. 生成查询向量
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  // 2. 向量相似度搜索
  const results = await db.prepare(`
    SELECT k.*, v.distance
    FROM knowledge_vectors k
    JOIN knowledge_vss v ON k.rowid = v.rowid
    WHERE v.embedding MATCH ?
      AND (k.guru = ? OR k.guru IS NULL)
    ORDER BY v.distance
    LIMIT ?
  `).all(queryEmbedding, guru, topK);

  // 3. 返回相关知识块
  return results.map(r => ({
    content: r.content,
    category: r.category,
    relevanceScore: 1 - r.distance,
    metadata: JSON.parse(r.metadata)
  }));
}
```

---

### 2. 记忆系统模块

#### 2.1 记忆层次

```
┌─────────────────────────────────────────────────────────────┐
│                       记忆系统架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│   │  工作记忆   │   │  短期记忆   │   │  长期记忆   │     │
│   │ (当前会话)  │   │ (近期会话)  │   │ (用户画像)  │     │
│   └─────────────┘   └─────────────┘   └─────────────┘     │
│         │                 │                 │              │
│    当前对话上下文    最近 N 轮对话      用户投资偏好        │
│    当前情绪状态      情绪变化轨迹       历史决策模式        │
│    当前讨论主题      讨论主题摘要       常见问题类型        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2 数据库表设计

```sql
-- 会话记录表
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    guru VARCHAR(20),
    summary TEXT,                        -- 会话摘要
    emotional_journey JSON,              -- 情绪变化轨迹
    topics JSON,                         -- 讨论主题列表
    UNIQUE(session_id)
);

-- 消息记录表
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(50) NOT NULL,
    role VARCHAR(10) NOT NULL,           -- user, assistant
    content TEXT NOT NULL,
    emotion VARCHAR(20),                 -- 用户情绪
    intent VARCHAR(20),                  -- 用户意图
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    embedding BLOB,                      -- 消息向量 (用于检索相似对话)
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
);

-- 用户画像表
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    investment_style JSON,               -- 投资风格偏好
    risk_tolerance VARCHAR(20),          -- 风险承受能力
    common_emotions JSON,                -- 常见情绪模式
    decision_patterns JSON,              -- 决策模式分析
    favorite_gurus JSON,                 -- 偏好的大师
    learning_progress JSON,              -- 学习进度
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户复盘记录表 (已存在，增强)
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    emotion VARCHAR(20),
    tags JSON,
    ai_insights TEXT,                    -- AI 分析洞察
    embedding BLOB,                      -- 用于相似复盘检索
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.3 记忆管理接口

```typescript
// lib/memory.ts

interface MemoryManager {
  // 工作记忆 (当前会话)
  workingMemory: {
    currentEmotion: Emotion;
    conversationContext: Message[];
    discussionTopics: string[];
  };

  // 短期记忆 (近期会话)
  getRecentSessions(userId: string, days: number): Promise<SessionSummary[]>;
  getEmotionalTrend(userId: string, days: number): Promise<EmotionTrend>;

  // 长期记忆 (用户画像)
  getUserProfile(userId: string): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void>;

  // 记忆整合
  consolidateMemory(userId: string): Promise<void>;  // 定期执行，压缩短期记忆到长期

  // 相关记忆检索
  retrieveSimilarExperiences(
    userId: string,
    currentSituation: string
  ): Promise<RelevantMemory[]>;
}

// 实现示例
async function getRelevantContext(
  userId: string,
  currentMessage: string,
  guru: Guru
): Promise<ContextBundle> {
  const [
    userProfile,
    recentEmotions,
    similarExperiences,
    relevantKnowledge
  ] = await Promise.all([
    memoryManager.getUserProfile(userId),
    memoryManager.getEmotionalTrend(userId, 7),
    memoryManager.retrieveSimilarExperiences(userId, currentMessage),
    retrieveRelevantKnowledge(currentMessage, guru, 3)
  ]);

  return {
    userProfile,
    recentEmotions,
    similarExperiences,
    relevantKnowledge
  };
}
```

---

### 3. 工具调用模块

#### 3.1 可用工具定义

```typescript
// lib/tools.ts

const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'get_stock_price',
    description: '获取股票实时价格和涨跌幅',
    parameters: {
      symbol: { type: 'string', description: '股票代码，如 000001' }
    },
    handler: async (params) => {
      const data = await getStockRealtime(params.symbol);
      return { price: data.price, changePct: data.change_pct, name: data.name };
    }
  },
  {
    name: 'get_stock_kline',
    description: '获取股票历史K线数据',
    parameters: {
      symbol: { type: 'string' },
      days: { type: 'number', default: 30 }
    },
    handler: async (params) => {
      return await getStockDaily(params.symbol, params.days);
    }
  },
  {
    name: 'get_fund_flow',
    description: '获取股票资金流向（主力净流入等）',
    parameters: {
      symbol: { type: 'string' }
    },
    handler: async (params) => {
      return await getFundFlow(params.symbol, 5);
    }
  },
  {
    name: 'get_stock_news',
    description: '获取股票相关新闻',
    parameters: {
      symbol: { type: 'string' },
      limit: { type: 'number', default: 5 }
    },
    handler: async (params) => {
      return await getStockNews(params.symbol, params.limit);
    }
  },
  {
    name: 'get_market_overview',
    description: '获取市场整体行情（大盘指数等）',
    parameters: {},
    handler: async () => {
      return await getIndexRealtime();
    }
  },
  {
    name: 'search_user_reviews',
    description: '搜索用户历史复盘记录',
    parameters: {
      query: { type: 'string' },
      limit: { type: 'number', default: 3 }
    },
    handler: async (params, userId) => {
      return await searchUserReviews(userId, params.query, params.limit);
    }
  },
  {
    name: 'calculate_position_risk',
    description: '计算持仓风险指标',
    parameters: {
      symbol: { type: 'string' },
      shares: { type: 'number' },
      cost: { type: 'number' }
    },
    handler: async (params) => {
      const currentPrice = await getStockRealtime(params.symbol);
      const pnl = (currentPrice.price - params.cost) * params.shares;
      const pnlPct = ((currentPrice.price - params.cost) / params.cost) * 100;
      return { pnl, pnlPct, currentValue: currentPrice.price * params.shares };
    }
  }
];
```

#### 3.2 OpenAI Function Calling 集成

```typescript
// 转换工具定义为 OpenAI 格式
const openAITools = AVAILABLE_TOOLS.map(tool => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters,
      required: Object.keys(tool.parameters).filter(
        k => !tool.parameters[k].default
      )
    }
  }
}));

// 工具调用执行循环
async function executeWithTools(
  messages: Message[],
  userId: string,
  maxIterations: number = 5
): Promise<{ response: string; toolCalls: ToolCallResult[] }> {
  const toolCallResults: ToolCallResult[] = [];
  let iterations = 0;

  while (iterations < maxIterations) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',  // 工具调用推荐使用更强的模型
      messages,
      tools: openAITools,
      tool_choice: 'auto'
    });

    const message = completion.choices[0].message;

    // 如果没有工具调用，返回最终回复
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { response: message.content || '', toolCallResults };
    }

    // 执行工具调用
    messages.push(message);

    for (const toolCall of message.tool_calls) {
      const tool = AVAILABLE_TOOLS.find(t => t.name === toolCall.function.name);
      if (!tool) continue;

      const params = JSON.parse(toolCall.function.arguments);
      const result = await tool.handler(params, userId);

      toolCallResults.push({
        tool: toolCall.function.name,
        params,
        result
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    iterations++;
  }

  return { response: '抱歉，处理过程过于复杂，请简化您的问题。', toolCallResults };
}
```

---

### 4. 规划与推理模块

#### 4.1 ReAct 模式实现

```typescript
// lib/reasoning.ts

interface ThoughtStep {
  thought: string;      // 思考过程
  action?: string;      // 需要执行的动作
  actionInput?: any;    // 动作输入
  observation?: string; // 观察结果
}

const REACT_PROMPT = `你是一个投资导师助手。在回答用户问题前，你需要：

1. **思考 (Thought)**：分析用户的问题，确定需要什么信息
2. **行动 (Action)**：如果需要数据，调用相应工具获取
3. **观察 (Observation)**：分析工具返回的数据
4. **重复**：如果需要更多信息，继续思考和行动
5. **回答 (Answer)**：综合所有信息，给出最终回答

可用工具：
{tools}

输出格式（每一步）：
Thought: [你的思考过程]
Action: [工具名称]
Action Input: [工具参数 JSON]

当你准备好给出最终答案时：
Thought: 我已经收集了足够的信息
Answer: [最终回答]

开始：`;

async function reactReasoning(
  query: string,
  context: ContextBundle,
  guru: Guru
): Promise<ReasoningResult> {
  const thoughts: ThoughtStep[] = [];
  let currentPrompt = REACT_PROMPT.replace('{tools}', formatToolDescriptions());

  const messages: Message[] = [
    { role: 'system', content: currentPrompt },
    { role: 'user', content: formatUserQuery(query, context) }
  ];

  for (let i = 0; i < 5; i++) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.3,  // 较低温度保证推理一致性
      stop: ['\nObservation:']  // 在需要执行工具时停止
    });

    const response = completion.choices[0].message.content || '';

    // 解析思考步骤
    const parsed = parseReActResponse(response);
    thoughts.push(parsed);

    // 如果有最终答案，结束循环
    if (parsed.answer) {
      return { thoughts, finalAnswer: parsed.answer };
    }

    // 执行工具调用
    if (parsed.action && parsed.actionInput) {
      const tool = AVAILABLE_TOOLS.find(t => t.name === parsed.action);
      if (tool) {
        const observation = await tool.handler(parsed.actionInput, context.userId);
        parsed.observation = JSON.stringify(observation);

        // 将结果加入对话
        messages.push({
          role: 'assistant',
          content: response
        });
        messages.push({
          role: 'user',
          content: `Observation: ${parsed.observation}`
        });
      }
    }
  }

  return { thoughts, finalAnswer: '抱歉，我需要更多信息来回答这个问题。' };
}
```

#### 4.2 Plan-and-Execute 模式（复杂任务）

```typescript
// 用于更复杂的多步骤任务
interface ExecutionPlan {
  goal: string;
  steps: PlanStep[];
  currentStep: number;
}

interface PlanStep {
  description: string;
  toolsNeeded: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}

async function planAndExecute(
  complexQuery: string,
  context: ContextBundle
): Promise<ExecutionResult> {
  // 步骤1：生成执行计划
  const plan = await generatePlan(complexQuery, context);

  // 步骤2：逐步执行
  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    step.status = 'in_progress';

    try {
      // 执行当前步骤
      step.result = await executeStep(step, context);
      step.status = 'completed';

      // 检查是否需要调整计划
      const needsReplan = await checkNeedsReplan(plan, i);
      if (needsReplan) {
        plan.steps = await adjustPlan(plan, i, step.result);
      }
    } catch (error) {
      step.status = 'failed';
      // 尝试恢复或跳过
      await handleStepFailure(plan, i, error);
    }
  }

  // 步骤3：综合结果
  return synthesizeResults(plan);
}
```

---

### 5. 反思与优化模块

#### 5.1 自我反思机制

```typescript
// lib/reflection.ts

interface ReflectionResult {
  isValid: boolean;
  issues: string[];
  improvedResponse?: string;
}

async function reflectOnResponse(
  originalQuery: string,
  generatedResponse: string,
  context: ContextBundle,
  guru: Guru
): Promise<ReflectionResult> {
  const reflectionPrompt = `作为质量检查员，评估以下回复：

用户问题：${originalQuery}
生成的回复：${generatedResponse}
大师身份：${guru}

检查标准：
1. 是否符合该大师的说话风格和投资哲学？
2. 是否回答了用户的核心问题？
3. 是否包含具体的买卖建议（这是禁止的）？
4. 是否有同理心和教育意义？
5. 建议的行动是否可执行？
6. 是否存在事实错误？

如果发现问题，请提供改进后的回复。

输出 JSON 格式：
{
  "isValid": true/false,
  "issues": ["问题1", "问题2"],
  "improvedResponse": "改进后的回复（如果需要）"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',  // 反思可以用较小模型
    messages: [{ role: 'user', content: reflectionPrompt }],
    temperature: 0.2
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}
```

#### 5.2 多轮对话一致性检查

```typescript
async function checkConsistency(
  conversationHistory: Message[],
  newResponse: string
): Promise<ConsistencyCheck> {
  // 检查新回复是否与历史对话一致
  const prompt = `检查以下新回复是否与对话历史一致：

对话历史：
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

新回复：${newResponse}

检查：
1. 是否自相矛盾？
2. 是否重复了之前说过的话？
3. 是否遗漏了用户提到的重要信息？

输出 JSON：{ "isConsistent": true/false, "issues": [] }`;

  // ... 执行检查
}
```

---

## 升级后的完整流程

```typescript
// app/api/chat/route.ts (升级版)

export async function POST(request: NextRequest) {
  const { userMessage, selectedGuru, userId, sessionId, ...rest } = await request.json();

  // 1. 意图识别
  const intent = await classifyIntent(userMessage);

  // 2. 获取记忆上下文
  const memoryContext = await getRelevantContext(userId, userMessage, selectedGuru);

  // 3. RAG 检索
  const relevantKnowledge = await retrieveRelevantKnowledge(
    userMessage,
    selectedGuru,
    intent.needsKnowledge ? 5 : 0
  );

  // 4. 根据意图选择处理路径
  let response: ChatResponse;

  if (intent.needsTools) {
    // 工具调用路径
    const { response: toolResponse, toolCalls } = await executeWithTools(
      buildMessages(userMessage, memoryContext, relevantKnowledge, selectedGuru),
      userId
    );
    response = formatToolResponse(toolResponse, toolCalls, selectedGuru);
  } else if (intent.isComplex) {
    // ReAct 推理路径
    const reasoning = await reactReasoning(userMessage, memoryContext, selectedGuru);
    response = formatReasoningResponse(reasoning, selectedGuru);
  } else {
    // 简单对话路径（优化现有逻辑）
    response = await simpleChat(userMessage, memoryContext, relevantKnowledge, selectedGuru);
  }

  // 5. 反思与优化
  const reflection = await reflectOnResponse(userMessage, response.reply, memoryContext, selectedGuru);
  if (!reflection.isValid && reflection.improvedResponse) {
    response.reply = reflection.improvedResponse;
  }

  // 6. 更新记忆
  await memoryManager.saveMessage(sessionId, {
    role: 'user',
    content: userMessage,
    emotion: response.emotion,
    intent: response.intent
  });
  await memoryManager.saveMessage(sessionId, {
    role: 'assistant',
    content: response.reply
  });

  // 7. 异步更新用户画像
  updateUserProfileAsync(userId, response);

  return NextResponse.json(response);
}
```

---

## 实施计划

### 阶段 1：基础设施（必要）
1. 添加数据库表（记忆、知识库向量）
2. 安装 sqlite-vss 扩展
3. 创建 embedding 工具函数

### 阶段 2：记忆系统
1. 实现会话记录存储
2. 实现用户画像更新
3. 实现记忆检索

### 阶段 3：RAG 知识库
1. 准备大师语录数据集
2. 实现向量化入库
3. 实现相似度检索

### 阶段 4：工具调用
1. 定义工具接口
2. 集成 OpenAI Function Calling
3. 实现工具执行循环

### 阶段 5：推理增强
1. 实现 ReAct 模式
2. 实现反思机制
3. 优化整体流程

---

## 文件变更清单

### 需要新建
- `lib/memory.ts` - 记忆管理
- `lib/rag.ts` - RAG 检索
- `lib/tools.ts` - 工具定义
- `lib/reasoning.ts` - 推理模块
- `lib/reflection.ts` - 反思模块
- `lib/intent.ts` - 意图分类
- `data/knowledge/` - 知识库数据目录
- `scripts/seed-knowledge.ts` - 知识库初始化脚本

### 需要修改
- `lib/db.ts` - 添加新表和查询
- `app/api/chat/route.ts` - 主要升级

### 数据准备
- `data/knowledge/guru-quotes.json` - 大师语录
- `data/knowledge/investment-cases.json` - 投资案例
- `data/knowledge/principles.json` - 投资原则

---

## 模型选择建议

| 任务类型 | 推荐模型 | 原因 |
|---------|---------|------|
| 意图分类 | gpt-4o-mini | 简单分类，低成本 |
| 简单对话 | gpt-4o-mini | 成本效益 |
| 工具调用 | gpt-4o | 复杂推理需要更强模型 |
| ReAct 推理 | gpt-4o | 多步推理需要强模型 |
| 反思检查 | gpt-4o-mini | 规则检查，较简单 |
| Embedding | text-embedding-3-small | 性价比高 |

---

## 成本估算（每 1000 次对话）

| 组件 | 调用次数 | 模型 | 估算成本 |
|-----|---------|------|---------|
| 意图分类 | 1000 | gpt-4o-mini | ~$0.30 |
| 简单对话 | 700 | gpt-4o-mini | ~$2.10 |
| 工具调用 | 200 | gpt-4o | ~$3.00 |
| ReAct 推理 | 100 | gpt-4o | ~$2.50 |
| 反思检查 | 300 | gpt-4o-mini | ~$0.45 |
| Embedding | 1000 | embedding-3-small | ~$0.02 |
| **总计** | | | **~$8.37** |

当前简单实现估算：~$1.50/1000 次对话

升级后成本增加约 5-6 倍，但能力提升显著。
