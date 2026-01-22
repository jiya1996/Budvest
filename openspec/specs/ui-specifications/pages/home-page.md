# 首页规范

首页是应用的主入口，包含市场数据、投资组合概览和导航功能。

## 页面结构

```
┌─────────────────────────┐
│   Status Bar (桌面)     │
├─────────────────────────┤
│   Header                │
│   - 标题: 伴投          │
│   - 用户头像按钮        │
├─────────────────────────┤
│                         │
│   Tab Content           │
│   (Market/Companion/    │
│    Portfolio/Profile)   │
│                         │
├─────────────────────────┤
│   Bottom Navigation     │
└─────────────────────────┘
```

## 布局规范

### 容器

- **最大宽度**: `max-w-md` (448px)
- **高度**: `100dvh` (移动端) 或 `844px` (桌面模拟)
- **背景**: `bg-slate-50`
- **圆角**: `md:rounded-[40px]` (仅桌面)
- **边框**: `md:border-[8px] md:border-slate-800` (仅桌面)
- **阴影**: `shadow-2xl` (仅桌面)

### Status Bar (仅桌面模拟)

```tsx
<div className="hidden md:flex h-12 w-full justify-between items-center px-6 pt-2 z-50 bg-white/80 backdrop-blur-sm sticky top-0">
  <span>9:41</span>
  <div>{/* 信号图标 */}</div>
</div>
```

- **高度**: `48px`
- **背景**: `rgba(255, 255, 255, 0.8)` + 毛玻璃效果
- **位置**: 固定在顶部

### Header

```tsx
<header className="px-6 py-3 bg-white/80 backdrop-blur-sm z-40 flex justify-between items-center border-b border-slate-50">
  <div>
    <h1 className="text-xl font-bold text-slate-800">伴投</h1>
  </div>
  <button>{/* 用户头像 */}</button>
</header>
```

**样式规范**：
- **内边距**: `px-6 py-3`
- **背景**: `bg-white/80` + 毛玻璃效果
- **边框**: 底部 `1px solid rgba(0, 0, 0, 0.05)`
- **标题**: `text-xl font-bold text-slate-800`

### Main Content

```tsx
<main className="flex-1 overflow-hidden relative bg-slate-50">
  {renderTab()}
</main>
```

- **布局**: `flex-1` 占据剩余空间
- **溢出**: `overflow-hidden`
- **背景**: `bg-slate-50`

### Bottom Navigation

使用 `BottomNav` 组件，详见 [组件规范](../components.md#底部导航-bottomnav)

### Home Indicator (仅桌面模拟)

```tsx
<div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full opacity-20 z-50"></div>
```

## 标签页内容

### Market Tab (市场)

显示市场数据、投资组合概览和金币动画。

**主要元素**：
- 市场数据卡片
- 投资组合列表
- 总投入本金和盈亏
- 金币掉落动画（完成引导后）

**数据来源**：
- `portfolio`: 投资组合数据
- `totalPrincipal`: 总投入本金
- `totalProfit`: 总盈亏

### Companion Tab (伴投)

AI 对话界面入口，显示对话历史或快速入口。

### Portfolio Tab (投资)

投资组合管理界面，显示持仓详情和管理功能。

### Profile Tab (我的)

用户设置和统计信息。

## 引导流程

### Onboarding 组件

首次访问时显示引导流程：

```tsx
{!hasOnboarded ? (
  <Onboarding onFinish={handleOnboardingFinish} />
) : (
  // 主界面
)}
```

**完成引导后**：
1. 保存用户配置到后端和 localStorage
2. 切换到 Market Tab
3. 触发金币动画 (`animateCoins = true`)

## 状态管理

### 本地状态

```tsx
const [hasOnboarded, setHasOnboarded] = useState(false);
const [activeTab, setActiveTab] = useState<TabType>('market');
const [animateCoins, setAnimateCoins] = useState(false);
const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
const [totalPrincipal, setTotalPrincipal] = useState(0);
const [totalProfit, setTotalProfit] = useState(0);
```

### 数据加载

- 从 `localStorage` 读取用户配置
- 调用 `/api/portfolio/init` 初始化投资组合
- 实时计算总投入本金和盈亏

## URL 参数

支持通过 URL 参数切换标签页：

```
/?tab=market
/?tab=companion
/?tab=portfolio
/?tab=profile
```

## 响应式设计

### 移动端
- 全屏显示 (`100dvh`)
- 无圆角和边框
- 隐藏 Status Bar 和 Home Indicator

### 桌面端
- 固定尺寸 (`max-w-md h-[844px]`)
- 圆角和边框模拟手机外观
- 显示 Status Bar 和 Home Indicator

## 交互规范

### 标签切换
- 点击底部导航切换标签
- 平滑过渡动画 (`300ms`)
- URL 同步更新

### 用户头像点击
- 切换到 Profile Tab
- 平滑过渡

### 从管理页面返回
- 自动刷新投资组合数据
- 切换到 Portfolio Tab（如果从管理页面返回）

## 加载状态

```tsx
if (isLoading) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-200">
      <div className="text-slate-500">加载中...</div>
    </div>
  );
}
```

## 错误处理

- 后端初始化失败时，降级使用 localStorage
- 显示错误提示（使用 `react-hot-toast`）
- 保持应用可用性

## 性能优化

1. **懒加载**: Tab 内容按需渲染
2. **数据缓存**: 使用 localStorage 缓存用户配置
3. **防抖**: 避免频繁的数据更新
4. **动画优化**: 使用 CSS 动画而非 JavaScript

## 可访问性

- 使用语义化 HTML 标签
- 添加适当的 ARIA 标签
- 支持键盘导航
- 确保颜色对比度符合 WCAG AA 标准

