import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { formatCurrency } from '../../utils/currency';

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, expenses } = useGroup();
  const expense = expenses.find(e => e.id === id || e.group_id === id);

  if (!expense) {
    return (
      <AppLayout userName={user?.displayName || 'User'}>
        <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-600 dark:text-gray-300">Expense not found</p></div>
      </AppLayout>
    );
  }

  const group = groups.find((g) => g.id === expense.group_id || g.id === expense.groupId) || null;
  const groupMembers = group ? (group.members || []) : [];

  let paidByMember = groupMembers.find(m => m.id === expense.paid_by_member_id);
  if (!paidByMember && expense.paidBy) {
    paidByMember = groupMembers.find(m => m.userId === expense.paidBy);
  }

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">Expense Details</h1>
          <button onClick={() => navigate(`/expenses/${id}/edit`)} className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 active:scale-90 transition-all" title="Edit Expense">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>

        <Card padding="p-5" className="text-center mb-4">
          <p className="text-4xl mb-2">💸</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(expense.amount)}</p>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mt-1">{expense.description}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="primary">{expense.category}</Badge>
            <Badge variant="default">{expense.split_type || expense.splitType}</Badge>
          </div>
        </Card>

        <Card padding="p-4" className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Paid by</span>
              <span className="font-medium">{paidByMember?.displayName || 'Unknown'}</span>
            </div>
            {group && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Group</span>
                <span className="font-medium">{group.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Date</span>
              <span className="font-medium">{new Date(expense.date || expense.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {expense.splits && expense.splits.length > 0 && (
          <Card padding="p-4" className="mb-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Split Details</p>
            <div className="space-y-2">
              {expense.splits.map((s) => {
                const splitMember = groupMembers.find(m => m.id === s.member_id);
                const isYou = splitMember?.userId === user?.id;
                return (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200">{isYou ? 'You' : (splitMember?.displayName || 'Unknown')}</span>
                    <span className="font-medium">{formatCurrency(s.share_amount)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {expense.splitDetails && Object.keys(expense.splitDetails).length > 0 && (
          <Card padding="p-4" className="mb-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">Split Details</p>
            <div className="space-y-2">
              {Object.entries(expense.splitDetails).map(([uid, share]) => {
                const splitMember = groupMembers.find(m => m.userId === uid);
                const isYou = uid === user?.id;
                return (
                  <div key={uid} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200">{isYou ? 'You' : (splitMember?.displayName || 'Unknown')}</span>
                    <span className="font-medium">{formatCurrency(share)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
