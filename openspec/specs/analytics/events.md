# Analytics & Tracking Specification

**版本**: v1.0  
**更新日期**: 2026-01-20  
**埋点工具**: 自定义埋点 + Vercel Analytics

---

## 1. Overview

本文档定义 Budvest 产品的完整埋点方案，用于衡量产品成功、优化用户体验、进行 A/B 测试。

### 1.1 北极星指标

**DAU/MAU Stickiness Ratio = DAU / MAU**

**目标**: Month 3 达到 25%

### 1.2 关键指标层级

```
Level 1: Business Metrics (业务指标)
  ├─ DAU / MAU / Stickiness
  ├─ 7-day Retention / 30-day Retention
  └─ Median Streak Length

Level 2: User Behavior (用户行为)
  ├─ Emotion Checkin Rate
  ├─ Review Completion Rate
  └─ Chat Engagement (avg rounds)

Level 3: Technical Performance (技术性能)
  ├─ API Latency (P95)
  ├─ AI Response Time
  └─ Error Rate
```

---

## 2. Event Definitions

### 2.1 用户行为事件

#### Event: `page_view`

**触发时机**: 用户访问任何页面

**属性**:

```json
{
  "event": "page_view",
  "user_id": "uuid",
  "page_path": "/chat",
  "page_title": "AI对话",
  "referrer": "/",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 计算 DAU、页面流转分析

---

#### Event: `button_click`

**触发时机**: 用户点击任何按钮

**属性**:

```json
{
  "event": "button_click",
  "user_id": "uuid",
  "button_id": "emotion-chip-panic",
  "button_text": "😰我慌了",
  "page_path": "/",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**关键按钮 ID**:

- `emotion-chip-{panic|greedy|angry|calm}`
- `chat-start-button`
- `review-submit-button`
- `emotion-checkin-button`

---

#### Event: `chat_send`

**触发时机**: 用户发送对话消息

**属性**:

```json
{
  "event": "chat_send",
  "user_id": "uuid",
  "conversation_id": "conv-uuid",
  "message_length": 25,
  "round_number": 3,
  "guru": "coach",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 计算对话参与度、平均轮数

---

#### Event: `chat_receive`

**触发时机**: AI 完成回复（流式响应结束）

**属性**:

```json
{
  "event": "chat_receive",
  "user_id": "uuid",
  "conversation_id": "conv-uuid",
  "response_length": 150,
  "detected_emotion": "anxious",
  "response_time_ms": 2300,
  "guru": "coach",
  "agents_involved": ["coordinator", "mentor"],
  "session_id": "session-uuid",
  "timestamp": 1737350402300
}
```

**用途**: 分析 AI 响应时间、情绪识别准确性

---

### 2.2 业务指标事件

#### Event: `emotion_checkin`

**触发时机**: 用户完成情绪打卡

**属性**:

```json
{
  "event": "emotion_checkin",
  "user_id": "uuid",
  "emotion": "calm",
  "streak_days": 15,
  "is_first_today": true,
  "source": "daily_brief" | "home_page" | "reminder",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 计算打卡率、连续天数分布

---

#### Event: `review_submit`

**触发时机**: 用户提交复盘

**属性**:

```json
{
  "event": "review_submit",
  "user_id": "uuid",
  "conversation_id": "conv-uuid",
  "emotion_before": 2,
  "emotion_after": 4,
  "emotion_delta": 2,
  "action_taken": "add",
  "has_reflection": true,
  "review_id": "review-uuid",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 计算复盘完成率（北极星指标候选）

---

#### Event: `streak_milestone`

**触发时机**: 用户达成连续打卡里程碑

**属性**:

```json
{
  "event": "streak_milestone",
  "user_id": "uuid",
  "milestone_type": "7_days" | "30_days" | "90_days",
  "streak_days": 7,
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 分析里程碑对留存的影响

---

#### Event: `badge_unlock`

**触发时机**: 用户解锁徽章

**属性**:

```json
{
  "event": "badge_unlock",
  "user_id": "uuid",
  "badge_id": "stable_heart",
  "badge_name": "稳定之心",
  "unlock_trigger": "7_days_calm",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 分析 Gamification 效果

---

#### Event: `guest_convert`

**触发时机**: 游客转化为注册用户

**属性**:

```json
{
  "event": "guest_convert",
  "user_id": "uuid",
  "guest_days": 5,
  "total_chats": 8,
  "total_reviews": 3,
  "convert_trigger": "7_day_milestone" | "manual" | "data_export",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 优化游客转化漏斗

---

### 2.3 推送通知事件

#### Event: `push_sent`

**触发时机**: 推送通知发送成功

**属性**:

```json
{
  "event": "push_sent",
  "user_id": "uuid",
  "push_type": "daily_brief" | "market_alert" | "streak_reminder" | "milestone",
  "push_content": "今日A股跌3%，要不要和AI聊聊？",
  "scheduled_time": "2026-01-20T09:00:00Z",
  "sent_time": "2026-01-20T09:00:05Z",
  "timestamp": 1737350400000
}
```

---

#### Event: `push_clicked`

**触发时机**: 用户点击推送通知

**属性**:

```json
{
  "event": "push_clicked",
  "user_id": "uuid",
  "push_type": "daily_brief",
  "push_id": "push-uuid",
  "time_to_click_seconds": 120,
  "resulting_action": "emotion_checkin" | "chat_start" | "none",
  "timestamp": 1737350520000
}
```

**用途**: 计算推送点击率、转化率

---

### 2.4 技术性能事件

#### Event: `api_call`

**触发时机**: 每次 API 调用

**属性**:

```json
{
  "event": "api_call",
  "user_id": "uuid",
  "endpoint": "/api/chat-claude",
  "method": "POST",
  "status_code": 200,
  "latency_ms": 1800,
  "error_message": null,
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 监控 API 性能、错误率

---

#### Event: `ai_response_time`

**触发时机**: AI 生成响应

**属性**:

```json
{
  "event": "ai_response_time",
  "user_id": "uuid",
  "model": "claude-3-5-sonnet-20241022",
  "agent": "mentor",
  "input_tokens": 1200,
  "output_tokens": 300,
  "latency_ms": 2300,
  "cost_usd": 0.008,
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 优化 AI 成本、性能

---

#### Event: `error_occurred`

**触发时机**: 任何错误发生

**属性**:

```json
{
  "event": "error_occurred",
  "user_id": "uuid",
  "error_type": "network_timeout" | "ai_api_error" | "database_error",
  "error_code": "ERR_CLAUDE_TIMEOUT",
  "error_message": "Claude API timeout after 15s",
  "stack_trace": "...",
  "page_path": "/chat",
  "session_id": "session-uuid",
  "timestamp": 1737350400000
}
```

**用途**: 错误监控、Debug

---

## 3. KPI Dashboard

### 3.1 实时监控指标

| 指标 | 计算公式 | 目标值 | 数据源 |
|------|---------|--------|--------|
| **DAU** | COUNT(DISTINCT user_id WHERE event='page_view' AND date=today) | - | page_view |
| **MAU** | COUNT(DISTINCT user_id WHERE event='page_view' AND date>=30_days_ago) | - | page_view |
| **Stickiness** | DAU / MAU | 25% | Calculated |
| **7-day Retention** | COUNT(users WHO returned on day 7) / COUNT(new users 7 days ago) | 40% | page_view |
| **30-day Retention** | COUNT(users WHO returned on day 30) / COUNT(new users 30 days ago) | 15% | page_view |

### 3.2 用户行为指标

| 指标 | 计算公式 | 目标值 | 数据源 |
|------|---------|--------|--------|
| **Emotion Checkin Rate** | COUNT(emotion_checkin) / DAU | 70% | emotion_checkin |
| **Review Completion Rate** | COUNT(review_submit) / COUNT(chat_send WHERE new_conversation) | 60% | review_submit, chat_send |
| **Avg Chat Rounds** | AVG(round_number) per conversation | 5-10 | chat_send |
| **Median Streak Days** | MEDIAN(streak_days) | 7天 | emotion_checkin |
| **Badge Unlock Rate** | COUNT(users WITH \u003e= 1 badge) / MAU | 30% | badge_unlock |

### 3.3 推送效果指标

| 指标 | 计算公式 | 目标值 | 数据源 |
|------|---------|--------|--------|
| **Push Click Rate** | COUNT(push_clicked) / COUNT(push_sent) | 20% | push_sent, push_clicked |
| **Push to Action Rate** | COUNT(push_clicked WHERE resulting_action != 'none') / COUNT(push_clicked) | 50% | push_clicked |

### 3.4 技术性能指标

| 指标 | 计算公式 | 目标值 | 数据源 |
|------|---------|--------|--------|
| **API P95 Latency** | PERCENTILE(latency_ms, 95) | < 2000ms | api_call |
| **AI Response Time** | AVG(latency_ms) | < 2500ms | ai_response_time |
| **Error Rate** | COUNT(error_occurred) / COUNT(api_call) | < 1% | api_call, error_occurred |
| **Daily AI Cost** | SUM(cost_usd) per day | < $5/day | ai_response_time |

---

## 4. Implementation

### 4.1 埋点代码示例

**前端埋点（React）**:

```typescript
// lib/analytics.ts
export const trackEvent = (eventName: string, properties: Record<string, any>) => {
  // Supabase 埋点
  await supabase.from('analytics_events').insert({
    event: eventName,
    user_id: getUserId(),
    session_id: getSessionId(),
    properties,
    timestamp: new Date().toISOString(),
  });
  
  // Vercel Analytics
  if (typeof window !== 'undefined') {
    window.va?.track(eventName, properties);
  }
};

// 使用示例
trackEvent('emotion_checkin', {
  emotion: 'calm',
  streak_days: 15,
  source: 'home_page',
});
```

**后端埋点（API Route）**:

```typescript
// app/api/chat-claude/route.ts
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const response = await callClaudeAPI(...);
    
    // 埋点：AI 响应时间
    await trackEvent('ai_response_time', {
      model: 'claude-3-5-sonnet',
      agent: 'mentor',
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      latency_ms: Date.now() - startTime,
      cost_usd: calculateCost(response.usage),
    });
    
    return Response.json(response);
  } catch (error) {
    // 埋点：错误
    await trackEvent('error_occurred', {
      error_type: 'ai_api_error',
      error_code: error.code,
      error_message: error.message,
    });
    throw error;
  }
}
```

### 4.2 数据存储

**Supabase 表结构**:

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event VARCHAR(50) NOT NULL,
  user_id UUID, -- 可为空（匿名事件）
  session_id VARCHAR(100),
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_analytics_event_user ON analytics_events(event, user_id, created_at DESC);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
```

### 4.3 数据保留策略

- **原始事件**: 保留 90 天
- **聚合指标**: 永久保存（每日/每周/每月）
- **定时任务**: 每天凌晨 3 点清理 90 天前数据

---

## 5. A/B Testing Framework

### 5.1 实验框架

使用 Vercel Edge Config + 自定义分流逻辑

**实验示例：测试不同的推送文案**

```typescript
const experiment = {
  id: 'push_copy_test_001',
  variants: {
    control: '今日A股跌3%，要不要和AI聊聊？',
    variant_a: '市场波动较大，我陪你聊聊吧',
    variant_b: '检测到你可能焦虑，让我帮你',
  },
  allocation: {
    control: 0.33,
    variant_a: 0.33,
    variant_b: 0.34,
  },
  metrics: ['push_click_rate', 'chat_start_after_push'],
};
```

### 5.2 关键实验

| 实验 ID | 假设 | 指标 | 预期提升 |
|---------|-----|------|---------|
| `streak_display_001` | 显著的连续天数展示提升打卡率 | emotion_checkin_rate | +15% |
| `badge_animation_001` | 徽章解锁动画提升留存 | 7-day retention | +10% |
| `push_timing_001` | 智能推送时间提升点击率 | push_click_rate | +20% |

---

## 6. Privacy & Compliance

### 6.1 数据隐私

- 用户可导出所有埋点数据（GDPR 合规）
- 用户可选择退出埋点（设置页面）
- 匿名化处理敏感数据（对话内容不记录）

### 6.2 数据脱敏

```typescript
const sanitizeProperties = (properties: any) => {
  // 删除敏感字段
  delete properties.user_message_content;
  delete properties.ai_response_content;
  
  // 仅保留元数据
  return properties;
};
```

---

**最后更新**: 2026-01-20  
**下次评审**: Week 2 上线后根据实际数据调整
