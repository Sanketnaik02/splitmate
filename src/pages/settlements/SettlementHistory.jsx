import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { getDisplayName } from '../../utils/displayName';

export default function SettlementHistory() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveGroup, activeGroup, members, settlements } = useGroup();

  React.useEffect(() => {
    setActiveGroup(groupId);
  }, [groupId, setActiveGroup]);

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(`/groups/${groupId}/settle`)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settlement History</h1>
        </div>

        {settlements.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📜</p>
            <p className="text-gray-600 dark:text-gray-300 font-medium">No settlements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...settlements].reverse().map((s) => {
              let fromName, toName;
              if (s.from_member_id !== undefined) {
                const fm = members.find(m => m.id === s.from_member_id);
                const tm = members.find(m => m.id === s.to_member_id);
                fromName = fm?.displayName || 'Unknown';
                toName = tm?.displayName || 'Unknown';
              } else {
                fromName = getDisplayName(s.fromUserId, members);
                toName = getDisplayName(s.toUserId, members);
              }
              return (
                <Card key={s.id} padding="p-4" className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {s.status === 'completed' ? '✅' : '⏳'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{fromName} → {toName}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                      {new Date(s.created_at || s.createdAt).toLocaleDateString()} · {s.note || 'Settlement'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(s.amount)}</p>
                    <Badge variant={s.status === 'completed' ? 'success' : 'warning'} size="sm">{s.status}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
