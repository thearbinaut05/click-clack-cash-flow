
// Stripe constants
// Production environment values loaded from environment variables
// IMPORTANT: These values should only be used client-side for display
export const OWNER_STRIPE_ACCOUNT_ID = import.meta.env.VITE_APP_STRIPE_ACCOUNT_ID || 'acct_1RPfy4BRrjIUJ5cS';

// API URL - configurable for different environments
export const API_BASE_URL = import.meta.env.VITE_APP_API_URL || '/api';

// Default test values for automated cashout
export const DEFAULT_TEST_EMAIL = 'test@cashout.app';
export const DEFAULT_CASHOUT_AMOUNT = 100; // 100 coins = $1
export const DEFAULT_CASHOUT_METHOD = 'standard';
