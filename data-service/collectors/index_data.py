"""
指数实时行情采集器
使用 AkShare 的 stock_zh_index_spot_em 接口
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import upsert_index_realtime
from config import CONFIG


def fetch_all_index_realtime() -> List[Dict[str, Any]]:
    """
    获取所有指数实时行情
    """
    try:
        print(f"[{datetime.now()}] 开始获取指数实时行情...")
        df = ak.stock_zh_index_spot_em()

        if df.empty:
            print("获取指数数据为空")
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
            }
            data.append(item)

        print(f"获取到 {len(data)} 只指数数据")
        return data

    except Exception as e:
        print(f"获取指数实时行情失败: {e}")
        return []


def fetch_index_realtime_by_symbols(symbols: List[str]) -> List[Dict[str, Any]]:
    """
    获取指定指数的实时行情
    """
    all_data = fetch_all_index_realtime()
    if not all_data:
        return []

    # 过滤指定指数
    filtered = [item for item in all_data if item['symbol'] in symbols]
    return filtered


def collect_and_save(symbols: Optional[List[str]] = None):
    """
    采集并保存指数行情到数据库
    """
    if symbols:
        data = fetch_index_realtime_by_symbols(symbols)
    else:
        # 默认只获取配置中的指数
        data = fetch_index_realtime_by_symbols(CONFIG['index_list'])

    if data:
        upsert_index_realtime(data)
        print(f"[{datetime.now()}] 已保存 {len(data)} 条指数行情数据")


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

    # 测试获取主要指数
    collect_and_save()
