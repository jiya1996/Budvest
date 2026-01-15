"""
财报日历采集器
使用 AkShare 获取财报披露时间
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import upsert_earnings_calendar


def fetch_earnings_calendar(date: str = None) -> List[Dict[str, Any]]:
    """
    获取业绩预告/快报

    参数:
        date: 报告期，如 '20241231'

    返回: 财报日历列表
    """
    try:
        if not date:
            # 默认获取最近一个季度的数据
            now = datetime.now()
            year = now.year
            month = now.month

            # 确定最近的报告期
            if month <= 3:
                date = f"{year-1}1231"  # 去年年报
            elif month <= 6:
                date = f"{year}0331"    # 一季报
            elif month <= 9:
                date = f"{year}0630"    # 中报
            else:
                date = f"{year}0930"    # 三季报

        print(f"获取 {date} 报告期的业绩预告...")

        # 尝试获取业绩预告
        try:
            df = ak.stock_yjyg_em(date=date)
        except:
            print("业绩预告接口不可用，尝试其他接口")
            return []

        if df.empty:
            print(f"{date} 业绩预告为空")
            return []

        # 字段映射
        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': str(row.get('股票代码', '')),
                'name': row.get('股票简称', ''),
                'report_date': date,
                'actual_date': str(row.get('公告日期', '')),
                'report_type': '业绩预告',
            }
            data.append(item)

        print(f"获取到 {len(data)} 条业绩预告")
        return data

    except Exception as e:
        print(f"获取业绩预告失败: {e}")
        return []


def fetch_earnings_express(date: str = None) -> List[Dict[str, Any]]:
    """
    获取业绩快报
    """
    try:
        if not date:
            now = datetime.now()
            year = now.year
            month = now.month

            if month <= 3:
                date = f"{year-1}1231"
            elif month <= 6:
                date = f"{year}0331"
            elif month <= 9:
                date = f"{year}0630"
            else:
                date = f"{year}0930"

        print(f"获取 {date} 报告期的业绩快报...")

        try:
            df = ak.stock_yjkb_em(date=date)
        except:
            print("业绩快报接口不可用")
            return []

        if df.empty:
            return []

        data = []
        for _, row in df.iterrows():
            item = {
                'symbol': str(row.get('股票代码', '')),
                'name': row.get('股票简称', ''),
                'report_date': date,
                'actual_date': str(row.get('公告日期', '')),
                'report_type': '业绩快报',
            }
            data.append(item)

        print(f"获取到 {len(data)} 条业绩快报")
        return data

    except Exception as e:
        print(f"获取业绩快报失败: {e}")
        return []


def collect_and_save():
    """
    采集并保存财报日历
    """
    total_count = 0

    # 获取业绩预告
    data1 = fetch_earnings_calendar()
    if data1:
        upsert_earnings_calendar(data1)
        total_count += len(data1)

    # 获取业绩快报
    data2 = fetch_earnings_express()
    if data2:
        upsert_earnings_calendar(data2)
        total_count += len(data2)

    print(f"[{datetime.now()}] 已保存 {total_count} 条财报日历数据")


if __name__ == "__main__":
    from database import init_database
    init_database()

    collect_and_save()
