# 数据采集服务 (Data Service)

基于 AkShare 的 A 股市场数据采集服务，为伴投 Investbuddy 应用提供本地化数据支持。

## 功能特性

### 8 类数据支持

| 数据类型 | AkShare 接口 | 更新频率 | 数据库表 |
|---------|-------------|---------|---------|
| 个股实时行情 | `stock_zh_a_spot_em` | 5分钟 | `stock_realtime` |
| 个股日K线 | `stock_zh_a_hist` | 每日 | `stock_daily` |
| 指数行情 | `stock_zh_index_spot_em` | 5分钟 | `index_realtime` |
| 个股新闻 | `stock_news_em` | 每小时 | `stock_news` |
| 政策新闻 | `news_cctv` | 2小时 | `policy_news` |
| 财报事件 | `stock_yjyg_em` | 每日 | `earnings_calendar` |
| 资金流向 | `stock_individual_fund_flow` | 10分钟 | `fund_flow` |
| 融资融券 | `stock_margin_detail_*` | 每日 | `margin_trading` |

## 快速开始

### 1. 安装 Python 依赖

```bash
cd data-service
pip install -r requirements.txt
```

### 2. 初始化数据库

```bash
python database.py
```

这将在 `../data/investbuddy.db` 创建 SQLite 数据库。

### 3. 启动数据采集服务

```bash
python run.py
```

服务将：
- 执行初始数据采集
- 启动定时任务调度器
- 根据配置的频率自动更新数据

## 配置说明

编辑 `config.py` 修改配置：

```python
CONFIG = {
    # 实时行情更新间隔（秒）
    "realtime_interval": 300,  # 5分钟

    # 默认采集的股票列表
    "default_stocks": [
        "000001",  # 平安银行
        "600519",  # 贵州茅台
        # ...
    ],

    # 指数列表
    "index_list": [
        "000001",  # 上证指数
        "399001",  # 深证成指
        # ...
    ],
}
```

## 目录结构

```
data-service/
├── collectors/           # 数据采集器
│   ├── stock_realtime.py # 个股实时行情
│   ├── stock_daily.py    # 日K线
│   ├── index_data.py     # 指数行情
│   ├── stock_news.py     # 个股新闻
│   ├── policy_news.py    # 政策新闻
│   ├── earnings.py       # 财报日历
│   ├── fund_flow.py      # 资金流向
│   └── margin.py         # 融资融券
├── config.py             # 配置文件
├── database.py           # 数据库模型
├── scheduler.py          # 定时任务
├── run.py                # 启动入口
└── requirements.txt      # Python 依赖
```

## API 端点

数据采集后，Next.js API 可从数据库读取：

| 端点 | 说明 | 示例 |
|-----|------|-----|
| `/api/market/price?symbol=000001` | 个股价格 | A股实时价格 |
| `/api/market/index?symbol=000001` | 指数行情 | 上证指数 |
| `/api/market/kline?symbol=000001` | 日K线 | 最近30日 |
| `/api/market/fund-flow?symbol=000001` | 资金流向 | 主力净流入 |
| `/api/market/margin?symbol=000001` | 融资融券 | 两融数据 |
| `/api/market/earnings?symbol=000001` | 财报日历 | 业绩预告 |

## 注意事项

1. **交易时间**：实时数据仅在交易时间（9:30-11:30, 13:00-15:00）更新
2. **数据延迟**：AkShare 数据可能有 5-15 分钟延迟
3. **API 限制**：频繁请求可能被限制，建议使用定时任务
4. **磁盘空间**：SQLite 数据库会逐渐增大，建议定期清理旧数据

## 手动测试

```bash
# 测试单个采集器
python -m collectors.stock_realtime
python -m collectors.index_data
python -m collectors.stock_news
```

## 与 Next.js 集成

在 Next.js 项目根目录：

```bash
# 安装依赖
npm install

# 启动开发服务器（需要先启动数据采集服务）
npm run dev
```
