# 实施任务清单：全局 API 规范

**变更ID**: CHANGE-005
**状态**: 🟡 待评审通过后开始

---

## 前置条件

- [ ] 本变更提案已通过评审
- [ ] CHANGE-003 (AI 对话) 已合并
- [ ] CHANGE-004 (心理复盘) 已合并

---

## 任务分解

### Phase 1: 规格评审与合并 (Day 0)

| 任务 | 负责人 | 状态 |
|------|--------|------|
| 评审 README.md API 总览 | Tech Lead | ⬜ 待评审 |
| 评审 auth-api.md 认证规范 | Tech Lead | ⬜ 待评审 |
| 评审 error-codes.md 错误码 | 前端 + 后端 | ⬜ 待评审 |
| 评审通过后合并到 specs/ | 提案人 | ⬜ 待执行 |

---

### Phase 2: 代码实现（可选）

以下任务为可选的代码规范化工作：

| 任务 | 文件 | 说明 |
|------|------|------|
| 创建 Guest API | `app/api/auth/guest/route.ts` | 参考 onboarding-flow.md |
| 创建 Profile API | `app/api/auth/profile/route.ts` | GET/PATCH |
| 创建错误工具库 | `lib/errors.ts` | APIError 类 |
| 统一现有 API 错误格式 | 所有 API routes | 使用 Errors 工厂 |

---

## 验收清单

### 文档验收

- [ ] README.md 包含完整的 API 清单
- [ ] auth-api.md 覆盖 Guest 创建和档案管理
- [ ] error-codes.md 覆盖所有已定义错误
- [ ] 错误码命名一致（模块_操作_原因）

### 代码验收（如实施）

- [ ] Guest 创建 API 正常工作
- [ ] 所有 API 使用统一错误格式
- [ ] 错误码与 spec 一致

---

## 完成后操作

1. [ ] 复制 `README.md` 到 `specs/api-contracts/`
2. [ ] 复制 `auth-api.md` 到 `specs/api-contracts/`
3. [ ] 复制 `error-codes.md` 到 `specs/api-contracts/`
4. [ ] 更新 `openspec/README.md` 状态标记
5. [ ] 将 `changes/global-api-specs/` 移动到 `archive/`

---

**最后更新**: 2026-01-21
