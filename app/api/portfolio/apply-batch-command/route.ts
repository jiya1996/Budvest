import { NextRequest, NextResponse } from 'next/server';
import { PortfolioItem } from '@/lib/types';

interface ParsedCommand {
  stockName: string;
  userIntent:
    | '用户增持'
    | '用户减持'
    | '用户观望'
    | '用户删除'
    | '用户删除持有'
    | '用户删除观望'
    | '用户全部删除'
    | '用户更新';
  cost: number;
  time: string;
  price: number;
  shares: number;
  holdingDays: number;
  stockNames?: string[];
}

interface BatchResult {
  success: boolean;
  command: ParsedCommand;
  error?: string;
  message?: string;
}

/**
 * 批量应用投资组合命令
 *
 * 接收多个命令并按顺序执行，返回每个命令的执行结果
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const portfolio: PortfolioItem[] = body.portfolio || [];
    const commands: ParsedCommand[] = body.commands || [];

    if (!Array.isArray(commands) || commands.length === 0) {
      return NextResponse.json(
        {
          error: 'commands array is required',
          message: '请提供至少一个命令'
        },
        { status: 400 }
      );
    }

    // 验证命令数量限制（防止滥用）
    if (commands.length > 50) {
      return NextResponse.json(
        {
          error: 'Too many commands',
          message: '单次最多支持50个命令'
        },
        { status: 400 }
      );
    }

    let currentPortfolio = [...portfolio];
    const results: BatchResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // 按顺序执行每个命令
    for (const command of commands) {
      try {
        // 调用单个命令的apply接口
        const response = await fetch(
          `${req.nextUrl.origin}/api/portfolio/apply-command`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              portfolio: currentPortfolio,
              command,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          currentPortfolio = data.portfolio || currentPortfolio;

          results.push({
            success: true,
            command,
            message: `成功执行：${command.userIntent} ${command.stockName}`,
          });
          successCount++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          results.push({
            success: false,
            command,
            error: errorData.error || 'Unknown error',
            message: `执行失败：${command.stockName} - ${errorData.error || '未知错误'}`,
          });
          failureCount++;
        }
      } catch (error) {
        results.push({
          success: false,
          command,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `执行异常：${command.stockName}`,
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      portfolio: currentPortfolio,
      results,
      summary: {
        total: commands.length,
        success: successCount,
        failure: failureCount,
      },
      message: `批量执行完成：成功 ${successCount} 个，失败 ${failureCount} 个`,
    });
  } catch (error) {
    console.error('apply-batch-command error:', error);
    return NextResponse.json(
      {
        error: 'Failed to apply batch commands',
        message: '批量执行失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
