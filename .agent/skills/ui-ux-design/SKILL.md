---
name: UI/UX Design System
description: Guidelines for creating modern, responsive, and user-friendly interfaces, with a focus on female-friendly aesthetics.
---
# UI/UX Design System Skill

此 Skill 提供 UI/UX 设计原则和代码实现指南，特别通过 TailwindCSS 实现现代、美观且响应式的界面。针对本项目的"女性友好"与"新手友好"定位，提供特定建议。

## 设计原则

1. **清晰性 (Clarity)**: 界面应直观，无歧义。这是投教产品建立信任的基础。
2. **情感化设计 (Emotional Design)**: 使用颜色、插画和微交互传递温暖、鼓励和安全感。
3. **留白 (Whitespace)**: 充足的留白可以减少认知负荷，让信息更容易阅读。
4. **响应式 (Responsive)**: 移动端优先 (Mobile-First)，兼顾桌面端体验。

## 针对性风格指南 (女性新手友好)

### 1. 色彩心理学
- **主色调**: 避免传统的"金融蓝"或"涨跌红绿"暴力冲击。推荐使用柔和的紫色、粉色、薄荷绿或暖橙色。
- **背景**: 使用暖白色或极浅的灰色，避免纯黑或纯白的高对比度。
- **语义色**: 
  - 涨: 柔和的红色/暖红色 (或根据设置可选绿色)
  - 跌: 柔和的绿色/青色 (或可选红色)
  - 成功: 薄荷绿
  - 警告: 暖黄色

### 2. 字体排版
- 使用圆润、易读的无衬线字体 (如 Inter, Rounded Mplus 1c, Quicksand)。
- 较大的行高 (Line-height: 1.6+)。
- 避免过多使用大写字母或粗体。

### 3. 组件风格
- **圆角**: 大圆角 (Rounded-lg, Rounded-xl) 甚至胶囊形按钮，显得更亲和。
- **阴影**: 柔和、弥散的彩色阴影，营造层次感和轻盈感。
- **玻璃拟态 (Glassmorphism)**: 适度使用背景模糊，增加现代感。

## TailwindCSS 实现建议

```css
/* globals.css */
@layer utilities {
  .glass-panel {
    @apply bg-white/70 backdrop-blur-md border border-white/20 shadow-lg;
  }
  
  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500;
  }
}
```

## 无障碍性 (Accessibility)

- 确保足够的颜色对比度 (WCAG AA 标准)。
- 所有可交互元素 (按钮、链接) 至少 44x44px 点击区域。
- 图片必须包含 `alt` 属性。

## 常用 Tailwind 类组合

- **主按钮**: `bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all active:scale-95`
- **卡片**: `bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow`
- **标签**: `bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm font-medium`
