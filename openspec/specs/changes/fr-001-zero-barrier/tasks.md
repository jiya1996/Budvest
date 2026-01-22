# 实施任务清单：FR-001 零门槛启动

**变更ID**: CHANGE-006
**预计工期**: 0.5 天
**状态**: 🟡 待评审通过后开始

---

## 前置条件

- [ ] 本变更提案已通过评审
- [ ] 开发环境已配置
- [ ] 理解现有 Onboarding.tsx 代码结构

---

## 任务分解

### Phase 1: 规格评审与合并 (Day 0)

| 任务 | 负责人 | 状态 |
|------|--------|------|
| 评审 proposal.md | PM/Tech Lead | ⬜ 待评审 |
| 评审 onboarding-flow.md 用户流程 | PM/UX | ⬜ 待评审 |
| 评审 onboarding-api.md API 规范 | Tech Lead | ⬜ 待评审 |
| 评审 guest-states.md 状态定义 | Tech Lead | ⬜ 待评审 |
| 评审通过后合并到 specs/ | 提案人 | ⬜ 待执行 |

---

### Phase 2: Guest UUID 机制 (Day 1 上午)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 创建 Guest 管理模块 | `lib/guest.ts` | 包含 getOrCreateGuestId(), isGuest() 函数 |
| 扩展 storage.ts | `lib/storage.ts` | 添加 GUEST_ID 存储 key |
| 添加 GuestProfile 类型 | `lib/types.ts` | 类型与 spec 一致 |
| 实现 POST /api/auth/guest | `app/api/auth/guest/route.ts` | 创建游客记录到 Supabase |

**代码示例 - lib/guest.ts**:

```typescript
const GUEST_ID_KEY = 'bantou_guest_id';

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function isGuest(): boolean {
  if (typeof window === 'undefined') return true;
  return !!localStorage.getItem(GUEST_ID_KEY);
}

export function clearGuestId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_ID_KEY);
}
```

---

### Phase 3: 简化 Onboarding 流程 (Day 1 上午)

| 任务 | 文件 | 验收标准 |
|------|------|---------|
| 更新初心选项 | `lib/data.ts` | 改为 3 个初心选项 |
| 重构 Onboarding 组件 | `components/Onboarding.tsx` | 只保留 Step 0 + Step 1 (初心选择) |
| 移除选股步骤 | `components/Onboarding.tsx` | 删除 Step 1 (选股) |
| 移除配置步骤 | `components/Onboarding.tsx` | 删除 Step 2 (配置持仓) |

**代码修改 - lib/data.ts**:

```typescript
// 替换原有 INVESTMENT_GOALS
export const INVESTMENT_INTENTIONS = [
  {
    id: 'long_term',
    label: '长期持有',
    description: '我相信长期投资，希望在波动中保持定力',
    icon: '🌱',
  },
  {
    id: 'opportunity',
    label: '把握机会',
    description: '我关注市场机会，希望理性判断进出时机',
    icon: '⚡',
  },
  {
    id: 'learning',
    label: '学习成长',
    description: '我是投资新手，想培养健康的投资心态',
    icon: '📚',
  },
];
```

**Onboarding 新流程**:

```
Step 0: 欢迎页 (保留现有)
  ↓
Step 1: 初心选择 (新增，替代选股)
  - 展示 3 个初心卡片
  - 用户选择 1 个
  ↓
Step 2: 加载页 (保留现有，简化文案)
  ↓
完成: 跳转首页
```

---

### Phase 4: 集成与测试 (Day 1 下午)

| 任务 | 验收标准 |
|------|---------|
| AC-001.1 验收 | 首次打开直接进入初心设定，无登录 |
| AC-001.2 验收 | 展示 3 个初心选项，可单选 |
| AC-001.3 验收 | 选择后生成 Guest UUID 存储到 localStorage |
| AC-001.4 验收 | 完成后自动跳转首页 |
| AC-001.5 验收 | Guest 数据写入 Supabase (可选，离线降级) |
| 时间测试 | 从打开到进入首页 < 15 秒 |

---

## 验收清单

### 功能验收

- [ ] 首次打开无需登录
- [ ] 展示 3 个初心选项
- [ ] 选择后 15 秒内进入首页
- [ ] Guest UUID 正确生成和存储
- [ ] 初心选择保存到 UserConfig

### 技术验收

- [ ] Guest UUID 格式正确 (UUID v4)
- [ ] localStorage 存储正常
- [ ] TypeScript 编译无错误
- [ ] 移动端响应式正常

### 回归测试

- [ ] 老用户 (hasOnboarded=true) 不受影响
- [ ] 清除 localStorage 后可重新 onboard

---

## 迁移说明

### 选股功能迁移

原 Onboarding Step 1 (选股) 将迁移到：

1. **首页入口**: 添加"+ 添加自选"按钮
2. **独立页面**: 创建 `/watchlist/add` 页面
3. **时机**: FR-006 心理锚点功能实施时完成

### 持仓配置迁移

原 Onboarding Step 2 (配置持仓) 将迁移到：

1. **持仓页面**: 在 PortfolioTab 添加"+ 添加持仓"入口
2. **时机**: FR-008 简化持仓管理功能实施时完成

---

## 完成后操作

1. [ ] 复制 `onboarding-flow.md` 到 `specs/user-flows/`
2. [ ] 复制 `onboarding-api.md` 到 `specs/api-contracts/`
3. [ ] 复制 `guest-states.md` 到 `specs/state-machines/`
4. [ ] 更新 `specs/user-flows/README.md` 状态
5. [ ] 更新 `openspec/README.md` 状态标记
6. [ ] 将 `changes/fr-001-zero-barrier/` 移动到 `archive/`
7. [ ] 通知团队变更已完成

---

**最后更新**: 2026-01-21
