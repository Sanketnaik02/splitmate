export const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍕', color: 'text-orange-500' },
  { id: 'transport', label: 'Transport', icon: '🚕', color: 'text-blue-500' },
  { id: 'utilities', label: 'Utilities', icon: '💡', color: 'text-yellow-500' },
  { id: 'rent', label: 'Rent', icon: '🏠', color: 'text-purple-500' },
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: 'text-green-500' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'text-pink-500' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: 'text-indigo-500' },
  { id: 'health', label: 'Health', icon: '💊', color: 'text-red-500' },
  { id: 'travel', label: 'Travel', icon: '✈️', color: 'text-cyan-500' },
  { id: 'other', label: 'Other', icon: '📋', color: 'text-gray-500' },
];

export const SPLIT_TYPES = {
  EQUAL: 'equal',
  PERCENTAGE: 'percentage',
  EXACT: 'exact',
  SHARES: 'shares',
};

export const GROUP_CATEGORIES = [
  { id: 'trip', label: 'Trip', icon: '✈️' },
  { id: 'roommates', label: 'Roommates', icon: '🏠' },
  { id: 'couple', label: 'Couple', icon: '💑' },
  { id: 'food', label: 'Food & Club', icon: '🍕' },
  { id: 'other', label: 'Other', icon: '📋' },
];

export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/dashboard', icon: 'home' },
  { id: 'groups', label: 'Groups', path: '/groups', icon: 'group' },
  { id: 'subscription', label: 'Plans', path: '/subscription', icon: 'activity' },
  { id: 'profile', label: 'Profile', path: '/profile', icon: 'person' },
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    maxGroups: 5,
    features: [
      'Create up to 5 groups',
      'Add unlimited members',
      'Track expenses',
      'Equal split',
      'Settle up',
      'Dark mode',
    ],
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 20,
    maxGroups: 10,
    features: [
      'Everything in Free, plus:',
      'Additional 5 groups (total 10)',
      'Percentage split',
      'Exact/Custom split',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 100,
    maxGroups: 30,
    features: [
      'Everything in Starter, plus:',
      'Up to 30 groups',
      'Expense reports',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 150,
    maxGroups: 50,
    features: [
      'Everything in Pro, plus:',
      'Up to 50 groups',
      'Multi-currency support',
      'Data export',
      'Admin controls',
    ],
    popular: false,
  },
];
