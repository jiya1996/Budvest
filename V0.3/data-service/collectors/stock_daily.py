"""
个股日K线数据采集器
使用 AkShare 的 stock_zh_a_hist 接口
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import upsert_stock_daily


def fetch_stock_daily(
    symbol: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    period: str = "daily",
    adjust: str = "qfq"
) -> List[Dict[str, Any]]:
    """
    获取个股日K线数据

    参数:
        symbol: 股票代码 (如 '000001')
        start_date: 开始日期 (如 '20240101')
        end_date: 结束日期 (如 '20241231')
        period: 周期 ('daily', 'weekly', 'monthly')
        adjust: 复权类型 ('qfq'-前复权, 'hfq'-后复权, ''-不复权)

    返回: 日K线数据列表
    """
    try:
        # 默认获取最近60天数据
        if not start_date:
            start_date = (datetime.now() - timedelta(days=60)).strftime('%Y%m%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y%m%d')

        print(f"获取 {symbol} 的日K线数据 ({start_date} - {end_date})...")

        df = ak.stock_zh_a_hist(
            symbol=symbol,
            period=period,
            start_date=start_date,
            end_date=end_date,
            adjust=adjust
        )

        if df.empty:
            print(f"股票 {symbol} 数据为空")
            return []

        # 字段映射
        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': symbol,
                'trade_date': str(row.get('日期', '')),
                'open': _safe_float(row.get('开盘')),
                'high': _safe_float(row.get('最高')),
                'low': _safe_float(row.get('最低')),
                'close': _safe_float(row.get('收盘')),
                'volume': _safe_int(row.get('成交量')),
                'amount': _safe_float(row.get('成交额')),
                'amplitude': _safe_float(row.get('振幅')),
                'change_pct': _safe_float(row.get('涨跌幅')),
                'change_amount': _safe_float(row.get('涨跌额')),
                'turnover_rate': _safe_float(row.get('换手率')),
            }
            data.append(item)

        print(f"获取到 {len(data)} 条日K线数据")
        return data

    except Exception as e:
        print(f"获取股票 {symbol} 日K线失败: {e}")
        return []


def collect_and_save(symbols: List[str], days: int = 60):
    """
    批量采集并保存日K线数据
    """
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
    end_date = datetime.now().strftime('%Y%m%d')

    for symbol in symbols:
        data = fetch_stock_daily(symbol, start_date, end_date)
        if data:
            upsert_stock_daily(data)
            print(f"已保存 {symbol} 的 {len(data)} 条日K线数据")


def _safe_float(value) -> Optional[float]:
    """安全转换为浮点数"""
    if pd.isna(value) or value == '' or value == '-':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _safe_int(value) -> Optional[int]:
    """安全转换为整数"""
    if pd.isna(value) or value == '' or value == '-':
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


if __name__ == "__main__":
    from database import init_database
    init_database()

    # 测试获取指定股票
    collect_and_save(['000001', '600519', '300750'])
