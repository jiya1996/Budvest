# 变更提案：FR-002 AI 情绪教练对话规范

**提案ID**: CHANGE-003
**提案人**: Claude Code + 何佳瑶
**提案日期**: 2026-01-21
**状态**: 🟡 待评审 (Pending Review)

---

## 变更概述

补充 FR-002 AI 情绪教练对话功能的规范文档，包括用户流程、API 契约、状态机定义。这是 MVP P0 优先级功能，是产品核心价值的最小体现。

---

## 为什么要做这个变更？

### 背景

1. **MVP 核心功能**：FR-002 是产品核心价值（情绪陪伴）的技术实现
2. **代码已存在**：`app/api/chat/route.ts` 已有完整实现，但缺少规范文档
3. **缺失的 Spec 文档**：需要补充 `chat-flow.md`、`chat-api.md`、`chat-states.md`

### 预期价值

| 维度 | 预期收益 |
|------|---------|
| 开发一致性 | 前后端开发有统一的 API 契约参考 |
| 测试覆盖 | QA 可根据状态机设计测试用例 |
| 文档完整性 | 完善 OpenSpec 核心流程文档 |

---

## 功能规格（来自已有 Spec）

### 验收标准 (AC)

| AC ID | 描述 | 实施状态 |
|-------|------|---------|
| AC-002.1 | 首页有明显的"开始对话"入口 | ✅ 已实施 |
| AC-002.2 | 支持文字输入，实时流式响应（打字机效果） | ⚠️ 部分实施（无流式） |
| AC-002.3 | AI 在每轮对话中识别用户情绪 | ✅ 已实施 |
| AC-002.4 | AI 回复必须体现共情，避免生硬的投资建议 | ✅ 已实施 |
| AC-002.5 | 对话历史保存到 Supabase `chat_messages` 表 | ✅ 已实施 |
| AC-002.6 | 用户可以查看最近 15 天的对话记录 | ⬜ 待验证 |
| AC-002.7 | 单次对话轮数无限制 | ✅ 已实施 |

### 现有实现分析

**API 端点**: `POST /api/chat`

**核心类型定义** (`lib/types.ts`):
- `Emotion`: anxious | panic | angry | greedy | calm
- `Intent`: vent | ask_reason | seek_advice | review | other
- `SafetyLevel`: low | medium | high
- `ChatMessage`: role, content, timestamp, response, guruId
- `ChatResponse`: emotion, intent, safety_level, reply, suggested_actions, review_prompt, tags

---

## 本次变更需补充的 Spec 文档

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/user-flows/chat-flow.md` | 本目录 `specs/chat-flow.md` | 对话用户流程图 |
| `specs/api-contracts/chat-api.md` | 本目录 `specs/chat-api.md` | API 契约规范 |
| `specs/state-machines/chat-states.md` | 本目录 `specs/chat-states.md` | 对话状态机 |

---

## 影响范围

### 现有代码（无需修改，仅文档化）

| 类型 | 文件 | 说明 |
|------|------|------|
| API | `app/api/chat/route.ts` | 主对话 API（OpenAI） |
| 类型 | `lib/types.ts` | ChatMessage, ChatResponse 等类型 |
| 内存 | `lib/memory.ts` | 对话历史存储 |
| RAG | `lib/rag.ts` | 知识检索 |
| 推理 | `lib/reasoning.ts` | 意图分类、上下文构建 |

### 需要修改的 Spec 文件

| 文件 | 修改内容 |
|------|---------|
| `specs/user-flows/README.md` | 更新 chat-flow 状态为已完成 |
| `openspec/README.md` | 更新相关条目状态 |

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| API 规范与代码不一致 | 低 | 规范基于现有代码编写 |
| 流式响应未实现 | 中 | 在规范中标注为 P1 增强项 |

---

## 评审检查清单

请评审人检查以下项目：

- [ ] 用户流程是否覆盖所有场景（正常对话/错误处理/离线）？
- [ ] API 契约是否与现有代码一致？
- [ ] 状态机是否覆盖所有 UI 状态？
- [ ] 是否有遗漏的 AC 验收标准？

---

## 下一步

1. **待评审通过** → 合并 specs 到主目录
2. **代码增强**（可选）→ 实现流式响应 (AC-002.2)
3. **归档** → 移动到 `archive/`

---

**最后更新**: 2026-01-21
