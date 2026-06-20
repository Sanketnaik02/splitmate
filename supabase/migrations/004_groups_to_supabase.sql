-- Phase 1: Create shared group tables
-- Does NOT modify group_invitations, profiles, or any existing tables
-- Idempotent: safe to run multiple times

-- 1. Create splitmate_groups table
CREATE TABLE IF NOT EXISTS splitmate_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'INR',
  invite_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES splitmate_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_registered BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_splitmate_groups_created_by ON splitmate_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_registered_unique
  ON group_members(group_id, user_id)
  WHERE user_id IS NOT NULL;

-- 4. Enable RLS
ALTER TABLE splitmate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies for idempotency
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

-- 6. splitmate_groups RLS policies
CREATE POLICY "Users can view groups they belong to"
  ON splitmate_groups FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON splitmate_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their groups"
  ON splitmate_groups FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can delete their groups"
  ON splitmate_groups FOR DELETE
  USING (auth.uid() = created_by);

-- 7. group_members RLS policies
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own membership"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON group_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own membership"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert guest members"
  ON group_members FOR INSERT
  WITH CHECK (
    user_id IS NULL
    AND is_registered = FALSE
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage guest members"
  ON group_members FOR UPDATE
  USING (
    user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  )
  WITH CHECK (
    user_id IS NULL
    AND is_registered = FALSE
  );
