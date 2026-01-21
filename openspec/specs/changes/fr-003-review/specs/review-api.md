# 复盘 API 契约

**版本**: v1.0
**更新日期**: 2026-01-21
**关联需求**: FR-003 投资心理复盘

---

## 概述

本文档定义投资心理复盘功能的 API 契约，包括复盘记录的创建、查询、AI 总结生成。

---

## API 端点

### POST /api/review

创建新的复盘记录。

#### 请求

**Headers**:
```
Content-Type: application/json
X-User-Id: <user_uuid>
```

**Body**:
```typescript
interface CreateReviewRequest {
  // 必填
  emotion_before: number;        // 对话前情绪 (1-5)
  emotion_after: number;         // 对话后情绪 (1-5)
  action_taken: ReviewAction;    // 决策选择

  // 可选
  reflection?: string;           // 文字备注 (最多 200 字)
  conversation_id?: string;      // 关联的对话 ID
  tags?: string[];               // 标签
  generate_summary?: boolean;    // 是否生成 AI 总结 (默认 true)
}

type ReviewAction = 'lock' | 'add' | 'reduce' | 'clear';
```

**示例请求**:
```json
{
  "emotion_before": 2,
  "emotion_after": 4,
  "action_taken": "lock",
  "reflection": "决定长期持有，不看短期波动",
  "conversation_id": "session_1705812345678_abc123",
  "tags": ["茅台", "长期投资"],
  "generate_summary": true
}
```

#### 响应

**成功 (201)**:
```typescript
interface CreateReviewResponse {
  success: true;
  data: {
    id: string;                  // 复盘记录 ID
    emotion_before: number;
    emotion_after: number;
    emotion_change: number;      // 情绪变化值
    action_taken: ReviewAction;
    reflection: string | null;
    ai_summary: string | null;   // AI 生成的总结
    tags: string[];
    created_at: string;          // ISO 8601 时间戳
  };
}
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "emotion_before": 2,
    "emotion_after": 4,
    "emotion_change": 2,
    "action_taken": "lock",
    "reflection": "决定长期持有，不看短期波动",
    "ai_summary": "你从焦虑(2分)到相对平静(4分)，这是巨大的进步。你选择了锁仓，说明你正在学会控制冲动。继续保持这份理性！",
    "tags": ["茅台", "长期投资"],
    "created_at": "2026-01-21T10:30:00Z"
  }
}
```

---

### GET /api/review

获取复盘记录列表。

#### 请求

**Query Parameters**:
```typescript
interface GetReviewsQuery {
  limit?: number;       // 返回数量，默认 20，最大 100
  offset?: number;      // 偏移量，默认 0
  start_date?: string;  // 开始日期 (YYYY-MM-DD)
  end_date?: string;    // 结束日期 (YYYY-MM-DD)
}
```

**示例请求**:
```
GET /api/review?limit=10&start_date=2026-01-01
```

#### 响应

**成功 (200)**:
```typescript
interface GetReviewsResponse {
  success: true;
  data: {
    reviews: ReviewEntry[];
    total: number;
    has_more: boolean;
  };
}

interface ReviewEntry {
  id: string;
  emotion_before: number;
  emotion_after: number;
  emotion_change: number;
  action_taken: ReviewAction;
  reflection: string | null;
  ai_summary: string | null;
  tags: string[];
  created_at: string;
}
```

---

### GET /api/review/:id

获取单条复盘记录详情。

#### 响应

**成功 (200)**:
```typescript
interface GetReviewDetailResponse {
  success: true;
  data: ReviewEntry;
}
```

**错误 (404)**:
```json
{
  "success": false,
  "error": "REVIEW_NOT_FOUND",
  "message": "复盘记录不存在"
}
```

---

### DELETE /api/review/:id

删除复盘记录。

#### 响应

**成功 (200)**:
```json
{
  "success": true,
  "message": "复盘记录已删除"
}
```

---

### POST /api/review/summary

单独生成 AI 复盘总结（用于补充生成）。

#### 请求

```typescript
interface GenerateSummaryRequest {
  review_id: string;
}
```

#### 响应

```typescript
interface GenerateSummaryResponse {
  success: true;
  data: {
    ai_summary: string;
  };
}
```

---

## 错误码

| HTTP 状态码 | 错误码 | 描述 | 处理建议 |
|------------|--------|------|---------|
| 400 | INVALID_EMOTION | 情绪值不在 1-5 范围 | 检查输入 |
| 400 | INVALID_ACTION | 无效的决策类型 | 使用 lock/add/reduce/clear |
| 400 | REFLECTION_TOO_LONG | 备注超过 200 字 | 缩短备注 |
| 401 | UNAUTHORIZED | 用户未认证 | 跳转登录 |
| 404 | REVIEW_NOT_FOUND | 复盘记录不存在 | 检查 ID |
| 500 | AI_SUMMARY_FAILED | AI 总结生成失败 | 忽略或重试 |

---

## 数据模型

### 数据库 Schema

```sql
CREATE TABLE review_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id VARCHAR(100),
  emotion_before INT NOT NULL CHECK (emotion_before BETWEEN 1 AND 5),
  emotion_after INT NOT NULL CHECK (emotion_after BETWEEN 1 AND 5),
  action_taken VARCHAR(20) NOT NULL CHECK (action_taken IN ('lock', 'add', 'reduce', 'clear')),
  reflection TEXT CHECK (char_length(reflection) <= 200),
  ai_summary TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_review_user_id ON review_entries(user_id);
CREATE INDEX idx_review_created_at ON review_entries(created_at DESC);

-- RLS 策略
ALTER TABLE review_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own reviews"
  ON review_entries FOR ALL
  USING (user_id = auth.uid());
```

### TypeScript 类型

```typescript
// lib/supabase.ts
interface ReviewEntry {
  id: string;
  user_id: string;
  conversation_id: string | null;
  emotion_before: number;
  emotion_after: number;
  action_taken: 'lock' | 'add' | 'reduce' | 'clear';
  reflection: string | null;
  ai_summary: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
```

---

## 决策类型说明

| Action | 中文 | Emoji | 说明 |
|--------|------|-------|------|
| `lock` | 锁仓 | 🔒 | 不操作，保持现有持仓 |
| `add` | 加仓 | 📈 | 增加持仓数量 |
| `reduce` | 减仓 | 📉 | 减少持仓数量 |
| `clear` | 清仓 | 🚫 | 全部卖出 |

---

## AI 总结生成

### Prompt 模板

```typescript
const SUMMARY_PROMPT = `
你是一位温暖的投资心理教练。用户刚完成一次投资复盘：

## 复盘数据
- 对话前情绪：${emotionBefore}/5 分 (${emotionLabel(emotionBefore)})
- 对话后情绪：${emotionAfter}/5 分 (${emotionLabel(emotionAfter)})
- 情绪变化：${emotionChange > 0 ? '+' : ''}${emotionChange} 分
- 决策：${actionLabel(action)}
- 用户备注：${reflection || '无'}

## 要求
请生成一段简短的复盘总结（50字以内），包含：
1. 肯定用户的情绪变化（无论是改善还是保持稳定）
2. 对用户决策的正面解读
3. 一句简短的鼓励

注意：不要给出任何投资建议。
`;

function emotionLabel(value: number): string {
  const labels = ['', '非常焦虑', '焦虑', '一般', '平静', '非常平静'];
  return labels[value] || '';
}

function actionLabel(action: ReviewAction): string {
  const labels = {
    lock: '锁仓（保持不动）',
    add: '加仓',
    reduce: '减仓',
    clear: '清仓'
  };
  return labels[action];
}
```

### 模型配置

| 参数 | 值 |
|------|-----|
| 模型 | gpt-4o-mini |
| Temperature | 0.7 |
| Max Tokens | 100 |

---

## 性能要求

| 指标 | 目标值 |
|------|--------|
| 创建响应时间 (无 AI) | < 500ms |
| 创建响应时间 (含 AI) | < 3000ms |
| 列表查询 (P95) | < 200ms |
| 并发支持 | 50 req/s |

---

**最后更新**: 2026-01-21
