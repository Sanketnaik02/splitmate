import { store } from './storage';

export function getDisplayName(uid, members = []) {
  const member = members.find((m) => String(m.userId) === String(uid));
  if (member?.displayName) return member.displayName;

  const user = store.get('users', uid);
  if (user?.displayName) return user.displayName;

  return 'Unknown User';
}
