"""
资金流向采集器
使用 AkShare 的 stock_individual_fund_flow 接口
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import upsert_fund_flow


def fetch_fund_flow(symbol: str, market: str = None) -> List[Dict[str, Any]]:
    """
    获取个股资金流向

    参数:
        symbol: 股票代码 (如 '000001')
        market: 市场类型 ('sh' 或 'sz')，如果不提供会自动判断

    返回: 资金流向数据列表
    """
    try:
        # 自动判断市场
        if not market:
            if symbol.startswith('6'):
                market = 'sh'
            else:
                market = 'sz'

        print(f"获取 {symbol} 的资金流向...")
        df = ak.stock_individual_fund_flow(stock=symbol, market=market)

        if df.empty:
            print(f"股票 {symbol} 资金流向数据为空")
            return []

        # 字段映射 - AkShare 返回的字段可能有所不同
        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': symbol,
                'name': '',  # 需要从其他接口获取
                'trade_date': str(row.get('日期', '')),
                'close_price': _safe_float(row.get('收盘价')),
                'change_pct': _safe_float(row.get('涨跌幅')),
                'main_net_inflow': _safe_float(row.get('主力净流入-净额')),
                'main_net_inflow_pct': _safe_float(row.get('主力净流入-净占比')),
                'super_large_net_inflow': _safe_float(row.get('超大单净流入-净额')),
                'super_large_net_inflow_pct': _safe_float(row.get('超大单净流入-净占比')),
                'large_net_inflow': _safe_float(row.get('大单净流入-净额')),
                'large_net_inflow_pct': _safe_float(row.get('大单净流入-净占比')),
                'medium_net_inflow': _safe_float(row.get('中单净流入-净额')),
                'medium_net_inflow_pct': _safe_float(row.get('中单净流入-净占比')),
                'small_net_inflow': _safe_float(row.get('小单净流入-净额')),
                'small_net_inflow_pct': _safe_float(row.get('小单净流入-净占比')),
            }
            data.append(item)

        print(f"获取到 {len(data)} 条资金流向数据")
        return data

    except Exception as e:
        print(f"获取股票 {symbol} 资金流向失败: {e}")
        return []


def fetch_fund_flow_rank() -> List[Dict[str, Any]]:
    """
    获取资金流向排名（当日）
    """
    try:
        print("获取资金流向排名...")
        df = ak.stock_individual_fund_flow_rank(indicator="今日")

        if df.empty:
            return []

        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': str(row.get('代码', '')),
                'name': row.get('名称', ''),
                'trade_date': datetime.now().strftime('%Y-%m-%d'),
                'close_price': _safe_float(row.get('最新价')),
                'change_pct': _safe_float(row.get('涨跌幅')),
                'main_net_inflow': _safe_float(row.get('主力净流入-净额')),
                'main_net_inflow_pct': _safe_float(row.get('主力净流入-净占比')),
                'super_large_net_inflow': _safe_float(row.get('超大单净流入-净额')),
                'super_large_net_inflow_pct': _safe_float(row.get('超大单净流入-净占比')),
                'large_net_inflow': _safe_float(row.get('大单净流入-净额')),
                'large_net_inflow_pct': _safe_float(row.get('大单净流入-净占比')),
                'medium_net_inflow': _safe_float(row.get('中单净流入-净额')),
                'medium_net_inflow_pct': _safe_float(row.get('中单净流入-净占比')),
                'small_net_inflow': _safe_float(row.get('小单净流入-净额')),
                'small_net_inflow_pct': _safe_float(row.get('小单净流入-净占比')),
            }
            data.append(item)

        print(f"获取到 {len(data)} 条资金流向排名数据")
        return data

    except Exception as e:
        print(f"获取资金流向排名失败: {e}")
        return []


def collect_and_save(symbols: List[str] = None):
    """
    采集并保存资金流向数据
    """
    total_count = 0

    if symbols:
        # 获取指定股票的资金流向
        for symbol in symbols:
            data = fetch_fund_flow(symbol)
            if data:
                upsert_fund_flow(data)
                total_count += len(data)
    else:
        # 获取资金流向排名（当日热门）
        data = fetch_fund_flow_rank()
        if data:
            upsert_fund_flow(data)
            total_count += len(data)

    print(f"[{datetime.now()}] 已保存 {total_count} 条资金流向数据")


def _safe_float(value) -> Optional[float]:
    """安全转换为浮点数"""
    if pd.isna(value) or value == '' or value == '-':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


if __name__ == "__main__":
    from database import init_database
    init_database()

    # 测试获取指定股票
    collect_and_save(['000001', '600519'])
