# 复盘页规范

复盘页用于展示和管理用户的投资复盘记录，帮助用户回顾和总结投资经验。

## 页面结构

```
┌─────────────────────────┐
│   Header                │
│   复盘记录    [+ 新增]  │
├─────────────────────────┤
│                         │
│   复盘列表              │
│   - 日期和时间          │
│   - 情绪、导师、股票    │
│   - 复盘内容            │
│   - 标签                │
│   - 删除按钮            │
│                         │
├─────────────────────────┤
│   Bottom Navigation     │
└─────────────────────────┘
```

## 布局规范

### 容器

```tsx
<div style={{ 
  padding: '20px', 
  paddingBottom: '100px' 
}}>
```

- **内边距**: `20px`
- **底部内边距**: `100px` (为底部导航留出空间)

### Header

```tsx
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginBottom: '24px' 
}}>
  <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
    复盘记录
  </h1>
  <Link href="/review/new" style={{/* 新增按钮样式 */}}>
    + 新增
  </Link>
</div>
```

**新增按钮样式**：
- **内边距**: `8px 16px`
- **背景色**: `#2563eb` (蓝色)
- **文字颜色**: 白色
- **圆角**: `8px`
- **字体大小**: `14px`
- **字重**: `500`

## 复盘列表

### 空状态

```tsx
{reviews.length === 0 ? (
  <Card>
    <p style={{ 
      textAlign: 'center', 
      color: '#6b7280', 
      fontSize: '14px', 
      padding: '40px 0' 
    }}>
      暂无复盘记录
    </p>
  </Card>
) : (
  // 复盘列表
)}
```

### 复盘卡片

```tsx
<div style={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '16px' 
}}>
  {reviews.map((review) => (
    <Card key={review.id}>
      <ReviewItem review={review} />
    </Card>
  ))}
</div>
```

**排序规则**：
- 按创建时间倒序排列（最新的在前）

### 复盘项结构

```tsx
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start', 
  marginBottom: '12px' 
}}>
  {/* 左侧：日期和元数据 */}
  <div style={{ flex: 1 }}>
    {/* 日期 */}
    {/* 时间 */}
    {/* 情绪、导师、股票标签 */}
  </div>
  
  {/* 右侧：删除按钮 */}
  <button onClick={() => handleDelete(review.id)}>
    删除
  </button>
</div>

{/* 复盘内容 */}
{/* 标签列表 */}
```

### 日期显示

```tsx
<p style={{ 
  fontSize: '16px', 
  fontWeight: '500', 
  marginBottom: '4px' 
}}>
  {new Date(review.createdAt).toLocaleDateString('zh-CN')}
</p>
<p style={{ 
  fontSize: '12px', 
  color: '#9ca3af' 
}}>
  {new Date(review.createdAt).toLocaleString('zh-CN')}
</p>
```

**格式**：
- **日期**: `YYYY年M月D日` (中文格式)
- **完整时间**: `YYYY年M月D日 HH:mm:ss` (中文格式)

### 元数据标签

```tsx
{(review.emotion || review.guru || review.symbol) && (
  <div style={{ 
    display: 'flex', 
    gap: '8px', 
    marginTop: '8px', 
    flexWrap: 'wrap' 
  }}>
    {review.emotion && (
      <span style={{ fontSize: '12px', color: '#6b7280' }}>
        情绪: {review.emotion}
      </span>
    )}
    {review.guru && (
      <span style={{ fontSize: '12px', color: '#6b7280' }}>
        导师: {getGuruName(review.guru)}
      </span>
    )}
    {review.symbol && (
      <span style={{ fontSize: '12px', color: '#6b7280' }}>
        股票: {review.symbol}
      </span>
    )}
  </div>
)}
```

**导师名称映射**：
- `buffett` → `巴菲特`
- `dalio` → `达利欧`
- 其他 → `教练`

### 复盘内容

```tsx
<p style={{ 
  fontSize: '14px', 
  lineHeight: '1.6', 
  marginBottom: '12px', 
  whiteSpace: 'pre-wrap' 
}}>
  {review.content}
</p>
```

**样式规范**：
- **字体大小**: `14px`
- **行高**: `1.6`
- **空白处理**: `pre-wrap` (保留换行和空格)

### 标签列表

```tsx
{review.tags.length > 0 && (
  <div style={{ 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '6px' 
  }}>
    {review.tags.map((tag, index) => (
      <span
        key={index}
        style={{
          padding: '4px 10px',
          backgroundColor: '#e5e7eb',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#374151',
        }}
      >
        {tag}
      </span>
    ))}
  </div>
)}
```

**标签样式**：
- **内边距**: `4px 10px`
- **背景色**: `#e5e7eb` (浅灰)
- **圆角**: `12px` (pill)
- **字体大小**: `12px`
- **文字颜色**: `#374151` (深灰)

### 删除按钮

```tsx
<button
  onClick={() => handleDelete(review.id)}
  style={{
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '14px',
  }}
>
  删除
</button>
```

**交互**：
- 点击后显示确认对话框
- 确认后删除复盘记录
- 更新列表显示

## 数据管理

### 数据加载

```tsx
useEffect(() => {
  const savedReviews = storage.getReviews();
  setReviews(savedReviews.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
}, []);
```

- 从 `localStorage` 读取复盘记录
- 按创建时间倒序排序

### 删除操作

```tsx
const handleDelete = (id: string) => {
  if (confirm('确定要删除这条复盘吗？')) {
    storage.deleteReview(id);
    const updatedReviews = storage.getReviews();
    setReviews(updatedReviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  }
};
```

**流程**：
1. 显示确认对话框
2. 用户确认后调用 `storage.deleteReview(id)`
3. 重新加载并排序列表
4. 更新 UI

## 导航

### 新增复盘

点击 "新增" 按钮跳转到 `/review/new` 页面。

### 底部导航

使用 `BottomNav` 组件，当前标签页为 `companion`（如果从对话页跳转）或默认。

## 响应式设计

- **移动端**: 全宽显示，卡片垂直排列
- **桌面端**: 最大宽度限制，居中显示

## 性能优化

1. **虚拟滚动**: 如果复盘记录很多，可以考虑使用虚拟滚动
2. **分页加载**: 大量数据时可以分页显示
3. **缓存**: 复盘数据缓存在 localStorage

## 可访问性

- 使用语义化 HTML 标签
- 添加适当的 ARIA 标签
- 确保删除操作有确认提示
- 支持键盘导航

## 未来增强

- 搜索和筛选功能
- 按日期、情绪、标签分组
- 导出复盘记录
- 复盘统计和可视化


