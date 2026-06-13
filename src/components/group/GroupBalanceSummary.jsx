import { formatCurrency } from '../../utils/currency';

export default function GroupBalanceSummary({ balances, members }) {
  const getName = (userId) => members.find((m) => m.userId === userId)?.displayName || userId;

  return (
    <div className="space-y-2">
      {Object.entries(balances).map(([userId, balance]) => {
        const member = members.find((m) => m.userId === userId);
        if (!member) return null;
        return (
          <div key={userId} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-gray-700">{member.displayName}</span>
            <span className={`text-sm font-semibold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
