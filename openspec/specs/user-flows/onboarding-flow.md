# 游客启动与初心设定流程

**流程ID**: UF-001  
**优先级**: P0 - Critical  
**涉及页面**: 启动页 → 初心设定页 → 首页

---

## 流程概述

新用户首次打开 Budvest PWA 时，无需注册即可开始使用。通过简单的"投资初心"设定（15秒内完成），系统生成唯一的 Guest UUID 并直接进入产品核心功能。

### 设计目标

- ✅ 零门槛启动，降低试用摩擦
- ✅ 建立心理锚点，为后续复盘提供参照
- ✅ 快速进入核心价值体验

---

## 完整流程图

```mermaid
flowchart TB
    Start([用户打开 PWA]) --> CheckLocal{检查 localStorage<br/>是否有 user_id?}
    
    CheckLocal -->|有| LoadHome[加载首页]
    CheckLocal -->|无| ShowWelcome[展示欢迎页<br/>3秒自动跳过]
    
    ShowWelcome --> ShowIntent[显示初心设定页<br/>\"你为什么开始投资？\"]
    
    ShowIntent --> SelectIntent{用户选择初心}
    
    SelectIntent -->|选项1| Opt1[\"长期持有，稳定增值\"]
    SelectIntent -->|选项2| Opt2[\"把握机会，灵活投资\"]
    SelectIntent -->|选项3| Opt3[\"其他（可选文字输入）\"]
    
    Opt1 --> CreateGuest{{调用 API<br/>POST /api/auth/guest}}
    Opt2 --> CreateGuest
    Opt3 --> CreateGuest
    
    CreateGuest --> APISuccess{API 成功?}
    
    APISuccess -->|是| SaveLocal[保存到 localStorage:<br/>user_id, intent, created_at]
    APISuccess -->|否| ShowError[显示错误提示<br/>\"网络异常，请重试\"]
    
    ShowError --> Retry{用户点击重试?}
    Retry -->|是| CreateGuest
    Retry -->|否| OfflineMode[进入离线模式<br/>数据暂存 IndexedDB]
    
    SaveLocal --> InsertDB{{写入 Supabase<br/>user_profiles 表}}
    
    InsertDB --> ShowWelcomeMsg[显示欢迎提示:<br/>\"欢迎加入 Budvest！\"]
    
    ShowWelcomeMsg --> Navigate[路由跳转到首页<br/>/]
    
    Navigate --> LoadHome
    
    LoadHome --> TrackEvent{{埋点事件<br/>page_view - home}}
    
    TrackEvent --> End([流程结束])
    
    OfflineMode --> QueueSync[队列同步:<br/>网络恢复后创建用户]
    QueueSync --> End
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style ShowError fill:#FFB6C1
    style APISuccess fill:#FFD700
    style CreateGuest fill:#87CEEB
    style InsertDB fill:#87CEEB
    style TrackEvent fill:#87CEEB
```

---

## 详细步骤说明

### 步骤 1: 检查本地存储

**触发条件**: 用户打开 PWA（首次或再次）

**前端逻辑**:

```typescript
// app/page.tsx
useEffect(() => {
  const userId = localStorage.getItem('user_id');
  
  if (userId) {
    // 已有用户，直接进入首页
    router.push('/');
  } else {
    // 新用户，显示初心设定
    router.push('/onboarding');
  }
}, []);
```

---

### 步骤 2: 展示欢迎页（可选）

**页面**: `/onboarding/welcome`

**内容**:

- Logo + Slogan: "让每一次心理波动都被温柔接住"
- 3秒后自动跳转到初心设定页
- 用户可点击"跳过"立即进入

---

### 步骤 3: 显示初心设定页

**页面**: `/onboarding/intent`

**UI 元素**:

```
┌─────────────────────────────────────┐
│                                     │
│    🌿 你为什么开始投资？            │
│                                     │
│    这将成为你的心理锚点，           │
│    在市场波动时提醒你初心。         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏔️ 长期持有，稳定增值         │ │
│  │ （适合价值投资者）             │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🚀 把握机会，灵活投资         │ │
│  │ （适合趋势交易者）             │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✍️ 其他（请输入）             │ │
│  │ [____________]                │ │
│  └───────────────────────────────┘ │
│                                     │
│         [开始体验] 按钮             │
│                                     │
└─────────────────────────────────────┘
```

**验收标准**:

- 用户必须选择至少一项
- "其他"选项需输入至少 5 个字符
- 点击"开始体验"时禁用按钮，显示 Loading

---

### 步骤 4: 创建 Guest 用户

**API 调用**: `POST /api/auth/guest`

**请求体**:

```json
{
  "intent": "长期持有，稳定增值",
  "source": "pwa_web"
}
```

**响应体（成功）**:

```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "intent": "长期持有，稳定增值",
    "created_at": "2026-01-20T08:15:00Z"
  }
}
```

**后端逻辑**:

```typescript
// app/api/auth/guest/route.ts
export async function POST(request: Request) {
  const { intent, source } = await request.json();

  // 生成 UUID
  const userId = crypto.randomUUID();

  // 插入 Supabase
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      intent,
      guest: true,
      source,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  // 埋点：新用户创建
  await trackEvent('user_created', {
    user_id: userId,
    intent,
    user_type: 'guest',
  });

  return Response.json({ success: true, data });
}
```

---

### 步骤 5: 保存到本地存储

**前端逻辑**:

```typescript
// app/onboarding/intent/page.tsx
const handleSubmit = async () => {
  setLoading(true);

  try {
    const response = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: selectedIntent, source: 'pwa_web' }),
    });

    const result = await response.json();

    if (result.success) {
      // 保存到 localStorage
      localStorage.setItem('user_id', result.data.user_id);
      localStorage.setItem('intent', result.data.intent);
      localStorage.setItem('created_at', result.data.created_at);
      localStorage.setItem('user_type', 'guest');

      // 显示欢迎提示
      toast.success('欢迎加入 Budvest！');

      // 延迟 1 秒后跳转
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    setError('网络异常，请重试');
  } finally {
    setLoading(false);
  }
};
```

---

### 步骤 6: 错误处理与离线支持

**网络异常**:

- 显示 Toast 提示："网络异常，请重试"
- 提供"重试"按钮
- 数据暂存到 IndexedDB

**离线模式**:

```typescript
// lib/offline-queue.ts
export async function queueGuestCreation(intent: string) {
  const db = await openDB('budvest-offline', 1, {
    upgrade(db) {
      db.createObjectStore('pending-actions');
    },
  });

  await db.put('pending-actions', {
    action: 'create_guest',
    intent,
    timestamp: Date.now(),
  }, 'guest-creation');
}

// 网络恢复后同步
window.addEventListener('online', async () => {
  const db = await openDB('budvest-offline', 1);
  const pending = await db.get('pending-actions', 'guest-creation');

  if (pending) {
    await fetch('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ intent: pending.intent, source: 'pwa_web' }),
    });
    await db.delete('pending-actions', 'guest-creation');
  }
});
```

---

## 边界条件处理

| 场景 | 处理方式 |
|------|---------|
| 用户已有 user_id | 跳过初心设定，直接进入首页 |
| 用户中途退出 | 数据不保存，下次重新设定 |
| 网络断开 | 离线模式，数据暂存 IndexedDB |
| API 超时（>5s） | 显示重试按钮 |
| 重复点击"开始体验" | 防抖处理，禁用按钮 |

---

## 埋点事件

| 事件 | 触发时机 | 属性 |
|------|---------|------|
| `page_view` | 进入初心设定页 | `{ page: 'onboarding' }` |
| `onboarding_intent_select` | 用户选择初心 | `{ intent, option_index }` |
| `user_created` | Guest 用户创建成功 | `{ user_id, intent, user_type: 'guest' }` |
| `onboarding_complete` | 完成初心设定 | `{ user_id, duration_seconds }` |

---

## 验收标准

- [ ] 首次打开 PWA，自动进入初心设定页
- [ ] 用户必须选择一项初心才能继续
- [ ] Guest UUID 生成并保存到 localStorage 和 Supabase
- [ ] 网络异常时显示错误提示 + 重试按钮
- [ ] 离线模式下数据暂存，网络恢复后自动同步
- [ ] 完成后自动跳转到首页
- [ ] 再次打开 PWA，直接进入首页（跳过初心设定）

---

**最后更新**: 2026-01-20  
**参考文档**: [Functional Requirements FR-001](../requirements/functional-requirements.md#fr-001)
