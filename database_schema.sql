-- Database schema for the leveraged rebalancing flash swap system

-- NFT Collateral Positions table
CREATE TABLE IF NOT EXISTS nft_collateral_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id VARCHAR(255) NOT NULL,
  collateral_value DECIMAL(15,2) NOT NULL,
  leverage_ratio DECIMAL(8,3) NOT NULL,
  liquidation_threshold DECIMAL(8,3) NOT NULL,
  current_health_factor DECIMAL(8,3) NOT NULL,
  last_rebalance_time BIGINT NOT NULL,
  health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('healthy', 'warning', 'critical', 'liquidated')),
  last_swap_transaction_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash Swap Transactions table
CREATE TABLE IF NOT EXISTS flash_swap_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES nft_collateral_positions(id),
  nft_id VARCHAR(255) NOT NULL,
  original_value DECIMAL(15,2) NOT NULL,
  target_value DECIMAL(15,2) NOT NULL,
  leverage_ratio DECIMAL(8,3) NOT NULL,
  strategy_used VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gas_used BIGINT,
  profit_generated DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFT Assets table
CREATE TABLE IF NOT EXISTS nft_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id VARCHAR(255) NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  blockchain VARCHAR(50) NOT NULL,
  real_world_value DECIMAL(15,2) NOT NULL,
  glitch_multiplier DECIMAL(8,3) DEFAULT 1.0,
  last_glitch_time BIGINT DEFAULT 0,
  glitch_count INTEGER DEFAULT 0,
  is_glitch_active BOOLEAN DEFAULT FALSE,
  glitch_transaction_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  last_transaction_time BIGINT,
  value_change_percentage DECIMAL(8,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFT Glitch Transactions table
CREATE TABLE IF NOT EXISTS nft_glitch_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID REFERENCES nft_assets(id),
  original_value DECIMAL(15,2) NOT NULL,
  glitched_value DECIMAL(15,2) NOT NULL,
  multiplier DECIMAL(8,3) NOT NULL,
  glitch_iteration INTEGER NOT NULL,
  quantum_optimization DECIMAL(15,6),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  offramp_amount DECIMAL(15,2),
  offramp_token VARCHAR(10),
  offramp_tx_hash VARCHAR(255),
  offramp_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offramp Transactions table
CREATE TABLE IF NOT EXISTS offramp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  destination_tx_hash VARCHAR(255),
  from_chain VARCHAR(50),
  to_chain VARCHAR(50),
  from_token VARCHAR(10),
  to_token VARCHAR(10) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(15,2) NOT NULL,
  route_type VARCHAR(20) NOT NULL CHECK (route_type IN ('direct', 'bridge')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  estimated_time INTEGER,
  chain VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quantum Tasks table
CREATE TABLE IF NOT EXISTS quantum_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(50) NOT NULL,
  priority INTEGER NOT NULL,
  complexity INTEGER NOT NULL,
  estimated_time INTEGER NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  assigned_nodes TEXT[],
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Quantum Task Performance table
CREATE TABLE IF NOT EXISTS quantum_task_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES quantum_tasks(id),
  task_type VARCHAR(50) NOT NULL,
  assigned_nodes TEXT NOT NULL,
  execution_time INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  profit_generated DECIMAL(15,2) DEFAULT 0,
  efficiency DECIMAL(8,3) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quantum Arbitrage Transactions table
CREATE TABLE IF NOT EXISTS quantum_arbitrage_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES quantum_tasks(id),
  token VARCHAR(20) NOT NULL,
  buy_exchange VARCHAR(50) NOT NULL,
  sell_exchange VARCHAR(50) NOT NULL,
  buy_price DECIMAL(15,8) NOT NULL,
  sell_price DECIMAL(15,8) NOT NULL,
  profit_realized DECIMAL(15,2) NOT NULL,
  fees_paid DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quantum Yield Positions table
CREATE TABLE IF NOT EXISTS quantum_yield_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES quantum_tasks(id),
  pool_id VARCHAR(255) NOT NULL,
  protocol VARCHAR(50) NOT NULL,
  staked_amount DECIMAL(15,2) NOT NULL,
  apy DECIMAL(8,3) NOT NULL,
  daily_yield DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Compliance Logs table
CREATE TABLE IF NOT EXISTS compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL,
  operation_id UUID,
  jurisdiction VARCHAR(10) NOT NULL,
  is_compliant BOOLEAN NOT NULL,
  violations TEXT,
  warnings TEXT,
  risk_score DECIMAL(5,3) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Actions table
CREATE TABLE IF NOT EXISTS emergency_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID,
  action_type VARCHAR(50) NOT NULL,
  trigger_reason VARCHAR(100) NOT NULL,
  health_factor DECIMAL(8,3),
  risk_level DECIMAL(5,3),
  status VARCHAR(20) NOT NULL DEFAULT 'triggered',
  resolved_at TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rebalancing Logs table
CREATE TABLE IF NOT EXISTS rebalancing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES nft_collateral_positions(id),
  nft_id VARCHAR(255) NOT NULL,
  original_health_factor DECIMAL(8,3) NOT NULL,
  new_health_factor DECIMAL(8,3),
  profit_generated DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  strategy_used VARCHAR(100),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master System State table
CREATE TABLE IF NOT EXISTS master_system_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_revenue DECIMAL(15,2) DEFAULT 0,
  daily_loss DECIMAL(15,2) DEFAULT 0,
  risk_accumulator DECIMAL(15,2) DEFAULT 0,
  active_positions INTEGER DEFAULT 0,
  system_efficiency DECIMAL(5,3) DEFAULT 1.0,
  compliance_status VARCHAR(20) DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimization Actions table
CREATE TABLE IF NOT EXISTS optimization_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  position_id UUID,
  original_leverage DECIMAL(8,3),
  target_leverage DECIMAL(8,3),
  scaling_factor DECIMAL(8,3),
  expected_profit DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Position Performance History table
CREATE TABLE IF NOT EXISTS position_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES nft_collateral_positions(id),
  profit DECIMAL(15,2) NOT NULL,
  health_factor DECIMAL(8,3) NOT NULL,
  leverage_ratio DECIMAL(8,3) NOT NULL,
  strategy_used VARCHAR(100),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Data tables for supporting the system

-- NFT Market Data table
CREATE TABLE IF NOT EXISTS nft_market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id VARCHAR(255) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  volatility DECIMAL(8,3) NOT NULL,
  volume DECIMAL(15,2) NOT NULL,
  trend VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Volatility Metrics table
CREATE TABLE IF NOT EXISTS market_volatility_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volatility DECIMAL(8,3) NOT NULL,
  market_type VARCHAR(50) NOT NULL DEFAULT 'general',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DEX Price Feeds table
CREATE TABLE IF NOT EXISTS dex_price_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol VARCHAR(20) NOT NULL,
  exchange VARCHAR(50) NOT NULL,
  price DECIMAL(15,8) NOT NULL,
  liquidity DECIMAL(15,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DeFi Yield Pools table
CREATE TABLE IF NOT EXISTS defi_yield_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol VARCHAR(50) NOT NULL,
  pool_name VARCHAR(100) NOT NULL,
  apy DECIMAL(8,3) NOT NULL,
  total_locked DECIMAL(15,2) NOT NULL,
  reward_rate DECIMAL(15,8) NOT NULL,
  estimated_il DECIMAL(8,3),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token Price History table
CREATE TABLE IF NOT EXISTS token_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol VARCHAR(20) NOT NULL,
  price DECIMAL(15,8) NOT NULL,
  volume DECIMAL(15,2) NOT NULL,
  market_cap DECIMAL(15,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nft_collateral_positions_nft_id ON nft_collateral_positions(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_collateral_positions_status ON nft_collateral_positions(status);
CREATE INDEX IF NOT EXISTS idx_nft_collateral_positions_health_status ON nft_collateral_positions(health_status);

CREATE INDEX IF NOT EXISTS idx_flash_swap_transactions_position_id ON flash_swap_transactions(position_id);
CREATE INDEX IF NOT EXISTS idx_flash_swap_transactions_status ON flash_swap_transactions(status);
CREATE INDEX IF NOT EXISTS idx_flash_swap_transactions_executed_at ON flash_swap_transactions(executed_at);

CREATE INDEX IF NOT EXISTS idx_nft_assets_blockchain ON nft_assets(blockchain);
CREATE INDEX IF NOT EXISTS idx_nft_assets_is_active ON nft_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_nft_assets_is_glitch_active ON nft_assets(is_glitch_active);

CREATE INDEX IF NOT EXISTS idx_nft_glitch_transactions_nft_id ON nft_glitch_transactions(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_glitch_transactions_status ON nft_glitch_transactions(status);

CREATE INDEX IF NOT EXISTS idx_quantum_tasks_status ON quantum_tasks(status);
CREATE INDEX IF NOT EXISTS idx_quantum_tasks_task_type ON quantum_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_quantum_tasks_priority ON quantum_tasks(priority);

CREATE INDEX IF NOT EXISTS idx_quantum_task_performance_task_type ON quantum_task_performance(task_type);
CREATE INDEX IF NOT EXISTS idx_quantum_task_performance_success ON quantum_task_performance(success);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_jurisdiction ON compliance_logs(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_is_compliant ON compliance_logs(is_compliant);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_timestamp ON compliance_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_emergency_actions_status ON emergency_actions(status);
CREATE INDEX IF NOT EXISTS idx_emergency_actions_timestamp ON emergency_actions(timestamp);

CREATE INDEX IF NOT EXISTS idx_market_volatility_metrics_timestamp ON market_volatility_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_dex_price_feeds_token_symbol ON dex_price_feeds(token_symbol);
CREATE INDEX IF NOT EXISTS idx_dex_price_feeds_timestamp ON dex_price_feeds(timestamp);

-- Insert some initial data for testing

-- Market volatility baseline
INSERT INTO market_volatility_metrics (volatility, market_type) VALUES 
(25.5, 'general'),
(30.2, 'crypto'),
(15.8, 'defi'),
(40.1, 'nft');

-- Sample NFT assets
INSERT INTO nft_assets (token_id, contract_address, blockchain, real_world_value) VALUES 
('1', '0x1234567890123456789012345678901234567890', 'ethereum', 1500.00),
('2', '0x2345678901234567890123456789012345678901', 'ethereum', 2200.00),
('3', '0x3456789012345678901234567890123456789012', 'polygon', 850.00),
('4', '0x4567890123456789012345678901234567890123', 'arbitrum', 3200.00);

-- Sample collateral positions
INSERT INTO nft_collateral_positions (nft_id, collateral_value, leverage_ratio, liquidation_threshold, current_health_factor, last_rebalance_time, health_status) VALUES 
('nft_001', 1500.00, 2.0, 1.2, 1.8, extract(epoch from now()) * 1000, 'healthy'),
('nft_002', 2200.00, 3.0, 1.2, 1.4, extract(epoch from now()) * 1000, 'warning'),
('nft_003', 850.00, 1.5, 1.2, 2.2, extract(epoch from now()) * 1000, 'healthy');

-- Sample DEX price feeds
INSERT INTO dex_price_feeds (token_symbol, exchange, price, liquidity) VALUES 
('ETH', 'uniswap', 3245.67, 125000.00),
('ETH', 'sushiswap', 3248.12, 98000.00),
('USDC', 'uniswap', 1.0001, 500000.00),
('USDC', 'curve', 0.9999, 750000.00),
('MATIC', 'quickswap', 0.8234, 45000.00),
('MATIC', 'uniswap', 0.8241, 67000.00);

-- Sample DeFi yield pools
INSERT INTO defi_yield_pools (protocol, pool_name, apy, total_locked, reward_rate) VALUES 
('Aave', 'USDC Lending', 8.5, 125000000.00, 0.000000234),
('Compound', 'ETH Lending', 6.2, 85000000.00, 0.000000178),
('Uniswap', 'ETH/USDC LP', 12.8, 45000000.00, 0.000000456),
('Curve', 'stETH Pool', 15.2, 230000000.00, 0.000000567),
('Yearn', 'USDT Vault', 9.8, 78000000.00, 0.000000298);

-- Sample token price history
INSERT INTO token_price_history (token_symbol, price, volume) VALUES 
('ETH', 3245.67, 1250000.00),
('BTC', 68234.12, 890000.00),
('USDC', 1.0001, 2340000.00),
('MATIC', 0.8234, 156000.00),
('ARB', 1.2345, 234000.00);

COMMENT ON TABLE nft_collateral_positions IS 'Tracks NFT positions used as collateral with leverage and health metrics';
COMMENT ON TABLE flash_swap_transactions IS 'Records flash swap rebalancing transactions for collateral positions';
COMMENT ON TABLE nft_assets IS 'Core NFT asset registry with real-world values and glitch status';
COMMENT ON TABLE nft_glitch_transactions IS 'Tracks infinite glitch activations and their resulting value multiplications';
COMMENT ON TABLE quantum_tasks IS 'Queue of quantum optimization tasks for autonomous execution';
COMMENT ON TABLE compliance_logs IS 'Compliance monitoring logs for regulatory adherence';
COMMENT ON TABLE master_system_state IS 'Overall system state tracking for the orchestration engine';