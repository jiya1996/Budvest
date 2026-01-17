-- Supabase Database Schema for Budvest
-- Run this in Supabase SQL Editor to create all required tables

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50),
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio items (stock holdings and watchlist)
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  logo_url TEXT,
  market VARCHAR(10), -- 'A股', 'US', 'HK'
  status VARCHAR(20) DEFAULT 'watching', -- 'investing', 'watching'
  shares DECIMAL(20, 4) DEFAULT 0,
  price_per_share DECIMAL(20, 4) DEFAULT 0,
  cost DECIMAL(20, 4) DEFAULT 0,
  goal TEXT,
  first_buy_timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL,
  session_id VARCHAR(50) NOT NULL UNIQUE,
  guru VARCHAR(20),
  summary TEXT,
  emotional_journey JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  emotion VARCHAR(50),
  intent VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review entries (investment journal)
CREATE TABLE IF NOT EXISTS review_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  portfolio_item_id UUID REFERENCES portfolio_items(id) ON DELETE CASCADE,
  entry_type VARCHAR(20), -- 'buy', 'sell', 'reflection'
  emotion VARCHAR(50),
  content TEXT,
  learned TEXT, -- What the user learned
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge chunks (RAG knowledge base with vector embeddings)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'guru_quotes', 'basic_concept', 'common_mistake', etc.
  guru VARCHAR(20),
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User memories (AI long-term memory)
CREATE TABLE IF NOT EXISTS user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL,
  memory_type VARCHAR(50), -- 'investment_style', 'emotion_patterns', etc.
  key VARCHAR(100),
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create other indexes for better performance
CREATE INDEX IF NOT EXISTS portfolio_items_user_id_idx ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS user_memories_user_id_idx ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_category_idx ON knowledge_chunks(category);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category VARCHAR(50),
  guru VARCHAR(20),
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks.category,
    knowledge_chunks.guru,
    knowledge_chunks.metadata,
    (1 - (knowledge_chunks.embedding <=> query_embedding))::FLOAT AS similarity
  FROM knowledge_chunks
  WHERE knowledge_chunks.embedding IS NOT NULL
    AND (1 - (knowledge_chunks.embedding <=> query_embedding)) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at 
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memories_updated_at 
  BEFORE UPDATE ON user_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (Optional - enable if using Supabase Auth)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users manage own data" ON user_profiles FOR ALL USING (auth.uid() = id);
-- CREATE POLICY "Users manage own portfolio" ON portfolio_items FOR ALL USING (auth.uid() = user_id);
