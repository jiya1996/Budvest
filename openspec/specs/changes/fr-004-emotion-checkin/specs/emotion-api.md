# 情绪打卡 API 规范

**版本**: v1.0
**更新日期**: 2026-01-21
**关联需求**: FR-004 每日情绪打卡

---

## 概述

本文档定义情绪打卡功能的 API 契约，包括打卡记录和趋势查询两个端点。

---

## API 端点

### 1. POST /api/emotion-checkin

记录用户当日情绪。

#### 请求

```typescript
// Headers
{
  "Content-Type": "application/json"
}

// Body
{
  "user_id": string,      // 用户 ID（Guest UUID 或认证用户 ID）
  "emotion": Emotion,     // 情绪类型
  "date"?: string         // 可选，日期（YYYY-MM-DD），默认当天
}

// Emotion 类型
type Emotion = 'anxious' | 'panic' | 'angry' | 'greedy' | 'calm';
```

#### 响应

**成功 (200)**:
```typescript
{
  "success": true,
  "data": {
    "id": string,           // 记录 ID
    "user_id": string,
    "date": string,         // YYYY-MM-DD
    "emotion": Emotion,
    "ai_insight": string | null,
    "created_at": string    // ISO 8601
  },
  "isNew": boolean          // true = 新增，false = 更新
}
```

**错误 (400)**:
```typescript
// 参数缺失
{
  "error": "user_id is required"
}

// 无效情绪
{
  "error": "emotion must be one of: anxious, panic, angry, greedy, calm"
}

// 过去日期锁定 (AC-004.3)
{
  "error": "无法修改过去的打卡记录",
  "code": "PAST_DATE_LOCKED"
}

// 未来日期
{
  "error": "无法打卡未来日期",
  "code": "FUTURE_DATE"
}
```

**错误 (500)**:
```typescript
{
  "error": "服务器错误",
  "details": string
}
```

#### 业务规则

| 规则 | 描述 | AC 引用 |
|------|------|--------|
| 当天覆盖 | 同一天多次打卡，后者覆盖前者 | AC-004.3 |
| 次日锁定 | 过去日期的记录无法修改 | AC-004.3 |
| 时区处理 | 使用中国时区（UTC+8）判断日期 | - |

---

### 2. GET /api/emotion-checkin

获取当天打卡状态。

#### 请求

```
GET /api/emotion-checkin?user_id={user_id}
```

#### 响应

**成功 (200)**:
```typescript
{
  "hasCheckedIn": boolean,
  "data": EmotionLog | null,
  "date": string            // 当前日期 YYYY-MM-DD
}
```

---

### 3. GET /api/emotion/trend

获取情绪趋势数据。

#### 请求

```
GET /api/emotion/trend?user_id={user_id}&days={days}
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| user_id | string | 是 | - | 用户 ID |
| days | number | 否 | 7 | 查询天数（1-30） |

#### 响应

**成功 (200)**:
```typescript
{
  "success": true,
  "data": {
    "points": EmotionTrendPoint[],
    "summary": {
      "totalDays": number,           // 查询天数
      "checkedInDays": number,       // 已打卡天数
      "dominantEmotion": Emotion | null,  // 主导情绪
      "averageValue": number | null,      // 平均情绪值（1-5）
      "trend": TrendType                  // 趋势
    }
  }
}

// 趋势点
interface EmotionTrendPoint {
  date: string;           // YYYY-MM-DD
  emotion: Emotion | null;
  value: number | null;   // 1-5，null 表示未打卡
  color: string;          // 颜色代码
  label: string;          // 中文标签
  emoji: string;          // Emoji
}

// 趋势类型
type TrendType = 'improving' | 'stable' | 'declining' | 'unknown';
```

#### 情绪值映射

| Emotion | Value | Color | Label | Emoji |
|---------|-------|-------|-------|-------|
| panic | 1 | #EF4444 | 恐慌 | 😱 |
| anxious | 2 | #F97316 | 焦虑 | 😰 |
| angry | 3 | #EAB308 | 愤怒 | 😡 |
| greedy | 4 | #84CC16 | 贪婪 | 🤑 |
| calm | 5 | #22C55E | 平静 | 🙂 |

---

## 错误码

| Code | HTTP Status | 描述 |
|------|-------------|------|
| PAST_DATE_LOCKED | 400 | 尝试修改过去日期的记录 |
| FUTURE_DATE | 400 | 尝试打卡未来日期 |
| INVALID_EMOTION | 400 | 无效的情绪类型 |
| USER_NOT_FOUND | 404 | 用户不存在 |

---

## 降级策略

当 Supabase 不可用时：

1. **写入**：数据保存到 localStorage
2. **读取**：优先读取 localStorage
3. **同步**：后续实现离线数据同步（P2）

---

## 安全考虑

1. **RLS 策略**：用户只能访问自己的情绪记录
2. **输入验证**：严格验证 emotion 枚举值
3. **速率限制**：每用户每分钟最多 10 次请求（建议）

---

**最后更新**: 2026-01-21
