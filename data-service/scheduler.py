"""
定时任务调度器
使用 APScheduler 管理数据采集任务
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, time
import pytz

from config import CONFIG
from collectors import stock_realtime, stock_daily, index_data
from collectors import stock_news, policy_news, earnings
from collectors import fund_flow, margin


# 中国时区
CHINA_TZ = pytz.timezone('Asia/Shanghai')


def is_trading_time() -> bool:
    """判断当前是否在交易时间"""
    now = datetime.now(CHINA_TZ)

    # 周末不交易
    if now.weekday() >= 5:
        return False

    current_time = now.time()
    trading_hours = CONFIG['trading_hours']

    # 上午交易时间
    morning_start = time(*map(int, trading_hours['morning_start'].split(':')))
    morning_end = time(*map(int, trading_hours['morning_end'].split(':')))

    # 下午交易时间
    afternoon_start = time(*map(int, trading_hours['afternoon_start'].split(':')))
    afternoon_end = time(*map(int, trading_hours['afternoon_end'].split(':')))

    return (morning_start <= current_time <= morning_end or
            afternoon_start <= current_time <= afternoon_end)


def job_realtime_quotes():
    """实时行情采集任务（交易时间执行）"""
    if not is_trading_time():
        print(f"[{datetime.now()}] 非交易时间，跳过实时行情采集")
        return

    print(f"[{datetime.now()}] 执行实时行情采集...")
    try:
        # 获取用户持仓股票（这里使用默认列表，实际应从数据库读取）
        symbols = CONFIG['default_stocks']
        stock_realtime.collect_and_save(symbols)
    except Exception as e:
        print(f"实时行情采集失败: {e}")


def job_index_quotes():
    """指数行情采集任务（交易时间执行）"""
    if not is_trading_time():
        print(f"[{datetime.now()}] 非交易时间，跳过指数行情采集")
        return

    print(f"[{datetime.now()}] 执行指数行情采集...")
    try:
        index_data.collect_and_save()
    except Exception as e:
        print(f"指数行情采集失败: {e}")


def job_fund_flow():
    """资金流向采集任务（交易时间执行）"""
    if not is_trading_time():
        return

    print(f"[{datetime.now()}] 执行资金流向采集...")
    try:
        symbols = CONFIG['default_stocks']
        fund_flow.collect_and_save(symbols)
    except Exception as e:
        print(f"资金流向采集失败: {e}")


def job_daily_kline():
    """日K线采集任务（收盘后执行）"""
    print(f"[{datetime.now()}] 执行日K线采集...")
    try:
        symbols = CONFIG['default_stocks']
        stock_daily.collect_and_save(symbols, days=5)  # 获取最近5天
    except Exception as e:
        print(f"日K线采集失败: {e}")


def job_stock_news():
    """个股新闻采集任务"""
    print(f"[{datetime.now()}] 执行个股新闻采集...")
    try:
        symbols = CONFIG['default_stocks']
        stock_news.collect_and_save(symbols)
    except Exception as e:
        print(f"个股新闻采集失败: {e}")


def job_policy_news():
    """政策新闻采集任务"""
    print(f"[{datetime.now()}] 执行政策新闻采集...")
    try:
        policy_news.collect_and_save(days=1)
    except Exception as e:
        print(f"政策新闻采集失败: {e}")


def job_earnings():
    """财报日历采集任务"""
    print(f"[{datetime.now()}] 执行财报日历采集...")
    try:
        earnings.collect_and_save()
    except Exception as e:
        print(f"财报日历采集失败: {e}")


def job_margin():
    """融资融券采集任务"""
    print(f"[{datetime.now()}] 执行融资融券采集...")
    try:
        symbols = CONFIG['default_stocks']
        margin.collect_and_save(symbols)
    except Exception as e:
        print(f"融资融券采集失败: {e}")


def create_scheduler() -> BackgroundScheduler:
    """创建并配置调度器"""
    scheduler = BackgroundScheduler(timezone=CHINA_TZ)

    # ========== 实时数据（交易时间内） ==========

    # 实时行情 - 每5分钟
    scheduler.add_job(
        job_realtime_quotes,
        IntervalTrigger(minutes=5),
        id='realtime_quotes',
        name='实时行情采集',
        replace_existing=True
    )

    # 指数行情 - 每5分钟
    scheduler.add_job(
        job_index_quotes,
        IntervalTrigger(minutes=5),
        id='index_quotes',
        name='指数行情采集',
        replace_existing=True
    )

    # 资金流向 - 每10分钟
    scheduler.add_job(
        job_fund_flow,
        IntervalTrigger(minutes=10),
        id='fund_flow',
        name='资金流向采集',
        replace_existing=True
    )

    # ========== 每日数据（收盘后） ==========

    # 日K线 - 每天16:30
    scheduler.add_job(
        job_daily_kline,
        CronTrigger(
            hour=CONFIG['daily_update_hour'],
            minute=CONFIG['daily_update_minute']
        ),
        id='daily_kline',
        name='日K线采集',
        replace_existing=True
    )

    # 融资融券 - 每天17:00
    scheduler.add_job(
        job_margin,
        CronTrigger(hour=17, minute=0),
        id='margin',
        name='融资融券采集',
        replace_existing=True
    )

    # ========== 新闻数据 ==========

    # 个股新闻 - 每小时
    scheduler.add_job(
        job_stock_news,
        IntervalTrigger(hours=1),
        id='stock_news',
        name='个股新闻采集',
        replace_existing=True
    )

    # 政策新闻 - 每2小时
    scheduler.add_job(
        job_policy_news,
        IntervalTrigger(hours=2),
        id='policy_news',
        name='政策新闻采集',
        replace_existing=True
    )

    # ========== 低频数据 ==========

    # 财报日历 - 每天9:00
    scheduler.add_job(
        job_earnings,
        CronTrigger(hour=9, minute=0),
        id='earnings',
        name='财报日历采集',
        replace_existing=True
    )

    return scheduler


def run_initial_collection():
    """启动时执行一次初始采集"""
    print("=" * 50)
    print("执行初始数据采集...")
    print("=" * 50)

    # 实时行情
    job_realtime_quotes()

    # 指数行情
    job_index_quotes()

    # 日K线
    job_daily_kline()

    # 新闻
    job_stock_news()
    job_policy_news()

    # 资金流向
    job_fund_flow()

    print("=" * 50)
    print("初始数据采集完成")
    print("=" * 50)


if __name__ == "__main__":
    from database import init_database
    init_database()

    # 测试初始采集
    run_initial_collection()
