# Delta: 对现有 Spec 的修改

**变更ID**: CHANGE-002
**状态**: 🟡 待评审通过后执行

---

## 概述

本变更提案通过后，需要对以下现有文件进行修改。

---

## 新增文件

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/api-contracts/emotion-api.md` | 本目录 `specs/emotion-api.md` | 情绪打卡 API 规范 |
| `specs/user-flows/emotion-checkin-flow.md` | 本目录 `specs/emotion-checkin-flow.md` | 情绪打卡用户流程 |
| `specs/state-machines/emotion-states.md` | 本目录 `specs/emotion-states.md` | 情绪状态枚举 |

---

## 修改文件

### 1. `specs/user-flows/README.md`

**位置**: 核心流程清单表格

**新增行**:

```markdown
| 每日情绪打卡 | [emotion-checkin-flow.md](./emotion-checkin-flow.md) | P0 | ✅ 已完成 |
```

---

### 2. `openspec/README.md`

**位置**: 目录结构树

**修改内容**: 将以下条目从 `📋 待补充` 改为 `✅ 已完成`

```markdown
├── user-flows/
│   ├── emotion-checkin-flow.md          ✅ 已完成  (原: 📋 待补充)

├── api-contracts/
│   ├── emotion-api.md                   ✅ 已完成  (原: 📋 待补充)

├── state-machines/
│   └── emotion-states.md                ✅ 已完成  (原: 📋 待补充)
```

---

### 3. 创建目录结构（如不存在）

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
3. [ ] 复制 `emotion-api.md` 到 `specs/api-contracts/`
4. [ ] 复制 `emotion-checkin-flow.md` 到 `specs/user-flows/`
5. [ ] 复制 `emotion-states.md` 到 `specs/state-machines/`
6. [ ] 修改 `specs/user-flows/README.md` 添加流程链接
7. [ ] 修改 `openspec/README.md` 更新状态标记
8. [ ] 按 `tasks.md` 实施代码开发
9. [ ] 将 `changes/fr-004-emotion-checkin/` 移动到 `archive/`

---

**最后更新**: 2026-01-21
