# AI 对话 API 契约

**版本**: v1.0
**更新日期**: 2026-01-21
**关联需求**: FR-002 AI 情绪教练对话

---

## 概述

本文档定义 AI 情绪教练对话功能的 API 契约，包括请求/响应格式、错误码、安全约束。

---

## API 端点

### POST /api/chat

发送用户消息并获取 AI 回复。

#### 请求

**Headers**:
```
Content-Type: application/json
X-User-Id: <user_uuid>  (可选，用于关联用户)
```

**Body**:
```typescript
interface ChatRequest {
  // 必填
  userMessage: string;           // 用户消息，最大 500 字符

  // 可选 - 上下文
  userGoal?: string;             // 用户投资目标
  selectedGuru?: Guru;           // 选择的导师，默认 'coach'
  watchlistSummary?: string;     // 关注股票摘要
  marketContext?: MarketContext; // 市场上下文
  conversation?: ChatMessage[];  // 历史对话（最近 6 轮）
  sessionId?: string;            // 会话 ID（续接对话时提供）
}

type Guru = 'buffett' | 'soros' | 'dalio' | 'munger' | 'lynch' | 'wood' | 'coach';

interface MarketContext {
  company: CompanyProfile | null;
  news: NewsItem[];
}
```

**示例请求**:
```json
{
  "userMessage": "我的茅台今天跌了5%，好焦虑",
  "selectedGuru": "coach",
  "userGoal": "长期持有，稳定增值",
  "watchlistSummary": "贵州茅台 (600519)",
  "marketContext": {
    "company": {
      "symbol": "600519",
      "companyName": "贵州茅台",
      "industry": "白酒",
      "marketCap": 2000000000000,
      "description": "中国高端白酒龙头企业"
    },
    "news": [
      {
        "title": "茅台Q4财报略低于预期",
        "publishedDate": "2026-01-20"
      }
    ]
  },
  "conversation": [
    {
      "role": "user",
      "content": "今天市场怎么样？"
    },
    {
      "role": "assistant",
      "content": "市场有些波动，你感觉如何？"
    }
  ]
}
```

#### 响应

**成功 (200)**:
```typescript
interface ChatResponse {
  emotion: Emotion;              // 识别的用户情绪
  intent: Intent;                // 识别的用户意图
  safety_level: SafetyLevel;     // 安全等级
  reply: string;                 // AI 回复（最大 120 字）
  suggested_actions: string[];   // 建议行动（1-3 条）
  review_prompt: string;         // 复盘提示（可选）
  tags: string[];                // 相关标签（最多 5 个）
  sessionId: string;             // 会话 ID
}

type Emotion = 'anxious' | 'panic' | 'angry' | 'greedy' | 'calm';
type Intent = 'vent' | 'ask_reason' | 'seek_advice' | 'review' | 'other';
type SafetyLevel = 'low' | 'medium' | 'high';
```

**示例响应**:
```json
{
  "emotion": "anxious",
  "intent": "vent",
  "safety_level": "medium",
  "reply": "我隔着屏幕都感受到了你的不安。市场波动时的焦虑是很正常的。让我们先深呼吸，然后一起理性看看发生了什么。你当初买入茅台的理由是什么？",
  "suggested_actions": [
    "深呼吸几次，放松心情",
    "把当前的想法写下来",
    "暂时离开市场，明天再看"
  ],
  "review_prompt": "记录今天的情绪变化，以及触发情绪的原因",
  "tags": ["情绪管理", "茅台", "长期投资"],
  "sessionId": "session_1705812345678_abc123def"
}
```

**错误 (4xx/5xx)**:
```typescript
interface ErrorResponse {
  error: string;        // 错误类型
  message: string;      // 错误描述
  code?: string;        // 错误码（可选）
}
```

---

## 错误码

| HTTP 状态码 | 错误码 | 描述 | 处理建议 |
|------------|--------|------|---------|
| 400 | INVALID_MESSAGE | userMessage 为空或格式错误 | 检查输入 |
| 400 | MESSAGE_TOO_LONG | 消息超过 500 字符 | 缩短消息 |
| 401 | UNAUTHORIZED | 用户未认证 | 跳转登录 |
| 429 | RATE_LIMIT | 请求频率过高 | 等待后重试 |
| 500 | AI_SERVICE_ERROR | AI 服务异常 | 重试或降级 |
| 500 | PARSE_ERROR | AI 响应解析失败 | 使用默认回复 |
| 503 | SERVICE_UNAVAILABLE | 服务暂时不可用 | 稍后重试 |

---

## 安全约束

### 投资建议过滤

AI 回复**严格禁止**包含以下词语：

```typescript
const FORBIDDEN_ADVICE_WORDS = [
  '建议', '应该', '可以考虑', '不妨', '最好',
  '买入', '卖出', '持有', '观察', '等待', '暂不操作',
  '加仓', '减仓', '止损', '止盈', '清仓',
  '继续持有', '保持观察', '暂时观望'
];
```

如果 AI 生成包含上述词语的回复，后端会自动过滤相关句子。

### 安全等级说明

| 等级 | 含义 | 触发条件 |
|------|------|---------|
| `low` | 高度情绪困扰 | emotion = panic 或 angry |
| `medium` | 正常情绪状态 | emotion = anxious 或 greedy |
| `high` | 平静理性 | emotion = calm |

---

## 数据持久化

### 消息存储

对话消息异步保存到 Supabase `chat_messages` 表：

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  session_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,  -- 'user' | 'assistant'
  content TEXT NOT NULL,
  emotion VARCHAR(20),
  intent VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 会话管理

会话信息存储在 `chat_sessions` 表：

```sql
CREATE TABLE chat_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  guru VARCHAR(20) DEFAULT 'coach',
  emotion_trajectory TEXT[],  -- 情绪轨迹数组
  topics TEXT[],              -- 讨论主题
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 导师 (Guru) 配置

| Guru | 名称 | 风格 |
|------|------|------|
| `buffett` | 沃伦·巴菲特 | 价值投资，长期持有，简单比喻 |
| `soros` | 乔治·索罗斯 | 反身性理论，市场心理分析 |
| `munger` | 查理·芒格 | 多元思维，反向思考，智慧幽默 |
| `dalio` | 雷·达利欧 | 原则驱动，系统化，数据逻辑 |
| `lynch` | 彼得·林奇 | 务实接地气，日常案例 |
| `wood` | 凯茜·伍德 | 创新科技，长期乐观 |
| `coach` | 心理教练 | 温暖共情，情绪管理（默认） |

---

## 性能要求

| 指标 | 目标值 |
|------|--------|
| 响应时间 (P95) | < 3000ms |
| 响应时间 (P50) | < 1500ms |
| 错误率 | < 1% |
| 并发支持 | 100 req/s |

---

## 未来增强 (P1)

### 流式响应

```typescript
// 未来支持 SSE 流式响应
GET /api/chat/stream?sessionId=xxx

// Event Stream
event: token
data: {"token": "我"}

event: token
data: {"token": "能"}

event: done
data: {"emotion": "anxious", "intent": "vent", ...}
```

---

**最后更新**: 2026-01-21
