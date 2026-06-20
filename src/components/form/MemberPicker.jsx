import Avatar from '../ui/Avatar';

export default function MemberPicker({ members, selectedIds = [], onChange, label }) {
  const toggle = (userId) => {
    const next = selectedIds.includes(userId)
      ? selectedIds.filter((id) => id !== userId)
      : [...selectedIds, userId];
    onChange(next);
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
      <div className="space-y-1">
        {members.map((member) => {
          const isSelected = selectedIds.includes(member.userId);
          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => toggle(member.userId)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <Avatar name={member.displayName} size="sm" />
              <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700 dark:text-gray-200'}`}>{member.displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
