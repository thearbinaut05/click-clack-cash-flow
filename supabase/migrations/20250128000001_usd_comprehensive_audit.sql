-- Create missing tables for comprehensive USD tracking and verification
-- This ensures all USD amounts have proper storage and audit capabilities

-- Application balance table for tracking overall USD balance
CREATE TABLE IF NOT EXISTS public.application_balance (
  id INTEGER PRIMARY KEY DEFAULT 1,
  balance_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one balance record exists
INSERT INTO public.application_balance (id, balance_amount) 
VALUES (1, 0) 
ON CONFLICT (id) DO NOTHING;

-- Enhanced autonomous revenue transactions table (if missing columns)
ALTER TABLE IF EXISTS public.autonomous_revenue_transactions 
ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enhanced autonomous revenue transfers table (if missing columns)  
ALTER TABLE IF EXISTS public.autonomous_revenue_transfers
ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS provider_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Payment transactions table for crypto/fiat conversions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  usd_amount NUMERIC(15,2) NOT NULL,
  crypto_amount NUMERIC(20,8),
  crypto_type TEXT,
  exchange_rate NUMERIC(15,8),
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  service_fee NUMERIC(15,2) DEFAULT 0,
  verified_amount NUMERIC(15,2),
  customer_email TEXT,
  customer_phone TEXT,
  payment_tx_hash TEXT,
  crypto_tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.application_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for application_balance
CREATE POLICY "authenticated_view_balance" ON public.application_balance
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_balance" ON public.application_balance
  FOR ALL
  USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  );

-- Create RLS policies for payment_transactions
CREATE POLICY "authenticated_view_payments" ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_payments" ON public.payment_transactions
  FOR ALL
  USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
  );

-- Create indexes for better performance on USD queries
CREATE INDEX IF NOT EXISTS idx_autonomous_revenue_transactions_amount 
ON public.autonomous_revenue_transactions(amount);

CREATE INDEX IF NOT EXISTS idx_autonomous_revenue_transfers_amount 
ON public.autonomous_revenue_transfers(amount);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_usd_amount 
ON public.payment_transactions(usd_amount);

CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_amount 
ON public.transaction_audit_log(amount);

-- Create a view for comprehensive USD summary
CREATE OR REPLACE VIEW public.usd_summary_view AS
SELECT 
  'application_balance' as source,
  balance_amount as amount,
  'USD' as currency,
  last_updated_at as updated_at
FROM public.application_balance
WHERE id = 1

UNION ALL

SELECT 
  'autonomous_revenue_transactions' as source,
  SUM(amount) as amount,
  'USD' as currency,
  MAX(created_at) as updated_at
FROM public.autonomous_revenue_transactions
WHERE status = 'completed'

UNION ALL

SELECT 
  'autonomous_revenue_transfers' as source,
  SUM(amount) as amount,
  'USD' as currency,
  MAX(created_at) as updated_at
FROM public.autonomous_revenue_transfers
WHERE status = 'completed'

UNION ALL

SELECT 
  'payment_transactions' as source,
  SUM(usd_amount) as amount,
  'USD' as currency,
  MAX(updated_at) as updated_at
FROM public.payment_transactions
WHERE status = 'completed';

-- Grant access to the view
GRANT SELECT ON public.usd_summary_view TO authenticated;
GRANT SELECT ON public.usd_summary_view TO anon;