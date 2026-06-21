-- 007_expenses_and_splits.sql
-- Phase 2: Expense + expense_split tables
-- Relational schema: both paid_by_member_id and expense_splits.member_id
-- reference group_members(id) to support registered + guest members uniformly

-- ============================================================
-- 1. expenses table
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES splitmate_groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'food',
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_by_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  split_type TEXT NOT NULL DEFAULT 'equal',
  date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. expense_splits table
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  share_amount NUMERIC(10,2) NOT NULL CHECK (share_amount > 0)
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_member ON expenses(paid_by_member_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON expense_splits(member_id);

-- ============================================================
-- 4. Enable RLS
-- ============================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Drop existing policies (idempotent)
-- ============================================================
DROP POLICY IF EXISTS "Members can view expenses" ON expenses;
DROP POLICY IF EXISTS "Members can create expenses" ON expenses;
DROP POLICY IF EXISTS "Members can update expenses" ON expenses;
DROP POLICY IF EXISTS "Members can delete expenses" ON expenses;

DROP POLICY IF EXISTS "Members can view expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Members can create expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Members can update expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Members can delete expense splits" ON expense_splits;

-- ============================================================
-- 6. expenses RLS policies
-- ============================================================

-- SELECT: members of the group (or group creator) can view expenses
CREATE POLICY "Members can view expenses"
  ON expenses FOR SELECT
  USING (
    is_group_member(group_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM splitmate_groups
      WHERE id = group_id AND created_by = auth.uid()
    )
  );

-- INSERT: group member can create expense (must be themselves)
CREATE POLICY "Members can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND is_group_member(group_id, auth.uid())
  );

-- UPDATE: group member can update any expense in the group
CREATE POLICY "Members can update expenses"
  ON expenses FOR UPDATE
  USING (is_group_member(group_id, auth.uid()))
  WITH CHECK (is_group_member(group_id, auth.uid()));

-- DELETE: group member can delete any expense in the group
CREATE POLICY "Members can delete expenses"
  ON expenses FOR DELETE
  USING (is_group_member(group_id, auth.uid()));

-- ============================================================
-- 7. expense_splits RLS policies
-- ============================================================

-- SELECT: members of the parent expense's group can view splits
CREATE POLICY "Members can view expense splits"
  ON expense_splits FOR SELECT
  USING (
    is_group_member(
      (SELECT group_id FROM expenses WHERE id = expense_id),
      auth.uid()
    )
  );

-- INSERT: group member can create splits for expenses in their group
CREATE POLICY "Members can create expense splits"
  ON expense_splits FOR INSERT
  WITH CHECK (
    is_group_member(
      (SELECT group_id FROM expenses WHERE id = expense_id),
      auth.uid()
    )
  );

-- UPDATE: same as insert
CREATE POLICY "Members can update expense splits"
  ON expense_splits FOR UPDATE
  USING (
    is_group_member(
      (SELECT group_id FROM expenses WHERE id = expense_id),
      auth.uid()
    )
  )
  WITH CHECK (
    is_group_member(
      (SELECT group_id FROM expenses WHERE id = expense_id),
      auth.uid()
    )
  );

-- DELETE: same as insert
CREATE POLICY "Members can delete expense splits"
  ON expense_splits FOR DELETE
  USING (
    is_group_member(
      (SELECT group_id FROM expenses WHERE id = expense_id),
      auth.uid()
    )
  );
