'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PortfolioItem, Stock, StockConfig, UserConfig } from '@/lib/types';
<<<<<<< HEAD
import { ArrowLeft, Search, Trash2, Plus, Eye, X } from 'lucide-react';
import { storage } from '@/lib/storage';
import { STOCK_DATABASE, INVESTMENT_GOALS } from '@/lib/data';
import { getCurrencySymbol, formatPrice } from '@/lib/currency';
import BottomNav from '@/components/BottomNav';
=======
import { ArrowLeft, Search, Trash2, Plus, Eye, X, Mic } from 'lucide-react';
import { storage } from '@/lib/storage';
import { STOCK_DATABASE, INVESTMENT_GOALS } from '@/lib/data';
import { getCurrencySymbol, formatPrice } from '@/lib/currency';

>>>>>>> 3b4ad3e (docs: 记录我本地的修改)

interface PriceData {
  price: number | null;
  dayChg: number | null;
  loading: boolean;
  error: boolean;
}

export default function ManageStockPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockConfig, setStockConfig] = useState<StockConfig>({
    status: 'investing',
    capital: '',
    goal: '长期增值',
  });
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  
  // 编辑弹窗相关状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [shares, setShares] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [goal, setGoal] = useState<string>('长期增值'); // 投资目标

  useEffect(() => {
    const config = storage.getUserConfig();
    if (config && config.portfolio) {
      setPortfolio(config.portfolio);
    }
  }, []);

  // 过滤股票列表（排除已在 portfolio 中的）
  const portfolioSymbols = portfolio.map((p) => p.symbol);
  const availableStocks = STOCK_DATABASE.filter(
    (stock) =>
      !portfolioSymbols.includes(stock.symbol) &&
      (stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 获取搜索结果中股票的价格
  useEffect(() => {
    if (!searchQuery || availableStocks.length === 0) {
      setPriceData({});
      return;
    }

    const fetchPrices = async () => {
      // 初始化价格数据
      const initialPriceData: Record<string, PriceData> = {};
      availableStocks.forEach((stock) => {
        initialPriceData[stock.symbol] = {
          price: null,
          dayChg: null,
          loading: true,
          error: false,
        };
      });
      setPriceData(initialPriceData);

      // 并发获取所有股票价格
      const pricePromises = availableStocks.map(async (stock) => {
        try {
          const response = await fetch(`/api/market/price?symbol=${stock.symbol}`);
          if (response.ok) {
            const data = await response.json();
            return {
              symbol: stock.symbol,
              price: data.price || null,
              dayChg: data.dayChg || null,
              error: false,
            };
          } else {
            return {
              symbol: stock.symbol,
              price: null,
              dayChg: null,
              error: true,
            };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${stock.symbol}:`, error);
          return {
            symbol: stock.symbol,
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

    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // 打开编辑弹窗（用于添加持仓）
  const handleOpenAddModal = (stock: Stock) => {
    setEditingStock(stock);
    setShares('');
    setCostPrice('');
    setGoal('长期增值'); // 默认投资目标
    setShowEditModal(true);
  };

  // 关闭编辑弹窗
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingStock(null);
    setShares('');
    setCostPrice('');
    setGoal('长期增值');
  };

  // 保存并添加到持仓
  const handleSaveAndAdd = () => {
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

    // 计算总成本
    const totalCost = pricePerShare * newShares;

    const newPortfolioItem: PortfolioItem = {
      ...editingStock,
      config: {
        status: 'investing',
        capital: totalCost.toString(),
        goal: goal, // 使用选中的投资目标
        shares: newShares,
        pricePerShare: pricePerShare,
      },
      holdingDays: 1, // 初始为1天
      firstBuyTimestamp: Date.now(), // 记录首次买入时间
      cost: totalCost,
      profit: 0, // 初始盈亏为0
    };

    const updatedPortfolio = [...portfolio, newPortfolioItem];
    const config = storage.getUserConfig();
    if (config) {
      config.portfolio = updatedPortfolio;
      config.watchlist = updatedPortfolio.map((p) => p.symbol);
      if (!config.mainSymbol) {
        config.mainSymbol = newPortfolioItem.symbol;
      }
      storage.saveUserConfig(config);
      
      // 触发自定义事件，通知其他组件数据已更新
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
    }

    setPortfolio(updatedPortfolio);
    handleCloseEditModal();
    setSearchQuery('');
    // 添加成功后返回到【投】tab
    setTimeout(() => {
      router.push('/?tab=portfolio');
    }, 300);
  };

  // 快速添加到观望（不需要弹窗）
  const handleQuickAddToWatching = (stock: Stock) => {
    const defaultConfig: StockConfig = {
      status: 'watching',
      capital: '',
      goal: '长期增值',
    };

    const newPortfolioItem: PortfolioItem = {
      ...stock,
      config: defaultConfig,
      holdingDays: 0, // 观望中为0
      cost: 0,
      profit: 0,
    };

    const updatedPortfolio = [...portfolio, newPortfolioItem];
    const config = storage.getUserConfig();
    if (config) {
      config.portfolio = updatedPortfolio;
      config.watchlist = updatedPortfolio.map((p) => p.symbol);
      if (!config.mainSymbol) {
        config.mainSymbol = newPortfolioItem.symbol;
      }
      storage.saveUserConfig(config);
      
      // 触发自定义事件，通知其他组件数据已更新
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
    }

    setPortfolio(updatedPortfolio);
    setSearchQuery('');
    // 添加成功后返回到【投】tab
    setTimeout(() => {
      router.push('/?tab=portfolio');
    }, 300);
  };

  // 处理新增股票（带配置）
  const handleAddStock = () => {
    if (!selectedStock) return;

          const newPortfolioItem: PortfolioItem = {
            ...selectedStock,
            config: stockConfig,
            holdingDays: stockConfig.status === 'investing' ? 1 : 0, // 持有中从1开始，观望中为0
            firstBuyTimestamp: stockConfig.status === 'investing' ? Date.now() : undefined, // 持有中记录首次买入时间
            cost: stockConfig.capital ? Number(stockConfig.capital) * 0.95 : 0,
            profit: stockConfig.capital ? Number(stockConfig.capital) * (Math.random() * 0.2 - 0.1) : 0,
          };

    const updatedPortfolio = [...portfolio, newPortfolioItem];
    const config = storage.getUserConfig();
    if (config) {
      config.portfolio = updatedPortfolio;
      config.watchlist = updatedPortfolio.map((p) => p.symbol);
      if (!config.mainSymbol) {
        config.mainSymbol = newPortfolioItem.symbol;
      }
      storage.saveUserConfig(config);
      
      // 触发自定义事件，通知其他组件数据已更新
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
    }

    setPortfolio(updatedPortfolio);
    setSelectedStock(null);
    setStockConfig({ status: 'investing', capital: '', goal: '长期增值' });
    // 添加成功后返回到【投】tab
    setTimeout(() => {
      router.push('/?tab=portfolio');
    }, 300);
  };

  // 处理删除股票
  const handleDeleteStock = (symbol: string) => {
    if (!confirm(`确定要删除 ${symbol} 吗？`)) return;

    const updatedPortfolio = portfolio.filter((p) => p.symbol !== symbol);
    const config = storage.getUserConfig();
    if (config) {
      config.portfolio = updatedPortfolio;
      config.watchlist = updatedPortfolio.map((p) => p.symbol);
      if (config.mainSymbol === symbol) {
        config.mainSymbol = updatedPortfolio[0]?.symbol || '';
      }
      storage.saveUserConfig(config);
      
      // 触发自定义事件，通知其他组件数据已更新
      window.dispatchEvent(new CustomEvent('portfolioUpdated'));
    }

    setPortfolio(updatedPortfolio);
  };


  return (
    <>
<<<<<<< HEAD
      <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
=======
      {/* 外层容器：限制宽度为手机屏幕宽度 */}
      <div className="flex justify-center items-center min-h-screen bg-slate-200 font-sans">
        <div className="w-full max-w-md h-[100dvh] md:h-[844px] bg-slate-50 shadow-2xl md:rounded-[40px] overflow-hidden md:border-[8px] md:border-slate-800 relative flex flex-col">
          {/* 内容区域 */}
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/?tab=portfolio')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>管理股票</h1>
        </div>

        <div>
          {/* 搜索框 */}
<<<<<<< HEAD
          <div className="relative mb-6">
=======
          <div className="relative mb-6" style={{ zIndex: 30 }}>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
            <input
              type="text"
              placeholder="搜索股票代码或名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-green-400 focus:outline-none transition-colors bg-white"
            />

            {/* 搜索结果下拉弹层 */}
            {searchQuery && availableStocks.length > 0 && (
              <div
<<<<<<< HEAD
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 max-h-64 overflow-y-auto z-50"
                style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
=======
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-y-auto"
                style={{ 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  maxHeight: 'calc(100vh - 300px)',
                  zIndex: 30,
                  position: 'absolute'
                }}
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
              >
                {availableStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 gap-3"
                  >
                    <button
                      onClick={() => {
                        setSelectedStock(stock);
                        setSearchQuery('');
                      }}
                      className="flex-1 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img src={stock.logo} alt={stock.name} className="w-10 h-10 rounded-lg" />
                        <div className="text-left">
                          <div className="font-semibold text-gray-700 text-sm">{stock.symbol}</div>
                          <div className="text-xs text-gray-400">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">
                          {priceData[stock.symbol]?.loading ? (
                            <span className="text-gray-400">--</span>
                          ) : priceData[stock.symbol]?.error || priceData[stock.symbol]?.price === null || priceData[stock.symbol]?.price === undefined ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            formatPrice(priceData[stock.symbol]?.price, stock.symbol)
                          )}
                        </div>
                        {!priceData[stock.symbol]?.loading && !priceData[stock.symbol]?.error && priceData[stock.symbol]?.dayChg !== null && priceData[stock.symbol]?.dayChg !== undefined && (
                          <div
                            className={`text-xs font-semibold ${(priceData[stock.symbol]?.dayChg || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}
                          >
                            {(priceData[stock.symbol]?.dayChg || 0) >= 0 ? '+' : ''}
                            {(priceData[stock.symbol]?.dayChg || 0).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddModal(stock);
                        }}
                        className="px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        <Plus size={14} />
                        持仓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAddToWatching(stock);
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        <Eye size={14} />
                        观望
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 无搜索结果提示 */}
            {searchQuery && availableStocks.length === 0 && (
              <div
<<<<<<< HEAD
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-4 z-50"
                style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
=======
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-4"
                style={{ 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  zIndex: 30,
                  position: 'absolute'
                }}
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
              >
                <p className="text-sm text-gray-400 text-center">未找到匹配的股票</p>
              </div>
            )}
          </div>

          {/* 当前持仓列表（可删除） */}
          {portfolio.length > 0 && (
            <>
              {/* 持有中列表 */}
              {portfolio.filter((item) => item.config.status === 'investing').length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">当前持仓</h4>
                  <div className="space-y-2">
                    {portfolio
                      .filter((item) => item.config.status === 'investing')
                      .map((item) => (
                        <div
                          key={item.symbol}
                          className="flex items-center justify-between p-4 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <img src={item.logo} alt={item.name} className="w-10 h-10 rounded-lg" />
                            <div>
                              <div className="font-semibold text-gray-700 text-sm">{item.symbol}</div>
                              <div className="text-xs text-gray-400">{item.name}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteStock(item.symbol)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 观望中列表 */}
              {portfolio.filter((item) => item.config.status === 'watching').length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">当前观望</h4>
                  <div className="space-y-2">
                    {portfolio
                      .filter((item) => item.config.status === 'watching')
                      .map((item) => (
                        <div
                          key={item.symbol}
                          className="flex items-center justify-between p-4 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <img src={item.logo} alt={item.name} className="w-10 h-10 rounded-lg" />
                            <div>
                              <div className="font-semibold text-gray-700 text-sm">{item.symbol}</div>
                              <div className="text-xs text-gray-400">{item.name}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteStock(item.symbol)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 股票配置表单 */}
          {selectedStock && (
            <div className="p-5 rounded-2xl bg-white border-2 border-green-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-700">配置 {selectedStock.symbol}</h4>
                <button
                  onClick={() => {
                    setSelectedStock(null);
                    setStockConfig({ status: 'investing', capital: '', goal: '长期增值' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <div className="space-y-4">
                {/* 状态选择 */}
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">状态</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStockConfig({ ...stockConfig, status: 'investing' })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                        stockConfig.status === 'investing'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      持有中
                    </button>
                    <button
                      onClick={() => setStockConfig({ ...stockConfig, status: 'watching' })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                        stockConfig.status === 'watching'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      观望中
                    </button>
                  </div>
                </div>

                {/* 投入本金 */}
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">投入本金（元）</label>
                  <input
                    type="number"
                    placeholder="例如：10000"
                    value={stockConfig.capital}
                    onChange={(e) => setStockConfig({ ...stockConfig, capital: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
                  />
                </div>

                {/* 投资目标 */}
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">投资目标</label>
                  <select
                    value={stockConfig.goal}
                    onChange={(e) => setStockConfig({ ...stockConfig, goal: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
                  >
                    {INVESTMENT_GOALS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 添加按钮 */}
                <button
                  onClick={handleAddStock}
                  className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                >
                  添加到组合
                </button>
              </div>
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* 编辑弹窗（用于添加持仓） */}
        {showEditModal && editingStock && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseEditModal}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src={editingStock.logo} alt={editingStock.name} className="w-10 h-10 rounded-lg" />
=======
          {/* 编辑弹窗（用于添加持仓） */}
          {showEditModal && editingStock && (
            <div
              className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
              onClick={handleCloseEditModal}
            >
              {/* 弹窗外层容器：限制宽度与手机容器一致 */}
              <div className="w-full max-w-md">
                <div
                  className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxHeight: 'calc(100vh - 2rem)' }}
                >
                {/* 弹窗头部 */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                    <Mic size={20} className="text-gray-600" />
                  </div>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
                  <div>
                    <h3 className="text-lg font-bold text-gray-700">{editingStock.symbol}</h3>
                    <p className="text-xs text-gray-400">{editingStock.name}</p>
                  </div>
                </div>
<<<<<<< HEAD
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-700"
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
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-700 font-mono"
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

                {/* 投资目标 */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    投资目标
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {INVESTMENT_GOALS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setGoal(opt)}
                        className={`py-3 px-3 text-sm rounded-2xl transition-all duration-300 ${
                          goal === opt
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 text-green-700 font-semibold'
                            : 'bg-gray-50 border-2 border-transparent text-gray-500'
                        }`}
                        style={{
                          boxShadow:
                            goal === opt
                              ? '0 2px 12px rgba(74, 222, 128, 0.15)'
                              : 'none',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 按钮组 */}
                <div className="pt-4">
                  <button
                    onClick={handleSaveAndAdd}
                    className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                  >
                    保存
                  </button>
=======

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
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-700"
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
                        className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-700 font-mono"
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

                  {/* 投资目标 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">
                      投资目标
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {INVESTMENT_GOALS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setGoal(opt)}
                          className={`py-3 px-3 text-sm rounded-2xl transition-all duration-300 ${
                            goal === opt
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 text-green-700 font-semibold'
                              : 'bg-gray-50 border-2 border-transparent text-gray-500'
                          }`}
                          style={{
                            boxShadow:
                              goal === opt
                                ? '0 2px 12px rgba(74, 222, 128, 0.15)'
                                : 'none',
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 按钮组 */}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveAndAdd}
                      className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                    >
                      保存
                    </button>
                  </div>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
                </div>
              </div>
            </div>
          </div>
<<<<<<< HEAD
        )}
      </div>
      <BottomNav />
=======
          )}
          </div>
        </div>
      </div>
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
    </>
  );
}

