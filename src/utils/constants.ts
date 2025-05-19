
// Stripe constants
// Production environment values loaded from environment variables
// IMPORTANT: These values should only be used client-side for display
// All actual payment processing must happen server-side
export const OWNER_STRIPE_ACCOUNT_ID = import.meta.env.VITE_APP_STRIPE_ACCOUNT_ID || 'acct_1RPfy4BRrjIUJ5cS';

// API URL - configurable for different environments
export const API_BASE_URL = import.meta.env.VITE_APP_API_URL || '/api';
