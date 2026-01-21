# 变更提案：FR-004 每日情绪打卡功能实施

**提案ID**: CHANGE-002
**提案人**: Claude Code + 何佳瑶
**提案日期**: 2026-01-21
**状态**: 🟡 待评审 (Pending Review)

---

## 变更概述

实施 FR-004 每日情绪打卡功能，包括数据库表创建、API 端点开发、前端组件实现。这是 MVP P0 优先级功能，当前进度为 40%（仅有基础类型定义），需要完成剩余 60% 的实施工作。

---

## 为什么要做这个变更？

### 背景

1. **MVP 核心功能缺失**：FR-004 是 P0 优先级，但当前实现不完整
2. **Spec 已定义验收标准**：`functional-requirements.md` 已有 AC-004.1 到 AC-004.6
3. **缺失的 Spec 文档**：需要补充 `emotion-api.md`、`emotion-checkin-flow.md`、`emotion-states.md`

### 预期价值

| 维度 | 预期收益 |
|------|---------|
| 用户粘性 | 每日打卡养成习惯，提升复访率 |
| 数据积累 | 情绪趋势数据为个性化服务提供基础 |
| 产品闭环 | 完善"情绪识别→记录→趋势"的完整链路 |

---

## 功能规格（来自已有 Spec）

### 验收标准 (AC)

| AC ID | 描述 | 实施状态 |
|-------|------|---------|
| AC-004.1 | 首页顶部显示情绪打卡入口 | ⬜ 待实施 |
| AC-004.2 | 4 个 Emoji 单选（😰焦虑/🤑贪婪/😡愤怒/🙂平静） | ⬜ 待实施 |
| AC-004.3 | 当天可重复打卡（覆盖），次日锁定 | ⬜ 待实施 |
| AC-004.4 | 打卡后展示 7 日情绪趋势折线图 | ⬜ 待实施 |
| AC-004.5 | 趋势图使用颜色渐变（红色→绿色） | ⬜ 待实施 |
| AC-004.6 | 数据持久化到 emotion_logs 表 | ⬜ 待实施 |

### 数据库表（来自 specs/database/spec.md）

```sql
CREATE TABLE emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emotion VARCHAR(20) NOT NULL,  -- anxious/greedy/angry/calm
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)  -- 每天只能打卡一次
);
```

---

## 本次变更需补充的 Spec 文档

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/api-contracts/emotion-api.md` | 本目录 `specs/emotion-api.md` | API 契约规范 |
| `specs/user-flows/emotion-checkin-flow.md` | 本目录 `specs/emotion-checkin-flow.md` | 用户流程图 |
| `specs/state-machines/emotion-states.md` | 本目录 `specs/emotion-states.md` | 情绪状态枚举 |

---

## 影响范围

### 需要新增的文件

| 类型 | 文件 | 说明 |
|------|------|------|
| 数据库 | `supabase/migrations/xxx_emotion_logs.sql` | 数据库迁移 |
| API | `app/api/emotion-checkin/route.ts` | 打卡 API |
| API | `app/api/emotion/trend/route.ts` | 趋势 API |
| 组件 | `components/emotion/EmotionCheckinCard.tsx` | 打卡卡片 |
| 组件 | `components/emotion/EmotionTrendChart.tsx` | 趋势图表 |
| 存储 | `lib/storage.ts` 扩展 | 本地存储降级 |

### 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `lib/supabase.ts` | 添加 EmotionLog 类型 |
| `components/MarketTab.tsx` | 替换心情选择为新组件 |

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Supabase 不可用 | 中 | 本地存储降级方案 |
| 情绪数据敏感 | 低 | RLS 策略确保用户只能访问自己的数据 |
| 趋势图性能 | 低 | 限制查询天数（最多 30 天） |

---

## 评审检查清单

请评审人检查以下项目：

- [ ] API 契约规范是否完整？
- [ ] 用户流程是否覆盖所有场景（首次打卡/重复打卡/查看趋势）？
- [ ] 状态枚举是否与现有 types.ts 一致？
- [ ] 数据库设计是否符合 spec？
- [ ] 是否有遗漏的 AC 验收标准？

---

## 下一步

1. **待评审通过** → 合并 specs 到主目录
2. **实施开发** → 按 tasks.md 执行
3. **验收测试** → 按 AC 标准验收
4. **归档** → 移动到 `archive/`

---

**最后更新**: 2026-01-21
