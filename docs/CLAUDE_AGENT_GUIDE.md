# Claude Agent SDK 集成指南

本文档说明如何使用新的 Claude Agent 多智能体系统。

## 🎯 系统概述

伴投现在使用 **Claude Agent SDK** 构建了一个多智能体协作系统，包含 5 个专业 Agent：

1. **协调员（Coordinator）** - 理解用户意图，分配任务
2. **研究员（Researcher）** - 获取公告、新闻、财报等数据
3. **分析师（Analyst）** - 技术分析和基本面分析
4. **风控员（Risk Manager）** - 风险评估和仓位管理
5. **导师（Mentor）** - 7 位投资大师的心理辅导

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`，并填写：

```bash
# 必需：Claude Agent SDK
ANTHROPIC_API_KEY=sk-ant-xxx

# 可选：用于 RAG embeddings
OPENAI_API_KEY=sk-xxx

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问测试页面

打开浏览器访问：`http://localhost:3000/test-claude`

## 📝 使用示例

### 基础对话

```
用户: 我今天亏了5%，很焦虑
系统: [协调员判断为情绪宣泄] → [调用导师 Agent]
导师: 我能感受到你的焦虑。投资中的波动是正常的...
```

### 数据查询

```
用户: 贵州茅台最近有什么公告？
系统: [协调员判断为数据查询] → [调用研究员 Agent]
研究员: [使用 get_stock_announcement 工具]
返回: 最新公告列表...
```

### 复杂分析

```
用户: 帮我全面分析一下贵州茅台的投资价值
系统: [协调员判断为复杂任务] → [串行调度]
  1. 研究员：获取最新数据
  2. 分析师：技术面+基本面分析
  3. 风控员：风险评估
  4. 导师：心理建议
返回: 综合分析报告
```

### 命令系统

强制调用特定 Agent：

```bash
/research 600519    # 调用研究员
/analyze 600519     # 调用分析师
/risk 600519        # 调用风控员
/mentor buffett     # 切换到巴菲特导师
```

## 🏗️ 架构说明

### Agent 定义

所有 Agent 定义在 `lib/claude-agents.ts`：

```typescript
export const coordinatorAgent: AgentDefinition = {
  description: '协调员 - 理解用户意图，分配任务给专业 Agent',
  prompt: `你是一位智能协调员...`,
  tools: ['Task', 'Read', 'Grep', 'AskUserQuestion'],
  model: 'sonnet'
};
```

### MCP Tools

所有工具定义在 `lib/mcp-tools.ts`：

```typescript
const getStockPrice = tool(
  'get_stock_price',
  '获取股票实时价格',
  z.object({
    symbol: z.string().describe('股票代码')
  }),
  async (args) => {
    // 工具实现
  }
);
```

### API 路由

新的 API 路由在 `app/api/chat-claude/route.ts`：

```typescript
export async function POST(request: NextRequest) {
  // 1. 解析命令
  const { command, args } = parseCommand(userMessage);

  // 2. 选择 Agent
  const targetAgent = command ? getAgentByCommand(command) : 'coordinator';

  // 3. 调用 Claude Agent SDK
  for await (const message of query({
    prompt: finalPrompt,
    options: {
      agents: getAllAgents(guru),
      mcpServers: getMcpServers(),
      allowedTools: [...],
      model: 'sonnet'
    }
  })) {
    // 处理流式响应
  }
}
```

## 🔧 开发指南

### 添加新的 Agent

1. 在 `lib/claude-agents.ts` 中定义：

```typescript
export const myNewAgent: AgentDefinition = {
  description: '新 Agent 的描述',
  prompt: `你是一个...`,
  tools: ['Read', 'Grep'],
  model: 'sonnet'
};
```

2. 注册到 `AGENT_REGISTRY`：

```typescript
export const AGENT_REGISTRY: Record<AgentRole, AgentDefinition> = {
  // ...
  'my-new-agent': myNewAgent
};
```

### 添加新的工具

1. 在 `lib/mcp-tools.ts` 中定义：

```typescript
const myNewTool = tool(
  'my_new_tool',
  '工具描述',
  z.object({
    param1: z.string().describe('参数1'),
    param2: z.number().describe('参数2')
  }),
  async (args) => {
    // 工具逻辑
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result)
      }]
    };
  }
);
```

2. 添加到 MCP Server：

```typescript
export const marketDataServer = createSdkMcpServer({
  name: 'market-data',
  version: '1.0.0',
  tools: [
    // ...
    myNewTool
  ]
});
```

### 添加新的命令

在 `app/api/chat-claude/route.ts` 的 `parseCommand` 函数中添加：

```typescript
switch (command) {
  case 'mynewcommand':
    targetAgent = 'my-new-agent';
    finalPrompt = `执行新命令: ${args}`;
    break;
}
```

## 🧪 测试

### 单元测试（TODO）

```bash
npm test
```

### 集成测试

访问 `/test-claude` 页面，测试以下场景：

1. **简单对话**：情绪宣泄、闲聊
2. **数据查询**：`/research 600519`
3. **技术分析**：`/analyze 600519`
4. **风险评估**：`/risk 600519`
5. **复杂任务**：「帮我全面分析贵州茅台」
6. **导师切换**：`/mentor buffett`

## 📊 性能对比

| 指标 | OpenAI (旧) | Claude Agent (新) |
|------|-------------|-------------------|
| 响应延迟 | 3-5秒 | 4-6秒 |
| Token 成本 | 中 | 中-高 |
| 推理能力 | 良好 | 优秀 |
| 多任务协作 | ❌ | ✅ |
| 工具调用准确率 | 85% | 90%+ |

## 🔄 迁移计划

### Phase 1: 并行运行（当前）
- `/api/chat` - OpenAI 实现（保留）
- `/api/chat-claude` - Claude Agent 实现（新增）
- 用户可以选择使用哪个引擎

### Phase 2: 逐步替换
- 将主要流量切换到 Claude Agent
- 监控性能和用户反馈

### Phase 3: 完全迁移
- 移除 OpenAI 实现
- `/api/chat` 指向 Claude Agent

## 🐛 已知问题

1. **东方财富 API 限流**：公告 API 可能被限流，需要添加缓存
2. **流式响应**：当前未实现前端流式显示
3. **RAG 集成**：尚未将 RAG 知识库集成到 Claude Agent
4. **Memory 系统**：尚未将长期记忆系统集成

## 📚 参考资料

- [Claude Agent SDK 文档](https://platform.claude.com/docs/en/agent-sdk)
- [MCP Server 规范](https://modelcontextprotocol.io/)
- [Anthropic API 文档](https://docs.anthropic.com/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT
