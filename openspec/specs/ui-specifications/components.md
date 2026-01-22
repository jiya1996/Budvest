# 组件规范

本文档定义了 Budvest 应用中通用组件的使用规范和 API。

## 卡片组件 (Card)

### 基础卡片

```tsx
import Card from '@/components/Card';

<Card>
  <p>卡片内容</p>
</Card>
```

**样式特性**：
- 白色背景 (`#fff`)
- 圆角 `12px`
- 内边距 `16px`
- 底部外边距 `16px`
- 轻微阴影 (`0 1px 3px rgba(0,0,0,0.1)`)

**Props**：
- `children`: ReactNode - 卡片内容
- `style?`: React.CSSProperties - 自定义样式

### Grow 风格卡片

使用 CSS 类 `.grow-card` 或 `.grow-card-solid`：

```tsx
<div className="grow-card">
  {/* 半透明卡片，带毛玻璃效果 */}
</div>

<div className="grow-card-solid">
  {/* 不透明卡片 */}
</div>
```

**样式特性**：
- 背景：`rgba(255, 255, 255, 0.85)` (grow-card) 或 `#FFFFFF` (grow-card-solid)
- 毛玻璃效果：`backdrop-filter: blur(20px)`
- 圆角：`32px` (xl)
- 阴影：`var(--shadow-md)`
- 边框：`1px solid rgba(255, 255, 255, 0.6)`
- 悬停效果：阴影增强，轻微上移

## 按钮组件

### 主要按钮 (Grow Button)

```tsx
<button className="grow-btn">
  主要操作
</button>
```

**样式特性**：
- 背景：主色渐变 (`--primary-gradient`)
- 文字颜色：白色
- 圆角：`100px` (pill)
- 内边距：`14px 28px`
- 字重：`600`
- 阴影：绿色发光效果
- 悬停：上移 `2px`，阴影增强

### 次要按钮

```tsx
<button className="grow-btn-secondary">
  次要操作
</button>
```

**样式特性**：
- 背景：卡片背景色
- 文字颜色：主要文字色
- 边框：`2px solid rgba(148, 163, 184, 0.2)`
- 圆角：`100px` (pill)
- 内边距：`12px 24px`

## 输入框组件

```tsx
<input className="grow-input" placeholder="输入内容..." />
```

**样式特性**：
- 宽度：`100%`
- 内边距：`14px 18px`
- 背景：`rgba(255, 255, 255, 0.8)`
- 边框：`2px solid rgba(148, 163, 184, 0.15)`
- 圆角：`24px` (lg)
- 字体大小：`15px`
- 聚焦效果：边框变为主色，外发光

## 徽章组件

### 基础徽章

```tsx
<span className="grow-badge">标签</span>
<span className="grow-badge-yellow">黄色标签</span>
<span className="grow-badge-blue">蓝色标签</span>
<span className="grow-badge-purple">紫色标签</span>
```

**样式特性**：
- 内边距：`6px 14px`
- 圆角：`100px` (pill)
- 字体大小：`12px`
- 字重：`600`
- 背景和文字颜色根据类型变化

### 太阳徽章

```tsx
<div className="sun-badge">☀️</div>
<div className="sun-badge-sm">☀️</div>  {/* 32px */}
<div className="sun-badge-lg">☀️</div>  {/* 64px */}
```

**样式特性**：
- 尺寸：`48px` (默认), `32px` (sm), `64px` (lg)
- 背景：黄色渐变
- 阴影：多层阴影，半拟物风格
- 高光效果：伪元素实现

### 云朵徽章

```tsx
<div className="cloud-badge">⛅</div>
```

**样式特性**：
- 尺寸：`48px`
- 背景：蓝色渐变
- 阴影：多层阴影

## 进度条组件

```tsx
<div className="grow-progress">
  <div className="grow-progress-bar" style={{ width: '60%' }}></div>
</div>
```

**样式特性**：
- 高度：`12px`
- 背景：`rgba(148, 163, 184, 0.15)`
- 进度条：主色渐变
- 圆角：`100px` (pill)
- 过渡动画：`0.6s ease`

## 玻璃罐效果

```tsx
<div className="glass-jar">
  {/* 内容 */}
  <div className="glass-jar-lid"></div> {/* 可选：盖子 */}
</div>
```

**样式特性**：
- 背景：多层渐变，模拟玻璃效果
- 圆角：顶部 `40px`，底部 `60px`
- 边框：`2px solid rgba(200, 200, 200, 0.4)`
- 阴影：多层阴影，模拟立体感
- 高光：伪元素实现

**使用场景**：
- 投资金额展示
- 成就展示
- 特殊数据可视化

## 底部导航 (BottomNav)

```tsx
import BottomNav from '@/components/BottomNav';

<BottomNav 
  activeTab="market" 
  onTabChange={(tab) => console.log(tab)} 
/>
```

**Props**：
- `activeTab?`: `'market' | 'companion' | 'portfolio' | 'profile'` - 当前激活的标签页
- `onTabChange?`: `(tab: TabType) => void` - 标签切换回调

**样式特性**：
- 高度：`84px`
- 背景：渐变白色，毛玻璃效果
- 顶部阴影：`0 -4px 20px rgba(148, 163, 184, 0.08)`
- 安全区域适配：`safe-bottom` 类

**标签项**：
- **市** (market): 黄色渐变
- **伴** (companion): 紫色渐变
- **投** (portfolio): 绿色渐变
- **我** (profile): 蓝色渐变

**交互**：
- 激活状态：图标放大，背景渐变，阴影增强
- 悬停状态：背景变灰
- 过渡动画：`300ms`

## 标签页组件

### MarketTab

```tsx
<MarketTab
  portfolio={portfolio}
  totalPrincipal={totalPrincipal}
  totalProfit={totalProfit}
  animateCoins={animateCoins}
/>
```

**Props**：
- `portfolio`: PortfolioItem[] - 投资组合
- `totalPrincipal`: number - 总投入本金
- `totalProfit`: number - 总盈亏
- `animateCoins`: boolean - 是否显示金币动画

### CompanionTab

```tsx
<CompanionTab />
```

### PortfolioTab

```tsx
<PortfolioTab
  portfolio={portfolio}
  onPortfolioUpdate={(newPortfolio) => {
    // 更新投资组合
  }}
/>
```

**Props**：
- `portfolio`: PortfolioItem[] - 投资组合
- `onPortfolioUpdate`: `(portfolio: PortfolioItem[]) => void` - 更新回调

### ProfileTab

```tsx
<ProfileTab
  onResetOnboarding={handleReset}
  portfolio={portfolio}
  totalPrincipal={totalPrincipal}
  totalProfit={totalProfit}
/>
```

**Props**：
- `onResetOnboarding`: `() => void` - 重置引导流程
- `portfolio`: PortfolioItem[] - 投资组合
- `totalPrincipal`: number - 总投入本金
- `totalProfit`: number - 总盈亏

## 引导组件 (Onboarding)

```tsx
<Onboarding onFinish={handleOnboardingFinish} />
```

**Props**：
- `onFinish`: `(data: { portfolio: PortfolioItem[]; totalPrincipal: number }) => void` - 完成回调

## PWA 安装提示

```tsx
<PWAInstallPrompt />
```

自动检测 PWA 安装状态，显示安装提示。

## 弹窗组件 (Modal)

### 标准弹窗结构

```tsx
{showModal && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
    onClick={handleClose}
  >
    <div className="w-full max-w-md">
      <div
        className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* 弹窗内容 */}
      </div>
    </div>
  </div>
)}
```

### 嵌套在手机容器内的弹窗

当弹窗需要在手机容器内显示时（如 portfolio/manage 页面），使用 `absolute` 定位：

```tsx
{showModal && (
  <div
    className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
    style={{ zIndex: 9999 }}
    onClick={handleClose}
  >
    <div className="w-full max-w-md">
      <div
        className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* 弹窗内容 */}
      </div>
    </div>
  </div>
)}
```

**样式特性**：

**遮罩层 (Overlay)**：
- 定位：`fixed` 或 `absolute`（根据容器决定）
- 覆盖范围：`inset-0`（全屏）
- 背景：`bg-black/50`（50% 透明度黑色）
- 布局：`flex items-center justify-center`（内容居中）
- Z-index：`z-[100]` 或 `9999`（确保在最上层）
- 内边距：`p-4`（防止内容贴边）

**外层容器**：
- 宽度：`w-full max-w-md`（最大 448px）
- 作用：限制弹窗宽度，保持与手机容器一致

**内容容器**：
- 背景：`bg-white`（白色）
- 圆角：`rounded-2xl`（16px）
- 内边距：`p-6`（24px）
- 阴影：`shadow-2xl`（深阴影）
- 最大高度：`max-h-[90vh]`（不超过视口 90%）
- 滚动：`overflow-y-auto`（内容过多时可滚动）
- 动态高度：`maxHeight: 'calc(100vh - 2rem)'`（考虑外边距）

**交互行为**：
- 点击遮罩层关闭：`onClick={handleClose}`
- 阻止事件冒泡：`onClick={(e) => e.stopPropagation()}`（内容区域）
- 关闭按钮：通常在右上角，使用 `X` 图标

### 弹窗头部

```tsx
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    <img src={logo} alt={name} className="w-10 h-10 rounded-lg" />
    <div>
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  </div>
  <button
    onClick={handleClose}
    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
  >
    <X size={20} className="text-gray-400" />
  </button>
</div>
```

**样式特性**：
- 布局：`flex items-center justify-between`
- 底部间距：`mb-6`
- 图标尺寸：`w-10 h-10`
- 标题字体：`text-lg font-bold text-gray-700`
- 副标题字体：`text-xs text-gray-400`
- 关闭按钮：`w-8 h-8`，悬停时背景变灰

### 弹窗表单内容

```tsx
<div className="space-y-4">
  <div>
    <label className="text-sm font-semibold text-gray-600 mb-2 block">
      字段名称 <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
      placeholder="请输入..."
    />
  </div>
</div>
```

**样式特性**：
- 表单间距：`space-y-4`
- 标签样式：`text-sm font-semibold text-gray-600 mb-2 block`
- 必填标记：`text-red-500`
- 输入框：`w-full px-4 py-3 rounded-xl border border-gray-200`
- 聚焦效果：`focus:border-green-500 focus:outline-none`

### 弹窗按钮组

```tsx
<div className="flex gap-3 mt-6">
  <button
    onClick={handleCancel}
    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
  >
    取消
  </button>
  <button
    onClick={handleConfirm}
    className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
  >
    确认
  </button>
</div>
```

**样式特性**：
- 布局：`flex gap-3`（按钮等宽，间距 12px）
- 顶部间距：`mt-6`
- 按钮宽度：`flex-1`（平分空间）
- 高度：`py-3`
- 圆角：`rounded-xl`
- 取消按钮：灰色背景 `bg-gray-100`
- 确认按钮：绿色背景 `bg-green-500`
- 悬停效果：背景色加深

### Z-index 层级规范

- **全局弹窗**：`z-[100]` 或更高
- **嵌套弹窗**（手机容器内）：`z-index: 9999`
- **Toast 通知**：`z-[200]`
- **Loading 遮罩**：`z-[300]`

### 使用场景

- 添加/编辑表单
- 确认操作
- 详情展示
- 选择器
- 警告提示

### 注意事项

1. **定位方式**：
   - 全局弹窗使用 `fixed`
   - 容器内弹窗使用 `absolute`

2. **事件处理**：
   - 遮罩层添加 `onClick` 关闭
   - 内容区域添加 `stopPropagation` 阻止冒泡

3. **响应式**：
   - 使用 `max-w-md` 限制最大宽度
   - 使用 `p-4` 防止内容贴边
   - 使用 `max-h-[90vh]` 防止内容超出视口

4. **可访问性**：
   - 添加 ESC 键关闭功能
   - 添加焦点管理
   - 添加 ARIA 标签

## 组件使用原则

1. **优先使用现有组件**：避免重复实现相同功能的组件
2. **保持样式一致**：使用设计令牌和 CSS 类
3. **响应式设计**：确保在不同屏幕尺寸下正常显示
4. **可访问性**：添加适当的 ARIA 标签和键盘支持
5. **性能优化**：避免不必要的重渲染

## 扩展组件

创建新组件时：

1. 遵循现有组件的命名和结构规范
2. 使用设计令牌而非硬编码值
3. 提供 TypeScript 类型定义
4. 添加必要的注释和文档
5. 考虑可复用性和可扩展性

