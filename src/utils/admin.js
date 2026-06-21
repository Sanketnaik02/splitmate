import { ADMIN_EMAILS } from '../config/constants';

/**
 * isAdmin — production-safe admin email check.
 *
 * Uses exact, case-insensitive comparison only.
 * No substring, startsWith, endsWith, or regex matching.
 *
 * Future migration path (database-backed roles):
 *   CREATE TABLE admin_users (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 *     role TEXT NOT NULL CHECK (role IN ('founder', 'admin')),
 *     created_by UUID REFERENCES profiles(id),
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   Then query: SELECT 1 FROM admin_users WHERE user_id = $1 AND role IN ('founder', 'admin')
 */
export function isAdmin(email) {
  if (email === null || email === undefined || email === '') {
    return false;
  }

  return ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase()
  );
}
