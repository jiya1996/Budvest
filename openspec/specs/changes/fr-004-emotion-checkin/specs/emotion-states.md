# 情绪状态枚举

**版本**: v1.0
**更新日期**: 2026-01-21
**关联需求**: FR-004 每日情绪打卡

---

## 概述

本文档定义情绪打卡功能使用的情绪类型枚举及其属性。

---

## Emotion 类型定义

### TypeScript 定义

```typescript
// lib/types.ts 中已有定义
export type Emotion = 'anxious' | 'panic' | 'angry' | 'greedy' | 'calm';
```

### 情绪详细属性

| Emotion | 中文 | Emoji | Value | Color | 说明 |
|---------|------|-------|-------|-------|------|
| `panic` | 恐慌 | 😱 | 1 | #EF4444 | 极度负面，市场暴跌时常见 |
| `anxious` | 焦虑 | 😰 | 2 | #F97316 | 轻度负面，担忧但可控 |
| `angry` | 愤怒 | 😡 | 3 | #EAB308 | 中性偏负面，对亏损或错失的愤怒 |
| `greedy` | 贪婪 | 🤑 | 4 | #84CC16 | 中性偏正面，追涨或不愿止盈 |
| `calm` | 平静 | 🙂 | 5 | #22C55E | 正面，理性决策状态 |

---

## 情绪值说明

### Value 映射

情绪值（1-5）用于：
- **趋势图 Y 轴**：值越高位置越上
- **趋势计算**：比较前后期平均值判断趋势
- **颜色渐变**：红色 (1) → 绿色 (5)

### 趋势类型

```typescript
type TrendType = 'improving' | 'stable' | 'declining' | 'unknown';
```

| Trend | 判断条件 | 说明 |
|-------|---------|------|
| `improving` | 后半段平均 - 前半段平均 > 0.5 | 情绪好转 |
| `stable` | 差值在 ±0.5 之间 | 保持稳定 |
| `declining` | 后半段平均 - 前半段平均 < -0.5 | 需要关注 |
| `unknown` | 打卡天数 < 3 | 数据不足 |

---

## MVP vs 完整版

### MVP (AC-004.2)

根据验收标准，MVP 使用 **4 种情绪**：
- 😰 焦虑 (anxious)
- 🤑 贪婪 (greedy)
- 😡 愤怒 (angry)
- 🙂 平静 (calm)

**注意**：`panic`（恐慌）在 MVP 中暂不在 UI 显示，但类型定义保留以支持 AI 对话中的情绪识别。

### 完整版（未来）

可扩展的情绪类型：
- `hopeful` - 充满希望
- `confused` - 困惑
- `regretful` - 后悔
- `confident` - 自信

---

## 数据库约束

```sql
-- emotion_logs 表中 emotion 字段约束
emotion VARCHAR(20) NOT NULL
-- 应用层验证：['anxious', 'panic', 'angry', 'greedy', 'calm']
```

---

## UI 配置

### 打卡卡片配置

```typescript
const EMOTION_OPTIONS = [
  {
    value: 'anxious',
    emoji: '😰',
    label: '焦虑',
    color: '#F97316',
    bgColor: 'from-orange-50 to-amber-50',
    shadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
  },
  {
    value: 'greedy',
    emoji: '🤑',
    label: '贪婪',
    color: '#84CC16',
    bgColor: 'from-lime-50 to-green-50',
    shadow: '0 4px 12px rgba(132, 204, 22, 0.3)',
  },
  {
    value: 'angry',
    emoji: '😡',
    label: '愤怒',
    color: '#EF4444',
    bgColor: 'from-red-50 to-rose-50',
    shadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },
  {
    value: 'calm',
    emoji: '🙂',
    label: '平静',
    color: '#22C55E',
    bgColor: 'from-green-50 to-emerald-50',
    shadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
  },
];
```

---

## 与现有代码的一致性

### lib/types.ts

现有定义：
```typescript
export type Emotion = 'anxious' | 'panic' | 'angry' | 'greedy' | 'calm';
```

**结论**：无需修改类型定义，保持一致。

### AI 情绪识别

AI 对话中识别的情绪类型与打卡类型相同，确保数据一致性。

---

**最后更新**: 2026-01-21
