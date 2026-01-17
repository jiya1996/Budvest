---
name: AI Prompt Engineering Expert
description: Techniques for optimizing LLM prompts, structuring agents, and cost-effective AI implementation.
---
# AI Prompt Engineering Expert Skill

此 Skill 专注于优化与 LLM (特别是 OpenAI GPT-4o-mini) 的交互，涵盖 Prompt 设计、上下文管理、RAG 集成和成本控制。

## 核心原则

1. **明确指令**: 给予模型清晰的角色设定 (Persona) 和任务边界。
2. **结构化输出**: 要求 JSON 或Markdown 格式，便于程序处理。
3. **上下文管理**: 精简历史消息，避免超出 Context Window 且浪费 Token。
4. **思维链 (CoT)**: 对复杂问题，引导模型"一步步思考"。

## 高效 Prompt 模板 (针对 Budvest)

### 1. 角色设定 (System Prompt)

```text
你是一位名为"Investbuddy"的专业投资教育导师。你的目标是帮助投资新手（特别是女性用户）建立正确的理财观念。

你的性格特点：
- 耐心、温暖、鼓励性强。
- 解释概念时通俗易懂，多用生活中的类比（如：把基金比作团购）。
- 避免使用过于晦涩的金融术语，如果必须使用，请立即解释。
- 始终强调风险控制和长期主义。

回复规范：
- 使用 Markdown 格式。
- 语气亲切，可以适当使用 Emoji 🌟。
- 每次回答不要过长，控制在 300 字以内，保持对话感。
- 严禁提供具体的股票买卖建议（如：现在买入 XX 代码）。只提供分析思路和教育内容。
```

### 2. RAG 上下文注入

```text
基于以下参考资料回答用户的问题。如果参考资料不足以回答，请利用你的通用知识，但要标注来源。

参考资料：
---
{context_chunks}
---

用户问题：{user_query}
```

### 3. 数据提取 (JSON Mode)

当需要 AI 分析用户情绪并存入数据库时：

```text
分析用户以下输入的投资情绪和意图。返回纯 JSON 格式：

{
  "emotion": "一种情绪标签 (如：anxious, greedy, confident, confused)",
  "intent": "用户意图 (如：ask_advice, vent_emotion, check_market)",
  "summary": "一句话总结"
}

用户输入：{user_input}
```

## 成本优化策略

1. **模型选择**: 默认使用 `gpt-4o-mini`。它比 GPT-4便宜 20 倍以上，且足以处理大多数 RAG 和对话任务。
2. **Token 限制**: 在 API 调用中设置 `max_tokens` (如 500)，防止模型输出长篇大论。
3. **缓存**: 使用 Redis 缓存常见问题的 AI 回复。
4. **Prompt 精简**: 去除 Prompt 中冗余的修饰词，直接切入重点。

## 调试与评估

- **温度设置 (Temperature)**:
  - `0.2` - `0.5`: 事实性问答、数据提取（更稳定）。
  - `0.7` - `0.9`: 创意写作、闲聊陪伴（更多样）。
- **Bad Case 分析**: 记录用户不满意的回答，迭代 System Prompt 或扩充 RAG 知识库。
