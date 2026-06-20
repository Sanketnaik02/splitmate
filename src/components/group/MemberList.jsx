import Avatar from '../ui/Avatar';
import { formatCurrency } from '../../utils/currency';

export default function MemberList({ members, onRemoveMember }) {
  return (
    <div className="divide-y divide-gray-50 dark:divide-gray-700">
      {members.map((member) => {
        const balance = member.balance || 0;
        const isRegistered = member.isRegistered === true;
        return (
          <div key={member.userId} className="flex items-center gap-3 px-4 py-2.5 group">
            <Avatar name={member.displayName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.displayName}</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  isRegistered
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                }`}>
                  {isRegistered ? 'Registered' : 'Guest'}
                </span>
              </div>
            </div>
            {balance !== 0 && (
              <span className={`text-sm font-semibold ${balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance > 0 ? '+' : ''}{formatCurrency(balance)}
              </span>
            )}
            {onRemoveMember && (
              <button
                onClick={() => onRemoveMember(member.userId)}
                className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
