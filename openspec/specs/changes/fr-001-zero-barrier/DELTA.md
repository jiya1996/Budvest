# Delta: 对现有 Spec 的修改

**变更ID**: CHANGE-006
**状态**: 🟡 待评审通过后执行

---

## 概述

本变更提案通过后，需要对以下现有文件进行修改。

---

## 新增文件

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/user-flows/onboarding-flow.md` | 本目录 `specs/onboarding-flow.md` | 引导流程规范 |
| `specs/api-contracts/onboarding-api.md` | 本目录 `specs/onboarding-api.md` | 游客 API 规范 |
| `specs/state-machines/guest-states.md` | 本目录 `specs/guest-states.md` | 游客状态定义 |

---

## 修改文件

### 1. `specs/user-flows/README.md`

**位置**: 核心流程清单表格

**新增行**:

```markdown
| 零门槛启动/Onboarding | [onboarding-flow.md](./onboarding-flow.md) | P0 | ✅ 已完成 |
```

---

### 2. `openspec/README.md`

**位置**: 目录结构树

**修改内容**: 将以下条目从 `📋 待补充` 改为 `✅ 已完成`

```markdown
├── user-flows/
│   ├── onboarding-flow.md              ✅ 已完成  (原: 📋 待补充)

├── api-contracts/
│   ├── auth-api.md                     ✅ 已完成  (原: 📋 待补充)
```

**位置**: 活动变更提案表格

**新增行**:

```markdown
| CHANGE-006 | [FR-001 零门槛启动](./changes/fr-001-zero-barrier/proposal.md) | 🟡 待评审 | Claude Code | 2026-01-21 |
```

---

### 3. `specs/user-flows/onboarding-flow.md`

**说明**: 此文件已存在（基础版），本次变更将**替换**为新版本。

**变更内容**:
- 移除选股流程
- 移除持仓配置流程
- 新增初心选择流程
- 新增 Guest UUID 生成节点

---

### 4. 创建目录结构（如不存在）

```bash
# 确保以下目录存在
mkdir -p specs/api-contracts
mkdir -p specs/state-machines
```

---

## 执行步骤

评审通过后，按以下顺序执行：

1. [ ] 创建 `specs/api-contracts/` 目录（如不存在）
2. [ ] 创建 `specs/state-machines/` 目录（如不存在）
3. [ ] 复制/替换 `onboarding-flow.md` 到 `specs/user-flows/`
4. [ ] 复制 `onboarding-api.md` 到 `specs/api-contracts/`
5. [ ] 复制 `guest-states.md` 到 `specs/state-machines/`
6. [ ] 修改 `specs/user-flows/README.md` 添加流程链接
7. [ ] 修改 `openspec/README.md` 更新状态标记和变更提案表
8. [ ] 按 `tasks.md` 实施代码开发
9. [ ] 将 `changes/fr-001-zero-barrier/` 移动到 `archive/`

---

**最后更新**: 2026-01-21
