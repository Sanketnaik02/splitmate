import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import { useAuth } from '../../context/AuthContext';

const sections = [
  {
    icon: '👋',
    title: 'What is SplitMate?',
    content: 'SplitMate is a simple app that helps you split expenses with friends, family, or roommates. No more mental math or awkward conversations about who owes what. Just add expenses, SplitMate calculates everything for you.',
  },
  {
    icon: '🚀',
    title: 'Getting Started',
    content: 'Sign up with your name and email, then log in. Your first dashboard will be empty — time to create a group!',
    steps: ['Tap "Create Group" on the Dashboard', 'Give your group a name (e.g. "Goa Trip 2025")', 'Pick a category', 'Tap "Create Group"'],
  },
  {
    icon: '👥',
    title: 'Groups & Members',
    content: 'A group is where you track shared expenses. You can have multiple groups — one for each trip, flat, or event.',
    steps: ['Open a group from the Dashboard or Groups page', 'Tap "Add Member" to add people by name', 'Each member can see all expenses in the group', 'The person who created the group is the Admin'],
  },
  {
    icon: '💸',
    title: 'Adding Expenses',
    content: 'Once your group has members, start adding expenses. Each expense needs a description, amount, category, who paid, and how to split it.',
    steps: ['Open a group → tap "+ Add Expense"', 'Enter the amount and description', 'Choose a category (Food, Transport, etc.)', 'Select who paid', 'Choose how to split: Equal or Shares', 'Tap "Add Expense"'],
  },
  {
    icon: '⚖️',
    title: 'Splitting Methods',
    content: 'Equal split divides the amount equally among selected members. Shares split lets you assign different shares (e.g. one person pays double).',
    items: [
      { label: 'Equal Split', desc: 'Everyone pays the same amount. Great for most situations.' },
      { label: 'Shares Split', desc: 'Each person gets a different share. Use when someone should pay more.' },
    ],
  },
  {
    icon: '📊',
    title: 'Balances',
    content: 'The Balances tab in each group shows who owes what. Green means someone is owed money, red means they owe money. The Dashboard shows your overall balance across all groups.',
  },
  {
    icon: '✅',
    title: 'Settle Up',
    content: 'When someone pays their share, record it in Settle Up. This clears the debt and updates everyone\'s balance.',
    steps: ['Open a group → tap "Settle Up"', 'Choose who is paying and who is receiving', 'Enter the amount', 'Tap "Add Settlement"'],
  },
  {
    icon: '🌙',
    title: 'Dark Mode',
    content: 'Prefer a darker screen? Go to Profile and toggle "Switch to Dark Mode". Your preference is saved and will be there even after you close the app.',
  },
  {
    icon: '💎',
    title: 'Subscription Plans',
    content: 'SplitMate is free for up to 5 groups. Need more? Check out the Plans page for Starter, Pro, or Business plans with higher group limits.',
    items: [
      { label: 'Free', desc: '5 groups, unlimited members, equal split, dark mode' },
      { label: 'Starter (₹20/mo)', desc: '10 groups, percentage & exact split' },
      { label: 'Pro (₹100/mo)', desc: '30 groups, expense reports, priority support' },
      { label: 'Business (₹150/mo)', desc: '50 groups, multi-currency, data export, admin controls' },
    ],
  },
  {
    icon: '💾',
    title: 'Your Data',
    content: 'All your data is stored locally on your device. Nothing is sent to any server. Your groups, members, and expenses stay with you. Clearing browser data will remove everything, so be careful!',
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

              {section.steps && (
                <ol className="space-y-1.5 ml-1">
                  {section.steps.map((step, j) => (
                    <li key={j} className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {section.items && (
                <div className="space-y-2 ml-1 mt-1">
                  {section.items.map((item, j) => (
                    <div key={j} className="text-sm">
                      <span className="font-semibold text-gray-700">{item.label}:</span>{' '}
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
