# UI 规范文档

本目录包含 Budvest (伴投) 应用的完整 UI 设计规范，用于确保整个应用的视觉一致性和用户体验统一性。

## 📁 文档结构

### 核心规范

- **[design-tokens.md](./design-tokens.md)** - 设计令牌
  - 颜色系统（主色、辅助色、语义色）
  - 字体系统（字号、字重、行高）
  - 间距系统（内边距、外边距、间隙）
  - 圆角、阴影、动画时长等

- **[components.md](./components.md)** - 组件规范
  - 卡片组件（Card、Grow Card）
  - 按钮组件（主要、次要、图标按钮）
  - 输入框组件
  - 徽章组件（基础、太阳、云朵）
  - 弹窗组件（Modal）
  - 底部导航（BottomNav）
  - 标签页组件（MarketTab、CompanionTab、PortfolioTab、ProfileTab）

- **[interactions.md](./interactions.md)** - 交互规范
  - 手势交互（点击、滑动、长按）
  - 动画效果（过渡、加载、反馈）
  - 状态反馈（成功、错误、警告）
  - 页面转场

### 页面规范

`pages/` 目录包含各个页面的详细设计规范：

- **[home-page.md](./pages/home-page.md)** - 首页（市场标签页）
- **[chat-page.md](./pages/chat-page.md)** - 聊天页面（伴投标签页）
- **[profile-page.md](./pages/profile-page.md)** - 个人中心页面
- **[review-page.md](./pages/review-page.md)** - 复盘页面

## 🎨 设计原则

### 1. 移动优先
- 所有设计以移动端为主，最大宽度 `448px`
- 使用响应式设计，适配不同屏幕尺寸
- 考虑安全区域（刘海屏、底部手势条）

### 2. 视觉一致性
- 使用设计令牌而非硬编码值
- 遵循统一的颜色、字体、间距系统
- 保持组件样式的一致性

### 3. 用户体验
- 清晰的视觉层级
- 流畅的动画过渡
- 即时的交互反馈
- 无障碍访问支持

### 4. 性能优化
- 避免不必要的重渲染
- 优化动画性能
- 懒加载非关键资源

## 🛠️ 使用指南

### 开发者

1. **查阅设计令牌**：在实现 UI 时，优先查阅 `design-tokens.md`，使用 CSS 变量而非硬编码值
2. **复用组件**：在 `components.md` 中查找现有组件，避免重复实现
3. **遵循交互规范**：参考 `interactions.md` 实现统一的交互行为
4. **参考页面规范**：实现新页面时，参考 `pages/` 目录中的相关规范

### 设计师

1. **维护设计令牌**：更新设计系统时，同步更新 `design-tokens.md`
2. **记录新组件**：创建新组件时，在 `components.md` 中添加规范
3. **更新页面规范**：页面设计变更时，更新对应的页面规范文档

## 📝 规范更新流程

1. **提出变更**：通过 Issue 或 PR 提出设计变更需求
2. **讨论评审**：团队讨论变更的必要性和影响范围
3. **更新文档**：更新相关规范文档
4. **实施变更**：在代码中实施变更
5. **验证测试**：确保变更符合规范且无副作用

## 🔍 快速查找

### 颜色相关
- 主色系统 → `design-tokens.md` > 颜色系统
- 按钮颜色 → `components.md` > 按钮组件
- 状态颜色 → `design-tokens.md` > 语义色

### 布局相关
- 间距规范 → `design-tokens.md` > 间距系统
- 卡片布局 → `components.md` > 卡片组件
- 页面布局 → `pages/` 目录

### 交互相关
- 动画效果 → `interactions.md` > 动画效果
- 手势操作 → `interactions.md` > 手势交互
- 状态反馈 → `interactions.md` > 状态反馈

### 组件相关
- 弹窗 → `components.md` > 弹窗组件
- 按钮 → `components.md` > 按钮组件
- 输入框 → `components.md` > 输入框组件
- 导航 → `components.md` > 底部导航

## 🎯 设计目标

Budvest 的 UI 设计旨在：

1. **情感化设计**：通过温暖的色彩和友好的交互，缓解投资焦虑
2. **清晰的信息层级**：帮助用户快速获取关键信息
3. **流畅的操作体验**：减少操作步骤，提高效率
4. **专业与亲和并重**：既体现金融产品的专业性，又保持亲和力

## 📚 相关资源

- [技术架构文档](../../architecture/)
- [功能需求文档](../../requirements/)
- [数据库设计文档](../../database/)
- [AI 系统文档](../../ai-system/)

## 🤝 贡献指南

欢迎提出改进建议！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/ui-improvement`)
3. 提交变更 (`git commit -m 'Add UI improvement'`)
4. 推送到分支 (`git push origin feature/ui-improvement`)
5. 创建 Pull Request

---

**最后更新**：2026-01-22
**维护者**：Budvest 设计团队
