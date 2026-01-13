# Budvest (伴投) - 智能投资心理陪伴助手

Budvest 是一个结合了**AI 心理陪伴**与**专业投资顾问**功能的移动端优先 (Mobile-First) Web 应用程序。它模拟了原生 App 的体验，旨在帮助投资者在高波动的市场中保持理性，对抗贪婪与恐惧。

## 🌟 核心特性

- **移动端优先体验**: 专为手机设计，在桌面端提供沉浸式的 iOS 风格模拟器展示。
- **🧠 AI 投资智囊团 (Gurus)**: 内置多种投资人格，不仅是简单的问答，更能进行深度心理按摩：
  - **巴菲特**: 价值投资，长期主义。
  - **索罗斯**: 反身性理论，关注市场情绪。
  - **达利欧**: 宏观视角，极度透明。
  - **专属教练**: 专注于心理疏导和纪律提醒。
- **🌍 多市场资讯聚合**: 
  - 自动识别并聚合 **美股 (US)**、**港股 (HK)**、**A股 (CN)** 的市场新闻。
  - 智能回退机制：当个股无新闻时，自动补充该市场的头条新闻。
- **📊 模拟持仓系统**:
  - 实时计算持仓盈亏。
  - 记录“心理资本”账户，强调投资心态的重要性。
- **📈 情绪与意图分析**: AI 能够识别用户的对话情绪（焦虑、贪婪、平静等）并给出相应的安全等级建议。

## 🛠 技术栈

- **框架**: Next.js 13+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS (配合 `lucide-react` 图标库)
- **状态管理**: React Hooks + LocalStorage (轻量级本地持久化)
- **API 集成**:
  - **Financial Modeling Prep (FMP)**: 实时/历史市场数据。
  - **OpenAI GPT-4**: 驱动 AI 投资顾问的核心大脑。
  - **RSS & JSON Feeds**: 多源新闻抓取 (SEC, HKEX, SSE)。

## 📂 项目结构

```
investbuddy/
├── app/
│   ├── api/                 # 后端 API 路由
│   │   ├── chat/           # AI 对话接口 (处理 Guru 人格与上下文)
│   │   └── market/         # 市场聚合接口 (含 News, Company Profile)
│   ├── page.tsx            # 主应用入口 (SPA 模式，包含手机模拟器外壳)
│   ├── layout.tsx          # 全局布局
│   └── globals.css         # 全局样式与 Tailwind 指令
├── components/              # 业务组件
│   ├── MarketTab.tsx       # 市场页：大盘指数、个股行情、新闻流
│   ├── CompanionTab.tsx    # 陪伴页：AI 聊天界面
│   ├── PortfolioTab.tsx    # 持仓页：组合管理与收益分析
│   ├── ProfileTab.tsx      # 我的页：用户设置、复盘记录
│   ├── Onboarding.tsx      # 新手引导流程
│   └── BottomNav.tsx       # 底部导航栏
├── lib/
│   ├── types.ts            # 全局类型定义 (Guru, Portfolio, News 等)
│   ├── storage.ts          # LocalStorage 封装 (数据持久化)
│   └── design-system.ts    # 设计系统常量
└── public/                 # 静态资源 (PWA Icons, Manifest)
```

## 🚀 快速开始

### 1. 环境准备

确保已有 Node.js 环境。

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件，填入必要的 API Key：

```env
# 核心数据源 (Financial Modeling Prep)
FMP_API_KEY=your_fmp_api_key

# AI 模型 (OpenAI)
OPENAI_API_KEY=sk-your_openai_key
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。
*   **移动端**: 获得最佳原生体验。
*   **桌面端**: 会看到一个手机模拟器外壳，直接在其中操作。

## 🔌 API 接口说明

### 市场新闻 API
支持多市场源自动路由。

**Endpoint**: `GET /api/market/news`

**参数**:
- `symbol`: 股票代码 (支持前缀 `US:`, `HK:`, `CN:` 或无前缀默认为 US)。例如: `US:AAPL`, `HK:0700`, `CN:600519`。
- `limit`: 返回条数 (默认 10)。

**示例响应**:
```json
[
  {
    "title": "Apple's new headset...",
    "source": "SEC",
    "publishedAt": "2024-01-20T10:00:00Z",
    "url": "https://..."
  }
]
```

## 📱 PWA 支持

本项目配置了 PWA Manifest，在支持的浏览器 (Safari iOS, Chrome Android) 上：
1. 点击“分享”或菜单按钮。
2. 选择“添加到主屏幕”。
3. 即可获得全屏、无地址栏的原生 App 体验。

## 🤝 贡献说明

当前版本为 MVP (V0.1)，数据存储在本地。欢迎提交 PR 增强以下功能：
- 接入 Supabase/Firebase 实现云端同步。
- 增加更多的即时市场数据源。
- 优化 AI 的上下文记忆能力。

## License

MIT
