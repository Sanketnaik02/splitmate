import React from 'react';
import BottomSheet from '../ui/BottomSheet';

const actions = [
  { id: 'expense', label: 'Add Expense', icon: '💰', color: 'bg-primary-500' },
  { id: 'group', label: 'Create Group', icon: '👥', color: 'bg-blue-500' },
  { id: 'settle', label: 'Settle Up', icon: '🤝', color: 'bg-purple-500' },
];

export default function QuickActions({ onAddExpense, onCreateGroup, onSettleUp }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAction = (id) => {
    setIsOpen(false);
    if (id === 'expense' && onAddExpense) onAddExpense();
    if (id === 'group' && onCreateGroup) onCreateGroup();
    if (id === 'settle' && onSettleUp) onSettleUp();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-5 z-30 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 flex items-center justify-center active:scale-90 transition-transform hover:bg-primary-700"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Quick Actions">
        <div className="space-y-2 pb-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center text-white text-lg`}>
                {action.icon}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{action.label}</span>
              <svg className="ml-auto text-gray-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
