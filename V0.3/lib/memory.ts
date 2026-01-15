/**
 * 记忆系统模块
 * 管理用户对话的短期记忆、长期记忆和用户画像
 */

import path from 'path';

// 数据库路径
const DB_PATH = path.join(process.cwd(), 'data', 'investbuddy.db');

// 动态加载 better-sqlite3（可能在某些环境不可用）
let DatabaseConstructor: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DatabaseConstructor = require('better-sqlite3');
} catch {
  console.warn('better-sqlite3 not available, memory features will be disabled');
}

// 类型定义
export interface ChatMessage {
  id?: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  intent?: string;
  createdAt?: string;
}

export interface ChatSession {
  id?: number;
  userId: string;
  sessionId: string;
  guru?: string;
  summary?: string;
  emotionalJourney?: EmotionPoint[];
  topics?: string[];
  startedAt?: string;
  endedAt?: string;
}

export interface EmotionPoint {
  emotion: string;
  timestamp: string;
  trigger?: string;
}

export interface UserProfile {
  userId: string;
  investmentStyle?: {
    riskTolerance: 'low' | 'medium' | 'high';
    preferredHorizon: 'short' | 'medium' | 'long';
    favoriteGurus: string[];
  };
  emotionPatterns?: {
    commonEmotions: Record<string, number>;
    triggers: string[];
  };
  decisionPatterns?: {
    tendencies: string[];
    improvements: string[];
  };
  learningProgress?: {
    topicsLearned: string[];
    lastActive: string;
  };
}

export interface SessionSummary {
  sessionId: string;
  guru: string;
  summary: string;
  mainTopics: string[];
  emotionalTrend: string;
  date: string;
}

export interface EmotionTrend {
  trend: 'improving' | 'stable' | 'declining';
  recentEmotions: EmotionPoint[];
  dominantEmotion: string;
}

// 获取数据库连接
function getDb(): any | null {
  if (!DatabaseConstructor) return null;
  try {
    return new DatabaseConstructor(DB_PATH);
  } catch {
    return null;
  }
}

// 初始化记忆相关表
export function initMemoryTables(): void {
  const db = getDb();
  if (!db) return;

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50) NOT NULL,
        session_id VARCHAR(50) NOT NULL UNIQUE,
        guru VARCHAR(20),
        summary TEXT,
        emotional_journey JSON,
        topics JSON,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id VARCHAR(50) NOT NULL,
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        emotion VARCHAR(20),
        intent VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        investment_style JSON,
        emotion_patterns JSON,
        decision_patterns JSON,
        learning_progress JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_started ON chat_sessions(started_at);
    `);
  } finally {
    db.close();
  }
}

/**
 * 记忆管理器类
 */
export class MemoryManager {
  private workingMemory: Map<string, ChatMessage[]> = new Map();

  async createSession(userId: string, sessionId: string, guru?: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      db.prepare(`INSERT INTO chat_sessions (user_id, session_id, guru) VALUES (?, ?, ?)`).run(userId, sessionId, guru);
    } finally {
      db.close();
    }
  }

  async endSession(sessionId: string, summary?: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      db.prepare(`UPDATE chat_sessions SET ended_at = CURRENT_TIMESTAMP, summary = ? WHERE session_id = ?`).run(summary, sessionId);
      this.workingMemory.delete(sessionId);
    } finally {
      db.close();
    }
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      db.prepare(`INSERT INTO chat_messages (session_id, role, content, emotion, intent) VALUES (?, ?, ?, ?, ?)`).run(
        message.sessionId, message.role, message.content, message.emotion, message.intent
      );
      const sessionMessages = this.workingMemory.get(message.sessionId) || [];
      sessionMessages.push(message);
      this.workingMemory.set(message.sessionId, sessionMessages);
    } finally {
      db.close();
    }
  }

  async getRecentMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    const cached = this.workingMemory.get(sessionId);
    if (cached && cached.length >= limit) return cached.slice(-limit);
    const db = getDb();
    if (!db) return cached || [];
    try {
      const rows = db.prepare(`SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`).all(sessionId, limit) as any[];
      const messages = rows.reverse().map(row => ({
        id: row.id, sessionId: row.session_id, role: row.role, content: row.content,
        emotion: row.emotion, intent: row.intent, createdAt: row.created_at
      }));
      this.workingMemory.set(sessionId, messages);
      return messages;
    } finally {
      db.close();
    }
  }

  async getRecentSessions(userId: string, days: number = 7): Promise<SessionSummary[]> {
    const db = getDb();
    if (!db) return [];
    try {
      const rows = db.prepare(`SELECT * FROM chat_sessions WHERE user_id = ? AND started_at >= datetime('now', ? || ' days') ORDER BY started_at DESC LIMIT 10`).all(userId, -days) as any[];
      return rows.map(row => ({
        sessionId: row.session_id, guru: row.guru || 'coach', summary: row.summary || '',
        mainTopics: JSON.parse(row.topics || '[]'),
        emotionalTrend: this.summarizeEmotionalJourney(JSON.parse(row.emotional_journey || '[]')),
        date: row.started_at
      }));
    } finally {
      db.close();
    }
  }

  async getEmotionalTrend(userId: string, days: number = 7): Promise<EmotionTrend> {
    const db = getDb();
    if (!db) return { trend: 'stable', recentEmotions: [], dominantEmotion: 'calm' };
    try {
      const rows = db.prepare(`SELECT m.emotion, m.created_at FROM chat_messages m JOIN chat_sessions s ON m.session_id = s.session_id WHERE s.user_id = ? AND m.role = 'user' AND m.emotion IS NOT NULL AND m.created_at >= datetime('now', ? || ' days') ORDER BY m.created_at DESC LIMIT 50`).all(userId, -days) as any[];
      const emotions = rows.map(r => ({ emotion: r.emotion, timestamp: r.created_at }));
      const emotionCounts: Record<string, number> = {};
      emotions.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1; });
      const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';
      return { trend: this.calculateEmotionTrend(emotions), recentEmotions: emotions.slice(0, 10), dominantEmotion };
    } finally {
      db.close();
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const db = getDb();
    if (!db) return null;
    try {
      const row = db.prepare(`SELECT * FROM user_profiles WHERE user_id = ?`).get(userId) as any;
      if (!row) return null;
      return {
        userId: row.user_id,
        investmentStyle: JSON.parse(row.investment_style || '{}'),
        emotionPatterns: JSON.parse(row.emotion_patterns || '{}'),
        decisionPatterns: JSON.parse(row.decision_patterns || '{}'),
        learningProgress: JSON.parse(row.learning_progress || '{}')
      };
    } finally {
      db.close();
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      const existing = await this.getUserProfile(userId);
      if (existing) {
        const merged = {
          investmentStyle: { ...existing.investmentStyle, ...updates.investmentStyle },
          emotionPatterns: { ...existing.emotionPatterns, ...updates.emotionPatterns },
          decisionPatterns: { ...existing.decisionPatterns, ...updates.decisionPatterns },
          learningProgress: { ...existing.learningProgress, ...updates.learningProgress }
        };
        db.prepare(`UPDATE user_profiles SET investment_style = ?, emotion_patterns = ?, decision_patterns = ?, learning_progress = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(
          JSON.stringify(merged.investmentStyle), JSON.stringify(merged.emotionPatterns),
          JSON.stringify(merged.decisionPatterns), JSON.stringify(merged.learningProgress), userId
        );
      } else {
        db.prepare(`INSERT INTO user_profiles (user_id, investment_style, emotion_patterns, decision_patterns, learning_progress) VALUES (?, ?, ?, ?, ?)`).run(
          userId, JSON.stringify(updates.investmentStyle || {}), JSON.stringify(updates.emotionPatterns || {}),
          JSON.stringify(updates.decisionPatterns || {}), JSON.stringify(updates.learningProgress || {})
        );
      }
    } finally {
      db.close();
    }
  }

  private summarizeEmotionalJourney(journey: EmotionPoint[]): string {
    if (!journey || journey.length === 0) return 'neutral';
    const lastEmotion = journey[journey.length - 1]?.emotion || 'calm';
    const firstEmotion = journey[0]?.emotion || 'calm';
    const positiveEmotions = ['calm', 'confident', 'hopeful'];
    const isEndPositive = positiveEmotions.includes(lastEmotion);
    const isStartPositive = positiveEmotions.includes(firstEmotion);
    if (isEndPositive && !isStartPositive) return 'improved';
    if (!isEndPositive && isStartPositive) return 'declined';
    return 'stable';
  }

  private calculateEmotionTrend(emotions: EmotionPoint[]): 'improving' | 'stable' | 'declining' {
    if (emotions.length < 3) return 'stable';
    const negativeEmotions = ['anxious', 'panic', 'angry', 'greedy'];
    const recentNegative = emotions.slice(0, 5).filter(e => negativeEmotions.includes(e.emotion)).length;
    const olderNegative = emotions.slice(-5).filter(e => negativeEmotions.includes(e.emotion)).length;
    if (recentNegative < olderNegative - 1) return 'improving';
    if (recentNegative > olderNegative + 1) return 'declining';
    return 'stable';
  }

  async updateSessionEmotion(sessionId: string, emotion: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      const row = db.prepare(`SELECT emotional_journey FROM chat_sessions WHERE session_id = ?`).get(sessionId) as any;
      const journey: EmotionPoint[] = JSON.parse(row?.emotional_journey || '[]');
      journey.push({ emotion, timestamp: new Date().toISOString() });
      db.prepare(`UPDATE chat_sessions SET emotional_journey = ? WHERE session_id = ?`).run(JSON.stringify(journey), sessionId);
    } finally {
      db.close();
    }
  }

  async updateSessionTopics(sessionId: string, topics: string[]): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      const row = db.prepare(`SELECT topics FROM chat_sessions WHERE session_id = ?`).get(sessionId) as any;
      const existingTopics: string[] = JSON.parse(row?.topics || '[]');
      const mergedTopics = [...new Set([...existingTopics, ...topics])];
      db.prepare(`UPDATE chat_sessions SET topics = ? WHERE session_id = ?`).run(JSON.stringify(mergedTopics), sessionId);
    } finally {
      db.close();
    }
  }
}

export const memoryManager = new MemoryManager();
