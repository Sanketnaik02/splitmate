import { store } from './storage';

export function getDisplayName(uid, members = []) {
  const member = members.find((m) => String(m.userId) === String(uid));
  console.log('[getDisplayName] lookup:', { uid, uidType: typeof uid, uidLength: uid?.length, memberFound: !!member, memberUserId: member?.userId, memberUserIdType: typeof member?.userId, memberId: member?.id, memberDisplayName: member?.displayName, allMemberUserIds: members.map(m => ({ userId: m.userId, userIdType: typeof m.userId, id: m.id, displayName: m.displayName })) });
  if (member?.displayName) return member.displayName;

  const user = store.get('users', uid);
  if (user?.displayName) return user.displayName;

  return 'Unknown User';
}
