/**
 * RAG 知识库模块 (Supabase 版本)
 * 管理大师语录、投资案例等知识的向量化和检索
 * 使用 Supabase pgvector 进行高效向量检索
 */

import OpenAI from 'openai';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { Guru } from './types';

// 配置
const EMBEDDING_MODEL = 'text-embedding-3-small';

// OpenAI 客户端（延迟初始化）
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// 类型定义
export interface KnowledgeChunk {
  id?: string;
  category: 'guru_quotes' | 'investment_cases' | 'principles' | 'faq' | 'user_reviews' | 'basic_concept' | 'common_mistake' | 'women_finance';
  guru?: Guru;
  content: string;
  metadata?: { source?: string; tags?: string[]; date?: string; difficulty?: string;[key: string]: unknown };
  relevanceScore?: number;
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

/**
 * 生成文本的向量嵌入
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  if (!client) return [];
  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return [];
  }
}

/**
 * 添加知识到数据库
 */
export async function addKnowledge(chunk: KnowledgeChunk): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot add knowledge');
    return;
  }

  const embedding = await generateEmbedding(chunk.content);
  if (embedding.length === 0) {
    console.warn('Failed to generate embedding, skipping knowledge chunk');
    return;
  }

  // 使用 admin 客户端（绕过 RLS）来插入知识
  const client = supabaseAdmin || supabase;

  const { error } = await client.from('knowledge_chunks').insert({
    category: chunk.category,
    guru: chunk.guru || null,
    content: chunk.content,
    metadata: chunk.metadata || {},
    embedding: embedding
  });

  if (error) {
    console.error('Failed to add knowledge:', error);
  }
}

/**
 * 使用向量相似度搜索知识库
 */
export async function searchKnowledge(
  query: string,
  options: { guru?: Guru; category?: string; topK?: number } = {}
): Promise<SearchResult[]> {
  if (!isSupabaseConfigured()) {
    return fallbackKnowledge(query, options);
  }

  const { guru, category, topK = 5 } = options;

  // 生成查询向量
  const queryEmbedding = await generateEmbedding(query);
  if (queryEmbedding.length === 0) {
    return fallbackKnowledge(query, options);
  }

  try {
    // 使用 Supabase RPC 调用向量相似度函数
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: topK
    });

    if (error) {
      console.error('Vector search failed:', error);
      return fallbackKnowledge(query, options);
    }

    if (!data || data.length === 0) {
      return fallbackKnowledge(query, options);
    }

    // 过滤结果（如果指定了 guru 或 category）
    let results = data.map((row: { id: string; content: string; category: string; guru: string | null; metadata: Record<string, unknown>; similarity: number }) => ({
      chunk: {
        id: row.id,
        category: row.category as KnowledgeChunk['category'],
        guru: row.guru as Guru,
        content: row.content,
        metadata: row.metadata || {}
      },
      score: row.similarity
    }));

    if (guru) {
      results = results.filter((r: SearchResult) => r.chunk.guru === guru);
    }
    if (category) {
      results = results.filter((r: SearchResult) => r.chunk.category === category);
    }

    return results.slice(0, topK);
  } catch (error) {
    console.error('Search knowledge error:', error);
    return fallbackKnowledge(query, options);
  }
}

/**
 * 当向量搜索不可用时的降级方案：使用内置知识
 */
function fallbackKnowledge(
  query: string,
  options: { guru?: Guru; topK?: number } = {}
): SearchResult[] {
  const { guru, topK = 5 } = options;
  const queryLower = query.toLowerCase();

  let results = GURU_QUOTES.map(chunk => {
    // 简单的关键词匹配评分
    const contentLower = chunk.content.toLowerCase();
    const tags = chunk.metadata?.tags || [];
    let score = 0;

    if (contentLower.includes(queryLower)) score += 0.8;
    tags.forEach((tag: string) => {
      if (queryLower.includes(tag.toLowerCase())) score += 0.3;
    });

    return { chunk, score };
  });

  if (guru) {
    results = results.filter(r => r.chunk.guru === guru);
  }

  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * 格式化知识上下文用于 AI 提示
 */
export function formatKnowledgeContext(results: SearchResult[]): string {
  if (results.length === 0) return '';
  const context = results.map((r, i) => {
    const guru = r.chunk.guru ? `[${r.chunk.guru}] ` : '';
    return `${i + 1}. ${guru}${r.chunk.content}`;
  }).join('\n\n');
  return `\n相关知识参考:\n${context}\n`;
}

/**
 * 初始化知识库（填充初始数据）
 */
export async function seedInitialKnowledge(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot seed knowledge');
    return;
  }

  // 检查是否已有数据
  const { count, error } = await supabase
    .from('knowledge_chunks')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Failed to check knowledge count:', error);
    return;
  }

  if (count && count > 0) {
    console.log('Knowledge base already seeded.');
    return;
  }

  console.log('Seeding knowledge base...');

  // 添加所有知识
  const allKnowledge = [...GURU_QUOTES, ...EDUCATION_KNOWLEDGE];
  for (const chunk of allKnowledge) {
    await addKnowledge(chunk);
  }

  console.log(`Seeding completed. Added ${allKnowledge.length} knowledge chunks.`);
}

// 大师语录
export const GURU_QUOTES: KnowledgeChunk[] = [
  { category: 'guru_quotes', guru: 'buffett', content: '别人恐惧我贪婪，别人贪婪我恐惧。', metadata: { tags: ['情绪', '逆向投资'] } },
  { category: 'guru_quotes', guru: 'buffett', content: '投资的第一条规则是不要亏钱，第二条规则是永远不要忘记第一条。', metadata: { tags: ['风险', '本金'] } },
  { category: 'guru_quotes', guru: 'buffett', content: '如果你不愿意持有一只股票十年，那就不要考虑持有它十分钟。', metadata: { tags: ['长期', '耐心'] } },
  { category: 'guru_quotes', guru: 'munger', content: '反过来想，总是反过来想。', metadata: { tags: ['思维', '逆向'] } },
  { category: 'guru_quotes', guru: 'munger', content: '我这辈子遇到的聪明人没有不每天阅读的，一个都没有。', metadata: { tags: ['学习', '阅读'] } },
  { category: 'guru_quotes', guru: 'soros', content: '市场永远是错的。', metadata: { tags: ['市场', '反身性'] } },
  { category: 'guru_quotes', guru: 'dalio', content: '痛苦+反思=进步。', metadata: { tags: ['成长', '复盘'] } },
  { category: 'guru_quotes', guru: 'dalio', content: '不要担心看起来好不好，要担心是否达到目标。', metadata: { tags: ['目标', '务实'] } },
  { category: 'guru_quotes', guru: 'lynch', content: '买你了解的公司。', metadata: { tags: ['能力圈', '研究'] } },
  { category: 'guru_quotes', guru: 'wood', content: '创新是指数级增长的源泉。', metadata: { tags: ['创新', '成长'] } },
];

// 投教内容（小白友好）
export const EDUCATION_KNOWLEDGE: KnowledgeChunk[] = [
  // 基础概念
  {
    category: 'basic_concept',
    content: '股票就像公司的"股份证明"，买了股票就相当于成为公司的小股东，公司赚钱了你也能分红。',
    metadata: { tags: ['股票', '入门'], difficulty: 'beginner' }
  },
  {
    category: 'basic_concept',
    content: '基金就像一个"投资团购"，把大家的钱集中起来，由专业经理帮你投资，分散风险。你不用自己挑股票，省心省力。',
    metadata: { tags: ['基金', '入门'], difficulty: 'beginner' }
  },
  {
    category: 'basic_concept',
    content: '指数基金跟踪整个市场（如沪深300），相当于"买下整个市场"。巴菲特多次推荐普通人定投指数基金。',
    metadata: { tags: ['指数基金', '定投'], difficulty: 'beginner' }
  },
  {
    category: 'basic_concept',
    content: 'ETF是可以像股票一样在交易所买卖的基金，结合了股票的灵活性和基金的分散性。',
    metadata: { tags: ['ETF', '基金'], difficulty: 'beginner' }
  },

  // 常见误区
  {
    category: 'common_mistake',
    content: '追涨杀跌是新手最常犯的错误。看到涨了就买，结果买在高点；看到跌了就卖，结果卖在低点。记住：别人恐惧时贪婪，别人贪婪时恐惧。',
    metadata: { tags: ['心理', '误区'], difficulty: 'beginner' }
  },
  {
    category: 'common_mistake',
    content: '频繁交易不仅增加手续费，还容易被情绪左右。研究表明，交易越频繁的投资者，长期收益往往越差。',
    metadata: { tags: ['交易', '误区'], difficulty: 'beginner' }
  },
  {
    category: 'common_mistake',
    content: '不要把所有钱都投进去！永远保留一部分现金应急，投资只用"闲钱"。',
    metadata: { tags: ['资金管理', '风险'], difficulty: 'beginner' }
  },
  {
    category: 'common_mistake',
    content: '亏了就"等回本再卖"是一种心理陷阱。如果当初买错了，及时止损比死扛更明智。',
    metadata: { tags: ['止损', '心理'], difficulty: 'intermediate' }
  },

  // 女性理财专题
  {
    category: 'women_finance',
    content: '女性投资者往往更谨慎、更长期，这是优势！研究表明，女性投资者的长期回报往往优于男性，因为交易更少、更理性。',
    metadata: { tags: ['女性', '优势'], difficulty: 'beginner' }
  },
  {
    category: 'women_finance',
    content: '不要因为不懂就不参与投资。从小额开始，比如每月定投100元，慢慢学习，积累经验。',
    metadata: { tags: ['女性', '定投'], difficulty: 'beginner' }
  },
  {
    category: 'women_finance',
    content: '财务独立是安全感的基础。无论婚姻状态如何，都要有自己的投资和储蓄。',
    metadata: { tags: ['女性', '独立'], difficulty: 'beginner' }
  },

  // 情绪管理
  {
    category: 'principles',
    content: '投资最大的敌人不是市场，而是自己的情绪。恐惧让你低点卖出，贪婪让你高点买入。',
    metadata: { tags: ['情绪', '心理'], difficulty: 'beginner' }
  },
  {
    category: 'principles',
    content: '写投资日记是控制情绪的好方法。记录你的决策理由和当时的情绪，事后复盘会发现很多有趣的模式。',
    metadata: { tags: ['日记', '复盘'], difficulty: 'beginner' }
  },
  {
    category: 'principles',
    content: '市场波动是正常的。一年之内涨跌20%都很常见，不要因为短期波动影响长期计划。',
    metadata: { tags: ['波动', '长期'], difficulty: 'beginner' }
  },
];
