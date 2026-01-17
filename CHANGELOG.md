# 更新日志 (Changelog)

本项目的所有主要变更都将记录在此文件中。

## [Unreleased] - 2026-01-17

### 🚀 重大变更
- **云原生迁移**: 架构从本地 SQLite/Python 迁移至 Supabase + Vercel
  - 数据库迁移至 Supabase PostgreSQL，并启用 `pgvector` 支持 AI 功能
  - 使用 Next.js Edge Functions (`app/api/market/a-stock`) 替代 Python 数据服务
  - 更新 `package.json`，移除 `better-sqlite3` 及 Python 相关依赖
  - 新增 `@supabase/supabase-js` 和 `@upstash/redis` 依赖

### ✨ 新功能
- **A股 API**: 实现了基于 Serverless 的 A 股数据接口 (调用新浪财经)
- **Supabase 集成**:
  - 新增 `lib/supabase.ts` 客户端配置
  - 创建了完整的数据库 Schema (`supabase/schema.sql`)，包括：
    - `user_profiles` (用户资料), `portfolio_items` (持仓), `chat_sessions` (对话会话), `chat_messages` (消息记录)
    - `knowledge_chunks` (RAG 知识库，含向量), `user_memories` (用户记忆)
- **RAG 系统 V2**:
  - 重写 `lib/rag.ts`，使用 Supabase `pgvector` 替代本地 BLOB 存储
  - 添加了 25+ 条针对小白用户的投教知识库种子数据
- **记忆系统 V2**:
  - 重写 `lib/memory.ts`，将用户上下文和情绪趋势持久化至 Supabase

### 📚 文档
- **架构文档**: 完全重写 `ARCHITECTURE.md` 以反映新的云原生架构
- **迁移指南**: 创建了详细的迁移 Walkthrough 文档
- **任务清单**: 更新 `task.md` 记录迁移进度

### ⚙️ 配置
- 新增 `.env.local.example`，包含 Supabase 和 OpenAI 配置模板
- 初始化 Supabase 项目结构
