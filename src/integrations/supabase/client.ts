/**
 * REAL Supabase Client - NO MOCKS
 * Connects to actual Supabase project for REAL USD transactions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqbybefpnwxukzqkanip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYnliZWZwbnd4dWt6cWthbmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjAyMDMsImV4cCI6MjA2MzkzNjIwM30.trGBxEF0wr4S_4gBteqV_TuWcIEMbzfDJiA1lga6Yko';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ REAL Supabase client initialized - NO MOCKS');