import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/currency';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';

const categoryIcons = { trip: '✈️', roommates: '🏠', couple: '💑', food: '🍕', other: '📋' };

export default function GroupList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups } = useGroup();

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Your Groups</h1>
          <button
            onClick={() => navigate('/groups/new')}
            className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 font-medium">No groups yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first group to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} onClick={() => navigate(`/groups/${group.id}`)} padding="p-4" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">
                  {categoryIcons[group.category] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{group.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{group.memberCount} members · {formatCurrency(group.totalExpenses)} total</p>
                </div>
                <Badge variant={group.balance > 0 ? 'success' : group.balance < 0 ? 'danger' : 'default'} size="sm">
                  {group.balance >= 0 ? '+' : ''}{formatCurrency(group.balance)}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
