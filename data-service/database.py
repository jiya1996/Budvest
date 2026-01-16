"""
数据库模型和连接管理
使用 SQLite 作为本地数据存储
"""
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Optional, List, Dict, Any

from config import DATABASE_PATH


def get_connection() -> sqlite3.Connection:
    """获取数据库连接"""
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row  # 支持字典式访问
    return conn


@contextmanager
def get_db():
    """数据库连接上下文管理器"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_database():
    """初始化数据库表结构"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 个股实时行情
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_realtime (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(10) NOT NULL,
                name VARCHAR(50),
                price REAL,
                change_pct REAL,
                change_amount REAL,
                volume BIGINT,
                amount REAL,
                high REAL,
                low REAL,
                open REAL,
                prev_close REAL,
                amplitude REAL,
                volume_ratio REAL,
                turnover_rate REAL,
                pe_ratio REAL,
                pb_ratio REAL,
                total_market_cap REAL,
                circulating_market_cap REAL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol)
            )
        """)

        # 个股日K线
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_daily (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(10) NOT NULL,
                trade_date DATE NOT NULL,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                volume BIGINT,
                amount REAL,
                amplitude REAL,
                change_pct REAL,
                change_amount REAL,
                turnover_rate REAL,
                UNIQUE(symbol, trade_date)
            )
        """)

        # 指数实时行情
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS index_realtime (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(20) NOT NULL,
                name VARCHAR(50),
                price REAL,
                change_pct REAL,
                change_amount REAL,
                volume BIGINT,
                amount REAL,
                high REAL,
                low REAL,
                open REAL,
                prev_close REAL,
                amplitude REAL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol)
            )
        """)

        # 个股新闻
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(10),
                title TEXT NOT NULL,
                content TEXT,
                source VARCHAR(100),
                publish_time DATETIME,
                url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(title, publish_time)
            )
        """)

        # 政策新闻
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS policy_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                source VARCHAR(100),
                publish_time DATETIME,
                category VARCHAR(50),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(title, publish_time)
            )
        """)

        # 财报日历
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS earnings_calendar (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(10) NOT NULL,
                name VARCHAR(50),
                report_date DATE,
                actual_date DATE,
                report_type VARCHAR(20),
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol, report_date, report_type)
            )
        """)

        # 资金流向
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fund_flow (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(10) NOT NULL,
                name VARCHAR(50),
                trade_date DATE NOT NULL,
                close_price REAL,
                change_pct REAL,
                main_net_inflow REAL,
                main_net_inflow_pct REAL,
                super_large_net_inflow REAL,
                super_large_net_inflow_pct REAL,
                large_net_inflow REAL,
                large_net_inflow_pct REAL,
                medium_net_inflow REAL,
                medium_net_inflow_pct REAL,
                small_net_inflow REAL,
                small_net_inflow_pct REAL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol, trade_date)
            )
        """)

        # 融资融券
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS margin_trading (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(10) NOT NULL,
                name VARCHAR(50),
                trade_date DATE NOT NULL,
                margin_balance REAL,
                margin_buy REAL,
                margin_repay REAL,
                margin_net_buy REAL,
                short_balance REAL,
                short_sell_volume BIGINT,
                short_repay_volume BIGINT,
                short_net_volume BIGINT,
                margin_short_balance REAL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol, trade_date)
            )
        """)

        # ==================== Agent 相关表 ====================

        # 会话记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id VARCHAR(50) NOT NULL,
                session_id VARCHAR(50) NOT NULL UNIQUE,
                guru VARCHAR(20),
                summary TEXT,
                emotional_journey JSON,
                topics JSON,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME
            )
        """)

        # 消息记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id VARCHAR(50) NOT NULL,
                role VARCHAR(10) NOT NULL,
                content TEXT NOT NULL,
                emotion VARCHAR(20),
                intent VARCHAR(20),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 用户画像表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id VARCHAR(50) UNIQUE NOT NULL,
                investment_style JSON,
                emotion_patterns JSON,
                decision_patterns JSON,
                learning_progress JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 知识库向量表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category VARCHAR(50) NOT NULL,
                guru VARCHAR(20),
                content TEXT NOT NULL,
                embedding BLOB,
                metadata JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 创建索引以提高查询性能
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_realtime_symbol ON stock_realtime(symbol)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_daily_symbol_date ON stock_daily(symbol, trade_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_index_realtime_symbol ON index_realtime(symbol)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_news_symbol ON stock_news(symbol)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stock_news_publish_time ON stock_news(publish_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_policy_news_publish_time ON policy_news(publish_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_fund_flow_symbol_date ON fund_flow(symbol, trade_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_margin_trading_symbol_date ON margin_trading(symbol, trade_date)")

        # Agent 相关索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_started ON chat_sessions(started_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_chunks(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_guru ON knowledge_chunks(guru)")

        print("数据库初始化完成")


# ==================== 数据操作函数 ====================

def upsert_stock_realtime(data: List[Dict[str, Any]]):
    """批量更新/插入个股实时行情"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            cursor.execute("""
                INSERT INTO stock_realtime (
                    symbol, name, price, change_pct, change_amount,
                    volume, amount, high, low, open, prev_close,
                    amplitude, volume_ratio, turnover_rate,
                    pe_ratio, pb_ratio, total_market_cap, circulating_market_cap,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol) DO UPDATE SET
                    name = excluded.name,
                    price = excluded.price,
                    change_pct = excluded.change_pct,
                    change_amount = excluded.change_amount,
                    volume = excluded.volume,
                    amount = excluded.amount,
                    high = excluded.high,
                    low = excluded.low,
                    open = excluded.open,
                    prev_close = excluded.prev_close,
                    amplitude = excluded.amplitude,
                    volume_ratio = excluded.volume_ratio,
                    turnover_rate = excluded.turnover_rate,
                    pe_ratio = excluded.pe_ratio,
                    pb_ratio = excluded.pb_ratio,
                    total_market_cap = excluded.total_market_cap,
                    circulating_market_cap = excluded.circulating_market_cap,
                    updated_at = excluded.updated_at
            """, (
                item.get('symbol'),
                item.get('name'),
                item.get('price'),
                item.get('change_pct'),
                item.get('change_amount'),
                item.get('volume'),
                item.get('amount'),
                item.get('high'),
                item.get('low'),
                item.get('open'),
                item.get('prev_close'),
                item.get('amplitude'),
                item.get('volume_ratio'),
                item.get('turnover_rate'),
                item.get('pe_ratio'),
                item.get('pb_ratio'),
                item.get('total_market_cap'),
                item.get('circulating_market_cap'),
                datetime.now().isoformat()
            ))


def upsert_stock_daily(data: List[Dict[str, Any]]):
    """批量更新/插入日K线数据"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            cursor.execute("""
                INSERT INTO stock_daily (
                    symbol, trade_date, open, high, low, close,
                    volume, amount, amplitude, change_pct, change_amount, turnover_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol, trade_date) DO UPDATE SET
                    open = excluded.open,
                    high = excluded.high,
                    low = excluded.low,
                    close = excluded.close,
                    volume = excluded.volume,
                    amount = excluded.amount,
                    amplitude = excluded.amplitude,
                    change_pct = excluded.change_pct,
                    change_amount = excluded.change_amount,
                    turnover_rate = excluded.turnover_rate
            """, (
                item.get('symbol'),
                item.get('trade_date'),
                item.get('open'),
                item.get('high'),
                item.get('low'),
                item.get('close'),
                item.get('volume'),
                item.get('amount'),
                item.get('amplitude'),
                item.get('change_pct'),
                item.get('change_amount'),
                item.get('turnover_rate')
            ))


def upsert_index_realtime(data: List[Dict[str, Any]]):
    """批量更新/插入指数实时行情"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            cursor.execute("""
                INSERT INTO index_realtime (
                    symbol, name, price, change_pct, change_amount,
                    volume, amount, high, low, open, prev_close, amplitude, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol) DO UPDATE SET
                    name = excluded.name,
                    price = excluded.price,
                    change_pct = excluded.change_pct,
                    change_amount = excluded.change_amount,
                    volume = excluded.volume,
                    amount = excluded.amount,
                    high = excluded.high,
                    low = excluded.low,
                    open = excluded.open,
                    prev_close = excluded.prev_close,
                    amplitude = excluded.amplitude,
                    updated_at = excluded.updated_at
            """, (
                item.get('symbol'),
                item.get('name'),
                item.get('price'),
                item.get('change_pct'),
                item.get('change_amount'),
                item.get('volume'),
                item.get('amount'),
                item.get('high'),
                item.get('low'),
                item.get('open'),
                item.get('prev_close'),
                item.get('amplitude'),
                datetime.now().isoformat()
            ))


def insert_stock_news(data: List[Dict[str, Any]]):
    """批量插入个股新闻（忽略重复）"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO stock_news (
                        symbol, title, content, source, publish_time, url, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    item.get('symbol'),
                    item.get('title'),
                    item.get('content'),
                    item.get('source'),
                    item.get('publish_time'),
                    item.get('url'),
                    datetime.now().isoformat()
                ))
            except sqlite3.IntegrityError:
                pass  # 忽略重复


def insert_policy_news(data: List[Dict[str, Any]]):
    """批量插入政策新闻（忽略重复）"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO policy_news (
                        title, content, source, publish_time, category, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    item.get('title'),
                    item.get('content'),
                    item.get('source'),
                    item.get('publish_time'),
                    item.get('category'),
                    datetime.now().isoformat()
                ))
            except sqlite3.IntegrityError:
                pass


def upsert_fund_flow(data: List[Dict[str, Any]]):
    """批量更新/插入资金流向"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            cursor.execute("""
                INSERT INTO fund_flow (
                    symbol, name, trade_date, close_price, change_pct,
                    main_net_inflow, main_net_inflow_pct,
                    super_large_net_inflow, super_large_net_inflow_pct,
                    large_net_inflow, large_net_inflow_pct,
                    medium_net_inflow, medium_net_inflow_pct,
                    small_net_inflow, small_net_inflow_pct,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol, trade_date) DO UPDATE SET
                    name = excluded.name,
                    close_price = excluded.close_price,
                    change_pct = excluded.change_pct,
                    main_net_inflow = excluded.main_net_inflow,
                    main_net_inflow_pct = excluded.main_net_inflow_pct,
                    super_large_net_inflow = excluded.super_large_net_inflow,
                    super_large_net_inflow_pct = excluded.super_large_net_inflow_pct,
                    large_net_inflow = excluded.large_net_inflow,
                    large_net_inflow_pct = excluded.large_net_inflow_pct,
                    medium_net_inflow = excluded.medium_net_inflow,
                    medium_net_inflow_pct = excluded.medium_net_inflow_pct,
                    small_net_inflow = excluded.small_net_inflow,
                    small_net_inflow_pct = excluded.small_net_inflow_pct,
                    updated_at = excluded.updated_at
            """, (
                item.get('symbol'),
                item.get('name'),
                item.get('trade_date'),
                item.get('close_price'),
                item.get('change_pct'),
                item.get('main_net_inflow'),
                item.get('main_net_inflow_pct'),
                item.get('super_large_net_inflow'),
                item.get('super_large_net_inflow_pct'),
                item.get('large_net_inflow'),
                item.get('large_net_inflow_pct'),
                item.get('medium_net_inflow'),
                item.get('medium_net_inflow_pct'),
                item.get('small_net_inflow'),
                item.get('small_net_inflow_pct'),
                datetime.now().isoformat()
            ))


def upsert_margin_trading(data: List[Dict[str, Any]]):
    """批量更新/插入融资融券数据"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            cursor.execute("""
                INSERT INTO margin_trading (
                    symbol, name, trade_date,
                    margin_balance, margin_buy, margin_repay, margin_net_buy,
                    short_balance, short_sell_volume, short_repay_volume, short_net_volume,
                    margin_short_balance, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol, trade_date) DO UPDATE SET
                    name = excluded.name,
                    margin_balance = excluded.margin_balance,
                    margin_buy = excluded.margin_buy,
                    margin_repay = excluded.margin_repay,
                    margin_net_buy = excluded.margin_net_buy,
                    short_balance = excluded.short_balance,
                    short_sell_volume = excluded.short_sell_volume,
                    short_repay_volume = excluded.short_repay_volume,
                    short_net_volume = excluded.short_net_volume,
                    margin_short_balance = excluded.margin_short_balance,
                    updated_at = excluded.updated_at
            """, (
                item.get('symbol'),
                item.get('name'),
                item.get('trade_date'),
                item.get('margin_balance'),
                item.get('margin_buy'),
                item.get('margin_repay'),
                item.get('margin_net_buy'),
                item.get('short_balance'),
                item.get('short_sell_volume'),
                item.get('short_repay_volume'),
                item.get('short_net_volume'),
                item.get('margin_short_balance'),
                datetime.now().isoformat()
            ))


def upsert_earnings_calendar(data: List[Dict[str, Any]]):
    """批量更新/插入财报日历"""
    if not data:
        return

    with get_db() as conn:
        cursor = conn.cursor()
        for item in data:
            cursor.execute("""
                INSERT INTO earnings_calendar (
                    symbol, name, report_date, actual_date, report_type, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol, report_date, report_type) DO UPDATE SET
                    name = excluded.name,
                    actual_date = excluded.actual_date,
                    updated_at = excluded.updated_at
            """, (
                item.get('symbol'),
                item.get('name'),
                item.get('report_date'),
                item.get('actual_date'),
                item.get('report_type'),
                datetime.now().isoformat()
            ))


# ==================== 查询函数 ====================

def get_stock_realtime(symbol: Optional[str] = None) -> List[Dict]:
    """查询个股实时行情"""
    with get_db() as conn:
        cursor = conn.cursor()
        if symbol:
            cursor.execute("SELECT * FROM stock_realtime WHERE symbol = ?", (symbol,))
        else:
            cursor.execute("SELECT * FROM stock_realtime ORDER BY symbol")
        return [dict(row) for row in cursor.fetchall()]


def get_stock_daily(symbol: str, limit: int = 30) -> List[Dict]:
    """查询个股日K线"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM stock_daily
            WHERE symbol = ?
            ORDER BY trade_date DESC
            LIMIT ?
        """, (symbol, limit))
        return [dict(row) for row in cursor.fetchall()]


def get_index_realtime(symbol: Optional[str] = None) -> List[Dict]:
    """查询指数实时行情"""
    with get_db() as conn:
        cursor = conn.cursor()
        if symbol:
            cursor.execute("SELECT * FROM index_realtime WHERE symbol = ?", (symbol,))
        else:
            cursor.execute("SELECT * FROM index_realtime ORDER BY symbol")
        return [dict(row) for row in cursor.fetchall()]


def get_stock_news(symbol: Optional[str] = None, limit: int = 20) -> List[Dict]:
    """查询个股新闻"""
    with get_db() as conn:
        cursor = conn.cursor()
        if symbol:
            cursor.execute("""
                SELECT * FROM stock_news
                WHERE symbol = ?
                ORDER BY publish_time DESC
                LIMIT ?
            """, (symbol, limit))
        else:
            cursor.execute("""
                SELECT * FROM stock_news
                ORDER BY publish_time DESC
                LIMIT ?
            """, (limit,))
        return [dict(row) for row in cursor.fetchall()]


def get_policy_news(limit: int = 20) -> List[Dict]:
    """查询政策新闻"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM policy_news
            ORDER BY publish_time DESC
            LIMIT ?
        """, (limit,))
        return [dict(row) for row in cursor.fetchall()]


def get_fund_flow(symbol: str, limit: int = 10) -> List[Dict]:
    """查询资金流向"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM fund_flow
            WHERE symbol = ?
            ORDER BY trade_date DESC
            LIMIT ?
        """, (symbol, limit))
        return [dict(row) for row in cursor.fetchall()]


def get_margin_trading(symbol: str, limit: int = 10) -> List[Dict]:
    """查询融资融券"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM margin_trading
            WHERE symbol = ?
            ORDER BY trade_date DESC
            LIMIT ?
        """, (symbol, limit))
        return [dict(row) for row in cursor.fetchall()]


def get_earnings_calendar(symbol: Optional[str] = None) -> List[Dict]:
    """查询财报日历"""
    with get_db() as conn:
        cursor = conn.cursor()
        if symbol:
            cursor.execute("""
                SELECT * FROM earnings_calendar
                WHERE symbol = ?
                ORDER BY report_date DESC
            """, (symbol,))
        else:
            cursor.execute("""
                SELECT * FROM earnings_calendar
                ORDER BY report_date DESC
                LIMIT 100
            """)
        return [dict(row) for row in cursor.fetchall()]


if __name__ == "__main__":
    init_database()
    print(f"数据库已创建: {DATABASE_PATH}")
