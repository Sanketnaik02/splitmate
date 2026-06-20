-- Recovery migration: safely completes 002_invitations_and_profile.sql
-- Idempotent: creates only what is missing, never recreates existing objects

-- 1. Add columns to profiles (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS splitmate_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- 2. Create sequence for SplitMate ID generation (idempotent)
CREATE SEQUENCE IF NOT EXISTS splitmate_id_seq START 1;

-- 3. Function to generate next SplitMate ID atomically (idempotent)
CREATE OR REPLACE FUNCTION generate_splitmate_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('splitmate_id_seq');
  RETURN 'SM' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- 4. Backfill splitmate_id for existing profiles that don't have one
UPDATE profiles
SET splitmate_id = generate_splitmate_id()
WHERE splitmate_id IS NULL;

-- 5. Create index on splitmate_id (idempotent)
CREATE INDEX IF NOT EXISTS idx_profiles_splitmate_id ON profiles(splitmate_id);

-- 6. Create group_invitations table only if missing
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Indexes for group_invitations (idempotent)
CREATE INDEX IF NOT EXISTS idx_invitations_receiver ON group_invitations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_invitations_group ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_sender_receiver ON group_invitations(sender_id, receiver_id, status);

-- 8. Enable RLS on group_invitations (idempotent, safe to run multiple times)
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies only if they do not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_invitations' AND policyname = 'Users can view own invitations'
  ) THEN
    CREATE POLICY "Users can view own invitations"
      ON group_invitations FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_invitations' AND policyname = 'Users can send invitations'
  ) THEN
    CREATE POLICY "Users can send invitations"
      ON group_invitations FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_invitations' AND policyname = 'Users can update received invitations'
  ) THEN
    CREATE POLICY "Users can update received invitations"
      ON group_invitations FOR UPDATE
      USING (auth.uid() = receiver_id)
      WITH CHECK (auth.uid() = receiver_id);
  END IF;
END;
$$;

-- 10. Update handle_new_user function to generate splitmate_id on signup (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, phone, splitmate_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    '',
    generate_splitmate_id()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    splitmate_id = COALESCE(profiles.splitmate_id, EXCLUDED.splitmate_id);
  RETURN NEW;
END;
$$;

-- 11. Recreate trigger to ensure it calls the latest handle_new_user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
