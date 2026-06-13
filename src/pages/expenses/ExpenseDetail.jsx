import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../utils/storage';
import { formatCurrency } from '../../utils/currency';

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const expense = store.get('expenses', id);

  if (!expense) {
    return (
      <AppLayout userName={user?.displayName || 'User'}>
        <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-500">Expense not found</p></div>
      </AppLayout>
    );
  }

  const payer = store.get('users', expense.paidBy);
  const group = store.get('groups', expense.groupId);

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Expense Details</h1>
        </div>

        <Card padding="p-5" className="text-center mb-4">
          <p className="text-4xl mb-2">💸</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
          <p className="text-lg font-medium text-gray-700 mt-1">{expense.description}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="primary">{expense.category}</Badge>
            <Badge variant="default">{expense.splitType}</Badge>
          </div>
        </Card>

        <Card padding="p-4" className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Paid by</span>
              <span className="font-medium">{payer?.displayName || expense.paidBy}</span>
            </div>
            {group && (
              <div className="flex justify-between">
                <span className="text-gray-500">Group</span>
                <span className="font-medium">{group.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{new Date(expense.date || expense.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {expense.splitDetails && Object.keys(expense.splitDetails).length > 0 && (
          <Card padding="p-4" className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Split Details</p>
            <div className="space-y-2">
              {Object.entries(expense.splitDetails).map(([uid, share]) => {
                const u = store.get('users', uid);
                return (
                  <div key={uid} className="flex justify-between text-sm">
                    <span className="text-gray-700">{uid === user?.id ? 'You' : u?.displayName || uid}</span>
                    <span className="font-medium">{formatCurrency(share)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Button variant="secondary" fullWidth onClick={() => navigate(`/expenses/${id}/edit`)}>Edit Expense</Button>
      </div>
    </AppLayout>
  );
}
