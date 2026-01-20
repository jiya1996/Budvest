# Budvest 数据库表结构需求说明

本文档定义了 Budvest 核心业务所需的所有数据库表结构，包含 **现有核心表** 以及 **新增建议表**。请依照此规范进行数据库设计与数据采集。

## 目录

1.  **现有核心表 (Core Tables)**
    *   [个股实时行情 (stock_realtime)](#1-个股实时行情-stock_realtime)
    *   [个股日K线 (stock_daily)](#2-个股日k线-stock_daily)
    *   [指数实时行情 (index_realtime)](#3-指数实时行情-index_realtime)
    *   [个股新闻 (stock_news)](#4-个股新闻-stock_news)
    *   [政策新闻 (policy_news)](#5-政策新闻-policy_news)
    *   [资金流向 (fund_flow)](#6-资金流向-fund_flow)
    *   [融资融券 (margin_trading)](#7-融资融券-margin_trading)
    *   [财报日历 (earnings_calendar)](#8-财报日历-earnings_calendar)
2.  **新增补充表 (New Tables)** - *需补充采集*
    *   [财务指标 (stock_financials)](#9-财务指标-stock_financials)
    *   [公司基本资料 (company_profile)](#10-公司基本资料-company_profile)
    *   [宏观经济指标 (macro_indicators)](#11-宏观经济指标-macro_indicators)

---

## 1. 个股实时行情 (stock_realtime)
> 存储最新的 A 股个股报价和基础指标。

| 字段名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| **id** | INTEGER | 主键 | 1 |
| **symbol** | VARCHAR(10) | 股票代码 (Unique) | "sh600519" |
| **name** | VARCHAR(50) | 股票名称 | "贵州茅台" |
| **price** | REAL | 当前价格 | 1700.50 |
| **change_pct** | REAL | 涨跌幅 (%) | 1.25 |
| **change_amount** | REAL | 涨跌额 | 21.5 |
| **volume** | BIGINT | 成交量 (手) | 50000 |
| **amount** | REAL | 成交额 | 85000000 |
| **high** | REAL | 最高价 | 1710.00 |
| **low** | REAL | 最低价 | 1690.00 |
| **open** | REAL | 开盘价 | 1695.00 |
| **prev_close** | REAL | 昨收价 | 1680.00 |
| **amplitude** | REAL | 振幅 (%) | 1.19 |
| **volume_ratio** | REAL | 量比 | 0.95 |
| **turnover_rate** | REAL | 换手率 (%) | 0.5 |
| **pe_ratio** | REAL | 市盈率 (TTM) | 25.4 |
| **pb_ratio** | REAL | 市净率 | 8.2 |
| **total_market_cap**| REAL | 总市值 (元) | 2100000000000 |
| **circulating_market_cap** | REAL | 流通市值 (元) | 2100000000000 |
| **updated_at** | DATETIME | 更新时间 | "2024-01-20 15:00:00" |

---

## 2. 个股日K线 (stock_daily)
> 存储个股的历史日线数据。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **id** | INTEGER | 主键 |
| **symbol** | VARCHAR(10) | 股票代码 |
| **trade_date** | DATE | 交易日期 (Unique with symbol) |
| **open** | REAL | 开盘价 |
| **high** | REAL | 最高价 |
| **low** | REAL | 最低价 |
| **close** | REAL | 收盘价 |
| **volume** | BIGINT | 成交量 |
| **amount** | REAL | 成交额 |
| **amplitude** | REAL | 振幅 |
| **change_pct** | REAL | 涨跌幅 |
| **change_amount** | REAL | 涨跌额 |
| **turnover_rate** | REAL | 换手率 |

---

## 3. 指数实时行情 (index_realtime)
> 存储大盘指数的一级行情。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **id** | INTEGER | 主键 |
| **symbol** | VARCHAR(20) | 指数代码 (e.g. "sh000001") |
| **name** | VARCHAR(50) | 指数名称 |
| **price** | REAL | 当前点位 |
| **change_pct** | REAL | 涨跌幅 (%) |
| **change_amount** | REAL | 涨跌额 |
| **volume** | BIGINT | 成交量 |
| **amount** | REAL | 成交额 |
| **updated_at** | DATETIME | 更新时间 |

---

## 4. 个股新闻 (stock_news)
> 存储与个股相关的新闻资讯。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **id** | INTEGER | 主键 |
| **symbol** | VARCHAR(10) | 关联股票代码 |
| **title** | TEXT | 新闻标题 (Unique with publish_time) |
| **content** | TEXT | 新闻正文或摘要 |
| **source** | VARCHAR(100)| 来源媒体 |
| **publish_time** | DATETIME | 发布时间 |
| **url** | TEXT | 原文链接 |
| **created_at** | DATETIME | 入库时间 |

---

## 5. 政策新闻 (policy_news)
> 存储宏观、行业层面的政策新闻。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **id** | INTEGER | 主键 |
| **title** | TEXT | 标题 (Unique with publish_time) |
| **content** | TEXT | 正文或摘要 |
| **source** | VARCHAR(100)| 来源 |
| **publish_time** | DATETIME | 发布时间 |
| **category** | VARCHAR(50) | 类别 ("宏观", "货币", "行业"...) |
| **created_at** | DATETIME | 入库时间 |

---

## 6. 资金流向 (fund_flow)
> 个股主力资金进出明细。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **id** | INTEGER | 主键 |
| **symbol** | VARCHAR(10) | 股票代码 |
| **trade_date** | DATE | 交易日期 (Unique with symbol) |
| **close_price** | REAL | 收盘价 |
| **change_pct** | REAL | 涨跌幅 |
| **main_net_inflow** | REAL | 主力净流入额 |
| **main_net_inflow_pct** | REAL | 主力净流入占比 |
| **super_large_net_inflow** | REAL | 超大单净流入 |
| **large_net_inflow** | REAL | 大单净流入 |
| **medium_net_inflow** | REAL | 中单净流入 |
| **small_net_inflow** | REAL | 小单净流入 |

---

## 7. 融资融券 (margin_trading)
> 个股两融数据。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **id** | INTEGER | 主键 |
| **symbol** | VARCHAR(10) | 股票代码 |
| **trade_date** | DATE | 交易日期 (Unique with symbol) |
| **margin_balance** | REAL | 融资余额 (看多存量) |
| **margin_buy** | REAL | 融资买入额 |
| **margin_repay** | REAL | 融资偿还额 |
| **short_balance** | REAL | 融券余额 (看空存量) |
| **short_sell_volume** | BIGINT | 融券卖出量 |
| **margin_short_balance** | REAL | 两融余额 (融资+融券) |

---

## 8. 财报日历 (earnings_calendar)
> 即使了解公司发布业绩的时间。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **id** | INTEGER | 主键 |
| **symbol** | VARCHAR(10) | 股票代码 |
| **report_date** | DATE | 预计/披露日期 (Unique with symbol, type) |
| **actual_date** | DATE | 实际披露日期 |
| **report_type** | VARCHAR(20) | 类型 ("一季报", "半年报", "三季报", "年报") |

---

## 9. [新增] 财务指标 (stock_financials)
> **必须补充**。用于价值分析，存储每季度的核心财务数据。

| 字段名 | 类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| **id** | INTEGER | 主键 | |
| **symbol** | VARCHAR(10) | 股票代码 | |
| **report_date** | DATE | 报告期截止日 | e.g. "2024-12-31" |
| **report_name** | VARCHAR(20) | 报告名称 | e.g. "2024年报" |
| **total_revenue** | REAL | 总营收 (Total Revenue) | |
| **revenue_yoy** | REAL | 营收同比增长 (%) | |
| **net_profit** | REAL | 归母净利润 | |
| **net_profit_yoy**| REAL | 净利润同比增长 (%) | |
| **gross_margin** | REAL | 毛利率 (%) | 关键指标 |
| **net_margin** | REAL | 净利率 (%) | |
| **roe_weighted** | REAL | ROE (加权) (%) | 巴菲特核心指标 |
| **debt_asset_ratio** | REAL | 资产负债率 (%) | 风险指标 |
| **eps_basic** | REAL | 基本每股收益 | |
| **updated_at** | DATETIME | 更新时间 | |

**唯一索引**: `UNIQUE(symbol, report_date)`

---

## 10. [新增] 公司基本资料 (company_profile)
> **必须补充**。用于 AI 介绍公司业务背景。

| 字段名 | 类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| **id** | INTEGER | 主键 | |
| **symbol** | VARCHAR(10) | 股票代码 | |
| **name** | VARCHAR(50) | 股票名称 | |
| **industry** | VARCHAR(50) | 细分行业 | e.g. "白酒" |
| **sector** | VARCHAR(50) | 所属板块 | e.g. "日常消费" |
| **region** | VARCHAR(50) | 地区 | e.g. "贵州" |
| **main_business** | TEXT | 主营业务描述 | AI 必读字段 |
| **introduction** | TEXT | 公司简介 | |
| **website** | VARCHAR(200)| 公司官网 | |
| **chairman** | VARCHAR(50) | 董事长 | |
| **listing_date** | DATE | 上市日期 | |

**唯一索引**: `UNIQUE(symbol)`

---

## 11. [新增] 宏观经济指标 (macro_indicators)
> **必须补充**。用于宏观大势研判。

| 字段名 | 类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| **id** | INTEGER | 主键 | |
| **indicator_code**| VARCHAR(50) | 指标代码 | e.g. "GDP_YOY", "CPI" |
| **indicator_name**| VARCHAR(100)| 指标名称 | e.g. "GDP同比增长" |
| **report_date** | DATE | 数据日期/月份 | e.g. "2024-01-01" |
| **value** | REAL | 数值 | |
| **unit** | VARCHAR(20) | 单位 | %, 亿元 |
| **publish_time** | DATETIME | 发布时间 | |
| **description** | TEXT | 指标解释 | |

**唯一索引**: `UNIQUE(indicator_code, report_date)`
