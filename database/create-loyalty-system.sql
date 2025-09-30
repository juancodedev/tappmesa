-- ====================================================================
-- LOYALTY SYSTEM DATABASE SCHEMA
-- Includes: Programs, Customer Progress, Coupons, Rewards, Campaigns
-- ====================================================================

-- 1. LOYALTY PROGRAMS TABLE
-- Different types: points, visits, stamp_card
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  program_type VARCHAR NOT NULL CHECK (program_type IN ('points', 'visits', 'stamp_card')),

  -- Points configuration
  points_per_dollar DECIMAL(10,2), -- e.g., 1 point per $100
  points_per_visit INT, -- fixed points per visit

  -- Visit/Stamp card configuration
  visits_required INT, -- e.g., "buy 10, get 1 free"
  reward_description VARCHAR, -- e.g., "Free coffee"

  -- Redemption
  points_to_redeem INT, -- points needed to get reward
  discount_type VARCHAR CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item', null)),
  discount_value DECIMAL(10,2),

  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT loyalty_programs_tenant_name_unique UNIQUE (tenant_id, name)
);

-- 2. CUSTOMER LOYALTY PROGRESS
-- Tracks each customer's progress in each program
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Progress tracking
  current_points INT DEFAULT 0,
  total_points_earned INT DEFAULT 0,
  current_visits INT DEFAULT 0,
  total_visits INT DEFAULT 0,

  -- Stamps for stamp cards
  current_stamps INT DEFAULT 0,

  -- Rewards redeemed
  rewards_redeemed INT DEFAULT 0,
  last_reward_date TIMESTAMPTZ,

  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT customer_loyalty_unique UNIQUE (customer_id, program_id)
);

-- 3. COUPONS TABLE
-- Store available coupons and promotions
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,

  -- Discount details
  discount_type VARCHAR NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item', 'buy_x_get_y')),
  discount_value DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2), -- max discount for percentage coupons

  -- Conditions
  min_purchase_amount DECIMAL(10,2),
  applicable_to VARCHAR, -- 'all', 'category', 'product'
  applicable_ids UUID[], -- array of category or product IDs

  -- Usage limits
  usage_limit INT, -- total uses allowed
  usage_count INT DEFAULT 0, -- times used
  usage_per_customer INT DEFAULT 1, -- max uses per customer

  -- Validity
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER COUPONS (assigned/earned coupons)
-- Track which coupons have been assigned to which customers
CREATE TABLE IF NOT EXISTS customer_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Assignment
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by VARCHAR, -- 'system', 'admin', 'campaign'
  assigned_reason VARCHAR, -- e.g., 'loyalty_reward', 'birthday', 'campaign_abc'

  -- Usage
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  order_id UUID REFERENCES orders(id),

  -- Expiration
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT customer_coupons_unique UNIQUE (customer_id, coupon_id, id)
);

-- 5. LOYALTY TRANSACTIONS
-- Log all loyalty point/visit transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID NOT NULL REFERENCES customer_loyalty(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust')),

  -- Points/visits
  points_change INT DEFAULT 0,
  visits_change INT DEFAULT 0,
  stamps_change INT DEFAULT 0,

  -- Reference
  order_id UUID REFERENCES orders(id),
  coupon_id UUID REFERENCES coupons(id),

  -- Details
  description VARCHAR,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR -- 'system', 'admin_user_id', etc.
);

-- 6. MARKETING CAMPAIGNS
-- Track marketing campaigns sent to customers
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name VARCHAR NOT NULL,
  description TEXT,
  campaign_type VARCHAR CHECK (campaign_type IN ('sms', 'email', 'whatsapp', 'push')),

  -- Content
  subject VARCHAR,
  message TEXT NOT NULL,

  -- Targeting
  target_audience VARCHAR NOT NULL CHECK (target_audience IN ('all', 'vip', 'inactive', 'high_spenders', 'custom')),
  custom_filter JSON, -- custom filtering criteria

  -- Coupon assignment
  coupon_id UUID REFERENCES coupons(id), -- automatically assign this coupon

  -- Scheduling
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Stats
  recipients_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CAMPAIGN RECIPIENTS
-- Track individual campaign sends
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Delivery status
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Engagement
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT campaign_recipients_unique UNIQUE (campaign_id, customer_id)
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_tenant ON loyalty_programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_active ON loyalty_programs(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer ON customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_program ON customer_loyalty(program_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_tenant ON customer_loyalty(tenant_id);

CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_customer_coupons_customer ON customer_coupons(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_coupon ON customer_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_customer_coupons_unused ON customer_coupons(customer_id, is_used);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_loyalty ON loyalty_transactions(customer_loyalty_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON marketing_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON campaign_recipients(customer_id);

-- ====================================================================
-- FUNCTIONS
-- ====================================================================

-- Function to add loyalty points when an order is placed
CREATE OR REPLACE FUNCTION add_loyalty_points_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_program_id UUID;
  v_points_to_add INT;
  v_customer_loyalty_id UUID;
BEGIN
  -- Find customer by phone
  SELECT id INTO v_customer_id
  FROM customers
  WHERE phone = NEW.customer_phone AND tenant_id = NEW.tenant_id;

  IF v_customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find active points-based loyalty program
  SELECT id, points_per_dollar, points_per_visit INTO v_program_id, v_points_to_add
  FROM loyalty_programs
  WHERE tenant_id = NEW.tenant_id
    AND program_type = 'points'
    AND is_active = true
  LIMIT 1;

  IF v_program_id IS NOT NULL THEN
    -- Calculate points (1 point per dollar by default)
    IF v_points_to_add IS NOT NULL THEN
      v_points_to_add := FLOOR(NEW.total * v_points_to_add);
    ELSE
      v_points_to_add := FLOOR(NEW.total / 100); -- 1 point per $100
    END IF;

    -- Get or create customer loyalty record
    INSERT INTO customer_loyalty (customer_id, program_id, tenant_id, current_points, total_points_earned, current_visits, total_visits)
    VALUES (v_customer_id, v_program_id, NEW.tenant_id, v_points_to_add, v_points_to_add, 1, 1)
    ON CONFLICT (customer_id, program_id)
    DO UPDATE SET
      current_points = customer_loyalty.current_points + v_points_to_add,
      total_points_earned = customer_loyalty.total_points_earned + v_points_to_add,
      current_visits = customer_loyalty.current_visits + 1,
      total_visits = customer_loyalty.total_visits + 1,
      last_activity = NOW(),
      updated_at = NOW()
    RETURNING id INTO v_customer_loyalty_id;

    -- Log transaction
    INSERT INTO loyalty_transactions (customer_loyalty_id, tenant_id, transaction_type, points_change, visits_change, order_id, description)
    VALUES (v_customer_loyalty_id, NEW.tenant_id, 'earn', v_points_to_add, 1, NEW.id, 'Points earned from order ' || NEW.order_number);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add loyalty points when order is confirmed
DROP TRIGGER IF EXISTS trigger_add_loyalty_points ON orders;
CREATE TRIGGER trigger_add_loyalty_points
AFTER INSERT ON orders
FOR EACH ROW
WHEN (NEW.status = 'confirmed' OR NEW.status = 'pending')
EXECUTE FUNCTION add_loyalty_points_on_order();

-- ====================================================================
-- ROW LEVEL SECURITY
-- ====================================================================

ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Policies for loyalty_programs
CREATE POLICY "Allow tenant admins to manage loyalty programs"
  ON loyalty_programs FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid()));

-- Policies for customer_loyalty
CREATE POLICY "Allow tenant admins to view customer loyalty"
  ON customer_loyalty FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid()));

-- Policies for coupons
CREATE POLICY "Allow tenant admins to manage coupons"
  ON coupons FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid()));

-- Policies for customer_coupons
CREATE POLICY "Allow tenant admins to manage customer coupons"
  ON customer_coupons FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid()));

-- Policies for loyalty_transactions
CREATE POLICY "Allow tenant admins to view loyalty transactions"
  ON loyalty_transactions FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid()));

-- Policies for marketing_campaigns
CREATE POLICY "Allow tenant admins to manage campaigns"
  ON marketing_campaigns FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid()));

-- Policies for campaign_recipients
CREATE POLICY "Allow tenant admins to view campaign recipients"
  ON campaign_recipients FOR SELECT
  USING (campaign_id IN (SELECT id FROM marketing_campaigns WHERE tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid())));

-- ====================================================================
-- COMMENTS
-- ====================================================================

COMMENT ON TABLE loyalty_programs IS 'Different loyalty program configurations per tenant';
COMMENT ON TABLE customer_loyalty IS 'Tracks customer progress in each loyalty program';
COMMENT ON TABLE coupons IS 'Available coupons and promotional codes';
COMMENT ON TABLE customer_coupons IS 'Coupons assigned to specific customers';
COMMENT ON TABLE loyalty_transactions IS 'Audit log of all loyalty point/visit transactions';
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaigns for customer engagement';
COMMENT ON TABLE campaign_recipients IS 'Individual campaign delivery tracking';