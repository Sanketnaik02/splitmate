import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import useExpenseCalc from '../../hooks/useExpenseCalc';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../utils/storage';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../../components/ui/Toast';

export default function SettleUp() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { setActiveGroup, activeGroup, members, expenses, settlements, addSettlement, updateSettlement } = useGroup();
  const { balances, suggestedPayments } = useExpenseCalc(members, expenses, settlements);
  const [recording, setRecording] = React.useState(null);

  React.useEffect(() => {
    setActiveGroup(groupId);
  }, [groupId, setActiveGroup]);

  const getUser = (uid) => store.get('users', uid) || { displayName: uid };

  const handleSettle = (fromId, toId, amount) => {
    const existing = settlements.find(
      (s) => s.fromUserId === fromId && s.toUserId === toId && s.status === 'pending'
    );
    if (existing) {
      updateSettlement(existing.id, { status: 'completed', settledAt: new Date().toISOString() });
    } else {
      addSettlement(groupId, {
        fromUserId: fromId,
        toUserId: toId,
        amount,
        note: 'Manual settlement',
        status: 'completed',
        settledAt: new Date().toISOString(),
      });
    }
    const from = getUser(fromId);
    const to = getUser(toId);
    showToast(`Settlement of ${formatCurrency(amount)} from ${from.displayName} to ${to.displayName} recorded!`, 'success');
  };

  if (!activeGroup) {
    return (
      <AppLayout userName={user?.displayName || 'User'}>
        <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-600 dark:text-gray-300">Group not found</p></div>
      </AppLayout>
    );
  }

  const userBalance = balances[user?.id] || 0;
  const youAreOwed = suggestedPayments.filter((p) => p.to === user?.id);
  const youOwe = suggestedPayments.filter((p) => p.from === user?.id);

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(`/groups/${groupId}`)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settle Up</h1>
            <p className="text-xs text-gray-600 dark:text-gray-300">{activeGroup.name}</p>
          </div>
        </div>

        <Card padding="p-5" className="mb-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Your balance in this group</p>
          <p className={`text-3xl font-bold ${userBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {userBalance >= 0 ? '+' : ''}{formatCurrency(userBalance)}
          </p>
        </Card>

        {suggestedPayments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-600 dark:text-gray-300 font-medium">All settled up!</p>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">No pending payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {youOwe.length > 0 && (
              <Card padding="p-4">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">You owe</p>
                <div className="space-y-2">
                  {youOwe.map((p, i) => {
                    const toUser = getUser(p.to);
                    return (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={toUser.displayName} size="sm" />
                          <span className="text-sm font-medium">{toUser.displayName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-red-600">{formatCurrency(p.amount)}</span>
                          <Button size="sm" onClick={() => handleSettle(p.from, p.to, p.amount)}>Pay</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {youAreOwed.length > 0 && (
              <Card padding="p-4">
                <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-3">You are owed</p>
                <div className="space-y-2">
                  {youAreOwed.map((p, i) => {
                    const fromUser = getUser(p.from);
                    return (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={fromUser.displayName} size="sm" />
                          <span className="text-sm font-medium">{fromUser.displayName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</span>
                          <Button size="sm" variant="secondary" onClick={() => handleSettle(p.from, p.to, p.amount)}>Record</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {suggestedPayments.length > 0 && (
              <Card padding="p-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3">All suggested payments</p>
                <div className="space-y-2">
                  {suggestedPayments.map((p, i) => {
                    const from = getUser(p.from);
                    const to = getUser(p.to);
                    return (
                      <div key={i} className="flex items-center justify-between py-2 text-sm">
                        <span>{from.displayName} → {to.displayName}</span>
                        <span className="font-semibold">{formatCurrency(p.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {settlements.filter((s) => s.status === 'completed').length > 0 && (
          <button
            onClick={() => navigate(`/groups/${groupId}/settlements`)}
            className="w-full mt-4 py-3 text-sm text-primary-600 font-medium text-center"
          >
            View Settlement History →
          </button>
        )}
      </div>
    </AppLayout>
  );
}
