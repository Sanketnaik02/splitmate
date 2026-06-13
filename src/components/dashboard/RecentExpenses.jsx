import { CATEGORIES } from '../../config/constants';
import { formatCurrency } from '../../utils/currency';

const expenseIcons = {
  owed: { bg: 'bg-green-100', icon: '⬇️', label: 'owed' },
  owe: { bg: 'bg-red-100', icon: '⬆️', label: 'owe' },
  settlement: { bg: 'bg-blue-100', icon: '✅', label: 'settled' },
};

function getCategoryIcon(categoryId) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.icon : '📋';
}

export default function RecentExpenses({ expenses = [] }) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <p className="text-3xl mb-2">📭</p>
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Activity</h2>
      <div className="divide-y divide-gray-100 bg-white rounded-2xl shadow-sm">
        {expenses.map((expense) => {
          const typeInfo = expenseIcons[expense.type] || expenseIcons.owed;
          return (
            <div key={expense.id} className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
              <div className={`w-9 h-9 rounded-xl ${typeInfo.bg} flex items-center justify-center text-sm flex-shrink-0`}>
                {expense.type === 'settlement' ? '✅' : getCategoryIcon(expense.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {expense.type === 'settlement'
                    ? `Settled · ${expense.groupName}`
                    : `${expense.paidByName} · ${expense.groupName}`
                  }
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold ${expense.type === 'owe' ? 'text-red-600' : expense.type === 'settlement' ? 'text-blue-600' : 'text-green-600'}`}>
                  {expense.type === 'owe' ? '-' : '+'}{formatCurrency(expense.amount)}
                </p>
                {expense.userShare && (
                  <p className="text-[11px] text-gray-400">Your share: {formatCurrency(expense.userShare)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
