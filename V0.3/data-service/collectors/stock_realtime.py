"""
个股实时行情采集器
使用 AkShare 的 stock_zh_a_spot_em 接口
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import upsert_stock_realtime


def fetch_all_stock_realtime() -> List[Dict[str, Any]]:
    """
    获取所有A股实时行情
    返回: 股票实时行情列表
    """
    try:
        print(f"[{datetime.now()}] 开始获取A股实时行情...")
        df = ak.stock_zh_a_spot_em()

        if df.empty:
            print("获取数据为空")
            return []

        # 字段映射
        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': str(row.get('代码', '')),
                'name': row.get('名称', ''),
                'price': _safe_float(row.get('最新价')),
                'change_pct': _safe_float(row.get('涨跌幅')),
                'change_amount': _safe_float(row.get('涨跌额')),
                'volume': _safe_int(row.get('成交量')),
                'amount': _safe_float(row.get('成交额')),
                'high': _safe_float(row.get('最高')),
                'low': _safe_float(row.get('最低')),
                'open': _safe_float(row.get('今开')),
                'prev_close': _safe_float(row.get('昨收')),
                'amplitude': _safe_float(row.get('振幅')),
                'volume_ratio': _safe_float(row.get('量比')),
                'turnover_rate': _safe_float(row.get('换手率')),
                'pe_ratio': _safe_float(row.get('市盈率-动态')),
                'pb_ratio': _safe_float(row.get('市净率')),
                'total_market_cap': _safe_float(row.get('总市值')),
                'circulating_market_cap': _safe_float(row.get('流通市值')),
            }
            data.append(item)

        print(f"获取到 {len(data)} 只股票数据")
        return data

    except Exception as e:
        print(f"获取A股实时行情失败: {e}")
        return []


def fetch_stock_realtime_by_symbols(symbols: List[str]) -> List[Dict[str, Any]]:
    """
    获取指定股票的实时行情
    """
    all_data = fetch_all_stock_realtime()
    if not all_data:
        return []

    # 过滤指定股票
    filtered = [item for item in all_data if item['symbol'] in symbols]
    return filtered


def collect_and_save(symbols: Optional[List[str]] = None):
    """
    采集并保存实时行情到数据库
    """
    if symbols:
        data = fetch_stock_realtime_by_symbols(symbols)
    else:
        data = fetch_all_stock_realtime()

    if data:
        upsert_stock_realtime(data)
        print(f"[{datetime.now()}] 已保存 {len(data)} 条实时行情数据")


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
    # 测试
    from database import init_database
    init_database()

    # 测试获取全部
    # collect_and_save()

    # 测试获取指定股票
    collect_and_save(['000001', '600519', '300750'])
