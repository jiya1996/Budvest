# 批量指令前端修复指南

## 问题描述
输入"购入100股特斯拉、卖出100股英伟达"时：
- ❌ 只显示"用户减持100股特斯拉"（错误）
- ✅ 应显示2条指令：list1用户增持100股特斯拉，list2用户减持100股英伟达

## 解决方案

### 核心修改
将前端从单条指令模式改为批量指令模式，支持显示和执行多条指令。

### 修改步骤

#### 1. 修改状态声明（第85行）
```typescript
// 旧代码
const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);

// 新代码
const [parsedCommands, setParsedCommands] = useState<ParsedCommand[]>([]);
```

#### 2. 修改 parseCommandWithAI 函数（第96行）
```typescript
const parseCommandWithAI = async (text: string): Promise<ParsedCommand[]> => {
  try {
    const isBatch = /[，,、；;]|和|与/.test(text);
    const apiUrl = isBatch ? '/api/portfolio/parse-batch-command' : '/api/portfolio/parse-command';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (isBatch && data.commands) {
      return data.commands;
    } else if (data.command) {
      return [data.command];
    }

    return [];
  } catch (error) {
    console.error('Error parsing command:', error);
    return [];
  }
};
```

#### 3. 修改语音识别回调（第145行）
```typescript
// 旧代码
const command = await parseCommandWithAI(transcriptText);
if (command) {
  setParsedCommand(command);
  setShowConfirmModal(true);
}

// 新代码
const commands = await parseCommandWithAI(transcriptText);
if (commands.length > 0) {
  setParsedCommands(commands);
  setShowConfirmModal(true);
}
```

#### 4. 修改文本输入处理（第600行）
```typescript
const handleTextSubmit = async () => {
  if (!inputText.trim()) return;

  const commands = await parseCommandWithAI(inputText);
  if (commands.length > 0) {
    setParsedCommands(commands);
    setManualCost('');
    setManualShares('');
    setShowConfirmModal(true);
    setInputText('');
  } else {
    alert('无法识别指令');
  }
};
```

#### 5. 修改 handleConfirmCommand（第653行）
```typescript
const handleConfirmCommand = async () => {
  if (parsedCommands.length === 0) return;

  try {
    let updatedPortfolio = portfolio;

    for (const command of parsedCommands) {
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
        alert(`执行${command.stockName}失败：${errorData.error}`);
        return;
      }

      const data = await res.json();
      updatedPortfolio = data.portfolio;
    }

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
  } catch (error) {
    console.error('Error executing commands:', error);
    alert('执行指令时发生错误');
  }
};
```

#### 6. 修改确认弹窗UI（第1226行）
```typescript
{showConfirmModal && parsedCommands.length > 0 && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCancelCommand}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700">
          确认执行指令 {parsedCommands.length > 1 && `(${parsedCommands.length}条)`}
        </h3>
        <button onClick={handleCancelCommand} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
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

#### 7. 修改 handleCancelCommand（第730行）
```typescript
const handleCancelCommand = () => {
  setShowConfirmModal(false);
  setParsedCommands([]);
  setManualCost('');
  setManualShares('');
};
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

## 注意事项

1. **不完整数据处理**：如果指令中缺少价格或股数，弹窗会显示输入框让用户补充
2. **批量执行**：按顺序执行每条指令，任何一条失败会中断并提示
3. **状态更新**：每条指令执行后更新portfolio，确保下一条指令基于最新状态
4. **错误处理**：显示具体是哪只股票执行失败

## 文件位置

- 前端修改：`components/PortfolioTab.tsx`
- 批量API：`app/api/portfolio/parse-batch-command/route.ts`（已完成）
- 单条API：`app/api/portfolio/parse-command/route.ts`（已完成）
