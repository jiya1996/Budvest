# Database Specification - Supabase PostgreSQL + pgvector

**版本**: v1.0  
**更新日期**: 2026-01-20  
**数据库**: Supabase (PostgreSQL 15 + pgvector extension)  
**Status**: 部分实施（需要补充缺失表）

---

## Database Architecture

### Technology Stack

- **Primary Database**: Supabase PostgreSQL (cloud-hosted)
- **Vector Search**: pgvector extension (for RAG knowledge base)
- **Authentication**: Supabase Auth (JWT tokens)
- **Security**: Row-Level Security (RLS) policies

### Migration Philosophy

- **完全移除 SQLite**: 所有数据统一存储在 Supabase
- **云原生**: 无需本地数据库，支持实时同步
- **成本优化**: MVP 阶段控制在免费额度内（500MB 数据库 + 5GB 带宽/月）

---

## Schema Design

### Table 1: `user_profiles` - 用户基础信息

#### Purpose

存储用户账户信息、投资目标和偏好设置。

#### Schema

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 登录信息
  email VARCHAR(255) UNIQUE,                    -- 邮箱（注册用户）
  phone VARCHAR(20) UNIQUE,                     -- 手机号（可选）
  guest BOOLEAN DEFAULT true,                   -- 是否游客模式
  
  -- 用户信息
  nickname VARCHAR(50),                         -- 昵称
  avatar_url TEXT,                             -- 头像 URL
  
  -- 投资偏好
  investment_goals TEXT[],                     -- 投资目标 ['long_term', 'short_term']
  preferred_mentor VARCHAR(20) DEFAULT 'coach', -- MVP 阶段固定为 coach
  
  -- 元数据
  onboarding_completed BOOLEAN DEFAULT false,  -- 是否完成初次引导
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_guest ON user_profiles(guest) WHERE guest = true;

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### Data Retention

- Guest 用户: 30 天未活跃自动清理
- 注册用户: 永久保留

---

### Table 2: `portfolio_items` - 持仓数据

#### Purpose

用户手动记录的持仓信息。

#### Schema

```sql
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- 资产信息
  symbol VARCHAR(20) NOT NULL,                 -- 股票代码（600519, NVDA）
  name VARCHAR(100),                           -- 股票名称（贵州茅台）
  logo_url TEXT,                               -- Logo URL
  market VARCHAR(10),                          -- 市场（A-share, US, HK）
  status VARCHAR(20) DEFAULT 'active',         -- 状态（active, sold）
  
  -- 持仓数据
  shares DECIMAL(18, 6),                       -- 持股数量
  price_per_share DECIMAL(18, 2),              -- 成本价
  cost DECIMAL(18, 2),                         -- 总成本
  
  -- 用户目标
  goal TEXT,                                   -- 投资目标（长期持有、短线交易）
  first_buy_timestamp TIMESTAMPTZ,             -- 首次买入时间
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_items_symbol ON portfolio_items(symbol);

-- RLS Policies
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own portfolio" ON portfolio_items
  USING (auth.uid() = user_id);
```

---

### Table 3: `chat_messages` - 对话历史

#### Purpose

保存用户与 AI 的对话记录。

#### Schema

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- 对话信息
  conversation_id UUID,                        -- 会话 ID（同一次对话共享）
  guru VARCHAR(20) DEFAULT 'coach',            -- 导师名称（MVP 固定 coach）
  role VARCHAR(10) NOT NULL,                   -- 'user' or 'assistant'
  content TEXT NOT NULL,                       -- 消息内容
  
  -- AI 元数据
  emotion VARCHAR(20),                         -- AI 识别的情绪（仅 assistant）
  safety_level VARCHAR(10),                    -- 安全等级（low/medium/high）
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id, created_at DESC);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);

-- RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Data Retention

- 保留最近 15 天的对话
- 定时任务: 每天凌晨 2 点清理过期数据

```sql
-- Cron job (Supabase Edge Functions)
DELETE FROM chat_messages
WHERE created_at < NOW() - INTERVAL '15 days';
```

---

### Table 4: `review_entries` - 复盘记录

#### Purpose

用户的投资心理复盘记录。

#### Schema

```sql
CREATE TABLE review_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- 关联信息
  conversation_id UUID,                        -- 关联的对话会话
  portfolio_item_id UUID REFERENCES portfolio_items(id),  -- 关联的持仓（可选）
  
  -- 复盘内容
  entry_type VARCHAR(20) DEFAULT 'chat_review', -- 类型（chat_review, daily）
  
  -- 情绪数据
  emotion_before INTEGER CHECK (emotion_before BETWEEN 1 AND 5),  -- 对话前情绪 (1-5)
  emotion_after INTEGER CHECK (emotion_after BETWEEN 1 AND 5),    -- 对话后情绪 (1-5)
  
  -- 决策记录
  action_taken VARCHAR(20),                    -- 决策（lock/add/reduce/clear）
  reflection TEXT,                             -- 用户备注
  
  -- AI 生成
  ai_summary TEXT,                             -- AI 复盘总结
  tags TEXT[],                                 -- AI 自动打标签
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_review_entries_user_id ON review_entries(user_id, created_at DESC);
CREATE INDEX idx_review_entries_conversation ON review_entries(conversation_id);

-- RLS Policies
ALTER TABLE review_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reviews" ON review_entries
  USING (auth.uid() = user_id);
```

---

### Table 5: `emotion_logs` - 每日情绪打卡

#### Purpose

记录用户每日情绪状态。

#### Schema

```sql
CREATE TABLE emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- 情绪数据
  date DATE NOT NULL,                          -- 打卡日期
  emotion VARCHAR(20) NOT NULL,                -- 情绪（anxious/greedy/angry/calm）
  
  -- AI 生成洞察
  ai_insight TEXT,                             -- AI 生成的心理洞察
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束: 每天只能打卡一次
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_emotion_logs_user_date ON emotion_logs(user_id, date DESC);

-- RLS Policies
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own emotion logs" ON emotion_logs
  USING (auth.uid() = user_id);
```

---

### Table 6: `knowledge_chunks` - RAG 知识库 (pgvector)

#### Purpose

存储投资心理学知识、大师语录等内容，用于 RAG 检索增强生成。

#### Schema

```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 内容分类
  category VARCHAR(50),                        -- 分类（psychology, philosophy, case_study）
  guru VARCHAR(20),                            -- 关联导师（buffett, soros, coach）
  
  -- 内容
  title VARCHAR(255),                          -- 标题
  content TEXT NOT NULL,                       -- 正文内容
  metadata JSONB,                              -- 额外元数据
  
  -- 向量嵌入（OpenAI text-embedding-3-small, 1536 维）
  embedding VECTOR(1536),
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector Index (HNSW for fast similarity search)
CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- 普通索引
CREATE INDEX idx_knowledge_chunks_category ON knowledge_chunks(category);
CREATE INDEX idx_knowledge_chunks_guru ON knowledge_chunks(guru);
```

#### Similarity Search Query

```sql
-- 查找与用户问题最相关的 5 条知识
SELECT id, title, content, 1 - (embedding <=> $1::vector) AS similarity
FROM knowledge_chunks
WHERE guru = 'coach' AND category = 'psychology'
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

---

### Table 7: `user_memory` - 用户长期记忆

#### Purpose

存储 AI 对用户的长期记忆（投资风格、情绪模式、学习进度）。

#### Schema

```sql
CREATE TABLE user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- 记忆类型
  memory_type VARCHAR(50),                     -- 类型（investment_style, emotion_pattern, learning_progress）
  key VARCHAR(100),                            -- 记忆键
  value JSONB,                                 -- 记忆值（JSON 格式）
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束: 每个用户的同一类型同一 key 只能有一条记忆
  UNIQUE(user_id, memory_type, key)
);

-- Indexes
CREATE INDEX idx_user_memory_user_type ON user_memory(user_id, memory_type);

-- RLS Policies
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own memory" ON user_memory
  USING (auth.uid() = user_id);
```

#### Example Memory Data

```json
{
  "memory_type": "emotion_pattern",
  "key": "anxiety_triggers",
  "value": {
    "triggers": ["market_drop_5%", "portfolio_red"],
    "coping_strategies": ["deep_breathing", "review_initial_thesis"],
    "last_updated": "2026-01-20"
  }
}
```

---

### Table 8: `market_data_cache` - 市场数据缓存

#### Purpose

缓存从外部 API 获取的市场数据，减少重复调用。

#### Schema

```sql
CREATE TABLE market_data_cache (
  symbol VARCHAR(20) PRIMARY KEY,              -- 股票代码
  
  -- 价格数据
  price DECIMAL(18, 2),                        -- 当前价格
  change_percent DECIMAL(5, 2),                -- 涨跌幅
  
  -- 附加数据（JSON 格式）
  data JSONB,                                  -- 其他数据（公告、新闻等）
  
  -- 缓存元数据
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                        -- 过期时间（5 分钟后）
);

-- Index on expiration
CREATE INDEX idx_market_data_cache_expires ON market_data_cache(expires_at) WHERE expires_at IS NOT NULL;
```

#### Cache Strategy

```sql
-- 查询缓存，如果过期则返回 NULL
SELECT * FROM market_data_cache
WHERE symbol = $1
  AND (expires_at IS NULL OR expires_at > NOW());

-- 写入缓存（5 分钟有效期）
INSERT INTO market_data_cache (symbol, price, change_percent, expires_at)
VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
ON CONFLICT (symbol) DO UPDATE
SET price = EXCLUDED.price,
    change_percent = EXCLUDED.change_percent,
    cached_at = NOW(),
    expires_at = NOW() + INTERVAL '5 minutes';
```

---

## Missing Tables (To Be Added)

根据用户反馈和 MVP 需求，以下表为 **Could Have (P2)** 优先级，暂不实施：

### `strategy_locks` - 策略锁定（P2 - Won't Have in MVP）

**理由**: 功能复杂度高，MVP 阶段不必要

```sql
-- 如果后续需要，定义如下:
CREATE TABLE strategy_locks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  locked_mode VARCHAR(20),  -- 'faith' or 'discipline'
  locked_at TIMESTAMPTZ,
  unlock_at TIMESTAMPTZ
);
```

### `circuit_breaker_logs` - 熔断记录（P2 - Could Have）

**理由**: 情绪熔断机制为可选功能

```sql
CREATE TABLE circuit_breaker_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  conversation_id UUID,
  triggered_at TIMESTAMPTZ,
  cooldown_seconds INTEGER DEFAULT 30,
  user_reflection TEXT
);
```

---

## Database Migrations

### Setup Supabase Migrations

```bash
cd /Users/kevinlou/Studio/Budvest
mkdir -p supabase/migrations

# 创建初始 migration
npx supabase migration new initial_schema
```

### Migration File: `20260120000000_initial_schema.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create all tables (从上述 schema 复制)
...

-- Seed knowledge base (初始化 50+ 条投教知识)
INSERT INTO knowledge_chunks (category, guru, title, content, embedding)
VALUES
  ('psychology', 'coach', '克服恐慌的方法', '当市场大跌时...', /* embedding vector */),
  ('philosophy', 'buffett', '价值投资的本质', '价格是你支付的...', /* embedding vector */);
```

---

## Data Interaction Design

**用户关注**: "不知道用户如何与行为数据和市场行情数据交互"

### Scenario: User Views Emotion Trend

**交互**: 用户打开首页 → 查看 7 日情绪趋势

**数据流**:

1. Frontend 请求 `GET /api/emotion/trend?days=7`
2. Backend 查询 `emotion_logs` 表:

   ```sql
   SELECT date, emotion, ai_insight
   FROM emotion_logs
   WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
   ORDER BY date DESC;
   ```

3. Frontend 渲染折线图

---

### Scenario: User Chats with AI about Holdings

**交互**: 用户说"我的茅台亏了10%"

**数据流**:

1. Frontend 发送 `POST /api/chat-claude`
2. Backend:
   - 从 `portfolio_items` 读取用户持仓
   - Researcher Agent 调用市场 API 获取实时价格
   - 数据写入 `market_data_cache` 缓存
   - Analyst 结合持仓和市场数据分析
   - 最终回复保存到 `chat_messages`

---

## Supabase Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # 服务端操作
```

### RLS Best Practices

1. 所有表启用 RLS
2. 用户只能访问自己的数据
3. Service Role Key 仅在后端使用

---

**最后更新**: 2026-01-20  
**下次评审**: Week 2 数据库迁移完成后验证
