'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { PortfolioItem } from '@/lib/types';
import { TrendingUp, TrendingDown, Target, Eye, Wallet, Plus, X, Send, Check } from 'lucide-react';

import { storage } from '@/lib/storage';
import { STOCK_DATABASE } from '@/lib/data';
import { getCurrencySymbol, formatPrice } from '@/lib/currency';

interface PortfolioTabProps {
  portfolio: PortfolioItem[];
  onPortfolioUpdate?: (portfolio: PortfolioItem[]) => void;
}

interface PriceData {
  price: number | null;
  dayChg: number | null;
  loading: boolean;
  error: boolean;
}

interface ParsedCommand {
  stockName: string;
  userIntent: '用户增持' | '用户减持' | '用户观望' | '用户删除' | '用户删除持有' | '用户删除观望' | '用户全部删除' | '用户更新' | '未知';
  cost: number;
  time: string;
  price: number;
  shares: number;
  holdingDays: number;
  stockNames?: string[]; // 多个股票名称（用于批量删除）
}

// 语音识别类型声明
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare var SpeechRecognition: {
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  new (): SpeechRecognition;
};

// 计算持有天数（从首次买入时间到今天，至少为1）
function calculateHoldingDays(item: PortfolioItem): number {
  if (item.firstBuyTimestamp) {
    const firstBuyDate = new Date(item.firstBuyTimestamp);
    const today = new Date();
    // 设置为当天的开始时间，避免时间差影响天数计算
    today.setHours(0, 0, 0, 0);
    firstBuyDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - firstBuyDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // 至少显示1天
    return Math.max(1, diffDays);
  }
  // 如果没有首次买入时间，返回1（兼容旧数据）
  return 1;
}

export default function PortfolioTab({ portfolio, onPortfolioUpdate }: PortfolioTabProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [phoneFrameContainer, setPhoneFrameContainer] = useState<HTMLElement | null>(null);
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [exchangeRates, setExchangeRates] = useState<{ USDCNY: number; HKDCNY: number; CNYCNY: number } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStock, setEditingStock] = useState<PortfolioItem | null>(null);
  const [shares, setShares] = useState('');
  const [costPrice, setCostPrice] = useState('');
  
  // 查找手机黑框容器
  useEffect(() => {
    if (containerRef.current) {
      // 向上查找父元素，找到手机黑框容器（有 max-w-md 和 relative class 的容器）
      let parent = containerRef.current.parentElement;
      while (parent) {
        if (parent.classList.contains('max-w-md') && 
            (parent.classList.contains('relative') || window.getComputedStyle(parent).position === 'relative')) {
          setPhoneFrameContainer(parent);
          break;
        }
        parent = parent.parentElement;
      }
    }
  }, []);
  
  // 语音输入相关状态

  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const [parsedCommands, setParsedCommands] = useState<ParsedCommand[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [inputText, setInputText] = useState('');
  // 用于手动补充缺失字段（单个命令）
  const [manualCost, setManualCost] = useState('');
  const [manualShares, setManualShares] = useState('');
  // 用于批量命令的手动输入（每个命令一个对象）
  const [manualInputs, setManualInputs] = useState<Record<number, { cost: string; shares: string }>>({});
  
  const investingItems = portfolio.filter((item) => item.config.status === 'investing');
  const watchingItems = portfolio.filter((item) => item.config.status === 'watching');

  // 检测是否为批量指令
  const isBatchCommand = (text: string): boolean => {
    return /[，,、；;]|和|与/.test(text);
  };

  // 使用AI解析指令（单个）
  const parseCommandWithAI = async (text: string): Promise<any> => {
    try {
      const response = await fetch('/api/portfolio/parse-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          portfolio: portfolio.map(p => ({ symbol: p.symbol, name: p.name })),
        }),
      });

      const data = await response.json();
      
      // 即使响应状态不是 200，也尝试使用返回的 command（可能是后备解析的结果）
      if (data.command) {
        return data.command;
      }
      
      // 如果响应失败且没有 command，抛出错误以触发后备解析
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse command');
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing command with AI:', error);
      // 如果AI解析失败，使用后备解析
      return parseVoiceCommand(text);
    }
  };

  // 使用AI解析批量指令
  const parseBatchCommandWithAI = async (text: string): Promise<ParsedCommand[]> => {
    try {
      const response = await fetch('/api/portfolio/parse-batch-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
        }),
      });

      const data = await response.json();
      
      if (data.commands && Array.isArray(data.commands) && data.commands.length > 0) {
        return data.commands;
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse batch command');
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing batch command with AI:', error);
      return [];
    }
  };

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'zh-CN';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      recognitionInstance.onresult = async (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        setTranscript(transcriptText);
        setInputText(transcriptText); // 将识别结果填入输入框
        setIsRecording(false);
        
        // 检测是否为批量指令
        const isBatch = isBatchCommand(transcriptText);
        
        if (isBatch) {
          // 批量指令：调用批量解析API
          const commands = await parseBatchCommandWithAI(transcriptText);
          if (commands && commands.length > 0) {
            setParsedCommands(commands);
            setParsedCommand(null);
            // 初始化每个命令的手动输入
            const inputs: Record<number, { cost: string; shares: string }> = {};
            commands.forEach((_, index) => {
              inputs[index] = { cost: '', shares: '' };
            });
            setManualInputs(inputs);
            setShowConfirmModal(true);
          }
        } else {
          // 单个指令：调用单个解析API
          const command = await parseCommandWithAI(transcriptText);
          if (command) {
            setParsedCommand(command);
            setParsedCommands([]);
            setManualInputs({});
            setShowConfirmModal(true);
          }
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取汇率
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('/api/exchange-rate');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // 使用默认汇率
        setExchangeRates({ USDCNY: 7.2, HKDCNY: 0.92, CNYCNY: 1 });
      }
    };
    fetchExchangeRates();
  }, []);

  // 获取股票价格
  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = portfolio.map((item) => item.symbol);
      
      // 初始化价格数据
      const initialPriceData: Record<string, PriceData> = {};
      symbols.forEach((symbol) => {
        initialPriceData[symbol] = {
          price: null,
          dayChg: null,
          loading: true,
          error: false,
        };
      });
      setPriceData(initialPriceData);

      // 并发获取所有股票价格
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(`/api/market/price?symbol=${symbol}`);
          if (response.ok) {
            const data = await response.json();
            return {
              symbol,
              price: data.price || null,
              dayChg: data.dayChg || null,
              error: false,
            };
          } else {
            return {
              symbol,
              price: null,
              dayChg: null,
              error: true,
            };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${symbol}:`, error);
          return {
            symbol,
            price: null,
            dayChg: null,
            error: true,
          };
        }
      });

      const results = await Promise.all(pricePromises);
      
      // 更新价格数据
      const updatedPriceData: Record<string, PriceData> = {};
      results.forEach((result) => {
        updatedPriceData[result.symbol] = {
          price: result.price,
          dayChg: result.dayChg,
          loading: false,
          error: result.error,
        };
      });
      setPriceData(updatedPriceData);
    };

    if (portfolio.length > 0) {
      fetchPrices();
    }
  }, [portfolio]);

  // 当价格数据更新时，自动重新计算盈亏
  useEffect(() => {
    if (Object.keys(priceData).length === 0) return;

    const updatedPortfolio = portfolio.map((item) => {
      // 只更新持有中的股票盈亏
      if (item.config.status !== 'investing') return item;

      const priceInfo = priceData[item.symbol];
      // 如果价格获取失败（price === null 或 error === true），使用0作为最新价
      const effectivePrice = (priceInfo?.price === null || priceInfo?.price === undefined || priceInfo?.error) 
        ? 0 
        : (priceInfo?.price || 0);

      // 计算每股持有成本
      const shares = item.config.shares || 0;
      const pricePerShare = shares > 0 && item.cost > 0 ? item.cost / shares : 0;

      // 重新计算盈亏：盈亏 = (每股持有成本 - 当前价格) × 股数
      const newProfit = pricePerShare > 0 ? (pricePerShare - effectivePrice) * shares : 0;

      // 只有当盈亏发生变化时才更新
      if (Math.abs(newProfit - (item.profit || 0)) > 0.01) {
        return {
          ...item,
          profit: newProfit,
        };
      }

      return item;
    });

    // 检查是否有变化
    const hasChanges = updatedPortfolio.some((item, index) => {
      const original = portfolio[index];
      return original && Math.abs((item.profit || 0) - (original.profit || 0)) > 0.01;
    });

    if (hasChanges) {
      // 更新 storage
      const config = storage.getUserConfig();
      if (config) {
        config.portfolio = updatedPortfolio;
        storage.saveUserConfig(config);
      }

      // 通知父组件更新
      if (onPortfolioUpdate) {
        onPortfolioUpdate(updatedPortfolio);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceData]);

  // 将金额转换为人民币
  const convertToCNY = (amount: number, symbol: string): number => {
    if (!exchangeRates) return amount; // 如果汇率未加载，返回原值
    
    const currency = getCurrencySymbol(symbol);
    if (currency === '¥') {
      return amount; // 已经是人民币
    } else if (currency === 'HK$') {
      return amount * exchangeRates.HKDCNY;
    } else if (currency === '$') {
      return amount * exchangeRates.USDCNY;
    }
    return amount;
  };

  // 总投入本金：通过【持有中】列表所有股票的成本总和（转换为人民币）
  const totalInvested = investingItems.reduce(
    (sum, item) => sum + convertToCNY(item.cost || 0, item.symbol),
    0
  );
  
  // 总盈亏：通过【持有中】列表所有股票的盈亏总和（转换为人民币）
  // 盈亏计算公式：个股盈亏 = (每股持有成本 - 当前价格) × 股数
  // 资产总盈亏 = 所有持有股票总盈亏的和
  const totalProfit = investingItems.reduce((sum, item) => {
    const shares = item.config.shares || 0;
    const pricePerShare = shares > 0 && item.cost > 0 ? item.cost / shares : 0;
    
    // 如果价格获取失败（price === null 或 error === true），使用0作为最新价
    const currentPrice = priceData[item.symbol];
    const effectivePrice = (currentPrice?.price === null || currentPrice?.price === undefined || currentPrice?.error) 
      ? 0 
      : (currentPrice?.price || 0);
    
    // 如果价格数据已更新，使用实时价格计算；否则使用存储的盈亏值
    let realTimeProfit = 0;
    if (currentPrice && currentPrice.price !== null && currentPrice.price !== undefined && !currentPrice.error) {
      realTimeProfit = pricePerShare > 0 ? (pricePerShare - effectivePrice) * shares : 0;
    } else {
      realTimeProfit = item.profit || 0;
    }
    
    // 将盈亏转换为人民币
    return sum + convertToCNY(realTimeProfit, item.symbol);
  }, 0);

  // 打开编辑弹窗
  const handleOpenEditModal = (item: PortfolioItem) => {
    setEditingStock(item);
    const currentShares = item.config.shares || 0;
    setShares(currentShares.toString());
    
    // 计算每股持有成本：
    // 1）优先使用配置中的 pricePerShare（可能来自首次流程或上次编辑）
    // 2）否则用 总成本 / 股数
    // 3）如果还是没有，尝试用 capital / shares（兼容旧数据）
    let pricePerShare = 0;
    
    // 优先使用 pricePerShare（即使为0也检查，因为可能是用户填写的有效值）
    if (item.config.pricePerShare !== undefined && item.config.pricePerShare !== null) {
      if (item.config.pricePerShare > 0) {
        pricePerShare = item.config.pricePerShare;
      }
    }
    
    // 如果没有 pricePerShare 或为0，尝试用 cost / shares 计算
    if (pricePerShare <= 0 && currentShares > 0 && item.cost > 0) {
      pricePerShare = item.cost / currentShares;
    }
    
    // 如果还是没有，尝试用 capital / shares（兼容旧数据）
    if (pricePerShare <= 0 && currentShares > 0 && item.config.capital) {
      const capitalNum = Number(item.config.capital);
      if (!isNaN(capitalNum) && capitalNum > 0) {
        pricePerShare = capitalNum / currentShares;
      }
    }
    
    // 设置输入框的值（如果是0或无效，显示空字符串）
    setCostPrice(pricePerShare > 0 ? pricePerShare.toString() : '');
    setShowEditModal(true);
  };

  // 关闭编辑弹窗
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingStock(null);
    setShares('');
    setCostPrice('');
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingStock) return;

    // 验证股数不能为0
    const newShares = Number(shares);
    if (!newShares || newShares <= 0) {
      alert('持有股数不能为0，请输入有效的股数');
      return;
    }

    // 验证每股持有成本不能为0
    const pricePerShare = Number(costPrice);
    if (!pricePerShare || pricePerShare <= 0) {
      alert('每股持有成本不能为0，请输入有效的成本');
      return;
    }

    const updatedPortfolio = portfolio.map((item) => {
      if (item.symbol === editingStock.symbol) {
        // 计算总成本：每股持有成本 × 股数
        const newTotalCost = pricePerShare * newShares;
        
        // 如果有当前价格，重新计算盈亏
        // 如果价格获取失败，使用0作为最新价
        const priceInfo = priceData[item.symbol];
        const currentPrice = (priceInfo?.price === null || priceInfo?.price === undefined || priceInfo?.error) 
          ? 0 
          : (priceInfo?.price || 0);
        let newProfit = 0;
        if (pricePerShare > 0) {
          newProfit = (pricePerShare - currentPrice) * newShares;
        }

              return {
                ...item,
                cost: newTotalCost,
                profit: newProfit,
                config: {
                  ...item.config,
                  shares: newShares,
                  capital: newTotalCost.toString(),
                  // 同步保存用户手动编辑的每股持有成本
                  pricePerShare,
                },
              };
      }
      return item;
    });

    // 更新 storage
    const config = storage.getUserConfig();
    if (config) {
      config.portfolio = updatedPortfolio;
      
      // 重新计算总投入本金（基于持有中列表所有股票的成本总和）
      const investingItems = updatedPortfolio.filter((p) => p.config.status === 'investing');
      const calculatedTotalPrincipal = investingItems.reduce(
        (sum, item) => sum + (item.cost || 0),
        0
      );
      config.totalPrincipal = calculatedTotalPrincipal;
      
      storage.saveUserConfig(config);
      
      // 触发自定义事件，通知其他组件数据已更新
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
    }

    // 通知父组件更新
    if (onPortfolioUpdate) {
      onPortfolioUpdate(updatedPortfolio);
    }

    handleCloseEditModal();
  };

  // 根据股票名称查找股票信息
  const findStockByName = (name: string): any => {
    // 尝试匹配股票代码
    const codeMatch = STOCK_DATABASE.find(s => 
      s.symbol.toLowerCase() === name.toLowerCase()
    );
    if (codeMatch) return codeMatch;
    
    // 尝试匹配股票名称（支持部分匹配）
    const nameMatch = STOCK_DATABASE.find(s => 
      s.name.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(s.name.toLowerCase())
    );
    if (nameMatch) return nameMatch;
    
    // 支持中文名称映射
    const nameMap: Record<string, string> = {
      '特斯拉': 'TSLA',
      '苹果': 'AAPL',
      '英伟达': 'NVDA',
      '微软': 'MSFT',
      '阿里巴巴': 'BABA',
      '谷歌': 'GOOG',
      '亚马逊': 'AMZN',
      'Meta': 'META',
      'meta': 'META',
      '脸书': 'META',
    };
    
    const mappedCode = nameMap[name];
    if (mappedCode) {
      return STOCK_DATABASE.find(s => s.symbol === mappedCode);
    }
    
    return null;
  };

  // 后备解析函数（转换为新格式以兼容 API 返回格式）
  const parseVoiceCommand = (text: string): ParsedCommand | null => {
    // 转换为小写以便匹配
    const lowerText = text.toLowerCase();
    
    // 匹配买入指令：例如 "我今天400元买入100股特斯拉"
    const buyPattern = /(?:我|今天|刚才)?(?:以|用)?(\d+)(?:元|块)?(?:买入|购买|买了)(\d+)?(?:股)?(.+?)(?:股票)?/;
    const buyMatch = lowerText.match(buyPattern);
    
    if (buyMatch) {
      const price = parseFloat(buyMatch[1]);
      const shares = buyMatch[2] ? parseFloat(buyMatch[2]) : 0;
      const stockName = buyMatch[3].trim();
      
      // 查找股票
      const stock = findStockByName(stockName);
      if (stock) {
        const cost = shares > 0 ? price * shares : 0;
        return {
          stockName: stock.name,
          userIntent: '用户增持',
          cost,
          time: lowerText.includes('今天') ? '今日' : lowerText.includes('昨天') ? '昨天' : '今日',
          price,
          shares,
          holdingDays: 0,
        };
      }
    }
    
    // 匹配卖出指令
    const sellPattern = /(?:我|今天|刚才)?(?:以|用)?(\d+)(?:元|块)?(?:卖出|出售|卖了)(\d+)?(?:股)?(.+?)(?:股票)?/;
    const sellMatch = lowerText.match(sellPattern);
    
    if (sellMatch) {
      const price = parseFloat(sellMatch[1]);
      const shares = sellMatch[2] ? parseFloat(sellMatch[2]) : 0;
      const stockName = sellMatch[3].trim();
      
      const stock = findStockByName(stockName);
      if (stock) {
        return {
          stockName: stock.name,
          userIntent: '用户减持',
          cost: 0,
          time: '今日',
          price,
          shares,
          holdingDays: 0,
        };
      }
    }
    
    // 匹配删除指令
    const deletePattern = /(?:删除|移除|去掉)(.+?)(?:股票)?/;
    const deleteMatch = lowerText.match(deletePattern);
    
    if (deleteMatch) {
      const stockName = deleteMatch[1].trim();
      const stock = findStockByName(stockName);
      if (stock) {
        return {
          stockName: stock.name,
          userIntent: '用户删除',
          cost: 0,
          time: '今日',
          price: 0,
          shares: 0,
          holdingDays: 0,
        };
      }
    }
    
    // 匹配观望指令
    if (lowerText.includes('观望') || lowerText.includes('自选')) {
      // 尝试提取股票名称
      const watchPattern = /(?:把|将)?(.+?)(?:加入|添加到)(?:观望|自选)/;
      const watchMatch = lowerText.match(watchPattern);
      if (watchMatch) {
        const stockName = watchMatch[1].trim();
        const stock = findStockByName(stockName);
        if (stock) {
          return {
            stockName: stock.name,
            userIntent: '用户观望',
            cost: 0,
            time: '今日',
            price: 0,
            shares: 0,
            holdingDays: 0,
          };
        }
      }
    }
    
    return null;
  };


  // 开始录音
  const handleStartRecording = () => {
    if (!recognition) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }
    
    setTranscript('');
    setParsedCommand(null);
    setParsedCommands([]);
    setManualInputs({});
    recognition.start();
    setIsRecording(true);
  };

  // 停止录音
  const handleStopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  // 处理文本输入提交
  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    
    const text = inputText.trim();
    setTranscript(text);
    
    // 检测是否为批量指令
    const isBatch = isBatchCommand(text);
    
    if (isBatch) {
      // 批量指令：调用批量解析API
      const commands = await parseBatchCommandWithAI(text);
      if (commands && commands.length > 0) {
        setParsedCommands(commands);
        setParsedCommand(null);
        // 初始化每个命令的手动输入
        const inputs: Record<number, { cost: string; shares: string }> = {};
        commands.forEach((_, index) => {
          inputs[index] = { cost: '', shares: '' };
        });
        setManualInputs(inputs);
        setShowConfirmModal(true);
        setInputText('');
      } else {
        alert('无法识别批量指令，请尝试："买入特斯拉100股、苹果50股" 或 "删除特斯拉和苹果" 这样的格式');
      }
    } else {
      // 单个指令：调用单个解析API
      const command = await parseCommandWithAI(text);
      if (command) {
        setParsedCommand(command);
        setParsedCommands([]);
        // 重置手动输入字段
        setManualCost('');
        setManualShares('');
        setManualInputs({});
        setShowConfirmModal(true);
        setInputText('');
      } else {
        alert('无法识别指令，请尝试："我今天400元买入100股特斯拉" 或 "把苹果加入观望" 这样的格式');
      }
    }
  };

  // 确认执行指令（支持单个和批量）
  const handleConfirmCommand = async () => {
    // 批量执行
    if (parsedCommands.length > 0) {
      // 验证所有命令的必填项
      const validatedCommands: ParsedCommand[] = [];
      
      for (let i = 0; i < parsedCommands.length; i++) {
        const cmd = parsedCommands[i];
        const manualInput = manualInputs[i] || { cost: '', shares: '' };
        
        // 对于增持或减持，必须包含每股成本和股数
        if (cmd.userIntent === '用户增持' || cmd.userIntent === '用户减持') {
          const finalPricePerShare = cmd.price > 0 ? cmd.price : Number(manualInput.cost);
          const finalShares = cmd.shares > 0 ? cmd.shares : Number(manualInput.shares);
          
          if (!finalPricePerShare || finalPricePerShare <= 0) {
            const stock = findStockByName(cmd.stockName);
            const currencySymbol = stock ? getCurrencySymbol(stock.symbol) : '¥';
            alert(`请填入${cmd.stockName}的买卖价格（${currencySymbol}）`);
            return;
          }
          
          if (!finalShares || finalShares <= 0) {
            alert(`请填入${cmd.stockName}的股数`);
            return;
          }
          
          // 使用手动输入的值（如果原值为空）
          const finalCost = finalPricePerShare > 0 && finalShares > 0 ? finalPricePerShare * finalShares : (cmd.cost > 0 ? cmd.cost : 0);
          
          validatedCommands.push({
            ...cmd,
            price: finalPricePerShare,
            shares: finalShares,
            cost: finalCost,
          });
        } else {
          validatedCommands.push(cmd);
        }
      }
      
      // 调用批量执行API
      try {
        const res = await fetch('/api/portfolio/apply-batch-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio,
            commands: validatedCommands,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.message || data.error || '批量执行失败，请稍后重试');
          return;
        }
        
        const data = await res.json();
        const updatedPortfolio = data.portfolio as PortfolioItem[];
        
        // 更新 storage
        const config = storage.getUserConfig();
        if (config) {
          config.portfolio = updatedPortfolio;
          config.watchlist = updatedPortfolio.map((p) => p.symbol);
          
          // 重新计算总投入本金
          const investingItems = updatedPortfolio.filter((p) => p.config.status === 'investing');
          const calculatedTotalPrincipal = investingItems.reduce(
            (sum, item) => sum + (item.cost || 0),
            0
          );
          config.totalPrincipal = calculatedTotalPrincipal;
          
          storage.saveUserConfig(config);
          window.dispatchEvent(new CustomEvent('portfolioUpdated'));
        }
        
        // 通知父组件更新
        if (onPortfolioUpdate) {
          onPortfolioUpdate(updatedPortfolio);
        }
        
        // 显示执行结果
        if (data.summary) {
          const { success, failure } = data.summary;
          if (failure > 0) {
            alert(`批量执行完成：成功 ${success} 个，失败 ${failure} 个`);
          }
        }
        
        setShowConfirmModal(false);
        setParsedCommands([]);
        setManualInputs({});
        setTranscript('');
        setInputText('');
      } catch (e) {
        console.error('apply-batch-command failed', e);
        alert('批量执行失败，请检查网络或稍后重试');
        return;
      }
      
      return;
    }
    
    // 单个执行（原有逻辑）
    if (!parsedCommand) return;
    
    // 对于增持或减持，必须包含每股成本和股数
    if (parsedCommand.userIntent === '用户增持' || parsedCommand.userIntent === '用户减持') {
      // 优先使用 price（每股成本），如果没有则使用手动输入的 manualCost
      const finalPricePerShare = parsedCommand.price > 0 ? parsedCommand.price : Number(manualCost);
      const finalShares = parsedCommand.shares > 0 ? parsedCommand.shares : Number(manualShares);
      
      if (!finalPricePerShare || finalPricePerShare <= 0) {
        const stock = findStockByName(parsedCommand.stockName);
        const currencySymbol = stock ? getCurrencySymbol(stock.symbol) : '¥';
        alert(`请填入买卖价格（${currencySymbol}）`);
        return;
      }
      
      if (!finalShares || finalShares <= 0) {
        alert('请填入股数');
        return;
      }
    }
    
    const { stockName, userIntent, cost, time, price, shares, holdingDays } = parsedCommand;
    
    // 使用手动输入的值（如果原值为空）
    // 优先使用 price（每股成本），如果没有则使用手动输入的 manualCost
    const finalPricePerShare = price > 0 ? price : Number(manualCost) || 0;
    const finalShares = shares > 0 ? shares : Number(manualShares) || 0;
    // 计算总成本：每股成本 × 股数
    const finalCost = finalPricePerShare > 0 && finalShares > 0 ? finalPricePerShare * finalShares : (cost > 0 ? cost : 0);
    
    // 根据股票名称查找股票信息
    const stock = findStockByName(stockName);
    if (!stock) {
      alert(`未找到股票：${stockName}`);
      return;
    }
    
    let updatedPortfolio: PortfolioItem[] = [];
    try {
      const res = await fetch('/api/portfolio/apply-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio,
          command: {
            ...parsedCommand,
            price: finalPricePerShare,
            shares: finalShares,
            cost: finalCost,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '指令执行失败，请稍后重试');
        return;
      }
      const data = await res.json();
      updatedPortfolio = data.portfolio as PortfolioItem[];
    } catch (e) {
      console.error('apply-command failed', e);
      alert('指令执行失败，请检查网络或稍后重试');
      return;
    }
    
    // 更新 storage
    const config = storage.getUserConfig();
    if (config) {
      config.portfolio = updatedPortfolio;
      config.watchlist = updatedPortfolio.map((p) => p.symbol);
      
      // 重新计算总投入本金（基于持有中列表所有股票的成本总和）
      const investingItems = updatedPortfolio.filter((p) => p.config.status === 'investing');
      const calculatedTotalPrincipal = investingItems.reduce(
        (sum, item) => sum + (item.cost || 0),
        0
      );
      config.totalPrincipal = calculatedTotalPrincipal;
      
      storage.saveUserConfig(config);
      
      // 触发自定义事件，通知其他组件数据已更新
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
    }
    
    // 通知父组件更新
    if (onPortfolioUpdate) {
      onPortfolioUpdate(updatedPortfolio);
    }
    
    setShowConfirmModal(false);
    setParsedCommand(null);
    setTranscript('');
    setInputText('');
    setManualCost('');
    setManualShares('');
  };

  // 取消指令
  const handleCancelCommand = () => {
    setShowConfirmModal(false);
    setParsedCommand(null);
    setParsedCommands([]);
    setTranscript('');
    setInputText('');
    setManualCost('');
    setManualShares('');
    setManualInputs({});
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #E8F0FB 0%, #F0EBF8 50%, #FBF6F0 100%)' }}
    >
      {/* 装饰性背景 */}
      <div className="absolute top-10 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-100/50 to-emerald-200/50 blur-3xl" />
      <div className="absolute bottom-60 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-blue-100/50 to-sky-200/50 blur-3xl" />

      {/* Header */}
      <div className="px-6 pt-12 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
                boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
              }}
            >
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-700">资产明细</h2>
              <p className="text-xs text-gray-400">你的投资组合与自选股</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/portfolio/manage')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 50%, #10B981 100%)',
              boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
            }}
          >
            管理
          </button>
        </div>

        {/* 汇总卡片 */}
        {portfolio.length > 0 && (
          <div
            className="grow-card-solid p-4 flex justify-between items-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            }}
          >
                  <div>
                    <div className="text-xs text-gray-400 mb-1">总投入本金</div>
                    <div className="text-xl font-bold text-gray-700 font-mono">
                      ¥{totalInvested.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="h-10 w-px bg-gray-100" />
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">总盈亏</div>
                    <div className={`text-xl font-bold font-mono ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {totalProfit >= 0 ? '+' : ''}¥{Math.abs(totalProfit).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide relative z-10">
        {portfolio.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
                boxShadow: '0 4px 20px rgba(148, 163, 184, 0.2)',
              }}
            >
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-gray-500 text-sm mb-1">暂无持仓数据</p>
            <p className="text-gray-400 text-xs">完成引导后即可查看</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 持有中 */}
            {investingItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)',
                      boxShadow: '0 2px 6px rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    <Target size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    持有中 ({investingItems.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {investingItems.map((item, index) => (
                    <div
                      key={item.symbol}
                      className="grow-card-solid p-5 animate-fade-up cursor-pointer hover:shadow-lg transition-shadow"
                      style={{ animationDelay: `${index * 80}ms` }}
                      onClick={() => handleOpenEditModal(item)}
                    >
                      {/* 头部信息 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white p-2 overflow-hidden"
                            style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.15)' }}
                          >
                            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-700 text-base">{item.symbol}</div>
                            <div className="text-xs text-gray-400">
                              {item.name} · {item.config.shares ? `${item.config.shares} 股` : ''} · 持有 {calculateHoldingDays(item)} 天
                            </div>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{
                            background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                            color: '#1D4ED8',
                          }}
                        >
                          {item.config.goal}
                        </div>
                      </div>

                      {/* 价格与盈亏 */}
                      <div
                        className="grid grid-cols-2 gap-4 p-4 rounded-2xl mb-3"
                        style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}
                      >
                    <div>
                      <div className="text-xs text-gray-400 mb-1">最新价 / 持有成本</div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-lg font-bold text-gray-700">
                          {priceData[item.symbol]?.loading ? (
                            <span className="text-gray-400">--</span>
                          ) : priceData[item.symbol]?.error || priceData[item.symbol]?.price === null || priceData[item.symbol]?.price === undefined ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            formatPrice(priceData[item.symbol]?.price, item.symbol)
                          )}
                        </span>
                        {(() => {
                          // 计算持有成本（每股持有成本）
                          // 1）优先使用配置中的 pricePerShare（首次流程/编辑）
                          // 2）否则如果有股数和成本，用 cost/股数
                          const shares = item.config.shares || 0;
                          let holdingCost = 0;
                          
                          // 优先使用 pricePerShare（即使为0也尝试，因为可能是用户填写的有效值）
                          if (item.config.pricePerShare !== undefined && item.config.pricePerShare !== null) {
                            if (item.config.pricePerShare > 0) {
                              holdingCost = item.config.pricePerShare;
                            }
                          } 
                          // 如果没有 pricePerShare 或为0，尝试用 cost / shares 计算
                          if (holdingCost <= 0 && shares > 0 && item.cost > 0) {
                            holdingCost = item.cost / shares;
                          }
                          // 如果还是没有，但至少有一个值，尝试用 capital / shares（兼容旧数据）
                          if (holdingCost <= 0 && shares > 0 && item.config.capital) {
                            const capitalNum = Number(item.config.capital);
                            if (!isNaN(capitalNum) && capitalNum > 0) {
                              holdingCost = capitalNum / shares;
                            }
                          }
                          
                          // 调试：如果仍然没有有效的持有成本，输出调试信息
                          if (holdingCost <= 0 || isNaN(holdingCost)) {
                            // 临时调试：在开发环境下输出数据
                            if (process.env.NODE_ENV === 'development') {
                              console.log('持有成本计算失败:', {
                                symbol: item.symbol,
                                pricePerShare: item.config.pricePerShare,
                                shares: shares,
                                cost: item.cost,
                                capital: item.config.capital,
                              });
                            }
                            return null;
                          }
                          
                          return (
                            <span className="font-mono text-sm font-semibold text-gray-500">
                              / {getCurrencySymbol(item.symbol)}{holdingCost.toFixed(2)}
                            </span>
                          );
                        })()}
                            {!priceData[item.symbol]?.loading && !priceData[item.symbol]?.error && priceData[item.symbol]?.dayChg !== null && (
                              <span
                                className={`text-xs font-bold flex items-center gap-0.5 ${
                                  (priceData[item.symbol]?.dayChg || item.dayChg) >= 0 ? 'text-green-600' : 'text-red-500'
                                }`}
                              >
                                {(priceData[item.symbol]?.dayChg || item.dayChg) >= 0 ? (
                                  <TrendingUp size={12} />
                                ) : (
                                  <TrendingDown size={12} />
                                )}
                                {(priceData[item.symbol]?.dayChg || item.dayChg) >= 0 ? '+' : ''}
                                {(priceData[item.symbol]?.dayChg || item.dayChg).toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right border-l border-gray-200 pl-4">
                          <div className="text-xs text-gray-400 mb-1">总盈亏</div>
                          <div
                            className={`text-lg font-bold font-mono ${
                              item.profit >= 0 ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {item.profit >= 0 ? '+' : ''}
                            {getCurrencySymbol(item.symbol)}
                            {Math.abs(Math.round(item.profit)).toLocaleString()}
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 观望中 */}
            {watchingItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
                      boxShadow: '0 2px 6px rgba(96, 165, 250, 0.3)',
                    }}
                  >
                    <Eye size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    观望中 ({watchingItems.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {watchingItems.map((item, index) => (
                    <div
                      key={item.symbol}
                      className="grow-card-solid p-4 animate-fade-up"
                      style={{ animationDelay: `${(investingItems.length + index) * 80}ms` }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white p-1.5 overflow-hidden"
                            style={{ boxShadow: '0 2px 8px rgba(148, 163, 184, 0.15)' }}
                          >
                            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-700 text-sm">{item.symbol}</div>
                            <div className="text-xs text-gray-400">
                              {item.name}{item.config.shares ? ` · ${item.config.shares} 股` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-bold text-gray-700">
                            {priceData[item.symbol]?.loading ? (
                              <span className="text-gray-400">--</span>
                            ) : priceData[item.symbol]?.error || priceData[item.symbol]?.price === null || priceData[item.symbol]?.price === undefined ? (
                              <span className="text-gray-400">--</span>
                            ) : (
                              <>
                                {formatPrice(priceData[item.symbol]?.price, item.symbol)}
                                {item.cost > 0 && (() => {
                                  // 计算持有成本（平均成本价）
                                  const shares = item.config.shares || 0;
                                  let holdingCost: number;
                                  
                                  if (shares > 0) {
                                    // 有股数信息，直接计算平均成本价
                                    holdingCost = item.cost / shares;
                                  } else {
                                    // 没有股数信息，使用当前价格估算（假设买入时价格接近当前价格）
                                    const currentPrice = priceData[item.symbol]?.price || item.price || 1;
                                    const estimatedShares = item.cost / currentPrice;
                                    holdingCost = estimatedShares > 0 ? item.cost / estimatedShares : currentPrice;
                                  }
                                  
                                  return (
                                    <span className="text-gray-500 ml-1">
                                      / {getCurrencySymbol(item.symbol)}{holdingCost.toFixed(2)}
                                    </span>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                          {!priceData[item.symbol]?.loading && !priceData[item.symbol]?.error && priceData[item.symbol]?.dayChg !== null && (
                            <div
                              className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                                (priceData[item.symbol]?.dayChg || item.dayChg) >= 0 ? 'text-green-600' : 'text-red-500'
                              }`}
                            >
                              {(priceData[item.symbol]?.dayChg || item.dayChg) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              {(priceData[item.symbol]?.dayChg || item.dayChg) >= 0 ? '+' : ''}
                              {(priceData[item.symbol]?.dayChg || item.dayChg).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 编辑弹窗 - 使用 Portal 渲染到手机黑框容器，以覆盖标题栏和底部 tab */}
      {showEditModal && editingStock && (
        phoneFrameContainer ? createPortal(
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={handleCloseEditModal}
          >
            <div className="w-full max-w-md">
              <div
                className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
              >
                {/* 弹窗头部 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={editingStock.logo} alt={editingStock.name} className="w-10 h-10 rounded-lg" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-700">{editingStock.symbol}</h3>
                      <p className="text-xs text-gray-400">{editingStock.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseEditModal}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {/* 表单内容 */}
                <div className="space-y-4">
                  {/* 持有股数 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">
                      持有股数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      placeholder="例如：100"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition-colors text-gray-700"
                      min="1"
                      step="1"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">股数必须大于0</p>
                  </div>

                  {/* 每股持有成本 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">
                      每股持有成本 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                        {editingStock ? getCurrencySymbol(editingStock.symbol) : '¥'}
                      </span>
                      <input
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="例如：100"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition-colors text-gray-700 font-mono"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    {/* 显示计算结果 */}
                    {costPrice && shares && Number(costPrice) > 0 && Number(shares) > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        总成本：{editingStock ? getCurrencySymbol(editingStock.symbol) : '¥'}{(Number(costPrice) * Number(shares)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  {/* 按钮组 */}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          phoneFrameContainer
        ) : (
          // 后备方案：如果找不到手机黑框容器，使用原来的 absolute 定位
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={handleCloseEditModal}
          >
            <div className="w-full max-w-md">
              <div
                className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
              >
                {/* 弹窗头部 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={editingStock.logo} alt={editingStock.name} className="w-10 h-10 rounded-lg" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-700">{editingStock.symbol}</h3>
                      <p className="text-xs text-gray-400">{editingStock.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseEditModal}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {/* 表单内容 */}
                <div className="space-y-4">
                  {/* 持有股数 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">
                      持有股数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      placeholder="例如：100"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition-colors text-gray-700"
                      min="1"
                      step="1"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">股数必须大于0</p>
                  </div>

                  {/* 每股持有成本 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">
                      每股持有成本 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                        {editingStock ? getCurrencySymbol(editingStock.symbol) : '¥'}
                      </span>
                      <input
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="例如：100"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none transition-colors text-gray-700 font-mono"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    {/* 显示计算结果 */}
                    {costPrice && shares && Number(costPrice) > 0 && Number(shares) > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        总成本：{editingStock ? getCurrencySymbol(editingStock.symbol) : '¥'}{(Number(costPrice) * Number(shares)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  {/* 按钮组 */}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* 文本输入条 - 悬浮在底部导航栏上方 */}
      <div
        className="absolute left-0 right-0 z-50 px-4"
        style={{ bottom: '10px' }}
      >
        <div className="relative bg-white rounded-2xl shadow-lg border-2 border-gray-200 flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit();
              }
            }}
            placeholder="输入指令..."
            className="flex-1 px-4 py-3 rounded-2xl focus:outline-none text-sm text-gray-700"
          />
          <button
            onClick={handleTextSubmit}
            disabled={!inputText.trim()}
            className="px-4 py-3 rounded-r-2xl transition-all flex items-center justify-center bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            style={{
              minWidth: '48px',
            }}
          >
            <Send 
              size={20} 
            />
          </button>
        </div>
      </div>

      {/* 指令确认弹窗 - 批量模式 */}
      {showConfirmModal && parsedCommands.length > 0 && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={handleCancelCommand}
        >
          <div className="w-full max-w-md">
            <div
              className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-700">AI解析结果</h3>
                <button
                  onClick={handleCancelCommand}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">共 {parsedCommands.length} 条指令：</p>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {parsedCommands.map((cmd, index) => {
                    const manualInput = manualInputs[index] || { cost: '', shares: '' };
                    const stock = findStockByName(cmd.stockName);
                    const currencySymbol = stock ? getCurrencySymbol(stock.symbol) : '¥';
                    const needsPrice = (cmd.userIntent === '用户增持' || cmd.userIntent === '用户减持') && cmd.price <= 0;
                    const needsShares = (cmd.userIntent === '用户增持' || cmd.userIntent === '用户减持') && cmd.shares <= 0;
                    const hasError = needsPrice || needsShares;
                    
                    return (
                      <div key={index} className={`bg-gray-50 p-4 rounded-lg border-2 ${hasError ? 'border-red-200' : 'border-gray-200'}`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">股票名称：</span>
                            <span className="text-sm font-semibold text-gray-700">{cmd.stockName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">用户诉求：</span>
                            <span className={`text-sm font-semibold ${
                              cmd.userIntent === '用户增持' ? 'text-green-600' :
                              cmd.userIntent === '用户减持' ? 'text-red-600' :
                              cmd.userIntent === '用户观望' ? 'text-blue-600' :
                              (cmd.userIntent === '用户删除' || 
                               cmd.userIntent === '用户删除持有' || 
                               cmd.userIntent === '用户删除观望' || 
                               cmd.userIntent === '用户全部删除') ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {cmd.userIntent}
                            </span>
                          </div>
                          
                          {/* 只在增持或减持时显示价格和股数 */}
                          {(cmd.userIntent === '用户增持' || cmd.userIntent === '用户减持') && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">买卖价格：</span>
                                {cmd.price > 0 ? (
                                  <span className="text-sm font-semibold text-gray-700">
                                    {currencySymbol}{cmd.price}/股
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-gray-500">{currencySymbol}</span>
                                    <input
                                      type="number"
                                      value={manualInput.cost}
                                      onChange={(e) => {
                                        setManualInputs({
                                          ...manualInputs,
                                          [index]: { ...manualInput, cost: e.target.value }
                                        });
                                      }}
                                      placeholder="请输入买卖价格"
                                      className="text-sm font-semibold text-red-600 border-2 border-red-300 rounded-lg px-2 py-1 w-28 focus:outline-none focus:border-red-500"
                                      min="0.01"
                                      step="0.01"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">股数：</span>
                                {cmd.shares > 0 ? (
                                  <span className="text-sm font-semibold text-gray-700">{cmd.shares} 股</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={manualInput.shares}
                                    onChange={(e) => {
                                      setManualInputs({
                                        ...manualInputs,
                                        [index]: { ...manualInput, shares: e.target.value }
                                      });
                                    }}
                                    placeholder="请输入股数"
                                    className="text-sm font-semibold text-red-600 border-2 border-red-300 rounded-lg px-2 py-1 w-32 focus:outline-none focus:border-red-500"
                                    min="1"
                                    step="1"
                                  />
                                )}
                              </div>
                              {hasError && (
                                <div className="mt-2 pt-2 border-t border-red-200 bg-red-50 p-2 rounded">
                                  <p className="text-xs text-red-600">
                                    {needsPrice && `• 买卖价格（${currencySymbol}）`}
                                    {needsPrice && needsShares && '、'}
                                    {needsShares && '• 股数'}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">时间：</span>
                            <span className="text-sm font-semibold text-gray-700">
                              {cmd.time && cmd.time !== '未知' ? cmd.time : <span className="text-gray-400">未指定</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmCommand}
                  disabled={parsedCommands.some((cmd, index) => {
                    if (cmd.userIntent === '用户增持' || cmd.userIntent === '用户减持') {
                      const manualInput = manualInputs[index] || { cost: '', shares: '' };
                      const finalPrice = cmd.price > 0 ? cmd.price : Number(manualInput.cost);
                      const finalShares = cmd.shares > 0 ? cmd.shares : Number(manualInput.shares);
                      return !finalPrice || finalPrice <= 0 || !finalShares || finalShares <= 0;
                    }
                    return false;
                  })}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    parsedCommands.some((cmd, index) => {
                      if (cmd.userIntent === '用户增持' || cmd.userIntent === '用户减持') {
                        const manualInput = manualInputs[index] || { cost: '', shares: '' };
                        const finalPrice = cmd.price > 0 ? cmd.price : Number(manualInput.cost);
                        const finalShares = cmd.shares > 0 ? cmd.shares : Number(manualInput.shares);
                        return !finalPrice || finalPrice <= 0 || !finalShares || finalShares <= 0;
                      }
                      return false;
                    })
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <Check size={18} />
                  确认执行批量操作
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 指令确认弹窗 - 单个模式 */}
      {showConfirmModal && parsedCommand && parsedCommands.length === 0 && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={handleCancelCommand}
        >
          <div className="w-full max-w-md">
            <div
              className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-700">确认执行指令</h3>
              <button
                onClick={handleCancelCommand}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>

            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">AI解析结果：</p>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {/* 只在非全部删除时显示股票名称 */}
                  {parsedCommand.userIntent !== '用户全部删除' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">股票名称：</span>
                      <span className="text-sm font-semibold text-gray-700">{parsedCommand.stockName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">用户诉求：</span>
                    <span className={`text-sm font-semibold ${
                      parsedCommand.userIntent === '用户增持' ? 'text-green-600' :
                      parsedCommand.userIntent === '用户减持' ? 'text-red-600' :
                      parsedCommand.userIntent === '用户观望' ? 'text-blue-600' :
                      (parsedCommand.userIntent === '用户删除' || 
                       parsedCommand.userIntent === '用户删除持有' || 
                       parsedCommand.userIntent === '用户删除观望' || 
                       parsedCommand.userIntent === '用户全部删除') ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {parsedCommand.userIntent}
                    </span>
                  </div>
                  {/* 显示要删除的股票列表（如果是批量删除） */}
                  {(parsedCommand.userIntent === '用户删除' || 
                    parsedCommand.userIntent === '用户删除持有' || 
                    parsedCommand.userIntent === '用户删除观望' || 
                    parsedCommand.userIntent === '用户全部删除') && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">删除股票：</span>
                      <div className="text-right">
                        {parsedCommand.userIntent === '用户全部删除' ? (
                          <span className="text-sm font-semibold text-red-600">全部股票</span>
                        ) : parsedCommand.stockNames && parsedCommand.stockNames.length > 1 ? (
                          <div className="flex flex-col gap-1">
                            {parsedCommand.stockNames.map((name, idx) => (
                              <span key={idx} className="text-sm font-semibold text-red-600">
                                {name}{idx < parsedCommand.stockNames!.length - 1 ? '、' : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-red-600">{parsedCommand.stockName}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {/* 只在增持或减持时显示成本和股数 */}
                  {(parsedCommand.userIntent === '用户增持' || parsedCommand.userIntent === '用户减持') && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">买卖价格：</span>
                        {parsedCommand.price > 0 ? (
                          <span className="text-sm font-semibold text-gray-700">
                            {(() => {
                              const stock = findStockByName(parsedCommand.stockName);
                              return stock ? getCurrencySymbol(stock.symbol) : '¥';
                            })()}{parsedCommand.price}/股
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-500">
                              {(() => {
                                const stock = findStockByName(parsedCommand.stockName);
                                return stock ? getCurrencySymbol(stock.symbol) : '¥';
                              })()}
                            </span>
                            <input
                              type="number"
                              value={manualCost}
                              onChange={(e) => setManualCost(e.target.value)}
                              placeholder="请输入买卖价格"
                              className="text-sm font-semibold text-red-600 border-2 border-red-300 rounded-lg px-2 py-1 w-28 focus:outline-none focus:border-red-500"
                              min="0.01"
                              step="0.01"
                            />
                          </div>
                        )}
                      </div>
                      {parsedCommand.cost > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">总成本：</span>
                          <span className="text-sm font-semibold text-gray-700">
                            {(() => {
                              const stock = findStockByName(parsedCommand.stockName);
                              return stock ? getCurrencySymbol(stock.symbol) : '¥';
                            })()}{parsedCommand.cost.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">股数：</span>
                    {parsedCommand.shares > 0 ? (
                      <span className="text-sm font-semibold text-gray-700">{parsedCommand.shares} 股</span>
                    ) : (parsedCommand.userIntent === '用户增持' || parsedCommand.userIntent === '用户减持') ? (
                      <input
                        type="number"
                        value={manualShares}
                        onChange={(e) => setManualShares(e.target.value)}
                        placeholder="请输入股数"
                        className="text-sm font-semibold text-red-600 border-2 border-red-300 rounded-lg px-2 py-1 w-32 focus:outline-none focus:border-red-500"
                        min="1"
                        step="1"
                      />
                    ) : (
                      <span className="text-gray-400">未指定</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">时间：</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {parsedCommand.time && parsedCommand.time !== '未知' ? parsedCommand.time : <span className="text-gray-400">未指定</span>}
                    </span>
                  </div>
                  {(parsedCommand.userIntent === '用户增持' || parsedCommand.userIntent === '用户减持') && 
                   (parsedCommand.price <= 0 || parsedCommand.shares <= 0) && (
                    <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-red-600 mb-1">
                        ⚠️ 请补充必填信息
                      </p>
                      <p className="text-xs text-red-500">
                        {parsedCommand.price <= 0 && `• 买卖价格（${(() => {
                          const stock = findStockByName(parsedCommand.stockName);
                          return stock ? getCurrencySymbol(stock.symbol) : '¥';
                        })()}）`}
                        {parsedCommand.price <= 0 && parsedCommand.shares <= 0 && '、'}
                        {parsedCommand.shares <= 0 && '• 股数'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleConfirmCommand}
                disabled={
                  (parsedCommand.userIntent === '用户增持' || parsedCommand.userIntent === '用户减持') &&
                  ((parsedCommand.price <= 0 && (!manualCost || Number(manualCost) <= 0)) ||
                   (parsedCommand.shares <= 0 && (!manualShares || Number(manualShares) <= 0)))
                }
                className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  (parsedCommand.userIntent === '用户增持' || parsedCommand.userIntent === '用户减持') &&
                  ((parsedCommand.price <= 0 && (!manualCost || Number(manualCost) <= 0)) ||
                   (parsedCommand.shares <= 0 && (!manualShares || Number(manualShares) <= 0)))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <Check size={18} />
                确认执行
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
