-- 010_auto_subscription.sql
-- Phase 4 Hardening: auto-create free subscriptions, secure search_path, backfill
-- Does NOT change business rules, pricing, plans, triggers, or group limits.

-- ============================================================
-- 1. Backfill: insert free subscription for every existing user
--    who does not already have a user_subscriptions row.
--    Idempotent — safe to run once or multiple times.
-- ============================================================
INSERT INTO user_subscriptions (user_id, plan_id, activated_at)
SELECT p.id, 'free', NOW()
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions us WHERE us.user_id = p.id
);

-- ============================================================
-- 2. Trigger function: auto-create free subscription row
--    whenever a new profile is created (e.g. via signup).
--    Uses ON CONFLICT DO NOTHING for idempotency.
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_create_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_id, activated_at)
  VALUES (NEW.id, 'free', NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_free_subscription ON profiles;
CREATE TRIGGER trg_auto_create_free_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_free_subscription();

-- ============================================================
-- 3. Harden get_user_plan() — add explicit search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  plan_icon TEXT,
  max_groups INTEGER,
  price_paise INTEGER,
  features JSONB,
  is_popular BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
-- 4. Harden check_group_limit() — add explicit search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_group_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
