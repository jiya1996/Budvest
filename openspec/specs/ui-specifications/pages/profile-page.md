# 我的页规范

我的页展示用户个人信息、统计数据、设置选项和账户管理功能。

## 页面结构

```
┌─────────────────────────┐
│   Header                │
│   我的                  │
├─────────────────────────┤
│                         │
│   用户信息卡片          │
│   - 头像                │
│   - 用户名/昵称         │
│   - 注册时间            │
│                         │
│   统计数据              │
│   - 总投入本金          │
│   - 总盈亏              │
│   - 持仓数量            │
│                         │
│   功能列表              │
│   - 投资组合管理        │
│   - 设置                │
│   - 关于                │
│   - 重置引导            │
│                         │
├─────────────────────────┤
│   Bottom Navigation     │
└─────────────────────────┘
```

## 布局规范

### 容器

```tsx
<div className="flex-1 overflow-y-auto bg-slate-50">
  {/* 内容 */}
</div>
```

- **布局**: `flex-1` 占据剩余空间
- **滚动**: `overflow-y-auto` 允许垂直滚动
- **背景**: `bg-slate-50`

### Header

参考 [首页规范](./home-page.md#header) 的 Header 样式。

## 用户信息卡片

```tsx
<div className="grow-card p-6 mb-4">
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
      {getInitials(username)}
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-800">
        {username || '用户'}
      </h2>
      <p className="text-sm text-slate-500">
        注册于 {formatDate(firstLoginTimestamp)}
      </p>
    </div>
  </div>
</div>
```

**样式规范**：
- **卡片**: 使用 `grow-card` 样式
- **内边距**: `24px` (`p-6`)
- **头像**: `64px × 64px`，渐变背景，圆形
- **用户名**: `text-xl font-bold`
- **注册时间**: `text-sm text-slate-500`

## 统计数据

```tsx
<div className="grid grid-cols-2 gap-4 mb-4">
  <div className="grow-card p-4">
    <p className="text-sm text-slate-500 mb-1">总投入本金</p>
    <p className="text-2xl font-bold text-slate-800">
      ¥{totalPrincipal.toLocaleString()}
    </p>
  </div>
  <div className="grow-card p-4">
    <p className="text-sm text-slate-500 mb-1">总盈亏</p>
    <p className={`text-2xl font-bold ${
      totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
    }`}>
      {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toLocaleString()}
    </p>
  </div>
  <div className="grow-card p-4">
    <p className="text-sm text-slate-500 mb-1">持仓数量</p>
    <p className="text-2xl font-bold text-slate-800">
      {portfolio.filter(item => item.config.status === 'investing').length}
    </p>
  </div>
  <div className="grow-card p-4">
    <p className="text-sm text-slate-500 mb-1">复盘记录</p>
    <p className="text-2xl font-bold text-slate-800">
      {reviews.length}
    </p>
  </div>
</div>
```

**布局**：
- **网格**: 2 列布局 (`grid-cols-2`)
- **间距**: `16px` (`gap-4`)
- **卡片**: 使用 `grow-card` 样式

**数据展示**：
- **总投入本金**: 显示为人民币格式
- **总盈亏**: 根据正负显示不同颜色（绿色/红色）
- **持仓数量**: 只统计状态为 `investing` 的持仓
- **复盘记录**: 显示复盘总数

## 功能列表

```tsx
<div className="space-y-2">
  <button 
    onClick={() => router.push('/portfolio/manage')}
    className="w-full grow-card p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <Briefcase className="text-slate-600" size={20} />
      <span className="text-slate-800 font-medium">投资组合管理</span>
    </div>
    <ChevronRight className="text-slate-400" size={20} />
  </button>
  
  {/* 其他功能项 */}
</div>
```

**功能项样式**：
- **宽度**: 全宽 (`w-full`)
- **卡片**: 使用 `grow-card` 样式
- **内边距**: `16px` (`p-4`)
- **布局**: 水平布局，图标 + 文字 + 箭头
- **悬停**: 背景色变化 (`hover:bg-slate-50`)
- **过渡**: `transition-colors`

### 功能列表项

1. **投资组合管理**
   - 图标: `Briefcase`
   - 跳转: `/portfolio/manage`

2. **设置**
   - 图标: `Settings`
   - 功能: 打开设置面板（待实现）

3. **关于**
   - 图标: `Info`
   - 功能: 显示应用信息（待实现）

4. **重置引导**
   - 图标: `RotateCcw`
   - 功能: 清除所有数据，重新开始引导流程
   - **警告**: 需要确认对话框

## 重置引导功能

```tsx
const handleResetOnboarding = () => {
  if (confirm('确定要重置吗？这将清除所有数据，包括投资组合和复盘记录。')) {
    storage.clearAll();
    // 触发父组件的重置逻辑
    onResetOnboarding();
  }
};
```

**流程**：
1. 显示确认对话框（警告数据将被清除）
2. 用户确认后调用 `storage.clearAll()`
3. 触发父组件的 `onResetOnboarding` 回调
4. 重定向到引导页面

## 数据来源

### Props

```tsx
interface ProfileTabProps {
  onResetOnboarding: () => void;
  portfolio: PortfolioItem[];
  totalPrincipal: number;
  totalProfit: number;
}
```

### 本地数据

```tsx
const config = storage.getUserConfig();
const reviews = storage.getReviews();

const firstLoginTimestamp = config?.firstLoginTimestamp || Date.now();
const username = config?.username || '用户';
```

## 响应式设计

- **移动端**: 垂直布局，卡片全宽
- **桌面端**: 保持相同布局，最大宽度限制

## 交互规范

### 卡片点击

- **投资组合管理**: 跳转到管理页面
- **设置/关于**: 打开模态框或侧边栏（待实现）
- **重置引导**: 显示确认对话框

### 数据刷新

- 从父组件接收最新的 `portfolio`、`totalPrincipal`、`totalProfit`
- 实时更新统计数据

## 性能优化

1. **数据缓存**: 统计数据从 props 传入，避免重复计算
2. **懒加载**: 复盘记录数量可以延迟加载
3. **防抖**: 重置操作需要防抖处理

## 可访问性

- 使用语义化 HTML 和按钮元素
- 添加适当的 ARIA 标签
- 确保颜色对比度符合标准
- 支持键盘导航

## 未来增强

- 用户头像上传
- 昵称编辑
- 更多统计数据（投资天数、平均收益等）
- 成就系统展示
- 数据导出功能
- 隐私设置


