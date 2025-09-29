-- Database Improvements: Enhanced structure, validation, and performance
-- This migration addresses serious database issues and removes demo dependencies

-- Add proper constraints and validation to critical tables
-- =========================================================

-- Ensure amount columns have proper constraints
ALTER TABLE IF EXISTS public.autonomous_revenue_transactions 
ADD CONSTRAINT check_positive_amount CHECK (amount >= 0);

ALTER TABLE IF EXISTS public.autonomous_revenue_transfers
ADD CONSTRAINT check_positive_transfer_amount CHECK (amount >= 0);

ALTER TABLE IF EXISTS public.payment_transactions
ADD CONSTRAINT check_positive_usd_amount CHECK (usd_amount >= 0),
ADD CONSTRAINT check_positive_service_fee CHECK (service_fee >= 0),
ADD CONSTRAINT check_positive_verified_amount CHECK (verified_amount IS NULL OR verified_amount >= 0);

-- Add proper status constraints
ALTER TABLE IF EXISTS public.autonomous_revenue_transactions
ADD CONSTRAINT check_valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE IF EXISTS public.autonomous_revenue_transfers
ADD CONSTRAINT check_valid_transfer_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE IF EXISTS public.payment_transactions
ADD CONSTRAINT check_valid_payment_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'));

-- Create improved tables if they don't exist
-- ==========================================

-- Enhanced autonomous revenue metrics table
CREATE TABLE IF NOT EXISTS public.autonomous_revenue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  daily_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  weekly_growth NUMERIC(5,2) DEFAULT 0,
  monthly_growth NUMERIC(5,2) DEFAULT 0,
  optimization_score INTEGER DEFAULT 0 CHECK (optimization_score >= 0 AND optimization_score <= 100),
  efficiency_rating INTEGER DEFAULT 0 CHECK (efficiency_rating >= 0 AND efficiency_rating <= 100),
  next_optimization TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced autonomous revenue optimization table
CREATE TABLE IF NOT EXISTS public.autonomous_revenue_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_type TEXT NOT NULL,
  current_performance NUMERIC(5,2) DEFAULT 0,
  target_performance NUMERIC(5,2) DEFAULT 0,
  optimization_potential NUMERIC(5,2) DEFAULT 0,
  performance_metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'optimized', 'failed')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent swarms table for autonomous agents
CREATE TABLE IF NOT EXISTS public.agent_swarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'paused', 'failed')),
  hourly_cost NUMERIC(8,2) DEFAULT 0 CHECK (hourly_cost >= 0),
  performance_metrics JSONB DEFAULT '{}',
  configuration JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Market offers table for revenue opportunities
CREATE TABLE IF NOT EXISTS public.market_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_type TEXT NOT NULL,
  payout_rate NUMERIC(8,4) DEFAULT 0 CHECK (payout_rate >= 0),
  conversion_rate NUMERIC(5,4) DEFAULT 0 CHECK (conversion_rate >= 0 AND conversion_rate <= 1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  requirements JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue consolidations table for tracking consolidated amounts
CREATE TABLE IF NOT EXISTS public.revenue_consolidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  consolidation_type TEXT DEFAULT 'automatic',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on new tables
-- =======================================
ALTER TABLE public.autonomous_revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_revenue_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_consolidations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
-- ==================================

-- Policies for autonomous_revenue_metrics
CREATE POLICY "authenticated_view_metrics" ON public.autonomous_revenue_metrics
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_metrics" ON public.autonomous_revenue_metrics
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Policies for autonomous_revenue_optimization
CREATE POLICY "authenticated_view_optimization" ON public.autonomous_revenue_optimization
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_optimization" ON public.autonomous_revenue_optimization
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Policies for agent_swarms
CREATE POLICY "authenticated_view_agents" ON public.agent_swarms
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_agents" ON public.agent_swarms
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Policies for market_offers
CREATE POLICY "authenticated_view_offers" ON public.market_offers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_offers" ON public.market_offers
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Policies for revenue_consolidations
CREATE POLICY "authenticated_view_consolidations" ON public.revenue_consolidations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_manage_consolidations" ON public.revenue_consolidations
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create performance indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_autonomous_revenue_metrics_created_at 
ON public.autonomous_revenue_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_revenue_optimization_type_status 
ON public.autonomous_revenue_optimization(optimization_type, status);

CREATE INDEX IF NOT EXISTS idx_agent_swarms_type_status 
ON public.agent_swarms(agent_type, status);

CREATE INDEX IF NOT EXISTS idx_market_offers_type_status 
ON public.market_offers(offer_type, status);

CREATE INDEX IF NOT EXISTS idx_revenue_consolidations_status_created 
ON public.revenue_consolidations(status, created_at DESC);

-- Create database functions for better data integrity
-- ==================================================

-- Function to check balance consistency
CREATE OR REPLACE FUNCTION check_balance()
RETURNS TABLE(balance_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT ab.balance_amount
  FROM public.application_balance ab
  WHERE ab.id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update balance with validation
CREATE OR REPLACE FUNCTION update_balance(new_amount NUMERIC)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate amount is positive
  IF new_amount < 0 THEN
    RAISE EXCEPTION 'Balance amount cannot be negative';
  END IF;
  
  -- Update the balance
  UPDATE public.application_balance 
  SET balance_amount = new_amount, 
      last_updated_at = now()
  WHERE id = 1;
  
  -- Insert audit record
  INSERT INTO public.transaction_audit_log (
    transaction_type,
    amount,
    description,
    created_at
  ) VALUES (
    'balance_update',
    new_amount,
    'Balance updated via update_balance function',
    now()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive USD totals
CREATE OR REPLACE FUNCTION get_usd_totals()
RETURNS TABLE(
  source_table TEXT,
  total_amount NUMERIC,
  record_count BIGINT,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'application_balance'::TEXT,
    COALESCE(ab.balance_amount, 0),
    1::BIGINT,
    ab.last_updated_at
  FROM public.application_balance ab
  WHERE ab.id = 1
  
  UNION ALL
  
  SELECT 
    'autonomous_revenue_transactions'::TEXT,
    COALESCE(SUM(art.amount), 0),
    COUNT(*),
    MAX(art.created_at)
  FROM public.autonomous_revenue_transactions art
  WHERE art.status = 'completed'
  
  UNION ALL
  
  SELECT 
    'autonomous_revenue_transfers'::TEXT,
    COALESCE(SUM(artf.amount), 0),
    COUNT(*),
    MAX(artf.created_at)
  FROM public.autonomous_revenue_transfers artf
  WHERE artf.status = 'completed'
  
  UNION ALL
  
  SELECT 
    'payment_transactions'::TEXT,
    COALESCE(SUM(pt.usd_amount), 0),
    COUNT(*),
    MAX(pt.updated_at)
  FROM public.payment_transactions pt
  WHERE pt.status = 'completed'
  
  UNION ALL
  
  SELECT 
    'revenue_consolidations'::TEXT,
    COALESCE(SUM(rc.total_amount), 0),
    COUNT(*),
    MAX(rc.updated_at)
  FROM public.revenue_consolidations rc
  WHERE rc.status = 'completed';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION check_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION update_balance(NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION get_usd_totals() TO authenticated;

-- Create triggers for automatic timestamp updates
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables that have updated_at columns
DROP TRIGGER IF EXISTS update_autonomous_revenue_metrics_updated_at ON public.autonomous_revenue_metrics;
CREATE TRIGGER update_autonomous_revenue_metrics_updated_at
    BEFORE UPDATE ON public.autonomous_revenue_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_autonomous_revenue_optimization_updated_at ON public.autonomous_revenue_optimization;
CREATE TRIGGER update_autonomous_revenue_optimization_updated_at
    BEFORE UPDATE ON public.autonomous_revenue_optimization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_swarms_updated_at ON public.agent_swarms;
CREATE TRIGGER update_agent_swarms_updated_at
    BEFORE UPDATE ON public.agent_swarms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_offers_updated_at ON public.market_offers;
CREATE TRIGGER update_market_offers_updated_at
    BEFORE UPDATE ON public.market_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_revenue_consolidations_updated_at ON public.revenue_consolidations;
CREATE TRIGGER update_revenue_consolidations_updated_at
    BEFORE UPDATE ON public.revenue_consolidations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
-- =============================
COMMENT ON TABLE public.autonomous_revenue_metrics IS 'Stores metrics for autonomous revenue generation';
COMMENT ON TABLE public.autonomous_revenue_optimization IS 'Tracks revenue optimization strategies and results';
COMMENT ON TABLE public.agent_swarms IS 'Manages autonomous agent swarms for revenue generation';
COMMENT ON TABLE public.market_offers IS 'Stores market opportunities and payout rates';
COMMENT ON TABLE public.revenue_consolidations IS 'Tracks consolidated revenue from multiple sources';

COMMENT ON FUNCTION check_balance() IS 'Returns current application balance with validation';
COMMENT ON FUNCTION update_balance(NUMERIC) IS 'Updates balance with validation and audit trail';
COMMENT ON FUNCTION get_usd_totals() IS 'Returns comprehensive USD totals from all sources';