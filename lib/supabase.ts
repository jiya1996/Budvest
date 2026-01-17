/**
 * Supabase Client Configuration
 * Cloud-native database client replacing SQLite
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Database features will be disabled.');
}

// Client-side Supabase client (respects Row Level Security)
export const supabase: SupabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

// Admin client with service role (bypasses RLS, for server-side operations only)
export const supabaseAdmin: SupabaseClient | null = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
}

// Database Types
export interface UserProfile {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface PortfolioItem {
    id: string;
    user_id: string;
    symbol: string;
    name: string | null;
    logo_url: string | null;
    market: string | null;
    status: 'investing' | 'watching';
    shares: number;
    price_per_share: number;
    cost: number;
    goal: string | null;
    first_buy_timestamp: number | null;
    created_at: string;
    updated_at: string;
}

export interface ReviewEntry {
    id: string;
    user_id: string;
    portfolio_item_id: string | null;
    entry_type: 'buy' | 'sell' | 'reflection';
    emotion: string | null;
    content: string | null;
    learned: string | null;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    user_id: string;
    guru: string | null;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface KnowledgeChunk {
    id: string;
    category: string;
    guru: string | null;
    content: string;
    metadata: Record<string, unknown> | null;
    embedding: number[] | null;
    created_at: string;
}

export interface UserMemory {
    id: string;
    user_id: string;
    memory_type: string;
    key: string;
    value: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// Helper function for vector similarity search
export async function matchKnowledge(
    queryEmbedding: number[],
    matchThreshold: number = 0.7,
    matchCount: number = 5
): Promise<Array<{ id: string; content: string; category: string; guru: string | null; similarity: number }>> {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
    });

    if (error) {
        console.error('Error matching knowledge:', error);
        return [];
    }

    return data || [];
}
