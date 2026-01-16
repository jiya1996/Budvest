#!/usr/bin/env python3
"""
数据采集服务启动入口
"""
import sys
import signal
import time
from datetime import datetime

from database import init_database
from scheduler import create_scheduler, run_initial_collection


def signal_handler(signum, frame):
    """处理退出信号"""
    print(f"\n[{datetime.now()}] 收到退出信号，正在关闭...")
    sys.exit(0)


def main():
    """主函数"""
    print("=" * 60)
    print("     伴投 Investbuddy - 数据采集服务")
    print("=" * 60)
    print(f"[{datetime.now()}] 服务启动中...")

    # 注册信号处理
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # 初始化数据库
    print("[1/3] 初始化数据库...")
    init_database()

    # 执行初始数据采集
    print("[2/3] 执行初始数据采集...")
    run_initial_collection()

    # 创建并启动调度器
    print("[3/3] 启动定时任务调度器...")
    scheduler = create_scheduler()
    scheduler.start()

    print()
    print("=" * 60)
    print("  数据采集服务已启动！")
    print("  按 Ctrl+C 退出")
    print("=" * 60)
    print()

    # 打印任务列表
    print("已注册的定时任务:")
    print("-" * 40)
    for job in scheduler.get_jobs():
        print(f"  - {job.name}: {job.trigger}")
    print("-" * 40)
    print()

    # 保持运行
    try:
        while True:
            time.sleep(60)
            # 每分钟打印心跳
            print(f"[{datetime.now()}] 服务运行中...")
    except (KeyboardInterrupt, SystemExit):
        print(f"\n[{datetime.now()}] 正在关闭调度器...")
        scheduler.shutdown()
        print("服务已停止")


if __name__ == "__main__":
    main()
