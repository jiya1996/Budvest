# Changelog

All notable changes to the Budvest project will be documented in this file.

## [Unreleased] - 2026-01-17

### 🚀 Major Changes
- **Cloud-Native Migration**: Shifted architecture from local SQLite/Python to Supabase + Vercel
  - Migrated database to Supabase PostgreSQL with `pgvector` for AI features
  - Replaced Python data service with Next.js Edge Functions (`app/api/market/a-stock`)
  - Updated `package.json` to remove `better-sqlite3` and Python dependencies
  - Added `@supabase/supabase-js` and `@upstash/redis`

### ✨ New Features
- **A-Stock API**: Implemented Serverless API for fetching A-share data from Sina Finance
- **Supabase Integration**:
  - Added `lib/supabase.ts` client configuration
  - Created complete database schema (`supabase/schema.sql`) including:
    - `user_profiles`, `portfolio_items`, `chat_sessions`, `chat_messages`
    - `knowledge_chunks` (with vector embeddings), `user_memories`
- **RAG System V2**:
  - Rewrote `lib/rag.ts` to use Supabase `pgvector` instead of local BLOBs
  - Added 25+ seed knowledge chunks for beginner education
- **Memory System V2**:
  - Rewrote `lib/memory.ts` to persist user context and emotional trends in Supabase

### 📚 Documentation
- **Architecture**: Completely rewrote `ARCHITECTURE.md` to reflect new stack
- **Walkthrough**: Created comprehensive migration guide for team
- **Task**: Updated `task.md` with migration progress

### ⚙️ Configuration
- Added `.env.local.example` with Supabase and OpenAI configuration templates
- Initialized Supabase project structure
