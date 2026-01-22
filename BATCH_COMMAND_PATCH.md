// 批量指令支持补丁 - 添加到 PortfolioTab.tsx

// 1. 修改状态声明（第85行附近）
// 将：const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
// 改为：const [parsedCommands, setParsedCommands] = useState<ParsedCommand[]>([]);

// 2. 修改 parseCommandWithAI 函数（第96行附近）
const parseCommandWithAI = async (text: string): Promise<ParsedCommand[]> => {
  try {
    const response = await fetch('/api/portfolio/parse-batch-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    return data.commands || [];
  } catch (error) {
    console.error('Error parsing command:', error);
    return [];
  }
};

// 3. 修改语音识别回调（第145行附近）
// 将：
// const command = await parseCommandWithAI(transcriptText);
// if (command) {
//   setParsedCommand(command);
//   setShowConfirmModal(true);
// }
// 改为：
const commands = await parseCommandWithAI(transcriptText);
if (commands.length > 0) {
  setParsedCommands(commands);
  setShowConfirmModal(true);
}

// 4. 修改文本输入处理（第600行附近的 handleTextSubmit）
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
    alert('无法识别指令，请尝试：\"买入100股特斯拉\" 或 \"卖出特斯拉，买入苹果\"');
  }
};

// 5. 修改 handleConfirmCommand 以支持批量执行
const handleConfirmCommand = async () => {
  if (parsedCommands.length === 0) return;

  try {
    let updatedPortfolio = portfolio;

    for (const command of parsedCommands) {
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
        alert(`执行失败：${errorData.error || '未知错误'}`);
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
  } catch (error) {
    console.error('Error executing commands:', error);
    alert('执行指令时发生错误');
  }
};

// 6. 修改确认弹窗 UI（第1226行附近）
// 将单个 parsedCommand 显示改为循环显示 parsedCommands 数组
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

      <div className="space-y-4">
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
              {command.shares > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">股数：</span>
                  <span className="text-sm font-semibold">{command.shares} 股</span>
                </div>
              )}
              {command.price > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">价格：</span>
                  <span className="text-sm font-semibold">¥{command.price}/股</span>
                </div>
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
          确认执行
        </button>
      </div>
    </div>
  </div>
)}

// 7. 添加专业词汇支持到 parse-batch-command API
// 在 systemPrompt 中添加：
// 专业词汇映射：
// - 清仓/平仓 = 卖出全部持仓
// - 加仓 = 买入增持
// - 减仓 = 卖出减持
// - 建仓 = 首次买入
// - 止损 = 卖出
// - 止盈 = 卖出
