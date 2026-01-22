# 变更提案：FR-001 零门槛启动功能实施

**提案ID**: CHANGE-006
**提案人**: Claude Code + 何佳瑶
**提案日期**: 2026-01-21
**状态**: 🟡 待评审 (Pending Review)

---

## 变更概述

实施 FR-001 零门槛启动功能，包括简化 Onboarding 流程、Guest UUID 机制、初心设定功能。这是 MVP P0 优先级功能，当前代码框架存在但与规范要求有显著差异，需要改造现有代码以满足"15秒内开始体验"的核心目标。

---

## 为什么要做这个变更？

### 背景

1. **当前 Onboarding 流程过重**：需要选股 + 配置持仓，用户流失风险高
2. **缺失 Guest UUID 机制**：无法追踪游客用户，数据无法持久化
3. **初心设定位置错误**：现有"投资目标"是为股票设置的，不是用户的投资初心
4. **不满足 15 秒体验目标**：当前流程需要数分钟才能进入对话

### 与现有代码的差距

| 规范要求 | 当前实现 | 状态 |
|---------|---------|------|
| 游客模式 (Guest UUID) | `storage.ts` 无 UUID 逻辑 | ❌ 缺失 |
| 初心选择 (2-3 个选项) | 有 `INVESTMENT_GOALS` 但用于股票配置 | ⚠️ 位置错误 |
| 15 秒内开始体验 | 需选股 + 配置持仓 | ❌ 不满足 |
| 无需登录 | 确实无需登录 | ✅ 满足 |

### 预期价值

| 维度 | 预期收益 |
|------|---------|
| 转化率 | 降低首次使用门槛，提升试用转化 |
| 用户体验 | 15 秒内开始核心体验（AI 对话） |
| 数据基础 | Guest UUID 为后续用户分析和转化提供基础 |

---

## 功能规格（来自已有 Spec）

### 验收标准 (AC)

| AC ID | 描述 | 实施状态 |
|-------|------|---------|
| AC-001.1 | 首次打开 APP，直接进入初心设定页，无需登录 | ⬜ 待实施 |
| AC-001.2 | 展示 2-3 个预设投资目标选项，用户至少选择 1 项 | ⬜ 待实施 |
| AC-001.3 | 选择完成后，系统生成唯一 Guest UUID 并存储到 localStorage | ⬜ 待实施 |
| AC-001.4 | 自动跳转到首页，用户可立即开始对话 | ⬜ 待实施 |
| AC-001.5 | Guest 用户数据写入 `user_profiles` 表，`guest` 字段为 true | ⬜ 待实施 |

### 初心选项设计

基于用户研究，提供以下 3 个初心选项：

| 选项 | 描述 | 图标 |
|------|------|------|
| 长期持有 | 我相信长期投资，希望在波动中保持定力 | 🌱 |
| 把握机会 | 我关注市场机会，希望理性判断进出时机 | ⚡ |
| 学习成长 | 我是投资新手，想培养健康的投资心态 | 📚 |

### 数据库表（来自 specs/database/spec.md）

```sql
-- user_profiles 表已存在，需确认字段
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest BOOLEAN DEFAULT true,
  investment_goal VARCHAR(50),  -- 初心选择
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 本次变更需补充的 Spec 文档

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/user-flows/onboarding-flow.md` | 本目录 `specs/onboarding-flow.md` | 引导流程规范 |
| `specs/api-contracts/onboarding-api.md` | 本目录 `specs/onboarding-api.md` | API 契约规范 |
| `specs/state-machines/guest-states.md` | 本目录 `specs/guest-states.md` | 游客状态定义 |

---

## 影响范围

### 需要新增的文件

| 类型 | 文件 | 说明 |
|------|------|------|
| API | `app/api/auth/guest/route.ts` | 游客创建 API |
| 存储 | `lib/guest.ts` | Guest UUID 管理 |

### 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `components/Onboarding.tsx` | 简化流程：移除选股/配置，只保留欢迎页 + 初心选择 |
| `lib/storage.ts` | 添加 Guest UUID 存储逻辑 |
| `lib/data.ts` | 更新 `INVESTMENT_GOALS` 为初心选项 |
| `lib/types.ts` | 添加 `GuestProfile` 类型 |

### 需要删除/移动的代码

| 代码 | 处理方式 |
|------|---------|
| Onboarding Step 1 (选股) | 移动到独立的"添加自选"功能 |
| Onboarding Step 2 (配置持仓) | 移动到"持仓管理"功能 |

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 老用户数据迁移 | 低 | 已 onboard 用户不受影响 |
| 选股功能丢失 | 低 | 移动到首页入口，用户可后续添加 |
| Guest 数据安全 | 中 | RLS 策略 + UUID 不可预测性 |

---

## 评审检查清单

请评审人检查以下项目：

- [ ] 初心选项文案是否清晰、有吸引力？
- [ ] 简化后的流程是否满足 15 秒体验目标？
- [ ] Guest UUID 生成机制是否安全？
- [ ] 现有选股/配置功能的迁移方案是否合理？
- [ ] 是否有遗漏的 AC 验收标准？

---

## 下一步

1. **待评审通过** → 合并 specs 到主目录
2. **实施开发** → 按 tasks.md 执行
3. **验收测试** → 按 AC 标准验收
4. **归档** → 移动到 `archive/`

---

**最后更新**: 2026-01-21
