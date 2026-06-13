import Avatar from '../ui/Avatar';

export default function TopNav({ userName = 'Guest', userAvatar, onAvatarClick, onSettingsClick }) {
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <header className="sticky top-0 bg-surface-secondary z-30">
      <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3" onClick={onAvatarClick}>
          <Avatar src={userAvatar} name={userName} size="md" />
          <div>
            <p className="text-xs text-gray-500 font-medium">{greeting}</p>
            <h1 className="text-lg font-bold text-gray-900 -mt-0.5">{userName}</h1>
          </div>
        </div>
        <button
          onClick={onSettingsClick}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </header>
  );
}
