import { formatCurrency } from '../../utils/currency';
import { CATEGORIES } from '../../config/constants';

const categoryIcons = {};
CATEGORIES.forEach((c) => { categoryIcons[c.id] = c.icon; });

export default function ExpenseRow({ expense, onClick }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors cursor-pointer">
      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
        {categoryIcons[expense.category] || '📋'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
        <p className="text-xs text-gray-500 mt-0.5">Paid by {expense.paidByName}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
      </div>
    </div>
  );
}
