"""
个股新闻采集器
使用 AkShare 的 stock_news_em 接口
"""
import akshare as ak
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database import insert_stock_news


def fetch_stock_news(symbol: str) -> List[Dict[str, Any]]:
    """
    获取个股新闻

    参数:
        symbol: 股票代码 (如 '000001')

    返回: 新闻列表
    """
    try:
        print(f"获取 {symbol} 的新闻...")
        df = ak.stock_news_em(symbol=symbol)

        if df.empty:
            print(f"股票 {symbol} 新闻为空")
            return []

        # 字段映射
        data = []
        for _, row in df.iterrows():
            # 处理发布时间
            publish_time = row.get('发布时间', '')
            if publish_time:
                try:
                    # 尝试解析时间格式
                    publish_time = str(publish_time)
                except:
                    pass

            item = {
                'symbol': symbol,
                'title': row.get('新闻标题', ''),
                'content': row.get('新闻内容', ''),
                'source': row.get('新闻来源', ''),
                'publish_time': publish_time,
                'url': row.get('新闻链接', ''),
            }
            data.append(item)

        print(f"获取到 {len(data)} 条新闻")
        return data

    except Exception as e:
        print(f"获取股票 {symbol} 新闻失败: {e}")
        return []


def collect_and_save(symbols: List[str]):
    """
    批量采集并保存个股新闻
    """
    total_count = 0
    for symbol in symbols:
        data = fetch_stock_news(symbol)
        if data:
            insert_stock_news(data)
            total_count += len(data)

    print(f"[{datetime.now()}] 已保存 {total_count} 条个股新闻")


if __name__ == "__main__":
    from database import init_database
    init_database()

    # 测试获取指定股票新闻
    collect_and_save(['000001', '600519'])
