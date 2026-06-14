import Card from '../ui/Card';
import { formatCurrency } from '../../utils/currency';

export default function BalanceSummary({ totalExpenses, totalPaid, totalOwed, totalOwes, net }) {
  return (
    <Card padding="p-5" elevated>
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-4">Overall Balance</h2>

      <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">💰</div>
            <span className="text-sm text-gray-700 dark:text-gray-200">Total Expenses</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs">💳</div>
            <span className="text-sm text-gray-700 dark:text-gray-200">You Paid</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(totalPaid)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-200">You Receive</span>
              <p className="text-[10px] text-gray-500 dark:text-gray-300">Others owe you</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-green-600">+{formatCurrency(totalOwed)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-200">You Owe</span>
              <p className="text-[10px] text-gray-500 dark:text-gray-300">To other members</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-red-600">-{formatCurrency(totalOwes)}</span>
        </div>

        <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Net Balance</span>
            <span className={`text-lg font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-300 mt-0.5 text-right">
            {net >= 0
              ? `You are owed ${formatCurrency(net)} overall`
              : `You owe ${formatCurrency(Math.abs(net))} overall`}
          </p>
        </div>
      </div>
    </Card>
  );
}
