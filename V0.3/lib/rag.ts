/**
 * RAG 知识库模块
 * 管理大师语录、投资案例等知识的向量化和检索
 */

import OpenAI from 'openai';
import path from 'path';
import { Guru } from './types';

// 配置
const DB_PATH = path.join(process.cwd(), 'data', 'investbuddy.db');
const EMBEDDING_MODEL = 'text-embedding-3-small';

// 动态加载 better-sqlite3
let DatabaseConstructor: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DatabaseConstructor = require('better-sqlite3');
} catch {
  console.warn('better-sqlite3 not available, RAG features will be disabled');
}

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
  id?: number;
  category: 'guru_quotes' | 'investment_cases' | 'principles' | 'faq' | 'user_reviews';
  guru?: Guru;
  content: string;
  metadata?: { source?: string; tags?: string[]; date?: string;[key: string]: any };
  relevanceScore?: number;
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

function getDb(): any | null {
  if (!DatabaseConstructor) return null;
  try {
    return new DatabaseConstructor(DB_PATH);
  } catch {
    return null;
  }
}

export function initKnowledgeTables(): void {
  const db = getDb();
  if (!db) return;
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category VARCHAR(50) NOT NULL,
      guru VARCHAR(20),
      content TEXT NOT NULL,
      metadata JSON,
      embedding BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_chunks(category)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_knowledge_guru ON knowledge_chunks(guru)`);

    // Seed initial data if empty
    const count = db.prepare('SELECT COUNT(*) as count FROM knowledge_chunks').get() as { count: number };
    if (count.count === 0 && process.env.OPENAI_API_KEY) {
      console.log('Seeding initial knowledge...');
      // We need to use seedKnowledge function which is async, but we are inside a sync function.
      // However, since this is init, we can't easily await. 
      // A better approach is to export a separate init function or handle this in the calling code.
      // For now, let's just log a message that seeding needs to be triggered.
      console.log('Knowledge table is empty. Please run the seeding script or trigger seeding manually.');
    }
  } finally {
    db.close();
  }
}

export async function seedInitialKnowledge(): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM knowledge_chunks').get() as { count: number };
    if (count.count > 0) {
      console.log('Knowledge base already seeded.');
      return;
    }

    console.log('Seeding guru quotes...');
    for (const quote of GURU_QUOTES) {
      await addKnowledge(quote);
    }
    console.log('Seeding completed.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    db.close();
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  if (!client) return [];
  try {
    const response = await client.embeddings.create({ model: EMBEDDING_MODEL, input: text });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function addKnowledge(chunk: KnowledgeChunk): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const embedding = await generateEmbedding(chunk.content);
    const embeddingBlob = Buffer.from(new Float32Array(embedding).buffer);
    db.prepare(`INSERT INTO knowledge_chunks (category, guru, content, metadata, embedding) VALUES (?, ?, ?, ?, ?)`).run(
      chunk.category, chunk.guru || null, chunk.content, JSON.stringify(chunk.metadata || {}), embeddingBlob
    );
  } finally {
    db.close();
  }
}

export async function searchKnowledge(
  query: string,
  options: { guru?: Guru; category?: string; topK?: number } = {}
): Promise<SearchResult[]> {
  const db = getDb();
  if (!db) return [];
  const { guru, category, topK = 5 } = options;
  try {
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length === 0) return fallbackSearch(query, options);

    let sql = 'SELECT id, category, guru, content, metadata, embedding FROM knowledge_chunks WHERE 1=1';
    const params: any[] = [];
    if (guru) { sql += ' AND guru = ?'; params.push(guru); }
    if (category) { sql += ' AND category = ?'; params.push(category); }

    const rows = db.prepare(sql).all(...params) as any[];
    const results: SearchResult[] = rows.map(row => {
      const embedding = new Float32Array(row.embedding.buffer);
      const score = cosineSimilarity(queryEmbedding, Array.from(embedding));
      return {
        chunk: { id: row.id, category: row.category, guru: row.guru, content: row.content, metadata: JSON.parse(row.metadata || '{}') },
        score
      };
    });
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  } finally {
    db.close();
  }
}

async function fallbackSearch(
  query: string,
  options: { guru?: Guru; category?: string; topK?: number } = {}
): Promise<SearchResult[]> {
  const db = getDb();
  if (!db) return [];
  const { guru, category, topK = 5 } = options;
  try {
    let sql = 'SELECT id, category, guru, content, metadata FROM knowledge_chunks WHERE content LIKE ?';
    const params: any[] = [`%${query}%`];
    if (guru) { sql += ' AND guru = ?'; params.push(guru); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ` LIMIT ${topK}`;
    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map((row, index) => ({
      chunk: { id: row.id, category: row.category, guru: row.guru, content: row.content, metadata: JSON.parse(row.metadata || '{}') },
      score: 1 - index * 0.1
    }));
  } finally {
    db.close();
  }
}

export function formatKnowledgeContext(results: SearchResult[]): string {
  if (results.length === 0) return '';
  const context = results.map((r, i) => {
    const guru = r.chunk.guru ? `[${r.chunk.guru}] ` : '';
    return `${i + 1}. ${guru}${r.chunk.content}`;
  }).join('\n\n');
  return `\n相关知识参考:\n${context}\n`;
}

export const GURU_QUOTES: KnowledgeChunk[] = [
  { category: 'guru_quotes', guru: 'buffett', content: '别人恐惧我贪婪，别人贪婪我恐惧。', metadata: { tags: ['情绪', '逆向投资'] } },
  { category: 'guru_quotes', guru: 'buffett', content: '投资的第一条规则是不要亏钱，第二条规则是永远不要忘记第一条。', metadata: { tags: ['风险', '本金'] } },
  { category: 'guru_quotes', guru: 'munger', content: '反过来想，总是反过来想。', metadata: { tags: ['思维', '逆向'] } },
  { category: 'guru_quotes', guru: 'soros', content: '市场永远是错的。', metadata: { tags: ['市场', '反身性'] } },
  { category: 'guru_quotes', guru: 'dalio', content: '痛苦+反思=进步。', metadata: { tags: ['成长', '复盘'] } },
  { category: 'guru_quotes', guru: 'lynch', content: '买你了解的公司。', metadata: { tags: ['能力圈', '研究'] } },
  { category: 'guru_quotes', guru: 'wood', content: '创新是指数级增长的源泉。', metadata: { tags: ['创新', '成长'] } },
];
