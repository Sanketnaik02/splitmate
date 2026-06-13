import Avatar from '../ui/Avatar';
import { formatCurrency } from '../../utils/currency';

export default function MemberList({ members, onRemoveMember }) {
  return (
    <div className="divide-y divide-gray-50">
      {members.map((member) => (
        <div key={member.userId} className="flex items-center gap-3 px-4 py-2.5 group">
          <Avatar name={member.displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{member.displayName}</p>
            {member.role === 'admin' && <span className="text-[10px] text-gray-400 font-medium">Admin</span>}
          </div>
          <span className={`text-sm font-semibold ${(member.balance || 0) > 0 ? 'text-green-600' : (member.balance || 0) < 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {(member.balance || 0) > 0 ? '+' : ''}{formatCurrency(member.balance || 0)}
          </span>
          {onRemoveMember && member.role !== 'admin' && (
            <button
              onClick={() => onRemoveMember(member.userId)}
              className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              title="Remove"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
