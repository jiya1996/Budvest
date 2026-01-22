# 设计令牌 (Design Tokens)

设计令牌是设计系统的基础元素，定义了颜色、字体、间距、圆角、阴影等视觉属性。

## 颜色系统

### 背景色

```css
--bg-gradient: linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)
--bg-light: #F5F8FC
--bg-card: rgba(255, 255, 255, 0.85)
--bg-card-solid: #FFFFFF
```

**使用场景**：
- `bg-gradient`: 页面主背景
- `bg-light`: 浅色背景区域
- `bg-card`: 卡片背景（半透明，带毛玻璃效果）
- `bg-card-solid`: 卡片背景（不透明）

### 主色调 - 友好绿色

```css
--primary-light: #DCFCE7
--primary: #4ADE80
--primary-dark: #22C55E
--primary-gradient: linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)
```

**使用场景**：
- 主要操作按钮
- 成功状态指示
- 进度条
- 积极情绪的视觉表达

### 辅助色系

#### 暖黄色 - 太阳徽章
```css
--yellow-light: #FEF9C3
--yellow: #FACC15
--yellow-dark: #EAB308
--yellow-gradient: linear-gradient(135deg, #FDE68A 0%, #FACC15 50%, #F59E0B 100%)
```

**使用场景**：
- 完美投资日徽章
- 高优先级提示
- 市场标签页激活状态

#### 柔和蓝色 - 水滴/平静
```css
--blue-light: #DBEAFE
--blue: #60A5FA
--blue-dark: #3B82F6
--blue-gradient: linear-gradient(135deg, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)
```

**使用场景**：
- 信息提示
- 冷静情绪表达
- 我的标签页激活状态

#### 淡紫色 - 睡眠/放松
```css
--purple-light: #F3E8FF
--purple: #A78BFA
--purple-dark: #8B5CF6
--purple-gradient: linear-gradient(135deg, #C4B5FD 0%, #A78BFA 50%, #8B5CF6 100%)
```

**使用场景**：
- 冷静徽章
- 伴投标签页激活状态
- 放松状态的视觉表达

#### 粉红色 - 爱心/关怀
```css
--pink-light: #FCE7F3
--pink: #F472B6
--pink-dark: #EC4899
```

**使用场景**：
- 成长奖章
- 关怀类提示

#### 橙色 - 能量/活力
```css
--orange-light: #FFEDD5
--orange: #FB923C
--orange-dark: #F97316
```

**使用场景**：
- 美好投资日徽章
- 能量类提示

### 文本颜色

```css
--text-primary: #374151    /* 主要文字 - 深灰 */
--text-secondary: #6B7280  /* 次要文字 - 中灰 */
--text-muted: #9CA3AF      /* 辅助文字 - 浅灰 */
--text-inverse: #FFFFFF    /* 反色文字 */
```

**使用场景**：
- `text-primary`: 标题、重要内容
- `text-secondary`: 副标题、次要信息
- `text-muted`: 提示文字、占位符
- `text-inverse`: 深色背景上的文字

### 状态颜色

```css
--profit: #22C55E    /* 盈利 - 绿色 */
--loss: #F87171      /* 亏损 - 柔和红色 */
--status-success: #22C55E
--status-warning: #F59E0B
--status-error: #EF4444
--status-info: #3B82F6
```

## 圆角系统

```css
--radius-sm: 12px    /* 小圆角 - 标签、小按钮 */
--radius-md: 16px    /* 中圆角 - 卡片 */
--radius-lg: 24px    /* 大圆角 - 大卡片 */
--radius-xl: 32px    /* 超大圆角 - 特殊卡片 */
--radius-2xl: 40px   /* 特大圆角 - 玻璃罐效果 */
--radius-pill: 100px /* 药丸形 - 按钮、输入框 */
```

**使用规则**：
- 按钮：使用 `pill` 圆角
- 卡片：使用 `lg` 或 `xl` 圆角
- 标签：使用 `sm` 圆角
- 输入框：使用 `lg` 或 `pill` 圆角

## 阴影系统

### 基础阴影

```css
--shadow-sm: 0 2px 8px rgba(148, 163, 184, 0.1)
--shadow-md: 0 4px 16px rgba(148, 163, 184, 0.12)
--shadow-lg: 0 8px 32px rgba(148, 163, 184, 0.15)
--shadow-xl: 0 12px 48px rgba(148, 163, 184, 0.18)
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.05)
```

**使用场景**：
- `shadow-sm`: 轻微浮起效果
- `shadow-md`: 标准卡片阴影（默认）
- `shadow-lg`: 悬停状态、重要卡片
- `shadow-xl`: 模态框、重要提示
- `shadow-inner`: 内阴影，用于凹陷效果

### 发光阴影

```css
--shadow-glow-green: 0 4px 20px rgba(74, 222, 128, 0.3)
--shadow-glow-yellow: 0 4px 20px rgba(250, 204, 21, 0.3)
--shadow-glow-blue: 0 4px 20px rgba(96, 165, 250, 0.3)
--shadow-glow-purple: 0 4px 20px rgba(167, 139, 250, 0.3)
```

**使用场景**：
- 激活状态的按钮
- 徽章效果
- 重要操作的视觉强调

## 间距系统

```css
--spacing-xs: 4px   /* 极小间距 - 图标与文字 */
--spacing-sm: 8px   /* 小间距 - 紧密元素 */
--spacing-md: 16px  /* 标准间距 - 默认 */
--spacing-lg: 24px  /* 大间距 - 区块之间 */
--spacing-xl: 32px  /* 超大间距 - 页面边距 */
--spacing-2xl: 48px /* 特大间距 - 大区块之间 */
```

**使用规则**：
- 元素内部间距：`xs` 或 `sm`
- 元素之间间距：`md` 或 `lg`
- 区块之间间距：`lg` 或 `xl`
- 页面边距：`xl` 或 `2xl`

## 字体系统

### 字体大小

```css
/* 通过 Tailwind 类使用 */
text-xs: 12px    /* 辅助文字 */
text-sm: 14px    /* 次要文字 */
text-base: 16px  /* 正文（默认） */
text-lg: 18px    /* 大文字 */
text-xl: 20px    /* 标题 */
text-2xl: 24px   /* 大标题 */
```

### 字重

```css
font-normal: 400   /* 正文 */
font-medium: 500   /* 次要标题 */
font-semibold: 600 /* 标题 */
font-bold: 700     /* 重要标题 */
```

### 行高

```css
leading-tight: 1.25   /* 标题 */
leading-normal: 1.5   /* 正文（默认） */
leading-relaxed: 1.75 /* 长文本 */
```

## 动画时长

```css
transition-fast: 150ms   /* 快速反馈 */
transition-base: 300ms   /* 标准过渡（默认） */
transition-slow: 500ms   /* 慢速过渡 */
```

## 响应式断点

```css
/* Tailwind 默认断点 */
sm: 640px   /* 小屏设备 */
md: 768px   /* 平板 */
lg: 1024px  /* 桌面 */
xl: 1280px  /* 大桌面 */
```

## 安全区域

```css
.safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
```

**使用场景**：
- 底部导航栏必须使用 `safe-bottom`
- 顶部状态栏区域使用 `safe-top`

## 实现参考

设计令牌在以下文件中定义：

- **CSS 变量**: `app/globals.css`
- **TypeScript 常量**: `lib/design-system.ts`
- **Tailwind 配置**: `tailwind.config.js`

## 使用示例

```tsx
// 使用 CSS 变量
<div style={{ background: 'var(--primary-gradient)' }}>

// 使用设计系统模块
import { colors, borderRadius, shadows } from '@/lib/design-system';

<div style={{
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.lg,
  boxShadow: shadows.md,
}}>
```

