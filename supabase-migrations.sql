-- Migration: Add subscription plans, pre-bills, and surveys tables
-- Run this in Supabase SQL Editor

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  max_tables INTEGER DEFAULT 10,
  max_products INTEGER DEFAULT 50,
  max_people_per_table INTEGER DEFAULT 4,
  has_paper_prebill BOOLEAN DEFAULT TRUE,
  has_paper_command BOOLEAN DEFAULT TRUE,
  has_surveys BOOLEAN DEFAULT FALSE,
  has_analytics BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can do everything
CREATE POLICY "SuperAdmin full access to subscription_plans"
  ON subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- All authenticated users can view active plans
CREATE POLICY "View active subscription plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = TRUE);

-- ============================================================================
-- TENANT SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  custom_max_tables INTEGER,
  custom_max_products INTEGER,
  custom_max_people INTEGER,
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Add RLS policies for tenant_subscriptions
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can do everything
CREATE POLICY "SuperAdmin full access to tenant_subscriptions"
  ON tenant_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Tenant admins can view their own subscription
CREATE POLICY "Tenant admin view own subscription"
  ON tenant_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.tenant_id = tenant_subscriptions.tenant_id
    )
  );

-- ============================================================================
-- PRE-BILLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pre_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  table_session_id UUID REFERENCES table_sessions(id) ON DELETE SET NULL,
  table_number VARCHAR(20),
  waiter_name VARCHAR(100),
  guest_count INTEGER DEFAULT 1,
  subtotal DECIMAL(10, 2) NOT NULL,
  tip_percentage DECIMAL(5, 2) NOT NULL,
  tip_amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for pre_bills
ALTER TABLE pre_bills ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can do everything
CREATE POLICY "SuperAdmin full access to pre_bills"
  ON pre_bills
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Tenant users can manage their own pre-bills
CREATE POLICY "Tenant users manage own pre_bills"
  ON pre_bills
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.tenant_id = pre_bills.tenant_id
    )
  );

-- ============================================================================
-- SURVEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  survey_url TEXT,
  benefit_text TEXT,
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Add RLS policies for surveys
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can do everything
CREATE POLICY "SuperAdmin full access to surveys"
  ON surveys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Tenant admins can manage their own surveys
CREATE POLICY "Tenant admin manage own surveys"
  ON surveys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.tenant_id = surveys.tenant_id
    )
  );

-- ============================================================================
-- SURVEY RESPONSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pre_bill_id UUID REFERENCES pre_bills(id) ON DELETE SET NULL,
  response_data JSONB,
  customer_name VARCHAR(200),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for survey_responses
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can do everything
CREATE POLICY "SuperAdmin full access to survey_responses"
  ON survey_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Tenant admins can view their own survey responses
CREATE POLICY "Tenant admin view own survey_responses"
  ON survey_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.tenant_id = survey_responses.tenant_id
    )
  );

-- Anyone can submit a survey response (public endpoint)
CREATE POLICY "Public can submit survey responses"
  ON survey_responses
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

-- Add new columns to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tip_percentage DECIMAL(5, 2) DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS show_survey BOOLEAN DEFAULT FALSE;

-- Add new columns to tables table
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 4;

-- Add new columns to table_sessions table
ALTER TABLE table_sessions
  ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan_id ON tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_pre_bills_tenant_id ON pre_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pre_bills_order_id ON pre_bills(order_id);
CREATE INDEX IF NOT EXISTS idx_pre_bills_generated_at ON pre_bills(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_tenant_id ON surveys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_tenant_id ON survey_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at DESC);

-- ============================================================================
-- INSERT SAMPLE SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (name, description, price, max_tables, max_products, max_people_per_table, has_paper_prebill, has_paper_command, has_surveys, has_analytics, is_active)
VALUES
  ('Plan Básico', 'Ideal para comenzar', 0, 5, 20, 4, FALSE, FALSE, FALSE, FALSE, TRUE),
  ('Plan Estándar', 'Para cafeterías pequeñas', 29990, 10, 50, 4, TRUE, TRUE, FALSE, FALSE, TRUE),
  ('Plan Pro', 'Para restaurantes medianos', 59990, 25, 150, 6, TRUE, TRUE, TRUE, TRUE, TRUE),
  ('Plan Enterprise', 'Solución completa sin límites', 99990, 100, 500, 10, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- All done! You can now use the subscription system.
