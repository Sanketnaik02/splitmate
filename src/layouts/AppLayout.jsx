import TopNav from '../components/navigation/TopNav';
import BottomNav from '../components/navigation/BottomNav';

export default function AppLayout({ children, userName, userAvatar, onAvatarClick, onSettingsClick }) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopNav
        userName={userName}
        userAvatar={userAvatar}
        onAvatarClick={onAvatarClick}
        onSettingsClick={onSettingsClick}
      />
      <main className="max-w-lg mx-auto pb-24 px-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
