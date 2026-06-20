-- 005_fix_rls_recursion.sql
-- Fix infinite recursion in RLS policies on group_members
-- Root cause: policies self-referenced group_members via subqueries
-- Solution: replace self-referencing subqueries with:
--   1. SECURITY DEFINER function (bypasses RLS for membership checks)
--   2. splitmate_groups.created_by (for admin checks, no self-reference)

-- ============================================================
-- 1. Create SECURITY DEFINER function for membership checks
-- ============================================================
-- Purpose: Check if a user is a member of a group WITHOUT
--   triggering RLS on group_members (function runs as owner,
--   bypasses RLS entirely). This avoids infinite recursion.
-- Safe: auth.uid() inside the function still returns the
--   calling user's ID (JWT claim is per-request, not per-owner).
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_group_member(group_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = $1
      AND group_members.user_id = $2
  );
$$;

-- ============================================================
-- 2. Drop ALL existing policies (idempotent)
-- ============================================================
DROP POLICY IF EXISTS "Users can view groups they belong to" ON splitmate_groups;
DROP POLICY IF EXISTS "Users can create groups" ON splitmate_groups;
DROP POLICY IF EXISTS "Creators can update their groups" ON splitmate_groups;
DROP POLICY IF EXISTS "Creators can delete their groups" ON splitmate_groups;

DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON group_members;
DROP POLICY IF EXISTS "Users can update own membership" ON group_members;
DROP POLICY IF EXISTS "Users can delete own membership" ON group_members;
DROP POLICY IF EXISTS "Admins can insert guest members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage guest members" ON group_members;

-- ============================================================
-- 3. splitmate_groups RLS policies
-- ============================================================

-- SELECT: users can view groups they created OR are members of
-- Uses is_group_member() (SECURITY DEFINER) to avoid recursing
-- into group_members via subquery.
CREATE POLICY "Users can view groups they belong to"
  ON splitmate_groups FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_group_member(id, auth.uid())
  );

-- INSERT: authenticated user can create a group (themselves as creator)
CREATE POLICY "Users can create groups"
  ON splitmate_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: creator can update group details
CREATE POLICY "Creators can update their groups"
  ON splitmate_groups FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- DELETE: creator can delete the group
CREATE POLICY "Creators can delete their groups"
  ON splitmate_groups FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- 4. group_members RLS policies
-- ============================================================

-- SELECT: members can see all members of groups they belong to
-- Uses splitmate_groups.created_by (no self-reference) AND
-- is_group_member() (SECURITY DEFINER, bypasses RLS).
-- No subquery on group_members within a group_members policy.
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM splitmate_groups
      WHERE splitmate_groups.id = group_id
      AND (
        splitmate_groups.created_by = auth.uid()
        OR is_group_member(splitmate_groups.id, auth.uid())
      )
    )
  );

-- INSERT: user can insert own membership (joining via invitation)
-- No self-reference. Checks auth.uid() = user_id directly.
CREATE POLICY "Users can insert own membership"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- INSERT: admin can insert guest members
-- Admin check via splitmate_groups.created_by (no self-reference).
-- Guest rows have user_id IS NULL and is_registered = FALSE.
CREATE POLICY "Admins can insert guest members"
  ON group_members FOR INSERT
  WITH CHECK (
    user_id IS NULL
    AND is_registered = FALSE
    AND EXISTS (
      SELECT 1 FROM splitmate_groups
      WHERE splitmate_groups.id = group_id
      AND splitmate_groups.created_by = auth.uid()
    )
  );

-- UPDATE: user can update own membership row
CREATE POLICY "Users can update own membership"
  ON group_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: admin can manage guest members
-- Admin check via splitmate_groups.created_by (no self-reference).
-- Only applies to guest rows (user_id IS NULL, is_registered = FALSE).
CREATE POLICY "Admins can manage guest members"
  ON group_members FOR UPDATE
  USING (
    user_id IS NULL
    AND is_registered = FALSE
    AND EXISTS (
      SELECT 1 FROM splitmate_groups
      WHERE splitmate_groups.id = group_id
      AND splitmate_groups.created_by = auth.uid()
    )
  )
  WITH CHECK (
    user_id IS NULL
    AND is_registered = FALSE
  );

-- DELETE: user can delete own membership (leave group)
CREATE POLICY "Users can delete own membership"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);
