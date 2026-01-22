# 用户流程：零门槛启动 (Onboarding)

**版本**: v2.0 (简化版)
**更新日期**: 2026-01-21
**关联需求**: FR-001

---

## 流程概述

新用户首次打开 APP 时的引导流程，目标是在 **15 秒内** 完成初心设定并进入核心体验。

---

## 流程图

```mermaid
flowchart TD
    Start([用户打开 APP]) --> CheckOnboarded{已完成<br/>Onboarding?}

    CheckOnboarded -->|是| GoHome[跳转首页]
    CheckOnboarded -->|否| Welcome[欢迎页]

    Welcome --> |点击"开始"| SelectIntention[初心选择页]

    SelectIntention --> |选择初心| GenerateUUID[生成 Guest UUID]
    GenerateUUID --> SaveLocal[存储到 localStorage]
    SaveLocal --> SaveRemote{Supabase<br/>可用?}

    SaveRemote -->|是| CreateProfile[创建 user_profiles 记录]
    SaveRemote -->|否| SkipRemote[跳过远程存储]

    CreateProfile --> Loading[加载页]
    SkipRemote --> Loading

    Loading --> |2秒后| GoHome
    GoHome --> End([进入首页])

    style Welcome fill:#E8F5E9
    style SelectIntention fill:#E3F2FD
    style Loading fill:#FFF3E0
    style GoHome fill:#F3E5F5
```

---

## 页面详情

### 1. 欢迎页 (Welcome)

**目的**: 建立品牌认知，传递核心价值

**UI 元素**:
- Logo 徽章 (🌱)
- 标题: "欢迎来到伴投"
- 副标题: "你的投资心理陪伴伙伴"
- 3 个特性卡片:
  - 💗 情绪陪伴 - 理解你的投资焦虑
  - 📈 理性分析 - 大师视角深度解读
  - 🛡️ 心理守护 - 避免冲动决策
- 主按钮: "开始设置"

**交互**:
- 点击"开始设置" → 进入初心选择页
- 预计停留时间: 3-5 秒

---

### 2. 初心选择页 (Select Intention)

**目的**: 建立用户的投资心理锚点

**UI 元素**:
- 标题: "你的投资初心是什么？"
- 副标题: "这将帮助我们更好地理解你"
- 3 个初心卡片 (单选):

| 选项 | 图标 | 标题 | 描述 |
|------|------|------|------|
| long_term | 🌱 | 长期持有 | 我相信长期投资，希望在波动中保持定力 |
| opportunity | ⚡ | 把握机会 | 我关注市场机会，希望理性判断进出时机 |
| learning | 📚 | 学习成长 | 我是投资新手，想培养健康的投资心态 |

- 主按钮: "开启投资之旅" (选择后激活)

**交互**:
- 点击卡片 → 选中状态 (绿色边框 + 勾选图标)
- 点击主按钮 → 生成 UUID → 进入加载页
- 预计停留时间: 5-8 秒

---

### 3. 加载页 (Loading)

**目的**: 过渡动画，营造仪式感

**UI 元素**:
- 动画徽章 (☀️ 浮动动画)
- 标题: "正在准备你的专属陪伴..."
- 进度条 (渐变绿色)

**交互**:
- 自动播放 2 秒后跳转首页
- 期间完成: Guest UUID 存储、远程同步 (异步)

---

## 数据流

### localStorage 存储

```typescript
// 存储 Guest UUID
localStorage.setItem('bantou_guest_id', 'uuid-v4-string');

// 存储用户配置 (更新)
localStorage.setItem('bantou_user_config', JSON.stringify({
  hasOnboarded: true,
  investmentIntention: 'long_term', // 新增字段
  // ... 其他字段
}));
```

### Supabase 同步 (可选)

```sql
INSERT INTO user_profiles (id, guest, investment_goal, created_at)
VALUES ($guestId, true, $intention, NOW());
```

---

## 边界场景

### 场景 1: 老用户返回

```
条件: localStorage 中存在 hasOnboarded = true
行为: 跳过 Onboarding，直接进入首页
```

### 场景 2: 清除缓存后返回

```
条件: localStorage 被清除
行为: 重新进入 Onboarding 流程
注意: 如果 Supabase 有记录，可尝试恢复 (Future)
```

### 场景 3: 网络不可用

```
条件: Supabase 请求失败
行为: 仅存储到 localStorage，下次联网时同步
```

---

## 验收标准对照

| AC ID | 描述 | 流程节点 |
|-------|------|---------|
| AC-001.1 | 首次打开直接进入初心设定，无登录 | Welcome → SelectIntention |
| AC-001.2 | 展示 2-3 个预设选项，单选 | SelectIntention |
| AC-001.3 | 生成 Guest UUID 存储到 localStorage | GenerateUUID → SaveLocal |
| AC-001.4 | 完成后跳转首页 | Loading → GoHome |
| AC-001.5 | Guest 数据写入 Supabase | CreateProfile (可选) |

---

## 与旧版差异

| 项目 | 旧版 (v1.0) | 新版 (v2.0) |
|------|-------------|-------------|
| 步骤数 | 4 步 (欢迎/选股/配置/加载) | 3 步 (欢迎/初心/加载) |
| 必填项 | 选股 + 持仓配置 | 仅初心选择 |
| 预计时长 | 2-5 分钟 | < 15 秒 |
| Guest UUID | 无 | 有 |

---

**最后更新**: 2026-01-21
