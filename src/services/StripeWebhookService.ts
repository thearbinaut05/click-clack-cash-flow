/**
 * Stripe Webhook Service
 * Handles real-time updates from Stripe webhooks
 */

import { supabase } from '@/integrations/supabase/client';

export class StripeWebhookService {
  private static instance: StripeWebhookService;

  static getInstance(): StripeWebhookService {
    if (!StripeWebhookService.instance) {
      StripeWebhookService.instance = new StripeWebhookService();
    }
    return StripeWebhookService.instance;
  }

  /**
   * Get recent webhook events
   */
  async getRecentWebhooks(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('stripe_webhooks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching webhooks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentWebhooks:', error);
      return [];
    }
  }

  /**
   * Get unprocessed webhook events
   */
  async getUnprocessedWebhooks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('stripe_webhooks')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching unprocessed webhooks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUnprocessedWebhooks:', error);
      return [];
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    failed: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('stripe_webhooks')
        .select('processed, error_message');

      if (error) {
        console.error('Error fetching webhook stats:', error);
        return { total: 0, processed: 0, unprocessed: 0, failed: 0 };
      }

      const total = data.length;
      const processed = data.filter(w => w.processed).length;
      const unprocessed = data.filter(w => !w.processed && !w.error_message).length;
      const failed = data.filter(w => w.error_message).length;

      return { total, processed, unprocessed, failed };
    } catch (error) {
      console.error('Error in getWebhookStats:', error);
      return { total: 0, processed: 0, unprocessed: 0, failed: 0 };
    }
  }
}

export default StripeWebhookService;
