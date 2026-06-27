-- 012_admin_audit.sql
-- Admin subscription management + audit logging.
--
-- Creates:
--   1. public.is_admin(uid) — checks if a user is the founder by email
--   2. admin_actions table — audit trail for admin operations
--   3. RLS on admin_actions (admin-only insert/select)
--   4. RLS updates to profiles (admin select all)
--   5. RLS updates to user_subscriptions (admin select/update all)
--   6. Modifies public.get_user_plan() — returns unlimited for founder
--
-- Idempotent: safe to run multiple times.

-- ============================================================
-- 1. is_admin() helper function
--    Used by RLS policies and backend logic to identify founder.
--    Single source of truth: email match against splitmate02@gmail.com.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid
    AND LOWER(email) = LOWER('splitmate02@gmail.com')
  );
END;
$$;

-- ============================================================
-- 2. admin_actions table — audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by admin or target user
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at DESC);

-- ============================================================
-- 3. RLS on admin_actions
-- ============================================================
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert audit actions" ON admin_actions;
CREATE POLICY "Admins can insert audit actions"
  ON admin_actions FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view audit actions" ON admin_actions;
CREATE POLICY "Admins can view audit actions"
  ON admin_actions FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 4. RLS: Allow admin to SELECT all profiles
--    Existing policy "Users can view own profile" remains unchanged.
--    This additional policy grants the founder read access to all profiles
--    for the user management UI.
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 5. RLS: Allow admin to SELECT and UPDATE any user_subscription
--    Existing user-scoped policies remain unchanged.
--    These additional policies grant the founder full access.
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can update all subscriptions"
  ON user_subscriptions FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow admin to insert subscription rows for any user
DROP POLICY IF EXISTS "Admins can insert any subscription" ON user_subscriptions;
CREATE POLICY "Admins can insert any subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 6. Modify get_user_plan to return unlimited for founder
--    Uses public schema path via search_path.
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
  -- Founder always gets unlimited access
  IF public.is_admin(p_user_id) THEN
    RETURN QUERY SELECT
      'premium'::TEXT,
      'Premium'::TEXT,
      '👑'::TEXT,
      -1::INTEGER,
      0::INTEGER,
      '["Unlimited groups", "All features"]'::JSONB,
      true::BOOLEAN;
    RETURN;
  END IF;

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
-- 7. Verification queries (copy-paste into Supabase SQL Editor)
-- ============================================================

-- 7a. Confirm is_admin() works for founder
-- SELECT public.is_admin('REPLACE_WITH_FOUNDER_UUID');
-- Expected: true

-- 7b. Confirm is_admin() returns false for non-founder
-- SELECT public.is_admin('REPLACE_WITH_RANDOM_UUID');
-- Expected: false

-- 7c. Confirm admin_actions table exists
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'admin_actions';
-- Expected: id, admin_id, target_user_id, action, old_value, new_value, created_at

-- 7d. Confirm founder gets unlimited plan
-- SELECT * FROM public.get_user_plan('REPLACE_WITH_FOUNDER_UUID');
-- Expected: plan_id = 'premium', max_groups = -1

-- 7e. Confirm normal user gets their assigned plan
-- SELECT * FROM public.get_user_plan('REPLACE_WITH_USER_UUID');
-- Expected: plan_id matches their subscription or 'free' if none

-- ============================================================
-- 8. Rollback
-- ============================================================
-- Run in Supabase SQL Editor:
--
-- DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
-- DROP POLICY IF EXISTS "Admins can update all subscriptions" ON user_subscriptions;
-- DROP POLICY IF EXISTS "Admins can insert any subscription" ON user_subscriptions;
-- DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
-- DROP POLICY IF EXISTS "Admins can insert audit actions" ON admin_actions;
-- DROP POLICY IF EXISTS "Admins can view audit actions" ON admin_actions;
-- DROP TABLE IF EXISTS admin_actions;
-- DROP FUNCTION IF EXISTS public.is_admin(UUID);
-- Re-run the original get_user_plan from 010_auto_subscription.sql to restore.
