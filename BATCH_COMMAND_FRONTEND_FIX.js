// PortfolioTab.tsx 批量指令修改方案

// ============ 第1步：修改 parseCommandWithAI 函数（第96行） ============
const parseCommandWithAI = async (text: string): Promise<ParsedCommand[]> => {
  try {
    // 检测是否为批量指令
    const isBatch = /[，,、；;]|和|与/.test(text);
    const apiUrl = isBatch ? '/api/portfolio/parse-batch-command' : '/api/portfolio/parse-command';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    // 批量API返回commands数组，单条API返回command对象
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

// ============ 第2步：修改状态声明（第85行） ============
// 将：const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
// 改为：
const [parsedCommands, setParsedCommands] = useState<ParsedCommand[]>([]);

// ============ 第3步：修改语音识别回调（第145行） ============
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

// ============ 第4步：修改文本输入处理（第600行） ============
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

// ============ 第5步：修改 handleConfirmCommand（第653行） ============
const handleConfirmCommand = async () => {
  if (parsedCommands.length === 0) return;

  try {
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
  } catch (error) {
    console.error('Error executing commands:', error);
    alert('执行指令时发生错误');
  }
};

// ============ 第6步：修改确认弹窗UI（第1226行） ============
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
                        min="1"
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
                        min="0.01"
                        step="0.01"
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

// ============ 第7步：修改 handleCancelCommand（第730行） ============
const handleCancelCommand = () => {
  setShowConfirmModal(false);
  setParsedCommands([]);
  setManualCost('');
  setManualShares('');
};
