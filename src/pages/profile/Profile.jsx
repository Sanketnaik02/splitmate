import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const menuItems = [
  { id: 'edit', label: 'Edit Profile', icon: '✏️', color: 'bg-blue-50' },
  { id: 'help', label: 'Help & Support', icon: '❓', color: 'bg-gray-50' },
  { id: 'privacy', label: 'Privacy Policy', icon: '⚖️', color: 'bg-gray-50' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleMenu = (id) => {
    if (id === 'edit') navigate('/profile/edit');
    if (id === 'help') alert('SplitMate — Split expenses, not friendships.\n\nBuilt with React + Vite + Tailwind CSS.\nLocal storage powered.');
    if (id === 'privacy') alert('Your data is stored locally on this device. No data is sent to any server.');
  };

  return (
    <AppLayout userName={user?.displayName || 'User'} userAvatar={user?.photoURL}>
      <div className="pt-1">
        <div className="flex flex-col items-center py-6">
          <Avatar src={user?.photoURL} name={user?.displayName} size="xl" />
          <h2 className="text-xl font-bold text-gray-900 mt-3">{user?.displayName}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenu(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-50 rounded-xl shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center text-base`}>{item.icon}</div>
              <span className="text-sm font-medium text-gray-900 flex-1 text-left">{item.label}</span>
              <svg className="text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="w-full mt-4 py-3 bg-white dark:bg-gray-50 rounded-xl shadow-sm flex items-center justify-center gap-2 text-gray-700 dark:text-gray-200 font-medium active:scale-[0.99] transition-transform"
        >
          <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={signOut}
          className="w-full mt-4 py-3 bg-white dark:bg-gray-50 rounded-xl shadow-sm flex items-center justify-center gap-2 text-red-600 font-medium active:scale-[0.99] transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">SplitMate v1.0.0 · Local Storage</p>
      </div>
    </AppLayout>
  );
}
