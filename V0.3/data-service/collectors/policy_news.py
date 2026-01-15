"""
政策新闻采集器
使用 AkShare 的 news_cctv 接口获取央视新闻
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import insert_policy_news


def fetch_cctv_news(date: str = None) -> List[Dict[str, Any]]:
    """
    获取央视新闻联播文字稿

    参数:
        date: 日期，格式 'YYYYMMDD'，默认为今天

    返回: 新闻列表
    """
    try:
        if not date:
            date = datetime.now().strftime('%Y%m%d')

        print(f"获取 {date} 的央视新闻...")
        df = ak.news_cctv(date=date)

        if df.empty:
            print(f"{date} 新闻为空")
            return []

        # 字段映射
        data = []
        for _, row in df.iterrows():
            item = {
                'title': row.get('title', ''),
                'content': row.get('content', ''),
                'source': '央视新闻',
                'publish_time': row.get('date', date),
                'category': '政策新闻',
            }
            data.append(item)

        print(f"获取到 {len(data)} 条央视新闻")
        return data

    except Exception as e:
        print(f"获取央视新闻失败: {e}")
        return []


def fetch_financial_news() -> List[Dict[str, Any]]:
    """
    获取财经新闻
    使用 stock_news_em 的通用版本
    """
    try:
        print("获取财经新闻...")
        # 尝试获取一些热门股票的新闻作为财经新闻
        df = ak.stock_news_em(symbol="000001")  # 使用平安银行作为代理

        if df.empty:
            return []

        data = []
        for _, row in df.iterrows():
            item = {
                'title': row.get('新闻标题', ''),
                'content': row.get('新闻内容', ''),
                'source': row.get('新闻来源', ''),
                'publish_time': str(row.get('发布时间', '')),
                'category': '财经新闻',
            }
            data.append(item)

        return data[:20]  # 只取前20条

    except Exception as e:
        print(f"获取财经新闻失败: {e}")
        return []


def collect_and_save(days: int = 3):
    """
    采集并保存政策新闻

    参数:
        days: 获取最近几天的新闻
    """
    total_count = 0

    # 获取最近几天的央视新闻
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y%m%d')
        data = fetch_cctv_news(date)
        if data:
            insert_policy_news(data)
            total_count += len(data)

    # 获取财经新闻
    financial_data = fetch_financial_news()
    if financial_data:
        insert_policy_news(financial_data)
        total_count += len(financial_data)

    print(f"[{datetime.now()}] 已保存 {total_count} 条政策/财经新闻")


if __name__ == "__main__":
    from database import init_database
    init_database()

    # 测试
    collect_and_save(days=1)
