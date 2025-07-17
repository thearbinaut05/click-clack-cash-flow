-- Setup Stripe integration configuration table
CREATE TABLE IF NOT EXISTS public.stripe_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  webhook_secret TEXT,
  account_id TEXT,
  is_live BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_configuration ENABLE ROW LEVEL SECURITY;

-- Policy for service role access
CREATE POLICY "Service role can manage stripe config" ON public.stripe_configuration
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Insert the provided Stripe key
INSERT INTO public.stripe_configuration (api_key, is_live) 
VALUES ('sk_live_51RGs3rD6CDwEP7C7nD26ye0xfhBX2Q8ugo6u93bwpWN9QX1cLiRVmddDrpWKIRfQkKrPRJ200qm1m1ZuN', true)
ON CONFLICT DO NOTHING;

-- Enhanced autonomous agent system tables
CREATE TABLE IF NOT EXISTS public.agent_swarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vm_instance_id TEXT,
  swarm_type TEXT NOT NULL, -- 'revenue_optimization', 'market_analysis', 'affiliate_management'
  status TEXT DEFAULT 'active',
  config JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent tasks queue for autonomous operations
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id UUID REFERENCES public.agent_swarms(id),
  task_type TEXT NOT NULL, -- 'scrape_offers', 'optimize_campaigns', 'analyze_market'
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time offer data from web scraping
CREATE TABLE IF NOT EXISTS public.market_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'offervault', 'clickbank', 'cj_affiliate', etc.
  offer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  payout_rate NUMERIC,
  conversion_rate NUMERIC,
  traffic_requirements JSONB,
  geographic_restrictions JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  performance_score NUMERIC DEFAULT 0
);

-- Enable RLS on new tables
ALTER TABLE public.agent_swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_offers ENABLE ROW LEVEL SECURITY;

-- Policies for agent system
CREATE POLICY "Service role can manage swarms" ON public.agent_swarms
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Service role can manage tasks" ON public.agent_tasks
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Anyone can view market offers" ON public.market_offers
FOR SELECT USING (true);

CREATE POLICY "Service role can manage offers" ON public.market_offers
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Revenue optimization tracking
CREATE TABLE IF NOT EXISTS public.revenue_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_type TEXT NOT NULL,
  previous_config JSONB,
  new_config JSONB,
  expected_improvement NUMERIC,
  actual_improvement NUMERIC,
  agent_id UUID REFERENCES public.autonomous_agents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.revenue_optimization_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage optimization logs" ON public.revenue_optimization_logs
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);