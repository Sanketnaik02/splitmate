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
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { computeUserOverallBalance } from '../../utils/calculators';
import { groupService } from '../../lib/groupService';

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
      <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
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
  const [showNoGroupModal, setShowNoGroupModal] = React.useState(false);

  const handleAddExpense = () => {
    if (groups.length === 0) {
      setShowNoGroupModal(true);
    } else {
      navigate('/expenses/new');
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const { plan, createdGroupCount, remainingGroups } = useSubscription();
  const [allExpenses, setAllExpenses] = React.useState([]);
  const [allSettlements, setAllSettlements] = React.useState([]);

  React.useEffect(() => {
    if (!user || !groups.length) { setAllExpenses([]); setAllSettlements([]); return; }
    let cancelled = false;
    (async () => {
      const expenseResults = [];
      const settlementResults = [];
      for (const g of groups) {
        try {
          const exps = await groupService.getGroupExpenses(g.id);
          expenseResults.push(...exps);
        } catch { /* fall back to localStorage */ }
        try {
          const setts = await groupService.getGroupSettlements(g.id);
          settlementResults.push(...setts);
        } catch { /* fall back to localStorage */ }
      }
      if (!expenseResults.length) {
        try {
          const local = JSON.parse(localStorage.getItem('splitmate_expenses') || '[]');
          expenseResults.push(...local);
        } catch { /* ignore */ }
      }
      if (!settlementResults.length) {
        try {
          const local = JSON.parse(localStorage.getItem('splitmate_settlements') || '[]');
          settlementResults.push(...local);
        } catch { /* ignore */ }
      }
      if (!cancelled) {
        setAllExpenses(expenseResults);
        setAllSettlements(settlementResults);
      }
    })();
    return () => { cancelled = true; };
  }, [user, groups]);

  const balance = React.useMemo(() => {
    try {
      if (!user) return { totalOwed: 0, totalOwes: 0, net: 0, totalExpenses: 0, totalPaid: 0 };
      const enriched = groups.map((g) => ({
        ...g,
        members: g.members || [],
      }));
      return computeUserOverallBalance(user.id, enriched, allExpenses, allSettlements);
    } catch (err) {
      console.error('[Dashboard] balance compute error:', err);
      return { totalOwed: 0, totalOwes: 0, net: 0, totalExpenses: 0, totalPaid: 0 };
    }
  }, [user, groups, allExpenses, allSettlements]);

  const recentActivity = React.useMemo(() => {
    try {
      if (!user) return [];
      const gIds = groups.map((g) => g.id);
      const items = [];

      allExpenses
        .filter((e) => (e.group_id || e.groupId) && gIds.includes(e.group_id || e.groupId))
        .forEach((e) => {
          const group = groups.find((g) => g.id === (e.group_id || e.groupId));
          const members = group?.members || [];
          let share = 0;
          let isPaidByUser = false;
          let payerName = 'Unknown';

          if (e.paid_by_member_id !== undefined) {
            const myMember = members.find(m => m.userId === user.id);
            const mySplit = (e.splits || []).find(s => s.member_id === myMember?.id);
            share = mySplit?.share_amount || 0;
            isPaidByUser = e.paid_by_member_id === myMember?.id;
            const payerMember = members.find(m => m.id === e.paid_by_member_id);
            payerName = payerMember?.displayName || 'Unknown';
          } else {
            share = e.splitDetails?.[user.id] || 0;
            isPaidByUser = e.paidBy === user.id;
            payerName = members.find(m => m.userId === e.paidBy)?.displayName
              || JSON.parse(localStorage.getItem('splitmate_users') || '{}')[e.paidBy]?.displayName
              || 'Unknown';
          }

          items.push({
            id: e.id,
            description: e.description,
            category: e.category,
            amount: share,
            paidBy: e.paid_by_member_id || e.paidBy,
            paidByName: payerName,
            groupName: group?.name || '',
            userShare: share,
            type: isPaidByUser ? 'owed' : 'owe',
            date: new Date(e.date || e.created_at || e.createdAt),
          });
        });

      allSettlements
        .filter((s) => {
          const gid = s.group_id || s.groupId;
          if (!gIds.includes(gid)) return false;
          const group = groups.find(g => g.id === gid);
          const groupMembers = group?.members || [];
          if (s.from_member_id !== undefined) {
            return groupMembers.some(m => m.id === s.from_member_id) || groupMembers.some(m => m.id === s.to_member_id);
          }
          return s.fromUserId === user.id || s.toUserId === user.id;
        })
        .forEach((s) => {
          const group = groups.find((g) => g.id === (s.group_id || s.groupId));
          const groupMembers = group?.members || [];
          let settledName = 'Unknown';
          if (s.from_member_id !== undefined) {
            const fm = groupMembers.find(m => m.id === s.from_member_id);
            settledName = fm?.displayName || 'Unknown';
          } else {
            settledName = groupMembers.find(m => String(m.userId) === String(s.fromUserId))?.displayName
              || JSON.parse(localStorage.getItem('splitmate_users') || '{}')[s.fromUserId]?.displayName
              || 'Unknown';
          }
          items.push({
            id: s.id,
            description: `Settled with ${settledName}`,
            amount: s.amount,
            paidBy: s.from_member_id || s.fromUserId,
            paidByName: settledName,
            groupName: group?.name || '',
            type: 'settlement',
            date: new Date(s.created_at || s.createdAt || s.settled_at),
          });
        });

      items.sort((a, b) => b.date - a.date);
      return items.slice(0, 10);
    } catch (err) {
      console.error('[Dashboard] recentActivity error:', err);
      return [];
    }
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
                <div key={i} className="min-w-[200px] bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse mb-3" />
                  <div className="w-28 h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
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
            <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Subscription</h2>
            <Badge variant={plan.id === 'free' ? 'default' : 'primary'} size="sm">{plan.name}</Badge>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700 dark:text-gray-200">Groups Created</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.maxGroups === -1
                ? `${createdGroupCount} / Unlimited`
                : `${createdGroupCount} / ${plan.maxGroups}`}
            </span>
          </div>
          {plan.maxGroups > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className="bg-primary-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (createdGroupCount / plan.maxGroups) * 100)}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-300">
              {plan.maxGroups === -1
                ? 'Unlimited'
                : remainingGroups > 0
                  ? `${remainingGroups} remaining`
                  : 'No groups left'}
            </span>
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
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Your Groups</h2>
              <button onClick={() => navigate('/groups')} className="text-xs font-medium text-primary-600 dark:text-primary-500">See All</button>
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
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <p className="text-4xl mb-2">👋</p>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Welcome to SplitMate!</p>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Create your first group to get started</p>
            <button
              onClick={() => navigate('/groups/new')}
              className="mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium shadow-sm"
            >
              Create Group
            </button>
          </div>
        )}

        {recentActivity.length > 0 && <RecentExpenses expenses={recentActivity} />}

        <div className="h-8" />
      </div>

      <QuickActions
        onAddExpense={handleAddExpense}
        onCreateGroup={() => navigate('/groups/new')}
        onSettleUp={groups.length > 0 ? () => navigate(`/groups/${groups[0].id}/settle`) : undefined}
      />

      <Modal
        isOpen={showNoGroupModal}
        onClose={() => setShowNoGroupModal(false)}
        title="Create Your First Group"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNoGroupModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowNoGroupModal(false); navigate('/groups/new'); }}>Create Group</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          Expenses can only be added inside a group. Please create or join a group first.
        </p>
      </Modal>
    </AppLayout>
  );
}
