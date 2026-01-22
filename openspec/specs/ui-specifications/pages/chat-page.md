# 对话页规范

对话页提供 AI 投资心理陪伴功能，用户可以与 AI 助手进行投资相关的对话。

## 页面结构

```
┌─────────────────────────┐
│   Header                │
│   投资对话              │
├─────────────────────────┤
│                         │
│   消息列表              │
│   - 用户消息 (右对齐)   │
│   - AI 消息 (左对齐)    │
│   - 情绪标签            │
│   - 建议行动            │
│   - 写复盘按钮          │
│                         │
├─────────────────────────┤
│   输入区域              │
│   - 输入框              │
│   - 发送按钮            │
├─────────────────────────┤
│   Bottom Navigation     │
└─────────────────────────┘
```

## 布局规范

### 容器

```tsx
<div style={{ 
  padding: '20px', 
  paddingBottom: '100px', 
  maxWidth: '800px', 
  margin: '0 auto' 
}}>
```

- **内边距**: `20px`
- **底部内边距**: `100px` (为底部导航留出空间)
- **最大宽度**: `800px`
- **居中**: `margin: 0 auto`

### Header

```tsx
<h1 style={{ 
  fontSize: '24px', 
  marginBottom: '24px', 
  fontWeight: 'bold' 
}}>
  投资对话
</h1>
```

## 消息列表

### 消息容器

```tsx
<div style={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '16px', 
  marginBottom: '20px' 
}}>
  {messages.map((msg, index) => (
    <MessageItem key={index} message={msg} />
  ))}
</div>
```

### 用户消息

```tsx
<div style={{
  alignSelf: 'flex-end',
  maxWidth: '80%',
}}>
  <div style={{
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: '14px',
    lineHeight: '1.5',
  }}>
    {msg.content}
  </div>
</div>
```

**样式规范**：
- **对齐**: 右对齐 (`flex-end`)
- **最大宽度**: `80%`
- **背景色**: `#2563eb` (蓝色)
- **文字颜色**: 白色
- **圆角**: `12px`
- **内边距**: `12px 16px`
- **字体大小**: `14px`
- **行高**: `1.5`

### AI 消息

```tsx
<div style={{
  alignSelf: 'flex-start',
  maxWidth: '80%',
}}>
  <div style={{
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#f3f4f6',
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.5',
  }}>
    {msg.content}
  </div>
</div>
```

**样式规范**：
- **对齐**: 左对齐 (`flex-start`)
- **最大宽度**: `80%`
- **背景色**: `#f3f4f6` (浅灰)
- **文字颜色**: `#333` (深灰)
- **其他样式**: 与用户消息相同

### 情绪标签

```tsx
{msg.response?.emotion && (
  <span style={{
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: emotionColors[msg.response.emotion] || '#6b7280',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
  }}>
    情绪: {msg.response.emotion}
  </span>
)}
```

**情绪颜色映射**：
- `anxious`: `#f59e0b` (橙色)
- `panic`: `#ef4444` (红色)
- `angry`: `#dc2626` (深红)
- `greedy`: `#10b981` (绿色)
- `calm`: `#3b82f6` (蓝色)

### 建议行动

```tsx
{msg.response.suggested_actions.length > 0 && (
  <div>
    <p style={{ 
      fontSize: '12px', 
      fontWeight: '500', 
      marginBottom: '6px', 
      color: '#6b7280' 
    }}>
      建议行动
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {msg.response.suggested_actions.map((action, index) => (
        <button
          key={index}
          onClick={() => handleSuggestedAction(action)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            color: '#333',
          }}
        >
          {action}
        </button>
      ))}
    </div>
  </div>
)}
```

**交互**：
- 点击建议行动：自动填充到输入框并发送

### 写复盘按钮

```tsx
{msg.response.review_prompt && (
  <button
    onClick={() => handleWriteReview(msg.response)}
    style={{
      padding: '8px 16px',
      backgroundColor: '#10b981',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      alignSelf: 'flex-start',
    }}
  >
    写复盘
  </button>
)}
```

**交互**：
- 点击后跳转到 `/review/new` 页面
- 携带情绪、标签、导师、股票等参数

## 输入区域

### 容器

```tsx
<div style={{
  position: 'sticky',
  bottom: '90px',
  backgroundColor: '#fff',
  padding: '12px 0',
  borderTop: '1px solid #e5e7eb',
}}>
```

- **位置**: 固定在底部 (`sticky`)
- **底部偏移**: `90px` (为底部导航留出空间)
- **背景**: 白色
- **边框**: 顶部 `1px solid #e5e7eb`

### 输入框

```tsx
<input
  type="text"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyPress={(e) => {
    if (e.key === 'Enter' && !loading && input.trim()) {
      handleSend();
    }
  }}
  placeholder="输入消息..."
  disabled={loading}
  style={{
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
  }}
/>
```

**交互**：
- 回车键发送消息
- 加载时禁用输入

### 发送按钮

```tsx
<button
  onClick={() => handleSend()}
  disabled={loading || !input.trim()}
  style={{
    padding: '10px 20px',
    backgroundColor: loading || !input.trim() ? '#9ca3af' : '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
  }}
>
  发送
</button>
```

**状态**：
- **正常**: 蓝色背景 (`#2563eb`)
- **禁用**: 灰色背景 (`#9ca3af`)，鼠标样式 `not-allowed`

## 加载状态

```tsx
{loading && (
  <div style={{ alignSelf: 'flex-start' }}>
    <div style={{
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: '#f3f4f6',
      fontSize: '14px',
      color: '#6b7280',
    }}>
      思考中...
    </div>
  </div>
)}
```

## 自动滚动

```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, loading]);

<div ref={messagesEndRef} />
```

- 新消息到达时自动滚动到底部
- 使用平滑滚动动画

## 数据流

### 发送消息

1. 用户输入消息
2. 立即添加到消息列表（乐观更新）
3. 保存到 localStorage
4. 获取市场上下文（公司信息、新闻）
5. 调用 `/api/chat` API
6. 添加 AI 回复到消息列表
7. 保存到 localStorage

### 市场上下文

```tsx
const marketContext: MarketContext = {
  company: await fetchCompanyData(mainSymbol),
  news: await fetchNewsData(mainSymbol, limit: 5),
};
```

### 对话历史

- 从 localStorage 读取最近 10 条消息
- 包含刚发送的用户消息

## 错误处理

### API 错误

```tsx
if (!response.ok) {
  const errorData = await response.json();
  toast.error(errorData.message || '请求失败，请稍后重试');
  // 添加错误消息到对话
}
```

### 网络错误

```tsx
catch (error) {
  console.error('Chat error:', error);
  toast.error('网络或配置问题，请稍后重试');
  // 添加错误提示消息
}
```

## 特殊功能

### 从 Dashboard 跳转

支持通过 URL 参数触发洞察分析：

```
/chat?action=insight
```

自动发送预设提示：
```
请分析当前市场情绪和我的持仓表现，只陈述客观事实和数据，帮助我理解当前状况。不要给出任何操作建议（如买入、卖出、持有、观察等）。
```

### 权限检查

```tsx
useEffect(() => {
  const config = storage.getUserConfig();
  if (!config || !config.userGoal) {
    router.push('/onboarding');
    return;
  }
}, []);
```

未完成引导的用户会被重定向到引导页面。

## 性能优化

1. **消息限制**: 只显示最近的消息，避免 DOM 元素过多
2. **防抖**: 输入框可以使用防抖优化
3. **懒加载**: 长对话历史可以分页加载
4. **缓存**: 市场上下文可以缓存一段时间

## 可访问性

- 使用语义化 HTML
- 添加适当的 ARIA 标签
- 支持键盘导航（Tab、Enter）
- 确保颜色对比度符合标准


