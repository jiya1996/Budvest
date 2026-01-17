# 问题修复说明

## 已修复的问题

### 1. ✅ 旧 API 路由导入错误
**问题**: `/api/chat` 路由导入了不存在的 `initMemoryTables` 和 `initKnowledgeTables` 函数

**原因**: 项目已从 SQLite 迁移到 Supabase，这些初始化函数已被移除

**修复**:
- 移除了对这些函数的导入和调用
- 添加注释说明 Supabase 表通过 migrations 管理

### 2. ✅ SQLite 数据库文件不存在
**问题**: MCP tools 尝试访问不存在的 SQLite 数据库文件

**原因**:
- 项目正在从 SQLite 迁移到 Supabase
- SQLite 数据库需要手动初始化（`npm run data:init`）
- 但新的 Claude Agent 系统不应依赖 SQLite

**修复**:
- 创建了 `lib/mcp-tools-simple.ts`，只使用不依赖 SQLite 的工具
- 使用东方财富 API 获取公告
- 使用新浪财经 API 获取实时行情
- 提供简单的持仓计算工具

### 3. ⚠️ FMP API Key 未配置（警告）
**问题**: FMP API 返回 401 Unauthorized

**说明**: 这是正常的，因为 `.env.local` 中的 `FMP_API_KEY` 还是占位符

**解决方案**:
- 如果需要使用 FMP API（美股/港股数据），请到 https://site.financialmodelingprep.com/ 注册并获取 API Key
- 如果只测试 A 股，可以忽略此警告

## 当前可用的工具

### MCP Tools (简化版)

1. **get_stock_announcement** - 获取股票公告（东方财富 API）
2. **get_stock_price** - 获取实时行情（新浪财经 API）
3. **calculate_position** - 计算持仓盈亏

### Agent 工具权限更新

- **研究员**: get_stock_announcement, get_stock_price, WebSearch
- **分析师**: get_stock_price, calculate_position, WebSearch, Read, Grep
- **风控员**: get_stock_price, calculate_position, WebSearch
- **导师**: Read, Grep (RAG 知识库)
- **协调员**: Task, Read, Grep, AskUserQuestion

## 测试建议

现在你可以测试以下功能：

### 1. 基础对话
```
用户: 我今天亏了5%，很焦虑
预期: 导师 Agent 提供心理辅导
```

### 2. 获取公告
```
用户: /research 600519
预期: 研究员 Agent 调用东方财富 API 获取贵州茅台的公告
```

### 3. 获取行情
```
用户: 帮我查一下贵州茅台的股价
预期: 协调员调用研究员，研究员使用新浪财经 API 获取行情
```

### 4. 复杂任务
```
用户: 帮我分析一下贵州茅台
预期: 协调员串行调度：研究员 → 分析师 → 风控员 → 导师
```

## 注意事项

1. **SQLite 数据库（可选）**
   - 如果需要使用完整的 A 股数据（K线、资金流向、融资融券等），需要初始化 SQLite：
   ```bash
   npm run data:init
   npm run data:start
   ```
   - 然后可以使用 `lib/mcp-tools.ts`（完整版）

2. **API 限流**
   - 东方财富 API 可能有限流，建议添加缓存
   - 新浪财经 API 比较稳定，但也建议添加缓存

3. **股票代码格式**
   - 东方财富公告 API：直接使用 6 位代码（如 `600519`）
   - 新浪财经行情 API：需要加前缀（如 `sh600519`、`sz000001`）
   - 建议在工具中添加自动转换逻辑

## 下一步优化

1. **添加股票代码自动转换**
   - 自动识别 A 股代码并添加 sh/sz 前缀

2. **添加缓存层**
   - 使用 Upstash Redis 缓存 API 结果
   - 避免频繁调用被限流

3. **完善错误处理**
   - 更友好的错误提示
   - 自动重试机制

4. **集成更多数据源**
   - 雪球 API
   - 同花顺 API
   - 腾讯财经 API
