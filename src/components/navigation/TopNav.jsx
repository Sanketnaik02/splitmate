import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/admin';

export default function TopNav({ userName = 'Guest', userAvatar, onAvatarClick, onSettingsClick }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) { setPendingCount(0); return; }

    const fetchCount = async () => {
      const { count } = await supabase
        .from('group_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      setPendingCount(count || 0);
    };

    fetchCount();

    const channel = supabase
      .channel('topnav-invitations')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_invitations', filter: `receiver_id=eq.${user.id}` },
        fetchCount
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

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
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{greeting}</p>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white -mt-0.5">{userName}</h1>
              {isAdmin(user?.email) && (
                <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 -mt-0.5">
                  👑 Founder
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full bg-white dark:bg-gray-100 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-700 active:scale-95 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-md">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={onSettingsClick}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-100 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-700 active:scale-95 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
