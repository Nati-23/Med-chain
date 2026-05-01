import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

class SupabaseService {
  private client?: SupabaseClient;
  private static instance: SupabaseService;

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      const missing = [];
      if (!config.supabase.url) missing.push('SUPABASE_URL');
      if (!config.supabase.serviceKey) missing.push('SUPABASE_SERVICE_KEY');
      logger.warn(`❌ DATABASE CONNECTION FAILED: Missing ${missing.join(' and ')} in Vercel environment variables.`);
      return;
    }

    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    logger.info('Supabase client initialized');
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getClient(): SupabaseClient | undefined {
    return this.client;
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const { error } = await this.client.from('users').select('id').limit(1);
      return !error;
    } catch (error) {
      logger.error('Supabase health check failed', error);
      return false;
    }
  }
}

const supabaseService = SupabaseService.getInstance();
export const supabase = supabaseService.getClient()!;
export { SupabaseService };
