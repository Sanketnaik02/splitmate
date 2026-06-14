import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import MemberList from '../../components/group/MemberList';
import ExpenseRow from '../../components/expense/ExpenseRow';
import GroupBalanceSummary from '../../components/group/GroupBalanceSummary';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useExpenseCalc from '../../hooks/useExpenseCalc';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../utils/storage';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../../components/ui/Toast';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { setActiveGroup, activeGroup, members, expenses, settlements, addMember, removeMember, deleteExpense } = useGroup();
  const { balances, suggestedPayments, getMemberName } = useExpenseCalc(members, expenses, settlements);
  const [tab, setTab] = useState('expenses');
  const [inviteName, setInviteName] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  React.useEffect(() => {
    setActiveGroup(groupId);
  }, [groupId, setActiveGroup]);

  const handleAddMember = () => {
    if (!inviteName.trim()) return;
    const name = inviteName.trim();
    const existing = members.find((m) => m.displayName.toLowerCase() === name.toLowerCase());
    if (existing) {
      showToast('Already a member', 'error');
      return;
    }
    const guestUser = store.add('users', {
      displayName: name,
      email: '',
      password: '',
      photoURL: null,
      phone: '',
      defaultCurrency: 'INR',
    });
    addMember(groupId, guestUser.id, guestUser.displayName);
    showToast(`${name} added to group`, 'success');
    setInviteName('');
    setShowInvite(false);
  };

  const handleRemoveMember = (userId) => {
    if (userId === user?.id) {
      showToast('You cannot remove yourself', 'error');
      return;
    }
    const member = members.find((m) => m.userId === userId);
    if (!member) return;
    const memberExpenses = expenses.filter((e) => {
      if (e.paidBy === userId) return true;
      if (e.splitDetails && userId in e.splitDetails) return true;
      return false;
    });
    if (memberExpenses.length > 0) {
      setRemovingMember({ userId, displayName: member.displayName, expenseCount: memberExpenses.length });
    } else {
      removeMember(groupId, userId);
      showToast(`${member.displayName} removed from group`, 'success');
    }
  };

  const confirmRemoveMember = () => {
    if (!removingMember) return;
    removeMember(groupId, removingMember.userId);
    showToast(`${removingMember.displayName} removed from group`, 'success');
    setRemovingMember(null);
  };

  const handleDeleteExpense = (expenseId) => {
    deleteExpense(expenseId);
    showToast('Expense deleted', 'success');
  };

  if (!activeGroup) {
    return (
      <AppLayout userName={user?.displayName || 'User'}>
        <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-600 dark:text-gray-300 font-medium">Group not found</p></div>
      </AppLayout>
    );
  }

  const isAdmin = members.find((m) => m.userId === user?.id)?.role === 'admin';

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/groups')} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{activeGroup.name}</h1>
            <p className="text-xs text-gray-600 dark:text-gray-300">{members.length} members · {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))} total</p>
          </div>
        </div>

        <Card padding="p-0" className="mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Members</p>
            <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:bg-primary-800 active:scale-95 transition-all shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Member
            </button>
          </div>
          <MemberList members={members} onRemoveMember={isAdmin ? handleRemoveMember : undefined} />
          {showInvite && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-2">
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Enter member name"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-100 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-primary-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <Button size="sm" onClick={handleAddMember}>Add</Button>
            </div>
          )}
        </Card>

        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'expenses', label: 'Expenses' },
            { id: 'balances', label: 'Balances' },
            { id: 'settle', label: 'Settle Up' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'settle') { navigate(`/groups/${groupId}/settle`); return; }
                setTab(t.id);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-primary-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'expenses' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            {expenses.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">💸</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">No expenses yet</p>
                <Button size="sm" className="mt-3" onClick={() => navigate(`/expenses/new?group=${groupId}`)}>Add Expense</Button>
              </div>
            ) : (
              <>
                {expenses.map((exp) => (
                  <div key={exp.id} className="relative group">
                    <ExpenseRow
                      expense={{
                        ...exp,
                        paidByName: getMemberName(exp.paidBy) || store.get('users', exp.paidBy)?.displayName || exp.paidBy,
                      }}
                      onClick={() => navigate(`/expenses/${exp.id}`)}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteExpense(exp.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="p-3">
                  <Button size="sm" variant="secondary" fullWidth onClick={() => navigate(`/expenses/new?group=${groupId}`)}>
                    + Add Expense
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'balances' && (
          <Card padding="p-0" className="overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Who owes what</p>
            </div>
            <GroupBalanceSummary balances={balances} members={members} />
            {suggestedPayments.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Suggested Payments</p>
                <div className="space-y-1.5">
                  {suggestedPayments.map((p, i) => (
                    <p key={i} className="text-sm text-gray-700 dark:text-gray-200">
                      <span className="font-medium">{getMemberName(p.from)}</span> → <span className="font-medium">{getMemberName(p.to)}</span> {formatCurrency(p.amount)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!removingMember}
        onClose={() => setRemovingMember(null)}
        title={`Remove ${removingMember?.displayName || ''}?`}
        message={removingMember?.expenseCount > 0
          ? `${removingMember.displayName} is involved in ${removingMember.expenseCount} expense(s). Removing them will not delete these expenses but they will no longer be part of the group.`
          : `Remove ${removingMember?.displayName} from this group?`
        }
        confirmLabel="Remove"
        onConfirm={confirmRemoveMember}
        variant="danger"
      />
    </AppLayout>
  );
}
