import { supabase } from "@/integrations/supabase/client";

export interface SupabaseHealth {
  isConnected: boolean;
  isHealthy: boolean;
  latency: number;
  lastCheck: Date;
  error?: string;
}

export class SupabaseHealthService {
  private static instance: SupabaseHealthService;
  private health: SupabaseHealth = {
    isConnected: false,
    isHealthy: false,
    latency: 0,
    lastCheck: new Date(),
  };
  
  private checkInterval: NodeJS.Timeout | null = null;
  private subscribers: Array<(health: SupabaseHealth) => void> = [];

  static getInstance(): SupabaseHealthService {
    if (!SupabaseHealthService.instance) {
      SupabaseHealthService.instance = new SupabaseHealthService();
    }
    return SupabaseHealthService.instance;
  }

  constructor() {
    this.startHealthChecks();
  }

  private startHealthChecks() {
    // Initial check
    this.checkHealth();
    
    // Check every 10 seconds
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, 10000);
  }

  private async checkHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simple health check - try to access a basic function
      const { error } = await supabase.from('application_balance').select('count').limit(1);
      
      const latency = Date.now() - startTime;
      
      this.health = {
        isConnected: !error,
        isHealthy: !error,
        latency,
        lastCheck: new Date(),
        error: error?.message,
      };
    } catch (error) {
      this.health = {
        isConnected: false,
        isHealthy: false,
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.health);
      } catch (error) {
        console.error('Error in health subscriber:', error);
      }
    });
  }

  public subscribe(callback: (health: SupabaseHealth) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately call with current health
    callback(this.health);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  public getHealth(): SupabaseHealth {
    return { ...this.health };
  }

  public async forceCheck(): Promise<SupabaseHealth> {
    await this.checkHealth();
    return this.getHealth();
  }

  public isOfflineMode(): boolean {
    return !this.health.isConnected || !this.health.isHealthy;
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.subscribers = [];
  }

  /**
   * Safe wrapper for Supabase operations with fallback
   */
  public async withFallback<T>(
    operation: () => Promise<T>,
    fallback: T | (() => T),
    operationName = 'Supabase operation'
  ): Promise<T> {
    try {
      if (this.isOfflineMode()) {
        console.warn(`${operationName}: Using fallback due to offline mode`);
        return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
      }

      const result = await operation();
      return result;
    } catch (error) {
      console.error(`${operationName} failed, using fallback:`, error);
      return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    }
  }
}

export default SupabaseHealthService;