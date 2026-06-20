import { formatCurrency } from '../../utils/currency';
import { getDisplayName } from '../../utils/displayName';

export default function GroupBalanceSummary({ balances, members }) {
  return (
    <div className="space-y-2">
      {Object.entries(balances).map(([userId, balance]) => {
        if (balance === 0) return null;
        return (
          <div key={userId} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-gray-700 dark:text-gray-200">{getDisplayName(userId, members)}</span>
            <span className={`text-sm font-semibold ${balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
