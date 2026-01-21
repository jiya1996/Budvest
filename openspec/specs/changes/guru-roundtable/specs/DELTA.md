# Delta: 对现有 Spec 的修改

**变更ID**: ******误删了得确认一下
**状态**: 🟡 待评审通过后执行

---

## 概述

本变更提案通过后，需要对以下现有文件进行修改。

---

## 新增文件

| 目标路径 | 来源 | 说明 |
|---------|------|------|
| `specs/ai-system/guru-roundtable.md` | 本目录 `guru-roundtable.md` | 圆桌讨论主规格 |
| `specs/user-flows/guru-roundtable-flow.md` | 本目录 `guru-roundtable-flow.md` | 用户流程文档 |

---

## 修改文件

### 1. `specs/ai-system/spec.md`

**位置**: Agent 6-7: Future Mentors 章节之后

**新增内容**:

```markdown
---

### 扩展系统：投资牛人圆桌讨论

详见 **[guru-roundtable.md](./guru-roundtable.md)**

圆桌讨论是 Mentor 的**增强模式**，允许用户选择 2-4 位投资大师同时参与讨论：

- 6 位投资牛人：巴菲特、芒格、格雷厄姆、达里奥、林奇、索罗斯
- 核心输出：**错误警示 + 思考框架**（而非买卖建议）
- 并行执行，综合分析共识与分歧

触发方式：
- 命令 `/roundtable` 或 `/圆桌`
- 复杂问题时 AI 主动建议
```

---

### 2. `specs/user-flows/README.md`

**位置**: 核心流程清单表格

**新增行**:

```markdown
| 投资牛人圆桌讨论 | [guru-roundtable-flow.md](./guru-roundtable-flow.md) | P1 | ✅ 已完成 |
```

---

### 3. `specs/database/spec.md` (可选)

**如需在数据库章节添加新表**:

```sql
-- 圆桌讨论记录表
CREATE TABLE roundtable_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id UUID,
  user_question TEXT NOT NULL,
  detected_emotion VARCHAR(50),
  selected_gurus TEXT[] NOT NULL,
  market_context JSONB,
  guru_responses JSONB NOT NULL,
  synthesis JSONB NOT NULL,
  user_saved_to_review BOOLEAN DEFAULT FALSE,
  user_set_reminder BOOLEAN DEFAULT FALSE,
  reminder_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tokens_used INTEGER,
  response_time_ms INTEGER
);
```

---

## 执行步骤

评审通过后，按以下顺序执行：

1. [ ] 复制 `guru-roundtable.md` 到 `specs/ai-system/`
2. [ ] 复制 `guru-roundtable-flow.md` 到 `specs/user-flows/`
3. [ ] 修改 `specs/ai-system/spec.md` 添加引用
4. [ ] 修改 `specs/user-flows/README.md` 添加流程链接
5. [ ] (可选) 修改 `specs/database/spec.md` 添加新表
6. [ ] 更新 `openspec/README.md` 文件树状态标记
7. [ ] 将 `changes/guru-roundtable/` 移动到 `archive/`

---

**最后更新**: 2026-01-21
