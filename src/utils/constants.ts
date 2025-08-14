// Stripe constants
// Production environment values loaded from environment variables
// IMPORTANT: These values should only be used client-side for display
export const OWNER_STRIPE_ACCOUNT_ID = import.meta.env.VITE_APP_STRIPE_ACCOUNT_ID || 'acct_1RPfy4BRrjIUJ5cS';

// API URL - configurable for different environments
// In development, this should point to the local cashout server (http://localhost:4000)
// In production, this should point to your deployed API endpoint
export const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:4000';

// Default test values for automated cashout
export const DEFAULT_TEST_EMAIL = 'thearbinaut05@gmail.com';
export const DEFAULT_CASHOUT_AMOUNT = 100; // 100 coins = $1
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

// Affiliate Network API endpoints
export const AFFILIATE_API_ENDPOINTS = {
  offers: `${API_BASE_URL}/affiliate/offers`,
  stats: `${API_BASE_URL}/affiliate/stats`,
  optimize: `${API_BASE_URL}/affiliate/optimize`
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

