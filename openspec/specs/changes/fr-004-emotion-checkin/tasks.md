# 实施任务清单：FR-004 每日情绪打卡

**变更ID**: CHANGE-002
**预计工期**: 1 天
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
| 评审 emotion-api.md API 规范 | Tech Lead | ⬜ 待评审 |
| 评审 emotion-checkin-flow.md 用户流程 | PM/UX | ⬜ 待评审 |
| 评审 emotion-states.md 状态枚举 | Tech Lead | ⬜ 待评审 |
| 评审通过后合并到 specs/ | 提案人 | ⬜ 待执行 |

---

### Phase 2: 后端实现 (Day 1 上午)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 创建 emotion_logs 数据库迁移 | `supabase/migrations/xxx_emotion_logs.sql` | 表创建成功，RLS 策略正确 |
| 添加 EmotionLog 类型 | `lib/supabase.ts` | 类型与 spec 一致 |
| 实现 POST /api/emotion-checkin | `app/api/emotion-checkin/route.ts` | 支持新增和更新，次日锁定 |
| 实现 GET /api/emotion-checkin | 同上 | 返回当天打卡状态 |
| 实现 GET /api/emotion/trend | `app/api/emotion/trend/route.ts` | 返回趋势数据和摘要 |

---

### Phase 3: 本地存储降级 (Day 1 上午)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 添加 User ID 管理 | `lib/storage.ts` | Guest UUID 生成和存储 |
| 添加本地情绪日志存储 | `lib/storage.ts` | CRUD 操作正常 |
| 添加中国时区日期辅助函数 | `lib/storage.ts` | 日期计算正确 |

---

### Phase 4: 前端实现 (Day 1 下午)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 创建 EmotionCheckinCard 组件 | `components/emotion/EmotionCheckinCard.tsx` | 4 情绪选择，支持紧凑/完整模式 |
| 创建 EmotionTrendChart 组件 | `components/emotion/EmotionTrendChart.tsx` | 7 日趋势图，颜色渐变 |
| 创建组件导出索引 | `components/emotion/index.ts` | 正确导出 |
| 集成到首页 MarketTab | `components/MarketTab.tsx` | 替换原有心情选择 |

---

### Phase 5: 测试与验收 (Day 1 下午)

| 任务 | 验收标准 |
|------|---------|
| AC-004.1 验收 | 首页顶部显示情绪打卡入口 |
| AC-004.2 验收 | 4 个 Emoji 单选正常工作 |
| AC-004.3 验收 | 当天可重复打卡，次日锁定 |
| AC-004.4 验收 | 7 日趋势折线图正确显示 |
| AC-004.5 验收 | 颜色渐变（红→绿）正确 |
| AC-004.6 验收 | 数据持久化到 emotion_logs 表 |
| 离线降级验收 | Supabase 不可用时 localStorage 正常工作 |

---

## 验收清单

### 功能验收

- [ ] 用户可在首页进行情绪打卡
- [ ] 支持 4 种情绪选择
- [ ] 当天可多次打卡（覆盖）
- [ ] 过去日期无法修改
- [ ] 打卡后显示成功提示
- [ ] 可查看 7 日情绪趋势
- [ ] 趋势图颜色渐变正确

### 技术验收

- [ ] 数据库迁移执行成功
- [ ] API 响应格式符合 spec
- [ ] 错误处理完善
- [ ] 离线降级正常工作
- [ ] TypeScript 编译无错误

---

## 完成后操作

1. [ ] 更新 `specs/` 目录（合并本次 spec 文档）
2. [ ] 将 `changes/fr-004-emotion-checkin/` 移动到 `archive/`
3. [ ] 更新 openspec/README.md 状态标记
4. [ ] 通知团队变更已完成

---

**最后更新**: 2026-01-21
