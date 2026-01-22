# 交互规范

本文档定义了 Budvest 应用中的动画、过渡效果、手势等交互细节。

## 动画系统

### 基础动画

#### Float (浮动)

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

**使用场景**：
- 徽章、图标等装饰元素
- 营造轻松愉悦的氛围

**参数**：
- **时长**: `3s`
- **缓动**: `ease-in-out`
- **重复**: `infinite`
- **位移**: `-8px`

#### Pulse Soft (柔和脉冲)

```css
@keyframes pulse-soft {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
}

.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}
```

**使用场景**：
- 重要提示元素
- 需要吸引注意但不突兀的元素

**参数**：
- **时长**: `2s`
- **缩放**: `1.02` (2%)
- **透明度变化**: `1` → `0.8` → `1`

#### Drop In (掉落进入)

```css
@keyframes dropIn {
  0% {
    opacity: 0;
    transform: translateY(-50px) scale(0.8);
  }
  60% {
    transform: translateY(5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-drop-in {
  animation: dropIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

**使用场景**：
- 页面元素初始加载
- 新内容出现
- 金币掉落动画

**参数**：
- **时长**: `0.6s`
- **缓动**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (弹性效果)
- **初始位置**: `translateY(-50px) scale(0.8)`
- **弹跳**: `translateY(5px) scale(1.02)` (60%)

#### Fade Slide Up (淡入上滑)

```css
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fadeSlideUp 0.5s ease forwards;
}
```

**使用场景**：
- 列表项出现
- 消息出现
- 卡片加载

**参数**：
- **时长**: `0.5s`
- **缓动**: `ease`
- **初始位置**: `translateY(20px)`

#### Shine (闪光)

```css
@keyframes shine {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

**使用场景**：
- 徽章高光效果
- 特殊按钮强调

**实现**：
需要配合渐变背景和 `background-size` 使用。

#### Width (宽度动画)

```css
@keyframes width {
  from { width: 0%; }
  to { width: 100%; }
}

.animate-width {
  animation: width 2.5s ease-in-out forwards;
}
```

**使用场景**：
- 进度条填充
- 加载指示器

**参数**：
- **时长**: `2.5s`
- **缓动**: `ease-in-out`

## 过渡效果

### 标准过渡

```css
transition: all 0.3s ease;
```

**使用场景**：
- 按钮悬停
- 卡片交互
- 颜色变化

**参数**：
- **属性**: `all`
- **时长**: `300ms`
- **缓动**: `ease`

### 快速过渡

```css
transition: all 0.15s ease;
```

**使用场景**：
- 快速反馈操作
- 高频交互元素

### 慢速过渡

```css
transition: all 0.5s ease;
```

**使用场景**：
- 页面切换
- 重要状态变化

## 悬停效果

### 卡片悬停

```css
.grow-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

**效果**：
- 阴影增强
- 轻微上移 (`-2px`)

### 按钮悬停

```css
.grow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(74, 222, 128, 0.4);
}
```

**效果**：
- 上移 (`-2px`)
- 阴影增强和扩散

### 标签页悬停

```css
.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
```

**效果**：
- 背景色变化

## 点击反馈

### 按钮点击

```css
.grow-btn:active {
  transform: translateY(0);
}
```

**效果**：
- 按下时回到原位置
- 提供触觉反馈

### 卡片点击

```css
.grow-card:active {
  transform: scale(0.98);
}
```

**效果**：
- 轻微缩小 (`0.98`)
- 模拟按下效果

## 加载状态

### 骨架屏

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

**使用场景**：
- 数据加载时
- 内容占位

### 加载指示器

```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
</div>
```

**效果**：
- 三个圆点依次闪烁
- 延迟递增 (`0s`, `0.2s`, `0.4s`)

## 滚动行为

### 平滑滚动

```css
html {
  scroll-behavior: smooth;
}
```

**使用场景**：
- 页面内锚点跳转
- 消息列表自动滚动

### 消息列表滚动

```tsx
messagesEndRef.current?.scrollIntoView({ 
  behavior: 'smooth' 
});
```

**触发时机**：
- 新消息到达
- 加载状态变化

## 手势支持

### 滑动

- **左滑**: 删除操作（待实现）
- **右滑**: 返回操作（待实现）
- **下拉**: 刷新数据（待实现）

### 长按

- **长按卡片**: 显示操作菜单（待实现）
- **长按消息**: 复制内容（待实现）

## 页面过渡

### 标签切换

```tsx
// 使用 CSS transition
<div className="transition-all duration-300">
  {activeTab === 'market' && <MarketTab />}
  {activeTab === 'companion' && <CompanionTab />}
</div>
```

**效果**：
- 淡入淡出
- 平滑过渡

### 路由跳转

Next.js 默认提供页面过渡，可以自定义：

```tsx
// 使用 Framer Motion（可选）
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  {children}
</motion.div>
```

## 反馈提示

### Toast 通知

使用 `react-hot-toast`：

```tsx
import toast from 'react-hot-toast';

// 成功
toast.success('操作成功');

// 错误
toast.error('操作失败');

// 加载
toast.loading('处理中...');
```

**样式**：
- 圆角卡片
- 毛玻璃效果
- 自动消失（3-5秒）

### 确认对话框

```tsx
if (confirm('确定要删除吗？')) {
  // 执行删除
}
```

**未来增强**：
- 自定义确认对话框组件
- 更友好的视觉设计

## 性能优化

### 动画性能

1. **使用 CSS 动画**: 优先使用 CSS 而非 JavaScript
2. **GPU 加速**: 使用 `transform` 和 `opacity`
3. **减少重绘**: 避免动画 `width`、`height` 等属性
4. **will-change**: 对频繁动画的元素使用 `will-change`

```css
.animate-element {
  will-change: transform, opacity;
}
```

### 防抖和节流

```tsx
// 防抖：输入框搜索
const debouncedSearch = debounce((query) => {
  // 搜索逻辑
}, 300);

// 节流：滚动事件
const throttledScroll = throttle(() => {
  // 滚动逻辑
}, 100);
```

## 可访问性

### 减少动画

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**支持**：
- 尊重用户的动画偏好设置
- 提供关闭动画的选项

### 焦点指示

```css
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

**确保**：
- 键盘导航时有清晰的焦点指示
- 符合 WCAG 标准

## 最佳实践

1. **适度使用动画**: 不要过度使用，避免干扰用户
2. **性能优先**: 确保动画流畅，不影响性能
3. **一致性**: 相同类型的交互使用相同的动画
4. **可访问性**: 尊重用户的偏好设置
5. **测试**: 在不同设备和浏览器上测试动画效果


