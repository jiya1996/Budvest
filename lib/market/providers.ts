import { NextRequest } from 'next/server';

export interface NewsItem {
  title: string;
  source: string;
  publishedAt: string; // ISO string
  url: string;
}

// Simple regex-based XML parser for RSS feeds
function parseRSSItems(xml: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(content);
    const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(content);
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(content);
    const descMatch = /<description>([\s\S]*?)<\/description>/.exec(content);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
        description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : ''
      });
    }
  }
  return items;
}

function parseAtomEntries(xml: string): any[] {
  const items: any[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const content = match[1];
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(content);
    const linkMatch = /<link.*href="(.*?)".*\/>/.exec(content);
    const updatedMatch = /<updated>([\s\S]*?)<\/updated>/.exec(content);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
        link: linkMatch[1].trim(),
        pubDate: updatedMatch ? updatedMatch[1].trim() : new Date().toISOString()
      });
    }
  }

  return items;
}

function getThreeYearsAgoAndNow(): { start: string, end: string } {
  const now = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(now.getFullYear() - 3);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return { start: formatDate(threeYearsAgo), end: formatDate(now) };
}

export async function fetchUSNews(symbol: string): Promise<NewsItem[]> {
  try {
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${symbol}&type=&dateb=&owner=exclude&start=0&count=10&output=atom`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'InvestBuddy/1.0 (investbuddy@example.com)'
      }
    });

    if (!response.ok) return [];

    const text = await response.text();
    let items = parseAtomEntries(text);
    if (items.length === 0) {
      items = parseRSSItems(text);
    }

    return items.map(item => ({
      title: item.title,
      source: 'SEC EDGAR',
      publishedAt: item.pubDate,
      url: item.link
    }));
  } catch (e) {
    console.error('Error fetching US news:', e);
    return [];
  }
}

export async function fetchHKNews(symbol: string): Promise<NewsItem[]> {
  try {
    const url2 = 'https://www.hkex.com.hk/Services/RSS-Feeds/regulatory-announcements?sc_lang=en';
    const url1 = 'https://www.hkex.com.hk/Services/RSS-Feeds/News-Releases?sc_lang=en';

    const [res1, res2] = await Promise.all([fetch(url1), fetch(url2)]);

    let allItems: any[] = [];

    if (res1.ok) {
      const t1 = await res1.text();
      allItems = allItems.concat(parseRSSItems(t1));
    }

    if (res2.ok) {
      const t2 = await res2.text();
      allItems = allItems.concat(parseRSSItems(t2));
    }

    const cleanSymbol = symbol.replace(/^0+/, '');

    // Sort all items by date first to ensure "latest" is really latest
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    let finalItems = allItems.filter(item => {
      const title = item.title || '';
      const desc = item.description || '';
      return title.includes(symbol) || title.includes(cleanSymbol) ||
        desc.includes(symbol) || desc.includes(cleanSymbol);
    });

    // Fallback: If no specific news, return top 10 market news
    if (finalItems.length === 0) {
      finalItems = allItems;
    }

    return finalItems.slice(0, 10).map(item => ({
      title: item.title,
      source: 'HKEX',
      publishedAt: new Date(item.pubDate).toISOString(),
      url: item.link
    }));
  } catch (e) {
    console.error('Error fetching HK news:', e);
    return [];
  }
}

async function fetchSSEItems(symbol: string, start: string, end: string): Promise<any[]> {
  const timestamp = Date.now();
  // If symbol implies fallback (e.g. empty), we remove productId from params
  // But keeping it empty might be safer than removing
  const productParam = symbol ? `&productId=${symbol}` : '';

  const url = `http://query.sse.com.cn/security/stock/queryCompanyBulletin.do?jsonCallBack=jsonCallback&isPagination=true${productParam}&securityType=0101&reportType2=&pageHelp.pageSize=10&pageHelp.pageNo=1&pageHelp.beginPage=1&pageHelp.cacheSize=1&pageHelp.endPage=5&beginDate=${start}&endDate=${end}&_=${timestamp}`;

  const response = await fetch(url, {
    headers: {
      'Referer': 'http://www.sse.com.cn/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) return [];

  const text = await response.text();
  const jsonStr = text.match(/jsonCallback\((.*)\)/)?.[1];

  if (!jsonStr) return [];

  const data = JSON.parse(jsonStr);
  return data.result || [];
}

export async function fetchCNNews(symbol: string): Promise<NewsItem[]> {
  try {
    const { start, end } = getThreeYearsAgoAndNow();

    let result = await fetchSSEItems(symbol, start, end);

    // Fallback if empty
    if (result.length === 0) {
      // Try fetching without symbol to get latest market bulletins
      result = await fetchSSEItems('', start, end);
    }

    return result.slice(0, 10).map((item: any) => ({
      title: item.title || item.TITLE,
      source: 'SSE',
      // SSEDATE usually looks like "2024-01-01"
      publishedAt: item.SSEDate || item.SSEDATE,
      url: `http://www.sse.com.cn${item.URL || item.url}`
    }));
  } catch (e) {
    console.error('Error fetching CN news:', e);
    return [];
  }
}
