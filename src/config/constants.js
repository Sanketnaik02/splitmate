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
    icon: '🎁',
    price: 0,
    priceLabel: 'Free',
    maxGroups: 2,
    maxGroupsLabel: '2 groups',
    features: [
      'Create up to 2 groups',
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
    icon: '🚀',
    price: 49,
    priceLabel: '₹49 lifetime',
    maxGroups: 10,
    maxGroupsLabel: '10 groups',
    features: [
      'Everything in Free, plus:',
      'Create up to 10 groups',
    ],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: '👑',
    price: 149,
    priceLabel: '₹149 lifetime',
    maxGroups: -1,
    maxGroupsLabel: 'Unlimited groups',
    features: [
      'Everything in Starter, plus:',
      'Unlimited groups',
    ],
    popular: true,
  },
];
