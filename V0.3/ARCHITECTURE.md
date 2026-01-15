# 伴投 Investbuddy V0.3 产品架构图

> 投资心理陪伴与复盘工具 (PWA)

---

## 技术栈概览

| 类型 | 技术 | 说明 |
|------|------|------|
| **前端/应用** | Next.js 15 (App Router) | React 框架, PWA 支持 |
| **语言** | TypeScript | 类型安全 |
| **样式** | TailwindCSS | 实用优先 CSS 框架 |
| **数据库** | SQLite | 本地轻量级数据库 (better-sqlite3) |
| **数据服务** | Python | 独立数据采集服务 (AkShare) |
| **数据源** | AkShare (A股), FMP (美股/港股) | 多市场数据支持 |
| **AI服务** | OpenAI GPT-4o-mini | RAG (检索增强) + 长期记忆 |

---

## 系统架构图 (Mermaid)

```mermaid
graph TB
    subgraph Client ["客户端 (Client)"]
        Browser[浏览器 / PWA]
    end

    subgraph App ["应用层 (Next.js)"]
        UI[UI 组件 (React)]
        API[API 路由]
        RAG[RAG 引擎]
        Memory[记忆系统]
    end

    subgraph DataService ["数据服务层 (Python)"]
        Scheduler[调度器]
        Collector[采集器 (AkShare)]
    end

    subgraph Storage ["存储层"]
        SQLite[(SQLite 数据库)]
        VectorDB[(向量检索 - 本地计算)]
    end

    subgraph External ["外部服务"]
        OpenAI[OpenAI API]
        FMP[FMP API (美股/港股)]
        AkShareSource[AkShare 数据源]
    end

    Browser <--> |HTTPS| UI
    UI <--> |Server Actions/API| API
    
    API <--> |Chat/Analysis| OpenAI
    API <--> |Market Data| FMP
    API <--> |Read/Write| SQLite
    
    API <--> RAG
    RAG <--> |Search| VectorDB
    RAG <--> |Context| SQLite

    Scheduler --> |Schedule| Collector
    Collector --> |Fetch| AkShareSource
    Collector --> |Write| SQLite
```

---

## 目录结构 (V0.3)

```
investbuddy/
├── app/                    # Next.js 应用主逻辑
│   ├── api/                # API 路由 (Chat, Market, Portfolio...)
│   ├── dashboard/          # 仪表板
│   ├── chat/               # AI 对话界面
│   └── ...
├── components/             # React UI 组件
├── data/                   # 本地数据存储 (SQLite DB 所在位置)
├── data-service/           # [Python] 数据采集微服务
│   ├── collectors/         # 各类数据采集脚本
│   ├── database.py         # 数据库模型定义
│   └── run.py              # 服务启动入口
├── lib/                    # 核心工具库
│   ├── db.ts               # SQLite 连接与查询封装
│   ├── rag.ts              # RAG 知识库模块
│   ├── memory.ts           # AI 长期记忆模块
│   └── ...
└── public/                 # 静态资源
```

---

## 核心模块详解 V0.3

### 1. 双核市场数据引擎
- **美股/港股**: 通过 `app/api/market` 直接调用 FMP API 获取实时数据。
- **A 股**: 
    - **写 (Write)**: Python Data Service 后台运行，定期通过 AkShare 采集行情、K线、新闻，存入 `data/investbuddy.db`。
    - **读 (Read)**: Next.js API 通过 `lib/db.ts` 读取 SQLite 数据库，提供给前端。

### 2. 进化版 AI 投资导师
- **角色系统**: 7位导师配置，包含性格prompt和知识库。
- **记忆系统 (`lib/memory.ts`)**: 持久化存储用户对话、偏好、情绪历史到 SQLite。
- **RAG 系统 (`lib/rag.ts`)**: 基于余弦相似度 (Cosine Similarity) 的本地轻量级向量检索，增强 AI 回复的专业度。

### 3. 全功能投资系统
- **组合管理**: 支持持仓、观望、历史交易记录。
- **复盘日记**: 记录交易时的心理状态（贪婪、恐惧等），后续 AI 可基于此进行辅导。

---

## 数据流向

### A股数据流
`Python Service` -> `AkShare` -> `SQLite (data/investbuddy.db)` -> `Next.js API` -> `Frontend`

### AI对话流
1. User 发送消息
2. Next.js API 接收
3. RAG 检索相关上下文 (Vector Search)
4. Memory 读取历史对话/用户画像 (SQLite)
5. 组装 Prompt 调用 OpenAI
6. 返回结果并异步保存新的记忆/对话记录到 SQLite

---

## 部署说明 (V0.3)

由于引入了 Python 数据服务和 SQLite 文件数据库，V0.3 推荐部署方式为 **Docker** 或 **VPS**，而非纯 Serverless (如 Vercel)。

- **Web**: `npm run start` (Next.js server)
- **Data**: `python data-service/run.py` (Background process)
- **DB**: 共享的 `data/investbuddy.db` 文件

---

*文档更新时间: 2026年1月*
