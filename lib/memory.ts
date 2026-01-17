/**
 * 记忆系统模块 (Supabase 版本)
 * 管理用户对话的短期记忆、长期记忆和用户画像
 * 使用 Supabase PostgreSQL 进行持久化存储
 */

import { supabase, isSupabaseConfigured } from './supabase';

// 类型定义
export interface ChatMessage {
  id?: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  intent?: string;
  createdAt?: string;
}

export interface ChatSession {
  id?: string;
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

/**
 * 记忆管理器类 (Supabase 版本)
 */
export class MemoryManager {
  // 工作记忆缓存（减少数据库查询）
  private workingMemory: Map<string, ChatMessage[]> = new Map();

  /**
   * 创建新的对话会话
   */
  async createSession(userId: string, sessionId: string, guru?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.from('chat_sessions').insert({
      user_id: userId,
      session_id: sessionId,
      guru: guru || null
    });

    if (error) {
      console.error('Failed to create session:', error);
    }
  }

  /**
   * 结束对话会话
   */
  async endSession(sessionId: string, summary?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('chat_sessions')
      .update({
        ended_at: new Date().toISOString(),
        summary: summary || null
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to end session:', error);
    }

    this.workingMemory.delete(sessionId);
  }

  /**
   * 保存对话消息
   */
  async saveMessage(message: ChatMessage): Promise<void> {
    if (!isSupabaseConfigured()) {
      // 本地缓存作为降级
      const sessionMessages = this.workingMemory.get(message.sessionId) || [];
      sessionMessages.push(message);
      this.workingMemory.set(message.sessionId, sessionMessages);
      return;
    }

    const { error } = await supabase.from('chat_messages').insert({
      session_id: message.sessionId,
      role: message.role,
      content: message.content,
      emotion: message.emotion || null,
      intent: message.intent || null
    });

    if (error) {
      console.error('Failed to save message:', error);
    }

    // 更新本地缓存
    const sessionMessages = this.workingMemory.get(message.sessionId) || [];
    sessionMessages.push(message);
    this.workingMemory.set(message.sessionId, sessionMessages);
  }

  /**
   * 获取最近的对话消息
   */
  async getRecentMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    // 检查缓存
    const cached = this.workingMemory.get(sessionId);
    if (cached && cached.length >= limit) {
      return cached.slice(-limit);
    }

    if (!isSupabaseConfigured()) {
      return cached || [];
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get messages:', error);
      return cached || [];
    }

    const messages: ChatMessage[] = (data || []).reverse().map(row => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      emotion: row.emotion,
      intent: row.intent,
      createdAt: row.created_at
    }));

    this.workingMemory.set(sessionId, messages);
    return messages;
  }

  /**
   * 获取最近的对话会话摘要
   */
  async getRecentSessions(userId: string, days: number = 7): Promise<SessionSummary[]> {
    if (!isSupabaseConfigured()) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }

    return (data || []).map(row => ({
      sessionId: row.session_id,
      guru: row.guru || 'coach',
      summary: row.summary || '',
      mainTopics: row.topics || [],
      emotionalTrend: this.summarizeEmotionalJourney(row.emotional_journey || []),
      date: row.started_at
    }));
  }

  /**
   * 获取用户情绪趋势
   */
  async getEmotionalTrend(userId: string, days: number = 7): Promise<EmotionTrend> {
    if (!isSupabaseConfigured()) {
      return { trend: 'stable', recentEmotions: [], dominantEmotion: 'calm' };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取最近的情绪记录
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        emotion,
        created_at,
        chat_sessions!inner(user_id)
      `)
      .eq('chat_sessions.user_id', userId)
      .eq('role', 'user')
      .not('emotion', 'is', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to get emotional trend:', error);
      return { trend: 'stable', recentEmotions: [], dominantEmotion: 'calm' };
    }

    const emotions: EmotionPoint[] = (data || []).map(r => ({
      emotion: r.emotion,
      timestamp: r.created_at
    }));

    // 计算主导情绪
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });
    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';

    return {
      trend: this.calculateEmotionTrend(emotions),
      recentEmotions: emotions.slice(0, 10),
      dominantEmotion
    };
  }

  /**
   * 获取用户画像
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    // 组装用户画像
    const profile: UserProfile = { userId };

    for (const memory of data) {
      switch (memory.memory_type) {
        case 'investment_style':
          profile.investmentStyle = memory.value;
          break;
        case 'emotion_patterns':
          profile.emotionPatterns = memory.value;
          break;
        case 'decision_patterns':
          profile.decisionPatterns = memory.value;
          break;
        case 'learning_progress':
          profile.learningProgress = memory.value;
          break;
      }
    }

    return profile;
  }

  /**
   * 更新用户画像
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const updatePromises: Promise<unknown>[] = [];

    if (updates.investmentStyle) {
      updatePromises.push(this.upsertMemory(userId, 'investment_style', 'profile', updates.investmentStyle));
    }
    if (updates.emotionPatterns) {
      updatePromises.push(this.upsertMemory(userId, 'emotion_patterns', 'profile', updates.emotionPatterns));
    }
    if (updates.decisionPatterns) {
      updatePromises.push(this.upsertMemory(userId, 'decision_patterns', 'profile', updates.decisionPatterns));
    }
    if (updates.learningProgress) {
      updatePromises.push(this.upsertMemory(userId, 'learning_progress', 'profile', updates.learningProgress));
    }

    await Promise.all(updatePromises);
  }

  /**
   * 更新或插入用户记忆
   */
  private async upsertMemory(
    userId: string,
    memoryType: string,
    key: string,
    value: Record<string, unknown>
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('user_memories')
      .select('id')
      .eq('user_id', userId)
      .eq('memory_type', memoryType)
      .single();

    if (existing) {
      await supabase
        .from('user_memories')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('user_memories').insert({
        user_id: userId,
        memory_type: memoryType,
        key,
        value
      });
    }
  }

  /**
   * 更新会话情绪
   */
  async updateSessionEmotion(sessionId: string, emotion: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from('chat_sessions')
      .select('emotional_journey')
      .eq('session_id', sessionId)
      .single();

    const journey: EmotionPoint[] = data?.emotional_journey || [];
    journey.push({ emotion, timestamp: new Date().toISOString() });

    await supabase
      .from('chat_sessions')
      .update({ emotional_journey: journey })
      .eq('session_id', sessionId);
  }

  /**
   * 更新会话主题
   */
  async updateSessionTopics(sessionId: string, topics: string[]): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from('chat_sessions')
      .select('topics')
      .eq('session_id', sessionId)
      .single();

    const existingTopics: string[] = data?.topics || [];
    const mergedTopics = [...new Set([...existingTopics, ...topics])];

    await supabase
      .from('chat_sessions')
      .update({ topics: mergedTopics })
      .eq('session_id', sessionId);
  }

  // 辅助方法
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
}

// 单例导出
export const memoryManager = new MemoryManager();
