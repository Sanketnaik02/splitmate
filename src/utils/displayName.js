import { store } from './storage';

export function getDisplayName(uid, members = []) {
  const member = members.find((m) => m.userId === uid);
  if (member?.displayName) return member.displayName;

  const user = store.get('users', uid);
  if (user?.displayName) return user.displayName;

  return 'Unknown User';
}
