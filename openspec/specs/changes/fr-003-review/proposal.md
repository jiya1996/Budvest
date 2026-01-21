# 变更提案：FR-003 投资心理复盘规范

**提案ID**: CHANGE-004
**提案人**: Claude Code + 何佳瑶
**提案日期**: 2026-01-21
**状态**: 🟡 待评审 (Pending Review)

---

## 变更概述

补充 FR-003 投资心理复盘功能的规范文档，包括用户流程、API 契约、状态机定义。这是 MVP P0 优先级功能，完成从"情绪识别"到"反思成长"的闭环。

---

## 为什么要做这个变更？

### 背景

1. **MVP 核心功能**：FR-003 是产品价值闭环的关键一环
2. **代码需要升级**：现有实现较简单，与 spec 有差距
3. **缺失的 Spec 文档**：需要补充 `review-flow.md`、`review-api.md`、`review-states.md`

### 现有实现 vs 规范要求

| 功能点 | 规范要求 | 现有实现 |
|--------|---------|---------|
| 情绪滑动条 (AC-003.3) | 对话前后 1-5 分 | ❌ 未实现 |
| 决策选择 (AC-003.4) | 锁仓/加仓/减仓/清仓 | ❌ 未实现 |
| AI 生成总结 (AC-003.6) | 对比分析 | ❌ 未实现 |
| Supabase 存储 (AC-003.7) | review_entries 表 | ❌ 仅 localStorage |
| 对话触发 (AC-003.1) | 对话页"记录"按钮 | ⚠️ 部分实现 |
| 自动提示 (AC-003.2) | 30 分钟无交互弹出 | ❌ 未实现 |

---

## 功能规格（来自已有 Spec）

### 验收标准 (AC)

| AC ID | 描述 | 实施状态 |
|-------|------|---------|
| AC-003.1 | 对话页面头部有"✅ 记录"按钮 | ⚠️ 部分实施 |
| AC-003.2 | 对话结束（30 分钟无交互）自动弹出复盘引导 | ⬜ 待实施 |
| AC-003.3 | Step 1: 情绪变化滑动条（1-5 分） | ⬜ 待实施 |
| AC-003.4 | Step 2: 决策选择（锁仓/加仓/减仓/清仓） | ⬜ 待实施 |
| AC-003.5 | Step 3: 可选文字备注（最多 200 字） | ✅ 已实施 |
| AC-003.6 | AI 生成复盘总结 | ⬜ 待实施 |
| AC-003.7 | 数据保存到 Supabase `review_entries` 表 | ⬜ 待实施 |
| AC-003.8 | 历史复盘记录，时间倒序展示 | ✅ 已实施 |

---

## 本次变更需补充的 Spec 文档

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/user-flows/review-flow.md` | 本目录 `specs/review-flow.md` | 复盘用户流程图 |
| `specs/api-contracts/review-api.md` | 本目录 `specs/review-api.md` | 复盘 API 契约 |
| `specs/state-machines/review-states.md` | 本目录 `specs/review-states.md` | 复盘状态机 |

---

## 影响范围

### 需要新增/修改的代码

| 类型 | 文件 | 说明 |
|------|------|------|
| API | `app/api/review/route.ts` | 新增：复盘 CRUD API |
| API | `app/api/review/summary/route.ts` | 新增：AI 总结生成 |
| 组件 | `components/review/ReviewCard.tsx` | 重构：3 步复盘卡片 |
| 页面 | `app/review/new/page.tsx` | 重构：符合 spec |
| 存储 | `lib/supabase.ts` | 新增：ReviewEntry 类型 |

### 数据库变更

```sql
-- 新增/更新 review_entries 表
CREATE TABLE review_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id VARCHAR(100),           -- 关联的对话 ID
  emotion_before INT NOT NULL CHECK (emotion_before BETWEEN 1 AND 5),
  emotion_after INT NOT NULL CHECK (emotion_after BETWEEN 1 AND 5),
  action_taken VARCHAR(20) NOT NULL,      -- lock/add/reduce/clear
  reflection TEXT,                         -- 用户备注
  ai_summary TEXT,                         -- AI 生成的总结
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 代码重构范围大 | 中 | 保留现有功能，渐进式升级 |
| AI 总结成本 | 低 | 使用 GPT-4o-mini，控制 token |
| 数据迁移 | 低 | localStorage 数据可选迁移 |

---

## 评审检查清单

请评审人检查以下项目：

- [ ] 用户流程是否覆盖从对话触发到完成复盘的完整路径？
- [ ] API 契约是否支持 3 步复盘数据？
- [ ] AI 总结的 prompt 是否合适？
- [ ] 状态机是否覆盖所有 UI 状态？
- [ ] 数据库 schema 是否与 spec 一致？

---

## 下一步

1. **待评审通过** → 合并 specs 到主目录
2. **代码开发** → 按 tasks.md 重构现有代码
3. **数据迁移**（可选）→ localStorage → Supabase
4. **归档** → 移动到 `archive/`

---

**最后更新**: 2026-01-21
