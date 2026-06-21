-- 009_subscriptions.sql
-- Phase 4: Subscription system with lifetime plans (free / starter / premium)
-- Only splitmate_groups.created_by counts toward group limits (not invited groups)

-- ============================================================
-- 1. plans table (static seed data)
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  price_paise INTEGER NOT NULL DEFAULT 0,
  max_groups INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  popular BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================
-- 2. user_subscriptions (one row per user, upserted on upgrade)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  payment_id UUID,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- ============================================================
-- 3. payments table (supports refunds, retries, upgrade history)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  gateway_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- ============================================================
-- 5. Enable RLS
-- ============================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Drop existing policies (idempotent)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view plans" ON plans;
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;

-- ============================================================
-- 7. RLS policies
-- ============================================================
CREATE POLICY "Anyone can view plans"
  ON plans FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. Seed plan definitions
-- ============================================================
INSERT INTO plans (id, name, icon, price_paise, max_groups, features, popular) VALUES
  ('free', 'Free', '🎁', 0, 2, '["Create up to 2 groups","Add unlimited members","Track expenses","Equal split","Settle up","Dark mode"]', false),
  ('starter', 'Starter', '🚀', 4900, 10, '["Everything in Free, plus:","Create up to 10 groups"]', false),
  ('premium', 'Premium', '👑', 14900, -1, '["Everything in Starter, plus:","Unlimited groups"]', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  price_paise = EXCLUDED.price_paise,
  max_groups = EXCLUDED.max_groups,
  features = EXCLUDED.features,
  popular = EXCLUDED.popular;

-- ============================================================
-- 9. get_user_plan() SECURITY DEFINER function
-- Returns plan for a given user (defaults to 'free' if no subscription)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  plan_icon TEXT,
  max_groups INTEGER,
  price_paise INTEGER,
  features JSONB,
  is_popular BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan_id TEXT;
BEGIN
  SELECT COALESCE(us.plan_id, 'free') INTO v_plan_id
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.icon,
    p.max_groups,
    p.price_paise,
    p.features,
    p.popular
  FROM plans p
  WHERE p.id = COALESCE(v_plan_id, 'free');
END;
$$;

-- ============================================================
-- 10. check_group_limit() trigger function
-- Blocks INSERT if user has reached their plan's group creation limit
-- Only counts groups where splitmate_groups.created_by = current user
-- Returns HINT = 'upgrade_required' for frontend to detect
-- ============================================================
CREATE OR REPLACE FUNCTION check_group_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_groups INTEGER;
  v_current_count INTEGER;
BEGIN
  SELECT p.max_groups INTO v_max_groups
  FROM get_user_plan(NEW.created_by) p;

  -- max_groups = -1 means unlimited (premium)
  IF v_max_groups = -1 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_current_count
  FROM splitmate_groups
  WHERE created_by = NEW.created_by;

  IF v_current_count >= v_max_groups THEN
    RAISE EXCEPTION 'Group limit reached. Upgrade your plan to create more groups.'
      USING HINT = 'upgrade_required';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 11. Apply trigger to splitmate_groups
-- ============================================================
DROP TRIGGER IF EXISTS trg_check_group_limit ON splitmate_groups;
CREATE TRIGGER trg_check_group_limit
  BEFORE INSERT ON splitmate_groups
  FOR EACH ROW
  EXECUTE FUNCTION check_group_limit();
