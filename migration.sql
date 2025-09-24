-- PostgreSQL Migration Script for Click Clack Cash Flow
-- This script migrates from Supabase to open-source PostgreSQL
-- Contains complete schema with indexes, constraints, and initial data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    full_name VARCHAR(255),
    avatar_url TEXT,
    coins BIGINT DEFAULT 0 CHECK (coins >= 0),
    total_earned BIGINT DEFAULT 0 CHECK (total_earned >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- Game states table
CREATE TABLE IF NOT EXISTS game_states (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    energy INTEGER DEFAULT 100 CHECK (energy >= 0 AND energy <= 1000),
    max_energy INTEGER DEFAULT 100 CHECK (max_energy >= 100),
    multiplier DECIMAL(10,2) DEFAULT 1.0 CHECK (multiplier >= 1.0),
    coins BIGINT DEFAULT 0 CHECK (coins >= 0),
    experience INTEGER DEFAULT 0 CHECK (experience >= 0),
    last_energy_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

-- Payout requests table (PCI-compliant - only stores PaymentMethod IDs)
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id VARCHAR(255) NOT NULL, -- Stripe PaymentMethod ID only
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'failed_retryable', 'cancelled')),
    stripe_payout_id VARCHAR(255),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'payout', 'bonus', 'penalty', 'adjustment')),
    amount_cents INTEGER NOT NULL,
    description TEXT,
    reference_id VARCHAR(255), -- External reference (Stripe ID, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Payment methods table (stores Stripe PaymentMethod references)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', etc.
    last_four VARCHAR(4),
    brand VARCHAR(50),
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Autonomous revenue transactions (for automation system)
CREATE TABLE IF NOT EXISTS autonomous_revenue_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    source VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'transferred', 'failed')),
    stripe_transfer_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Agent tasks table (for autonomous agents)
CREATE TABLE IF NOT EXISTS autonomous_agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('payout', 'transfer', 'optimization', 'analytics')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    amount DECIMAL(10,2),
    destination_account VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    stripe_payout_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    error_message TEXT
);

-- Application balance table
CREATE TABLE IF NOT EXISTS application_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'usd',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Financial statements table
CREATE TABLE IF NOT EXISTS financial_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    net_income DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Transaction audit log
CREATE TABLE IF NOT EXISTS transaction_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2),
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_payout_requests_stripe_id ON payout_requests(stripe_payout_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

CREATE INDEX IF NOT EXISTS idx_autonomous_revenue_status ON autonomous_revenue_transactions(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_revenue_created_at ON autonomous_revenue_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON autonomous_agent_tasks(type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON autonomous_agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON autonomous_agent_tasks(created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
    ('coins_to_usd_rate', '100', 'Number of coins equal to 1 USD'),
    ('min_payout_amount_cents', '500', 'Minimum payout amount in cents ($5.00)'),
    ('max_payout_amount_cents', '100000', 'Maximum payout amount in cents ($1000.00)'),
    ('payout_fee_percentage', '0', 'Payout fee as percentage (0-100)'),
    ('energy_max_default', '100', 'Default maximum energy for new users'),
    ('energy_regen_rate', '1', 'Energy regeneration per minute'),
    ('level_up_threshold', '1000', 'Experience points needed for level up')
ON CONFLICT (key) DO NOTHING;

-- Insert default application balance
INSERT INTO application_balance (balance_amount, currency) VALUES (0.00, 'usd')
ON CONFLICT DO NOTHING;

-- Create views for reporting
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.coins,
    u.total_earned,
    gs.level,
    gs.experience,
    COUNT(DISTINCT t.id) as total_transactions,
    COALESCE(SUM(CASE WHEN t.type = 'earn' THEN t.amount_cents ELSE 0 END), 0) as total_earned_cents,
    COALESCE(SUM(CASE WHEN t.type = 'payout' THEN t.amount_cents ELSE 0 END), 0) as total_payout_cents,
    COUNT(DISTINCT CASE WHEN pr.status = 'completed' THEN pr.id END) as successful_payouts,
    COUNT(DISTINCT CASE WHEN pr.status = 'failed' THEN pr.id END) as failed_payouts,
    u.created_at as user_since
FROM users u
LEFT JOIN game_states gs ON u.id = gs.user_id
LEFT JOIN transactions t ON u.id = t.user_id
LEFT JOIN payout_requests pr ON u.id = pr.user_id
GROUP BY u.id, u.email, u.coins, u.total_earned, gs.level, gs.experience, u.created_at;

CREATE OR REPLACE VIEW payout_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    status,
    COUNT(*) as count,
    SUM(amount_cents) as total_amount_cents,
    AVG(amount_cents) as avg_amount_cents
FROM payout_requests
GROUP BY DATE_TRUNC('day', created_at), status
ORDER BY date DESC;

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_user_coins(user_uuid UUID, coin_change BIGINT)
RETURNS TABLE(new_balance BIGINT) AS $$
DECLARE
    new_coins BIGINT;
BEGIN
    UPDATE users 
    SET coins = coins + coin_change, 
        total_earned = CASE 
            WHEN coin_change > 0 THEN total_earned + coin_change 
            ELSE total_earned 
        END,
        updated_at = NOW()
    WHERE id = user_uuid
    RETURNING coins INTO new_coins;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', user_uuid;
    END IF;
    
    -- Insert transaction record
    INSERT INTO transactions (user_id, type, amount_cents, description)
    VALUES (user_uuid, 
            CASE WHEN coin_change > 0 THEN 'earn' ELSE 'payout' END,
            ABS(coin_change),
            CASE WHEN coin_change > 0 THEN 'Coins earned' ELSE 'Coins spent' END);
    
    RETURN QUERY SELECT new_coins;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_payout_request(
    user_uuid UUID,
    payment_method VARCHAR(255),
    amount_in_cents INTEGER,
    payout_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    payout_id UUID;
    user_coins BIGINT;
BEGIN
    -- Check if user has enough coins
    SELECT coins INTO user_coins FROM users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', user_uuid;
    END IF;
    
    -- Convert cents to coins (100 coins = $1 = 100 cents)
    IF user_coins < amount_in_cents THEN
        RAISE EXCEPTION 'Insufficient coins. Required: %, Available: %', amount_in_cents, user_coins;
    END IF;
    
    -- Create payout request
    INSERT INTO payout_requests (user_id, payment_method_id, amount_cents, metadata)
    VALUES (user_uuid, payment_method, amount_in_cents, payout_metadata)
    RETURNING id INTO payout_id;
    
    -- Deduct coins from user (hold them until payout completes)
    PERFORM update_user_coins(user_uuid, -amount_in_cents);
    
    RETURN payout_id;
END;
$$ LANGUAGE plpgsql;

-- Data validation constraints
ALTER TABLE payout_requests ADD CONSTRAINT valid_payment_method_id 
    CHECK (payment_method_id ~ '^(pm_|acct_|ba_|card_)[a-zA-Z0-9]+$');

ALTER TABLE payment_methods ADD CONSTRAINT valid_stripe_payment_method_id
    CHECK (stripe_payment_method_id ~ '^pm_[a-zA-Z0-9]+$');

-- Row-level security (RLS) policies for multi-tenancy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies (can be customized based on authentication system)
CREATE POLICY user_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id', true)::UUID);
CREATE POLICY user_own_game_state ON game_states FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
CREATE POLICY user_own_payouts ON payout_requests FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
CREATE POLICY user_own_transactions ON transactions FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
CREATE POLICY user_own_payment_methods ON payment_methods FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Grant permissions for application role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE current_database() TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Migration completion log
INSERT INTO system_config (key, value, description) VALUES 
    ('migration_version', '1.0.0', 'Current database schema version'),
    ('migration_completed_at', NOW()::TEXT, 'When the migration was completed')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();