import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import { useAuth } from '../../context/AuthContext';

const sections = [
  {
    icon: '👋',
    title: 'What is SplitMate?',
    content: 'SplitMate is a modern expense-splitting app that helps you track shared expenses with friends, family, or roommates. Add expenses, split them automatically, and settle up — all synced to the cloud. No more mental math or awkward conversations about who owes what.',
  },
  {
    icon: '🔐',
    title: 'Authentication',
    content: 'SplitMate offers multiple ways to sign in. Your session is persisted securely, so you stay logged in even after closing the browser.',
    items: [
      { label: 'Email Login', desc: 'Sign up or sign in with your email and password.' },
      { label: 'Google Login', desc: 'Use your Google account for one-click authentication.' },
      { label: 'Session Persistence', desc: 'Your session is remembered across browser sessions. No need to log in every time.' },
    ],
  },
  {
    icon: '👤',
    title: 'Profile System',
    content: 'Your profile is your identity in SplitMate. Manage your details and get a unique identifier.',
    items: [
      { label: 'Profile Management', desc: 'Update your display name, phone number, and profile photo from the Profile page.' },
      { label: 'SplitMate ID', desc: 'Every user gets a unique SplitMate ID (e.g. SM00024) automatically on signup. This ID is used internally for consistent identification.' },
    ],
  },
  {
    icon: '👥',
    title: 'Groups',
    content: 'Groups are the foundation of SplitMate. All expenses and settlements live inside a group.',
    items: [
      { label: 'Create Groups', desc: 'Create a group for any trip, flat, or event. Give it a name and category.' },
      { label: 'Join Groups', desc: 'Join existing groups created by others through invitations.' },
      { label: 'Invitations', desc: 'Send and receive group invitations. Accept or reject pending invites.' },
      { label: 'Group Member Management', desc: 'View all members in a group. See who has paid, who owes, and each person\'s balance.' },
    ],
  },
  {
    icon: '💸',
    title: 'Expenses',
    content: 'Once your group has members, start adding expenses. Each expense is automatically split and tracked.',
    items: [
      { label: 'Add Expenses', desc: 'Enter the amount, description, category, who paid, and how to split. Everyone\'s share is calculated instantly.' },
      { label: 'Expense Splitting', desc: 'Split equally among selected members or use shares for custom amounts.' },
      { label: 'Expense Tracking', desc: 'View all expenses in a group, who paid what, and each person\'s share.' },
    ],
  },
  {
    icon: '🤝',
    title: 'Settlements',
    content: 'When someone pays their share, record it as a settlement. This clears the debt and updates everyone\'s balance.',
    items: [
      { label: 'Settlement Recording', desc: 'Record payments between members to settle debts. Choose who is paying and who is receiving.' },
      { label: 'Balance Management', desc: 'Real-time balance tracking per group and overall. Green means someone owes you, red means you owe them.' },
    ],
  },
  {
    icon: '🔔',
    title: 'Notifications',
    content: 'Stay informed about activity in your groups with real-time notifications.',
    items: [
      { label: 'Real-Time Notifications', desc: 'Get notified instantly when expenses are added, updated, or settled.' },
      { label: 'Invitation Alerts', desc: 'Receive alerts when someone invites you to a group. Accept or decline directly from notifications.' },
    ],
  },
  {
    icon: '💎',
    title: 'Subscription Plans',
    content: 'SplitMate offers three lifetime plans. Choose the one that fits your needs. No monthly fees — pay once, use forever.',
    items: [
      { label: 'Free Plan', desc: 'Up to 2 groups. Includes all core features: expenses, splits, settlements, dark mode, cloud sync.' },
      { label: 'Starter Plan (₹49)', desc: 'Up to 10 groups. Everything in Free, plus higher group limits. Lifetime access.' },
      { label: 'Premium Plan (₹149)', desc: 'Unlimited groups. Everything in Starter, plus unlimited group creation. Lifetime access.' },
    ],
  },
  {
    icon: '🛡️',
    title: 'Admin Features',
    content: 'Founder-level tools for managing and monitoring the SplitMate platform.',
    items: [
      { label: 'Founder Dashboard', desc: 'Access analytics including user counts, group counts, expense volume, and subscription data.' },
      { label: 'Founder Tools', desc: 'Founder-only section in the Profile page with a direct link to the Admin Dashboard.' },
      { label: 'Protected Admin Access', desc: 'Admin routes are protected with access control. Only authorized accounts can access admin features.' },
    ],
  },
  {
    icon: '⚙️',
    title: 'System Features',
    content: 'SplitMate is backed by modern infrastructure and designed for reliability, performance, and scalability.',
    items: [
      { label: 'Supabase Cloud Sync', desc: 'All data is synchronized to Supabase PostgreSQL in real time. Your data is safe, backed up, and accessible across devices.' },
      { label: 'Dark Mode', desc: 'Full dark mode support across the entire app. Toggle from the Profile page. Your preference is saved.' },
      { label: 'Secure Authentication', desc: 'Authentication is handled by Supabase Auth with Row Level Security. Your data is private and secure.' },
      { label: 'Backend Driven Architecture', desc: 'All business logic runs on the backend — trigger functions, security definer functions, and RLS policies ensure data integrity.' },
      { label: 'Mobile App Ready Architecture', desc: 'Built with responsive design principles. The UI adapts to any screen size and is ready for mobile app packaging.' },
    ],
  },
];

export default function ApplicationGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Application Guide</h1>
        </div>

        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{section.icon}</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{section.title}</h2>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-2">{section.content}</p>

              {section.items && (
                <div className="space-y-2 ml-1 mt-1">
                  {section.items.map((item, j) => (
                    <div key={j} className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{item.label}:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-200">{item.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
