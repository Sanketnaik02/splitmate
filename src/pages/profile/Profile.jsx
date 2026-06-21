import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import Card from '../../components/ui/Card';
import { isAdmin } from '../../utils/admin';

const INSTAGRAM_URL = 'https://www.instagram.com/sanket.naik02/';
const EMAIL_ADDRESS = 'sanketnaik393@gmail.com';

const menuItems = [
  { id: 'edit', label: 'Edit Profile', icon: '✏️', color: 'bg-blue-50' },
  { id: 'help', label: 'App Guide', icon: '📖', color: 'bg-primary-50' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleMenu = (id) => {
    if (id === 'edit') navigate('/profile/edit');
    if (id === 'help') navigate('/guide');
  };

  return (
    <AppLayout userName={user?.displayName || 'User'} userAvatar={user?.photoURL}>
      <div className="pt-1">
        <div className="flex flex-col items-center py-6">
          <Avatar src={user?.photoURL} name={user?.displayName} size="xl" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3">{user?.displayName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">{user?.email}</p>
          {user?.splitmateId && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-300">SplitMate ID:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{user.splitmateId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.splitmateId);
                  setCopied(true);
                  showToast('SplitMate ID copied!', 'success');
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  copied
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
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

        {isAdmin(user?.email) && (
          <div className="mt-6">
            <Card padding="p-4" elevated>
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-base flex-shrink-0">👑</div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Founder Tools</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">View analytics and manage SplitMate</p>
                </div>
                <svg className="text-gray-300 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </Card>
          </div>
        )}

        <div className="mt-6">
          <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-1">Contact Us</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Have questions, suggestions, feature requests or found a bug?
              <br />
              Feel free to reach out.
            </p>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-base flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Instagram</p>
                <p className="text-xs text-gray-500 dark:text-gray-300 truncate">sanket.naik02</p>
              </div>
              <svg className="text-gray-300 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <a
              href={`mailto:${EMAIL_ADDRESS}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white text-base flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{EMAIL_ADDRESS}</p>
              </div>
              <svg className="text-gray-300 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full mt-4 py-3 bg-white dark:bg-gray-50 rounded-xl shadow-sm flex items-center justify-center gap-2 text-gray-700 dark:text-gray-200 font-medium active:scale-[0.99] transition-transform"
        >
          <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
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

        <div className="mt-8 text-center">
          <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This application was designed and developed by{' '}
              <span className="font-semibold text-gray-900">Mr. Sanket Naik</span>.
            </p>
            <div className="mt-2">
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wider">Founder & Developer</span>
              <p className="text-sm font-semibold text-gray-900">Mr. Sanket Naik</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-300 mt-4">SplitMate &copy; 2026. All Rights Reserved.</p>
        </div>
      </div>
    </AppLayout>
  );
}
