-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule autonomous agent operations every 5 minutes
SELECT cron.schedule(
  'autonomous-agent-operations',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT net.http_post(
    url:='https://tqbybefpnwxukzqkanip.supabase.co/functions/v1/autonomous-agent-swarm',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYnliZWZwbnd4dWt6cWthbmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjAyMDMsImV4cCI6MjA2MzkzNjIwM30.trGBxEF0wr4S_4gBteqV_TuWcIEMbzfDJiA1lga6Yko"}'::jsonb,
    body:=concat('{"action": "execute_agent_tasks", "timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Schedule market data scraping every hour
SELECT cron.schedule(
  'market-data-scraping',
  '0 * * * *', -- every hour
  $$
  SELECT net.http_post(
    url:='https://tqbybefpnwxukzqkanip.supabase.co/functions/v1/autonomous-agent-swarm',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYnliZWZwbnd4dWt6cWthbmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjAyMDMsImV4cCI6MjA2MzkzNjIwM30.trGBxEF0wr4S_4gBteqV_TuWcIEMbzfDJiA1lga6Yko"}'::jsonb,
    body:=concat('{"action": "scrape_market_data", "timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Schedule revenue optimization every 10 minutes
SELECT cron.schedule(
  'revenue-optimization',
  '*/10 * * * *', -- every 10 minutes
  $$
  SELECT net.http_post(
    url:='https://tqbybefpnwxukzqkanip.supabase.co/functions/v1/autonomous-agent-swarm',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYnliZWZwbnd4dWt6cWthbmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjAyMDMsImV4cCI6MjA2MzkzNjIwM30.trGBxEF0wr4S_4gBteqV_TuWcIEMbzfDJiA1lga6Yko"}'::jsonb,
    body:=concat('{"action": "optimize_revenue_streams", "timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Schedule Stripe financial auditing daily at 3 AM
SELECT cron.schedule(
  'stripe-financial-audit',
  '0 3 * * *', -- daily at 3 AM
  $$
  SELECT net.http_post(
    url:='https://tqbybefpnwxukzqkanip.supabase.co/functions/v1/stripe-payment-processor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYnliZWZwbnd4dWt6cWthbmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjAyMDMsImV4cCI6MjA2MzkzNjIwM30.trGBxEF0wr4S_4gBteqV_TuWcIEMbzfDJiA1lga6Yko"}'::jsonb,
    body:=concat('{"action": "audit_revenue", "timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Initial setup: Create some default swarms and high-performing offers
INSERT INTO public.agent_swarms (name, swarm_type, config) VALUES
('Revenue Optimization Alpha', 'revenue_optimization', '{"optimization_frequency": "every_5_minutes", "target_roi": 300, "max_budget_allocation": 0.7, "risk_tolerance": 0.3}'),
('Market Analysis Beta', 'market_analysis', '{"scraping_frequency": "every_hour", "sources": ["offervault", "clickbank", "maxbounty"], "analysis_depth": "deep"}'),
('Affiliate Management Gamma', 'affiliate_management', '{"campaign_optimization": "realtime", "bid_adjustment_frequency": "every_minute", "traffic_source_testing": true}');

-- Create some sample high-performing market offers
INSERT INTO public.market_offers (source, offer_id, name, category, payout_rate, conversion_rate, traffic_requirements, geographic_restrictions, performance_score) VALUES
('offervault', 'OV_FINANCE_001', 'Premium Credit Score Monitoring', 'finance', 85.50, 0.047, '{"min_quality_score": 85, "allowed_traffic_types": ["search", "social"]}', '{"allowed_countries": ["US", "CA"], "restricted_countries": []}', 94.2),
('clickbank', 'CB_HEALTH_002', 'Advanced Weight Loss System', 'health', 67.25, 0.029, '{"min_quality_score": 70, "allowed_traffic_types": ["search", "email", "social"]}', '{"allowed_countries": ["US", "UK", "AU"], "restricted_countries": []}', 89.7),
('maxbounty', 'MB_GAMING_003', 'Mobile Casino VIP Package', 'gaming', 125.00, 0.038, '{"min_quality_score": 90, "allowed_traffic_types": ["search", "native"]}', '{"allowed_countries": ["US"], "restricted_countries": []}', 96.8),
('cpalead', 'CP_ECOM_004', 'Luxury Fashion Subscription', 'ecommerce', 45.75, 0.052, '{"min_quality_score": 75, "allowed_traffic_types": ["social", "influencer"]}', '{"allowed_countries": ["US", "CA", "UK"], "restricted_countries": []}', 91.3);

-- Log the initial setup
INSERT INTO public.revenue_optimization_logs (optimization_type, new_config, expected_improvement) VALUES
('initial_system_setup', '{"swarms_created": 3, "offers_loaded": 4, "automation_enabled": true}', 500.0);