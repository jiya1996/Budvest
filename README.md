# Budvest

## 目录说明
- V0.1：历史版本（仅供参考）
- V0.3：当前开发版本（请在此目录开发）

## 快速开始（V0.3）
```bash
cd V0.3
npm install
npm run dev


# Budvest Version History: V0.1 to V0.3

本文档详细介绍了 Budvest从 V0.1 到 V0.3 的版本演进与核心变化。

## 1. 项目概览

| 特性 | V0.1 (Budvest) | V0.3    |
| :--- | :--- | :--- |
| **定位** | 投资组合管理原型 | 智能伴投助手 |
| **架构** | 纯前端 (Next.js) | 前后端分离 (Next.js + Python Data Service) |
| **数据源** | 本地模拟 / 用户输入 | **AkShare (实时 A 股行情)** + SQLite 本地库 |
| **数据持久化** | LocalStorage | SQLite + LocalStorage (双重保障) |
| **UI/UX** | 基础 Dashboard | 沉浸式移动端风格 + 心理资本展示 |

---

## 2. 核心架构升级

### 2.1 引入 Python Data Service (数据服务)
V0.3 引入了独立的 Python 微服务 (`/data-service`)，负责高频数据采集与清洗。
- **技术栈**: Python, AkShare, SQLite
- **功能**:
    - **实时行情**: 每 5 分钟更新个股与指数数据 (交易时段)。
    - **多维数据**: 支持 8 类数据采集，包括日 K 线、财报日历、资金流向、融资融券、政策新闻等。
    - **定时任务**: 内置调度器 (`scheduler.py`) 自动维护数据新鲜度。

### 2.2 API 接口扩展
后端 API (`app/api`) 从简单的 CRUD 扩展为功能丰富的数据网关。
- **新增**:
    - `api/market/*`: 提供 K 线、资金流、新闻等深度数据。
    - `api/exchange-rate`: 汇率服务。
    - `api/offline`: 离线模式支持。
- **增强**:
    - `api/portfolio`: 增加了服务器端初始化与数据校准 (`/init`)。

---

## 3. 功能特性对比

### 📊 市场数据 (Market Data)
- **V0.1**: 仅支持简单的价格显示，无法获取历史走势或深度数据。
- **V0.3**:
    - **全景行情**: 支持上证指数、深证成指、创业板指等核心指数实时追踪。
    - **深度分析**: 提供个股 K 线图、主力资金流向监控。
    - **资讯聚合**: 自动聚合个股新闻与政策新闻 (`stock_news`, `policy_news`)。

### 💼 资产管理 (Portfolio Management)
- **V0.1**: 基础的增删改查，数据仅存在浏览器中。
- **V0.3**:
    - **智能初始化**: 首次使用时自动计算历史投入与收益。
    - **心理帐户**: 首页头部新增"心理资本"展示，强化长期投资心态。
    - **双向同步**: 既支持本地缓存，也打通了数据库存储，数据安全性更高。

### 📱 用户体验 (UX) & PWA
- **V0.1**: 响应式网页。
- **V0.3**:
    - **PWA 支持**: 集成 `next-pwa`，支持离线访问与安装到手机桌面。
    - **交互优化**: 引入 `react-hot-toast` 提供平滑的操作反馈。
    - **视觉升级**: 全新的磨砂玻璃 (Glassmorphism) 风格 UI，更细腻的动画效果。

---

## 4. 技术栈变更

### 新增依赖
- **后端**: `better-sqlite3` (高性能 SQLite 驱动)
- **前端组件**: `react-hot-toast` (通知), `lucide-react` (图标库升级)
- **工程化**: `next-pwa` (渐进式 Web 应用)
- **Python**: `akshare` (财经数据源), `schedule` (任务调度)

### 移除/替换
- 移除了部分冗余的测试代码，将核心逻辑封装至 `lib/` 和 `data-service/` 中。

---

## 5. 快速开始 (V0.3)

由于引入了 Python 数据服务，V0.3 的启动步骤有所不同：

1.  **初始化数据服务**:
    ```bash
    cd V0.3/data-service
    pip install -r requirements.txt
    python database.py  # 创建数据库
    python run.py       # 启动采集服务(保持运行)
    ```

2.  **启动 Web 应用**:
    ```bash
    cd V0.3
    npm install
    npm run dev
    ```
