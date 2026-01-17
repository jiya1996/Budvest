# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Investbuddy (伴投)** is a PWA investment psychology companion for Chinese-speaking retail investors. It combines AI-powered emotional counseling with multi-market data support (A-shares, US, HK stocks). The app emphasizes psychological support over trading advice—it never provides specific buy/sell recommendations.

## Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
```

## Environment Variables

Required in `.env.local`:
- `ANTHROPIC_API_KEY` - Claude Agent SDK for multi-agent system
- `OPENAI_API_KEY` - (Optional) For RAG embeddings
- `FMP_API_KEY` - US/HK stock data (Financial Modeling Prep)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase operations

## Architecture

### Multi-Agent System (Claude Agent SDK)

The project uses **Claude Agent SDK** with 5 specialized agents:

| Agent | Role | Tools | Model |
|-------|------|-------|-------|
| **Coordinator** | Understands user intent, dispatches tasks | Task, Read, Grep, AskUserQuestion | Sonnet |
| **Researcher** | Fetches announcements, news, earnings | Eastmoney API, Sina Finance API, WebSearch | Haiku |
| **Analyst** | Technical & fundamental analysis | Market data, WebSearch, Read, Grep | Sonnet |
| **Risk Manager** | Risk assessment, position management | Market data, calculations, WebSearch | Sonnet |
| **Mentor** (7 types) | Psychological counseling, investment philosophy | Read, Grep (RAG) | Sonnet |

**Agent Workflow**:
```
User Query → Coordinator (intent classification)
  ├─ Simple: Direct response
  ├─ Single task: Call one agent (researcher/analyst/risk-manager/mentor)
  └─ Complex: Serial dispatch (researcher → analyst → risk-manager → mentor)
```

**Command System**:
- `/research <symbol>` - Force call researcher
- `/analyze <symbol>` - Force call analyst
- `/risk <symbol>` - Force call risk manager
- `/mentor <name>` - Switch mentor (buffett/soros/dalio/munger/lynch/wood/coach)

### Database (Supabase Cloud-Native)

**Supabase PostgreSQL + pgvector**:
- User profiles, portfolio, chat history
- RAG knowledge base with vector embeddings
- Long-term user memory and learning progress

### AI System
- **7 AI Mentors** (`lib/types.ts:Guru`): buffett, soros, dalio, munger, lynch, wood, coach
- **Emotion Detection** (`Emotion`): anxious, panic, angry, greedy, calm
- **Intent Classification** (`Intent`): vent, ask_reason, seek_advice, review, other
- **Safety Level** (`SafetyLevel`): Prevents giving specific investment advice
- **RAG** (`lib/rag.ts`): Vector similarity search via Supabase pgvector
- **Memory** (`lib/memory.ts`): Long-term user profiling and learning progress

### API Routes (`app/api/`)

Market Data:
- `/api/market/price?symbol=` - Stock price (auto-detects A-share vs global)
- `/api/market/kline`, `/api/market/fund-flow`, `/api/market/news`, `/api/market/earnings`

Core Features:
- `/api/chat-claude` - **PRIMARY**: Claude Agent SDK multi-agent system
- `/api/chat` - Legacy OpenAI implementation (deprecated)
- `/api/portfolio/*` - Portfolio management (init, parse-command, apply-command)
- `/api/review/*` - Investment journal operations

### Key Libraries (`lib/`)

| File | Purpose |
|------|---------|
| `claude-agents.ts` | 5 agent definitions (coordinator, researcher, analyst, risk-manager, mentor) |
| `mcp-tools.ts` | MCP Server with 3 tools (Eastmoney API, Sina Finance API, position calculator) |
| `supabase.ts` | Supabase client, DB types, vector search helper |
| `rag.ts` | RAG knowledge retrieval with OpenAI embeddings |
| `memory.ts` | User long-term memory system |
| `tools.ts` | Legacy OpenAI function calling tools (deprecated) |
| `types.ts` | Core TypeScript types (Guru, Emotion, Intent, etc.) |
| `market/providers.ts` | Market data provider abstraction |

### Data Flow

**Claude Agent System** (Primary):
1. User message → Coordinator agent
2. Coordinator classifies intent → Dispatches to specialist agents
3. Agents use MCP tools (Eastmoney API, Sina Finance API, WebSearch, etc.)
4. Coordinator aggregates results → Returns response

**Market Data**:
- A-shares: Eastmoney API (announcements) + Sina Finance API (real-time quotes)
- Global: FMP API (US/HK stocks)
- All data stored/cached in Supabase

**Portfolio**: Natural language commands parsed by AI → Applied to Supabase

## Technology Stack

- Next.js 15 (App Router) + React 18 + TypeScript
- TailwindCSS + Lucide Icons
- **Claude Agent SDK** (multi-agent system)
- Supabase (PostgreSQL + pgvector)
- OpenAI GPT-4o-mini (optional for embeddings)
- next-pwa for PWA support
- Eastmoney API + Sina Finance API (A-share data)

## Important Constraints

- **No Investment Advice**: The AI must never provide specific buy/sell recommendations. Check `safety_level` in responses.
- **Chinese-First**: Primary UI and content in Chinese; target audience is Chinese retail investors
- **Mobile-First PWA**: Optimized for mobile installation and offline capability

## Testing

- Test page: `/test-claude` - Multi-agent system testing interface
- Use commands like `/research 600519` to test specific agents

## Legacy Code

The following files/directories are deprecated and moved to `legacy/`:
- `legacy/data-service/` - Python SQLite data collector (replaced by Supabase + APIs)
- `lib/legacy/db.ts` - SQLite database operations (replaced by Supabase)
