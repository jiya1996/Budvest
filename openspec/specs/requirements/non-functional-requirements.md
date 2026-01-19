# Non-Functional Requirements (NFRs)

**版本**: v1.0  
**更新日期**: 2026-01-20  

---

## Performance (性能)

### NFR-001: API 响应时间

**Requirement**: 95% 的 API 请求必须在 2 秒内完成响应

**Rationale**: 对话类产品需要接近实时的体验，超过 2 秒会显著影响用户感知

**Measurement**:

- 监控工具: Vercel Analytics
- 采样方式: P95 响应时间
- 目标: < 2000ms

**Acceptance Criteria**:

- `/api/chat-claude` 单轮对话响应 P95 < 2s
- `/api/market/*` 市场数据查询 P95 < 500ms
- `/api/review` 复盘提交 P95 < 1s

---

### NFR-002: AI 流式响应

**Requirement**: AI 对话必须支持流式输出，用户能实时看到 AI "思考"过程

**Rationale**: 提升用户体验，减少等待焦虑

**Acceptance Criteria**:

- 使用 SSE (Server-Sent Events) 或 WebSocket
- 每个 token 延迟 < 100ms
- 显示打字机效果

---

## Scalability (可扩展性)

### NFR-003: 并发用户支持

**Requirement**: 系统必须支持至少 1000 并发用户

**Rationale**: 社交媒体传播后可能短期内流量激增

**Measurement**:

- 压力测试工具: k6 或 Artillery
- 目标并发: 1000 CCU (Concurrent Users)
- 错误率: < 1%

**Acceptance Criteria**:

- Vercel Serverless 自动扩容
- Supabase 连接池配置合理
- Redis 缓存命中率 > 80%

---

### NFR-004: 数据库查询优化

**Requirement**: 数据库查询必须使用索引，避免全表扫描

**Acceptance Criteria**:

- `chat_messages` 表在 `user_id` + `created_at` 上建立复合索引
- `emotion_logs` 表在 `user_id` + `date` 上建立唯一索引
- 所有外键关系正确定义

---

## Security (安全性)

### NFR-005: 数据隐私保护

**Requirement**: 用户对话内容和情绪数据必须加密存储

**Rationale**: 涉及用户隐私和心理状态，必须严格保护

**Implementation**:

- Supabase RLS (Row-Level Security) 启用
- 用户只能查询自己的数据
- 管理员访问日志记录

**Acceptance Criteria**:

- 所有表启用 RLS 策略
- `chat_messages` 表禁止跨用户查询
- API Token 使用 Supabase JWT 验证

---

### NFR-006: 合规性（中国金融监管）

**Requirement**: AI 回复必须避免具体投资建议，符合中国金融监管要求

**Rationale**: 避免法律风险

**Implementation**:

- AI System Prompt 中明确禁止荐股
- 后端过滤敏感词（买入、卖出、目标价等）
- 用户协议中声明免责条款

**Acceptance Criteria**:

- AI 回复中不出现具体价格预测
- 不出现"买入"、"卖出"、"推荐"等词汇
- 每次对话前展示风险提示

---

## Reliability (可靠性)

### NFR-007: 服务可用性

**Requirement**: 系统年度可用性 SLA \u003e 99% (允许每年停机 < 3.65 天)

**Measurement**:

- 监控平台: Vercel Status + Supabase Metrics
- 报警: 关键 API 失败率 > 5% 时触发

**Failure Handling**:

- Claude API 超时: 15 秒后降级为简化回复
- Supabase 连接失败: 使用本地缓存队列

---

### NFR-008: 离线支持

**Requirement**: PWA 必须支持基本离线功能

**Rationale**: 移动网络不稳定时保证基本可用

**Acceptance Criteria**:

- 已发送的对话记录可离线查看
- 情绪打卡离线时存入队列，联网后同步
- 静态资源缓存（图片、CSS、JS）

---

## Usability (可用性)

### NFR-009: 移动端优先设计

**Requirement**: 所有页面必须在手机端(375px-428px 宽度)完美展示

**Acceptance Criteria**:

- 字体大小 \u003e= 14px
- 按钮点击区域 \u003e= 44x44px (iOS 标准)
- 横屏模式适配

---

### NFR-010: 无障碍访问 (WCAG 2.1 Level A)

**Requirement**: 基础无障碍支持

**Implementation**:

- 语义化 HTML（使用 `<button>` 而非 `<div onclick>`)
- 图片必须有 `alt` 文本
- 颜色对比度 \u003e 4.5:1

---

## Maintainability (可维护性)

### NFR-011: 代码质量

**Requirement**: TypeScript 严格模式，ESLint 无错误

**Acceptance Criteria**:

- `tsconfig.json` 启用 `strict: true`
- 所有组件有 Props 类型定义
- 关键函数有 JSDoc 注释

---

### NFR-012: 文档完整性

**Requirement**: 所有 OpenSpec specs 与代码保持同步

**Acceptance Criteria**:

- 每次代码变更必须同步更新 `openspec/specs/`
- API 路由有对应的 spec 文档
- 数据库 schema 变更有 migration 文件

---

## Cost Efficiency (成本效率)

### NFR-013: AI API 成本控制

**Requirement**: Claude API 月成本 < $100

**Implementation**:

- 上下文窗口限制（最近 10 轮对话）
- 缓存常见问题回答（Redis）
- 使用 Haiku 模型处理简单任务

**Measurement**:

- Anthropic Dashboard 每日成本监控
- 每用户平均成本 < $0.50/月

---

### NFR-014: Supabase 免费额度优化

**Requirement**: MVP 阶段控制在 Supabase 免费额度内

**Free Tier Limits**:

- 数据库大小: 500MB
- 带宽: 5GB/月
- 边缘函数调用: 500K/月

**Optimization**:

- 对话历史仅保留 15 天
- 图片资产使用 CDN
- 定期清理测试数据

---

## Architecture NFR Mapping

| NFR Category | Architectural Decision | Technology |
|--------------|----------------------|------------|
| Performance | 边缘计算 + CDN | Vercel Edge Functions |
| Performance | 市场数据缓存 | Redis (Upstash) |
| Scalability | 无状态 Serverless | Vercel + Supabase |
| Security | Row-Level Security | Supabase RLS |
| Security | JWT Token 认证 | Supabase Auth |
| Reliability | 自动扩容 | Vercel Auto-scaling |
| Reliability | 离线队列 | Service Worker + IndexedDB |
| Cost | 模型分层 | Claude Sonnet (复杂) + Haiku (简单) |
| Maintainability | 类型安全 | TypeScript Strict Mode |
| Maintainability | 规范驱动 | OpenSpec SDD |

---

**最后更新**: 2026-01-20  
**下次评审**: 性能测试完成后根据实际数据调整
