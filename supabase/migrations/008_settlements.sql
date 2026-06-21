-- 008_settlements.sql
-- Phase 3: Settlements table
-- from_member_id / to_member_id reference group_members(id)
-- Aligned with expenses.paid_by_member_id and expense_splits.member_id

-- ============================================================
-- 1. settlements table
-- ============================================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES splitmate_groups(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_member ON settlements(from_member_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_member ON settlements(to_member_id);

-- ============================================================
-- 3. Enable RLS
-- ============================================================
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Drop existing policies (idempotent)
-- ============================================================
DROP POLICY IF EXISTS "Members can view settlements" ON settlements;
DROP POLICY IF EXISTS "Members can create settlements" ON settlements;
DROP POLICY IF EXISTS "Members can update settlements" ON settlements;
DROP POLICY IF EXISTS "Members can delete settlements" ON settlements;

-- ============================================================
-- 5. settlements RLS policies
-- ============================================================

-- SELECT: members of the group can view settlements
CREATE POLICY "Members can view settlements"
  ON settlements FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- INSERT: group member can create settlement (must be themselves)
CREATE POLICY "Members can create settlements"
  ON settlements FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND is_group_member(group_id, auth.uid())
  );

-- UPDATE: group member can update any settlement in the group
CREATE POLICY "Members can update settlements"
  ON settlements FOR UPDATE
  USING (is_group_member(group_id, auth.uid()))
  WITH CHECK (is_group_member(group_id, auth.uid()));

-- DELETE: group member can delete any settlement in the group
CREATE POLICY "Members can delete settlements"
  ON settlements FOR DELETE
  USING (is_group_member(group_id, auth.uid()));
