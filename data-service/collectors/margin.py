"""
融资融券数据采集器
使用 AkShare 的融资融券接口
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import upsert_margin_trading


def fetch_margin_detail(symbol: str) -> List[Dict[str, Any]]:
    """
    获取个股融资融券明细

    参数:
        symbol: 股票代码 (如 '000001')

    返回: 融资融券数据列表
    """
    try:
        print(f"获取 {symbol} 的融资融券数据...")

        # 判断市场
        if symbol.startswith('6'):
            # 上海市场
            df = ak.stock_margin_detail_sse(date=datetime.now().strftime('%Y%m%d'))
            if not df.empty:
                df = df[df['标的证券代码'] == symbol]
        else:
            # 深圳市场
            df = ak.stock_margin_detail_szse(date=datetime.now().strftime('%Y-%m-%d'))
            if not df.empty:
                df = df[df['证券代码'] == symbol]

        if df.empty:
            print(f"股票 {symbol} 融资融券数据为空")
            return []

        # 根据市场不同，字段名可能不同，需要适配
        data = []
        for _, row in df.iterrows():
            # 尝试获取各种可能的字段名
            item = {
                'symbol': symbol,
                'name': row.get('证券简称', row.get('标的证券简称', '')),
                'trade_date': datetime.now().strftime('%Y-%m-%d'),
                'margin_balance': _safe_float(row.get('融资余额', row.get('融资余额(元)', 0))),
                'margin_buy': _safe_float(row.get('融资买入额', row.get('融资买入额(元)', 0))),
                'margin_repay': _safe_float(row.get('融资偿还额', row.get('融资偿还额(元)', 0))),
                'margin_net_buy': _safe_float(row.get('融资净买入', 0)),
                'short_balance': _safe_float(row.get('融券余额', row.get('融券余额(元)', 0))),
                'short_sell_volume': _safe_int(row.get('融券卖出量', row.get('融券卖出量(股)', 0))),
                'short_repay_volume': _safe_int(row.get('融券偿还量', row.get('融券偿还量(股)', 0))),
                'short_net_volume': _safe_int(row.get('融券净卖出', 0)),
                'margin_short_balance': _safe_float(row.get('融资融券余额', 0)),
            }
            data.append(item)

        print(f"获取到 {len(data)} 条融资融券数据")
        return data

    except Exception as e:
        print(f"获取股票 {symbol} 融资融券失败: {e}")
        return []


def fetch_margin_sse() -> List[Dict[str, Any]]:
    """
    获取上交所融资融券汇总数据
    """
    try:
        print("获取上交所融资融券数据...")
        df = ak.stock_margin_detail_sse(date=datetime.now().strftime('%Y%m%d'))

        if df.empty:
            return []

        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': str(row.get('标的证券代码', '')),
                'name': row.get('标的证券简称', ''),
                'trade_date': datetime.now().strftime('%Y-%m-%d'),
                'margin_balance': _safe_float(row.get('融资余额')),
                'margin_buy': _safe_float(row.get('融资买入额')),
                'margin_repay': _safe_float(row.get('融资偿还额')),
                'margin_net_buy': None,
                'short_balance': _safe_float(row.get('融券余额')),
                'short_sell_volume': _safe_int(row.get('融券卖出量')),
                'short_repay_volume': _safe_int(row.get('融券偿还量')),
                'short_net_volume': None,
                'margin_short_balance': _safe_float(row.get('融资融券余额')),
            }
            data.append(item)

        print(f"获取到 {len(data)} 条上交所融资融券数据")
        return data

    except Exception as e:
        print(f"获取上交所融资融券失败: {e}")
        return []


def fetch_margin_szse() -> List[Dict[str, Any]]:
    """
    获取深交所融资融券汇总数据
    """
    try:
        print("获取深交所融资融券数据...")
        df = ak.stock_margin_detail_szse(date=datetime.now().strftime('%Y-%m-%d'))

        if df.empty:
            return []

        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': str(row.get('证券代码', '')),
                'name': row.get('证券简称', ''),
                'trade_date': datetime.now().strftime('%Y-%m-%d'),
                'margin_balance': _safe_float(row.get('融资余额(元)')),
                'margin_buy': _safe_float(row.get('融资买入额(元)')),
                'margin_repay': _safe_float(row.get('融资偿还额(元)')),
                'margin_net_buy': None,
                'short_balance': _safe_float(row.get('融券余量金额(元)')),
                'short_sell_volume': _safe_int(row.get('融券卖出量(股)')),
                'short_repay_volume': _safe_int(row.get('融券偿还量(股)')),
                'short_net_volume': None,
                'margin_short_balance': None,
            }
            data.append(item)

        print(f"获取到 {len(data)} 条深交所融资融券数据")
        return data

    except Exception as e:
        print(f"获取深交所融资融券失败: {e}")
        return []


def collect_and_save(symbols: List[str] = None):
    """
    采集并保存融资融券数据
    """
    total_count = 0

    if symbols:
        # 获取指定股票的融资融券
        for symbol in symbols:
            data = fetch_margin_detail(symbol)
            if data:
                upsert_margin_trading(data)
                total_count += len(data)
    else:
        # 获取全市场融资融券数据
        # 上交所
        sse_data = fetch_margin_sse()
        if sse_data:
            upsert_margin_trading(sse_data)
            total_count += len(sse_data)

        # 深交所
        szse_data = fetch_margin_szse()
        if szse_data:
            upsert_margin_trading(szse_data)
            total_count += len(szse_data)

    print(f"[{datetime.now()}] 已保存 {total_count} 条融资融券数据")


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
    collect_and_save(['000001', '600519'])
