---
name: Supabase Backend Expert
description: Expert guidance on Supabase database design, RLS policies, Auth integration, and pgvector.
---
# Supabase Backend Expert Skill

此 Skill 提供使用 Supabase 构建后端和数据库的最佳实践，特别是针对云原生应用和 AI 增强应用。

## 核心领域

1. **PostgreSQL 数据库设计**: 关系模型、索引优化。
2. **Row Level Security (RLS)**: 确保数据安全的基石。
3. **pgvector & AI**: 向量数据库配置与查询与 RAG 系统。
4. **Edge Functions**: 无服务计算逻辑。

## 关键实践

### 1. 数据库安全 (RLS)
**永远不要** 在客户端使用 `service_role` key。始终启用 RLS。

```sql
-- 启用 RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的数据
CREATE POLICY "Users can view own data"
ON user_data
FOR SELECT
USING (auth.uid() = user_id);

-- 创建策略：用户只能插入自己的数据
CREATE POLICY "Users can insert own data"
ON user_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 2. 向量搜索 (pgvector)
用于 RAG 系统。

```sql
-- 1. 启用扩展
create extension vector;

-- 2. 创建表
create table documents (
  id bigserial primary key,
  content text,
  embedding vector(1536) -- OpenAI text-embedding-3-small
);

-- 3. 创建索引 (IVFFlat) 以加速搜索
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. 相似度搜索函数 (RPC)
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

### 3. TypeScript 类型生成
保持本地类型与数据库同步。

```bash
# 生成类型定义
npx supabase gen types typescript --project-id "$PROJECT_ID" --schema public > lib/database.types.ts
```

### 4. 客户端初始化

```ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// 创建强类型客户端
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## 常见任务指南

- **用户认证**: 使用 Supabase Auth (Email, Social, Phone)。
- **实时更新**: 使用 Realtime 订阅数据库变更。
- **文件存储**: 使用 Supabase Storage 存储头像、媒体文件。
