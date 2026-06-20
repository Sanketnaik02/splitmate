-- 006_backfill_display_name.sql
-- Fix group_members.display_name that incorrectly stored UUID instead of the user's display name.
-- Bug: groupService.createGroup() passed createdBy (the UUID) as display_name.

-- Backfill: set display_name from profiles.display_name where display_name is a UUID match
UPDATE group_members
SET display_name = profiles.display_name
FROM profiles
WHERE group_members.user_id = profiles.id
  AND group_members.display_name = profiles.id::text;
