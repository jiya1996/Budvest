/**
 * 根据股票代码判断股票类型并返回对应的货币符号
 * @param symbol 股票代码
 * @returns 货币符号
 */
export function getCurrencySymbol(symbol: string): string {
  if (!symbol) return '$';
  
  const upperSymbol = symbol.toUpperCase();
  
  // 港股判断：通常以 .HK 结尾，或者4-5位数字
  if (upperSymbol.endsWith('.HK') || /^\d{4,5}$/.test(upperSymbol)) {
    return 'HK$';
  }
  
  // A股判断：6位数字（上海：600xxx, 601xxx, 603xxx, 688xxx；深圳：000xxx, 002xxx, 300xxx）
  if (/^[0-9]{6}$/.test(upperSymbol)) {
    return '¥';
  }
  
  // 默认美股：1-5个字母的代码
  return '$';
}

/**
 * 格式化价格显示
 * @param price 价格
 * @param symbol 股票代码
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number | null | undefined, symbol: string, decimals: number = 2): string {
  if (price === null || price === undefined || isNaN(price)) {
    return '--';
  }
  const currency = getCurrencySymbol(symbol);
  return `${currency}${price.toFixed(decimals)}`;
}

