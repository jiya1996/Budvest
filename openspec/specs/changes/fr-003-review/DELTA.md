# Delta: 对现有 Spec 的修改

**变更ID**: CHANGE-004
**状态**: 🟡 待评审通过后执行

---

## 概述

本变更提案通过后，需要对以下现有文件进行修改。

---

## 新增文件

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/user-flows/review-flow.md` | 本目录 `specs/review-flow.md` | 复盘用户流程 |
| `specs/api-contracts/review-api.md` | 本目录 `specs/review-api.md` | 复盘 API 契约 |
| `specs/state-machines/review-states.md` | 本目录 `specs/review-states.md` | 复盘状态机 |

---

## 修改文件

### 1. `specs/user-flows/README.md`

**位置**: 核心流程清单表格

**修改内容**: 将 `review-flow.md` 状态改为已完成，添加链接

```markdown
# 修改前
| 投资心理复盘 | review-flow.md | P0 | 📋 待补充 |

# 修改后
| 投资心理复盘 | [review-flow.md](./review-flow.md) | P0 | ✅ 已完成 |
```

---

### 2. `openspec/README.md`

**位置**: 目录结构树

**修改内容**: 更新相关条目状态

```markdown
# 修改前
├── user-flows/
│   ├── review-flow.md                   (复盘记录流程)
├── api-contracts/
│   ├── review-api.md                    (复盘相关 API)
├── state-machines/
│   ├── review-states.md                 (复盘状态机)

# 修改后
├── user-flows/
│   ├── review-flow.md                   ✅ 已完成
├── api-contracts/
│   ├── review-api.md                    ✅ 已完成
├── state-machines/
│   ├── review-states.md                 ✅ 已完成
```

---

### 3. 创建目录结构（如不存在）

```bash
# 确保以下目录存在（CHANGE-003 可能已创建）
mkdir -p specs/api-contracts
mkdir -p specs/state-machines
```

---

## 执行步骤

评审通过后，按以下顺序执行：

1. [ ] 确保 `specs/api-contracts/` 目录存在
2. [ ] 确保 `specs/state-machines/` 目录存在
3. [ ] 复制 `review-flow.md` 到 `specs/user-flows/`
4. [ ] 复制 `review-api.md` 到 `specs/api-contracts/`
5. [ ] 复制 `review-states.md` 到 `specs/state-machines/`
6. [ ] 修改 `specs/user-flows/README.md` 更新状态和链接
7. [ ] 修改 `openspec/README.md` 更新状态标记
8. [ ] 按 `tasks.md` 实施代码开发
9. [ ] 将 `changes/fr-003-review/` 移动到 `archive/`

---

**最后更新**: 2026-01-21
