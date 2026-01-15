import { UserConfig, ReviewEntry, ChatMessage, PortfolioItem } from './types';

const STORAGE_KEYS = {
  USER_CONFIG: 'bantou_user_config',
  REVIEWS: 'bantou_reviews',
  CHAT_MESSAGES: 'bantou_chat_messages',
  REVIEW_DRAFT: 'bantou_reviewDraft',
  GURU_CHATS: 'bantou_guru_chats',
};

export const storage = {
  getUserConfig(): UserConfig | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
    return data ? JSON.parse(data) : null;
  },

  saveUserConfig(config: UserConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(config));
  },

  updatePortfolio(portfolio: PortfolioItem[], totalPrincipal: number): void {
    if (typeof window === 'undefined') return;
    const config = this.getUserConfig();
    if (config) {
      config.portfolio = portfolio;
      config.totalPrincipal = totalPrincipal;
      this.saveUserConfig(config);
    }
  },

  getReviews(): ReviewEntry[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : [];
  },

  saveReview(review: ReviewEntry): void {
    if (typeof window === 'undefined') return;
    const reviews = this.getReviews();
    const index = reviews.findIndex((r) => r.id === review.id);
    if (index >= 0) {
      reviews[index] = review;
    } else {
      reviews.push(review);
    }
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  },

  deleteReview(id: string): void {
    if (typeof window === 'undefined') return;
    const reviews = this.getReviews().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  },

  getChatMessages(): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    return data ? JSON.parse(data) : [];
  },

  saveChatMessage(message: ChatMessage): void {
    if (typeof window === 'undefined') return;
    const messages = this.getChatMessages();
    messages.push({ ...message, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  },

  clearChatMessages(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
  },

  // 大师对话历史 (按大师ID分开存储)
  getGuruChatMessages(guruId: string): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`${STORAGE_KEYS.GURU_CHATS}_${guruId}`);
    return data ? JSON.parse(data) : [];
  },

  saveGuruChatMessage(guruId: string, message: ChatMessage): void {
    if (typeof window === 'undefined') return;
    const messages = this.getGuruChatMessages(guruId);
    messages.push({ ...message, timestamp: Date.now(), guruId: guruId as any });
    localStorage.setItem(`${STORAGE_KEYS.GURU_CHATS}_${guruId}`, JSON.stringify(messages));
  },

  clearGuruChatMessages(guruId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_KEYS.GURU_CHATS}_${guruId}`);
  },

  getReviewDraft(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REVIEW_DRAFT);
  },

  setReviewDraft(draft: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.REVIEW_DRAFT, draft);
  },

  clearReviewDraft(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.REVIEW_DRAFT);
  },

  // 清除所有数据
  clearAll(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
