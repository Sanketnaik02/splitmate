import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import BalanceSummary from '../../components/dashboard/BalanceSummary';
import RecentExpenses from '../../components/dashboard/RecentExpenses';
import QuickActions from '../../components/dashboard/QuickActions';
import GroupCard from '../../components/group/GroupCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { computeUserOverallBalance } from '../../utils/calculators';
import { store } from '../../utils/storage';

function BalanceSkeleton() {
  return (
    <Card padding="p-5">
      <div className="w-28 h-4 bg-gray-200 rounded animate-pulse mb-4" />
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
      <div className="pt-3 mt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups } = useGroup();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const { plan, groupCount, remaining } = useSubscription();
  const allExpenses = store.getAll('expenses');
  const allSettlements = store.getAll('settlements');

  const balance = React.useMemo(() => {
    if (!user) return { totalOwed: 0, totalOwes: 0, net: 0, totalExpenses: 0, totalPaid: 0 };
    const enriched = groups.map((g) => ({
      ...g,
      members: store.where('members', 'groupId', g.id),
    }));
    return computeUserOverallBalance(user.id, enriched, allExpenses, allSettlements);
  }, [user, groups, allExpenses, allSettlements]);

  const recentActivity = React.useMemo(() => {
    if (!user) return [];
    const gIds = groups.map((g) => g.id);
    const items = [];

    allExpenses
      .filter((e) => gIds.includes(e.groupId))
      .forEach((e) => {
        const group = groups.find((g) => g.id === e.groupId);
        const payer = store.get('users', e.paidBy);
        const share = e.splitDetails?.[user.id] || 0;
        items.push({
          id: e.id,
          description: e.description,
          category: e.category,
          amount: share,
          paidBy: e.paidBy,
          paidByName: payer?.displayName || e.paidBy,
          groupName: group?.name || '',
          userShare: share,
          type: e.paidBy === user.id ? 'owed' : 'owe',
          date: new Date(e.date || e.createdAt),
        });
      });

    allSettlements
      .filter((s) => gIds.includes(s.groupId) && (s.fromUserId === user.id || s.toUserId === user.id))
      .forEach((s) => {
        const group = groups.find((g) => g.id === s.groupId);
        const fromUser = store.get('users', s.fromUserId);
        items.push({
          id: s.id,
          description: `Settled with ${fromUser?.displayName || s.fromUserId}`,
          amount: s.amount,
          paidBy: s.fromUserId,
          paidByName: fromUser?.displayName || s.fromUserId,
          groupName: group?.name || '',
          type: 'settlement',
          date: new Date(s.createdAt),
        });
      });

    items.sort((a, b) => b.date - a.date);
    return items.slice(0, 10);
  }, [user, groups, allExpenses, allSettlements]);

  if (loading || !user) {
    return (
      <AppLayout userName={user?.displayName || 'Loading...'}>
        <div className="space-y-5 pt-1">
          <BalanceSkeleton />
          <div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[200px] bg-white dark:bg-gray-50 rounded-2xl p-4 shadow-sm flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse mb-3" />
                  <div className="w-28 h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="bg-white dark:bg-gray-50 rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="w-14 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      userName={user.displayName}
      userAvatar={user.photoURL}
      onSettingsClick={() => navigate('/profile')}
      onAvatarClick={() => navigate('/profile')}
    >
      <div className="space-y-5 pt-1">
        <Card padding="p-4" elevated>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscription</h2>
            <Badge variant={plan.id === 'free' ? 'default' : 'primary'} size="sm">{plan.name}</Badge>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Groups Used</span>
            <span className="text-sm font-semibold text-gray-900">{groupCount} / {plan.maxGroups}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (groupCount / plan.maxGroups) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{remaining > 0 ? `${remaining} remaining` : 'No groups left'}</span>
            {plan.id === 'free' && (
              <Button size="sm" variant="ghost" onClick={() => navigate('/subscription')}>Upgrade</Button>
            )}
          </div>
        </Card>

        <BalanceSummary
          totalExpenses={balance.totalExpenses}
          totalPaid={balance.totalPaid}
          totalOwed={balance.totalOwed}
          totalOwes={balance.totalOwes}
          net={balance.net}
        />

        {groups.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Groups</h2>
              <button onClick={() => navigate('/groups')} className="text-xs font-medium text-primary-600">See All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  name={group.name}
                  memberCount={group.memberCount}
                  totalExpenses={group.totalExpenses}
                  balance={group.balance}
                  category={group.category}
                  onClick={() => navigate(`/groups/${group.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {groups.length === 0 && (
          <div className="text-center py-8 bg-white dark:bg-gray-50 rounded-2xl shadow-sm">
            <p className="text-4xl mb-2">👋</p>
            <p className="text-gray-500 font-medium">Welcome to SplitMate!</p>
            <p className="text-sm text-gray-400 mt-1">Create your first group to get started</p>
            <button
              onClick={() => navigate('/groups/new')}
              className="mt-4 px-5 py-2.5 bg-primary-600 text-white dark:text-gray-900 rounded-xl text-sm font-medium shadow-sm"
            >
              Create Group
            </button>
          </div>
        )}

        {recentActivity.length > 0 && <RecentExpenses expenses={recentActivity} />}

        <div className="h-8" />
      </div>

      <QuickActions
        onAddExpense={() => navigate('/expenses/new')}
        onCreateGroup={() => navigate('/groups/new')}
        onSettleUp={groups.length > 0 ? () => navigate(`/groups/${groups[0].id}/settle`) : undefined}
      />
    </AppLayout>
  );
}
