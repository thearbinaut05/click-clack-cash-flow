/**
 * Deprecated Supabase Client Wrapper
 * 
 * This file provides a compatibility layer for components that still use Supabase
 * while we migrate to Lovable Cloud. It provides mock responses to prevent breaking changes.
 * 
 * @deprecated Use LovableCloudService instead
 */

import { LovableCloudService } from '@/services/LovableCloudService';

const lovableCloud = LovableCloudService.getInstance();

// Mock Supabase response structure
interface MockSupabaseResponse<T = any> {
  data: T | null;
  error: Error | null;
}

// Mock Supabase client structure
const mockSupabaseClient = {
  functions: {
    invoke: async (functionName: string, options?: any): Promise<MockSupabaseResponse> => {
      console.warn(`🚨 DEPRECATED: Supabase function '${functionName}' called. Please migrate to LovableCloudService.`);
      
      try {
        // Route common function calls to Lovable Cloud equivalents
        switch (functionName) {
          case 'stripe-payment-processor':
            const { action } = options?.body || {};
            if (action === 'get_balance') {
              const balance = await lovableCloud.getRevenueBalance('demo_user');
              return {
                data: {
                  available: [{ amount: Math.round(balance * 100), currency: 'usd' }]
                },
                error: null
              };
            }
            break;
            
          default:
            console.warn(`Unknown Supabase function: ${functionName}`);
            return { data: null, error: new Error(`Function ${functionName} not supported in Lovable Cloud migration`) };
        }
        
        return { data: null, error: null };
      } catch (error) {
        return { data: null, error: error as Error };
      }
    }
  },
  
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        order: (orderColumn: string, options?: any) => ({
          limit: (limitValue: number) => ({
            then: (callback: (result: MockSupabaseResponse) => void) => {
              console.warn(`🚨 DEPRECATED: Supabase table query '${table}' called. Please migrate to LovableCloudService.`);
              
              // Return mock data for common queries
              let mockData = null;
              if (table === 'autonomous_revenue_transactions') {
                mockData = [
                  { amount: 25.50, status: 'completed', created_at: new Date().toISOString() },
                  { amount: 15.25, status: 'completed', created_at: new Date(Date.now() - 3600000).toISOString() }
                ];
              } else if (table === 'application_balance') {
                mockData = [{ balance_amount: 125.75 }];
              }
              
              setTimeout(() => callback({ data: mockData, error: null }), 0);
              return Promise.resolve({ data: mockData, error: null });
            }
          })
        })
      })
    }),
    
    insert: (data: any) => ({
      then: (callback: (result: MockSupabaseResponse) => void) => {
        console.warn(`🚨 DEPRECATED: Supabase insert to '${table}' called. Please migrate to LovableCloudService.`);
        setTimeout(() => callback({ data: { id: `mock_${Date.now()}` }, error: null }), 0);
        return Promise.resolve({ data: { id: `mock_${Date.now()}` }, error: null });
      }
    })
  }),
  
  rpc: (functionName: string, params?: any) => {
    console.warn(`🚨 DEPRECATED: Supabase RPC '${functionName}' called. Please migrate to LovableCloudService.`);
    return Promise.resolve({ data: `mock_rpc_${Date.now()}`, error: null });
  },
  
  auth: {
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Auth deprecated - use Lovable Cloud') }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  }
};

// Export the mock client with deprecation warnings
export const supabase = new Proxy(mockSupabaseClient, {
  get(target, prop) {
    if (prop in target) {
      return (target as any)[prop];
    }
    
    console.warn(`🚨 DEPRECATED: Supabase property '${String(prop)}' accessed. Please migrate to LovableCloudService.`);
    return () => Promise.resolve({ data: null, error: new Error(`Supabase ${String(prop)} deprecated`) });
  }
});

// Re-export for backward compatibility
export { supabase as default };