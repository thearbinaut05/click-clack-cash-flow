// Stripe constants
// Production environment values - using LIVE account details
// IMPORTANT: These values should only be used client-side for display
export const OWNER_STRIPE_ACCOUNT_ID = 'acct_1R4gD2LKSRNiN8vT';

// API URL - using live Supabase edge functions
// Production ready - using real Supabase edge function endpoints
export const API_BASE_URL = 'https://tqbybefpnwxukzqkanip.supabase.co/functions/v1';

// LIVE production values for real cashouts
export const DEFAULT_TEST_EMAIL = 'thearbinaut05@gmail.com'; // Keep for compatibility
export const DEFAULT_PRODUCTION_EMAIL = 'thearbinaut05@gmail.com';
export const DEFAULT_CASHOUT_AMOUNT = 500; // 500 coins = $5 minimum for real transactions
export const MINIMUM_CASHOUT_AMOUNT = 500; // 500 coins = $5 minimum for real transactions
export const DEFAULT_CASHOUT_METHOD = 'standard';

// Cashout method types
export const CASHOUT_METHODS = {
  STANDARD: 'standard',
  VIRTUAL_CARD: 'virtual-card',
  BANK_CARD: 'bank-card'
};

// Stripe API payout types (used by the server)
export const PAYOUT_TYPES = {
  INSTANT_CARD: 'instant_card',
  BANK_ACCOUNT: 'bank_account',
  EMAIL: 'email'
};

// Production API endpoints using Supabase edge functions
export const AFFILIATE_API_ENDPOINTS = {
  offers: `${API_BASE_URL}/autonomous-agent-swarm`,
  stats: `${API_BASE_URL}/autonomous-agent-swarm`,
  optimize: `${API_BASE_URL}/autonomous-agent-swarm`
};

// Ad network constants with real payout rates
export const AD_NETWORKS = {
  ppc: {
    baseRate: 0.12, // $0.12 per click average
    tiers: [
      { threshold: 100, multiplier: 1.1 },
      { threshold: 500, multiplier: 1.25 },
      { threshold: 1000, multiplier: 1.5 }
    ]
  },
  cpa: {
    baseRate: 0.75, // $0.75 per conversion average
    tiers: [
      { threshold: 10, multiplier: 1.2 },
      { threshold: 50, multiplier: 1.35 },
      { threshold: 100, multiplier: 1.75 }
    ],
    categories: {
      gaming: { baseModifier: 1.2 },
      finance: { baseModifier: 1.5 },
      ecommerce: { baseModifier: 1.1 },
      subscription: { baseModifier: 1.3 }
    }
  }
};

