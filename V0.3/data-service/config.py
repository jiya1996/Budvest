"""
配置文件
"""
import os
from pathlib import Path

# 项目根目录
BASE_DIR = Path(__file__).parent.parent

# 数据库路径
DATABASE_PATH = BASE_DIR / "data" / "investbuddy.db"

# 确保 data 目录存在
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

# 数据采集配置
CONFIG = {
    # 实时行情更新间隔（秒）- 交易时间内
    "realtime_interval": 300,  # 5分钟

    # 新闻更新间隔（秒）
    "news_interval": 3600,  # 1小时

    # 日线数据更新时间
    "daily_update_hour": 16,  # 下午4点（收盘后）
    "daily_update_minute": 30,

    # 交易时间段 (用于判断是否需要更新实时数据)
    "trading_hours": {
        "morning_start": "09:30",
        "morning_end": "11:30",
        "afternoon_start": "13:00",
        "afternoon_end": "15:00",
    },

    # 默认获取的股票列表（用户持仓 + 热门股票）
    "default_stocks": [
        "000001",  # 平安银行
        "600519",  # 贵州茅台
        "000858",  # 五粮液
        "300750",  # 宁德时代
        "601318",  # 中国平安
    ],

    # 指数列表
    "index_list": [
        "000001",  # 上证指数
        "399001",  # 深证成指
        "399006",  # 创业板指
        "000300",  # 沪深300
        "000016",  # 上证50
        "000905",  # 中证500
    ],
}
