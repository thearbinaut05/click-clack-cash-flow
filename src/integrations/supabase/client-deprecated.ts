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
              console.warn(`🚨 DEPRECATED: Supabase table query '${table}' called.`);
              let mockData: any = null;
              if (table === 'autonomous_revenue_transactions') {
                mockData = [{ amount: 25.50, status: 'completed', created_at: new Date().toISOString() }];
              } else if (table === 'application_balance') {
                mockData = [{ balance_amount: 125.75 }];
              }
              setTimeout(() => callback({ data: mockData, error: null }), 0);
              return Promise.resolve({ data: mockData, error: null });
            },
            data: []
          }),
          single: () => ({
            then: (callback: (result: MockSupabaseResponse) => void) => {
              console.warn(`🚨 DEPRECATED: Supabase single query.`);
              setTimeout(() => callback({ data: null, error: null }), 0);
              return Promise.resolve({ data: null, error: null });
            }
          }),
          data: []
        }),
        lt: (column: string, value: any) => ({
          then: (callback: (result: MockSupabaseResponse) => void) => {
            console.warn(`🚨 DEPRECATED: Supabase lt query.`);
            setTimeout(() => callback({ data: [], error: null }), 0);
            return Promise.resolve({ data: [], error: null });
          }
        }),
        single: () => ({
          then: (callback: (result: MockSupabaseResponse) => void) => {
            console.warn(`🚨 DEPRECATED: Supabase single query.`);
            setTimeout(() => callback({ data: null, error: null }), 0);
            return Promise.resolve({ data: null, error: null });
          }
        }),
        data: []
      }),
      order: (orderColumn: string, options?: any) => ({
        limit: (limitValue: number) => ({
          then: (callback: (result: MockSupabaseResponse) => void) => {
            console.warn(`🚨 DEPRECATED: Supabase order query.`);
            setTimeout(() => callback({ data: [], error: null }), 0);
            return Promise.resolve({ data: [], error: null });
          },
          data: []
        }),
        single: () => ({
          then: (callback: (result: MockSupabaseResponse) => void) => {
            console.warn(`🚨 DEPRECATED: Supabase single query.`);
            setTimeout(() => callback({ data: null, error: null }), 0);
            return Promise.resolve({ data: null, error: null });
          }
        }),
        data: []
      }),
      limit: (limitValue: number) => ({
        then: (callback: (result: MockSupabaseResponse) => void) => {
          console.warn(`🚨 DEPRECATED: Supabase limit query.`);
          setTimeout(() => callback({ data: [], error: null }), 0);
          return Promise.resolve({ data: [], error: null });
        },
        data: []
      }),
      data: []
    }),
    
    insert: (data: any) => ({
      select: () => ({
        then: (callback: (result: MockSupabaseResponse) => void) => {
          console.warn(`🚨 DEPRECATED: Supabase insert+select.`);
          const mockResult = { id: `mock_${Date.now()}`, ...data };
          setTimeout(() => callback({ data: [mockResult], error: null }), 0);
          return Promise.resolve({ data: [mockResult], error: null });
        },
        single: () => ({
          then: (callback: (result: MockSupabaseResponse) => void) => {
            const mockResult = { id: `mock_${Date.now()}`, ...data };
            setTimeout(() => callback({ data: mockResult, error: null }), 0);
            return Promise.resolve({ data: mockResult, error: null });
          }
        })
      }),
      then: (callback: (result: MockSupabaseResponse) => void) => {
        console.warn(`🚨 DEPRECATED: Supabase insert.`);
        setTimeout(() => callback({ data: { id: `mock_${Date.now()}` }, error: null }), 0);
        return Promise.resolve({ data: { id: `mock_${Date.now()}` }, error: null });
      }
    }),
    
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: (callback: (result: MockSupabaseResponse) => void) => {
          console.warn(`🚨 DEPRECATED: Supabase update.`);
          setTimeout(() => callback({ data: null, error: null }), 0);
          return Promise.resolve({ data: null, error: null });
        }
      })
    }),
    
    upsert: (data: any) => ({
      then: (callback: (result: MockSupabaseResponse) => void) => {
        console.warn(`🚨 DEPRECATED: Supabase upsert.`);
        setTimeout(() => callback({ data: null, error: null }), 0);
        return Promise.resolve({ data: null, error: null });
      }
    })
  }),
  
  rpc: (functionName: string, params?: any) => {
    console.warn(`🚨 DEPRECATED: Supabase RPC '${functionName}' called.`);
    return Promise.resolve({ data: `mock_rpc_${Date.now()}`, error: null });
  },
  
  auth: {
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Auth deprecated') }),
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
    
    // Handle channel() method
    if (prop === 'channel') {
      console.warn(`🚨 DEPRECATED: Supabase 'channel' accessed.`);
      return (name: string) => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {}
      });
    }
    
    // Handle removeChannel() method
    if (prop === 'removeChannel') {
      console.warn(`🚨 DEPRECATED: Supabase removeChannel called.`);
      return () => {};
    }
    
    console.warn(`🚨 DEPRECATED: Supabase property '${String(prop)}' accessed.`);
    return () => Promise.resolve({ data: null, error: new Error(`Supabase ${String(prop)} deprecated`) });
  }
});

// Re-export for backward compatibility
export { supabase as default };