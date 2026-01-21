# 实施任务清单：FR-003 投资心理复盘

**变更ID**: CHANGE-004
**状态**: 🟡 待评审通过后开始

---

## 前置条件

- [ ] 本变更提案已通过评审
- [ ] Supabase 数据库可访问
- [ ] 开发环境已配置

---

## 任务分解

### Phase 1: 规格评审与合并 (Day 0)

| 任务 | 负责人 | 状态 |
|------|--------|------|
| 评审 proposal.md | PM/Tech Lead | ⬜ 待评审 |
| 评审 review-flow.md 用户流程 | PM/UX | ⬜ 待评审 |
| 评审 review-api.md API 规范 | Tech Lead | ⬜ 待评审 |
| 评审 review-states.md 状态机 | 前端 Lead | ⬜ 待评审 |
| 评审通过后合并到 specs/ | 提案人 | ⬜ 待执行 |

---

### Phase 2: 数据库迁移 (Day 1)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 创建 review_entries 表迁移 | `supabase/migrations/xxx_review_entries.sql` | 表结构符合 spec |
| 添加 RLS 策略 | 同上 | 用户只能访问自己的数据 |
| 添加索引 | 同上 | user_id, created_at 索引 |
| 运行迁移并验证 | - | 本地测试通过 |

---

### Phase 3: 后端 API (Day 1)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 实现 POST /api/review | `app/api/review/route.ts` | 创建复盘记录 |
| 实现 GET /api/review | 同上 | 列表查询 + 分页 |
| 实现 GET /api/review/:id | `app/api/review/[id]/route.ts` | 单条查询 |
| 实现 DELETE /api/review/:id | 同上 | 删除记录 |
| 实现 AI 总结生成 | `app/api/review/route.ts` | GPT-4o-mini 调用 |
| 添加 ReviewEntry 类型 | `lib/supabase.ts` | 类型与 spec 一致 |

---

### Phase 4: 前端组件 (Day 2)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 创建 ReviewCard 组件 | `components/review/ReviewCard.tsx` | 3 步卡片 UI |
| 创建 EmotionSlider 组件 | `components/review/EmotionSlider.tsx` | 1-5 分滑动条 |
| 创建 ActionSelector 组件 | `components/review/ActionSelector.tsx` | 4 个决策选项 |
| 创建 ReviewSummary 组件 | `components/review/ReviewSummary.tsx` | AI 总结展示 |
| 创建 useReview hook | `hooks/useReview.ts` | 状态机逻辑 |
| 重构复盘列表页 | `app/review/page.tsx` | 使用新 API |
| 重构新建复盘页 | `app/review/new/page.tsx` | 使用 ReviewCard |

---

### Phase 5: 集成与测试 (Day 2)

| 任务 | 验收标准 |
|------|---------|
| AC-003.1 验收 | 对话页有"📝 记录"按钮 |
| AC-003.2 验收 | 30 分钟无交互弹出提示 |
| AC-003.3 验收 | 情绪滑动条 1-5 分可用 |
| AC-003.4 验收 | 4 个决策选项可选 |
| AC-003.5 验收 | 备注 200 字限制 |
| AC-003.6 验收 | AI 生成总结文本 |
| AC-003.7 验收 | 数据写入 Supabase |
| AC-003.8 验收 | 历史记录正确显示 |

---

## 验收清单

### 功能验收

- [ ] 用户可从对话页触发复盘
- [ ] 3 步复盘流程顺畅
- [ ] 情绪滑动条交互正常
- [ ] 决策选项单选正常
- [ ] 备注字数限制生效
- [ ] AI 总结在 3 秒内生成
- [ ] 历史记录正确展示

### 技术验收

- [ ] 数据库迁移执行成功
- [ ] API 响应格式符合 spec
- [ ] 错误处理完善
- [ ] 草稿自动保存正常
- [ ] TypeScript 编译无错误

---

## 数据迁移（可选）

如需迁移现有 localStorage 数据：

```typescript
// scripts/migrate-reviews.ts
async function migrateLocalStorageReviews() {
  const localReviews = JSON.parse(localStorage.getItem('reviews') || '[]');

  for (const review of localReviews) {
    await supabase.from('review_entries').insert({
      user_id: getCurrentUserId(),
      emotion_before: 3,  // 默认值
      emotion_after: 3,   // 默认值
      action_taken: 'lock',  // 默认值
      reflection: review.content,
      tags: review.tags,
      created_at: review.createdAt
    });
  }

  // 迁移完成后清除本地数据
  localStorage.removeItem('reviews');
}
```

---

## 完成后操作

1. [ ] 复制 `review-flow.md` 到 `specs/user-flows/`
2. [ ] 复制 `review-api.md` 到 `specs/api-contracts/`
3. [ ] 复制 `review-states.md` 到 `specs/state-machines/`
4. [ ] 更新 `specs/user-flows/README.md` 状态
5. [ ] 更新 `openspec/README.md` 状态标记
6. [ ] 将 `changes/fr-003-review/` 移动到 `archive/`
7. [ ] 通知团队变更已完成

---

**最后更新**: 2026-01-21
