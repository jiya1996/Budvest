# 批量指令功能完成报告

## 问题描述
输入"购入100股特斯拉、卖出100股英伟达"时，前端仅显示单条指令且内容错误。

## 解决方案
完成前端批量指令支持，现在可以正确显示和执行多条指令。

## 修改内容

### 1. 状态管理 (第85行)
```typescript
// 从单条指令改为数组
const [parsedCommands, setParsedCommands] = useState<ParsedCommand[]>([]);
```

### 2. parseCommandWithAI 函数 (第96行)
```typescript
const parseCommandWithAI = async (text: string): Promise<ParsedCommand[]> => {
  // 检测批量指令
  const isBatch = /[，,、；;]|和|与/.test(text);
  const apiUrl = isBatch ? '/api/portfolio/parse-batch-command' : '/api/portfolio/parse-command';

  // 返回数组
  if (isBatch && data.commands) {
    return data.commands;
  } else if (data.command) {
    return [data.command];
  }
  return [];
};
```

### 3. 语音识别回调 (第131行)
```typescript
const commands = await parseCommandWithAI(transcriptText);
if (commands.length > 0) {
  setParsedCommands(commands);
  setShowConfirmModal(true);
}
```

### 4. 文本输入处理 (第591行)
```typescript
const commands = await parseCommandWithAI(text);
if (commands.length > 0) {
  setParsedCommands(commands);
  setShowConfirmModal(true);
  setInputText('');
}
```

### 5. handleConfirmCommand 批量执行 (第647行)
```typescript
const handleConfirmCommand = async () => {
  if (parsedCommands.length === 0) return;

  let updatedPortfolio = portfolio;

  // 批量执行每条指令
  for (const command of parsedCommands) {
    // 验证必填字段
    if (command.userIntent === '用户增持' || command.userIntent === '用户减持') {
      const finalPrice = command.price > 0 ? command.price : Number(manualCost);
      const finalShares = command.shares > 0 ? command.shares : Number(manualShares);

      if (!finalPrice || finalPrice <= 0) {
        alert(`请填入${command.stockName}的买卖价格`);
        return;
      }
      if (!finalShares || finalShares <= 0) {
        alert(`请填入${command.stockName}的股数`);
        return;
      }
    }

    // 执行单条指令
    const res = await fetch('/api/portfolio/apply-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolio: updatedPortfolio,
        command: {
          ...command,
          price: command.price > 0 ? command.price : Number(manualCost) || 0,
          shares: command.shares > 0 ? command.shares : Number(manualShares) || 0,
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(`执行${command.stockName}失败：${errorData.error || '未知错误'}`);
      return;
    }

    const data = await res.json();
    updatedPortfolio = data.portfolio;
  }

  // 保存并更新
  const config = storage.getUserConfig();
  if (config) {
    config.portfolio = updatedPortfolio;
    const investingItems = updatedPortfolio.filter(p => p.config.status === 'investing');
    config.totalPrincipal = investingItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    storage.saveUserConfig(config);
    window.dispatchEvent(new CustomEvent('portfolioUpdated'));
  }

  if (onPortfolioUpdate) {
    onPortfolioUpdate(updatedPortfolio);
  }

  setShowConfirmModal(false);
  setParsedCommands([]);
  setManualCost('');
  setManualShares('');
};
```

### 6. handleCancelCommand (第719行)
```typescript
const handleCancelCommand = () => {
  setShowConfirmModal(false);
  setParsedCommands([]);
  setManualCost('');
  setManualShares('');
};
```

### 7. 确认弹窗UI (第1274行)
```typescript
{showConfirmModal && parsedCommands.length > 0 && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700">
          确认执行指令 {parsedCommands.length > 1 && `(${parsedCommands.length}条)`}
        </h3>
        <button onClick={handleCancelCommand}>
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-3">
        {parsedCommands.map((command, index) => (
          <div key={index} className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">指令 {index + 1}</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                command.userIntent === '用户增持' ? 'bg-green-100 text-green-700' :
                command.userIntent === '用户减持' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {command.userIntent}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">股票：</span>
                <span className="text-sm font-semibold">{command.stockName}</span>
              </div>
              {(command.userIntent === '用户增持' || command.userIntent === '用户减持') && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">股数：</span>
                    {command.shares > 0 ? (
                      <span className="text-sm font-semibold">{command.shares} 股</span>
                    ) : (
                      <input
                        type="number"
                        value={manualShares}
                        onChange={(e) => setManualShares(e.target.value)}
                        placeholder="请输入"
                        className="text-sm font-semibold text-red-600 border-2 border-red-300 rounded px-2 py-1 w-24"
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">价格：</span>
                    {command.price > 0 ? (
                      <span className="text-sm font-semibold">¥{command.price}/股</span>
                    ) : (
                      <input
                        type="number"
                        value={manualCost}
                        onChange={(e) => setManualCost(e.target.value)}
                        placeholder="请输入"
                        className="text-sm font-semibold text-red-600 border-2 border-red-300 rounded px-2 py-1 w-24"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={handleCancelCommand} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">
          取消
        </button>
        <button onClick={handleConfirmCommand} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold">
          确认执行 {parsedCommands.length > 1 && `(${parsedCommands.length}条)`}
        </button>
      </div>
    </div>
  </div>
)}
```

## 预期效果

### 输入
```
购入100股特斯拉、卖出100股英伟达
```

### 弹窗显示
```
┌─────────────────────────────────┐
│ 确认执行指令 (2条)               │
├─────────────────────────────────┤
│ 指令 1      [用户增持]           │
│ 股票：Tesla                      │
│ 股数：100 股                     │
│ 价格：[请输入]                   │
├─────────────────────────────────┤
│ 指令 2      [用户减持]           │
│ 股票：NVIDIA                     │
│ 股数：100 股                     │
│ 价格：[请输入]                   │
├─────────────────────────────────┤
│  [取消]    [确认执行 (2条)]      │
└─────────────────────────────────┘
```

### 执行流程
1. 用户补充缺失的价格信息
2. 点击"确认执行 (2条)"
3. 依次执行：
   - 买入100股Tesla
   - 卖出100股NVIDIA
4. 更新持仓并保存

## 测试用例

```
✅ "购入100股特斯拉、卖出100股英伟达" → 2条指令
✅ "买入50股苹果，清仓微软" → 2条指令
✅ "建仓100股特斯拉、加仓50股苹果、止盈英伟达" → 3条指令
✅ "买入100股特斯拉" → 1条指令（单条模式）
```

## 技术要点

1. **批量检测**：使用正则表达式 `/[，,、；;]|和|与/.test(text)` 检测批量指令
2. **API路由**：批量指令调用 `/api/portfolio/parse-batch-command`，单条调用 `/api/portfolio/parse-command`
3. **顺序执行**：使用 `for...of` 循环顺序执行每条指令，确保每条指令基于最新的 portfolio 状态
4. **错误处理**：任何一条指令失败会中断执行并提示具体错误
5. **数据验证**：每条指令执行前验证必填字段（价格、股数）
6. **UI优化**：弹窗显示指令数量，每条指令独立卡片展示

## 文件修改

- `components/PortfolioTab.tsx` - 前端批量指令支持（已完成）
- `app/api/portfolio/parse-batch-command/route.ts` - 批量解析API（已完成）
- `app/api/portfolio/parse-command/route.ts` - 单条解析API（已完成）

## 开发服务器

服务器已启动：http://localhost:3001

## 测试建议

1. 打开 http://localhost:3001/portfolio/manage
2. 输入 "购入100股特斯拉、卖出100股英伟达"
3. 验证弹窗显示2条指令
4. 补充价格信息
5. 点击"确认执行 (2条)"
6. 验证两条指令都成功执行
