# Delta: 对现有 Spec 的修改

**变更ID**: CHANGE-005
**状态**: 🟡 待评审通过后执行

---

## 概述

本变更提案通过后，需要对以下现有文件进行修改。

---

## 新增文件

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/api-contracts/README.md` | 本目录 `specs/README.md` | API 规范总览 |
| `specs/api-contracts/auth-api.md` | 本目录 `specs/auth-api.md` | 认证 API 契约 |
| `specs/api-contracts/error-codes.md` | 本目录 `specs/error-codes.md` | 统一错误码定义 |

---

## 修改文件

### 1. `openspec/README.md`

**位置**: 目录结构树

**修改内容**: 更新 api-contracts 相关条目状态

```markdown
# 修改前
├── api-contracts/                       📋 待补充
│   ├── README.md                        (API 规范总览)
│   ├── auth-api.md                      (认证相关 API)
│   ├── error-codes.md                   (错误码定义)

# 修改后
├── api-contracts/
│   ├── README.md                        ✅ 已完成
│   ├── auth-api.md                      ✅ 已完成
│   ├── chat-api.md                      ✅ 已完成 (CHANGE-003)
│   ├── review-api.md                    ✅ 已完成 (CHANGE-004)
│   ├── emotion-api.md                   🟡 CHANGE-002
│   ├── market-api.md                    📋 待补充
│   └── error-codes.md                   ✅ 已完成
```

---

### 2. 创建目录结构（如不存在）

```bash
# CHANGE-003/004 可能已创建此目录
mkdir -p specs/api-contracts
```

---

## 执行步骤

评审通过后，按以下顺序执行：

1. [ ] 确保 `specs/api-contracts/` 目录存在
2. [ ] 复制 `README.md` 到 `specs/api-contracts/`
3. [ ] 复制 `auth-api.md` 到 `specs/api-contracts/`
4. [ ] 复制 `error-codes.md` 到 `specs/api-contracts/`
5. [ ] 修改 `openspec/README.md` 更新状态标记
6. [ ] 将 `changes/global-api-specs/` 移动到 `archive/`

---

**最后更新**: 2026-01-21
